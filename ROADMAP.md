# Roadmap

This roadmap captures likely product and engineering directions for Infinity. It is not a strict commitment; priorities can change based on user feedback, browser platform changes, and maintenance capacity.

## Near Term

- **Release readiness**: Keep release checklist, changelog, privacy policy, and GitHub Release assets aligned before each tagged release.
- **Version consistency**: Keep `package.json`, generated manifest version, Git tag, and GitHub Release name synchronized.
- **Coverage improvement**: Raise branch and function coverage for `components/tab-manager.tsx` before making coverage a required release gate.
- **Chrome Web Store preparation**: Maintain screenshots, permission explanation, privacy policy, and review notes for store submission.
- **Documentation polish**: Expand troubleshooting, local extension loading, and release instructions as the project stabilizes.

## Product Ideas

- **Shortcut import and export**: Allow users to back up or migrate shortcut data.
- **Tag data import and export**: Allow users to move domain tags between browsers or devices.
- **Custom search engines**: Let users add search providers beyond Google and Bing.
- **Keyboard shortcuts**: Add quick actions for search focus, settings, and Open Tabs navigation.
- **Background presets**: Provide curated visual presets and optional user-defined presets.

## Engineering Ideas

- **Store release automation**: Investigate Chrome Web Store upload automation after the manual release process is stable.
- **Cross-browser validation**: Expand Firefox build checks when Firefox becomes a supported target.
- **Dependency hygiene**: Keep npm and GitHub Actions dependencies updated through Dependabot.
- **Accessibility pass**: Audit focus states, keyboard navigation, labels, and contrast for key workflows.
- **Performance pass**: Review bundle size, tab list rendering, and lazy loading opportunities.

## Out of Scope For Now

- Cloud synchronization and account systems.
- Remote analytics or telemetry.
- Server-side storage.
- Non-browser desktop applications.
