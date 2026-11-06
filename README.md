# FOCUS

FOCUS is a standalone website that helps you stay on task with a focus session and a configurable list of focus sites.

## What it does

- Saves one domain or subdomain per line in your browser's local storage.
- Tracks how long your focus session has been active.
- Detects when you leave the FOCUS tab.
- Starts a repeating audio alarm after five minutes away.
- Silences the alarm after you return and stay on the dashboard for five seconds.

## Run locally

Open `index.html` in a browser, or serve the repository with any static web server:

```sh
python3 -m http.server
```

Then visit `http://localhost:8000`.

## Browser limitation

A regular website cannot inspect other browser tabs or read the URL of unrelated pages. The website therefore uses page visibility to detect leaving the FOCUS dashboard; monitoring every active tab requires a browser extension or a separately installed browser integration.
