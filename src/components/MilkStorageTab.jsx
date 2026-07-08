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
  { id: 'ready', label: 'Sẵn dùng' },
  { id: 'done', label: 'Đã dùng' },
];

const NUMBER_FORMATTER = new Intl.NumberFormat('vi-VN');

function formatNumber(value) {
  return NUMBER_FORMATTER.format(value || 0);
}

function isActiveBag(bag) {
  return bag.storage_status !== 'used' && bag.storage_status !== 'expired';
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
              <div>
                <dt>Ghi chú</dt>
                <dd>{bag.note || 'Không có'}</dd>
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
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('priority');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBag, setEditingBag] = useState(null);

  const avgDailyMl = useMemo(() => getAvgDailyMl(records, 7), [records]);
  const summary = useMemo(() => getMilkSummary(milkBags), [milkBags]);
  const activeBags = useMemo(() => milkBags.filter(isActiveBag), [milkBags]);
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

  const expiringSoonMl = useMemo(() => activeBags
    .filter(bag => {
      if (!bag.expiry_at) return false;
      const remaining = getTimeRemaining(bag.expiry_at);
      return remaining && !remaining.expired && remaining.hours < 24;
    })
    .reduce((sum, bag) => sum + (bag.volume_ml || 0), 0), [activeBags]);

  const filterCounts = useMemo(() => {
    const count = (predicate) => activeBags.filter(predicate).length;
    return {
      all: activeBags.length,
      fridge: count(bag => bag.storage_status === 'fridge' || (bag.storage_status === 'using' && bag.previous_status === 'fridge')),
      freezer: count(bag => bag.storage_status === 'freezer' || (bag.storage_status === 'using' && bag.previous_status === 'freezer')),
      thawing: count(bag => bag.storage_status === 'thawing'),
      ready: count(bag => ['room_temp', 'thawed', 'warmed', 'using'].includes(bag.storage_status)),
      done: milkBags.filter(bag => bag.storage_status === 'used' || bag.storage_status === 'expired').length,
    };
  }, [activeBags, milkBags]);

  const filteredBags = useMemo(() => {
    const done = milkBags.filter(bag => bag.storage_status === 'used' || bag.storage_status === 'expired');
    let list = activeBags;

    if (activeFilter === 'fridge') {
      list = activeBags.filter(bag => bag.storage_status === 'fridge' || (bag.storage_status === 'using' && bag.previous_status === 'fridge'));
    } else if (activeFilter === 'freezer') {
      list = activeBags.filter(bag => bag.storage_status === 'freezer' || (bag.storage_status === 'using' && bag.previous_status === 'freezer'));
    } else if (activeFilter === 'thawing') {
      list = activeBags.filter(bag => bag.storage_status === 'thawing');
    } else if (activeFilter === 'ready') {
      list = activeBags.filter(bag => ['room_temp', 'thawed', 'warmed', 'using'].includes(bag.storage_status));
    } else if (activeFilter === 'done') {
      list = done;
    }

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      list = list.filter(bag => {
        const displayStatus = bag.storage_status === 'using' ? (bag.previous_status || 'fridge') : bag.storage_status;
        const statusLabel = (STATUS_CONFIG[displayStatus]?.label || displayStatus).toLowerCase();
        const expressedDate = `${formatDateShort(bag.expressed_at)} ${formatTime(bag.expressed_at)}`.toLowerCase();
        return (
          bag.id.toLowerCase().includes(query) ||
          String(bag.volume_ml || '').includes(query) ||
          bag.note?.toLowerCase().includes(query) ||
          statusLabel.includes(query) ||
          expressedDate.includes(query)
        );
      });
    }

    return [...list].sort((a, b) => {
      if (sortMode === 'newest') return new Date(b.expressed_at) - new Date(a.expressed_at);
      if (sortMode === 'oldest') return new Date(a.expressed_at) - new Date(b.expressed_at);
      if (sortMode === 'volume_desc') return (b.volume_ml || 0) - (a.volume_ml || 0);
      if (sortMode === 'volume_asc') return (a.volume_ml || 0) - (b.volume_ml || 0);
      if (activeFilter === 'done') return new Date(b.fed_at || b.expressed_at) - new Date(a.fed_at || a.expressed_at);
      return getPriorityScore(a) - getPriorityScore(b);
    });
  }, [activeBags, activeFilter, milkBags, search, sortMode]);

  const handleAddSave = useCallback((bag) => {
    onAddMilkBag(bag);
    setShowAddModal(false);
  }, [onAddMilkBag]);

  const handleEditSave = useCallback((updatedBag) => {
    onUpdateMilkBag(updatedBag.id, updatedBag);
    setEditingBag(null);
  }, [onUpdateMilkBag]);

  const scrollToDetails = () => {
    document.getElementById('milk-detail-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
        <GameIcon name="bottle" size={88} variant="cream" />
      </section>

      <section className="milk-kpi-grid">
        <article className="milk-kpi-card green">
          <span>Đã dùng hôm nay</span>
          <strong>{formatNumber(usedTodayMl)} <small>ml</small></strong>
          <p>Mục tiêu: {formatNumber(avgDailyMl)} ml</p>
          <div><span style={{ width: `${Math.min(100, avgDailyMl ? (usedTodayMl / avgDailyMl) * 100 : 0)}%` }} /></div>
        </article>
        <article className="milk-kpi-card pink">
          <span>Sắp hết hạn</span>
          <strong>{formatNumber(expiringSoonMl)} <small>ml</small></strong>
          <p>{summary.expiringSoonCount || 0} bịch</p>
          <div><span style={{ width: `${summary.expiringSoonCount ? 100 : 0}%` }} /></div>
        </article>
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
        <button className="milk-detail-link" type="button" onClick={scrollToDetails}>
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

        <div className="milk-search-tools">
          <label className="milk-search-box">
            <GameIcon name="search" size={22} variant="cream" bare />
            <input
              type="text"
              className="form-input"
              placeholder="Tìm ID, số ml, ghi chú, ngày hút..."
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
          </label>
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
          {FILTERS.map(filter => (
            <button
              key={filter.id}
              type="button"
              className={activeFilter === filter.id ? 'active' : ''}
              onClick={() => setActiveFilter(filter.id)}
            >
              {filter.label} <span>{filterCounts[filter.id] || 0}</span>
            </button>
          ))}
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
    </div>
  );
}
