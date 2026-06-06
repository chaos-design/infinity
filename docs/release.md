# Release Guide

This guide describes the release checklist for Infinity and the relationship between package version, WXT output, Git tags, and GitHub Releases.

## Release Version

Before creating a release, update `package.json` to the target version.

The WXT manifest version is sourced from `package.json`, so `wxt.config.ts` should not contain a separate hard-coded version.

Release versions must stay consistent across:

- `package.json` version, for example `1.2.3`.
- Generated extension manifest version, for example `1.2.3`.
- Git tag, for example `v1.2.3`.
- GitHub Release title, for example `Infinity v1.2.3`.

The Release workflow validates that the tag version matches `package.json`.

## Pre-Release Checklist

- Confirm `package.json` has the intended version.
- Update `CHANGELOG.md` with user-facing changes.
- Confirm `README.md` screenshots and feature descriptions are current.
- Review `PRIVACY.md` when permissions, data handling, or network behavior changes.
- Use Node.js 22.12+ and pnpm.
- Run `pnpm lint`.
- Run `pnpm compile`.
- Run `pnpm build`.
- Run `pnpm zip`.
- Load `.output/chrome-mv3` in Chrome and verify the New Tab page manually.
- Check that `.output/*.zip` is generated and installable.

## GitHub Release

Automatic release through tag push:

```bash
git tag v0.0.1
git push origin v0.0.1
```

Manual release through GitHub Actions:

1. Open the `Release` workflow in GitHub Actions.
2. Run workflow manually.
3. Enter a version such as `v0.0.1` or `0.0.1`.
4. Confirm the workflow uploads the WXT zip asset to GitHub Release.

## Release Assets

The workflow publishes:

- `release-assets/*.zip` to GitHub Release.
- `.output/chrome-mv3` as a workflow artifact for review and debugging.

## Chrome Web Store Checklist

- Confirm extension name, description, icons, and version are correct.
- Confirm the permission explanation for `storage` and `tabs`.
- Confirm screenshots are up to date and match the submitted build.
- Confirm `PRIVACY.md` reflects actual data handling.
- Upload the generated Chrome zip from `.output/*.zip`.
- After store review, create or update release notes with the public release status.

## Rollback Notes

If a release is broken:

- Remove or mark the GitHub Release as pre-release if users should not install it.
- Prepare a patch version in `package.json`.
- Add the fix to `CHANGELOG.md`.
- Create a new tag and release instead of mutating the old release asset.
