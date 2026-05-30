# Changelog

All notable changes to Infinity are documented in this file.

This project follows a human-readable changelog style inspired by Keep a Changelog. Version numbers should match `package.json`, `wxt.config.ts` manifest output, Git tags, and GitHub Releases.

## Unreleased

### Added

- GitHub Issue Forms for Bug Report, Feature Request, and Documentation feedback.
- Pull Request template, contribution guide, code of conduct, and security policy.
- GitHub Release workflow for building and publishing WXT zip assets.
- Privacy policy, roadmap, and release checklist documentation.

### Changed

- The extension manifest version is sourced from `package.json` to avoid release version drift.

### Maintenance

- Added Dependabot configuration for npm and GitHub Actions dependency updates.
- Added CODEOWNERS guidance for future reviewer ownership.

## 0.0.1

### Added

- New Tab workspace for Chrome / Chromium browsers.
- Search entry with Google and Bing support.
- Shortcut management with favicon display.
- Appearance settings for theme, solid color, gradient, and random image backgrounds.
- Open Tabs management with domain grouping, search, tab switching, and close actions.
- Domain tags, tag view, uncategorized grouping, and batch tag assignment.
- Local persistence through `chrome.storage.local` with development fallback support.
