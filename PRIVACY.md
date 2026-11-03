# Privacy Policy for YouTube Autopilot

*Last updated: November 3, 2026*

This Privacy Policy describes how the **YouTube Autopilot** browser extension ("we", "our", or "the extension") handles user data.

---

## 1. No Data Collection or Transmission
YouTube Autopilot is built with a **strict Privacy-First and Offline-First architecture**:
- **We do not collect any personal data.**
- **We do not transmit any data to external servers, third-party analytics, or cloud services.**
- **We do not sell, rent, or monetize user data in any way.**

The extension operates entirely locally within your browser.

---

## 2. Local Storage and Data Usage
All data processed by YouTube Autopilot remains exclusively on your local device:
- **Automation Rules & Preferences:** Stored locally in `chrome.storage.local` to remember your settings, custom automation thresholds, and preferred UI language.
- **Watch History & Statistics:** Stored locally in your browser's `IndexedDB` to display your personal watch time summary, genuine playback intervals, and automation logs.

You can clear this data at any time by clearing your browser data or uninstalling the extension.

---

## 3. Permissions Justification
YouTube Autopilot only requests the minimum necessary permissions required for its functionality:
- **`storage`**: Used solely to persist your settings, rules, and local statistics on your device.
- **`activeTab`**: Used to read basic playback info (such as the video ID and title) from the active YouTube tab when you open the popup.
- **`host_permissions` (`https://*.youtube.com/*`)**: Required to inject content scripts into YouTube pages to detect player events, calculate genuine watch time, display the on-player progress indicator, and execute user-defined actions (such as liking a video).

---

## 4. No Remote Code
YouTube Autopilot complies fully with Chrome Web Store Manifest V3 requirements. All code and assets are bundled directly inside the extension package. The extension does not load, execute, or evaluate any remote JavaScript or WebAssembly.

---

## 5. Contact & Open Source
YouTube Autopilot is an open-source project. You can inspect the source code, report issues, or ask questions on GitHub:
- **Repository:** [https://github.com/denis-ershov/YouTube-Autopilot](https://github.com/denis-ershov/YouTube-Autopilot)

