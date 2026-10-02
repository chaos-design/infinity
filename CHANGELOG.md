# Changelog

All notable changes to Infinity are documented in this file.

This project follows a human-readable changelog style inspired by Keep a Changelog. Version numbers should match `package.json`, `wxt.config.ts` manifest output, Git tags, and GitHub Releases.

## Unreleased

## 0.0.1

First release.

### Added

- New Tab workspace for Chrome / Chromium browsers.
- Search entry with Google and Bing support.
- Shortcut management with favicon display.
- Appearance settings for theme, solid color, gradient, and random image backgrounds.
- Open Tabs management with domain grouping, search, tab switching, and close actions.
- Domain tags, tag view, uncategorized grouping, and batch tag assignment.
- Local persistence through `chrome.storage.local` with development fallback support.
- GitHub Issue Forms for Bug Report, Feature Request, and Documentation feedback.
- Pull Request template, contribution guide, code of conduct, and security policy.
- GitHub Release workflow for building and publishing WXT zip assets.
- Continuous integration workflow running lint, type check, tests, and a production build on every push and pull request to `main`.
- Manual release trigger, so an existing tag can be published again without re-tagging.
- Release-time guard that fails fast when the pushed tag does not match `package.json`.
- Privacy policy, roadmap, and release checklist documentation.

### Changed

- The extension manifest version is sourced from `package.json` to avoid release version drift.
- Release commits contain only the `package.json` version bump; other staged changes can no longer ride along.

### Maintenance

- Added Dependabot configuration for npm and GitHub Actions dependency updates.
- Added CODEOWNERS guidance for future reviewer ownership.
- Pinned the release workflow to the pnpm version declared in `package.json` instead of `pnpm@latest`, so the committed lockfile format cannot drift between runs.
- Scoped the settings panel gradient preset spec to its own grid, reducing it from 4.8s to 0.32s, and extended it to assert all 24 gradient presets.
- Updated Radix UI, React 19.3, Vite 8.3, styled-components and Biome 2.5 within their semver ranges.
- Upgraded the test toolchain across majors: Vitest 5, `@vitest/coverage-v8` 5, jsdom 30, `@testing-library/jest-dom` 7 and `@types/chrome` 0.3. Full suite runs about 30% faster.
- Upgraded WXT to 0.21, which enables `noUncheckedIndexedAccess`. Group comparison, tag container building and masonry column assignment now guard against a missing element instead of assuming one, and the error boundary declares `override`.
- Upgraded TypeScript to 7.0 (tsgo). It no longer pulls ambient declarations from `node_modules/@types` automatically, so `tsconfig.json` now lists `chrome` explicitly.
- Migrated Tailwind CSS to v4. PostCSS runs `@tailwindcss/postcss`, autoprefixer is no longer needed, and the shadcn palette moved from `theme.extend.colors` into `@theme inline` so the colour utilities keep resolving against the runtime CSS variables.