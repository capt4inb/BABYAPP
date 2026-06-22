import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Droplets, Thermometer, Snowflake } from 'lucide-react';
import { createMilkBag, calculateExpiry, STATUS_CONFIG } from '../utils/milkUtils';

function toLocalDatetimeInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const STORAGE_OPTIONS = [
  {
    value: 'room_temp',
    label: 'Để ngoài',
    desc: 'Nhiệt độ phòng · hạn 4 giờ',
    emoji: '🌡️',
    color: '#FF9A5C',
    bg: '#FFF7F2',
    border: '#FFCBA4',
    Icon: Thermometer,
  },
  {
    value: 'fridge',
    label: 'Ngăn mát',
    desc: 'Tủ lạnh · hạn 4 ngày',
    emoji: '❄️',
    color: '#4FACFE',
    bg: '#F0F8FF',
    border: '#A8D8FE',
    Icon: Droplets,
  },
  {
    value: 'freezer',
    label: 'Ngăn đông',
    desc: 'Tủ đông · tốt nhất 6 tháng',
    emoji: '🧊',
    color: '#9B59B6',
    bg: '#FBF5FF',
    border: '#D7BDE2',
    Icon: Snowflake,
  },
];

export default function AddMilkBagModal({ onSave, onClose, editBag }) {
  const [volumeStr, setVolumeStr] = useState('');
  const [expressedAt, setExpressedAt] = useState('');
  const [storageStatus, setStorageStatus] = useState('fridge');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  // Pre-populate if editing
  useEffect(() => {
    if (editBag) {
      setVolumeStr(editBag.volume_ml.toString());
      setExpressedAt(toLocalDatetimeInput(editBag.expressed_at));
      setStorageStatus(editBag.storage_status);
      setNote(editBag.note || '');
    } else {
      setVolumeStr('');
      setExpressedAt(toLocalDatetimeInput(new Date()));
      setStorageStatus('fridge');
      setNote('');
    }
    setError('');
  }, [editBag]);

  const combinedNote = note.trim();

  const handleSubmit = (e) => {
    e.preventDefault();
    const vol = parseFloat(volumeStr);
    if (!vol || vol <= 0) {
      setError('Vui lòng nhập số ml hợp lệ.');
      return;
    }
    setError('');

    if (editBag) {
      // Maintain transition logic but recalculate expiry based on new expressed time and updated storage status
      const updatedBag = {
        ...editBag,
        volume_ml: vol,
        expressed_at: new Date(expressedAt).toISOString(),
        storage_status: storageStatus,
        note: combinedNote,
      };
      
      // If we modified storage status away from used/expired, clean up fed_at, etc.
      if (storageStatus !== 'used' && updatedBag.fed_at) {
        updatedBag.fed_at = null;
      }
      if (storageStatus !== 'expired' && storageStatus !== 'used') {
        // Recalculate expiry
        updatedBag.expiry_at = calculateExpiry(updatedBag);
      } else {
        updatedBag.expiry_at = null;
      }

      onSave(updatedBag);
    } else {
      const bag = createMilkBag({
        volume_ml: vol,
        expressed_at: new Date(expressedAt).toISOString(),
        storage_status: storageStatus,
        note: combinedNote,
      });
      onSave(bag);
    }
  };

  // Build options list, appending current special status if needed
  const options = [...STORAGE_OPTIONS];
  if (editBag && !['room_temp', 'fridge', 'freezer'].includes(editBag.storage_status)) {
    const statusCfg = STATUS_CONFIG[editBag.storage_status] || {
      label: editBag.storage_status,
      emoji: '🏷️',
      color: '#8E7DAE',
      bg: '#F8F4FF',
      border: '#D7BDE2',
    };
    options.push({
      value: editBag.storage_status,
      label: statusCfg.label,
      desc: `Trạng thái hiện tại`,
      emoji: statusCfg.emoji,
      color: statusCfg.color,
      bg: statusCfg.bg,
      border: statusCfg.border,
      Icon: Droplets,
    });
  }

  const selectedStorage = options.find(o => o.value === storageStatus);

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
              background: 'linear-gradient(135deg, #4FACFE, #9B59B6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              🍼
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                {editBag ? 'Sửa thông tin bịch sữa' : 'Thêm bịch sữa mới'}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                {editBag ? 'Cập nhật số ml, thời gian hoặc nơi cất' : 'App tự tính hạn dùng theo CDC'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px 20px 8px' }}>

          {/* Volume */}
          <div className="form-group">
            <label className="form-label">🥛 Số ml sữa</label>
            <div style={{ position: 'relative' }}>
              <input
                type="number"
                className="form-input"
                value={volumeStr}
                onChange={e => setVolumeStr(e.target.value)}
                placeholder="Ví dụ: 120"
                min="1"
                max="500"
                step="any"
                autoFocus
                style={{ paddingRight: 50 }}
              />
              <span style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)',
              }}>ml</span>
            </div>
            {error && <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--color-danger)' }}>{error}</p>}
          </div>

          {/* Timestamp */}
          <div className="form-group">
            <label className="form-label">📅 Thời gian hút</label>
            <input
              type="datetime-local"
              className="form-input"
              value={expressedAt}
              onChange={e => setExpressedAt(e.target.value)}
              required
            />
          </div>

          {/* Storage */}
          <div className="form-group">
            <label className="form-label">🗂️ Nơi lưu trữ / Trạng thái</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: 8 }}>
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStorageStatus(opt.value)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${storageStatus === opt.value ? opt.color : 'var(--color-border)'}`,
                    background: storageStatus === opt.value ? opt.bg : 'var(--color-surface-alt)',
                    color: storageStatus === opt.value ? opt.color : 'var(--color-text-muted)',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    textAlign: 'center',
                    boxShadow: storageStatus === opt.value ? `0 4px 12px ${opt.color}30` : 'none',
                  }}
                >
                  <span style={{ fontSize: 22 }}>{opt.emoji}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {selectedStorage && (
              <p style={{ margin: '8px 0 0', fontSize: 12, color: selectedStorage.color, fontWeight: 600 }}>
                ⏱️ {selectedStorage.desc}
              </p>
            )}
          </div>

          {/* Ghi chú */}
          <div className="form-group">
            <label className="form-label">📝 Ghi chú</label>
            <input
              type="text"
              className="form-input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Thêm ghi chú..."
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Huỷ
            </button>
            <button
              type="submit"
              className="btn"
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #4FACFE, #9B59B6)',
                color: 'white',
                boxShadow: '0 4px 15px rgba(79, 172, 254, 0.35)',
              }}
            >
              {editBag ? 'Lưu thay đổi' : '🍼 Lưu bịch sữa'}
            </button>
          </div>
        </form>
      </div>
    </>,
    document.body
  );
}
