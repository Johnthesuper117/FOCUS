# FOCUS

FOCUS is a Chrome extension that helps you stay on a configured set of focus domains.

## What it does

- Lets you enter and save a list of domains/subdomains (one per line).
- Tracks your active tab against that list.
- If you stay away from focus domains for more than 5 minutes and switch to another non-focus site, it starts an alarm.
- The alarm keeps playing until you stay on a focus site continuously for at least 5 seconds.

## Setup

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked** and select:
   - `/home/runner/work/FOCUS/FOCUS`
4. Open the extension popup and save your focus domains (for example `example.com`).

## Notes

- Domain matching is hostname-based (no page/path matching).
- A domain entry like `example.com` also matches subdomains such as `docs.example.com`.
