/**
 * EcoRoute Client Application
 * Connects frontend interactive UI with Express REST Backend API
 */

// Application State
const state = {
  currentMode: 'walk',
  distanceKm: 5.0,
  modes: {
    walk: { name: 'Walking', icon: 'fa-person-walking', pointsPerKm: 15, co2PerKm: 0, caloriesPerKm: 65, colorClass: 'mode-walk' },
    cycle: { name: 'Cycling', icon: 'fa-bicycle', pointsPerKm: 12, co2PerKm: 0, caloriesPerKm: 45, colorClass: 'mode-cycle' },
    bus: { name: 'Public Transit / Bus', icon: 'fa-bus', pointsPerKm: 8, co2PerKm: 0.068, caloriesPerKm: 15, colorClass: 'mode-bus' }
  },
  userProfile: null,
  carBaselineKgPerKm: 0.192
};

// DOM Elements
const elements = {
  // Navigation & Profile Bar
  navProfilePill: document.getElementById('navProfilePill'),
  navAvatar: document.getElementById('navAvatar'),
  navUserName: document.getElementById('navUserName'),
  navGreenPoints: document.getElementById('navGreenPoints'),

  // Hero Profile Card
  profileAvatar: document.getElementById('profileAvatar'),
  profileName: document.getElementById('profileName'),
  profileBadgeTier: document.getElementById('profileBadgeTier'),
  profileBadgeIcon: document.getElementById('profileBadgeIcon'),
  profileJoinDate: document.getElementById('profileJoinDate'),
  profileStreak: document.getElementById('profileStreak'),
  tierProgressLabel: document.getElementById('tierProgressLabel'),
  tierProgressFill: document.getElementById('tierProgressFill'),

  // Stats Counters
  statGreenPoints: document.getElementById('statGreenPoints'),
  statCo2Saved: document.getElementById('statCo2Saved'),
  statDistance: document.getElementById('statDistance'),
  statTripsCount: document.getElementById('statTripsCount'),

  // Modes & Distance Controls
  modesContainer: document.getElementById('modesContainer'),
  modeCards: document.querySelectorAll('.mode-card'),
  distanceDisplay: document.getElementById('distanceDisplay'),
  distanceRange: document.getElementById('distanceRange'),
  distanceInput: document.getElementById('distanceInput'),
  presetChips: document.querySelectorAll('.chip-btn'),
  startLocation: document.getElementById('startLocation'),
  endLocation: document.getElementById('endLocation'),

  // Impact Preview
  calcCo2Saved: document.getElementById('calcCo2Saved'),
  calcPoints: document.getElementById('calcPoints'),
  calcCalories: document.getElementById('calcCalories'),
  footprintComparisonText: document.getElementById('footprintComparisonText'),
  modeEmissionBar: document.getElementById('modeEmissionBar'),
  modeBarText: document.getElementById('modeBarText'),
  btnLogCommute: document.getElementById('btnLogCommute'),
  btnPointsLabel: document.getElementById('btnPointsLabel'),

  // Tabs & Containers
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabPanes: document.querySelectorAll('.tab-pane'),
  tripsListContainer: document.getElementById('tripsListContainer'),
  historyCount: document.getElementById('historyCount'),
  leaderboardListContainer: document.getElementById('leaderboardListContainer'),
  rewardsPointsBalance: document.getElementById('rewardsPointsBalance'),
  btnResetDemo: document.getElementById('btnResetDemo'),
  toastContainer: document.getElementById('toastContainer')
};

// ==========================================================================
// Initialization
// ==========================================================================
document.addEventListener('DOMContentLoaded', async () => {
  setupEventListeners();
  await Promise.all([
    fetchUserProfile(),
    fetchCommuteOptions(),
    fetchTripsHistory(),
    fetchLeaderboard()
  ]);
  updateImpactCalculations();
});

// ==========================================================================
// Event Listeners Setup
// ==========================================================================
function setupEventListeners() {
  // Mode selection clicks
  elements.modeCards.forEach(card => {
    card.addEventListener('click', () => {
      elements.modeCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      state.currentMode = card.getAttribute('data-mode');
      updateImpactCalculations();
    });
  });

  // Distance range slider sync
  elements.distanceRange.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    state.distanceKm = val;
    elements.distanceInput.value = val;
    elements.distanceDisplay.textContent = val.toFixed(1);
    syncPresetChips(val);
    updateImpactCalculations();
  });

  // Distance number input sync
  elements.distanceInput.addEventListener('input', (e) => {
    let val = parseFloat(e.target.value);
    if (isNaN(val) || val <= 0) val = 0.5;
    state.distanceKm = val;
    elements.distanceRange.value = Math.min(val, 30);
    elements.distanceDisplay.textContent = val.toFixed(1);
    syncPresetChips(val);
    updateImpactCalculations();
  });

  // Preset chips click
  elements.presetChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const km = parseFloat(chip.getAttribute('data-km'));
      state.distanceKm = km;
      elements.distanceRange.value = km;
      elements.distanceInput.value = km;
      elements.distanceDisplay.textContent = km.toFixed(1);
      elements.presetChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      updateImpactCalculations();
    });
  });

  // Tab switching
  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      elements.tabButtons.forEach(b => b.classList.remove('active'));
      elements.tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(`pane${capitalize(targetTab)}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Log Commute Button
  elements.btnLogCommute.addEventListener('click', handleLogCommute);

  // Reset Demo Profile Button
  elements.btnResetDemo.addEventListener('click', handleResetProfile);
}

function syncPresetChips(val) {
  elements.presetChips.forEach(chip => {
    const km = parseFloat(chip.getAttribute('data-km'));
    if (km === val) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });
}

// ==========================================================================
// Impact Calculations (Live Reactive)
// ==========================================================================
function updateImpactCalculations() {
  const modeData = state.modes[state.currentMode] || state.modes.walk;
  const dist = Math.max(0.1, state.distanceKm);

  const carBaselineKg = dist * state.carBaselineKgPerKm;
  const modeEmissionKg = dist * modeData.co2PerKm;
  const co2SavedKg = Math.max(0, carBaselineKg - modeEmissionKg);
  const greenPoints = Math.round(dist * modeData.pointsPerKm);
  const caloriesBurned = Math.round(dist * modeData.caloriesPerKm);

  // Update UI previews
  elements.calcCo2Saved.innerHTML = `${co2SavedKg.toFixed(2)} <span class="metric-unit">kg</span>`;
  elements.calcPoints.innerHTML = `+${greenPoints} <span class="metric-unit">pts</span>`;
  elements.calcCalories.innerHTML = `${caloriesBurned} <span class="metric-unit">kcal</span>`;
  elements.btnPointsLabel.textContent = greenPoints;

  // Visual emission comparison bar
  if (carBaselineKg > 0) {
    const modePercent = Math.min(100, Math.round((modeEmissionKg / carBaselineKg) * 100));
    elements.modeEmissionBar.style.width = `${modePercent}%`;
    if (modePercent === 0) {
      elements.modeBarText.textContent = '0.00 kg (100% Zero Emissions!)';
      elements.footprintComparisonText.textContent = '100% cleaner than solo car';
    } else {
      elements.modeBarText.textContent = `${modeEmissionKg.toFixed(2)} kg (${modePercent}%)`;
      elements.footprintComparisonText.textContent = `${100 - modePercent}% cleaner than solo car`;
    }
  }
}

// ==========================================================================
// API Handlers
// ==========================================================================

// 1. Fetch User Profile
async function fetchUserProfile() {
  try {
    const res = await fetch('/api/profile');
    const json = await res.json();
    if (json.success && json.data) {
      state.userProfile = json.data;
      renderUserProfile(json.data);
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

// 2. Fetch Commute Options
async function fetchCommuteOptions() {
  try {
    const res = await fetch('/api/commute-options');
    const json = await res.json();
    if (json.success) {
      if (json.carBaselineKgPerKm) state.carBaselineKgPerKm = json.carBaselineKgPerKm;
      if (json.modes) state.modes = json.modes;
    }
  } catch (err) {
    console.error('Failed to load commute options:', err);
  }
}

// 3. Fetch Trips History
async function fetchTripsHistory() {
  try {
    const res = await fetch('/api/trips');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      renderTripsHistory(json.data);
    }
  } catch (err) {
    console.error('Failed to load trips history:', err);
  }
}

// 4. Fetch Leaderboard
async function fetchLeaderboard() {
  try {
    const res = await fetch('/api/leaderboard');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      renderLeaderboard(json.data);
    }
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
  }
}

// 5. Log Commute (POST /api/trips)
async function handleLogCommute() {
  const dist = state.distanceKm;
  const startLoc = elements.startLocation.value.trim() || 'Home';
  const endLoc = elements.endLocation.value.trim() || 'Destination';

  // Loading state on button
  elements.btnLogCommute.disabled = true;
  elements.btnLogCommute.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> <span>Logging commute...</span>`;

  try {
    const res = await fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: state.currentMode,
        distanceKm: dist,
        startLocation: startLoc,
        endLocation: endLoc
      })
    });

    const result = await res.json();

    if (result.success) {
      // Trigger celebration confetti
      triggerConfetti();

      // Show toast
      showToast('Commute Logged!', `+${result.trip.pointsEarned} Green Points earned! Saved ${result.trip.co2SavedKg} kg CO₂!`);

      // Update state & profile UI
      state.userProfile = result.profile;
      renderUserProfile(result.profile, true);

      // Refresh trip list & leaderboard
      await Promise.all([fetchTripsHistory(), fetchLeaderboard()]);
    } else {
      showToast('Error', result.error || 'Failed to log commute.');
    }
  } catch (err) {
    console.error('Log commute error:', err);
    showToast('Network Error', 'Could not reach EcoRoute server.');
  } finally {
    elements.btnLogCommute.disabled = false;
    elements.btnLogCommute.innerHTML = `
      <i class="fa-solid fa-circle-check"></i>
      <span>Log Commute & Earn <span id="btnPointsLabel">${Math.round(state.distanceKm * (state.modes[state.currentMode]?.pointsPerKm || 15))}</span> Points</span>
    `;
  }
}

// 6. Reset Profile
async function handleResetProfile() {
  if (!confirm('Are you sure you want to reset demo stats to initial baseline?')) return;

  try {
    const res = await fetch('/api/profile/reset', { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      state.userProfile = json.profile;
      renderUserProfile(json.profile);
      await Promise.all([fetchTripsHistory(), fetchLeaderboard()]);
      showToast('Stats Reset', 'Profile returned to initial demo baseline.');
    }
  } catch (err) {
    console.error('Reset error:', err);
  }
}

// ==========================================================================
// Render Functions
// ==========================================================================
function renderUserProfile(profile, shouldAnimate = false) {
  if (!profile) return;

  // Header Nav Pill
  elements.navUserName.textContent = profile.name;
  if (shouldAnimate) {
    animateNumber(elements.navGreenPoints, profile.greenPoints);
    animateNumber(elements.statGreenPoints, profile.greenPoints);
  } else {
    elements.navGreenPoints.textContent = profile.greenPoints;
    elements.statGreenPoints.textContent = profile.greenPoints;
  }

  // Profile Card
  elements.profileName.textContent = profile.name;
  elements.profileBadgeTier.innerHTML = `<i class="fa-solid ${profile.badgeIcon || 'fa-tree'}"></i> ${profile.badgeTier}`;
  elements.profileJoinDate.textContent = profile.joinDate || 'September 2026';
  elements.profileStreak.textContent = profile.streakDays || 7;

  // Stats Counters
  elements.statCo2Saved.textContent = profile.totalCo2SavedKg.toFixed(1);
  elements.statDistance.textContent = profile.totalDistanceKm.toFixed(1);
  elements.statTripsCount.textContent = profile.tripsCount;

  // Tier Progress Calculation
  const nextTarget = profile.nextBadgePoints || 750;
  const progressPercent = Math.min(100, Math.round((profile.greenPoints / nextTarget) * 100));
  elements.tierProgressFill.style.width = `${progressPercent}%`;
  elements.tierProgressLabel.textContent = `${profile.greenPoints} / ${nextTarget} pts to next tier`;

  // Rewards tab points balance
  if (elements.rewardsPointsBalance) {
    elements.rewardsPointsBalance.textContent = profile.greenPoints;
  }
}

function renderTripsHistory(trips) {
  elements.historyCount.textContent = trips.length;

  if (trips.length === 0) {
    elements.tripsListContainer.innerHTML = `<div class="empty-state"><p>No trips logged yet. Select a mode & start commuting green!</p></div>`;
    return;
  }

  elements.tripsListContainer.innerHTML = trips.map(trip => {
    const modeConfig = state.modes[trip.mode] || { icon: 'fa-person-walking', colorClass: 'mode-walk' };
    const timeFormatted = formatTimeAgo(trip.timestamp);

    return `
      <div class="trip-item">
        <div class="trip-item-left">
          <div class="trip-mode-badge ${modeConfig.colorClass || ('mode-' + trip.mode)}">
            <i class="fa-solid ${modeConfig.icon}"></i>
          </div>
          <div class="trip-details">
            <div class="trip-route">${escapeHtml(trip.startLocation)} → ${escapeHtml(trip.endLocation)}</div>
            <div class="trip-meta">${trip.distanceKm} km • ${escapeHtml(trip.modeName)} • ${timeFormatted}</div>
          </div>
        </div>
        <div class="trip-item-right">
          <div class="trip-points-pill">+${trip.pointsEarned} pts</div>
          <div class="trip-co2-pill">${trip.co2SavedKg} kg CO₂ saved</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderLeaderboard(leaderboard) {
  elements.leaderboardListContainer.innerHTML = leaderboard.map(user => {
    let rankBadge = `#${user.rank}`;
    let rankClass = '';
    if (user.rank === 1) {
      rankBadge = '🥇';
      rankClass = 'gold';
    } else if (user.rank === 2) {
      rankBadge = '🥈';
    } else if (user.rank === 3) {
      rankBadge = '🥉';
    }

    return `
      <div class="leaderboard-row ${user.isCurrent ? 'current-user' : ''}">
        <div class="lb-user-info">
          <span class="lb-rank ${rankClass}">${rankBadge}</span>
          <img src="${user.avatar}" alt="${escapeHtml(user.name)}" class="lb-avatar">
          <div>
            <span class="lb-name">${escapeHtml(user.name)} ${user.isCurrent ? '(You)' : ''}</span>
            <span class="lb-badge">${escapeHtml(user.badge)}</span>
          </div>
        </div>
        <div class="lb-score">
          <div class="lb-pts">${user.points} pts</div>
          <div class="lb-co2">${user.co2SavedKg} kg CO₂</div>
        </div>
      </div>
    `;
  }).join('');
}

// Reward Redemption Helper
window.claimReward = function(title, cost) {
  if (!state.userProfile) return;
  if (state.userProfile.greenPoints < cost) {
    showToast('Insufficient Points', `You need ${cost} points for ${title}. You currently have ${state.userProfile.greenPoints} pts.`);
    return;
  }

  // Deduct points
  state.userProfile.greenPoints -= cost;
  renderUserProfile(state.userProfile, true);
  triggerConfetti();
  showToast('Reward Claimed! 🎁', `Successfully redeemed ${title} for ${cost} Green Points!`);
};

// ==========================================================================
// Animation & Utility Helpers
// ==========================================================================
function animateNumber(element, target) {
  if (!element) return;
  const current = parseInt(element.textContent.replace(/[^0-9]/g, '')) || 0;
  const duration = 600;
  const stepTime = 20;
  const steps = duration / stepTime;
  const increment = (target - current) / steps;
  let step = 0;

  const timer = setInterval(() => {
    step++;
    const nextVal = Math.round(current + increment * step);
    element.textContent = nextVal;
    if (step >= steps) {
      element.textContent = target;
      clearInterval(timer);
    }
  }, stepTime);
}

function triggerConfetti() {
  if (typeof confetti === 'function') {
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#059669', '#10B981', '#34D399', '#F59E0B', '#3B82F6']
    });
  }
}

function showToast(title, msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <i class="fa-solid fa-circle-check toast-icon"></i>
    <div class="toast-content">
      <div class="toast-title">${escapeHtml(title)}</div>
      <div class="toast-msg">${escapeHtml(msg)}</div>
    </div>
  `;
  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatTimeAgo(timestamp) {
  if (!timestamp) return 'Just now';
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  })[m]);
}
