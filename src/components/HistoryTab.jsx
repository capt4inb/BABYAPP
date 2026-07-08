import { useMemo, useState } from 'react';
import GameIcon from './GameIcon';

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
}

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupByDay(records) {
  const groups = {};
  records.forEach(record => {
    const day = new Date(record.timestamp).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(record);
  });
  return Object.entries(groups).map(([day, recs]) => ({ day, recs }));
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
}

function buildChartData(records) {
  return getLast7Days().map((day, index) => {
    const dayKey = day.toDateString();
    const feeds = records.filter(record =>
      record.type === 'feed' && new Date(record.timestamp).toDateString() === dayKey
    );
    const totalMl = feeds.reduce((sum, record) => sum + (record.volume || 0), 0);

    return {
      label: index === 6 ? 'Hôm nay' : day.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
      count: feeds.length,
      totalMl,
      active: index === 6,
    };
  });
}

function recordTitle(record) {
  if (record.type === 'weight') return 'Cân nặng';
  return 'Cữ bú';
}

export default function HistoryTab({ records, onOpenFeedModal, onOpenWeightModal, onDeleteRecord }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [expandedDays, setExpandedDays] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => {
    let next = records;
    if (filter !== 'all') next = next.filter(record => record.type === filter);
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      next = next.filter(record =>
        record.note?.toLowerCase().includes(query) ||
        String(record.volume || '').includes(query) ||
        String(record.weight || '').includes(query) ||
        formatTime(record.timestamp).includes(query)
      );
    }
    return next;
  }, [records, filter, search]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const chartData = useMemo(() => buildChartData(records), [records]);
  const maxChartValue = Math.max(...chartData.map(item => item.totalMl), 1);

  const todayFeeds = chartData[chartData.length - 1] || { count: 0, totalMl: 0 };
  const totalFeedMl = filtered
    .filter(record => record.type === 'feed')
    .reduce((sum, record) => sum + (record.volume || 0), 0);

  const toggleDay = (day) => {
    setExpandedDays(prev => ({ ...prev, [day]: !(prev[day] ?? false) }));
  };

  const handleDelete = (id) => {
    if (deleteConfirm === id) {
      onDeleteRecord(id);
      setDeleteConfirm(null);
      return;
    }

    setDeleteConfirm(id);
    setTimeout(() => setDeleteConfirm(null), 3000);
  };

  return (
    <div className="animate-fade-in history-screen">
      <header className="page-header history-header">
        <div className="history-title-row">
          <h1>Lịch sử</h1>
          <span>{filtered.length} mục</span>
        </div>

        <label className="history-search">
          <GameIcon name="search" size={24} variant="cream" bare />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm giờ, ghi chú, số ml..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </label>

        <div className="history-filter-tabs">
          {[
            { value: 'all', label: 'Tất cả', icon: 'calendar' },
            { value: 'feed', label: 'Cữ bú', icon: 'bottle' },
            { value: 'weight', label: 'Cân nặng', icon: 'weight' },
          ].map(item => (
            <button
              key={item.value}
              type="button"
              className={filter === item.value ? 'active' : ''}
              onClick={() => setFilter(item.value)}
            >
              <GameIcon name={item.icon} size={18} variant="cream" bare />
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <section className="history-chart-card">
        <div className="history-summary-strip">
          <div>
            <span>Hôm nay</span>
            <strong>{formatNumber(todayFeeds.totalMl)} ml</strong>
          </div>
          <div>
            <span>Số cữ</span>
            <strong>{todayFeeds.count}</strong>
          </div>
          <div>
            <span>Đang lọc</span>
            <strong>{formatNumber(totalFeedMl)} ml</strong>
          </div>
        </div>

        <div className="history-mini-chart" aria-label="Biểu đồ lượng bú 7 ngày">
          {chartData.map(item => (
            <div className="history-chart-col" key={item.label}>
              <span>{item.totalMl ? formatNumber(item.totalMl) : ''}</span>
              <div
                className={item.active ? 'active' : ''}
                style={{ height: `${Math.max(12, (item.totalMl / maxChartValue) * 100)}%` }}
              />
              <small>{item.label}</small>
            </div>
          ))}
        </div>
      </section>

      <section className="history-list">
        {groups.length === 0 ? (
          <div className="history-empty">
            <GameIcon name="search" size={48} variant="cream" />
            <p>{search ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}</p>
          </div>
        ) : (
          groups.map(({ day, recs }, index) => {
            const isExpanded = expandedDays[day] ?? index === 0;
            const dayTotal = recs.reduce((sum, record) => sum + (record.volume || 0), 0);

            return (
              <article key={day} className="history-day-card">
                <button className="history-day-head" type="button" onClick={() => toggleDay(day)}>
                  <div>
                    <strong>{formatDate(recs[0].timestamp)}</strong>
                    <span>{recs.length} lần {dayTotal > 0 ? `• ${formatNumber(dayTotal)} ml` : ''}</span>
                  </div>
                  <GameIcon name={isExpanded ? 'up' : 'down'} size={22} variant="cream" bare />
                </button>

                {isExpanded && (
                  <div className="history-records">
                    {recs.map(record => (
                      <div className="history-record-row" key={record.id}>
                        <span className="history-time">{formatTime(record.timestamp)}</span>
                        <div className="history-record-main">
                          <strong>{recordTitle(record)}</strong>
                          <span>
                            {record.type === 'feed' && (record.volume ? `${formatNumber(record.volume)} ml` : 'Chưa nhập ml')}
                            {record.type === 'weight' && record.weight ? `${record.weight} kg` : ''}
                          </span>
                          {record.note && <p>{record.note}</p>}
                        </div>
                        <div className="history-row-actions">
                          <button
                            type="button"
                            onClick={() => record.type === 'feed' ? onOpenFeedModal(record) : onOpenWeightModal(record)}
                            aria-label="Sửa"
                          >
                            <GameIcon name="edit" size={20} variant="cream" bare />
                          </button>
                          <button
                            type="button"
                            className={deleteConfirm === record.id ? 'confirm' : ''}
                            onClick={() => handleDelete(record.id)}
                            aria-label="Xóa"
                          >
                            <GameIcon name="trash" size={20} variant="cream" bare />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>
    </div>
  );
}
