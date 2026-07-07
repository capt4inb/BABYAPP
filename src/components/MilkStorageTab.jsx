import { useState, useMemo, useCallback } from 'react';
import {
  getPriorityScore,
  getTimeRemaining,
  getFreezerAge,
  getAvgDailyMl,
  getMilkSummary,
  transitionBag,
  formatDateTime,
  formatDateShort,
  formatTime,
  STATUS_CONFIG, getDailyTotals,
} from '../utils/milkUtils';
import AddMilkBagModal from './AddMilkBagModal';
import ThawModal from './ThawModal';
import SwipeToComplete from './SwipeToComplete';
import GameIcon from './GameIcon';

// Custom Toggle removed

// ── Filter Tabs ───────────────────────────────────────────────
const FILTERS = [
  { id: 'all',      label: 'Tất cả' },
  { id: 'fridge',   label: 'Ngăn mát' },
  { id: 'freezer',  label: 'Ngăn đông' },
  { id: 'thawing',  label: 'Đang rã' },
  { id: 'thawed',   label: 'Đã rã' },
  { id: 'expiring', label: 'Sắp HH' },
  { id: 'done',     label: 'Đã dùng' },
];

// ── MilkBagCard ───────────────────────────────────────────────
function MilkBagCard({ bag, onUpdate, onDelete, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const [showThawModal, setShowThawModal] = useState(false);
  const [isFeedingPartially, setIsFeedingPartially] = useState(false);
  const [feedVolume, setFeedVolume] = useState('');
  const [feedError, setFeedError] = useState('');

  const displayStatus = bag.storage_status === 'using' ? (bag.previous_status || 'fridge') : bag.storage_status;
  const cfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.fridge;
  const remaining = bag.expiry_at ? getTimeRemaining(bag.expiry_at) : null;
  const freezerAge = displayStatus === 'freezer' ? getFreezerAge(bag) : null;

  const isDone = bag.storage_status === 'used' || bag.storage_status === 'expired';

  // ── Action Handlers ─────────────────────────────────────────
  const handleTransition = useCallback((newStatus, extra = {}) => {
    onUpdate(bag.id, transitionBag(bag, newStatus, extra));
  }, [bag, onUpdate]);

  const handleMoveTo = useCallback((newStatus) => {
    handleTransition(newStatus);
  }, [handleTransition]);

  const handleFinishFeeding = useCallback(() => {
    onUpdate(bag.id, transitionBag(bag, 'used'));
  }, [bag, onUpdate]);



  const handleThawSave = useCallback((updatedBag) => {
    onUpdate(updatedBag.id, updatedBag);
    setShowThawModal(false);
  }, [onUpdate]);

  const handlePartialFeedSubmit = useCallback(() => {
    const vol = parseFloat(feedVolume);
    if (!vol || vol <= 0 || vol > bag.volume_ml) {
      setFeedError(`Lượng sữa phải từ 1 đến ${bag.volume_ml}ml.`);
      return;
    }
    setFeedError('');

    const remainingVol = bag.volume_ml - vol;
    if (remainingVol <= 0) {
      onUpdate(bag.id, transitionBag(bag, 'used'));
    } else {
      onUpdate(bag.id, {
        ...bag,
        volume_ml: remainingVol,
        note: bag.note ? `${bag.note} (Còn lại ${remainingVol}ml)` : `Còn lại ${remainingVol}ml`,
      });
    }

    setIsFeedingPartially(false);
    setFeedVolume('');
  }, [bag, onUpdate, feedVolume]);

  // ── Status-specific action buttons ──────────────────────────
  const renderActions = () => {
    const btnStyle = (color, bg) => ({
      flex: 1,
      padding: '8px 10px',
      borderRadius: 10,
      border: `1.5px solid ${color}30`,
      background: bg,
      color,
      fontFamily: 'Outfit, sans-serif',
      fontSize: 12,
      fontWeight: 700,
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      whiteSpace: 'nowrap',
    });

    const partialFeedInput = isFeedingPartially && (
      <div style={{
        marginTop: 6,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'var(--color-surface-alt)',
        border: '1.5px dashed var(--color-primary-light)',
        animation: 'fadeIn 0.25s ease-out',
        width: '100%',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
          <GameIcon name="bottle" size={18} variant="pink" bare /> Nhập lượng sữa bé đã bú
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="number"
              className="form-input"
              placeholder="Ví dụ: 80"
              value={feedVolume}
              onChange={e => setFeedVolume(e.target.value)}
              min="1"
              max={bag.volume_ml}
              style={{
                padding: '8px 12px',
                fontSize: 13,
                borderRadius: 8,
                border: '1.5px solid var(--color-border)',
                background: 'white',
                paddingRight: 36,
                width: '100%',
              }}
            />
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)',
            }}>ml</span>
          </div>
          <button
            type="button"
            onClick={handlePartialFeedSubmit}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--color-primary)',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Lưu
          </button>
          <button
            type="button"
            onClick={() => {
              setIsFeedingPartially(false);
              setFeedVolume('');
              setFeedError('');
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--color-border)',
              color: 'var(--color-text-muted)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Outfit, sans-serif',
            }}
          >
            Huỷ
          </button>
        </div>
        {feedError && (
          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>
            {feedError}
          </p>
        )}
      </div>
    );

    switch (bag.storage_status) {
      case 'room_temp':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button style={btnStyle('#7581D5', '#F4F5FF')} onClick={() => handleMoveTo('fridge')}>
                <GameIcon name="snow" size={22} variant="blue" /> Ngăn mát
              </button>
              <button style={btnStyle('#837ACB', '#F5F3FF')} onClick={() => handleMoveTo('freezer')}>
                <GameIcon name="snow" size={22} variant="lavender" /> Ngăn đông
              </button>
              <button style={btnStyle('#D875A2', '#FFF3F8')} onClick={() => setIsFeedingPartially(prev => !prev)}>
                <GameIcon name="bottle" size={22} variant="pink" /> Bú một phần
              </button>
            </div>
            <div style={{ marginTop: 4 }}>
              <SwipeToComplete
                label="Trượt để hoàn thành bịch sữa"
                onComplete={() => handleTransition('used')}
              />
            </div>
            {partialFeedInput}
          </div>
        );
      case 'fridge':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button style={btnStyle('#837ACB', '#F5F3FF')} onClick={() => handleMoveTo('freezer')}>
                <GameIcon name="snow" size={22} variant="lavender" /> Vào ngăn đông
              </button>
              <button style={btnStyle('#D875A2', '#FFF3F8')} onClick={() => setIsFeedingPartially(prev => !prev)}>
                <GameIcon name="bottle" size={22} variant="pink" /> Bú một phần
              </button>
            </div>
            <div style={{ marginTop: 4 }}>
              <SwipeToComplete
                label="Trượt để hoàn thành bịch sữa"
                onComplete={() => handleTransition('used')}
              />
            </div>
            {partialFeedInput}
          </div>
        );
      case 'freezer':
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ ...btnStyle('#7581D5', '#F4F5FF'), flex: 'auto' }}
              onClick={() => setShowThawModal(true)}
            >
              <GameIcon name="drop" size={22} variant="blue" /> Lấy ra rã đông
            </button>
          </div>
        );
      case 'thawing':
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ ...btnStyle('#39A98F', '#F1FBF7'), flex: 'auto' }}
              onClick={() => setShowThawModal(true)}
            >
              <GameIcon name="check" size={22} variant="green" /> Đánh dấu đã tan hoàn toàn
            </button>
          </div>
        );
      case 'thawed':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button style={btnStyle('#DF9A63', '#FFF6EF')} onClick={() => handleTransition('warmed')}>
                <GameIcon name="flame" size={22} variant="orange" /> Hâm sữa
              </button>
              <button style={btnStyle('#D875A2', '#FFF3F8')} onClick={() => setIsFeedingPartially(prev => !prev)}>
                <GameIcon name="bottle" size={22} variant="pink" /> Bú một phần
              </button>
            </div>
            <div style={{ marginTop: 4 }}>
              <SwipeToComplete
                label="Trượt để hoàn thành bịch sữa"
                onComplete={() => handleTransition('used')}
              />
            </div>
            {partialFeedInput}
          </div>
        );
      case 'warmed':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button style={btnStyle('#D875A2', '#FFF3F8')} onClick={() => setIsFeedingPartially(prev => !prev)}>
                <GameIcon name="bottle" size={22} variant="pink" /> Bú một phần
              </button>
            </div>
            <div style={{ marginTop: 4 }}>
              <SwipeToComplete
                label="Trượt để hoàn thành bịch sữa"
                onComplete={() => handleTransition('used')}
              />
            </div>
            {partialFeedInput}
          </div>
        );
      case 'using':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 6 }}>
            <div>
              <SwipeToComplete
                label="Trượt để hoàn thành (Hết bịch)"
                onComplete={handleFinishFeeding}
              />
            </div>
          </div>
        );
      case 'used':
      case 'expired':
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ ...btnStyle('#E36B74', '#FFF3F4'), flex: 'auto' }}
              onClick={() => onDelete(bag.id)}
            >
              <GameIcon name="trash" size={22} variant="orange" /> Xoá khỏi kho
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div
        className="milk-bag-card"
        style={{
          borderLeft: `4px solid ${cfg.color}`,
          background: isDone ? '#FAFAFA' : 'white',
          opacity: isDone ? 0.7 : 1,
          animation: 'fadeIn 0.3s ease-out',
        }}
      >
        {/* Card Header - always visible */}
        <button
          style={{
            width: '100%', display: 'flex', alignItems: 'flex-start',
            gap: 12, padding: '14px 14px 10px', background: 'none', border: 'none',
            cursor: 'pointer', textAlign: 'left',
          }}
          onClick={() => setExpanded(e => !e)}
        >
          {/* Volume circle */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: cfg.bg,
            border: `2px solid ${cfg.color}40`,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: cfg.color, lineHeight: 1 }}>
              {bag.volume_ml}
            </span>
            <span style={{ fontSize: 10, color: cfg.color, opacity: 0.8 }}>ml</span>
          </div>

          {/* Main info */}
          <div style={{ flex: 1 }}>
            {/* Status + Priority */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '3px 10px', borderRadius: 99,
                  background: cfg.bg, color: cfg.color,
                  fontSize: 11, fontWeight: 700,
                  border: `1px solid ${cfg.border}`,
                }}>
                  <GameIcon name={cfg.icon || 'tag'} size={14} variant="cream" bare /> {cfg.label}
                </span>

                {bag.storage_status === 'using' && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '3px 10px', borderRadius: 99,
                    background: '#FFF3F8', color: 'var(--color-primary)',
                    fontSize: 11, fontWeight: 700,
                    border: '1px solid #FFB3CC',
                  }}>
                    <GameIcon name="bottle" size={14} variant="cream" bare /> Đang dùng
                  </span>
                )}

                {/* Urgency / Warning badge */}
                {remaining && !remaining.expired && remaining.urgent && (
                  <span style={{
                    padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: '#FFF3F4', color: 'var(--color-danger)', border: '1px solid #F2C1C5',
                    animation: 'pulse-soft 1.5s ease-in-out infinite',
                  }}>
                    Dùng ngay!
                  </span>
                )}
                {remaining && !remaining.expired && remaining.warning && !remaining.urgent && (
                  <span style={{
                    padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: '#FFF6EF', color: 'var(--color-pump)', border: '1px solid #F3D3B8',
                  }}>
                    Sắp hết hạn
                  </span>
                )}
                {freezerAge?.warnExpired && (
                  <span style={{
                    padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: '#FFF6EF', color: 'var(--color-pump)', border: '1px solid #F3D3B8',
                  }}>
                    Quá 6 tháng
                  </span>
                )}
              </div>


            </div>

            {/* Expressed time */}
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>
              Hút {formatDateShort(bag.expressed_at)} lúc {formatTime(bag.expressed_at)}
            </div>

            {/* Expiry countdown / freezer age */}
            {remaining && (
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: remaining.urgent ? 'var(--color-danger)' : remaining.warning ? 'var(--color-pump)' : remaining.expired ? 'var(--color-danger)' : 'var(--color-success)',
              }}>
                {remaining.expired
                  ? 'Đã hết hạn'
                  : `Còn ${remaining.label}`}
              </div>
            )}
            {freezerAge && (
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: freezerAge.warnExpired ? 'var(--color-pump)' : 'var(--color-text-muted)',
              }}>
                Đã trữ {freezerAge.label}
                {freezerAge.warnExpired ? ' · nên dùng sớm' : ''}
              </div>
            )}
            {bag.storage_status === 'thawing' && (
              <div style={{ fontSize: 12, color: 'var(--color-baby)', fontWeight: 600 }}>
                Đang rã đông · cần đánh dấu khi tan xong
              </div>
            )}
          </div>

          {/* Expand chevron */}
          <GameIcon
            name="right"
            size={24}
            variant="cream"
            style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
          />
        </button>

        {/* Expanded details */}
        {expanded && (
          <div style={{ padding: '0 14px 14px', animation: 'slideDown 0.2s ease-out' }}>
            {/* Detail rows */}
            <div style={{
              background: 'var(--color-surface-alt)', borderRadius: 10,
              padding: '10px 12px', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-muted)', width: 80 }}>ID Bịch:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.05em' }}>{bag.id.substring(0, 6).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-muted)', width: 80 }}>Hút lúc:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{formatDateTime(bag.expressed_at)}</span>
              </div>
              {bag.thaw_started_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>Bắt đầu rã:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{formatDateTime(bag.thaw_started_at)}</span>
                </div>
              )}
              {bag.fully_thawed_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>✅ Tan hoàn toàn:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>{formatDateTime(bag.fully_thawed_at)}</span>
                </div>
              )}
              {bag.warmed_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>Hâm lúc:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-pump)' }}>{formatDateTime(bag.warmed_at)}</span>
                </div>
              )}
              {bag.expiry_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>⏰ Hạn dùng:</span>
                  <span style={{
                    fontWeight: 700,
                    color: remaining?.urgent ? 'var(--color-danger)' : remaining?.warning ? 'var(--color-pump)' : 'var(--color-success)',
                  }}>
                    {formatDateTime(bag.expiry_at)}
                  </span>
                </div>
              )}
              {bag.note && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>Ghi chú:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)', fontStyle: 'italic' }}>{bag.note}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10, borderTop: '1px dashed var(--color-border)', paddingTop: 10 }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(bag);
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1.5px solid var(--color-primary-light)',
                    background: 'white',
                    color: 'var(--color-primary)',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontFamily: 'Outfit, sans-serif',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'var(--color-primary-bg)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'white'; }}
                >
                  <GameIcon name="edit" size={16} variant="cream" bare /> Sửa bịch sữa
                </button>
              </div>
            </div>

            {/* Actions */}
            {renderActions()}
          </div>
        )}
      </div>

      {/* Thaw Modal */}
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

// ── Main Tab ──────────────────────────────────────────────────
export default function MilkStorageTab({
  milkBags,
  records,
  onAddMilkBag,
  onUpdateMilkBag,
  onDeleteMilkBag,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBag, setEditingBag] = useState(null);
  const [thawingBag, setThawingBag] = useState(null);

  // Sorting and Date Filtering states
  const [sortBy, setSortBy] = useState('priority');
  const [dateFilterType, setDateFilterType] = useState('all');
  const [customDate, setCustomDate] = useState('');

  const avgDailyMl = useMemo(() => getAvgDailyMl(records, 7), [records]);
  const summary = useMemo(() => getMilkSummary(milkBags), [milkBags]);
  // Daily total milk per expressed date
  const dailyTotals = useMemo(() => getDailyTotals(milkBags), [milkBags]);

  const filterVolumes = useMemo(() => {
    const active = milkBags.filter(b => b.storage_status !== 'used' && b.storage_status !== 'expired');
    const done = milkBags.filter(b => b.storage_status === 'used' || b.storage_status === 'expired');
    const sum = (list) => list.reduce((s, b) => s + (b.volume_ml || 0), 0);
    return {
      all: sum(active),
      fridge: sum(active.filter(b => b.storage_status === 'fridge' || (b.storage_status === 'using' && b.previous_status === 'fridge'))),
      freezer: sum(active.filter(b => b.storage_status === 'freezer' || (b.storage_status === 'using' && b.previous_status === 'freezer'))),
      thawing: sum(active.filter(b => b.storage_status === 'thawing' || (b.storage_status === 'using' && b.previous_status === 'thawing'))),
      thawed: sum(active.filter(b => 
        b.storage_status === 'thawed' || 
        b.storage_status === 'warmed' || 
        (b.storage_status === 'using' && (b.previous_status === 'thawed' || b.previous_status === 'warmed'))
      )),
      expiring: sum(active.filter(b => {
        if (!b.expiry_at) return false;
        const r = getTimeRemaining(b.expiry_at);
        return r && !r.expired && r.hours < 24;
      })),
      done: sum(done),
    };
  }, [milkBags]);

  // Filtered bags
  const filteredBags = useMemo(() => {
    // 1. Filter by expressed date
    const dateFiltered = milkBags.filter(b => {
      const bagDate = new Date(b.expressed_at);
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      switch (dateFilterType) {
        case 'today':
          return bagDate >= startOfToday;
        case 'yesterday': {
          const startOfYesterday = new Date(startOfToday);
          startOfYesterday.setDate(startOfYesterday.getDate() - 1);
          return bagDate >= startOfYesterday && bagDate < startOfToday;
        }
        case '3-days': {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 2); // Today and 2 days before
          return bagDate >= limit;
        }
        case '7-days': {
          const limit = new Date(startOfToday);
          limit.setDate(limit.getDate() - 6); // Today and 6 days before
          return bagDate >= limit;
        }
        case 'custom': {
          if (!customDate) return true;
          const targetDate = new Date(customDate);
          const start = new Date(targetDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(targetDate);
          end.setHours(23, 59, 59, 999);
          return bagDate >= start && bagDate <= end;
        }
        default:
          return true;
      }
    });

    const active = dateFiltered.filter(b => b.storage_status !== 'used' && b.storage_status !== 'expired');
    const done = dateFiltered.filter(b => b.storage_status === 'used' || b.storage_status === 'expired');

    let list;
    switch (activeFilter) {
      case 'fridge':   list = active.filter(b => b.storage_status === 'fridge' || (b.storage_status === 'using' && b.previous_status === 'fridge')); break;
      case 'freezer':  list = active.filter(b => b.storage_status === 'freezer' || (b.storage_status === 'using' && b.previous_status === 'freezer')); break;
      case 'thawing':  list = active.filter(b => b.storage_status === 'thawing' || (b.storage_status === 'using' && b.previous_status === 'thawing')); break;
      case 'thawed':   list = active.filter(b => 
        b.storage_status === 'thawed' || 
        b.storage_status === 'warmed' || 
        (b.storage_status === 'using' && (b.previous_status === 'thawed' || b.previous_status === 'warmed'))
      ); break;
      case 'expiring': list = active.filter(b => {
        if (!b.expiry_at) return false;
        const r = getTimeRemaining(b.expiry_at);
        return r && !r.expired && r.hours < 24;
      }); break;
      case 'done':     list = done; break;
      default:         list = active; break; // active for 'all'
    }

    // 2. Sort the list
    const sorted = [...list];
    if (sortBy === 'priority' && activeFilter !== 'done') {
      sorted.sort((a, b) => getPriorityScore(a) - getPriorityScore(b));
    } else if (sortBy === 'date-desc') {
      sorted.sort((a, b) => new Date(b.expressed_at) - new Date(a.expressed_at));
    } else if (sortBy === 'date-asc') {
      sorted.sort((a, b) => new Date(a.expressed_at) - new Date(b.expressed_at));
    } else if (sortBy === 'volume-desc') {
      sorted.sort((a, b) => b.volume_ml - a.volume_ml);
    } else if (sortBy === 'volume-asc') {
      sorted.sort((a, b) => a.volume_ml - b.volume_ml);
    }

    if (activeFilter === 'done') {
      return sorted.slice(0, 20);
    }
    return sorted;
  }, [milkBags, activeFilter, sortBy, dateFilterType, customDate]);

  const handleAddSave = useCallback((bag) => {
    onAddMilkBag(bag);
    setShowAddModal(false);
  }, [onAddMilkBag]);

  const handleEditSave = useCallback((updatedBag) => {
    onUpdateMilkBag(updatedBag.id, updatedBag);
    setEditingBag(null);
  }, [onUpdateMilkBag]);



  const handleThawSave = useCallback((updatedBag) => {
    onUpdateMilkBag(updatedBag.id, updatedBag);
    setThawingBag(null);
  }, [onUpdateMilkBag]);

  // Urgent alerts
  const urgentBags = summary.urgentBags || [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{
        padding: '20px 16px 16px',
        background: 'var(--color-base-200)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              <GameIcon name="bottle" size={18} variant="blue" bare /> Smart Inventory
            </p>
            <h1 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 800, color: 'var(--color-text)' }}>
              Kho sữa mẹ
            </h1>
            {avgDailyMl > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Bé bú TB <strong style={{ color: 'var(--color-baby)' }}>{avgDailyMl}ml/ngày</strong> (7 ngày gần nhất)
              </p>
            )}
          </div>
          <button
            id="btn-add-milk-bag"
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 'var(--radius-full)',
              border: 'none', cursor: 'pointer',
              background: 'var(--color-primary)',
              color: 'white', fontFamily: 'Outfit, sans-serif',
              fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.35)',
            }}
          >
            <GameIcon name="plus" size={28} variant="cream" /> Thêm bịch
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="stats-grid">
        {[
          { label: 'Tổng kho', value: `${summary.totalMl}ml`, icon: 'bottle', color: 'var(--color-baby)', bg: '#F4F5FF' },
          { label: 'Dùng hôm nay', value: `${summary.usableTodayMl}ml`, icon: 'check', color: 'var(--color-success)', bg: '#F1FBF7' },
          {
            label: 'Sắp hết hạn',
            value: summary.expiringSoonCount,
            icon: 'warning',
            color: summary.expiringSoonCount > 0 ? 'var(--color-pump)' : 'var(--color-secondary)',
            bg: summary.expiringSoonCount > 0 ? '#FFF6EF' : '#F5F3FF',
          },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '12px 14px', background: stat.bg, border: `1px solid ${stat.color}20` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              <GameIcon name={stat.icon} size={14} variant="cream" bare /> {stat.label}
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Urgent alert banner */}
      {urgentBags.length > 0 && (
        <div style={{
          margin: '0 16px 12px',
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-primary-bg)',
          border: '2px solid rgba(227, 107, 116, 0.24)',
          animation: 'pulse-soft 2s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <GameIcon name="warning" size={28} variant="orange" />
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-danger)' }}>
              {urgentBags.length} bịch cần dùng ngay!
            </span>
          </div>
          {urgentBags.map(b => {
            const r = getTimeRemaining(b.expiry_at);
            return (
              <div key={b.id} style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 24 }}>
                {b.volume_ml}ml ({STATUS_CONFIG[b.storage_status]?.label}) - còn {r?.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Thaw Recommendation - Hidden by user request */}

<div style={{ padding: '0 16px 12px' }}>
  <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--color-text)' }}>Tổng lượng sữa mỗi ngày</h2>
  {dailyTotals.map(item => (
    <div key={item.date} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--color-border)' }}>
      <span>{item.date}</span>
      <span>{item.total}ml</span>
    </div>
  ))}
</div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {FILTERS.filter(f => f.id !== 'expiring' && f.id !== 'done').map(f => {
          const vol = filterVolumes[f.id] || 0;
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '6px 14px', borderRadius: 'var(--radius-full)',
                border: `2px solid ${activeFilter === f.id ? 'var(--color-baby)' : 'var(--color-border)'}`,
                background: activeFilter === f.id ? 'var(--color-baby)' : 'var(--color-surface-alt)',
                color: activeFilter === f.id ? 'white' : 'var(--color-text-muted)',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s ease', whiteSpace: 'nowrap',
                fontFamily: 'Outfit, sans-serif',
                flexShrink: 0,
              }}
            >
              {f.label} ({vol}ml)
            </button>
          );
        })}
      </div>

      {/* Sort and Date Filter Controls */}
      <div style={{
        display: 'flex', gap: 10, padding: '0 16px 14px',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Sort select */}
        <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <GameIcon name="sliders" size={22} variant="cream" /> Sắp xếp
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <option value="priority">Gợi ý dùng trước</option>
            <option value="date-desc">Hút mới nhất</option>
            <option value="date-asc">Hút cũ nhất</option>
            <option value="volume-desc">Nhiều ml nhất</option>
            <option value="volume-asc">Ít ml nhất</option>
          </select>
        </div>

        {/* Date Filter select */}
        <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <GameIcon name="calendar" size={22} variant="cream" /> Ngày hút
          </span>
          <select
            value={dateFilterType}
            onChange={e => setDateFilterType(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 10px',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--color-border)',
              background: 'var(--color-card)',
              color: 'var(--color-text)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              outline: 'none',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <option value="all">Tất cả ngày</option>
            <option value="today">Hôm nay</option>
            <option value="yesterday">Hôm qua</option>
            <option value="3-days">3 ngày gần nhất</option>
            <option value="7-days">7 ngày gần nhất</option>
            <option value="custom">Chọn ngày cụ thể...</option>
          </select>
        </div>

        {/* Custom date input */}
        {dateFilterType === 'custom' && (
          <div style={{ flex: '1 0 100%', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 2, animation: 'slideDown 0.2s ease-out' }}>
            <input
              type="date"
              value={customDate}
              onChange={e => setCustomDate(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1.5px solid var(--color-border)',
                background: 'var(--color-card)',
                color: 'var(--color-text)',
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Outfit, sans-serif',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)',
              }}
            />
          </div>
        )}
      </div>

      {/* Bag list */}
      <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredBags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              <GameIcon name={activeFilter === 'done' ? 'check' : 'bottle'} size={48} variant="blue" />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
              {activeFilter === 'done' ? 'Chưa có bịch nào đã dùng' : 'Kho đang trống'}
            </h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
              {activeFilter === 'done'
                ? 'Khi bé bú xong một bịch, nó sẽ xuất hiện ở đây.'
                : 'Thêm bịch sữa đầu tiên để bắt đầu quản lý kho.'}
            </p>
            {activeFilter === 'all' && (
              <button
                className="btn"
                onClick={() => setShowAddModal(true)}
                style={{
                  background: 'var(--color-primary)',
                  color: 'white', boxShadow: '0 4px 15px rgba(117,129,213,0.22)',
                }}
              >
                <GameIcon name="plus" size={28} variant="cream" /> Thêm bịch đầu tiên
              </button>
            )}
          </div>
        ) : (
          filteredBags.map(bag => (
            <MilkBagCard
              key={bag.id}
              bag={bag}
              onUpdate={(id, updated) => onUpdateMilkBag(id, updated)}
              onDelete={onDeleteMilkBag}
              onEdit={(b) => setEditingBag(b)}
            />
          ))
        )}
      </div>

      {/* Modals */}
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

      {thawingBag && (
        <ThawModal
          bag={thawingBag}
          onSave={handleThawSave}
          onClose={() => setThawingBag(null)}
        />
      )}
    </div>
  );
}
