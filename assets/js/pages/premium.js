import { requireAuth, isActivePremium } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getMyProfile } from '../services/profile.service.js';
import { PLANS, METHODS, createPayment, myPayments } from '../services/payment.service.js';
import { showToast } from '../utils/toast.js';
import { setLoading } from '../utils/ui.js';
import { taka, fmtDate, esc } from '../utils/formatters.js';

const { user } = await requireAuth(['USER']);
initShell({ active: 'premium', title: 'Premium membership', user });

const form = document.getElementById('payForm');
const $ = id => document.getElementById(id);

// Plan + method cards render
const startPlan = (new URLSearchParams(location.search).get('plan') || 'YEARLY').toUpperCase();
$('plans').innerHTML = Object.entries(PLANS).map(([k, p]) => `
  <label class="pick"><input type="radio" name="plan" value="${k}" ${k === startPlan ? 'checked' : ''}>
    <span class="box"><b>${p.label}</b><span class="amt">${taka(p.price)}</span><small>${p.save || '&nbsp;'}</small></span></label>`).join('');
$('methods').innerHTML = Object.entries(METHODS).map(([k, m], i) => `
  <label class="pick"><input type="radio" name="method" value="${k}" ${i === 0 ? 'checked' : ''}>
    <span class="box"><i class="fas ${m.icon}"></i><b>${m.label}</b></span></label>`).join('');

function summary() {
  const plan = PLANS[form.plan.value], m = METHODS[form.method.value];
  $('sPlan').textContent = plan.label;
  $('sMonths').textContent = plan.months + (plan.months === 1 ? ' month' : ' months');
  $('sTotal').textContent = taka(plan.price);
  $('howPay').innerHTML = `<b>How to pay with ${m.label}</b><ol>
    <li>${m.how}.</li><li>Send <code>${taka(plan.price)}</code> to <code>${esc(m.to)}</code>.</li>
    <li>Copy the transaction ID and paste it below.</li></ol>`;
}
form.addEventListener('change', summary);
summary();

// Current status
const [profile, payments] = await Promise.all([getMyProfile(user.id), myPayments(user.id)]);
const pending = payments.find(p => p.payment_status === 'PENDING');
const note = $('note');
if (isActivePremium(profile)) {
  note.className = 'notice ok'; note.innerHTML = '<i class="fas fa-circle-check"></i><div><b>You are a premium member.</b> Your plan is active until ' + fmtDate(profile.premium_until) + '. Paying again extends it.</div>';
} else if (pending) {
  note.className = 'notice warn'; note.innerHTML = '<i class="fas fa-hourglass-half"></i><div><b>Payment in review.</b> We are checking transaction ' + esc(pending.transaction_id) + '. This usually takes a few hours.</div>';
} else note.remove();

form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!profile) return showToast('Create your profile before upgrading.', 'error');
  const txn = form.txn.value.trim().toUpperCase();
  if (!/^[A-Z0-9-]{6,40}$/.test(txn)) return showToast('Enter a valid transaction ID (letters and numbers).', 'error');
  const btn = $('submitBtn');
  setLoading(btn, true, 'Submitting...');
  try {
    await createPayment({ userId: user.id, plan: form.plan.value, method: form.method.value, transactionId: txn });
    showToast('Payment submitted for review', 'success');
    setTimeout(() => { location.href = 'my-payments.html'; }, 800);
  } catch (err) { showToast(err.message, 'error'); setLoading(btn, false); }
});
if (!profile) showToast('Create your profile first so premium can be activated.', 'info');
