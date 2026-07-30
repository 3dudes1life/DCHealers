const APPS_SCRIPT_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
const form=document.getElementById('client-intake-form');
const frame=document.getElementById('intake-submit-frame');
const errorBox=document.getElementById('formError');
const successBox=document.getElementById('formSuccess');
const submitPanel=document.getElementById('submitPanel');
let submitting=false;
function localDate(){const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)}
function submissionId(){return crypto.randomUUID?crypto.randomUUID():`DCH-${Date.now()}-${Math.random().toString(36).slice(2,8)}`}
function showError(msg){errorBox.textContent=msg;errorBox.classList.remove('hidden');errorBox.scrollIntoView({behavior:'smooth',block:'center'})}
const today=localDate();document.getElementById('consentDateDisplay').value=today;document.getElementById('consentDate').value=today;
form.addEventListener('submit',e=>{errorBox.classList.add('hidden');if(APPS_SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbxAqWZDWKPCXoqzqc5xsbok2zwAnq_it3vLcsJZH39cEt5VNktrB_Uk0bzTIDC5dlliSg/exec')){e.preventDefault();showError('The secure form connection has not been activated yet. Please contact Daniel.');return}if(!form.checkValidity()){e.preventDefault();form.reportValidity();showError('Please complete every required field.');return}document.getElementById('submissionId').value=submissionId();document.getElementById('submittedDate').value=new Date().toISOString();document.getElementById('consentDate').value=document.getElementById('consentDateDisplay').value;form.action=APPS_SCRIPT_URL;submitting=true;const b=form.querySelector('button[type=submit]');b.disabled=true;b.querySelector('.button-label').hidden=true;b.querySelector('.button-loading').hidden=false;});
frame.addEventListener('load',()=>{if(!submitting)return;submitting=false;form.querySelectorAll('section, .submit-panel').forEach(el=>el.classList.add('hidden'));successBox.classList.remove('hidden');successBox.scrollIntoView({behavior:'smooth',block:'center'});});
