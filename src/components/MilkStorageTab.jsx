import { useState, useMemo, useCallback } from 'react';
import { Plus, Milk, Flame, Snowflake, Droplets, AlertTriangle, ChevronRight, Trash2, CheckCheck, ArrowRightLeft, Calendar, SlidersHorizontal } from 'lucide-react';
import {
  getPriorityScore,
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

// ── Custom Toggle ─────────────────────────────────────────────
const CustomToggle = ({ checked, onChange }) => (
  <div 
    onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
    style={{
      width: 40, height: 22, borderRadius: 12,
      background: checked ? '#FF6B9D' : '#E2E8F0',
      position: 'relative', cursor: 'pointer',
      transition: 'background 0.2s',
      display: 'flex', alignItems: 'center', padding: 2,
      flexShrink: 0
    }}
  >
    <div style={{
      width: 18, height: 18, borderRadius: '50%', background: 'white',
      transform: checked ? 'translateX(18px)' : 'translateX(0)',
      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }} />
  </div>
);

// ── Filter Tabs ───────────────────────────────────────────────
const FILTERS = [
  { id: 'all',      label: 'Tất cả' },
  { id: 'fridge',   label: '❄️ Ngăn mát' },
  { id: 'freezer',  label: '🧊 Ngăn đông' },
  { id: 'thawing',  label: '💧 Đang rã' },
  { id: 'thawed',   label: '✅ Đã rã' },
  { id: 'using',    label: '🍼 Đang dùng' },
  { id: 'expiring', label: '⚠️ Sắp HH' },
  { id: 'done',     label: '✔️ Đã dùng' },
];

// ── MilkBagCard ───────────────────────────────────────────────
function MilkBagCard({ bag, onUpdate, onDelete, onAddRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [showThawModal, setShowThawModal] = useState(false);
  const [isFeedingPartially, setIsFeedingPartially] = useState(false);
  const [feedVolume, setFeedVolume] = useState('');
  const [feedError, setFeedError] = useState('');

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

  const handleFinishFeeding = useCallback(() => {
    if (onAddRecord && bag.volume_ml > 0) {
      onAddRecord({
        id: crypto.randomUUID(),
        type: 'feed',
        side: 'bottle',
        volume: bag.volume_ml,
        timestamp: new Date().toISOString(),
        note: bag.note ? `Dùng hết bịch sữa: ${bag.note}` : `Dùng hết bịch sữa ${bag.id.substring(0, 6).toUpperCase()}`,
      });
    }
    onUpdate(bag.id, transitionBag(bag, 'used'));
  }, [bag, onUpdate, onAddRecord]);

  const handleToggleUsing = useCallback((checked) => {
    if (checked) {
      onUpdate(bag.id, transitionBag(bag, 'using', { previous_status: bag.storage_status }));
    } else {
      const prev = bag.previous_status || 'fridge';
      onUpdate(bag.id, transitionBag(bag, prev));
    }
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

    if (onAddRecord) {
      onAddRecord({
        id: crypto.randomUUID(),
        type: 'feed',
        side: 'bottle',
        volume: vol,
        timestamp: new Date().toISOString(),
        note: bag.note ? `Bú một phần: ${bag.note}` : `Bú một phần từ bịch ${bag.id.substring(0, 6).toUpperCase()}`,
      });
    }

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
  }, [bag, onUpdate, onAddRecord, feedVolume]);

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
              🔥 Hâm sữa
            </button>
            <button style={btnStyle('#FF6B9D', '#FFF0F6')} onClick={() => handleTransition('using')}>
              🍼 Cho bú (Đang dùng)
            </button>
            <button style={btnStyle('#00C9A7', '#F0FDFC')} onClick={() => handleTransition('used')}>
              <CheckCheck size={12} /> Đã dùng
            </button>
          </div>
        );
      case 'warmed':
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button style={btnStyle('#FF6B9D', '#FFF0F6')} onClick={() => handleTransition('using')}>
              🍼 Cho bú (Đang dùng)
            </button>
            <button style={btnStyle('#00C9A7', '#F0FDFC')} onClick={() => handleTransition('used')}>
              <CheckCheck size={12} /> Đã dùng
            </button>
          </div>
        );
      case 'using':
        return (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flexDirection: 'column', width: '100%' }}>
            <div style={{ display: 'flex', gap: 6, width: '100%' }}>
              <button
                style={{ ...btnStyle('#00C9A7', '#F0FDFC'), flex: 1 }}
                onClick={handleFinishFeeding}
              >
                <CheckCheck size={12} /> Bé bú xong (Hết bịch)
              </button>
              <button
                style={{ ...btnStyle('#FF6B9D', '#FFF0F6'), flex: 1 }}
                onClick={() => setIsFeedingPartially(prev => !prev)}
              >
                🍼 Bú một phần (Còn dư)
              </button>
            </div>

            {isFeedingPartially && (
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
                  🍼 Nhập lượng sữa bé đã bú
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
                    ⚠️ {feedError}
                  </p>
                )}
              </div>
            )}
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
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
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

              {/* Toggle switch for usable bags */}
              {['fridge', 'room_temp', 'thawed', 'warmed', 'using'].includes(bag.storage_status) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: bag.storage_status === 'using' ? '#FF6B9D' : 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    Đang dùng
                  </span>
                  <CustomToggle checked={bag.storage_status === 'using'} onChange={handleToggleUsing} />
                </div>
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
  onAddRecord,
}) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [thawingBag, setThawingBag] = useState(null);

  // Sorting and Date Filtering states
  const [sortBy, setSortBy] = useState('priority');
  const [dateFilterType, setDateFilterType] = useState('all');
  const [customDate, setCustomDate] = useState('');

  const avgDailyMl = useMemo(() => getAvgDailyMl(records, 7), [records]);
  const summary = useMemo(() => getMilkSummary(milkBags), [milkBags]);
  const thawRec = useMemo(() => getThawRecommendation(milkBags, avgDailyMl), [milkBags, avgDailyMl]);

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
      case 'fridge':   list = active.filter(b => b.storage_status === 'fridge'); break;
      case 'freezer':  list = active.filter(b => b.storage_status === 'freezer'); break;
      case 'thawing':  list = active.filter(b => b.storage_status === 'thawing'); break;
      case 'thawed':   list = active.filter(b => b.storage_status === 'thawed' || b.storage_status === 'warmed'); break;
      case 'using':    list = active.filter(b => b.storage_status === 'using'); break;
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
            label: 'Đang dùng',
            value: summary.usingCount > 0 ? `${summary.usingCount} bịch` : '0',
            emoji: '🍼',
            color: summary.usingCount > 0 ? '#FF6B9D' : '#8E7DAE',
            bg: summary.usingCount > 0 ? '#FFF0F6' : '#F8F4FF',
          },
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

      {/* Sort and Date Filter Controls */}
      <div style={{
        display: 'flex', gap: 10, padding: '0 16px 14px',
        alignItems: 'center', flexWrap: 'wrap',
      }}>
        {/* Sort select */}
        <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <SlidersHorizontal size={11} /> Sắp xếp
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
            <option value="priority">💡 Gợi ý dùng trước</option>
            <option value="date-desc">🕐 Hút mới nhất</option>
            <option value="date-asc">🕐 Hút cũ nhất</option>
            <option value="volume-desc">🥛 Nhiều ml nhất</option>
            <option value="volume-asc">🥛 Ít ml nhất</option>
          </select>
        </div>

        {/* Date Filter select */}
        <div style={{ flex: 1, minWidth: 140, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar size={11} /> Ngày hút
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
              onAddRecord={onAddRecord}
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
