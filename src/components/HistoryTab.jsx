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

function relativeDayLabel(day) {
  const date = new Date(day);
  const today = new Date();
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - date) / 86400000);

  if (diffDays === 0) return 'Hôm nay';
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays === 2) return 'Hôm kia';
  return formatDate(date);
}

function formatCalendarDay(day) {
  const date = new Date(day);
  const relative = relativeDayLabel(day);
  return {
    relative: ['Hôm nay', 'Hôm qua', 'Hôm kia'].includes(relative) ? relative : null,
    weekday: date.toLocaleDateString('vi-VN', { weekday: 'short' }).replace('.', ''),
    date: date.toLocaleDateString('vi-VN', { day: '2-digit' }),
    month: date.toLocaleDateString('vi-VN', { month: '2-digit' }),
  };
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

function getDayTotal(records) {
  return records.reduce((sum, record) => sum + (record.volume || 0), 0);
}

function recordTitle(record) {
  if (record.type === 'weight') return 'Cân nặng';
  return 'Cữ bú';
}

function HistoryRows({ records, deleteConfirm, onDelete, onOpenFeedModal, onOpenWeightModal }) {
  return (
    <div className="history-records">
      {records.map(record => (
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
              onClick={() => onDelete(record.id)}
              aria-label="Xóa"
            >
              <GameIcon name="trash" size={20} variant="cream" bare />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function HistoryTab({ records, onOpenFeedModal, onOpenWeightModal, onDeleteRecord }) {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState(null);
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
  const todayKey = new Date().toDateString();
  const todayGroup = groups.find(group => group.day === todayKey);
  const previousGroups = groups.filter(group => group.day !== todayKey);
  const selectedGroup = selectedDay ? groups.find(group => group.day === selectedDay) : null;

  const todayTotal = todayGroup ? getDayTotal(todayGroup.recs) : 0;
  const filteredFeedMl = filtered
    .filter(record => record.type === 'feed')
    .reduce((sum, record) => sum + (record.volume || 0), 0);

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

      <section className="history-today-card">
        <div className="history-section-head">
          <div>
            <h2>Hôm nay</h2>
            <span>{todayGroup?.recs.length || 0} lần • {formatNumber(todayTotal)} ml</span>
          </div>
          <strong>{formatNumber(filteredFeedMl)} ml</strong>
        </div>

        {todayGroup ? (
          <HistoryRows
            records={todayGroup.recs}
            deleteConfirm={deleteConfirm}
            onDelete={handleDelete}
            onOpenFeedModal={onOpenFeedModal}
            onOpenWeightModal={onOpenWeightModal}
          />
        ) : (
          <div className="history-empty compact">
            <p>{search ? 'Không có dữ liệu hôm nay theo bộ lọc này' : 'Hôm nay chưa có ghi chép'}</p>
          </div>
        )}
      </section>

      <section className="history-calendar-card">
        <div className="history-section-head">
          <div>
            <h2>Các ngày trước</h2>
            <span>Chạm vào ngày để xem chi tiết</span>
          </div>
          <GameIcon name="calendar" size={24} variant="lavender" bare />
        </div>

        {previousGroups.length === 0 ? (
          <div className="history-empty compact">
            <p>{search ? 'Không có ngày phù hợp' : 'Chưa có dữ liệu ngày trước'}</p>
          </div>
        ) : (
          <div className="history-calendar-grid">
            {previousGroups.map(group => {
              const day = formatCalendarDay(group.day);
              const total = getDayTotal(group.recs);
              return (
                <button key={group.day} type="button" onClick={() => setSelectedDay(group.day)}>
                  <span>{day.relative || day.weekday}</span>
                  <strong>{day.date}</strong>
                  <small>Th {day.month}</small>
                  <em>{group.recs.length} lần • {formatNumber(total)} ml</em>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {selectedGroup && (
        <>
          <div className="modal-backdrop" onClick={() => setSelectedDay(null)} />
          <section className="history-day-modal animate-modal" role="dialog" aria-modal="true">
            <div className="modal-handle" />
            <div className="history-modal-head">
              <div>
                <h2>{relativeDayLabel(selectedGroup.day)}</h2>
                <span>{selectedGroup.recs.length} lần • {formatNumber(getDayTotal(selectedGroup.recs))} ml</span>
              </div>
              <button type="button" onClick={() => setSelectedDay(null)} aria-label="Đóng">
                <GameIcon name="close" size={24} variant="cream" bare />
              </button>
            </div>
            <HistoryRows
              records={selectedGroup.recs}
              deleteConfirm={deleteConfirm}
              onDelete={handleDelete}
              onOpenFeedModal={onOpenFeedModal}
              onOpenWeightModal={onOpenWeightModal}
            />
          </section>
        </>
      )}
    </div>
  );
}
