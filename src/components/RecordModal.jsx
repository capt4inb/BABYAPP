import { useState } from 'react';
import GameIcon from './GameIcon';

function toLocalDatetimeInput(date) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export default function RecordModal({ type, editRecord, onSave, onClose }) {
  const isFeed = type === 'feed';
  const isWeight = type === 'weight';

  const [timestamp, setTimestamp] = useState(() => toLocalDatetimeInput(editRecord?.timestamp || new Date()));
  const [volume, setVolume] = useState(() => editRecord?.volume ?? '');
  const [weight, setWeight] = useState(() => editRecord?.weight ?? '');
  const [height, setHeight] = useState(() => editRecord?.height ?? '');
  const [headCircumference, setHeadCircumference] = useState(() => editRecord?.headCircumference ?? editRecord?.head ?? '');
  const [side] = useState(() => editRecord?.side ?? 'bottle');
  const [note, setNote] = useState(() => editRecord?.note ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const record = {
      id: editRecord?.id ?? crypto.randomUUID(),
      type,
      timestamp: new Date(timestamp).toISOString(),
      note: note.trim(),
    };
    if (isFeed) {
      record.side = side;
      record.volume = volume !== '' ? Number(volume) : null;
    } else if (isWeight) {
      record.weight = weight !== '' ? Number(weight) : null;
      record.height = height !== '' ? Number(height) : null;
      record.headCircumference = headCircumference !== '' ? Number(headCircumference) : null;
    }
    onSave(record);
  };

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
              background: 'var(--color-base-200)',
              border: '1px solid var(--color-base-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isFeed ? <GameIcon name="bottle" size={30} variant="pink" /> : <GameIcon name="stats" size={30} variant="blue" />}
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                {editRecord ? 'Chỉnh sửa' : 'Ghi lại'} {isFeed ? 'cữ bú' : 'chỉ số'}
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                {isFeed ? 'Theo dõi lượng sữa bú bình' : 'Theo dõi sự phát triển của bé'}
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
            <GameIcon name="close" size={28} variant="cream" />
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

          {/* Volume */}
          {isFeed && (
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
          )}

          {/* Growth metrics */}
          {isWeight && (
            <>
              <div className="form-group">
                <label className="form-label">
                  Cân nặng (kg)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="Ví dụ: 6.5"
                  step="0.1"
                  min="0"
                  max="50"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Chiều cao (cm)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={height}
                  onChange={e => setHeight(e.target.value)}
                  placeholder="Ví dụ: 67.8"
                  step="0.1"
                  min="0"
                  max="140"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Chu vi đầu (cm)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={headCircumference}
                  onChange={e => setHeadCircumference(e.target.value)}
                  placeholder="Ví dụ: 42"
                  step="0.1"
                  min="0"
                  max="70"
                />
              </div>
            </>
          )}

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
              className={`btn ${isFeed ? 'btn-primary' : ''}`}
              style={{ flex: 2, background: isWeight ? 'var(--color-info)' : undefined, color: isWeight ? 'var(--color-info-content)' : undefined }}
            >
              {editRecord ? 'Lưu thay đổi' : `Lưu ${isFeed ? 'cữ bú' : 'chỉ số'}`}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
