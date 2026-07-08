import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createMilkBag } from '../utils/milkUtils';
import GameIcon from './GameIcon';

function toLocalDatetimeInput(date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

const STORAGE_CHOICES = [
  { value: 'fridge', label: 'Ngăn mát', icon: 'snow', tone: 'blue', hint: '4 ngày' },
  { value: 'freezer', label: 'Ngăn đông', icon: 'snow', tone: 'lavender', hint: '6 tháng' },
  { value: 'room_temp', label: 'Để ngoài', icon: 'thermo', tone: 'orange', hint: '4 giờ' },
];

export default function QuickAddModal({ onClose, onSaveFeed, onSaveMilkBag }) {
  const now = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState('feed');
  const [feedVolume, setFeedVolume] = useState(150);
  const [feedAt, setFeedAt] = useState(toLocalDatetimeInput(now));
  const [milkVolume, setMilkVolume] = useState(240);
  const [storageStatus, setStorageStatus] = useState('fridge');
  const [milkAt, setMilkAt] = useState(toLocalDatetimeInput(now));

  const saveFeed = (event) => {
    event.preventDefault();
    onSaveFeed({
      id: crypto.randomUUID(),
      type: 'feed',
      side: 'bottle',
      volume: Number(feedVolume),
      timestamp: new Date(feedAt).toISOString(),
      note: '',
    });
    onClose();
  };

  const saveMilk = (event) => {
    event.preventDefault();
    onSaveMilkBag(createMilkBag({
      volume_ml: Number(milkVolume),
      expressed_at: new Date(milkAt).toISOString(),
      storage_status: storageStatus,
      note: '',
    }));
    onClose();
  };

  return createPortal(
    <>
      <div className="modal-backdrop quick-add-backdrop" onClick={onClose} />
      <section className="quick-add-sheet animate-modal" role="dialog" aria-modal="true" aria-label="Thêm nhanh">
        <header className="quick-add-header">
          <button type="button" className="quick-add-close" onClick={onClose} aria-label="Đóng">
            <GameIcon name="left" size={24} variant="cream" bare />
          </button>
          <strong>Thêm nhanh</strong>
          <span />
        </header>

        <div className="quick-add-tabs" role="tablist" aria-label="Chọn loại thêm nhanh">
          <button
            type="button"
            className={activeTab === 'feed' ? 'active' : ''}
            onClick={() => setActiveTab('feed')}
            aria-selected={activeTab === 'feed'}
          >
            Ghi cữ bú
          </button>
          <button
            type="button"
            className={activeTab === 'milk' ? 'active' : ''}
            onClick={() => setActiveTab('milk')}
            aria-selected={activeTab === 'milk'}
          >
            Thêm sữa
          </button>
        </div>

        {activeTab === 'feed' ? (
          <form className="quick-add-form" onSubmit={saveFeed}>
            <div className="quick-add-hero purple">
              <GameIcon name="bottle" size={66} variant="lavender" />
              <h2>Ghi cữ bú nhanh</h2>
              <p>Cân bằng, đơn giản</p>
            </div>

            <label className="quick-add-field quick-number-field">
              <span>Lượng sữa (ml)</span>
              <div className="quick-number-wrap">
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="1000"
                  step="1"
                  inputMode="numeric"
                  value={feedVolume}
                  onChange={event => setFeedVolume(event.target.value)}
                  required
                />
                <em>ml</em>
              </div>
            </label>

            <div className="quick-add-field">
              <label>Thời gian</label>
              <input type="datetime-local" className="form-input" value={feedAt} onChange={event => setFeedAt(event.target.value)} required />
            </div>

            <button className="quick-add-submit purple" type="submit">
              <GameIcon name="check" size={20} variant="cream" bare />
              Lưu cữ bú
            </button>
          </form>
        ) : (
          <form className="quick-add-form" onSubmit={saveMilk}>
            <div className="quick-add-hero pink">
              <GameIcon name="bottle" size={66} variant="pink" />
              <h2>Thêm sữa vào kho</h2>
              <p>Quản lý tồn kho di động</p>
            </div>

            <label className="quick-add-field quick-number-field pink">
              <span>Thể tích (ml)</span>
              <div className="quick-number-wrap">
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="1000"
                  step="1"
                  inputMode="numeric"
                  value={milkVolume}
                  onChange={event => setMilkVolume(event.target.value)}
                  required
                />
                <em>ml</em>
              </div>
            </label>

            <div className="quick-add-field">
              <label>Lưu sữa</label>
              <div className="quick-storage-choices">
                {STORAGE_CHOICES.map(choice => (
                  <button
                    key={choice.value}
                    type="button"
                    className={storageStatus === choice.value ? 'active' : ''}
                    onClick={() => setStorageStatus(choice.value)}
                  >
                    <GameIcon name={choice.icon} size={28} variant={choice.tone} />
                    <strong>{choice.label}</strong>
                    <small>{choice.hint}</small>
                  </button>
                ))}
              </div>
            </div>

            <div className="quick-add-field">
              <label>Thời gian hút</label>
              <input type="datetime-local" className="form-input" value={milkAt} onChange={event => setMilkAt(event.target.value)} required />
            </div>

            <button className="quick-add-submit pink" type="submit">
              <GameIcon name="check" size={20} variant="cream" bare />
              Lưu vào kho
            </button>
          </form>
        )}
      </section>
    </>,
    document.body
  );
}
