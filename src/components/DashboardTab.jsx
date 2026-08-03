import { useState, useMemo } from 'react';
import { DIAPER_TYPES, formatDuration, getDurationMinutes } from '../utils/careUtils';
import GameIcon from './GameIcon';

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
}

function formatTime(dateLike) {
  return new Date(dateLike).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function timeUntilNext(lastIso, intervalHours, nowMs) {
  if (!lastIso) return null;
  const next = new Date(new Date(lastIso).getTime() + intervalHours * 3600000);
  const diffMs = next.getTime() - nowMs;
  const hrs = next.getHours().toString().padStart(2, '0');
  const mins = next.getMinutes().toString().padStart(2, '0');

  if (diffMs <= 0) {
    return { label: `${hrs}:${mins}`, overdue: true, countdownLabel: 'Đến giờ bú!' };
  }

  const diffMins = Math.floor(diffMs / 60000);
  const countdownLabel = diffMins < 60
    ? `${diffMins} phút nữa`
    : `${Math.floor(diffMins / 60)} giờ ${diffMins % 60} phút nữa`;

  return { label: `${hrs}:${mins}`, overdue: false, nextDate: next, countdownLabel };
}

function getBabyAge(babyBirthDate) {
  if (!babyBirthDate) return null;
  const birth = new Date(babyBirthDate);
  const today = new Date();
  if (Number.isNaN(birth.getTime())) return null;

  birth.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const totalDays = Math.max(0, Math.floor((today - birth) / 86400000));
  let months = (today.getFullYear() - birth.getFullYear()) * 12 + today.getMonth() - birth.getMonth();
  let anchor = new Date(birth);
  anchor.setMonth(birth.getMonth() + months);

  if (anchor > today) {
    months -= 1;
    anchor = new Date(birth);
    anchor.setMonth(birth.getMonth() + months);
  }

  const days = Math.max(0, Math.floor((today - anchor) / 86400000));
  const weeks = Math.floor(totalDays / 7);
  const weekDays = totalDays % 7;
  const compact = months > 0 ? `${months}m${days}d` : `${totalDays}d`;
  const readable = months > 0 ? `${months} tháng ${days} ngày` : `${totalDays} ngày`;
  const weekLabel = weeks > 0 ? `${weeks} tuần ${weekDays} ngày` : `${totalDays} ngày`;
  return { totalDays, months, days, weeks, weekDays, compact, readable, weekLabel };
}

function milkStorageLabel(status) {
  if (status === 'freezer') return 'ngăn đông';
  if (status === 'fridge') return 'ngăn mát';
  if (status === 'room_temp') return 'để ngoài';
  return 'kho sữa';
}

function minuteKey(dateLike) {
  const date = new Date(dateLike);
  date.setSeconds(0, 0);
  return date.toISOString();
}

function buildTodayJournal({ records, milkBags, diapers, sleeps, todayStart }) {
  const items = [];

  records
    .filter(record => record.type === 'feed' && new Date(record.timestamp) >= todayStart)
    .forEach(record => {
      items.push({
        id: `feed-${record.id}`,
        time: record.timestamp,
        type: 'feed',
        icon: 'bottle',
        tone: 'lavender',
        title: 'Bú',
        detail: `${formatNumber(record.volume || 0)} ml`,
        badge: `${formatNumber(record.volume || 0)} ml`,
      });
    });

  const milkGroups = new Map();
  milkBags
    .filter(bag => new Date(bag.expressed_at) >= todayStart)
    .forEach(bag => {
      const storage = bag.storage_status || 'stored';
      const key = `${minuteKey(bag.expressed_at)}-${storage}`;
      const current = milkGroups.get(key) || {
        ids: [],
        time: bag.expressed_at,
        storage,
        volume: 0,
      };

      current.ids.push(bag.id);
      current.volume += bag.volume_ml || 0;
      if (new Date(bag.expressed_at) > new Date(current.time)) current.time = bag.expressed_at;
      milkGroups.set(key, current);
    });

  milkGroups.forEach(group => {
    items.push({
      id: `milk-${group.ids.join('-')}`,
      time: group.time,
      type: 'milk',
      icon: 'pump',
      tone: 'lavender',
      title: 'Hút sữa',
      detail: `${formatNumber(group.volume)} ml thêm vào ${milkStorageLabel(group.storage)}`,
      badge: `+${formatNumber(group.volume)} ml`,
    });
  });

  diapers
    .filter(item => new Date(item.timestamp) >= todayStart)
    .forEach(item => {
      const cfg = DIAPER_TYPES[item.type] || DIAPER_TYPES.wet;
      items.push({
        id: `diaper-${item.id}`,
        time: item.timestamp,
        type: 'diaper',
        icon: 'poop',
        tone: 'green',
        title: 'Thay tã',
        detail: cfg.shortLabel.toLowerCase(),
        badge: '✓',
      });
    });

  sleeps
    .filter(item => new Date(item.startAt) >= todayStart)
    .forEach(item => {
      items.push({
        id: `sleep-${item.id}`,
        time: item.startAt,
        type: 'sleep',
        icon: 'moon',
        tone: 'blue',
        title: 'Ngủ',
        detail: item.endAt ? formatDuration(getDurationMinutes(item.startAt, item.endAt)) : 'Đang ngủ',
        badge: 'Zz',
      });
    });

  return items.sort((a, b) => new Date(b.time) - new Date(a.time));
}

export default function DashboardTab({
  records,
  settings,
  milkBags = [],
  diapers = [],
  sleeps = [],
  onOpenFeed,
  onNavigateToMilk,
  onNavigateToCare,
}) {
  const { babyName, babyBirthDate, feedIntervalHours = 3 } = settings;
  const [nowMs] = useState(() => Date.now());

  const todayStart = useMemo(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    return day;
  }, []);

  const lastFeed = useMemo(() => records.find(record => record.type === 'feed'), [records]);
  const todayFeeds = useMemo(
    () => records.filter(record => record.type === 'feed' && new Date(record.timestamp) >= todayStart),
    [records, todayStart]
  );
  const todayFeedVol = todayFeeds.reduce((sum, record) => sum + (record.volume || 0), 0);
  const targetFeeds = Math.max(1, Math.round(24 / Number(feedIntervalHours || 3)));
  const ageInfo = useMemo(() => getBabyAge(babyBirthDate), [babyBirthDate]);
  const nextFeed = timeUntilNext(lastFeed?.timestamp, feedIntervalHours, nowMs);
  const todayJournal = useMemo(
    () => buildTodayJournal({ records, milkBags, diapers, sleeps, todayStart }),
    [diapers, milkBags, records, sleeps, todayStart]
  );

  const feedProgressPercent = lastFeed
    ? Math.min(100, Math.max(10, ((nowMs - new Date(lastFeed.timestamp).getTime()) / (feedIntervalHours * 3600000)) * 100))
    : 0;
  const lastFeedTime = lastFeed
    ? new Date(lastFeed.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="animate-fade-in home-screen home-screen-v2">
      <header className="home-hero-v2">
        <div className="home-hero-copy">
          <div className="home-title-row">
            <h1>{babyName || 'Bé Yêu'}</h1>
            <span className="home-age-badge">{ageInfo ? ageInfo.weekLabel : 'Chưa có ngày sinh'}</span>
          </div>
          <p>Hôm nay tốt nhé! <span>♥</span></p>
        </div>
        <div className="home-hero-stats">
          <button type="button" onClick={onOpenFeed}>
            <GameIcon name="bottle" size={34} variant="lavender" />
            <strong>{todayFeeds.length}</strong>
            <span>cữ / {targetFeeds}</span>
          </button>
          <button type="button" onClick={onOpenFeed}>
            <GameIcon name="drop" size={34} variant="blue" />
            <strong>{formatNumber(todayFeedVol)}</strong>
            <span>ml</span>
          </button>
        </div>
      </header>

      <section className="home-card home-feed-card home-feed-spotlight">
        <div className="home-card-head">
          <h2>Cữ bú gần nhất</h2>
          {nextFeed && (
            <span className={`home-reminder-status ${nextFeed.overdue ? 'overdue' : ''}`}>
              <GameIcon name={nextFeed.overdue ? 'bell' : 'clock'} size={20} variant="lavender" bare />
              {nextFeed.overdue ? 'Đến giờ bú' : nextFeed.countdownLabel}
            </span>
          )}
        </div>

        <div className="home-feed-spotlight-layout">
          <div className="home-feed-last">
            <span className="home-feed-last-label">Đã bú</span>
            <strong>{lastFeed?.volume ? formatNumber(lastFeed.volume) : '--'} <small>ml</small></strong>
            <p>{lastFeed ? `lúc ${lastFeedTime}` : 'Chưa có cữ bú nào'}</p>
          </div>

          <div className={`home-feed-next ${nextFeed?.overdue ? 'overdue' : ''}`}>
            <span>Cữ tiếp theo</span>
            <strong>{nextFeed ? nextFeed.label : '--:--'}</strong>
            <p>{nextFeed ? nextFeed.countdownLabel : 'Chưa có lịch nhắc'}</p>
          </div>
        </div>

        {lastFeed && (
          <div className="home-feed-progress" aria-hidden="true">
            <span style={{ width: `${feedProgressPercent}%` }} />
          </div>
        )}
      </section>

      <section className="home-card home-care-card">
        <div className="home-care-actions home-care-actions-v2">
          <button type="button" className="home-care-tile feed" onClick={onOpenFeed} aria-label="Bú" title="Bú">
            <GameIcon name="bottle" size={44} variant="lavender" />
            <span>Bú</span>
          </button>
          <button type="button" className="home-care-tile diaper" onClick={() => onNavigateToCare?.('diaper')} aria-label="Tã" title="Tã">
            <GameIcon name="poop" size={44} variant="green" />
            <span>Tã</span>
          </button>
          <button type="button" className="home-care-tile sleep" onClick={() => onNavigateToCare?.('sleep')} aria-label="Ngủ" title="Ngủ">
            <GameIcon name="moon" size={44} variant="blue" />
            <span>Ngủ</span>
          </button>
          <button type="button" className="home-care-tile stats" onClick={() => onNavigateToCare?.('stats')} aria-label="Chỉ số" title="Chỉ số">
            <GameIcon name="stats" size={44} variant="lavender" />
            <span>Chỉ số</span>
          </button>
          <button type="button" className="home-care-tile milk" onClick={() => onNavigateToMilk?.()} aria-label="Kho sữa" title="Kho sữa">
            <GameIcon name="milk" size={44} variant="blue" />
            <span>Kho sữa</span>
          </button>
        </div>
      </section>

      <section className="home-card home-journal-card">
        <div className="home-card-head">
          <h2>Nhật ký hôm nay</h2>
        </div>
        <div className="home-journal-list">
          {todayJournal.length === 0 ? (
            <div className="home-journal-empty">
              <GameIcon name="calendar" size={34} variant="lavender" />
              <span>Hôm nay chưa có hoạt động.</span>
            </div>
          ) : todayJournal.map(item => (
            <article className={`home-journal-item ${item.type}`} key={item.id}>
              <time>{formatTime(item.time)}</time>
              <span className="home-journal-dot" />
              <div className="home-journal-main">
                <GameIcon name={item.icon} size={34} variant={item.tone} />
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                </div>
                <em>{item.badge}</em>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
