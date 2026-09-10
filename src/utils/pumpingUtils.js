export const DEFAULT_PUMP_INTERVAL_MINUTES = 180;

export function isValidPumpInterval(minutes) {
  return Number.isInteger(minutes) && minutes >= 1 && minutes <= 1440;
}

export function getPumpSessions(pumpingSessions) {
  return pumpingSessions
    .filter(session => session.id && session.completedAt)
    .map(session => ({ ...session, completedMs: new Date(session.completedAt).getTime() }))
    .filter(session => Number.isFinite(session.completedMs))
    .sort((a, b) => b.completedMs - a.completedMs);
}

export function getPumpReminder(sessions, schedule, nowMs) {
  const intervalMinutes = isValidPumpInterval(schedule?.intervalMinutes)
    ? schedule.intervalMinutes
    : DEFAULT_PUMP_INTERVAL_MINUTES;
  const lastSession = sessions.find(session => session.completedMs <= nowMs) || null;
  const enabled = schedule?.enabled !== false;
  const nextMs = enabled && lastSession ? lastSession.completedMs + intervalMinutes * 60000 : null;
  return {
    enabled,
    intervalMinutes,
    lastSession,
    nextMs,
    remainingMs: nextMs === null ? null : Math.max(0, nextMs - nowMs),
    overdueMs: nextMs === null ? 0 : Math.max(0, nowMs - nextMs),
    due: nextMs !== null && nowMs >= nextMs,
  };
}

export function formatPumpCountdown(milliseconds) {
  if (milliseconds === null) return '--:--:--';
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, '0')).join(':');
}

export function formatPumpInterval(minutes) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours ? `${hours} giờ` : '', rest ? `${rest} phút` : ''].filter(Boolean).join(' ');
}

export function formatPumpTime(milliseconds, nowMs) {
  const date = new Date(milliseconds);
  const sameDay = date.toDateString() === new Date(nowMs).toDateString();
  return date.toLocaleString('vi-VN', {
    hour: '2-digit', minute: '2-digit',
    ...(!sameDay && { day: '2-digit', month: '2-digit' }),
  });
}
