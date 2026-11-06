function normalizeDomain(input) {
  return input.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

async function loadDomains() {
  const { focusDomains } = await chrome.storage.sync.get({ focusDomains: [] });
  document.getElementById('domain-list').value = focusDomains.join('\n');
}

async function saveDomains() {
  const textarea = document.getElementById('domain-list');
  const status = document.getElementById('status');

  const uniqueDomains = Array.from(
    new Set(
      textarea.value
        .split('\n')
        .map(normalizeDomain)
        .filter(Boolean)
    )
  );

  await chrome.storage.sync.set({ focusDomains: uniqueDomains });

  status.textContent = 'Saved.';
  setTimeout(() => {
    status.textContent = '';
  }, 1500);
}

document.getElementById('save').addEventListener('click', saveDomains);

document.addEventListener('DOMContentLoaded', loadDomains);
