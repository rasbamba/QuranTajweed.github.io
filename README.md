# Quran & Arabic Learner

A static, installable Quran and Arabic learning progressive web app (PWA).

## Publish using GitHub Pages

1. Create a new GitHub repository, for example `quran-learner`.
2. Upload **the contents of this folder to the repository root**, keeping `index.html`, `manifest.webmanifest`, `sw.js`, both PNG icons and `.nojekyll` at the same level. Do not upload the parent folder as a single subfolder.
3. Commit the files to the `main` branch.
4. Under **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/(root)**, then save.
5. Open `https://YOUR-USERNAME.github.io/quran-learner/`. If the repository is named `YOUR-USERNAME.github.io`, the URL is instead `https://YOUR-USERNAME.github.io/`.
6. Open the URL on a supported device to use the browser's install/add-to-home-screen option.

## Deployment notes

- Everything is client-side; no paid server or environment variables are necessary.
- HTTPS is automatically provided by GitHub Pages, which is necessary for service workers and microphone access.
- The app uses the public services `api.alquran.cloud` and `api.quran.com`, and Google Fonts; online connectivity is needed for initially uncached Quran data and recitation audio. The app shell and previously cached API responses can work offline; audio is **not** guaranteed offline.
- Memorisation data is stored **only in this browser/device**. Export progress from the Progress tab before clearing browser data or changing devices.
- Speech recognition accuracy varies by device/browser. A textual similarity score is **not** a tajweed-quality or correct-recitation assessment.
- If you make changes, edit `index.html` and consider incrementing the shell cache version in `sw.js` to force a new cache on installed clients.
- There is no administrator login or private server storage. Do not add secret tokens to client-side files.

## Files

- `index.html` — application HTML/CSS/JavaScript
- `manifest.webmanifest` — PWA metadata
- `sw.js` — offline service worker
- `icon-192.png` and `icon-512.png` — install icons
- `.nojekyll` — GitHub Pages static hosting marker

## Basic local test

From this directory, run `python -m http.server 8000` and browse to `http://localhost:8000/`. Microphone and install behavior should be retested on the published HTTPS GitHub Pages URL.

## Tajweed display repair (November 2026)

The verse renderer parses the **complete** Quran.com Tajweed markup before dividing the Arabic text into word elements. This prevents class attributes appearing as visible Arabic text. The service worker shell version is `v3`, ensuring existing installs can receive the updated code. After deploying, refresh the published website; for a stubborn cached version, close and reopen the PWA or unregister the old service worker in browser DevTools.

## Continuous Quran audio player (v4)

In the Quran tab, choose one of:
- **Selected surah only:** plays the current chapter, verse by verse.
- **Continue from selected surah to Surah 114:** automatically loads following chapters.
- **Full Quran (Surah 1–114):** starts at Al-Fatihah and attempts to advance through all chapters.

Set **Repeat = 1** to avoid repeating each verse multiple times. Select audio speed and click Play while the application is open. Play/Pause/Next/Previous media controls use the browser Media Session API on compatible platforms. Normal screen-lock playback of an active audio element is generally supported on Android Chrome; automatic transitions between many separate verse files and chapter API fetches may be suspended by iOS Safari, background restrictions, power-saving modes, or network failure. No website can guarantee uninterrupted background playback on all devices. Audio is streamed from third-party Quran sources and should not be assumed available offline.

To deploy an update, replace all repository files with the contents of this folder, commit, then reload the published app. The service-worker cache name has changed to v4.

## Offline Quran installation and audio downloads (v5)

The GitHub Pages website is installable as a PWA via Chrome's **Install app** / **Add to Home screen** menu or Safari's **Share > Add to Home Screen**. The static application files are cached on first online visit. An install prompt is displayed only on supported browsers and when their eligibility requirements are met.

Under **Quran > Offline Quran downloads**:

1. Connect to the internet and open the app. Choose a surah.
2. Press **Download selected surah** to save its verse-by-verse 64 kbps Alafasy recitation, or **Download full Quran** to attempt all 6,236 recordings. Keep the app visible during downloads.
3. Wait for the progress display to finish. Already downloaded verses are skipped if you resume.
4. To read text and translations offline, visit the surahs while connected. The app's external API responses are saved on a best-effort basis as they are fetched. Audio downloads alone do **not** download every surah's reading/translation metadata.
5. Switch off Wi-Fi and mobile data to test offline reading/playback. Browser playback with the screen locked and auto-advancing between files is device-dependent and **not guaranteed**.

The audio is provided by `cdn.islamic.network`, using documented per-ayah 64 kbps URLs. Downloaded audio is stored in Cache Storage on the device, not GitHub. **No MP3 recordings are included inside the ZIP.** Downloading the full Quran may use hundreds of megabytes of data/storage; actual size varies. Do not close the PWA, and keep the device awake for bulk downloads. For security and storage reasons, local browser data may be deleted by the operating system; the Protect offline storage button requests persistent storage where the browser supports it. Saved files are not synced to another phone.

**Offline compatibility limit:** Some browsers use HTTP Range requests for MP3 playback, and compatibility with previously cached cross-origin media can vary. Especially on iOS, sleep/background suspension may prevent continuous playback of separate verse audio tracks. Test offline playback on your actual device before relying on it. For guaranteed background playback on a specific phone, a native Android/iOS app with a local audio file manager is more reliable.

The `sw.js` cache version is v5; the audio cache has its own stable name so a future app-shell update does not erase downloaded files.


## Mushaf-inspired reading view (v6)

The Quran tab defaults to a framed, parchment-style Mushaf reading view with Arabic flowing text and ayah number ornaments. Use **Verse study** to access translations, transliterations, audio, microphone comparison and tafsir. Tap an ayah in Mushaf view to open its study card. Previous/Next switches between groups of seven verses. These sections are a display convenience, **not official printed Mushaf pagination**. The Arabic text is supplied by the same third-party API as in previous versions; verify against an authoritative printed Mushaf. Offline text availability depends on previously cached API content.
