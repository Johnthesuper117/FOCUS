const AWAY_THRESHOLD_MS = 5 * 60 * 1000;
const FOCUS_RECOVERY_MS = 5 * 1000;

let focusDomains = [];
let awayFromFocusSince = null;
let alarmActive = false;
let recoverySince = null;
let lastActiveTabId = null;
let lastActiveHostname = null;
let alarmTabId = null;

function normalizeDomain(input) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function hostnameFromUrl(url) {
  if (!url) {
    return null;
  }

  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function isFocusHostname(hostname) {
  if (!hostname) {
    return false;
  }

  return focusDomains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
}

function sendAlarmState(tabId, shouldAlarm) {
  if (!tabId) {
    return;
  }

  chrome.tabs.sendMessage(tabId, { type: shouldAlarm ? 'START_ALARM' : 'STOP_ALARM' }, () => {
    chrome.runtime.lastError;
  });
}

async function loadFocusDomains() {
  const stored = await chrome.storage.sync.get({ focusDomains: [] });
  focusDomains = stored.focusDomains
    .map(normalizeDomain)
    .filter(Boolean);
}

function startAlarm(tabId) {
  if (alarmTabId && alarmTabId !== tabId) {
    sendAlarmState(alarmTabId, false);
  }

  alarmTabId = tabId;
  alarmActive = true;
  recoverySince = null;
  sendAlarmState(tabId, true);
}

function stopAlarm() {
  if (alarmTabId) {
    sendAlarmState(alarmTabId, false);
  }

  alarmTabId = null;
  alarmActive = false;
  recoverySince = null;
  awayFromFocusSince = null;
}

async function evaluateActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

  if (!tab) {
    return;
  }

  const now = Date.now();
  const activeHostname = hostnameFromUrl(tab.url);
  const onFocusSite = isFocusHostname(activeHostname);

  if (onFocusSite) {
    if (alarmActive) {
      if (!recoverySince) {
        recoverySince = now;
      } else if (now - recoverySince >= FOCUS_RECOVERY_MS) {
        stopAlarm();
      }
    } else {
      awayFromFocusSince = null;
    }

    if (!alarmActive) {
      sendAlarmState(tab.id, false);
    }

    lastActiveTabId = tab.id;
    lastActiveHostname = activeHostname;
    return;
  }

  recoverySince = null;

  if (!awayFromFocusSince) {
    awayFromFocusSince = now;
  }

  const awayLongEnough = now - awayFromFocusSince >= AWAY_THRESHOLD_MS;
  const switchedSites = tab.id !== lastActiveTabId || activeHostname !== lastActiveHostname;

  if (!alarmActive && awayLongEnough && switchedSites) {
    startAlarm(tab.id);
  } else if (alarmActive) {
    startAlarm(tab.id);
  }

  lastActiveTabId = tab.id;
  lastActiveHostname = activeHostname;
}

chrome.runtime.onInstalled.addListener(async () => {
  await loadFocusDomains();
});

chrome.runtime.onStartup.addListener(async () => {
  await loadFocusDomains();
  await evaluateActiveTab();
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'sync' || !changes.focusDomains) {
    return;
  }

  focusDomains = (changes.focusDomains.newValue || [])
    .map(normalizeDomain)
    .filter(Boolean);

  evaluateActiveTab();
});

chrome.tabs.onActivated.addListener(() => {
  evaluateActiveTab();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!tab.active || !changeInfo.url) {
    return;
  }

  evaluateActiveTab();
});

setInterval(() => {
  evaluateActiveTab();
}, 1000);
