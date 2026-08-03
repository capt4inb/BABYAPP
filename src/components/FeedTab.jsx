import { useMemo, useState } from 'react';
import GameIcon from './GameIcon';

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
}

function formatTime(dateLike) {
  return new Date(dateLike).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateLike) {
  return new Date(dateLike).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
}

function startOfToday() {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  return day;
}

function dayStart(dateLike) {
  const day = new Date(dateLike);
  day.setHours(0, 0, 0, 0);
  return day;
}

function formatGroupDate(day, todayStart) {
  const groupDate = dayStart(day);
  const diffDays = Math.round((todayStart - groupDate) / 86400000);

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays === 2) return 'Hôm kia';

  return formatDate(groupDate);
}

function groupByDay(records) {
  const groups = new Map();
  records.forEach((record) => {
    const key = new Date(record.timestamp).toDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(record);
  });

  return [...groups.entries()]
    .map(([day, items]) => ({
      day,
      items: [...items].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
      totalMl: items.reduce((sum, item) => sum + (item.volume || 0), 0),
    }))
    .sort((a, b) => new Date(b.day) - new Date(a.day));
}

export default function FeedTab({ records, settings, onOpenFeedModal, onDeleteRecord }) {
  const [tab, setTab] = useState('record');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [expandedDays, setExpandedDays] = useState([]);
  const feedRecords = useMemo(
    () => records.filter(record => record.type === 'feed').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [records]
  );
  const todayStart = useMemo(() => startOfToday(), []);
  const todayFeeds = useMemo(
    () => feedRecords.filter(record => new Date(record.timestamp) >= todayStart),
    [feedRecords, todayStart]
  );
  const groups = useMemo(() => groupByDay(feedRecords), [feedRecords]);
  const todayKey = todayStart.toDateString();
  const todayGroup = groups.find(group => group.day === todayKey);
  const previousGroups = groups.filter(group => group.day !== todayKey);
  const todayMl = todayFeeds.reduce((sum, record) => sum + (record.volume || 0), 0);
  const targetFeeds = Math.max(1, Math.round(24 / Number(settings.feedIntervalHours || 3)));
  const lastFeed = feedRecords[0];

  const handleDelete = (id) => {
    if (deleteConfirm === id) {
      onDeleteRecord(id);
      setDeleteConfirm(null);
      return;
    }
    setDeleteConfirm(id);
    setTimeout(() => setDeleteConfirm(null), 3000);
  };

  const toggleDay = (day) => {
    setExpandedDays(prev => (
      prev.includes(day)
        ? prev.filter(item => item !== day)
        : [...prev, day]
    ));
  };

  const renderHistoryRows = (items) => (
    <div className="feed-history-list">
      {items.map(record => (
        <div className="feed-history-row" key={record.id}>
          <time>{formatTime(record.timestamp)}</time>
          <div>
            <strong>{formatNumber(record.volume)} ml</strong>
            {record.note && <span>{record.note}</span>}
          </div>
          <button type="button" onClick={() => onOpenFeedModal(record)} aria-label="Sửa">
            <GameIcon name="edit" size={18} variant="cream" bare />
          </button>
          <button
            type="button"
            className={deleteConfirm === record.id ? 'confirm' : ''}
            onClick={() => handleDelete(record.id)}
            aria-label="Xóa"
          >
            <GameIcon name="trash" size={18} variant="cream" bare />
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="animate-fade-in feed-screen">
      <header className="feed-header">
        <div>
          <h1>Bú</h1>
          <p>Theo dõi cữ bú và lịch sử bú của bé</p>
        </div>
        <button className="feed-add-button" type="button" onClick={() => onOpenFeedModal()}>
          <GameIcon name="plus" size={22} variant="cream" bare />
          Ghi cữ bú
        </button>
      </header>

      <div className="feed-tabs" role="tablist" aria-label="Bú">
        <button type="button" className={tab === 'record' ? 'active' : ''} onClick={() => setTab('record')}>Tổng quan</button>
        <button type="button" className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')}>Lịch sử</button>
      </div>

      {tab === 'record' ? (
        <>
          <section className="feed-summary-grid">
            <article>
              <GameIcon name="bottle" size={38} variant="lavender" />
              <strong>{todayFeeds.length}</strong>
              <span>cữ / {targetFeeds}</span>
            </article>
            <article>
              <GameIcon name="drop" size={38} variant="blue" />
              <strong>{formatNumber(todayMl)}</strong>
              <span>ml hôm nay</span>
            </article>
          </section>

          <section className="feed-latest-card">
            <div>
              <h2>Cữ bú gần nhất</h2>
              {lastFeed ? (
                <>
                  <strong>{formatNumber(lastFeed.volume)} ml</strong>
                  <span>{formatDate(lastFeed.timestamp)} lúc {formatTime(lastFeed.timestamp)}</span>
                </>
              ) : (
                <span>Chưa có cữ bú nào.</span>
              )}
            </div>
            <button type="button" onClick={() => onOpenFeedModal(lastFeed || null)} disabled={!lastFeed}>
              <GameIcon name="edit" size={18} variant="cream" bare />
              Sửa
            </button>
          </section>
        </>
      ) : (
        <section className="feed-history-card">
          {groups.length === 0 ? (
            <div className="history-empty compact">
              <p>Chưa có lịch sử bú.</p>
            </div>
          ) : (
            <>
              {todayGroup && (
                <article className="feed-history-group today" key={todayGroup.day}>
                  <header>
                    <strong>Hôm nay</strong>
                    <span>{todayGroup.items.length} cữ · {formatNumber(todayGroup.totalMl)} ml</span>
                  </header>
                  {renderHistoryRows(todayGroup.items)}
                </article>
              )}

              {previousGroups.length > 0 && (
                <div className="feed-history-previous">
                  <div className="feed-history-section-title">
                    <strong>Các ngày trước</strong>
                    <span>Chạm vào ngày để xem chi tiết</span>
                  </div>
                  {previousGroups.map(group => {
                    const isExpanded = expandedDays.includes(group.day);
                    return (
                      <article className={`feed-history-group collapsible ${isExpanded ? 'expanded' : ''}`} key={group.day}>
                        <button
                          className="feed-history-toggle"
                          type="button"
                          onClick={() => toggleDay(group.day)}
                          aria-expanded={isExpanded}
                        >
                          <div>
                            <strong>{formatGroupDate(group.day, todayStart)}</strong>
                            <small>{formatDate(group.day)}</small>
                          </div>
                          <span>{group.items.length} cữ · {formatNumber(group.totalMl)} ml</span>
                          <GameIcon name="right" size={20} variant="lavender" bare />
                        </button>
                        {isExpanded && renderHistoryRows(group.items)}
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
