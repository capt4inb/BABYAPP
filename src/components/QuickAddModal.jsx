import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { createMilkBag } from '../utils/milkUtils';
import GameIcon from './GameIcon';

function toDateInput(date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 10);
}

function toTimeInput(date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(11, 16);
}

function mergeDateTime(date, time) {
  return new Date(`${date}T${time || '00:00'}`).toISOString();
}

const STORAGE_CHOICES = [
  { value: 'fridge', label: 'Ngăn mát', icon: 'snow', tone: 'blue', hint: '4 ngày' },
  { value: 'freezer', label: 'Ngăn đông', icon: 'snow', tone: 'lavender', hint: '6 tháng' },
  { value: 'room_temp', label: 'Để ngoài', icon: 'thermo', tone: 'orange', hint: '4 giờ' },
];
const FEED_TICKS = [120, 130, 140, 150, 160, 170, 180];
const MILK_TICKS = [200, 220, 240, 260, 280];

function rangeProgress(value, min, max) {
  return `${((Number(value) - min) / (max - min)) * 100}%`;
}

export default function QuickAddModal({ onClose, onSaveFeed, onSaveMilkBag }) {
  const now = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState('feed');
  const [feedVolume, setFeedVolume] = useState(150);
  const [feedTime, setFeedTime] = useState(toTimeInput(now));
  const [milkVolume, setMilkVolume] = useState(240);
  const [storageStatus, setStorageStatus] = useState('fridge');
  const [milkDate, setMilkDate] = useState(toDateInput(now));
  const [milkTime, setMilkTime] = useState(toTimeInput(now));

  const saveFeed = (event) => {
    event.preventDefault();
    onSaveFeed({
      id: crypto.randomUUID(),
      type: 'feed',
      side: 'bottle',
      volume: Number(feedVolume),
      timestamp: mergeDateTime(toDateInput(now), feedTime),
      note: '',
    });
    onClose();
  };

  const saveMilk = (event) => {
    event.preventDefault();
    onSaveMilkBag(createMilkBag({
      volume_ml: Number(milkVolume),
      expressed_at: mergeDateTime(milkDate, milkTime),
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

            <label className="quick-add-range">
              <span>Lượng sữa (ml)</span>
              <strong>{feedVolume}</strong>
              <div className="quick-range-control">
                <input
                  type="range"
                  min="120"
                  max="180"
                  step="10"
                  value={feedVolume}
                  onChange={event => setFeedVolume(event.target.value)}
                  style={{ '--range-progress': rangeProgress(feedVolume, 120, 180) }}
                />
                <div className="quick-range-ticks" style={{ '--tick-count': FEED_TICKS.length }} aria-hidden="true">
                  {FEED_TICKS.map(tick => <span key={tick}>{tick}</span>)}
                </div>
              </div>
            </label>

            <div className="quick-add-field">
              <label>Thời gian bắt đầu</label>
              <input type="time" className="form-input" value={feedTime} onChange={event => setFeedTime(event.target.value)} required />
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

            <label className="quick-add-range pink">
              <span>Thể tích (ml)</span>
              <strong>{milkVolume}</strong>
              <div className="quick-range-control">
                <input
                  type="range"
                  min="200"
                  max="280"
                  step="10"
                  value={milkVolume}
                  onChange={event => setMilkVolume(event.target.value)}
                  style={{ '--range-progress': rangeProgress(milkVolume, 200, 280) }}
                />
                <div className="quick-range-ticks" style={{ '--tick-count': MILK_TICKS.length }} aria-hidden="true">
                  {MILK_TICKS.map(tick => <span key={tick}>{tick}</span>)}
                </div>
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

            <div className="quick-add-two">
              <div className="quick-add-field">
                <label>Ngày hút</label>
                <input type="date" className="form-input" value={milkDate} onChange={event => setMilkDate(event.target.value)} required />
              </div>
              <div className="quick-add-field">
                <label>Giờ hút</label>
                <input type="time" className="form-input" value={milkTime} onChange={event => setMilkTime(event.target.value)} required />
              </div>
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
