import { useState, useMemo, useCallback } from 'react';
import { Plus, Milk, Flame, Snowflake, Droplets, AlertTriangle, ChevronRight, Trash2, CheckCheck, ArrowRightLeft } from 'lucide-react';
import {
  getSortedByPriority,
  getTimeRemaining,
  getFreezerAge,
  getAvgDailyMl,
  getThawRecommendation,
  getMilkSummary,
  transitionBag,
  formatDateTime,
  formatDateShort,
  formatTime,
  STATUS_CONFIG,
} from '../utils/milkUtils';
import AddMilkBagModal from './AddMilkBagModal';
import ThawModal from './ThawModal';

// ── Filter Tabs ───────────────────────────────────────────────
const FILTERS = [
  { id: 'all',      label: 'Tất cả' },
  { id: 'fridge',   label: '❄️ Ngăn mát' },
  { id: 'freezer',  label: '🧊 Ngăn đông' },
  { id: 'thawing',  label: '💧 Đang rã' },
  { id: 'thawed',   label: '✅ Đã rã' },
  { id: 'expiring', label: '⚠️ Sắp HH' },
  { id: 'done',     label: '✔️ Đã dùng' },
];

// ── MilkBagCard ───────────────────────────────────────────────
function MilkBagCard({ bag, onUpdate, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const [showThawModal, setShowThawModal] = useState(false);

  const cfg = STATUS_CONFIG[bag.storage_status] || STATUS_CONFIG.fridge;
  const remaining = bag.expiry_at ? getTimeRemaining(bag.expiry_at) : null;
  const freezerAge = bag.storage_status === 'freezer' ? getFreezerAge(bag) : null;

  const isDone = bag.storage_status === 'used' || bag.storage_status === 'expired';

  // ── Action Handlers ─────────────────────────────────────────
  const handleTransition = useCallback((newStatus, extra = {}) => {
    onUpdate(bag.id, transitionBag(bag, newStatus, extra));
  }, [bag, onUpdate]);

  const handleMoveTo = useCallback((newStatus) => {
    handleTransition(newStatus);
  }, [handleTransition]);

  const handleThawSave = useCallback((updatedBag) => {
    onUpdate(updatedBag.id, updatedBag);
    setShowThawModal(false);
  }, [onUpdate]);

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

    switch (bag.storage_status) {
      case 'room_temp':
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={btnStyle('#4FACFE', '#F0F8FF')} onClick={() => handleMoveTo('fridge')}>
              ❄️ Ngăn mát
            </button>
            <button style={btnStyle('#9B59B6', '#FBF5FF')} onClick={() => handleMoveTo('freezer')}>
              🧊 Ngăn đông
            </button>
            <button style={btnStyle('#00C9A7', '#F0FDFC')} onClick={() => handleTransition('used')}>
              <CheckCheck size={12} /> Đã dùng
            </button>
          </div>
        );
      case 'fridge':
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={btnStyle('#9B59B6', '#FBF5FF')} onClick={() => handleMoveTo('freezer')}>
              🧊 Vào ngăn đông
            </button>
            <button style={btnStyle('#4FACFE', '#F0F8FF')} onClick={() => setShowThawModal(true)}>
              💧 Lấy ra rã đông
            </button>
            <button style={btnStyle('#00C9A7', '#F0FDFC')} onClick={() => handleTransition('used')}>
              <CheckCheck size={12} /> Đã dùng
            </button>
          </div>
        );
      case 'freezer':
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ ...btnStyle('#4FACFE', '#F0F8FF'), flex: 'auto' }}
              onClick={() => setShowThawModal(true)}
            >
              💧 Lấy ra rã đông
            </button>
          </div>
        );
      case 'thawing':
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ ...btnStyle('#00C9A7', '#F0FDFC'), flex: 'auto' }}
              onClick={() => setShowThawModal(true)}
            >
              ✅ Đánh dấu đã tan hoàn toàn
            </button>
          </div>
        );
      case 'thawed':
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={btnStyle('#FF9A5C', '#FFF7F2')} onClick={() => handleTransition('warmed')}>
              🔥 Hâm / Đưa ra ngoài
            </button>
            <button style={btnStyle('#00C9A7', '#F0FDFC')} onClick={() => handleTransition('used')}>
              <CheckCheck size={12} /> Đã dùng
            </button>
          </div>
        );
      case 'warmed':
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ ...btnStyle('#FF6B6B', '#FFF5F5'), flex: 'auto' }}
              onClick={() => handleTransition('used')}
            >
              <CheckCheck size={12} /> Bé đã bú xong
            </button>
          </div>
        );
      case 'used':
      case 'expired':
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              style={{ ...btnStyle('#FF6B6B', '#FFF5F5'), flex: 'auto' }}
              onClick={() => onDelete(bag.id)}
            >
              <Trash2 size={12} /> Xoá khỏi kho
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
            background: `linear-gradient(135deg, ${cfg.color}20, ${cfg.color}10)`,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '3px 10px', borderRadius: 99,
                background: cfg.bg, color: cfg.color,
                fontSize: 11, fontWeight: 700,
                border: `1px solid ${cfg.border}`,
              }}>
                {cfg.emoji} {cfg.label}
              </span>

              {/* Urgency / Warning badge */}
              {remaining && !remaining.expired && remaining.urgent && (
                <span style={{
                  padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: '#FFF5F5', color: '#FF6B6B', border: '1px solid #FFB3B3',
                  animation: 'pulse-soft 1.5s ease-in-out infinite',
                }}>
                  🔴 Dùng ngay!
                </span>
              )}
              {remaining && !remaining.expired && remaining.warning && !remaining.urgent && (
                <span style={{
                  padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: '#FFF7F2', color: '#FF9A5C', border: '1px solid #FFCBA4',
                }}>
                  🟠 Sắp hết hạn
                </span>
              )}
              {freezerAge?.warnExpired && (
                <span style={{
                  padding: '3px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                  background: '#FFF7F2', color: '#FF9A5C', border: '1px solid #FFCBA4',
                }}>
                  ⚠️ Quá 6 tháng
                </span>
              )}
            </div>

            {/* Expressed time */}
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 2 }}>
              🕐 Hút {formatDateShort(bag.expressed_at)} lúc {formatTime(bag.expressed_at)}
            </div>

            {/* Expiry countdown / freezer age */}
            {remaining && (
              <div style={{
                fontSize: 12, fontWeight: 700,
                color: remaining.urgent ? '#FF6B6B' : remaining.warning ? '#FF9A5C' : remaining.expired ? '#FF6B6B' : '#00C9A7',
              }}>
                {remaining.expired
                  ? '❌ Đã hết hạn'
                  : `⏱️ Còn ${remaining.label}`}
              </div>
            )}
            {freezerAge && (
              <div style={{
                fontSize: 12, fontWeight: 600,
                color: freezerAge.warnExpired ? '#FF9A5C' : 'var(--color-text-muted)',
              }}>
                🧊 Đã trữ {freezerAge.label}
                {freezerAge.warnExpired ? ' · nên dùng sớm' : ''}
              </div>
            )}
            {bag.storage_status === 'thawing' && (
              <div style={{ fontSize: 12, color: '#4FACFE', fontWeight: 600 }}>
                💧 Đang rã đông · cần đánh dấu khi tan xong
              </div>
            )}
          </div>

          {/* Expand chevron */}
          <ChevronRight
            size={18}
            color="var(--color-text-light)"
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
                <span style={{ color: 'var(--color-text-muted)', width: 80 }}>🏷️ ID Bịch:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)', letterSpacing: '0.05em' }}>{bag.id.substring(0, 6).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-muted)', width: 80 }}>🕐 Hút lúc:</span>
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{formatDateTime(bag.expressed_at)}</span>
              </div>
              {bag.thaw_started_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>💧 Bắt đầu rã:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{formatDateTime(bag.thaw_started_at)}</span>
                </div>
              )}
              {bag.fully_thawed_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>✅ Tan hoàn toàn:</span>
                  <span style={{ fontWeight: 600, color: '#00C9A7' }}>{formatDateTime(bag.fully_thawed_at)}</span>
                </div>
              )}
              {bag.warmed_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>🔥 Hâm lúc:</span>
                  <span style={{ fontWeight: 600, color: '#FF9A5C' }}>{formatDateTime(bag.warmed_at)}</span>
                </div>
              )}
              {bag.expiry_at && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>⏰ Hạn dùng:</span>
                  <span style={{
                    fontWeight: 700,
                    color: remaining?.urgent ? '#FF6B6B' : remaining?.warning ? '#FF9A5C' : '#00C9A7',
                  }}>
                    {formatDateTime(bag.expiry_at)}
                  </span>
                </div>
              )}
              {bag.note && (
                <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
                  <span style={{ color: 'var(--color-text-muted)', width: 80 }}>📝 Ghi chú:</span>
                  <span style={{ fontWeight: 600, color: 'var(--color-text)', fontStyle: 'italic' }}>{bag.note}</span>
                </div>
              )}
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

// ── Thaw Recommendation Banner ────────────────────────────────
function ThawRecommendationBanner({ recommendation, onThawBag }) {
  if (!recommendation) return null;
  const { neededMl, toThaw, thawTimeLabel, thawDateLabel, avgDailyMl, availableMl } = recommendation;

  return (
    <div style={{
      margin: '0 16px 12px',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(135deg, #667EEA20, #764BA220)',
      border: '1.5px solid #667EEA40',
      padding: '14px 16px',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>💡</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#5B4FCF', marginBottom: 4 }}>
            Gợi ý rã đông {thawTimeLabel}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 10, lineHeight: 1.5 }}>
            Bé cần ~{avgDailyMl}ml/ngày. Sẵn dùng ngày mai: ~{availableMl}ml.
            Nên rã đông thêm <strong style={{ color: '#FF9A5C' }}>~{neededMl}ml</strong>:
          </div>

          {/* Bags to thaw */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
            {toThaw.map((bag, i) => (
              <div key={bag.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: 'rgba(255,255,255,0.7)', borderRadius: 10,
                padding: '8px 12px',
                border: '1px solid #667EEA20',
              }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#5B4FCF' }}>
                    🧊 {bag.volume_ml}ml
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginLeft: 6 }}>
                    Hút {formatDateShort(bag.expressed_at)}
                    {` · ID: ${bag.id.substring(0, 6).toUpperCase()}`}
                  </span>
                </div>
                <button
                  onClick={() => onThawBag(bag)}
                  style={{
                    padding: '4px 12px', borderRadius: 99,
                    border: 'none', background: '#667EEA',
                    color: 'white', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Rã đông
                </button>
              </div>
            ))}
          </div>

          <div style={{ fontSize: 11, color: '#5B4FCF', fontWeight: 600, opacity: 0.8 }}>
            🕘 Nên bắt đầu {thawTimeLabel} để bé có sữa dùng vào ngày mai.
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Tab ──────────────────────────────────────────────────
export default function MilkStorageTab({
  milkBags,
  records,
  onAddMilkBag,
  onUpdateMilkBag,
  onDeleteMilkBag,
  onNavigateToDashboard,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [thawingBag, setThawingBag] = useState(null);

  const avgDailyMl = useMemo(() => getAvgDailyMl(records, 7), [records]);
  const summary = useMemo(() => getMilkSummary(milkBags), [milkBags]);
  const sortedBags = useMemo(() => getSortedByPriority(milkBags), [milkBags]);
  const thawRec = useMemo(() => getThawRecommendation(milkBags, avgDailyMl), [milkBags, avgDailyMl]);

  // Filtered bags
  const filteredBags = useMemo(() => {
    const active = milkBags.filter(b => b.storage_status !== 'used' && b.storage_status !== 'expired');
    const done = milkBags.filter(b => b.storage_status === 'used' || b.storage_status === 'expired');

    switch (activeFilter) {
      case 'fridge':   return active.filter(b => b.storage_status === 'fridge');
      case 'freezer':  return active.filter(b => b.storage_status === 'freezer');
      case 'thawing':  return active.filter(b => b.storage_status === 'thawing');
      case 'thawed':   return active.filter(b => b.storage_status === 'thawed' || b.storage_status === 'warmed');
      case 'expiring': return active.filter(b => {
        if (!b.expiry_at) return false;
        const r = getTimeRemaining(b.expiry_at);
        return r && !r.expired && r.hours < 24;
      });
      case 'done':     return done.slice(0, 20);
      default:         return sortedBags;
    }
  }, [milkBags, activeFilter, sortedBags]);

  const handleAddSave = useCallback((bag) => {
    onAddMilkBag(bag);
    setShowAddModal(false);
  }, [onAddMilkBag]);

  const handleThawFromRec = useCallback((bag) => {
    setThawingBag(bag);
  }, []);

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
        background: 'linear-gradient(160deg, #EEF2FF 0%, var(--color-surface) 100%)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              🍼 Smart Inventory
            </p>
            <h1 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 800, color: 'var(--color-text)' }}>
              Kho sữa mẹ
            </h1>
            {avgDailyMl > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--color-text-muted)' }}>
                Bé bú TB <strong style={{ color: '#667EEA' }}>{avgDailyMl}ml/ngày</strong> (7 ngày gần nhất)
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
              background: 'linear-gradient(135deg, #4FACFE, #9B59B6)',
              color: 'white', fontFamily: 'Outfit, sans-serif',
              fontSize: 14, fontWeight: 700,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.35)',
            }}
          >
            <Plus size={18} /> Thêm bịch
          </button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="stats-grid">
        {[
          { label: 'Tổng kho', value: `${summary.totalMl}ml`, emoji: '🍼', color: '#667EEA', bg: '#EEF2FF' },
          { label: 'Dùng hôm nay', value: `${summary.usableTodayMl}ml`, emoji: '✅', color: '#00C9A7', bg: '#F0FDFC' },
          {
            label: 'Sắp hết hạn',
            value: summary.expiringSoonCount,
            emoji: '⚠️',
            color: summary.expiringSoonCount > 0 ? '#FF9A5C' : '#8E7DAE',
            bg: summary.expiringSoonCount > 0 ? '#FFF7F2' : '#F8F4FF',
          },
          {
            label: 'Cần rã đông',
            value: thawRec ? `${thawRec.toThaw.length} bịch` : '–',
            emoji: '💧',
            color: thawRec ? '#667EEA' : '#8E7DAE',
            bg: thawRec ? '#EEF2FF' : '#F8F4FF',
          },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: '12px 14px', background: stat.bg, border: `1px solid ${stat.color}20` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
              {stat.emoji} {stat.label}
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
          background: 'linear-gradient(135deg, #FF6B6B15, #FF9A5C10)',
          border: '2px solid #FF6B6B40',
          animation: 'pulse-soft 2s ease-in-out infinite',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <AlertTriangle size={16} color="#FF6B6B" />
            <span style={{ fontSize: 13, fontWeight: 800, color: '#FF6B6B' }}>
              {urgentBags.length} bịch cần dùng ngay!
            </span>
          </div>
          {urgentBags.map(b => {
            const r = getTimeRemaining(b.expiry_at);
            return (
              <div key={b.id} style={{ fontSize: 12, color: 'var(--color-text-muted)', marginLeft: 24 }}>
                • {b.volume_ml}ml ({STATUS_CONFIG[b.storage_status]?.label}) — còn {r?.label}
              </div>
            );
          })}
        </div>
      )}

      {/* Thaw Recommendation */}
      <ThawRecommendationBanner
        recommendation={thawRec}
        onThawBag={handleThawFromRec}
      />

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 6, padding: '0 16px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setActiveFilter(f.id)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-full)',
              border: `2px solid ${activeFilter === f.id ? '#667EEA' : 'var(--color-border)'}`,
              background: activeFilter === f.id ? '#667EEA' : 'var(--color-surface-alt)',
              color: activeFilter === f.id ? 'white' : 'var(--color-text-muted)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s ease', whiteSpace: 'nowrap',
              fontFamily: 'Outfit, sans-serif',
              flexShrink: 0,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bag list */}
      <div style={{ padding: '0 16px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filteredBags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>
              {activeFilter === 'done' ? '✔️' : '🍼'}
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
                  background: 'linear-gradient(135deg, #4FACFE, #9B59B6)',
                  color: 'white', boxShadow: '0 4px 15px rgba(79,172,254,0.35)',
                }}
              >
                <Plus size={18} /> Thêm bịch đầu tiên
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
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddMilkBagModal
          onSave={handleAddSave}
          onClose={() => setShowAddModal(false)}
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
