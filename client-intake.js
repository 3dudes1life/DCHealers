const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxAqWZDWKPCXoqzqc5xsbok2zwAnq_it3vLcsJZH39cEt5VNktrB_Uk0bzTIDC5dlliSg/exec";
const form = document.getElementById('client-intake-form');
const errorBox = document.getElementById('formError');
const successBox = document.getElementById('formSuccess');
let submitting = false;
let activeSubmissionId = '';
let confirmationTimer;

function localDate() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function makeSubmissionId() {
  return crypto.randomUUID ? crypto.randomUUID() : `DCH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.classList.remove('hidden');
  errorBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function resetSubmitButton() {
  submitting = false;
  clearTimeout(confirmationTimer);
  const button = form.querySelector('button[type=submit]');
  button.disabled = false;
  button.querySelector('.button-label').hidden = false;
  button.querySelector('.button-loading').hidden = true;
}

const today = localDate();
document.getElementById('consentDateDisplay').value = today;
document.getElementById('consentDate').value = today;

form.addEventListener('submit', event => {
  errorBox.classList.add('hidden');

  if (!APPS_SCRIPT_URL.startsWith('https://script.google.com/macros/s/') || !APPS_SCRIPT_URL.endsWith('/exec')) {
    event.preventDefault();
    showError('The secure form connection has not been activated yet. Please contact Daniel.');
    return;
  }

  if (!form.checkValidity()) {
    event.preventDefault();
    form.reportValidity();
    showError('Please complete every required field.');
    return;
  }

  activeSubmissionId = makeSubmissionId();
  document.getElementById('submissionId').value = activeSubmissionId;
  document.getElementById('submittedDate').value = new Date().toISOString();
  document.getElementById('consentDate').value = document.getElementById('consentDateDisplay').value;
  form.action = APPS_SCRIPT_URL;
  submitting = true;

  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  button.querySelector('.button-label').hidden = true;
  button.querySelector('.button-loading').hidden = false;

  confirmationTimer = setTimeout(() => {
    if (!submitting) return;
    resetSubmitButton();
    showError('We could not confirm that your form reached Daniel. Please try once more or contact Daniel directly.');
  }, 30000);
});

window.addEventListener('message', event => {
  const data = event.data;
  if (!submitting || !data || data.source !== 'dc-healers-intake' || data.submissionId !== activeSubmissionId) return;

  resetSubmitButton();
  if (data.status !== 'success') {
    showError(data.message || 'Your form could not be confirmed. Please contact Daniel.');
    return;
  }

  form.querySelectorAll('section, .submit-panel').forEach(element => element.classList.add('hidden'));
  successBox.classList.remove('hidden');
  successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
});
