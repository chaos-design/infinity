# Privacy Policy

Infinity is a browser New Tab extension focused on local productivity. The project is designed to keep user settings and organization data on the user's device.

## Data Stored Locally

Infinity may store the following data in `chrome.storage.local`:

- User settings such as theme, search engine, clock display, background type, and color preferences.
- Shortcut entries such as title, URL, and favicon metadata.
- Domain tag relationships and tag display preferences.
- View state used by the New Tab experience.

During local development outside the extension runtime, some data may fall back to browser `localStorage`.

## Browser Permissions

Infinity uses the following Chrome extension permissions:

- `storage`: Saves settings, shortcuts, tags, and view state locally.
- `tabs`: Reads currently opened tabs for the Open Tabs view and supports switching or closing tabs from the interface.

The extension only requests permissions required for its visible New Tab and tab management features.

## Network Access

Infinity does not intentionally upload user settings, shortcut data, tags, tab information, or browsing data to a remote server.

Some optional visual or browser-provided resources may involve network requests:

- Random image backgrounds may load images from remote image providers when selected.
- Website favicons may be requested by the browser or loaded from website-related sources.
- Search actions open the selected search engine with the user's query.

## Data Sharing

Infinity does not sell, rent, or share personal data. The project does not include analytics, telemetry, tracking pixels, advertising SDKs, or server-side user accounts.

## User Control

Users can remove local extension data by:

- Clearing the extension's storage from browser settings.
- Removing the extension from the browser.
- Resetting or editing relevant settings inside Infinity where available.

## Security Reports

Please report suspected privacy or security issues privately through GitHub Security Advisories:

https://github.com/chaos-design/infinity/security/advisories/new

## Changes

Privacy-related changes should be documented in this file and summarized in release notes.
