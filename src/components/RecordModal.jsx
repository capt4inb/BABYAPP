import { useState, useEffect } from 'react';
import { X, Droplets, Zap } from 'lucide-react';

function toLocalDatetimeInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function RecordModal({ type, editRecord, onSave, onClose }) {
  const [timestamp, setTimestamp] = useState(toLocalDatetimeInput(new Date()));
  const [volume, setVolume] = useState('');
  const [side, setSide] = useState('both');     // left|right|both|bottle
  const [note, setNote] = useState('');

  useEffect(() => {
    if (editRecord) {
      setTimestamp(toLocalDatetimeInput(editRecord.timestamp));
      setVolume(editRecord.volume ?? '');
      setSide(editRecord.side ?? 'both');
      setNote(editRecord.note ?? '');
    }
  }, [editRecord]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const record = {
      id: editRecord?.id ?? crypto.randomUUID(),
      type: 'feed',
      timestamp: new Date(timestamp).toISOString(),
      note: note.trim(),
      side,
      volume: volume !== '' ? Number(volume) : null,
    };
    onSave(record);
  };

  const feedSides = [
    { value: 'left',   label: 'Trái', emoji: '◀️' },
    { value: 'right',  label: 'Phải', emoji: '▶️' },
    { value: 'both',   label: 'Hai bên', emoji: '↔️' },
    { value: 'bottle', label: 'Bình sữa', emoji: '🍼' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop" onClick={onClose} />

      {/* Sheet */}
      <div className="modal-sheet animate-modal">
        <div className="modal-handle" />

        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg,#FF6B9D,#FF8CB6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Droplets size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                {editRecord ? 'Chỉnh sửa' : 'Ghi lại'} cữ bú
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                Theo dõi lượng sữa mẹ / bình
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

          {/* Timestamp */}
          <div className="form-group">
            <label className="form-label">Thời gian</label>
            <input
              type="datetime-local"
              className="form-input"
              value={timestamp}
              onChange={e => setTimestamp(e.target.value)}
              required
            />
          </div>

          {/* Feed side selector */}
          <div className="form-group">
            <label className="form-label">Cách bú</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {feedSides.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSide(s.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: `2px solid ${side === s.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: side === s.value ? 'var(--color-primary-bg)' : 'var(--color-surface-alt)',
                    color: side === s.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    fontFamily: 'Outfit, sans-serif',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{s.emoji}</span> {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="form-group">
            <label className="form-label">
              Lượng sữa (ml) — tùy chọn
            </label>
            <input
              type="number"
              className="form-input"
              value={volume}
              onChange={e => setVolume(e.target.value)}
              placeholder="Nhập số ml..."
              min="0"
              max="1000"
            />
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label">Ghi chú (tùy chọn)</label>
            <textarea
              className="form-input"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Thêm ghi chú..."
              rows={2}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 12, paddingBottom: 16 }}>
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Huỷ
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
            >
              {editRecord ? 'Lưu thay đổi' : 'Lưu cữ bú'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
