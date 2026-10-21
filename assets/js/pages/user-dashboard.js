import { requireAuth, isActivePremium } from '../utils/guard.js';
import { initShell } from '../components/sidebar.js';
import { getMyProfile, listProfiles, completion } from '../services/profile.service.js';
import { myPayments } from '../services/payment.service.js';
import { profileCard, skeletonCards, emptyState } from '../components/profile-card.js';
import { esc, fmtDate } from '../utils/formatters.js';

const { user } = await requireAuth(['USER']);
initShell({ active: 'dashboard', title: 'Dashboard', user });

const $ = id => document.getElementById(id);
$('matches').innerHTML = skeletonCards(4);

try {
  const [profile, payments] = await Promise.all([getMyProfile(user.id), myPayments(user.id)]);
  const pct = completion(profile);
  const first = (profile?.full_name || user.user_metadata?.full_name || 'there').split(' ')[0];
  const premium = isActivePremium(profile);
  const pending = payments.find(p => p.payment_status === 'PENDING');

  $('hello').textContent = 'Welcome, ' + first;
  $('helloText').textContent = !profile
    ? 'Create your profile so families can find you. It takes about three minutes.'
    : pct < 100 ? 'Your profile is ' + pct + '% complete. Add the rest to get more interest.' : 'Your profile is complete. Browse new matches today.';
  const cta = $('helloCta');
  cta.href = profile ? 'edit-profile.html' : 'create-profile.html';
  cta.innerHTML = profile ? '<i class="fas fa-pen"></i> Update profile' : '<i class="fas fa-id-card"></i> Create profile';
  $('pct').textContent = pct + '%';
  requestAnimationFrame(() => requestAnimationFrame(() => $('ring').style.setProperty('--p', pct)));

  // Status rows
  const vState = profile?.is_verified ? ['Verified', 'badge-verified'] : profile ? ['In review', 'badge-pending'] : ['Not started', 'badge-muted'];
  const vText = profile?.is_verified ? 'Your profile shows the verified badge.' : profile ? 'Our staff will review your profile soon.' : 'Create your profile to start verification.';
  const mState = premium ? ['Premium', 'badge-premium'] : pending ? ['Payment in review', 'badge-pending'] : ['Free', 'badge-muted'];
  const mText = premium ? 'Active until ' + fmtDate(profile.premium_until) + '.' : pending ? 'We are confirming your transaction.' : 'Upgrade to see contact details.';
  $('status').innerHTML = `
    <li><span class="s-ico"><i class="fas fa-id-card"></i></span><div class="s-body"><b>Profile</b><small>${profile ? 'Created ' + fmtDate(profile.created_at) : 'You have not created a profile yet.'}</small></div><span class="badge ${profile ? 'badge-paid' : 'badge-muted'}">${profile ? 'Created' : 'Missing'}</span></li>
    <li><span class="s-ico"><i class="fas fa-shield-heart"></i></span><div class="s-body"><b>Verification</b><small>${vText}</small></div><span class="badge ${vState[1]}">${vState[0]}</span></li>
    <li><span class="s-ico"><i class="fas fa-crown"></i></span><div class="s-body"><b>Membership</b><small>${mText}</small></div><span class="badge ${mState[1]}">${mState[0]}</span></li>`;

  // Suggested matches
  if (!profile) {
    $('matches').className = '';
    $('matches').innerHTML = emptyState('fa-user-plus', 'Create your profile first', 'We suggest matches once we know what you are looking for.', '<a class="btn btn-primary" href="create-profile.html">Create profile</a>');
  } else {
    const gender = profile.gender === 'MALE' ? 'FEMALE' : 'MALE';
    const { rows } = await listProfiles({ gender }, 1, user.id);
    $('matches').innerHTML = rows.length
      ? rows.slice(0, 4).map(profileCard).join('')
      : emptyState('fa-heart', 'No matches yet', 'New profiles are added every day. Check back soon.');
    $('matches').classList.toggle('cards', rows.length > 0);
  }
} catch (err) {
  $('matches').className = '';
  $('matches').innerHTML = emptyState('fa-triangle-exclamation', 'Could not load your dashboard', esc(err.message));
}
