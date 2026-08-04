const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export const WAKE_WINDOW_RANGES = [
  { minWeek: 0, maxWeek: 4, minMinutes: 30, maxMinutes: 60, ageLabel: '0-4 tuần' },
  { minWeek: 5, maxWeek: 13, minMinutes: 60, maxMinutes: 120, ageLabel: '5-13 tuần' },
  { minWeek: 14, maxWeek: 21, minMinutes: 75, maxMinutes: 150, ageLabel: '14-21 tuần' },
  { minWeek: 22, maxWeek: 30, minMinutes: 120, maxMinutes: 240, ageLabel: '22-30 tuần' },
  { minWeek: 31, maxWeek: 43, minMinutes: 150, maxMinutes: 270, ageLabel: '31-43 tuần' },
  { minWeek: 44, maxWeek: 78, minMinutes: 180, maxMinutes: 360, ageLabel: '44-78 tuần' },
];

export const DIAPER_TYPES = {
  wet: {
    label: 'Tã ướt',
    shortLabel: 'Ướt',
    icon: 'drop',
    tone: 'blue',
    color: '#2686E8',
  },
  dirty: {
    label: 'Tã bẩn',
    shortLabel: 'Bẩn',
    icon: 'poop',
    tone: 'orange',
    color: '#C06A2D',
  },
  mixed: {
    label: 'Hỗn hợp',
    shortLabel: 'Hỗn hợp',
    icon: 'sparkles',
    tone: 'green',
    color: '#18B977',
  },
};

export const DEFAULT_VACCINE_TEMPLATES = [
  { month: 0, title: 'Sơ sinh', vaccines: ['BCG', 'Viêm gan B (mũi 1)'] },
  { month: 2, title: '2 tháng', vaccines: ['6 trong 1 (mũi 1)', 'Rota (mũi 1)'] },
  { month: 3, title: '3 tháng', vaccines: ['6 trong 1 (mũi 2)', 'Rota (mũi 2)'] },
  { month: 4, title: '4 tháng', vaccines: ['6 trong 1 (mũi 3)', 'Rota (mũi 3)'] },
  { month: 6, title: '6 tháng', vaccines: ['Cúm (mũi 1)', 'Phế cầu'] },
  { month: 9, title: '9 tháng', vaccines: ['Sởi (mũi 1)'] },
  { month: 12, title: '12 tháng', vaccines: ['Viêm não Nhật Bản', 'Thủy đậu'] },
  { month: 18, title: '18 tháng', vaccines: ['Sởi - quai bị - rubella', '6 trong 1 nhắc lại'] },
];

export function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
}

export function toLocalDateInput(dateLike) {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function toLocalDatetimeInput(dateLike) {
  if (!dateLike) return '';
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return '';
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function formatTime(dateLike) {
  if (!dateLike) return '--:--';
  return new Date(dateLike).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(dateLike) {
  if (!dateLike) return '--/--';
  return new Date(dateLike).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function isToday(dateLike) {
  return new Date(dateLike) >= startOfToday();
}

export function getDurationMinutes(startAt, endAt = new Date().toISOString()) {
  if (!startAt) return 0;
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return 0;
  return Math.round((end - start) / 60000);
}

export function formatDuration(minutes) {
  const safeMinutes = Math.max(0, minutes || 0);
  const hours = Math.floor(safeMinutes / 60);
  const mins = safeMinutes % 60;
  if (hours <= 0) return `${mins}m`;
  if (mins <= 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatLiveDuration(startAt, nowMs = Date.now()) {
  if (!startAt) return '--:--:--';
  const startMs = new Date(startAt).getTime();
  if (Number.isNaN(startMs)) return '--:--:--';

  const totalSeconds = Math.max(0, Math.floor((nowMs - startMs) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function parseBirthDate(dateLike) {
  if (!dateLike) return null;
  const match = String(dateLike).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12)
    : new Date(dateLike);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getBabyAgeWeeks(birthDate, nowMs = Date.now()) {
  const birth = parseBirthDate(birthDate);
  if (!birth) return null;
  const now = new Date(nowMs);
  now.setHours(12, 0, 0, 0);
  const ageWeeks = Math.floor((now.getTime() - birth.getTime()) / WEEK_MS);
  return ageWeeks < 0 ? null : ageWeeks;
}

export function getWakeWindowForAge(birthDate, nowMs = Date.now()) {
  const ageWeeks = getBabyAgeWeeks(birthDate, nowMs);
  if (ageWeeks === null) return null;
  const range = WAKE_WINDOW_RANGES.find(item => ageWeeks >= item.minWeek && ageWeeks <= item.maxWeek);
  return range ? { ...range, ageWeeks } : null;
}

function formatWakeMinutes(minutes) {
  if (minutes < 60) return `${minutes} phút`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining ? `${hours} giờ ${remaining} phút` : `${hours} giờ`;
}

export function formatWakeWindowRange(range) {
  if (!range) return 'Chưa có ngưỡng';
  return `${formatWakeMinutes(range.minMinutes)} - ${formatWakeMinutes(range.maxMinutes)}`;
}

export function addMonths(dateLike, months) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== day) date.setDate(0);
  return date;
}

export function daysUntil(dateLike) {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - startOfToday().getTime()) / 86400000);
}

export function generateVaccineSchedule(babyBirthDate, existing = []) {
  if (!babyBirthDate) return existing || [];
  const existingById = new Map((existing || []).map(item => [item.id, item]));

  return DEFAULT_VACCINE_TEMPLATES.map((template) => {
    const dueDate = addMonths(babyBirthDate, template.month);
    const id = `default-${template.month}-${template.title.toLowerCase().replace(/\s+/g, '-')}`;
    const oldItem = existingById.get(id);

    return {
      id,
      title: template.title,
      ageMonths: template.month,
      vaccineNames: template.vaccines,
      dueDate: dueDate ? toLocalDateInput(dueDate) : '',
      status: oldItem?.status || (template.month <= 3 ? 'done' : 'pending'),
      givenAt: oldItem?.givenAt || (template.month <= 3 && dueDate ? toLocalDateInput(dueDate) : ''),
      note: oldItem?.note || '',
      updatedAt: oldItem?.updatedAt || new Date().toISOString(),
    };
  });
}

export function getNextVaccine(vaccines = []) {
  return [...vaccines]
    .filter(item => item.status !== 'done')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0] || null;
}

export function getLast7DayStats(items, getDate, getValue = () => 1) {
  return Array.from({ length: 7 }, (_, index) => {
    const day = startOfToday();
    day.setDate(day.getDate() - (6 - index));
    const key = toLocalDateInput(day);
    const total = items
      .filter(item => toLocalDateInput(getDate(item)) === key)
      .reduce((sum, item) => sum + getValue(item), 0);

    return {
      key,
      label: index === 6 ? 'Hôm nay' : day.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', ''),
      total,
      active: index === 6,
    };
  });
}
