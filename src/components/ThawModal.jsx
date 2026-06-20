import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle } from 'lucide-react';
import { transitionBag } from '../utils/milkUtils';

const THAW_METHODS = [
  {
    value: 'fridge_overnight',
    label: 'Để ngăn mát qua đêm',
    desc: 'An toàn nhất · tan trong 8–12 giờ. App sẽ nhắc bạn đánh dấu khi sữa đã tan hoàn toàn.',
    emoji: '❄️',
    color: '#4FACFE',
    bg: '#F0F8FF',
    border: '#A8D8FE',
    estHours: 10,
  },
  {
    value: 'warm_water',
    label: 'Ngâm nước ấm',
    desc: 'Nhanh hơn · tan trong khoảng 30 phút. Chú ý không dùng nước sôi.',
    emoji: '💧',
    color: '#FF9A5C',
    bg: '#FFF7F2',
    border: '#FFCBA4',
    estHours: 0.5,
  },
  {
    value: 'room_temp',
    label: 'Để ngoài nhiệt độ phòng',
    desc: 'Tan trong 1–2 giờ. Chú ý không để quá 2 giờ ở nhiệt độ phòng sau khi tan.',
    emoji: '🌡️',
    color: '#00C9A7',
    bg: '#F0FDFC',
    border: '#A8E6E2',
    estHours: 1.5,
  },
];

export default function ThawModal({ bag, onSave, onClose }) {
  const [method, setMethod] = useState('fridge_overnight');
  const [markThawed, setMarkThawed] = useState(false);

  const selectedMethod = THAW_METHODS.find(m => m.value === method);

  const handleStartThaw = () => {
    const updated = transitionBag(bag, 'thawing', { thaw_method: method });
    onSave(updated);
  };

  const handleMarkFullyThawed = () => {
    const updated = transitionBag(bag, 'thawed', { thaw_method: method });
    onSave(updated);
  };

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-sheet animate-modal">
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'linear-gradient(135deg, #4FACFE, #00C9A7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              💧
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                Rã đông bịch sữa
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                {bag.volume_ml}ml · Hút{' '}
                {new Date(bag.expressed_at).toLocaleDateString('vi-VN', {
                  day: '2-digit', month: '2-digit',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: 'var(--color-surface-alt)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '20px 20px 8px' }}>

          {/* CDC Note */}
          <div style={{
            background: 'linear-gradient(135deg, #F0F8FF, #F0FDFC)',
            border: '1px solid #A8D8FE',
            borderRadius: 'var(--radius-sm)',
            padding: '12px 14px',
            marginBottom: 20,
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#2D6A8F', lineHeight: 1.5, fontWeight: 500 }}>
              💡 <strong>Theo CDC:</strong> Hạn 24 giờ tính từ lúc sữa <em>tan hoàn toàn</em>, 
              không tính từ lúc vừa lấy ra khỏi ngăn đông.
            </p>
          </div>

          {/* Method selection */}
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Phương pháp rã đông
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {THAW_METHODS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setMethod(m.value)}
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: `2px solid ${method === m.value ? m.color : 'var(--color-border)'}`,
                  background: method === m.value ? m.bg : 'var(--color-surface-alt)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left',
                  fontFamily: 'Outfit, sans-serif',
                  boxShadow: method === m.value ? `0 4px 12px ${m.color}25` : 'none',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <span style={{ fontSize: 24, lineHeight: 1 }}>{m.emoji}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: method === m.value ? m.color : 'var(--color-text)', marginBottom: 3 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                    {m.desc}
                  </div>
                </div>
                {method === m.value && (
                  <CheckCircle size={18} color={m.color} style={{ flexShrink: 0, marginTop: 2 }} />
                )}
              </button>
            ))}
          </div>

          {/* If thawing in fridge overnight, show "already thawed" option */}
          {bag.storage_status === 'thawing' && (
            <div style={{
              background: 'linear-gradient(135deg, #F0FDFC, #F5FFF8)',
              border: '2px solid #00C9A7',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>✅</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#00A88B' }}>Sữa đã tan hoàn toàn?</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Bấm để bắt đầu đếm hạn 24 giờ</div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleMarkFullyThawed}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'linear-gradient(135deg, #00C9A7, #4ECDC4)',
                  color: 'white',
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0, 201, 167, 0.35)',
                }}
              >
                ✅ Đánh dấu đã tan hoàn toàn (bắt đầu 24h)
              </button>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Huỷ
            </button>
            {bag.storage_status !== 'thawing' && (
              <button
                type="button"
                onClick={handleStartThaw}
                className="btn"
                style={{
                  flex: 2,
                  background: `linear-gradient(135deg, ${selectedMethod?.color || '#4FACFE'}, #00C9A7)`,
                  color: 'white',
                  boxShadow: `0 4px 15px ${selectedMethod?.color || '#4FACFE'}40`,
                }}
              >
                💧 Bắt đầu rã đông
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
