# Vicharanashala FAQ Voice Agent

A browser-based FAQ voice agent for the Vicharanashala Internship FAQ.

The app does **not** store the full FAQ locally. It fetches the latest FAQ live from:

https://samagama.in/internship/faq

The frontend talks to the local Node server at `/api/faqs`, and the server fetches/parses the FAQ from the official Samagama page.

## Features

- Ask internship FAQ questions by typing.
- Ask questions by voice using browser speech recognition.
- Speaks answers back using browser speech synthesis.
- Fetches live FAQ data from the Samagama portal.
- Uses `data/training.json` only for aliases and short voice-friendly answers.

## Project Structure

```txt
.
├── data/
│   └── training.json
├── scripts/
│   ├── build-data.js
│   └── import-live-faq.js
├── src/
│   ├── app.js
│   ├── index.html
│   └── styles.css
├── server.js
├── package.json
├── package-lock.json
└── README.md
```

## Important

`node_modules` is not included in the GitHub repository.

After cloning/downloading the project, install dependencies with:

```bash
npm install
```

## Run Locally

```bash
npm install
npm start
```

Then open:

```txt
http://localhost:3100
```

If the terminal shows:

```txt
Voice agent running at http://0.0.0.0:3100
```

that is normal. Open it in the browser using:

```txt
http://localhost:3100
```

## How Live FAQ Works

When the app starts:

1. The frontend loads in the browser.
2. `src/app.js` calls `/api/faqs`.
3. `server.js` fetches `https://samagama.in/internship/faq`.
4. The server parses the FAQ page and returns JSON.
5. The voice agent searches those live FAQ answers.

`data/training.json` does not contain the full FAQ. It only improves matching with aliases and short spoken answers.

## Deploy

This project needs a Node server, so do not deploy it as a static-only HTML site.

Use a Node hosting platform such as Render, Railway, Fly.io, or any VPS.

Build/install command:

```bash
npm install
```

Start command:

```bash
npm start
```

The server uses `process.env.PORT` automatically, so most hosting platforms will work without changing the code.

## Scripts

```bash
npm start
```

Starts the live FAQ voice agent server.

```bash
npm run import
```

Downloads FAQ text into `data/faq.txt`. This is an older helper script and is not required for live fetching.

```bash
npm run builddata
```

Builds `src/faq-data.js` from local FAQ text. This is also not required for the current live FAQ flow.

## Notes

- The live FAQ endpoint is cached for 15 minutes on the server.
- If the Samagama FAQ page changes, the app will pick up changes after the cache refreshes.
- Voice recognition support depends on the browser. Chrome usually works best.
