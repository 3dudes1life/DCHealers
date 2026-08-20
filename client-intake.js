const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyxsAc-7MjnHIHex4uRz35GA2CF5122mPgLtre3qxMfGbFqQ-qcNKLz-ke3gf-l1Xos/exec";
const form = document.getElementById('client-intake-form');
const errorBox = document.getElementById('formError');
const successBox = document.getElementById('formSuccess');
let submitting = false;
let activeSubmissionId = '';
const SUBMITTED_SESSION_KEY = 'dc-healers-intake-submitted';

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

function showSuccess() {
  submitting = false;
  form.querySelectorAll('section, .submit-panel').forEach(element => element.classList.add('hidden'));
  successBox.classList.remove('hidden');
  successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

const today = localDate();
document.getElementById('consentDateDisplay').value = today;
document.getElementById('consentDate').value = today;

// If the page is refreshed after a submission, keep the receipt visible instead
// of presenting a fresh Submit button that could create a second intake.
if (sessionStorage.getItem(SUBMITTED_SESSION_KEY) === 'yes') {
  showSuccess();
}

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

  // The form posts to a hidden Google Apps Script frame. Safari may block the
  // cross-site confirmation message even when Google successfully stores and
  // emails the intake. Keep the button locked and show a receipt after the post
  // has had time to leave the page; never encourage an accidental duplicate.
  sessionStorage.setItem(SUBMITTED_SESSION_KEY, 'yes');
  setTimeout(showSuccess, 2500);
});

window.addEventListener('message', event => {
  const data = event.data;
  if (!submitting || !data || data.source !== 'dc-healers-intake' || data.submissionId !== activeSubmissionId) return;

  if (data.status !== 'success') {
    // Do not unlock the form: Google may already have stored it. The server-side
    // submission ID check protects the Sheet, and Daniel can follow up directly.
    showSuccess();
    return;
  }

  showSuccess();
});
