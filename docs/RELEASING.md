# Releasing

> Guidelines for versioning and publishing intent-fluid.

## Version Management

- **Repository version**: Tracked via semver git tags (`vX.Y.Z`) and `package.json`
- **Skill versions**: Each skill tracks its own version in SKILL.md frontmatter, independent of the repo version

### When to Bump

| Change | Repo version | Skill version |
|--------|-------------|---------------|
| New skill added | minor | N/A (new skill starts at `0.1.0` or `1.0.0`) |
| Breaking change to skill spec | major | — |
| Bug fix in a skill | patch | patch |
| New feature in a skill | minor (if significant) | minor |
| Plugin manifest changes | patch | — |
| Documentation only | — (no release needed) | — |

## Release Checklist

1. **Update versions**
   - `package.json` → new repo version
   - Any modified skill's SKILL.md `version` field

2. **Update CHANGELOG.md**
   - Add a new `## [X.Y.Z] - YYYY-MM-DD` section
   - Categorize changes: Added / Changed / Fixed / Removed
   - Follow [Keep a Changelog](https://keepachangelog.com) format

3. **Commit**
   ```bash
   git add -A
   git commit -m "release: vX.Y.Z"
   ```

4. **Tag**
   ```bash
   git tag vX.Y.Z
   ```

5. **Push**
   ```bash
   git push origin main --tags
   ```

## Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/en/1.1.0/):

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New feature or skill

### Changed
- Modifications to existing behavior

### Fixed
- Bug fixes

### Removed
- Deprecated features removed
```

## Pre-release Validation

Before tagging a release:

```bash
# Validate all skills
for dir in skills/*/; do
  bash scripts/validate-skill.sh "$dir"
done

# Verify JSON manifests
python3 -m json.tool .claude-plugin/plugin.json > /dev/null
python3 -m json.tool .claude-plugin/marketplace.json > /dev/null
python3 -m json.tool .cursor-plugin/plugin.json > /dev/null
python3 -m json.tool gemini-extension.json > /dev/null
```
