# Quran & Arabic Learner

A free, installable web app to learn the Arabic alphabet and its pronunciation, and to memorize the Qur'an with recitation audio, transliteration, translation, tafsir and progress tracking.

**Live site:** `https://<your-username>.github.io/<repo-name>/`

## Features

- **Arabic alphabet:** all 28 letters, example words, pronunciation notes, listen (normal or slow), and voice practice with scoring.
- **Full Qur'an:** all 114 surahs in Uthmani script, colour-coded tajweed, transliteration, English translation, Mishary Alafasy recitation, repeat controls, and abridged Ibn Kathir tafsir.
- **Memorisation:** a per-verse Memorised checkbox, memorise mode (blurred text, tap to reveal), and a voice check that marks each word.
- **Progress:** verses memorised, surahs completed, letters learned, daily streak, and export/import of your progress as a JSON file.
- **Installable:** works as an app on Android, iPhone/iPad, Windows, macOS and Linux. Works offline for content already loaded.

## Run it locally

No build step is needed. Any static server works:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Note: the service worker and microphone need `https://` or `localhost`.

## Deploy on GitHub Pages

1. Create a new public repository on GitHub, for example `quran-learner`.
2. Push these files to the `main` branch:
   ```bash
   git init
   git add .
   git commit -m "Initial release"
   git branch -M main
   git remote add origin https://github.com/<your-username>/quran-learner.git
   git push -u origin main
   ```
3. On GitHub, go to **Settings → Pages**, and under **Build and deployment** choose **Source: GitHub Actions**.
4. The included workflow (`.github/workflows/pages.yml`) deploys automatically on each push. Check the **Actions** tab for progress.
5. Your site will be at `https://<your-username>.github.io/quran-learner/`.

The app uses only relative paths, so it works both from a project subpath (as above) and from a custom domain.

### Custom domain (optional)
In **Settings → Pages → Custom domain**, enter your domain and add the DNS records GitHub shows you. Then enable **Enforce HTTPS**.

## Updating the app

Edit the files, then push. Visitors get the new version on their next visit because pages are fetched network-first. If you change any app file other than `index.html` (such as an icon), bump `VERSION` in `sw.js` so offline caches refresh.

## Privacy

All progress is stored in the browser's local storage on the user's own device. Nothing is sent to a server owned by this project. Quran text, translation, audio and tafsir are fetched from public APIs (alquran.cloud, Quran.com) when needed.

## Sources and accuracy

- Qur'anic text: Uthmani script via alquran.cloud (Tanzil data) and Quran.com.
- Translation: Sahih International. Transliteration: alquran.cloud edition.
- Recitation: Mishary Alafasy via alquran.cloud CDN.
- Tafsir: Ibn Kathir (abridged), via Quran.com.

The app is a study aid. It does not replace a qualified teacher (talaqqī) or a printed Mushaf. Check any text you teach against a trusted Mushaf. Voice checks compare words only and cannot assess tajweed quality.

## License

Add your chosen license here (for example MIT).
