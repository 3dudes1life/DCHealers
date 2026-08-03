/** DC Healers Client Intake -> Google Sheet + complete backup email */

const SPREADSHEET_ID = '1JeSsmTV_WYWViWrMCwiN_8CFmiPE3i8FYja986856jw';
const SHEET_NAME = 'Intake Responses';
const NOTIFICATION_EMAIL = 'daniel.castaneda@dchealers.com';

const EMAIL_FIELDS = [
  ['submissionId', 'Submission ID'],
  ['submittedDate', 'Submitted Date'],
  ['sessionType', 'Session Type'],
  ['fullName', 'Full Name'],
  ['ageConfirmed', 'Age 18+ Confirmed'],
  ['email', 'Email Address'],
  ['phone', 'Phone Number'],
  ['city', 'City'],
  ['stateRegion', 'State or Region'],
  ['country', 'Country'],
  ['preferredContact', 'Preferred Contact Method'],
  ['emergencyContactName', 'Emergency Contact Name'],
  ['emergencyContactPhone', 'Emergency Contact Phone'],
  ['referralSource', 'How They Heard About DC Healers'],
  ['primaryIntention', 'Primary Intention'],
  ['physicalFocus', 'Physical Concerns / Focus'],
  ['mentalEmotionalFocus', 'Mental / Emotional Focus'],
  ['spiritualFocus', 'Spiritual / Energetic Intentions'],
  ['medicalConditions', 'Relevant Medical Conditions'],
  ['medicationsTreatments', 'Medications / Treatments'],
  ['allergiesSensitivities', 'Allergies / Sensitivities'],
  ['previousReiki', 'Previous Reiki / Energy Work'],
  ['touchSensitivity', 'Sensitive to Touch'],
  ['touchPreference', 'Touch Preference'],
  ['accessibilityNeeds', 'Accessibility / Comfort Needs'],
  ['additionalNotes', 'Additional Notes'],
  ['reikiDisclaimerAccepted', 'Reiki Disclaimer Accepted'],
  ['resultsVaryAccepted', 'Results Vary Accepted'],
  ['emergencyStatementAccepted', 'Emergency Statement Accepted'],
  ['accuracyConfirmed', 'Accuracy Confirmed'],
  ['contactConsent', 'Contact Consent'],
  ['marketingConsent', 'Marketing Consent'],
  ['typedSignature', 'Electronic Signature'],
  ['consentDate', 'Consent Date']
];

function doGet() {
  return HtmlService.createHtmlOutput('DC Healers intake endpoint active.');
}

function doPost(e) {
  const p = e && e.parameter ? e.parameter : {};
  const submissionId = clean_(p.submissionId);

  try {
    // Hidden spam field: real visitors leave it blank.
    if (p.website) return browserReply_('success', submissionId, 'Submission received.');

    const required = [
      'submissionId', 'submittedDate', 'sessionType', 'fullName', 'ageConfirmed',
      'email', 'phone', 'city', 'stateRegion', 'country', 'preferredContact',
      'primaryIntention', 'previousReiki', 'touchSensitivity', 'touchPreference',
      'reikiDisclaimerAccepted', 'resultsVaryAccepted', 'emergencyStatementAccepted',
      'accuracyConfirmed', 'contactConsent', 'typedSignature', 'consentDate'
    ];
    const missing = required.filter(key => !clean_(p[key]));
    if (missing.length) throw new Error('Missing required fields: ' + missing.join(', '));

    const submittedDate = parseDate_(p.submittedDate, 'submittedDate');
    const consentDate = parseDate_(p.consentDate + 'T12:00:00', 'consentDate');
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      if (!sheet) throw new Error('Sheet not found: ' + SHEET_NAME);

      // Do not create a second row if a visitor double-clicks or retries.
      const duplicate = sheet.getLastRow() > 1 && sheet
        .getRange(2, 1, sheet.getLastRow() - 1, 1)
        .createTextFinder(submissionId)
        .matchEntireCell(true)
        .findNext();

      if (!duplicate) {
        sheet.appendRow([
          safeCell_(p.submissionId), submittedDate, 'New', '',
          safeCell_(p.sessionType), safeCell_(p.fullName), safeCell_(p.ageConfirmed),
          safeCell_(p.email), safeCell_(p.phone), safeCell_(p.city),
          safeCell_(p.stateRegion), safeCell_(p.country), safeCell_(p.preferredContact),
          safeCell_(p.emergencyContactName), safeCell_(p.emergencyContactPhone),
          safeCell_(p.referralSource), safeCell_(p.primaryIntention),
          safeCell_(p.physicalFocus), safeCell_(p.mentalEmotionalFocus),
          safeCell_(p.spiritualFocus), safeCell_(p.medicalConditions),
          safeCell_(p.medicationsTreatments), safeCell_(p.allergiesSensitivities),
          safeCell_(p.previousReiki), safeCell_(p.touchSensitivity),
          safeCell_(p.touchPreference), safeCell_(p.accessibilityNeeds),
          safeCell_(p.additionalNotes), safeCell_(p.reikiDisclaimerAccepted),
          safeCell_(p.resultsVaryAccepted), safeCell_(p.emergencyStatementAccepted),
          safeCell_(p.accuracyConfirmed), safeCell_(p.contactConsent),
          safeCell_(p.marketingConsent || 'No'), safeCell_(p.typedSignature),
          consentDate, ''
        ]);

        const row = sheet.getLastRow();
        sheet.getRange(row, 2).setNumberFormat('mm/dd/yyyy hh:mm');
        sheet.getRange(row, 36).setNumberFormat('mm/dd/yyyy');
        SpreadsheetApp.flush();
      }
    } finally {
      lock.releaseLock();
    }

    sendBackupEmail_(p);
    return browserReply_('success', submissionId, 'Submission received.');
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return browserReply_('error', submissionId, 'Your form could not be confirmed. Please contact Daniel.');
  }
}

function sendBackupEmail_(values) {
  const name = clean_(values.fullName) || 'New client';
  const rows = EMAIL_FIELDS.map(field => {
    const value = escapeHtml_(clean_(values[field[0]]) || 'Not provided').replace(/\n/g, '<br>');
    return '<tr><td style="padding:8px;border:1px solid #d8e2dd;font-weight:700;vertical-align:top;width:34%">' +
      escapeHtml_(field[1]) + '</td><td style="padding:8px;border:1px solid #d8e2dd;vertical-align:top">' + value + '</td></tr>';
  }).join('');
  const plain = EMAIL_FIELDS.map(field => field[1] + ': ' + (clean_(values[field[0]]) || 'Not provided')).join('\n\n');

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: 'New DC Healers Client Intake: ' + name,
    body: plain,
    htmlBody: '<div style="font-family:Arial,sans-serif;color:#18352d;max-width:760px"><h2>New DC Healers Client Intake</h2><p><strong>' +
      escapeHtml_(name) + '</strong> submitted a client intake.</p><table style="border-collapse:collapse;width:100%">' +
      rows + '</table><p style="color:#5b6e66;font-size:12px">Private backup copy · Submission ID: ' +
      escapeHtml_(clean_(values.submissionId)) + '</p></div>',
    replyTo: clean_(values.email) || NOTIFICATION_EMAIL,
    name: 'DC Healers Website'
  });
}

function clean_(value) {
  return value == null ? '' : String(value).trim().substring(0, 5000);
}

function safeCell_(value) {
  const text = clean_(value);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function parseDate_(value, fieldName) {
  const date = new Date(value);
  if (isNaN(date.getTime())) throw new Error('Invalid ' + fieldName);
  return date;
}

function escapeHtml_(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function browserReply_(status, submissionId, message) {
  const payload = JSON.stringify({
    source: 'dc-healers-intake',
    status: status,
    submissionId: submissionId,
    message: message
  }).replace(/</g, '\\u003c');

  return HtmlService.createHtmlOutput(
    '<!doctype html><html><body><p>' + escapeHtml_(message) + '</p>' +
    '<script>window.parent.postMessage(' + payload + ', "*");<\/script></body></html>'
  ).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
