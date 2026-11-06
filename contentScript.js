let alarmInterval = null;
let audioContext = null;

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }

  return audioContext;
}

function beep() {
  const context = ensureAudioContext();
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
  if (alarmInterval) {
    return;
  }

  beep();
  alarmInterval = setInterval(beep, 700);
}

function stopAlarm() {
  if (alarmInterval) {
    clearInterval(alarmInterval);
    alarmInterval = null;
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'START_ALARM') {
    startAlarm();
  }

  if (message.type === 'STOP_ALARM') {
    stopAlarm();
  }
});
