import { useMemo, useState } from 'react';
import {
  GROWTH_METRICS,
  WHO_GROWTH_STANDARDS,
  evaluateGrowthValue,
  getAgeMonths,
  normalizeGender,
} from '../data/whoGrowthStandards';
import { getDurationMinutes, toLocalDateInput } from '../utils/careUtils';
import GameIcon from './GameIcon';

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

const RANGE_OPTIONS = [
  { value: '7d', label: '7 ngày', days: 7, months: 6 },
  { value: '1m', label: '1 tháng', days: 30, months: 12 },
  { value: '6m', label: '6 tháng', days: 180, months: 18 },
  { value: '12m', label: '12 tháng', days: 365, months: 24 },
];

function formatNumber(value, decimals = 0) {
  if (value == null || value === '' || Number.isNaN(Number(value))) return '--';
  return NUMBER_FORMATTER.format(Number(value).toFixed(decimals));
}

function formatDateShort(dateLike) {
  return new Date(dateLike).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getMetricValue(record, metric) {
  if (metric === 'weight') return record.weight;
  if (metric === 'height') return record.height;
  if (metric === 'head') return record.headCircumference ?? record.head;
  return null;
}

function getLatestMetricRecord(records, metric) {
  return [...records]
    .filter(record => record.type === 'weight' && getMetricValue(record, metric) != null)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
}

function getPreviousMetricRecord(records, metric, latestRecord) {
  if (!latestRecord) return null;
  return [...records]
    .filter(record =>
      record.type === 'weight' &&
      record.id !== latestRecord.id &&
      getMetricValue(record, metric) != null &&
      new Date(record.timestamp) < new Date(latestRecord.timestamp)
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
}

function buildBabyMetricPoints(records, settings, metric, maxMonths) {
  return records
    .filter(record => record.type === 'weight' && getMetricValue(record, metric) != null)
    .map(record => ({
      month: getAgeMonths(settings.babyBirthDate, record.timestamp),
      value: Number(getMetricValue(record, metric)),
      label: formatNumber(getMetricValue(record, metric), GROWTH_METRICS[metric].decimals),
    }))
    .filter(point => point.month != null && point.month <= maxMonths && !Number.isNaN(point.value))
    .sort((a, b) => a.month - b.month);
}

function buildRecentDailyData(items, getDate, getValue, days) {
  return Array.from({ length: Math.min(days, 14) }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (Math.min(days, 14) - 1 - index));
    const key = toLocalDateInput(day);
    const total = items
      .filter(item => toLocalDateInput(getDate(item)) === key)
      .reduce((sum, item) => sum + getValue(item), 0);

    return {
      key,
      label: formatDateShort(day),
      total,
    };
  });
}

function metricStatusClass(status) {
  if (status === 'under' || status === 'over') return 'alert';
  if (status === 'normal') return 'good';
  return '';
}

function SummaryCard({ metric, latest, previous, settings }) {
  const config = GROWTH_METRICS[metric];
  const value = latest ? Number(getMetricValue(latest, metric)) : null;
  const previousValue = previous ? Number(getMetricValue(previous, metric)) : null;
  const delta = value != null && previousValue != null ? value - previousValue : null;
  const ageMonths = latest ? getAgeMonths(settings.babyBirthDate, latest.timestamp) : getAgeMonths(settings.babyBirthDate);
  const evaluation = evaluateGrowthValue(metric, settings.babyGender, ageMonths, value);

  return (
    <article className={`indicator-summary-card ${metricStatusClass(evaluation?.status)}`}>
      <div>
        <GameIcon name={config.icon} size={30} variant={metric === 'weight' ? 'lavender' : metric === 'height' ? 'blue' : 'green'} />
        <span>{config.label}</span>
      </div>
      <strong>{formatNumber(value, config.decimals)} <small>{value != null ? config.unit : ''}</small></strong>
      <p>
        {delta == null ? 'Chưa có lần đo trước' : `${delta >= 0 ? '+' : ''}${formatNumber(delta, config.decimals)} ${config.unit}`}
      </p>
      <em>{evaluation?.label || 'Chưa đủ dữ liệu'}</em>
    </article>
  );
}

function GrowthChart({ metric, settings, records, maxMonths }) {
  const gender = normalizeGender(settings.babyGender);
  const config = GROWTH_METRICS[metric];
  const standards = WHO_GROWTH_STANDARDS[metric][gender].filter(point => point[0] <= maxMonths);
  const babyPoints = buildBabyMetricPoints(records, settings, metric, maxMonths);
  const latest = babyPoints[babyPoints.length - 1];
  const allValues = [
    ...standards.flatMap(point => [point[1], point[3]]),
    ...babyPoints.map(point => point.value),
  ];
  const minY = Math.max(0, Math.floor(Math.min(...allValues) - (metric === 'weight' ? 1 : 5)));
  const maxY = Math.ceil(Math.max(...allValues) + (metric === 'weight' ? 1 : 5));
  const width = 640;
  const height = 230;
  const pad = { top: 22, right: 18, bottom: 34, left: 42 };
  const chartW = width - pad.left - pad.right;
  const chartH = height - pad.top - pad.bottom;
  const x = (month) => pad.left + (Math.min(maxMonths, Math.max(0, month)) / maxMonths) * chartW;
  const y = (value) => pad.top + ((maxY - value) / (maxY - minY)) * chartH;
  const lowerPath = standards.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point[0])} ${y(point[1])}`).join(' ');
  const upperPath = standards.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point[0])} ${y(point[3])}`).join(' ');
  const medianPath = standards.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point[0])} ${y(point[2])}`).join(' ');
  const babyPath = babyPoints.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(point.month)} ${y(point.value)}`).join(' ');
  const bandPath = `${upperPath} ${[...standards].reverse().map(point => `L ${x(point[0])} ${y(point[1])}`).join(' ')} Z`;
  const ticks = Array.from({ length: Math.floor(maxMonths / 2) + 1 }, (_, index) => index * 2);
  const latestEvaluation = latest
    ? evaluateGrowthValue(metric, settings.babyGender, latest.month, latest.value)
    : null;

  return (
    <section className="indicator-chart-card">
      <div className="indicator-card-head">
        <div>
          <h2>{config.label}</h2>
          <span>{config.unit}</span>
        </div>
        <p className={metricStatusClass(latestEvaluation?.status)}>{latestEvaluation?.label || 'Chuẩn WHO -2SD đến +2SD'}</p>
      </div>

      <div className="indicator-legend">
        <span><i className="low" /> Ngưỡng dưới</span>
        <span><i className="high" /> Ngưỡng trên</span>
        <span><i className="baby" /> Bé</span>
      </div>

      <svg className="indicator-growth-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${config.label} so với chuẩn WHO`}>
        {[0, 1, 2, 3, 4].map(index => {
          const value = minY + ((maxY - minY) / 4) * index;
          return (
            <g key={value}>
              <line x1={pad.left} x2={width - pad.right} y1={y(value)} y2={y(value)} className="grid" />
              <text x={pad.left - 10} y={y(value) + 4} textAnchor="end">{Math.round(value)}</text>
            </g>
          );
        })}
        {ticks.map(month => (
          <g key={month}>
            <line x1={x(month)} x2={x(month)} y1={pad.top} y2={height - pad.bottom} className="grid vertical" />
            <text x={x(month)} y={height - 10} textAnchor="middle">{month}thg</text>
          </g>
        ))}
        <path d={bandPath} className="who-band" />
        <path d={lowerPath} className="line low" />
        <path d={upperPath} className="line high" />
        <path d={medianPath} className="line median" />
        {babyPath && <path d={babyPath} className="line baby" />}
        {babyPoints.map(point => (
          <g key={`${metric}-${point.month}-${point.value}`}>
            <circle cx={x(point.month)} cy={y(point.value)} r="4.5" className="baby-point" />
            <text x={x(point.month)} y={y(point.value) - 9} textAnchor="middle" className="point-label">{point.label}</text>
          </g>
        ))}
      </svg>
    </section>
  );
}

function DailyBars({ title, unit, data, tone = 'blue', reference }) {
  const max = Math.max(...data.map(item => item.total), reference || 1, 1);

  return (
    <section className="indicator-chart-card compact">
      <div className="indicator-card-head">
        <div>
          <h2>{title}</h2>
          <span>{unit}</span>
        </div>
        {reference && <p>Mốc tham khảo cố định</p>}
      </div>
      <div className={`indicator-bars ${tone}`}>
        {reference && <span className="reference-line" style={{ bottom: `${(reference / max) * 100}%` }} />}
        {data.map(item => (
          <div className="indicator-bar-col" key={item.key}>
            <strong>{item.total ? formatNumber(item.total, title === 'Thời gian ngủ' ? 1 : 0) : ''}</strong>
            <div style={{ height: `${Math.max(6, (item.total / max) * 100)}%` }} />
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function StatsTab({ records, sleeps = [], settings, onOpenWeightModal }) {
  const [range, setRange] = useState('1m');
  const selectedRange = RANGE_OPTIONS.find(item => item.value === range) || RANGE_OPTIONS[1];
  const maxMonths = Math.max(6, Math.min(24, Math.ceil(getAgeMonths(settings.babyBirthDate) || selectedRange.months, 0) || selectedRange.months));
  const weightLatest = getLatestMetricRecord(records, 'weight');
  const heightLatest = getLatestMetricRecord(records, 'height');
  const headLatest = getLatestMetricRecord(records, 'head');
  const weightPrevious = getPreviousMetricRecord(records, 'weight', weightLatest);
  const heightPrevious = getPreviousMetricRecord(records, 'height', heightLatest);
  const headPrevious = getPreviousMetricRecord(records, 'head', headLatest);
  const latestWeight = weightLatest?.weight ? Number(weightLatest.weight) : null;
  const latestHeight = heightLatest ? Number(getMetricValue(heightLatest, 'height')) : null;
  const bmi = latestWeight && latestHeight ? latestWeight / ((latestHeight / 100) ** 2) : null;
  const feedData = useMemo(
    () => buildRecentDailyData(
      records.filter(record => record.type === 'feed'),
      record => record.timestamp,
      record => record.volume || 0,
      selectedRange.days
    ),
    [records, selectedRange.days]
  );
  const sleepData = useMemo(
    () => buildRecentDailyData(
      sleeps,
      item => item.startAt,
      item => getDurationMinutes(item.startAt, item.endAt || new Date().toISOString()) / 60,
      selectedRange.days
    ),
    [sleeps, selectedRange.days]
  );

  return (
    <div className="animate-fade-in indicator-screen">
      <header className="indicator-hero">
        <div>
          <span>Chỉ số</span>
          <h1>{settings.babyName || 'Bé yêu'}</h1>
          <p>Theo dõi tăng trưởng, lượng bú và giấc ngủ trong cùng một màn.</p>
        </div>
        <button type="button" onClick={() => onOpenWeightModal()}>
          <GameIcon name="plus" size={20} variant="cream" bare />
          Cập nhật
        </button>
      </header>

      <section className="indicator-summary-grid">
        <SummaryCard metric="weight" latest={weightLatest} previous={weightPrevious} settings={settings} />
        <SummaryCard metric="height" latest={heightLatest} previous={heightPrevious} settings={settings} />
        <SummaryCard metric="head" latest={headLatest} previous={headPrevious} settings={settings} />
        <article className={`indicator-summary-card ${bmi ? 'good' : ''}`}>
          <div>
            <GameIcon name="stats" size={30} variant="lavender" />
            <span>BMI</span>
          </div>
          <strong>{formatNumber(bmi, 1)} <small>{bmi ? 'kg/m²' : ''}</small></strong>
          <p>{bmi ? 'Tính từ cân nặng và chiều cao mới nhất' : 'Cần nhập cân nặng + chiều cao'}</p>
          <em>{bmi ? 'Đã có dữ liệu' : 'Chưa đủ dữ liệu'}</em>
        </article>
      </section>

      <div className="indicator-range-tabs">
        {RANGE_OPTIONS.map(option => (
          <button
            key={option.value}
            type="button"
            className={range === option.value ? 'active' : ''}
            onClick={() => setRange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {!settings.babyBirthDate && (
        <section className="indicator-empty-note">
          <GameIcon name="calendar" size={30} variant="lavender" />
          <span>Nhập ngày sinh trong Cài đặt để so sánh theo tuổi chuẩn WHO.</span>
        </section>
      )}

      <GrowthChart metric="weight" settings={settings} records={records} maxMonths={maxMonths} />
      <GrowthChart metric="height" settings={settings} records={records} maxMonths={maxMonths} />
      <GrowthChart metric="head" settings={settings} records={records} maxMonths={maxMonths} />
      <DailyBars title="Lượng sữa" unit="ml" data={feedData} tone="blue" reference={750} />
      <DailyBars title="Thời gian ngủ" unit="giờ" data={sleepData} tone="orange" reference={10} />
      <p className="indicator-source-note">
        Chuẩn tăng trưởng dùng các mốc WHO Child Growth Standards (-2SD, median, +2SD) cho trẻ 0-24 tháng.
      </p>
    </div>
  );
}
