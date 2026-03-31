'use strict';

// =============================================================================
// dashboard-server.js — Zero-dependency Node.js HTTP server for intent-fluid
// trace dashboard. Uses ONLY built-in modules: http, fs, path, child_process.
// =============================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

// =============================================================================
// Section 1: CLI Argument Parsing
// =============================================================================

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { taskDir: null, skillDir: null, port: 9500 };
  let i = 0;
  while (i < args.length) {
    if (args[i] === '--skill-dir' && i + 1 < args.length) {
      result.skillDir = args[i + 1];
      i += 2;
    } else if (args[i] === '--port' && i + 1 < args.length) {
      result.port = parseInt(args[i + 1], 10);
      i += 2;
    } else if (!args[i].startsWith('--') && !result.taskDir) {
      result.taskDir = args[i];
      i += 1;
    } else {
      i += 1;
    }
  }
  if (!result.taskDir) {
    console.error('Usage: node dashboard-server.js <task_dir> [--skill-dir <path>] [--port <port>]');
    process.exit(1);
  }
  result.taskDir = path.resolve(result.taskDir);
  if (result.skillDir) result.skillDir = path.resolve(result.skillDir);
  return result;
}

const CONFIG = parseArgs(process.argv);
const TRACE_FILE = path.join(CONFIG.taskDir, 'trace.jsonl');
const STATE_FILE = path.join(CONFIG.taskDir, 'state.md');
const PID_FILE = path.join(CONFIG.taskDir, '.dashboard.pid');

// =============================================================================
// Section 2: State Management
// =============================================================================

let allEvents = [];
let currentState = {};
let sseClients = [];
let traceByteOffset = 0;
let partialLine = '';
let traceWatcher = null;
let stateWatcher = null;
let heartbeatInterval = null;
let server = null;
let workflowConfig = { steps: [], topology: 'linear', max_rounds: 1 };

// =============================================================================
// Section 3: SKILL.md Frontmatter Parser
// =============================================================================

function parseSkillFrontmatter(skillDir) {
  const skillPath = path.join(skillDir, 'SKILL.md');
  try {
    const content = fs.readFileSync(skillPath, 'utf8');
    const fmMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!fmMatch) return null;
    const yaml = fmMatch[1];
    const config = { steps: [], topology: 'linear', max_rounds: 1 };
    const traceBlock = extractYamlBlock(yaml, 'trace');
    if (!traceBlock) return config;
    const stepsMatch = traceBlock.match(/steps:\s*\n((?:\s+-\s+.*\n?)*)/);
    if (stepsMatch) {
      const stepsRaw = stepsMatch[1];
      const stepLines = stepsRaw.match(/^\s+-\s+(.+)$/gm);
      if (stepLines) {
        config.steps = stepLines.map(l => l.replace(/^\s+-\s+/, '').trim().replace(/^["']|["']$/g, ''));
      }
    }
    const topoMatch = traceBlock.match(/topology:\s*(.+)/);
    if (topoMatch) config.topology = topoMatch[1].trim().replace(/^["']|["']$/g, '');
    const roundsMatch = traceBlock.match(/max_rounds:\s*(\d+)/);
    if (roundsMatch) config.max_rounds = parseInt(roundsMatch[1], 10);
    return config;
  } catch (e) {
    return null;
  }
}

function extractYamlBlock(yaml, key) {
  const lines = yaml.split('\n');
  let inBlock = false;
  let blockLines = [];
  let blockIndent = -1;
  for (const line of lines) {
    if (!inBlock) {
      const m = line.match(new RegExp('^' + key + ':'));
      if (m) {
        inBlock = true;
        const rest = line.slice(m[0].length).trim();
        if (rest && rest !== '|' && rest !== '>') {
          blockLines.push(rest);
          return blockLines.join('\n');
        }
      }
    } else {
      const stripped = line.replace(/\t/g, '    ');
      const indent = stripped.search(/\S/);
      if (indent < 0) {
        blockLines.push('');
        continue;
      }
      if (blockIndent < 0) blockIndent = indent;
      if (indent < blockIndent) break;
      blockLines.push(line);
    }
  }
  return blockLines.length > 0 ? blockLines.join('\n') : null;
}

// =============================================================================
// Section 4: state.md Parser
// =============================================================================

function parseStateMd(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return parseStateMdContent(content);
  } catch (e) {
    return {};
  }
}

function parseStateMdContent(content) {
  const state = {};
  const lines = content.split('\n');
  for (const line of lines) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*):\s*(.*)/);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim();
    if (val === 'null' || val === '') {
      state[key] = null;
    } else if (val.startsWith('"') && val.endsWith('"')) {
      state[key] = val.slice(1, -1);
    } else if (val.startsWith("'") && val.endsWith("'")) {
      state[key] = val.slice(1, -1);
    } else if (val.startsWith('[')) {
      state[key] = val;
    } else {
      state[key] = val;
    }
  }
  return state;
}

// =============================================================================
// Section 5: Trace File Watcher (incremental byte-offset read)
// =============================================================================

function readNewTraceLines() {
  let fd;
  try {
    fd = fs.openSync(TRACE_FILE, 'r');
  } catch (e) {
    return [];
  }
  const stat = fs.fstatSync(fd);
  if (stat.size < traceByteOffset) {
    traceByteOffset = 0;
    partialLine = '';
  }
  if (stat.size === traceByteOffset) {
    fs.closeSync(fd);
    return [];
  }
  const bytesToRead = stat.size - traceByteOffset;
  const buf = Buffer.alloc(bytesToRead);
  fs.readSync(fd, buf, 0, bytesToRead, traceByteOffset);
  fs.closeSync(fd);
  traceByteOffset = stat.size;
  const text = partialLine + buf.toString('utf8');
  const lines = text.split('\n');
  if (text.endsWith('\n')) {
    partialLine = '';
  } else {
    partialLine = lines.pop();
  }
  const events = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      events.push(JSON.parse(trimmed));
    } catch (e) {
      // skip malformed lines
    }
  }
  return events;
}

let traceDebounceTimer = null;

function onTraceChange() {
  if (traceDebounceTimer) return;
  traceDebounceTimer = setTimeout(() => {
    traceDebounceTimer = null;
    const newEvents = readNewTraceLines();
    for (const ev of newEvents) {
      allEvents.push(ev);
      broadcastSSE('trace_event', ev);
    }
  }, 50);
}

function startTraceWatcher() {
  const initialEvents = readNewTraceLines();
  for (const ev of initialEvents) allEvents.push(ev);

  try {
    traceWatcher = fs.watch(TRACE_FILE, { persistent: false }, (eventType) => {
      if (eventType === 'change' || eventType === 'rename') onTraceChange();
    });
    traceWatcher.on('error', () => {});
  } catch (e) {
    // File doesn't exist yet — watch the directory for its creation
    const dir = path.dirname(TRACE_FILE);
    const base = path.basename(TRACE_FILE);
    try {
      traceWatcher = fs.watch(dir, { persistent: false }, (eventType, filename) => {
        if (filename === base) {
          traceWatcher.close();
          traceWatcher = null;
          onTraceChange();
          startTraceWatcher();
        }
      });
      traceWatcher.on('error', () => {});
    } catch (e2) {
      // directory doesn't exist either, give up watching
    }
  }
}

// =============================================================================
// Section 6: State File Watcher
// =============================================================================

let stateDebounceTimer = null;

function onStateChange() {
  if (stateDebounceTimer) return;
  stateDebounceTimer = setTimeout(() => {
    stateDebounceTimer = null;
    const newState = parseStateMd(STATE_FILE);
    currentState = newState;
    broadcastSSE('state_change', newState);
    const s = (newState.status || '').toLowerCase();
    if (s === 'done' || s === 'terminated_by_user') {
      broadcastSSE('surge_complete', { status: newState.status });
    }
  }, 50);
}

function startStateWatcher() {
  currentState = parseStateMd(STATE_FILE);

  try {
    stateWatcher = fs.watch(STATE_FILE, { persistent: false }, (eventType) => {
      if (eventType === 'change' || eventType === 'rename') onStateChange();
    });
    stateWatcher.on('error', () => {});
  } catch (e) {
    const dir = path.dirname(STATE_FILE);
    const base = path.basename(STATE_FILE);
    try {
      stateWatcher = fs.watch(dir, { persistent: false }, (eventType, filename) => {
        if (filename === base) {
          stateWatcher.close();
          stateWatcher = null;
          onStateChange();
          startStateWatcher();
        }
      });
      stateWatcher.on('error', () => {});
    } catch (e2) {
      // ignore
    }
  }
}

// =============================================================================
// Section 7: SSE Broadcasting
// =============================================================================

function broadcastSSE(eventName, data) {
  const payload = `event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients = sseClients.filter(res => {
    try {
      res.write(payload);
      return true;
    } catch (e) {
      return false;
    }
  });
}

function startHeartbeat() {
  heartbeatInterval = setInterval(() => {
    broadcastSSE('heartbeat', { ts: Date.now() });
  }, 30000);
}

// =============================================================================
// Section 8: HTTP Server & API Endpoints
// =============================================================================

function createServer() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    if (pathname === '/' && req.method === 'GET') {
      return handleDashboard(req, res);
    }
    if (pathname === '/api/events' && req.method === 'GET') {
      return handleSSE(req, res);
    }
    if (pathname === '/api/events/history' && req.method === 'GET') {
      return handleEventsHistory(req, res);
    }
    if (pathname === '/api/state' && req.method === 'GET') {
      return handleState(req, res);
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });
}

function handleSSE(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
}

function handleEventsHistory(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(allEvents));
}

function handleState(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(currentState));
}

function handleDashboard(req, res) {
  const taskId = path.basename(CONFIG.taskDir);
  const html = buildDashboardHTML(taskId);
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-cache'
  });
  res.end(html);
}

// =============================================================================
// Section 9: Port Discovery & Server Start
// =============================================================================

function tryListen(srv, port, maxPort) {
  return new Promise((resolve, reject) => {
    if (port > maxPort) {
      return reject(new Error(`No available port in range ${CONFIG.port}-${maxPort}`));
    }
    srv.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(tryListen(srv, port + 1, maxPort));
      } else {
        reject(err);
      }
    });
    srv.listen(port, '127.0.0.1', () => {
      resolve(port);
    });
  });
}

async function start() {
  // Load workflow config from SKILL.md if provided
  if (CONFIG.skillDir) {
    const parsed = parseSkillFrontmatter(CONFIG.skillDir);
    if (parsed) {
      workflowConfig = { ...workflowConfig, ...parsed };
    }
  }

  server = createServer();
  const port = await tryListen(server, CONFIG.port, CONFIG.port + 99);

  // Write PID file
  fs.writeFileSync(PID_FILE, `${process.pid}:${port}`, 'utf8');

  // Start watchers
  startTraceWatcher();
  startStateWatcher();
  startHeartbeat();

  console.log(`Dashboard: http://127.0.0.1:${port}`);
  console.log(`Task dir:  ${CONFIG.taskDir}`);
  console.log(`PID:       ${process.pid}`);
}

// =============================================================================
// Section 10: Graceful Shutdown
// =============================================================================

function cleanup() {
  try { fs.unlinkSync(PID_FILE); } catch (e) { /* ignore */ }
  if (traceWatcher) { try { traceWatcher.close(); } catch (e) { /* ignore */ } }
  if (stateWatcher) { try { stateWatcher.close(); } catch (e) { /* ignore */ } }
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (traceDebounceTimer) clearTimeout(traceDebounceTimer);
  if (stateDebounceTimer) clearTimeout(stateDebounceTimer);
  for (const client of sseClients) {
    try { client.end(); } catch (e) { /* ignore */ }
  }
  sseClients = [];
}

function shutdown() {
  cleanup();
  if (server) {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 2000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('exit', () => {
  try { fs.unlinkSync(PID_FILE); } catch (e) { /* ignore */ }
});

start().catch(err => {
  console.error('Failed to start dashboard server:', err.message);
  process.exit(1);
});

// =============================================================================
// Section 11: Dashboard HTML Builder
// =============================================================================

function buildDashboardHTML(taskId) {
  const configJSON = JSON.stringify(workflowConfig);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Surge Dashboard - ${escapeHTML(taskId)}</title>
<style>
${getDashboardCSS()}
</style>
</head>
<body>
<script>const WORKFLOW_CONFIG = ${configJSON};</script>
<div id="app">
  <header id="header">
    <div class="header-left">
      <span class="logo-icon">&#9889;</span>
      <span class="header-title">Surge Dashboard</span>
    </div>
    <div class="header-center">
      <span class="task-label">Task: <strong>${escapeHTML(taskId)}</strong></span>
    </div>
    <div class="header-right">
      <span id="conn-status" class="conn-indicator disconnected">
        <span class="conn-dot"></span>
        <span class="conn-text">Connecting</span>
      </span>
    </div>
  </header>

  <div id="status-bar">
    <div class="status-item">
      <span class="status-label">Phase:</span>
      <span id="status-phase" class="status-value">--</span>
    </div>
    <div class="status-item">
      <span class="status-label">Iteration:</span>
      <span id="status-iteration" class="status-value">--</span>
    </div>
    <div class="status-item">
      <span class="status-label">Type:</span>
      <span id="status-type" class="status-value">--</span>
    </div>
    <div class="status-item">
      <span class="status-label">Eval:</span>
      <span id="status-eval" class="status-value">--</span>
    </div>
    <div class="status-item">
      <span class="status-label">Status:</span>
      <span id="status-status" class="status-value">--</span>
    </div>
  </div>

  <div id="completion-banner" class="hidden">
    <span class="banner-icon">&#10004;</span>
    <span class="banner-text">Surge Complete</span>
  </div>

  <div id="main-content">
    <div id="left-panel">
      <div id="dag-container">
        <div class="panel-header">DAG View</div>
        <div id="dag-viewport">
          <svg id="dag-svg" xmlns="http://www.w3.org/2000/svg"></svg>
        </div>
      </div>
      <div id="timeline-container">
        <div class="panel-header">Event Timeline</div>
        <div id="timeline-list"></div>
      </div>
    </div>
    <div id="right-panel">
      <div class="panel-header">Detail Panel</div>
      <div id="detail-content">
        <p class="placeholder-text">Click a node or event to see details</p>
      </div>
      <div id="quick-stats">
        <div class="panel-header">Quick Stats</div>
        <div id="stats-grid">
          <div class="stat-item">
            <span class="stat-label">Events</span>
            <span id="stat-events" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Errors</span>
            <span id="stat-errors" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Steps</span>
            <span id="stat-steps" class="stat-value">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Elapsed</span>
            <span id="stat-elapsed" class="stat-value">--</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<script>
${getDashboardJS()}
</script>
</body>
</html>`;
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// =============================================================================
// Section 12: Dashboard CSS
// =============================================================================

function getDashboardCSS() {
  return `
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #0d1117;
  --surface: #161b22;
  --border: #30363d;
  --text: #c9d1d9;
  --text-muted: #8b949e;
  --accent-blue: #1f6feb;
  --accent-green: #3fb950;
  --accent-red: #f85149;
  --accent-yellow: #d29922;
  --accent-purple: #a371f7;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
  height: 100vh;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
#header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  font-size: 20px;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
}

.header-center {
  font-size: 13px;
  color: var(--text-muted);
}

.task-label strong {
  color: var(--text);
}

.conn-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.conn-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.conn-indicator.connected .conn-dot { background: var(--accent-green); }
.conn-indicator.disconnected .conn-dot { background: var(--accent-red); }
.conn-indicator.connected .conn-text { color: var(--accent-green); }
.conn-indicator.disconnected .conn-text { color: var(--accent-red); }

/* Status Bar */
#status-bar {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 6px 16px;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  font-size: 13px;
  flex-wrap: wrap;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-label { color: var(--text-muted); }
.status-value { color: var(--text); font-weight: 500; }

/* Completion Banner */
#completion-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  background: #0f291a;
  border-bottom: 1px solid var(--accent-green);
  color: var(--accent-green);
  font-weight: 600;
  flex-shrink: 0;
}

#completion-banner.hidden { display: none; }

.banner-icon { font-size: 18px; }

/* Main Content */
#main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

#left-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  min-width: 0;
}

#right-panel {
  width: 340px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 8px 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

/* DAG View */
#dag-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 200px;
  overflow: hidden;
}

#dag-viewport {
  flex: 1;
  overflow: hidden;
  cursor: grab;
  position: relative;
  background:
    radial-gradient(circle at 1px 1px, #21262d 1px, transparent 0) 0 0 / 20px 20px;
}

#dag-viewport:active { cursor: grabbing; }

#dag-svg {
  width: 100%;
  height: 100%;
  display: block;
}

/* Timeline */
#timeline-container {
  height: 200px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--border);
}

#timeline-list {
  flex: 1;
  overflow-y: auto;
  font-size: 12px;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}

.timeline-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.15s;
}

.timeline-entry:hover { background: rgba(31, 111, 235, 0.1); }
.timeline-entry.selected { background: rgba(31, 111, 235, 0.2); }

.tl-time { color: var(--text-muted); white-space: nowrap; min-width: 70px; }
.tl-icon { width: 16px; text-align: center; flex-shrink: 0; }
.tl-step { color: var(--accent-purple); min-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.tl-agent { color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.tl-icon.step_start { color: var(--accent-blue); }
.tl-icon.step_end { color: var(--accent-green); }
.tl-icon.step_fail { color: var(--accent-red); }
.tl-icon.subagent_start { color: var(--accent-yellow); }
.tl-icon.subagent_end { color: var(--accent-green); }
.tl-icon.error { color: var(--accent-red); }

/* Detail Panel */
#detail-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.placeholder-text {
  color: var(--text-muted);
  text-align: center;
  margin-top: 40px;
}

.detail-field {
  margin-bottom: 10px;
}

.detail-field-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 2px;
}

.detail-field-value {
  font-size: 13px;
  color: var(--text);
  word-break: break-word;
}

.detail-field-value.status-executing { color: var(--accent-blue); }
.detail-field-value.status-completed { color: var(--accent-green); }
.detail-field-value.status-failed { color: var(--accent-red); }
.detail-field-value.status-waiting { color: var(--accent-yellow); }

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.detail-tag {
  background: var(--border);
  color: var(--text);
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
}

/* Quick Stats */
#quick-stats {
  flex-shrink: 0;
  border-top: 1px solid var(--border);
}

#stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1px;
  background: var(--border);
}

.stat-item {
  background: var(--surface);
  padding: 10px 12px;
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin-top: 2px;
}

/* SVG node styles */
.dag-node { cursor: pointer; }
.dag-node:hover rect,
.dag-node:hover .node-pill { filter: brightness(1.2); }
.dag-node.highlighted rect,
.dag-node.highlighted .node-pill { stroke: #fff; stroke-width: 2; }

@keyframes pulse {
  0% { opacity: 1; }
  50% { opacity: 0.6; }
  100% { opacity: 1; }
}

.node-executing { animation: pulse 2s ease-in-out infinite; }

/* Scrollbar */
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: var(--bg); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #484f58; }

/* Responsive */
@media (max-width: 900px) {
  #main-content { flex-direction: column; }
  #right-panel { width: 100%; height: 300px; border-right: none; border-top: 1px solid var(--border); }
  #left-panel { border-right: none; }
}
`;
}

// =============================================================================
// Section 13: Dashboard JavaScript
// =============================================================================

function getDashboardJS() {
  return `
(function() {
  'use strict';

  // =========================================================================
  // State
  // =========================================================================
  const events = [];
  const nodes = new Map();  // nodeId -> { id, step, round, agent, status, type, parentId, startTime, endTime, event, subagents }
  let selectedNodeId = null;
  let errorCount = 0;
  let completedSteps = 0;
  let firstEventTime = null;
  let autoScroll = true;
  let surgeComplete = false;

  // SVG pan/zoom state
  let svgPanX = 40;
  let svgPanY = 40;
  let svgScale = 1;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let panStartTransX = 0;
  let panStartTransY = 0;

  // DOM refs
  const connStatus = document.getElementById('conn-status');
  const connText = connStatus.querySelector('.conn-text');
  const statusPhase = document.getElementById('status-phase');
  const statusIteration = document.getElementById('status-iteration');
  const statusType = document.getElementById('status-type');
  const statusEval = document.getElementById('status-eval');
  const statusStatus = document.getElementById('status-status');
  const completionBanner = document.getElementById('completion-banner');
  const dagSvg = document.getElementById('dag-svg');
  const dagViewport = document.getElementById('dag-viewport');
  const timelineList = document.getElementById('timeline-list');
  const detailContent = document.getElementById('detail-content');
  const statEvents = document.getElementById('stat-events');
  const statErrors = document.getElementById('stat-errors');
  const statSteps = document.getElementById('stat-steps');
  const statElapsed = document.getElementById('stat-elapsed');

  // =========================================================================
  // SSE Client
  // =========================================================================
  let evtSource = null;

  function connectSSE() {
    evtSource = new EventSource('/api/events');

    evtSource.addEventListener('connected', function() {
      setConnected(true);
      fetchHistory();
      fetchState();
    });

    evtSource.addEventListener('trace_event', function(e) {
      try {
        const ev = JSON.parse(e.data);
        processEvent(ev);
      } catch (err) { /* skip */ }
    });

    evtSource.addEventListener('state_change', function(e) {
      try {
        const state = JSON.parse(e.data);
        updateStatusBar(state);
      } catch (err) { /* skip */ }
    });

    evtSource.addEventListener('surge_complete', function(e) {
      surgeComplete = true;
      completionBanner.classList.remove('hidden');
    });

    evtSource.addEventListener('heartbeat', function() {
      // keep-alive
    });

    evtSource.onerror = function() {
      setConnected(false);
      // EventSource auto-reconnects
    };

    evtSource.onopen = function() {
      setConnected(true);
    };
  }

  function setConnected(connected) {
    if (connected) {
      connStatus.className = 'conn-indicator connected';
      connText.textContent = 'Connected';
    } else {
      connStatus.className = 'conn-indicator disconnected';
      connText.textContent = 'Disconnected';
    }
  }

  function fetchHistory() {
    fetch('/api/events/history')
      .then(function(r) { return r.json(); })
      .then(function(evts) {
        // Clear and replay
        events.length = 0;
        nodes.clear();
        errorCount = 0;
        completedSteps = 0;
        firstEventTime = null;
        for (var i = 0; i < evts.length; i++) {
          processEvent(evts[i], true);
        }
        renderDAG();
        renderTimeline();
        updateStats();
      })
      .catch(function() { /* retry on next connect */ });
  }

  function fetchState() {
    fetch('/api/state')
      .then(function(r) { return r.json(); })
      .then(function(state) { updateStatusBar(state); })
      .catch(function() { /* ignore */ });
  }

  // =========================================================================
  // Event Processing
  // =========================================================================
  function processEvent(ev, isBatch) {
    events.push(ev);

    var ts = ev.timestamp || ev.ts || null;
    if (ts && !firstEventTime) firstEventTime = ts;

    var type = ev.type || ev.event_type || '';
    var step = ev.step || ev.step_name || '';
    var round = ev.round || ev.iteration || 1;
    var agent = ev.agent || ev.agent_name || '';
    var nodeId = buildNodeId(step, round, type, ev);

    if (type === 'step_start') {
      var node = getOrCreateNode(nodeId, step, round, agent, ev);
      node.status = 'executing';
      node.startTime = ts;
      node.type = 'step';
      node.event = ev;
    } else if (type === 'step_end') {
      var node = getOrCreateNode(nodeId, step, round, agent, ev);
      node.status = ev.status === 'failed' ? 'failed' : 'completed';
      node.endTime = ts;
      node.event = Object.assign({}, node.event || {}, ev);
      if (node.status === 'completed') completedSteps++;
    } else if (type === 'step_fail' || type === 'step_error') {
      var node = getOrCreateNode(nodeId, step, round, agent, ev);
      node.status = 'failed';
      node.endTime = ts;
      node.event = Object.assign({}, node.event || {}, ev);
      errorCount++;
    } else if (type === 'subagent_start') {
      var parentId = buildNodeId(step, round, 'step_start', ev);
      var subId = nodeId + ':sub:' + (ev.subagent || ev.subagent_name || agent);
      var sub = getOrCreateNode(subId, step, round, ev.subagent || ev.subagent_name || agent, ev);
      sub.status = 'executing';
      sub.startTime = ts;
      sub.type = 'subagent';
      sub.parentId = parentId;
      sub.event = ev;
      var parent = nodes.get(parentId);
      if (parent) {
        if (!parent.subagents) parent.subagents = [];
        if (parent.subagents.indexOf(subId) === -1) parent.subagents.push(subId);
      }
    } else if (type === 'subagent_end') {
      var parentId = buildNodeId(step, round, 'step_start', ev);
      var subId = nodeId + ':sub:' + (ev.subagent || ev.subagent_name || agent);
      var sub = getOrCreateNode(subId, step, round, ev.subagent || ev.subagent_name || agent, ev);
      sub.status = ev.status === 'failed' ? 'failed' : 'completed';
      sub.endTime = ts;
      sub.event = Object.assign({}, sub.event || {}, ev);
    } else if (type === 'error') {
      errorCount++;
    }

    if (!isBatch) {
      renderDAG();
      appendTimelineEntry(ev, events.length - 1);
      updateStats();
    }
  }

  function buildNodeId(step, round, type, ev) {
    return (step || 'unknown') + ':' + round;
  }

  function getOrCreateNode(id, step, round, agent, ev) {
    if (!nodes.has(id)) {
      nodes.set(id, {
        id: id,
        step: step,
        round: round,
        agent: agent,
        status: 'waiting',
        type: 'step',
        parentId: ev.parent_id || null,
        startTime: null,
        endTime: null,
        event: null,
        subagents: []
      });
    }
    var n = nodes.get(id);
    if (agent && !n.agent) n.agent = agent;
    return n;
  }

  // =========================================================================
  // DAG Rendering (pure SVG)
  // =========================================================================
  var NS = 'http://www.w3.org/2000/svg';

  function renderDAG() {
    while (dagSvg.firstChild) dagSvg.removeChild(dagSvg.firstChild);

    // Defs: arrowhead marker
    var defs = createSVG('defs');
    var marker = createSVG('marker', {
      id: 'arrowhead', markerWidth: '10', markerHeight: '7',
      refX: '9', refY: '3.5', orient: 'auto', markerUnits: 'strokeWidth'
    });
    var arrowPath = createSVG('polygon', { points: '0 0, 10 3.5, 0 7', fill: '#484f58' });
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
    dagSvg.appendChild(defs);

    // Root group for pan/zoom
    var g = createSVG('g', { id: 'dag-root' });
    g.setAttribute('transform', 'translate(' + svgPanX + ',' + svgPanY + ') scale(' + svgScale + ')');
    dagSvg.appendChild(g);

    // Collect only step-level nodes (not subagents)
    var stepNodes = [];
    nodes.forEach(function(n) {
      if (n.type !== 'subagent') stepNodes.push(n);
    });

    if (stepNodes.length === 0) {
      var text = createSVG('text', { x: '20', y: '30', fill: '#8b949e', 'font-size': '13' });
      text.textContent = 'Waiting for trace events...';
      g.appendChild(text);
      return;
    }

    var topology = WORKFLOW_CONFIG.topology || 'linear';
    var positions;

    if (topology === 'cyclic') {
      positions = layoutCyclic(stepNodes);
    } else if (topology === 'dag') {
      positions = layoutDAG(stepNodes);
    } else {
      positions = layoutLinear(stepNodes);
    }

    // Draw edges first (behind nodes)
    drawEdges(g, stepNodes, positions, topology);

    // Draw nodes
    for (var i = 0; i < stepNodes.length; i++) {
      var node = stepNodes[i];
      var pos = positions.get(node.id);
      if (!pos) continue;
      drawNode(g, node, pos.x, pos.y);

      // Draw subagent pills
      if (node.subagents && node.subagents.length > 0) {
        for (var s = 0; s < node.subagents.length; s++) {
          var sub = nodes.get(node.subagents[s]);
          if (sub) {
            drawSubagentPill(g, sub, pos.x + 160, pos.y + s * 28);
          }
        }
      }
    }
  }

  function layoutLinear(stepNodes) {
    var positions = new Map();
    var nodeW = 140;
    var nodeH = 40;
    var gapY = 70;

    // Sort by round then step order
    var sorted = stepNodes.slice().sort(function(a, b) {
      if (a.round !== b.round) return a.round - b.round;
      return getStepIndex(a.step) - getStepIndex(b.step);
    });

    for (var i = 0; i < sorted.length; i++) {
      positions.set(sorted[i].id, {
        x: 0,
        y: i * gapY,
        w: nodeW,
        h: nodeH
      });
    }
    return positions;
  }

  function layoutCyclic(stepNodes) {
    var positions = new Map();
    var nodeW = 140;
    var nodeH = 40;
    var gapX = 200;
    var gapY = 70;

    // Unique steps and rounds
    var stepSet = {};
    var roundSet = {};
    stepNodes.forEach(function(n) {
      stepSet[n.step] = true;
      roundSet[n.round] = true;
    });

    var steps = WORKFLOW_CONFIG.steps && WORKFLOW_CONFIG.steps.length > 0
      ? WORKFLOW_CONFIG.steps
      : Object.keys(stepSet);
    var rounds = Object.keys(roundSet).map(Number).sort(function(a, b) { return a - b; });

    for (var i = 0; i < stepNodes.length; i++) {
      var node = stepNodes[i];
      var col = rounds.indexOf(node.round);
      if (col < 0) col = 0;
      var row = steps.indexOf(node.step);
      if (row < 0) row = steps.length;

      positions.set(node.id, {
        x: col * gapX,
        y: row * gapY,
        w: nodeW,
        h: nodeH
      });
    }
    return positions;
  }

  function layoutDAG(stepNodes) {
    var positions = new Map();
    var nodeW = 140;
    var nodeH = 40;
    var gapY = 70;
    var gapX = 200;

    // Build parent-child tree for depth
    var depths = new Map();
    var childrenAt = {};

    function getDepth(node) {
      if (depths.has(node.id)) return depths.get(node.id);
      if (node.parentId && nodes.has(node.parentId)) {
        var d = getDepth(nodes.get(node.parentId)) + 1;
        depths.set(node.id, d);
        return d;
      }
      depths.set(node.id, 0);
      return 0;
    }

    for (var i = 0; i < stepNodes.length; i++) {
      var d = getDepth(stepNodes[i]);
      if (!childrenAt[d]) childrenAt[d] = [];
      childrenAt[d].push(stepNodes[i]);
    }

    var depthKeys = Object.keys(childrenAt).map(Number).sort(function(a, b) { return a - b; });
    for (var di = 0; di < depthKeys.length; di++) {
      var nodesAtDepth = childrenAt[depthKeys[di]];
      for (var ni = 0; ni < nodesAtDepth.length; ni++) {
        positions.set(nodesAtDepth[ni].id, {
          x: di * gapX,
          y: ni * gapY,
          w: nodeW,
          h: nodeH
        });
      }
    }
    return positions;
  }

  function drawEdges(g, stepNodes, positions, topology) {
    var sorted = stepNodes.slice().sort(function(a, b) {
      if (a.round !== b.round) return a.round - b.round;
      return getStepIndex(a.step) - getStepIndex(b.step);
    });

    for (var i = 1; i < sorted.length; i++) {
      var prev = sorted[i - 1];
      var curr = sorted[i];
      var p1 = positions.get(prev.id);
      var p2 = positions.get(curr.id);
      if (!p1 || !p2) continue;

      var x1 = p1.x + p1.w / 2;
      var y1 = p1.y + p1.h;
      var x2 = p2.x + p2.w / 2;
      var y2 = p2.y;

      var isUnconverged = (topology === 'cyclic' && prev.round !== curr.round && prev.step === curr.step);

      var midY1 = y1 + (y2 - y1) * 0.3;
      var midY2 = y1 + (y2 - y1) * 0.7;
      var d = 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + midY1 + ', ' + x2 + ' ' + midY2 + ', ' + x2 + ' ' + y2;

      var pathEl = createSVG('path', {
        d: d,
        stroke: isUnconverged ? '#f85149' : '#484f58',
        'stroke-width': isUnconverged ? '2' : '1.5',
        fill: 'none',
        'marker-end': 'url(#arrowhead)',
        'stroke-dasharray': isUnconverged ? '6 3' : 'none'
      });
      g.appendChild(pathEl);

      if (isUnconverged) {
        var labelX = (x1 + x2) / 2;
        var labelY = (y1 + y2) / 2 - 6;
        var label = createSVG('text', {
          x: '' + labelX, y: '' + labelY,
          fill: '#f85149', 'font-size': '10', 'text-anchor': 'middle'
        });
        label.textContent = 'Unconverged';
        g.appendChild(label);
      }
    }
  }

  function drawNode(g, node, x, y) {
    var group = createSVG('g', { class: 'dag-node', 'data-id': node.id });
    if (node.id === selectedNodeId) group.classList.add('highlighted');

    var fill = getStatusColor(node.status);
    var rect = createSVG('rect', {
      x: '' + x, y: '' + y,
      width: '140', height: '40',
      rx: '8', ry: '8',
      fill: fill,
      stroke: '#30363d',
      'stroke-width': '1'
    });
    if (node.status === 'executing') rect.classList.add('node-executing');
    group.appendChild(rect);

    var label = (node.step || 'unknown').substring(0, 16);
    var text = createSVG('text', {
      x: '' + (x + 70), y: '' + (y + 18),
      fill: '#fff', 'font-size': '12', 'font-weight': '600',
      'text-anchor': 'middle', 'dominant-baseline': 'middle'
    });
    text.textContent = label;
    group.appendChild(text);

    var roundLabel = 'R' + node.round;
    var subText = createSVG('text', {
      x: '' + (x + 70), y: '' + (y + 32),
      fill: 'rgba(255,255,255,0.7)', 'font-size': '10',
      'text-anchor': 'middle', 'dominant-baseline': 'middle'
    });
    subText.textContent = roundLabel;
    group.appendChild(subText);

    group.addEventListener('click', function() {
      selectNode(node.id);
    });

    g.appendChild(group);
  }

  function drawSubagentPill(g, sub, x, y) {
    var group = createSVG('g', { class: 'dag-node', 'data-id': sub.id });
    if (sub.id === selectedNodeId) group.classList.add('highlighted');

    var fill = getStatusColor(sub.status);
    var rect = createSVG('rect', {
      x: '' + x, y: '' + y,
      width: '100', height: '24',
      rx: '12', ry: '12',
      fill: fill, stroke: '#30363d', 'stroke-width': '1',
      class: 'node-pill'
    });
    if (sub.status === 'executing') rect.classList.add('node-executing');
    group.appendChild(rect);

    var text = createSVG('text', {
      x: '' + (x + 50), y: '' + (y + 12),
      fill: '#fff', 'font-size': '10',
      'text-anchor': 'middle', 'dominant-baseline': 'middle'
    });
    text.textContent = (sub.agent || 'sub').substring(0, 12);
    group.appendChild(text);

    // Connector line from parent node
    var line = createSVG('line', {
      x1: '' + (x - 20), y1: '' + (y + 12),
      x2: '' + x, y2: '' + (y + 12),
      stroke: '#484f58', 'stroke-width': '1', 'stroke-dasharray': '3 2'
    });
    g.insertBefore(line, group);

    group.addEventListener('click', function() {
      selectNode(sub.id);
    });

    g.appendChild(group);
  }

  function getStatusColor(status) {
    switch (status) {
      case 'executing': return '#1f6feb';
      case 'completed': return '#3fb950';
      case 'failed': return '#f85149';
      case 'waiting': return '#d29922';
      default: return '#30363d';
    }
  }

  function getStepIndex(step) {
    if (WORKFLOW_CONFIG.steps && WORKFLOW_CONFIG.steps.length > 0) {
      var idx = WORKFLOW_CONFIG.steps.indexOf(step);
      return idx >= 0 ? idx : 999;
    }
    return 0;
  }

  function createSVG(tag, attrs) {
    var el = document.createElementNS(NS, tag);
    if (attrs) {
      for (var k in attrs) {
        if (attrs.hasOwnProperty(k)) {
          if (k === 'class') {
            el.setAttribute('class', attrs[k]);
          } else {
            el.setAttribute(k, attrs[k]);
          }
        }
      }
    }
    return el;
  }

  // =========================================================================
  // SVG Pan & Zoom
  // =========================================================================
  dagViewport.addEventListener('mousedown', function(e) {
    if (e.target.closest('.dag-node')) return;
    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartTransX = svgPanX;
    panStartTransY = svgPanY;
    e.preventDefault();
  });

  window.addEventListener('mousemove', function(e) {
    if (!isPanning) return;
    svgPanX = panStartTransX + (e.clientX - panStartX);
    svgPanY = panStartTransY + (e.clientY - panStartY);
    applyTransform();
  });

  window.addEventListener('mouseup', function() {
    isPanning = false;
  });

  dagViewport.addEventListener('wheel', function(e) {
    e.preventDefault();
    var delta = e.deltaY > 0 ? -0.1 : 0.1;
    var newScale = Math.max(0.2, Math.min(3, svgScale + delta));

    // Zoom towards mouse position
    var rect = dagViewport.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;

    svgPanX = mx - (mx - svgPanX) * (newScale / svgScale);
    svgPanY = my - (my - svgPanY) * (newScale / svgScale);
    svgScale = newScale;

    applyTransform();
  }, { passive: false });

  function applyTransform() {
    var root = document.getElementById('dag-root');
    if (root) {
      root.setAttribute('transform', 'translate(' + svgPanX + ',' + svgPanY + ') scale(' + svgScale + ')');
    }
  }

  // =========================================================================
  // Timeline
  // =========================================================================
  function renderTimeline() {
    timelineList.innerHTML = '';
    for (var i = 0; i < events.length; i++) {
      appendTimelineEntry(events[i], i);
    }
  }

  function appendTimelineEntry(ev, idx) {
    var type = ev.type || ev.event_type || 'unknown';
    var step = ev.step || ev.step_name || '';
    var agent = ev.agent || ev.agent_name || '';
    var ts = ev.timestamp || ev.ts || '';

    var timeStr = formatTime(ts);

    var entry = document.createElement('div');
    entry.className = 'timeline-entry';
    entry.setAttribute('data-idx', idx);

    var iconChar = getTypeIcon(type);

    entry.innerHTML =
      '<span class="tl-time">' + escHTML(timeStr) + '</span>' +
      '<span class="tl-icon ' + escHTML(type) + '">' + iconChar + '</span>' +
      '<span class="tl-step">' + escHTML(step) + '</span>' +
      '<span class="tl-agent">' + escHTML(agent) + '</span>';

    entry.addEventListener('click', function() {
      var nodeId = buildNodeIdFromEvent(ev);
      selectNode(nodeId, idx);
      highlightTimelineEntry(entry);
    });

    // Auto-scroll logic
    var wasAtBottom = timelineList.scrollHeight - timelineList.scrollTop - timelineList.clientHeight < 40;
    timelineList.appendChild(entry);
    if (autoScroll && wasAtBottom) {
      timelineList.scrollTop = timelineList.scrollHeight;
    }
  }

  timelineList.addEventListener('scroll', function() {
    var atBottom = timelineList.scrollHeight - timelineList.scrollTop - timelineList.clientHeight < 40;
    autoScroll = atBottom;
  });

  function highlightTimelineEntry(entry) {
    var prev = timelineList.querySelector('.timeline-entry.selected');
    if (prev) prev.classList.remove('selected');
    entry.classList.add('selected');
  }

  function buildNodeIdFromEvent(ev) {
    var step = ev.step || ev.step_name || 'unknown';
    var round = ev.round || ev.iteration || 1;
    return step + ':' + round;
  }

  function formatTime(ts) {
    if (!ts) return '--:--:--';
    try {
      var d = new Date(ts);
      if (isNaN(d.getTime())) {
        // Maybe epoch seconds
        if (typeof ts === 'number' && ts > 1e9) d = new Date(ts * 1000);
        else return String(ts).substring(0, 8);
      }
      var h = String(d.getHours()).padStart(2, '0');
      var m = String(d.getMinutes()).padStart(2, '0');
      var s = String(d.getSeconds()).padStart(2, '0');
      return h + ':' + m + ':' + s;
    } catch (e) {
      return String(ts).substring(0, 8);
    }
  }

  function getTypeIcon(type) {
    switch (type) {
      case 'step_start': return '\\u25B6';
      case 'step_end': return '\\u2714';
      case 'step_fail': case 'step_error': return '\\u2718';
      case 'subagent_start': return '\\u25B7';
      case 'subagent_end': return '\\u25B3';
      case 'error': return '\\u26A0';
      case 'validation': return '\\u2713';
      default: return '\\u25CF';
    }
  }

  function escHTML(s) {
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // =========================================================================
  // Node Selection & Detail Panel
  // =========================================================================
  function selectNode(nodeId, eventIdx) {
    selectedNodeId = nodeId;
    renderDAG();

    var node = nodes.get(nodeId);
    if (!node) {
      // Try to show event detail if we have the index
      if (eventIdx != null && events[eventIdx]) {
        showEventDetail(events[eventIdx]);
      } else {
        detailContent.innerHTML = '<p class="placeholder-text">Node not found</p>';
      }
      return;
    }

    showNodeDetail(node);
  }

  function showNodeDetail(node) {
    var ev = node.event || {};
    var duration = '';
    if (node.startTime && node.endTime) {
      try {
        var ms = new Date(node.endTime).getTime() - new Date(node.startTime).getTime();
        if (ms >= 0) duration = formatDuration(ms);
      } catch (e) { /* ignore */ }
    }

    var html = '';
    html += makeDetailField('Step', node.step);
    html += makeDetailField('Round', node.round);
    html += makeDetailField('Agent', node.agent);
    html += makeDetailField('Status', node.status, 'status-' + node.status);
    html += makeDetailField('Type', node.type);
    if (duration) html += makeDetailField('Duration', duration);
    if (ev.input_files) html += makeDetailField('Input Files', formatArray(ev.input_files));
    if (ev.output_files) html += makeDetailField('Output Files', formatArray(ev.output_files));
    if (ev.validation_result) html += makeDetailField('Validation', JSON.stringify(ev.validation_result));
    if (ev.error) html += makeDetailField('Error', ev.error);
    if (ev.message) html += makeDetailField('Message', ev.message);

    if (ev.tags && Array.isArray(ev.tags) && ev.tags.length > 0) {
      html += '<div class="detail-field"><div class="detail-field-label">Tags</div><div class="detail-tags">';
      for (var i = 0; i < ev.tags.length; i++) {
        html += '<span class="detail-tag">' + escHTML(ev.tags[i]) + '</span>';
      }
      html += '</div></div>';
    }

    // Subagents list
    if (node.subagents && node.subagents.length > 0) {
      var subList = node.subagents.map(function(sid) {
        var s = nodes.get(sid);
        return s ? s.agent + ' (' + s.status + ')' : sid;
      }).join(', ');
      html += makeDetailField('Subagents', subList);
    }

    detailContent.innerHTML = html;
  }

  function showEventDetail(ev) {
    var html = '';
    var keys = Object.keys(ev);
    for (var i = 0; i < keys.length; i++) {
      var val = ev[keys[i]];
      if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
      html += makeDetailField(keys[i], String(val));
    }
    detailContent.innerHTML = html;
  }

  function makeDetailField(label, value, valueClass) {
    var cls = valueClass ? ' ' + valueClass : '';
    return '<div class="detail-field">' +
      '<div class="detail-field-label">' + escHTML(label) + '</div>' +
      '<div class="detail-field-value' + cls + '">' + escHTML(String(value || '--')) + '</div>' +
      '</div>';
  }

  function formatArray(val) {
    if (Array.isArray(val)) return val.join(', ');
    return String(val);
  }

  function formatDuration(ms) {
    if (ms < 1000) return ms + 'ms';
    var secs = Math.floor(ms / 1000);
    if (secs < 60) return secs + 's';
    var mins = Math.floor(secs / 60);
    secs = secs % 60;
    if (mins < 60) return mins + 'm ' + secs + 's';
    var hours = Math.floor(mins / 60);
    mins = mins % 60;
    return hours + 'h ' + mins + 'm';
  }

  // =========================================================================
  // Status Bar
  // =========================================================================
  function updateStatusBar(state) {
    statusPhase.textContent = state.phase || state.current_phase || '--';
    statusIteration.textContent = formatIteration(state);
    statusType.textContent = state.type || state.surge_type || '--';
    statusEval.textContent = state.eval || state.eval_levels || '--';
    statusStatus.textContent = state.status || '--';

    var s = (state.status || '').toLowerCase();
    if (s === 'done' || s === 'terminated_by_user') {
      statusStatus.style.color = s === 'done' ? 'var(--accent-green)' : 'var(--accent-red)';
    } else if (s === 'running' || s === 'executing') {
      statusStatus.style.color = 'var(--accent-blue)';
    } else {
      statusStatus.style.color = '';
    }
  }

  function formatIteration(state) {
    var current = state.iteration || state.current_iteration || state.round || '--';
    var max = state.max_iterations || WORKFLOW_CONFIG.max_rounds || '--';
    return current + '/' + max;
  }

  // =========================================================================
  // Quick Stats
  // =========================================================================
  function updateStats() {
    statEvents.textContent = events.length;
    statErrors.textContent = errorCount;
    if (errorCount > 0) statErrors.style.color = 'var(--accent-red)';

    var totalSteps = 0;
    nodes.forEach(function(n) {
      if (n.type === 'step') totalSteps++;
    });
    statSteps.textContent = completedSteps + '/' + totalSteps;

    if (firstEventTime) {
      var elapsed = Date.now() - new Date(firstEventTime).getTime();
      if (elapsed >= 0) statElapsed.textContent = formatDuration(elapsed);
    }
  }

  // Update elapsed timer every second
  setInterval(function() {
    if (firstEventTime && !surgeComplete) {
      var elapsed = Date.now() - new Date(firstEventTime).getTime();
      if (elapsed >= 0) statElapsed.textContent = formatDuration(elapsed);
    }
  }, 1000);

  // =========================================================================
  // Init
  // =========================================================================
  connectSSE();

})();
`;
}
