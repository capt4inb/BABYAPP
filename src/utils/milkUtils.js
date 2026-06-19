// ============================================================
//  milkUtils.js – Smart Milk Storage Logic (CDC Guidelines)
// ============================================================

// ── CDC Expiry Rules (conservative) ──────────────────────────
export const MILK_RULES = {
  ROOM_TEMP_HOURS: 4,        // 4h ở nhiệt độ phòng
  FRIDGE_HOURS: 96,          // 4 ngày ngăn mát (96h)
  FREEZER_WARN_MONTHS: 6,    // 6 tháng: tốt nhất
  FREEZER_MAX_MONTHS: 12,    // 12 tháng: hết hạn cứng
  THAWED_HOURS: 24,          // 24h sau khi tan hoàn toàn
  WARMED_HOURS: 2,           // 2h sau khi hâm / đưa ra ngoài
};

// Recommend thawing tonight at this hour (21:00)
const THAW_HOUR = 21;

// ── Status Labels & Colors ────────────────────────────────────
export const STATUS_CONFIG = {
  room_temp: {
    label: 'Để ngoài',
    emoji: '🌡️',
    color: '#FF9A5C',
    bg: '#FFF7F2',
    border: '#FFCBA4',
    priority: 1,
  },
  fridge: {
    label: 'Ngăn mát',
    emoji: '❄️',
    color: '#4FACFE',
    bg: '#F0F8FF',
    border: '#A8D8FE',
    priority: 3,
  },
  freezer: {
    label: 'Ngăn đông',
    emoji: '🧊',
    color: '#9B59B6',
    bg: '#FBF5FF',
    border: '#D7BDE2',
    priority: 4,
  },
  thawing: {
    label: 'Đang rã đông',
    emoji: '💧',
    color: '#00C9A7',
    bg: '#F0FDFC',
    border: '#A8E6E2',
    priority: 2,
  },
  thawed: {
    label: 'Đã rã đông',
    emoji: '✅',
    color: '#00C9A7',
    bg: '#F0FDFC',
    border: '#A8E6E2',
    priority: 2,
  },
  warmed: {
    label: 'Đã hâm',
    emoji: '🔥',
    color: '#FF6B6B',
    bg: '#FFF5F5',
    border: '#FFB3B3',
    priority: 0,
  },
  using: {
    label: 'Đang dùng',
    emoji: '🍼',
    color: '#FF6B9D',
    bg: '#FFF0F6',
    border: '#FFB3CC',
    priority: -10,
  },
  used: {
    label: 'Đã dùng',
    emoji: '✔️',
    color: '#8E7DAE',
    bg: '#F8F4FF',
    border: '#D7BDE2',
    priority: 99,
  },
  expired: {
    label: 'Hết hạn',
    emoji: '⚠️',
    color: '#FF6B6B',
    bg: '#FFF5F5',
    border: '#FFB3B3',
    priority: 98,
  },
};

// ── Expiry Calculation ────────────────────────────────────────
/**
 * Calculate expiry_at based on current status and relevant timestamps.
 * Returns ISO string or null for freezer (uses warning logic instead).
 */
export function calculateExpiry(bag) {
  const {
    storage_status,
    expressed_at,
    fully_thawed_at,
    warmed_at,
  } = bag;

  switch (storage_status) {
    case 'room_temp': {
      const base = new Date(expressed_at);
      base.setHours(base.getHours() + MILK_RULES.ROOM_TEMP_HOURS);
      return base.toISOString();
    }
    case 'fridge': {
      const base = new Date(expressed_at);
      base.setHours(base.getHours() + MILK_RULES.FRIDGE_HOURS);
      return base.toISOString();
    }
    case 'freezer': {
      // Hard expire at 12 months
      const base = new Date(expressed_at);
      base.setMonth(base.getMonth() + MILK_RULES.FREEZER_MAX_MONTHS);
      return base.toISOString();
    }
    case 'thawing':
      // No countdown until fully thawed
      return null;
    case 'thawed': {
      if (!fully_thawed_at) return null;
      const base = new Date(fully_thawed_at);
      base.setHours(base.getHours() + MILK_RULES.THAWED_HOURS);
      return base.toISOString();
    }
    case 'using':
    case 'warmed': {
      const base = warmed_at ? new Date(warmed_at) : new Date();
      base.setHours(base.getHours() + MILK_RULES.WARMED_HOURS);
      return base.toISOString();
    }
    default:
      return null;
  }
}

// ── Time Remaining ────────────────────────────────────────────
/**
 * Returns remaining time info from an expiry ISO string.
 */
export function getTimeRemaining(expiryAt) {
  if (!expiryAt) return null;
  const diffMs = new Date(expiryAt) - Date.now();
  if (diffMs <= 0) return { expired: true, label: 'Đã hết hạn', hours: 0, minutes: 0, urgent: true };

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  let label;
  if (days > 0) {
    label = remHours > 0 ? `${days} ngày ${remHours} giờ` : `${days} ngày`;
  } else if (hours > 0) {
    label = minutes > 0 ? `${hours} giờ ${minutes} phút` : `${hours} giờ`;
  } else {
    label = `${minutes} phút`;
  }

  const urgent = hours < 2;       // đỏ
  const warning = hours < 12;     // cam

  return { expired: false, label, hours, minutes, days, urgent, warning };
}

// ── Freezer Age ───────────────────────────────────────────────
export function getFreezerAge(bag) {
  if (bag.storage_status !== 'freezer') return null;
  const diffMs = Date.now() - new Date(bag.expressed_at).getTime();
  const days = Math.floor(diffMs / 86400000);
  const months = Math.floor(days / 30);
  const warnExpired = months >= MILK_RULES.FREEZER_WARN_MONTHS;
  const hardExpired = months >= MILK_RULES.FREEZER_MAX_MONTHS;

  let label;
  if (months >= 2) label = `${months} tháng`;
  else if (days >= 1) label = `${days} ngày`;
  else label = 'Hôm nay';

  return { days, months, warnExpired, hardExpired, label };
}

// ── Priority Score (lower = use first) ───────────────────────
export function getPriorityScore(bag) {
  const status = bag.storage_status;

  if (status === 'using') return -10;
  if (status === 'warmed') return 0;

  if (status === 'thawed') {
    // Sort by expiry ascending (sắp hết hạn nhất lên trước)
    const exp = bag.expiry_at ? new Date(bag.expiry_at).getTime() : Infinity;
    return 100 + exp;
  }

  if (status === 'thawing') {
    return 200;
  }

  if (status === 'room_temp') {
    const exp = bag.expiry_at ? new Date(bag.expiry_at).getTime() : Infinity;
    return 300 + exp;
  }

  if (status === 'fridge') {
    const exp = bag.expiry_at ? new Date(bag.expiry_at).getTime() : Infinity;
    return 400 + exp / 1e10;
  }

  if (status === 'freezer') {
    // FIFO: oldest expressed first
    return 500 + new Date(bag.expressed_at).getTime() / 1e13;
  }

  return 9999;
}

// ── Sort by Priority ──────────────────────────────────────────
export function getSortedByPriority(bags) {
  return [...bags]
    .filter(b => b.storage_status !== 'used' && b.storage_status !== 'expired')
    .sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
}

// ── Average Daily ml from feed records ───────────────────────
/**
 * Calculate average daily intake (ml) from the last N days of feed records.
 */
export function getAvgDailyMl(feedRecords, days = 7) {
  if (!feedRecords || feedRecords.length === 0) return 0;
  const cutoff = Date.now() - days * 86400000;
  const recent = feedRecords.filter(
    r => r.type === 'feed' && r.volume > 0 && new Date(r.timestamp).getTime() >= cutoff
  );
  if (recent.length === 0) return 0;

  // Group by day
  const byDay = {};
  recent.forEach(r => {
    const day = new Date(r.timestamp).toDateString();
    byDay[day] = (byDay[day] || 0) + (r.volume || 0);
  });

  const totals = Object.values(byDay);
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((a, b) => a + b, 0) / totals.length);
}

// ── Available ml from fridge (still valid tomorrow) ──────────
export function getFridgeAvailableMl(bags) {
  const tomorrow = Date.now() + 86400000;
  return bags
    .filter(b => b.storage_status === 'fridge' && b.expiry_at && new Date(b.expiry_at).getTime() > tomorrow)
    .reduce((s, b) => s + (b.volume_ml || 0), 0);
}

// ── Available ml from thawed (still valid) ───────────────────
export function getThawedAvailableMl(bags) {
  return bags
    .filter(b => b.storage_status === 'thawed' && b.expiry_at && new Date(b.expiry_at).getTime() > Date.now())
    .reduce((s, b) => s + (b.volume_ml || 0), 0);
}

// ── Smart Thaw Recommendation ─────────────────────────────────
/**
 * Returns a recommendation object for which bags to thaw, when, and why.
 *
 * @param {Array} milkBags - All milk bags
 * @param {number} avgDailyMl - Average daily intake from feed records
 * @returns {Object|null}
 */
export function getThawRecommendation(milkBags, avgDailyMl) {
  if (!avgDailyMl || avgDailyMl === 0) return null;

  const fridgeMl = getFridgeAvailableMl(milkBags);
  const thawedMl = getThawedAvailableMl(milkBags);
  const currentlyThawingMl = milkBags
    .filter(b => b.storage_status === 'thawing')
    .reduce((s, b) => s + (b.volume_ml || 0), 0);

  const available = fridgeMl + thawedMl + currentlyThawingMl;
  const needed = avgDailyMl - available;

  if (needed <= 0) return null;

  // Pick oldest freezer bags (FIFO)
  const frozenBags = milkBags
    .filter(b => b.storage_status === 'freezer')
    .sort((a, b) => new Date(a.expressed_at) - new Date(b.expressed_at));

  if (frozenBags.length === 0) return null;

  const toThaw = [];
  let collected = 0;
  for (const bag of frozenBags) {
    if (collected >= needed) break;
    toThaw.push(bag);
    collected += bag.volume_ml || 0;
  }

  if (toThaw.length === 0) return null;

  // Suggest tonight at THAW_HOUR:00 (if already past, suggest now)
  const now = new Date();
  let thawTime = new Date();
  thawTime.setHours(THAW_HOUR, 0, 0, 0);
  if (thawTime <= now) {
    // Already past tonight's time, suggest now
    thawTime = now;
  }

  const thawTimeLabel = thawTime <= now
    ? 'ngay bây giờ'
    : `tối nay lúc ${THAW_HOUR}:00`;

  const thawDateLabel = thawTime <= now
    ? 'Ngay bây giờ'
    : formatDateTime(thawTime);

  return {
    neededMl: Math.round(needed),
    availableMl: Math.round(available),
    avgDailyMl,
    toThaw,
    thawTime,
    thawTimeLabel,
    thawDateLabel,
    totalToThawMl: toThaw.reduce((s, b) => s + (b.volume_ml || 0), 0),
  };
}

// ── Helpers ───────────────────────────────────────────────────
export function formatDateTime(date) {
  const d = new Date(date);
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

export function formatTime(date) {
  return new Date(date).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatDateShort(date) {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit',
  });
}

/**
 * Create a new milk bag object with auto-calculated expiry.
 */
export function createMilkBag({ volume_ml, expressed_at, storage_status, note }) {
  const bag = {
    id: crypto.randomUUID(),
    volume_ml: Number(volume_ml),
    expressed_at: new Date(expressed_at).toISOString(),
    storage_status,
    thaw_method: null,
    thaw_started_at: null,
    fully_thawed_at: null,
    warmed_at: null,
    fed_at: null,
    expiry_at: null,
    note: note || '',
  };
  bag.expiry_at = calculateExpiry(bag);
  return bag;
}

/**
 * Transition bag to new status. Returns updated bag with new expiry.
 */
export function transitionBag(bag, newStatus, extra = {}) {
  const now = new Date().toISOString();
  const updated = { ...bag, storage_status: newStatus, ...extra };

  switch (newStatus) {
    case 'thawing':
      updated.thaw_started_at = now;
      updated.expiry_at = null; // wait for fully_thawed_at
      break;
    case 'thawed':
      updated.fully_thawed_at = extra.fully_thawed_at || now;
      updated.expiry_at = calculateExpiry(updated);
      break;
    case 'using':
      updated.warmed_at = extra.warmed_at || bag.warmed_at || now;
      updated.expiry_at = calculateExpiry(updated);
      break;
    case 'warmed':
      updated.warmed_at = now;
      updated.expiry_at = calculateExpiry(updated);
      break;
    case 'used':
      updated.fed_at = now;
      updated.expiry_at = null;
      break;
    case 'expired':
      updated.expiry_at = null;
      break;
    case 'fridge':
    case 'freezer':
    case 'room_temp':
      updated.expiry_at = calculateExpiry(updated);
      break;
    default:
      break;
  }

  return updated;
}

// ── Dashboard Summary ─────────────────────────────────────────
export function getMilkSummary(milkBags) {
  const active = milkBags.filter(b => b.storage_status !== 'used' && b.storage_status !== 'expired');

  const totalMl = active.reduce((s, b) => s + (b.volume_ml || 0), 0);

  const usableTodayMl = active
    .filter(b => ['room_temp', 'fridge', 'thawed', 'warmed', 'using'].includes(b.storage_status))
    .filter(b => !b.expiry_at || new Date(b.expiry_at) > new Date())
    .reduce((s, b) => s + (b.volume_ml || 0), 0);

  const expiringSoon = active.filter(b => {
    if (!b.expiry_at) return false;
    const remaining = getTimeRemaining(b.expiry_at);
    return remaining && !remaining.expired && remaining.hours < 24;
  });

  const needsThawing = active.filter(b => b.storage_status === 'thawing');

  const urgentBags = active.filter(b => {
    if (!b.expiry_at) return false;
    const remaining = getTimeRemaining(b.expiry_at);
    return remaining && !remaining.expired && remaining.hours < 2;
  });

  return {
    totalMl,
    usableTodayMl,
    expiringSoonCount: expiringSoon.length,
    needsThawingCount: needsThawing.length,
    urgentBags,
    activeBagCount: active.length,
  };
}
