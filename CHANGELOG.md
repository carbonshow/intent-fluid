# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-03-31

### Fixed
- `surge` state.sh: detect swapped subcommand/file arguments with helpful error message
- `surge` merge-parallel.sh: add usage hint when iterations directory not found
- `surge` init.sh: add `--force` flag for safe re-initialization of existing task directories

### Changed
- `surge` SKILL.md: move dashboard prompt inline with startup steps for better discoverability
- `surge` SKILL.md: add mandatory trace emission steps (4 & 6) to Phase Invocation Flow
- `surge` SKILL.md: resolve `<repo_root>` ambiguity in Reference File Index with `git rev-parse` hint

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
