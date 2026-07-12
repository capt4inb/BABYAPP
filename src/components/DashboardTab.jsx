import { useState, useMemo } from 'react';
import { getMilkSummary, getAvgDailyMl } from '../utils/milkUtils';
import GameIcon from './GameIcon';

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
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

function getLast7Days() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
}

function dayKey(date) {
  return date.toDateString();
}

function shortDayLabel(date) {
  const weekday = date.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', '').toUpperCase();
  const dayMonth = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
  return `${weekday} (${dayMonth})`;
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

export default function DashboardTab({
  records,
  settings,
  milkBags = [],
  onNavigateToMilk,
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
  const milkSummary = useMemo(() => getMilkSummary(milkBags), [milkBags]);
  const avgDailyMl = useMemo(() => getAvgDailyMl(records, 7), [records]);
  const ageInfo = useMemo(() => getBabyAge(babyBirthDate), [babyBirthDate]);
  const nextFeed = timeUntilNext(lastFeed?.timestamp, feedIntervalHours, nowMs);
  const todayDateLabel = new Date().toLocaleDateString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });

  const days7 = useMemo(() => getLast7Days(), []);
  const dailyStats = useMemo(() => {
    return days7.map(day => {
      const key = dayKey(day);
      const dayFeeds = records.filter(record =>
        record.type === 'feed' && new Date(record.timestamp).toDateString() === key
      );
      const feedVol = dayFeeds.reduce((sum, record) => sum + (record.volume || 0), 0);
      return { label: shortDayLabel(day), feedCount: dayFeeds.length, feedVol };
    });
  }, [days7, records]);

  const maxFeedVolume = Math.max(...dailyStats.map(day => day.feedVol), 1);
  const weekFeedVolume = dailyStats.reduce((sum, day) => sum + day.feedVol, 0);
  const previousAvg = dailyStats.slice(0, 6).reduce((sum, day) => sum + day.feedVol, 0) / 6 || 0;
  const trendPercent = previousAvg > 0 ? Math.round(((todayFeedVol - previousAvg) / previousAvg) * 100) : 0;

  const activeBags = useMemo(
    () => milkBags.filter(bag => bag.storage_status !== 'used' && bag.storage_status !== 'expired'),
    [milkBags]
  );
  const fridgeBags = useMemo(
    () => activeBags.filter(bag => bag.storage_status === 'fridge' || (bag.storage_status === 'using' && bag.previous_status === 'fridge')),
    [activeBags]
  );
  const freezerBags = useMemo(
    () => activeBags.filter(bag => bag.storage_status === 'freezer' || (bag.storage_status === 'using' && bag.previous_status === 'freezer')),
    [activeBags]
  );
  const fridgeMl = fridgeBags.reduce((sum, bag) => sum + (bag.volume_ml || 0), 0);
  const freezerMl = freezerBags.reduce((sum, bag) => sum + (bag.volume_ml || 0), 0);

  const feedProgressPercent = lastFeed
    ? Math.min(100, Math.max(10, ((nowMs - new Date(lastFeed.timestamp).getTime()) / (feedIntervalHours * 3600000)) * 100))
    : 0;
  const lastFeedTime = lastFeed
    ? new Date(lastFeed.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="animate-fade-in home-screen">
      <header className="home-header home-header-compact">
        <div className="home-title-row">
          <h1>{babyName || 'Bé Yêu'}</h1>
          <span className="home-age-badge">{ageInfo ? ageInfo.weekLabel : 'Chưa có ngày sinh'}</span>
        </div>
        <p>Hôm nay tốt nhé!</p>
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

      <section className="home-card home-today-card home-today-compact">
        <div className="home-today-label">
          <h2>Hôm nay</h2>
          <span>{todayDateLabel}</span>
        </div>
        <div className="home-today-metrics">
          <div>
            <strong>{todayFeeds.length}</strong>
            <span>cữ / {targetFeeds}</span>
          </div>
          <div>
            <strong>{formatNumber(todayFeedVol)}</strong>
            <span>ml</span>
          </div>
        </div>
      </section>

      <section className="home-card home-storage-card home-storage-card-compact">
        <div className="home-card-head">
          <h2>Kho sữa</h2>
          <button type="button" onClick={() => onNavigateToMilk?.()}>
            Xem chi tiết <GameIcon name="right" size={18} variant="lavender" bare />
          </button>
        </div>

        <div className="home-storage-grid">
          <div className="home-storage-tile purple">
            <GameIcon name="bottle" size={38} variant="lavender" />
            <div>
              <span>Tổng trong kho</span>
              <strong>{formatNumber(milkSummary.totalMl)} ml</strong>
              <small>{milkSummary.activeBagCount || 0} bịch</small>
            </div>
          </div>
          <div className="home-storage-tile mint">
            <GameIcon name="snow" size={38} variant="green" />
            <div>
              <span>Ngăn mát</span>
              <strong>{formatNumber(fridgeMl)} ml</strong>
              <small>{fridgeBags.length} bịch</small>
            </div>
          </div>
          <div className="home-storage-tile blue">
            <GameIcon name="snow" size={38} variant="blue" />
            <div>
              <span>Ngăn đông</span>
              <strong>{formatNumber(freezerMl)} ml</strong>
              <small>{freezerBags.length} bịch</small>
            </div>
          </div>
        </div>
      </section>

      <section className="home-card home-chart-card">
        <div className="home-card-head">
          <h2>Tổng kết 7 ngày gần nhất</h2>
          <span className="home-date-pill">ml/ngày</span>
        </div>

        <div className="home-chart" aria-label="Biểu đồ lượng sữa 7 ngày">
          {dailyStats.map((day, index) => (
            <div className="home-bar-column" key={`${day.label}-${index}`}>
              <span>{day.feedVol ? formatNumber(day.feedVol) : ''}</span>
              <div className={`home-bar ${index === dailyStats.length - 1 ? 'active' : ''}`} style={{ height: `${Math.max(14, (day.feedVol / maxFeedVolume) * 100)}%` }} />
              <small>{day.label}</small>
            </div>
          ))}
        </div>

        <div className="home-chart-footer">
          <span><GameIcon name="clock" size={20} variant="lavender" bare /> Trung bình {formatNumber(avgDailyMl || Math.round(weekFeedVolume / 7))} ml/ngày</span>
          <strong className={trendPercent >= 0 ? 'positive' : 'negative'}>
            {trendPercent >= 0 ? '+' : ''}{trendPercent}% so với nhịp gần đây
          </strong>
        </div>
      </section>
    </div>
  );
}
