# Installation Guide

> How to install and use intent-fluid skills in your AI coding environment.

## Claude Code

```bash
/plugin install intent-fluid@claude-plugins-official
```

Or install from Git directly:

```bash
git clone https://github.com/carbonshow/intent-fluid.git
cd intent-fluid
# Skills are automatically discovered from the skills/ directory
```

## Cursor

```bash
/add-plugin intent-fluid
```

Or add manually by cloning the repository and pointing Cursor to the `skills/` directory.

## Gemini CLI

```bash
gemini extensions install https://github.com/carbonshow/intent-fluid
```

Or clone and reference `GEMINI.md` as the context file:

```bash
git clone https://github.com/carbonshow/intent-fluid.git
# Copy or symlink GEMINI.md to your project root
```

## Manual Installation (Any Platform)

1. Clone the repository:
   ```bash
   git clone https://github.com/carbonshow/intent-fluid.git
   ```

2. Copy or symlink the `skills/` directory into your project.

3. Configure your AI tool to scan the `skills/` directory for SKILL.md files.

## Verify Installation

Start a new AI session and provide a PRD (Product Requirements Document). The **surge** skill should automatically activate if it detects a detailed spec or requirements document.

Test prompt:
> "Here is my PRD for a user authentication system: [paste a multi-paragraph spec]"

Expected behavior: The AI activates the surge skill and begins the orchestrated delivery workflow.

## Updating

### Claude Code
```bash
/plugin update intent-fluid
```

### Cursor
```bash
/update-plugin intent-fluid
```

### Gemini CLI
```bash
gemini extensions update intent-fluid
```

### Manual (Git)
```bash
cd intent-fluid
git pull origin main
```

## Troubleshooting

- **Skill not activating**: Ensure the `skills/` directory is accessible to your AI tool and SKILL.md files are present.
- **Platform not supported**: Currently supported platforms are Claude Code, Cursor, and Gemini CLI. See [SKILL_SPEC.md](./SKILL_SPEC.md) for the skill format if you want to adapt for other platforms.
- **Version conflicts**: Each skill has its own version in SKILL.md frontmatter. Check `git log` for recent changes.
