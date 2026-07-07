import { useState, useMemo } from 'react';
import { getMilkSummary, getAvgDailyMl } from '../utils/milkUtils';
import AddMilkBagModal from './AddMilkBagModal';
import GameIcon from './GameIcon';

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
}

function timeSince(isoString, nowMs) {
  const diff = nowMs - new Date(isoString).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ ${mins % 60} phút trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
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
  const compact = months > 0 ? `${months}m${days}d` : `${totalDays}d`;
  const readable = months > 0 ? `${months} tháng ${days} ngày` : `${totalDays} ngày`;
  return { totalDays, months, days, compact, readable };
}

function feedLabel(side) {
  if (side === 'left') return 'Bú ngực trái';
  if (side === 'right') return 'Bú ngực phải';
  if (side === 'both') return 'Bú hai bên';
  return 'Bú bình';
}

export default function DashboardTab({
  records,
  settings,
  onOpenFeedModal,
  milkBags = [],
  onAddMilkBag,
  onNavigateToMilk,
  memos = [],
  onAddMemo,
  onDeleteMemo
}) {
  const { babyName, babyBirthDate, feedIntervalHours = 3 } = settings;
  const [nowMs] = useState(() => Date.now());
  const [showAddMilkBag, setShowAddMilkBag] = useState(false);
  const [isWritingMemo, setIsWritingMemo] = useState(false);
  const [memoContent, setMemoContent] = useState('');
  const [memoAuthor, setMemoAuthor] = useState('Mẹ');

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

  const handleOpenMemo = () => {
    setIsWritingMemo(true);
    requestAnimationFrame(() => {
      document.getElementById('home-memo-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const handleSaveMemo = (event) => {
    event.preventDefault();
    if (!memoContent.trim()) return;

    onAddMemo({
      id: crypto.randomUUID(),
      content: memoContent.trim(),
      author: memoAuthor,
      createdAt: new Date().toISOString()
    });

    setMemoContent('');
    setIsWritingMemo(false);
  };

  return (
    <div className="animate-fade-in home-screen">
      <header className="home-header">
        <div className="home-profile">
          <div className="home-avatar" aria-hidden="true">
            <GameIcon name="baby" size={42} variant="lavender" />
          </div>
          <div>
            <h1>{babyName || 'Bé Yêu'}</h1>
            <p>{ageInfo ? ageInfo.readable : 'Cập nhật ngày sinh'} · Hôm nay tốt nhé!</p>
          </div>
        </div>
      </header>

      <section className="home-card home-today-card">
        <div className="home-card-head">
          <h2>Hôm nay</h2>
          <span className="home-date-pill">
            <GameIcon name="calendar" size={22} variant="lavender" bare />
            {todayDateLabel}
          </span>
        </div>

        <div className="home-stat-grid">
          <div className="home-stat">
            <GameIcon name="bottle" size={36} variant="lavender" />
            <strong>{todayFeeds.length}</strong>
            <span>cữ bú</span>
            <small>/ {targetFeeds} cữ</small>
          </div>
          <div className="home-stat">
            <GameIcon name="drop" size={36} variant="blue" />
            <strong>{formatNumber(todayFeedVol)}</strong>
            <span>ml</span>
            <small>tổng hôm nay</small>
          </div>
          <div className="home-stat">
            <GameIcon name="milk" size={36} variant="green" />
            <strong>{formatNumber(milkSummary.totalMl)}</strong>
            <span>ml</span>
            <small>trong kho</small>
          </div>
        </div>
      </section>

      <section>
        <h2 className="home-section-title">Thao tác nhanh</h2>
        <div className="home-quick-grid">
          <button className="home-action-card purple" type="button" onClick={onOpenFeedModal}>
            <span className="home-action-icon"><GameIcon name="baby" size={40} variant="lavender" /></span>
            <strong>Ghi cữ bú</strong>
            <small>Bú bình / Mẹ</small>
            <span className="home-action-plus"><GameIcon name="plus" size={20} variant="cream" bare /></span>
          </button>
          <button className="home-action-card rose" type="button" onClick={() => setShowAddMilkBag(true)}>
            <span className="home-action-icon"><GameIcon name="bottle" size={40} variant="pink" /></span>
            <strong>Thêm sữa</strong>
            <small>Thêm vào kho</small>
            <span className="home-action-plus"><GameIcon name="plus" size={20} variant="cream" bare /></span>
          </button>
          <button className="home-action-card mint" type="button" onClick={() => onNavigateToMilk?.()}>
            <span className="home-action-icon"><GameIcon name="milk" size={40} variant="green" /></span>
            <strong>Kho sữa</strong>
            <small>Quản lý kho</small>
          </button>
          <button className="home-action-card amber" type="button" onClick={handleOpenMemo}>
            <span className="home-action-icon"><GameIcon name="note" size={40} variant="orange" /></span>
            <strong>Ghi chú</strong>
            <small>Sự kiện bé</small>
          </button>
        </div>
      </section>

      <section className="home-card home-feed-card">
        <div className="home-card-head">
          <h2>Cữ bú gần nhất</h2>
          {nextFeed && (
            <span className={`home-reminder-status ${nextFeed.overdue ? 'overdue' : ''}`}>
              <GameIcon name="clock" size={20} variant="lavender" bare />
              Nhắc cữ tiếp theo
            </span>
          )}
        </div>

        <div className="home-feed-layout">
          <div className="home-feed-main">
            <div className="home-feed-icon">
              <GameIcon name="bottle" size={42} variant="lavender" />
            </div>
            <div>
              {lastFeed ? (
                <>
                  <div className="home-feed-title-row">
                    <h3>{feedLabel(lastFeed.side)}</h3>
                    <span>Ngăn mát</span>
                  </div>
                  <p>Hôm nay, {new Date(lastFeed.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                  <strong>{lastFeed.volume ? `${formatNumber(lastFeed.volume)} ml` : 'Chưa nhập ml'}</strong>
                  <small>{timeSince(lastFeed.timestamp, nowMs)}</small>
                </>
              ) : (
                <>
                  <h3>Chưa có cữ bú</h3>
                  <p>Ghi cữ đầu tiên để app nhắc nhịp bú tiếp theo.</p>
                  <strong>-- ml</strong>
                  <small>Sẵn sàng bắt đầu</small>
                </>
              )}
            </div>
          </div>

          <div className="home-reminder">
            <span>{nextFeed ? nextFeed.label : '--:--'}</span>
            <strong>{nextFeed ? nextFeed.countdownLabel : 'Chưa có lịch'}</strong>
            <button type="button" onClick={onOpenFeedModal}>Ghi cữ ngay</button>
          </div>
        </div>

        <div className="home-feed-progress" aria-hidden="true">
          <span style={{ width: `${feedProgressPercent}%` }} />
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

      <section className="home-card home-storage-card">
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

      <section className="home-card home-memo-card" id="home-memo-form">
        <div className="home-card-head">
          <h2>Ghi chú gia đình</h2>
          <span className="home-date-pill">{memos.length} ghi chú</span>
        </div>

        {isWritingMemo ? (
          <form className="home-memo-form" onSubmit={handleSaveMemo}>
            <textarea
              className="form-input"
              value={memoContent}
              onChange={event => setMemoContent(event.target.value)}
              placeholder="Nhập ghi chú cho cả nhà..."
              rows={3}
              required
            />
            <div className="home-memo-actions">
              <select className="form-input" value={memoAuthor} onChange={event => setMemoAuthor(event.target.value)}>
                <option>Mẹ</option>
                <option>Bố</option>
                <option>Bà</option>
                <option>Ông</option>
              </select>
              <button className="btn btn-ghost" type="button" onClick={() => setIsWritingMemo(false)}>Huỷ</button>
              <button className="btn btn-primary" type="submit">Lưu</button>
            </div>
          </form>
        ) : (
          <button className="home-memo-empty" type="button" onClick={handleOpenMemo}>
            <GameIcon name="note" size={30} variant="orange" />
            <span>{memos[0] ? memos[0].content : 'Thêm ghi chú nhanh cho hôm nay'}</span>
          </button>
        )}

        {memos.length > 0 && (
          <div className="home-memo-list">
            {memos.slice(0, 3).map(memo => (
              <article key={memo.id}>
                <div>
                  <strong>{memo.author}</strong>
                  <span>{timeSince(memo.createdAt, nowMs)}</span>
                </div>
                <p>{memo.content}</p>
                <button type="button" onClick={() => onDeleteMemo(memo.id)} aria-label="Xoá ghi chú">
                  <GameIcon name="trash" size={18} variant="cream" bare />
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {showAddMilkBag && (
        <AddMilkBagModal
          onSave={(bag) => {
            onAddMilkBag(bag);
            setShowAddMilkBag(false);
          }}
          onClose={() => setShowAddMilkBag(false)}
        />
      )}
    </div>
  );
}
