const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

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
