# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-24

### Added
- Skill developer specification (`docs/SKILL_SPEC.md`)
- Skill template for new skill authors (`docs/SKILL_TEMPLATE.md`)
- Installation guide (`docs/INSTALL.md`)
- Release process documentation (`docs/RELEASING.md`)
- Cross-platform plugin manifests (Claude Code, Cursor, Gemini CLI)
- Skill validation script (`scripts/validate-skill.sh`)
- `package.json` with project metadata
- This changelog

### Changed
- `surge` skill: added `version`, `author`, `tags`, `platforms` to frontmatter
- `README.md`: added installation, available skills, and new-skill creation sections
- `GEMINI.md`: added skill directory structure description
- `.gitignore`: added plugin cache patterns
