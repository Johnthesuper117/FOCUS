const AWAY_THRESHOLD_MS = 5 * 60 * 1000;
const RECOVERY_MS = 5 * 1000;
const STORAGE_KEY = 'focusDomains';

let sessionStartedAt = null;
let awaySince = null;
let recoverySince = null;
let alarmActive = false;
let alarmInterval = null;
let audioContext = null;

const timer = document.getElementById('timer');
const sessionState = document.getElementById('session-state');
const sessionMessage = document.getElementById('session-message');
const sessionToggle = document.getElementById('session-toggle');
const domainList = document.getElementById('domain-list');
const saveStatus = document.getElementById('save-status');

function normalizeDomain(input) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function formatDuration(milliseconds) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function updateTimer() {
  timer.textContent = sessionStartedAt ? formatDuration(Date.now() - sessionStartedAt) : '00:00:00';
}

function updateState(label, message, isAlarm = false) {
  sessionState.textContent = label;
  sessionState.classList.toggle('alarm', isAlarm);
  sessionMessage.textContent = message;
}

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function beep() {
  const context = getAudioContext();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'square';
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.08;
  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.2);
}

function startAlarm() {
  if (alarmActive) {
    return;
  }

  alarmActive = true;
  beep();
  alarmInterval = setInterval(beep, 700);
  updateState('Alarm', 'You have been away for five minutes. Return to FOCUS to silence the alarm.', true);
}

function stopAlarm() {
  if (!alarmActive) {
    return;
  }

  clearInterval(alarmInterval);
  alarmInterval = null;
  alarmActive = false;
  updateState('Focused', 'Welcome back. Stay here for five seconds to silence the alarm.');
}

function evaluateVisibility() {
  if (!sessionStartedAt) {
    return;
  }

  const now = Date.now();

  if (document.visibilityState === 'hidden') {
    recoverySince = null;
    if (!awaySince) {
      awaySince = now;
    }

    if (now - awaySince >= AWAY_THRESHOLD_MS) {
      startAlarm();
    } else {
      updateState('Away', 'The timer is running. Return before five minutes to stay focused.');
    }
    return;
  }

  awaySince = null;
  if (alarmActive) {
    if (!recoverySince) {
      recoverySince = now;
      updateState('Recovering', 'Stay here for five seconds to silence the alarm.', true);
    } else if (now - recoverySince >= RECOVERY_MS) {
      stopAlarm();
      recoverySince = null;
    }
  } else {
    updateState('Focused', 'This dashboard is active. Keep going.');
  }
}

function startSession() {
  sessionStartedAt = Date.now();
  awaySince = null;
  recoverySince = null;
  sessionToggle.textContent = 'End session';
  updateState('Focused', 'This dashboard is active. Keep going.');
  updateTimer();
}

function endSession() {
  sessionStartedAt = null;
  awaySince = null;
  recoverySince = null;
  if (alarmActive) {
    clearInterval(alarmInterval);
    alarmInterval = null;
    alarmActive = false;
  }
  sessionToggle.textContent = 'Start session';
  updateState('Ready', 'Start a session, then keep this tab open while you work.');
  updateTimer();
}

function loadDomains() {
  const domains = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  domainList.value = Array.isArray(domains) ? domains.join('\n') : '';
}

function saveDomains() {
  const domains = Array.from(
    new Set(domainList.value.split('\n').map(normalizeDomain).filter(Boolean))
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(domains));
  saveStatus.textContent = 'Saved.';
  setTimeout(() => {
    saveStatus.textContent = '';
  }, 1500);
}

sessionToggle.addEventListener('click', () => {
  if (sessionStartedAt) {
    endSession();
  } else {
    startSession();
  }
});
document.getElementById('save').addEventListener('click', saveDomains);
document.addEventListener('visibilitychange', evaluateVisibility);
setInterval(() => {
  updateTimer();
  evaluateVisibility();
}, 1000);
loadDomains();
