import { useCallback, useMemo, useState } from 'react';
import {
  STATUS_CONFIG,
  formatDateShort,
  formatTime,
  getAvgDailyMl,
  getMilkSummary,
  getPriorityScore,
  getTimeRemaining,
  transitionBag,
} from '../utils/milkUtils';
import AddMilkBagModal from './AddMilkBagModal';
import ThawModal from './ThawModal';
import GameIcon from './GameIcon';

const FILTERS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'fridge', label: 'Ngăn mát' },
  { id: 'freezer', label: 'Ngăn đông' },
  { id: 'thawing', label: 'Đang rã' },
];

const DATE_FILTERS = [
  { id: 'all', label: 'Tất cả ngày' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'yesterday', label: 'Hôm qua' },
  { id: 'two_days_ago', label: 'Hôm kia' },
  { id: 'custom', label: 'Chọn ngày' },
];

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
}

function isActiveBag(bag) {
  return bag.storage_status !== 'used' && bag.storage_status !== 'expired';
}

function toDateInputValue(dateLike) {
  const date = new Date(dateLike);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function getRelativeDateValue(daysAgo) {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - daysAgo);
  return toDateInputValue(day);
}

function getDateFilterValue(filter, customDate) {
  if (filter === 'today') return getRelativeDateValue(0);
  if (filter === 'yesterday') return getRelativeDateValue(1);
  if (filter === 'two_days_ago') return getRelativeDateValue(2);
  if (filter === 'custom') return customDate || '';
  return '';
}

function sumVolume(bags) {
  return bags.reduce((sum, bag) => sum + (bag.volume_ml || 0), 0);
}

function getFilterStats(bags) {
  return {
    count: bags.length,
    ml: sumVolume(bags),
  };
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    return day;
  });
}

function chartLabel(date, isToday) {
  if (isToday) return 'Hôm nay';
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }).replace('/', '-');
}

function buildMilkChartData(milkBags) {
  return getLast7Days().map((day, index, days) => {
    const start = new Date(day);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);
    const total = milkBags
      .filter(bag => {
        const expressedAt = new Date(bag.expressed_at);
        return expressedAt >= start && expressedAt <= end;
      })
      .reduce((sum, bag) => sum + (bag.volume_ml || 0), 0);

    return {
      total,
      label: chartLabel(day, index === days.length - 1),
      active: index === days.length - 1,
    };
  });
}

function MilkBagCard({ bag, onUpdate, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [showThawModal, setShowThawModal] = useState(false);
  const displayStatus = bag.storage_status === 'using' ? (bag.previous_status || 'fridge') : bag.storage_status;
  const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.fridge;
  const remaining = bag.expiry_at ? getTimeRemaining(bag.expiry_at) : null;
  const isDone = bag.storage_status === 'used' || bag.storage_status === 'expired';

  const handleTransition = useCallback((newStatus, extra = {}) => {
    onUpdate(bag.id, transitionBag(bag, newStatus, extra));
  }, [bag, onUpdate]);

  const handleThawSave = useCallback((updatedBag) => {
    onUpdate(updatedBag.id, updatedBag);
    setShowThawModal(false);
  }, [onUpdate]);

  const statusText = remaining
    ? (remaining.expired ? 'Đã hết hạn' : `Còn ${remaining.label}`)
    : cfg.label;

  return (
    <>
      <article className={`milk-detail-item ${expanded ? 'expanded' : ''} ${isDone ? 'done' : ''}`}>
        <button className="milk-detail-main" type="button" onClick={() => setExpanded(value => !value)}>
          <span className="milk-detail-volume">
            <strong>{formatNumber(bag.volume_ml)}</strong>
            <small>ml</small>
          </span>
          <span className="milk-detail-copy">
            <span className="milk-detail-row">
              <strong>{cfg.label}</strong>
              <em style={{ color: cfg.color }}>{statusText}</em>
            </span>
            <span>Hút {formatDateShort(bag.expressed_at)} lúc {formatTime(bag.expressed_at)}</span>
          </span>
          <GameIcon name="right" size={22} variant="cream" bare />
        </button>

        {expanded && (
          <div className="milk-detail-expanded">
            <dl>
              <div>
                <dt>ID</dt>
                <dd>{bag.id.slice(0, 6).toUpperCase()}</dd>
              </div>
              {bag.fed_at && (
                <div>
                  <dt>Đã dùng</dt>
                  <dd>{formatDateShort(bag.fed_at)} {formatTime(bag.fed_at)}</dd>
                </div>
              )}
            </dl>

            <div className="milk-detail-actions">
              {!isDone && (
                <button type="button" onClick={() => onEdit(bag)}>
                  <GameIcon name="edit" size={18} variant="cream" bare />
                  Sửa
                </button>
              )}
              {bag.storage_status === 'fridge' && (
                <button type="button" onClick={() => handleTransition('freezer')}>
                  <GameIcon name="snow" size={18} variant="cream" bare />
                  Đông
                </button>
              )}
              {bag.storage_status === 'room_temp' && (
                <button type="button" onClick={() => handleTransition('fridge')}>
                  <GameIcon name="snow" size={18} variant="cream" bare />
                  Mát
                </button>
              )}
              {bag.storage_status === 'freezer' && (
                <button type="button" onClick={() => setShowThawModal(true)}>
                  <GameIcon name="drop" size={18} variant="cream" bare />
                  Rã đông
                </button>
              )}
              {bag.storage_status === 'thawing' && (
                <button type="button" onClick={() => setShowThawModal(true)}>
                  <GameIcon name="check" size={18} variant="cream" bare />
                  Đã rã
                </button>
              )}
              {bag.storage_status === 'thawed' && (
                <button type="button" onClick={() => handleTransition('warmed')}>
                  <GameIcon name="flame" size={18} variant="cream" bare />
                  Hâm
                </button>
              )}
              {!isDone && (
                <button type="button" className="success" onClick={() => handleTransition('used')}>
                  <GameIcon name="check" size={18} variant="cream" bare />
                  Đã dùng
                </button>
              )}
              {isDone && (
                <button type="button" className="danger" onClick={() => onDelete(bag.id)}>
                  <GameIcon name="trash" size={18} variant="cream" bare />
                  Xoá
                </button>
              )}
            </div>
          </div>
        )}
      </article>

      {showThawModal && (
        <ThawModal
          bag={bag}
          onSave={handleThawSave}
          onClose={() => setShowThawModal(false)}
        />
      )}
    </>
  );
}

export default function MilkStorageTab({
  milkBags,
  records,
  onAddMilkBag,
  onUpdateMilkBag,
  onDeleteMilkBag,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [sortMode, setSortMode] = useState('priority');
  const [dateFilter, setDateFilter] = useState('all');
  const [customDate, setCustomDate] = useState(() => toDateInputValue(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingBag, setEditingBag] = useState(null);

  const avgDailyMl = useMemo(() => getAvgDailyMl(records, 7), [records]);
  const summary = useMemo(() => getMilkSummary(milkBags), [milkBags]);
  const allActiveBags = useMemo(() => milkBags.filter(isActiveBag), [milkBags]);
  const dateFilterValue = useMemo(() => getDateFilterValue(dateFilter, customDate), [customDate, dateFilter]);
  const dateScopedBags = useMemo(() => {
    if (!dateFilterValue) return milkBags;
    return milkBags.filter(bag => toDateInputValue(bag.expressed_at) === dateFilterValue);
  }, [dateFilterValue, milkBags]);
  const activeBags = useMemo(() => dateScopedBags.filter(isActiveBag), [dateScopedBags]);
  const chartData = useMemo(() => buildMilkChartData(milkBags), [milkBags]);
  const maxChartValue = Math.max(...chartData.map(item => item.total), 1);

  const todayStart = useMemo(() => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    return day;
  }, []);

  const usedTodayMl = useMemo(() => milkBags
    .filter(bag => bag.storage_status === 'used' && bag.fed_at && new Date(bag.fed_at) >= todayStart)
    .reduce((sum, bag) => sum + (bag.volume_ml || 0), 0), [milkBags, todayStart]);

  const expiringSoonMl = useMemo(() => allActiveBags
    .filter(bag => {
      if (!bag.expiry_at) return false;
      const remaining = getTimeRemaining(bag.expiry_at);
      return remaining && !remaining.expired && remaining.hours < 24;
    })
    .reduce((sum, bag) => sum + (bag.volume_ml || 0), 0), [allActiveBags]);

  const filterCounts = useMemo(() => {
    const stats = (predicate) => getFilterStats(activeBags.filter(predicate));
    return {
      all: getFilterStats(activeBags),
      fridge: stats(bag => bag.storage_status === 'fridge' || (bag.storage_status === 'using' && bag.previous_status === 'fridge')),
      freezer: stats(bag => bag.storage_status === 'freezer' || (bag.storage_status === 'using' && bag.previous_status === 'freezer')),
      thawing: stats(bag => bag.storage_status === 'thawing'),
    };
  }, [activeBags]);

  const filteredBags = useMemo(() => {
    let list = activeBags;

    if (activeFilter === 'fridge') {
      list = activeBags.filter(bag => bag.storage_status === 'fridge' || (bag.storage_status === 'using' && bag.previous_status === 'fridge'));
    } else if (activeFilter === 'freezer') {
      list = activeBags.filter(bag => bag.storage_status === 'freezer' || (bag.storage_status === 'using' && bag.previous_status === 'freezer'));
    } else if (activeFilter === 'thawing') {
      list = activeBags.filter(bag => bag.storage_status === 'thawing');
    }

    return [...list].sort((a, b) => {
      if (sortMode === 'newest') return new Date(b.expressed_at) - new Date(a.expressed_at);
      if (sortMode === 'oldest') return new Date(a.expressed_at) - new Date(b.expressed_at);
      if (sortMode === 'volume_desc') return (b.volume_ml || 0) - (a.volume_ml || 0);
      if (sortMode === 'volume_asc') return (a.volume_ml || 0) - (b.volume_ml || 0);
      return getPriorityScore(a) - getPriorityScore(b);
    });
  }, [activeBags, activeFilter, sortMode]);

  const milkHistoryRows = useMemo(() => {
    return [...milkBags].sort((a, b) =>
      new Date(b.fed_at || b.expressed_at) - new Date(a.fed_at || a.expressed_at)
    );
  }, [milkBags]);

  const handleAddSave = useCallback((bag) => {
    onAddMilkBag(bag);
    setShowAddModal(false);
  }, [onAddMilkBag]);

  const handleEditSave = useCallback((updatedBag) => {
    onUpdateMilkBag(updatedBag.id, updatedBag);
    setEditingBag(null);
  }, [onUpdateMilkBag]);

  return (
    <div className="animate-fade-in milk-screen">
      <header className="milk-header">
        <button className="milk-menu-button" type="button" aria-label="Menu">
          <GameIcon name="sliders" size={24} variant="cream" bare />
        </button>
        <div>
          <h1>Kho sữa mẹ</h1>
          <p>Bé bú TB <strong>{formatNumber(avgDailyMl)}ml/ngày</strong> (7 ngày gần nhất)</p>
        </div>
        <button className="milk-add-button" type="button" onClick={() => setShowAddModal(true)}>
          <GameIcon name="plus" size={22} variant="cream" bare />
          Thêm bịch
        </button>
      </header>

      <section className="milk-total-card">
        <div>
          <span>Tổng kho</span>
          <strong>{formatNumber(summary.totalMl)} <small>ml</small></strong>
          <p>{summary.activeBagCount || 0} bịch đang lưu</p>
        </div>
        <div className="milk-total-side">
          <div>
            <span>Đã dùng hôm nay</span>
            <strong>{formatNumber(usedTodayMl)} ml</strong>
          </div>
          <div className={summary.expiringSoonCount ? 'warn' : ''}>
            <span>Sắp hết hạn</span>
            <strong>{formatNumber(expiringSoonMl)} ml</strong>
          </div>
        </div>
      </section>

      <section className="milk-chart-panel">
        <div className="milk-panel-head">
          <h2>Tổng lượng sữa mỗi ngày</h2>
          <span>ml/ngày</span>
        </div>
        <div className="milk-chart-bars">
          {chartData.map(item => (
            <div className="milk-chart-col" key={item.label}>
              <span>{item.total ? formatNumber(item.total) : ''}</span>
              <div className={item.active ? 'active' : ''} style={{ height: `${Math.max(14, (item.total / maxChartValue) * 100)}%` }} />
              <small>{item.label}</small>
            </div>
          ))}
        </div>
        <button className="milk-detail-link" type="button" onClick={() => setShowHistoryModal(true)}>
          <GameIcon name="calendar" size={22} variant="lavender" bare />
          Xem lịch sử chi tiết
          <GameIcon name="right" size={18} variant="cream" bare />
        </button>
      </section>

      <section className="milk-detail-panel" id="milk-detail-list">
        <div className="milk-panel-head">
          <h2>Chi tiết kho sữa</h2>
          <span>{filteredBags.length} bịch</span>
        </div>

        <div className="milk-sort-tools milk-filter-tools">
          <label className="milk-sort-box milk-date-filter-box">
            <GameIcon name="calendar" size={20} variant="cream" bare />
            <select
              className="form-input"
              value={dateFilter}
              onChange={event => setDateFilter(event.target.value)}
            >
              {DATE_FILTERS.map(filter => (
                <option key={filter.id} value={filter.id}>{filter.label}</option>
              ))}
            </select>
          </label>
          {dateFilter === 'custom' && (
            <label className="milk-custom-date-box">
              <input
                className="form-input"
                type="date"
                value={customDate}
                onChange={event => setCustomDate(event.target.value)}
              />
            </label>
          )}
          <label className="milk-sort-box">
            <GameIcon name="sliders" size={20} variant="cream" bare />
            <select className="form-input" value={sortMode} onChange={event => setSortMode(event.target.value)}>
              <option value="priority">Ưu tiên dùng</option>
              <option value="newest">Mới hút trước</option>
              <option value="oldest">Cũ trước</option>
              <option value="volume_desc">Nhiều ml trước</option>
              <option value="volume_asc">Ít ml trước</option>
            </select>
          </label>
        </div>

        <div className="milk-filter-tabs">
          {FILTERS.map(filter => {
            const stats = filterCounts[filter.id] || { count: 0, ml: 0 };
            return (
              <button
                key={filter.id}
                type="button"
                className={activeFilter === filter.id ? 'active' : ''}
                onClick={() => setActiveFilter(filter.id)}
              >
                {filter.label}
                <span className="milk-filter-stat">
                  <em>{stats.count} bịch</em>
                  <strong>{formatNumber(stats.ml)} ml</strong>
                </span>
              </button>
            );
          })}
        </div>

        <div className="milk-detail-list">
          {filteredBags.length === 0 ? (
            <div className="milk-empty-state">
              <GameIcon name="bottle" size={54} variant="blue" />
              <strong>Chưa có bịch sữa</strong>
              <p>Thêm bịch sữa đầu tiên để bắt đầu quản lý kho.</p>
              <button className="btn btn-primary" type="button" onClick={() => setShowAddModal(true)}>
                <GameIcon name="plus" size={22} variant="cream" />
                Thêm bịch
              </button>
            </div>
          ) : (
            filteredBags.map(bag => (
              <MilkBagCard
                key={bag.id}
                bag={bag}
                onUpdate={(id, updated) => onUpdateMilkBag(id, updated)}
                onDelete={onDeleteMilkBag}
                onEdit={setEditingBag}
              />
            ))
          )}
        </div>
      </section>

      {(showAddModal || editingBag) && (
        <AddMilkBagModal
          key={editingBag?.id || 'add'}
          editBag={editingBag}
          onSave={editingBag ? handleEditSave : handleAddSave}
          onClose={() => {
            setShowAddModal(false);
            setEditingBag(null);
          }}
        />
      )}

      {showHistoryModal && (
        <>
          <div className="modal-backdrop" onClick={() => setShowHistoryModal(false)} />
          <section className="milk-history-modal animate-modal" role="dialog" aria-modal="true">
            <div className="modal-handle" />
            <div className="milk-history-modal-head">
              <div>
                <h2>Lịch sử kho sữa</h2>
                <span>{milkHistoryRows.length} dòng ghi chép</span>
              </div>
              <button type="button" onClick={() => setShowHistoryModal(false)} aria-label="Đóng">
                <GameIcon name="close" size={24} variant="cream" bare />
              </button>
            </div>
            <div className="milk-history-table-wrap">
              <table className="milk-history-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>ML</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {milkHistoryRows.map(bag => {
                    const displayStatus = bag.storage_status === 'using' ? (bag.previous_status || 'fridge') : bag.storage_status;
                    const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.fridge;
                    return (
                      <tr key={bag.id}>
                        <td>
                          <strong>{formatDateShort(bag.expressed_at)}</strong>
                          <span>{formatTime(bag.expressed_at)}</span>
                        </td>
                        <td>{formatNumber(bag.volume_ml)}</td>
                        <td><em style={{ color: cfg.color }}>{cfg.label}</em></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
