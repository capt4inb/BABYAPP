import { useMemo, useState } from 'react';
import {
  DIAPER_TYPES,
  daysUntil,
  formatDate,
  formatDuration,
  formatLiveDuration,
  formatTime,
  getDurationMinutes,
  getLast7DayStats,
  getNextVaccine,
  isToday,
  toLocalDatetimeInput,
} from '../utils/careUtils';
import GameIcon from './GameIcon';

function ScreenHeader({ title, onBack, icon = 'calendar' }) {
  return (
    <header className="care-header">
      <button type="button" onClick={onBack} aria-label="Quay lại">
        <GameIcon name="left" size={24} variant="cream" bare />
      </button>
      <h1>{title}</h1>
      <GameIcon name={icon} size={30} variant="blue" />
    </header>
  );
}

function MiniBarChart({ data, unit }) {
  const max = Math.max(...data.map(item => item.total), 1);

  return (
    <div className="care-chart">
      {data.map(item => (
        <div className="care-chart-col" key={item.key}>
          <span>{item.total ? item.total : ''}</span>
          <div className={item.active ? 'active' : ''} style={{ height: `${Math.max(16, (item.total / max) * 100)}%` }} />
          <small>{item.label}</small>
        </div>
      ))}
      <em>{unit}</em>
    </div>
  );
}

export function DiaperTab({ diapers = [], onAddDiaper, onUpdateDiaper, onDeleteDiaper, onBack }) {
  const [type, setType] = useState('wet');
  const [note, setNote] = useState('');

  const todayLogs = useMemo(
    () => diapers.filter(item => isToday(item.timestamp)).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    [diapers]
  );
  const typeCounts = useMemo(() => {
    return todayLogs.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});
  }, [todayLogs]);
  const chartData = useMemo(() => getLast7DayStats(diapers, item => item.timestamp), [diapers]);

  const handleAdd = () => {
    onAddDiaper({
      id: crypto.randomUUID(),
      type,
      note: note.trim(),
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
    setNote('');
  };

  return (
    <div className="animate-fade-in care-screen diaper-screen">
      <ScreenHeader title="Theo dõi thay tã" icon="poop" onBack={onBack} />

      <section className="care-type-row">
        {Object.entries(DIAPER_TYPES).map(([id, item]) => (
          <button
            key={id}
            type="button"
            className={type === id ? 'active' : ''}
            onClick={() => setType(id)}
          >
            <GameIcon name={item.icon} size={28} variant={item.tone} />
            {item.label}
          </button>
        ))}
      </section>

      <button className="care-primary-action diaper" type="button" onClick={handleAdd}>
        <GameIcon name="plus" size={26} variant="cream" bare />
        Ghi nhận ngay
      </button>

      <section className="care-card care-summary-card">
        <div className="care-card-head">
          <h2>Tổng hôm nay</h2>
          <span>Cập nhật {formatTime(new Date())}</span>
        </div>
        <strong>{todayLogs.length}</strong>
        <div className="care-stat-grid">
          {Object.entries(DIAPER_TYPES).map(([id, item]) => (
            <div key={id}>
              <GameIcon name={item.icon} size={26} variant={item.tone} />
              <b>{typeCounts[id] || 0}</b>
              <span>{item.shortLabel}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="care-card">
        <div className="care-card-head">
          <h2>Lịch sử hôm nay</h2>
          <span>{todayLogs.length} lần</span>
        </div>
        <label className="care-note-input">
          <input
            className="form-input"
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder="Ghi chú nhanh trước khi lưu..."
          />
        </label>
        <div className="care-list">
          {todayLogs.length === 0 ? (
            <p className="care-empty">Chưa có lần thay tã hôm nay.</p>
          ) : todayLogs.map(item => {
            const cfg = DIAPER_TYPES[item.type] || DIAPER_TYPES.wet;
            return (
              <article className="care-list-item" key={item.id}>
                <time>{formatTime(item.timestamp)}</time>
                <span className={`care-badge ${item.type}`}>
                  <GameIcon name={cfg.icon} size={20} variant={cfg.tone} bare />
                  {cfg.label}
                </span>
                <p>{item.note || 'Không ghi chú'}</p>
                <div className="care-row-actions">
                  <button type="button" onClick={() => onUpdateDiaper(item.id, { ...item, type })}>
                    <GameIcon name="edit" size={18} variant="cream" bare />
                  </button>
                  <button type="button" onClick={() => onDeleteDiaper(item.id)}>
                    <GameIcon name="trash" size={18} variant="cream" bare />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="care-card">
        <div className="care-card-head">
          <h2>Tổng kết 7 ngày</h2>
          <span>lần/ngày</span>
        </div>
        <MiniBarChart data={chartData} unit="lần/ngày" />
      </section>
    </div>
  );
}

export function SleepTab({ sleeps = [], nowMs = 0, onAddSleep, onUpdateSleep, onDeleteSleep, onMinimize, onBack }) {
  const [startMode, setStartMode] = useState('now');
  const [customStartAt, setCustomStartAt] = useState(() => toLocalDatetimeInput(new Date()));
  const [manualStartAt, setManualStartAt] = useState(() => toLocalDatetimeInput(new Date()));
  const [manualEndAt, setManualEndAt] = useState(() => toLocalDatetimeInput(new Date()));
  const [startError, setStartError] = useState('');
  const activeSleep = useMemo(() => sleeps.find(item => !item.endAt), [sleeps]);
  const todaySleeps = useMemo(
    () => sleeps.filter(item => isToday(item.startAt)).sort((a, b) => new Date(b.startAt) - new Date(a.startAt)),
    [sleeps]
  );
  const totalTodayMinutes = todaySleeps.reduce(
    (sum, item) => sum + getDurationMinutes(item.startAt, item.endAt || new Date(nowMs).toISOString()),
    0
  );
  const chartData = useMemo(
    () => getLast7DayStats(sleeps, item => item.startAt, item => Math.round(getDurationMinutes(item.startAt, item.endAt) / 60)),
    [sleeps]
  );

  const handleStart = () => {
    if (activeSleep) return;
    const startAt = startMode === 'custom' ? new Date(customStartAt) : new Date();
    if (Number.isNaN(startAt.getTime())) {
      setStartError('Vui lòng chọn giờ bắt đầu hợp lệ.');
      return;
    }
    if (startAt.getTime() > Date.now()) {
      setStartError('Giờ bắt đầu không được ở tương lai.');
      return;
    }
    setStartError('');
    onAddSleep({
      id: crypto.randomUUID(),
      startAt: startAt.toISOString(),
      endAt: null,
      createdAt: new Date().toISOString(),
    });
    setCustomStartAt(toLocalDatetimeInput(new Date()));
    setStartMode('now');
  };

  const handleEnd = () => {
    if (!activeSleep) return;
    onUpdateSleep(activeSleep.id, {
      ...activeSleep,
      endAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const handleManualSave = () => {
    const startAt = new Date(manualStartAt);
    const endAt = new Date(manualEndAt);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      setStartError('Vui lòng nhập đủ giờ bắt đầu và giờ kết thúc.');
      return;
    }
    if (startAt.getTime() >= endAt.getTime()) {
      setStartError('Giờ kết thúc phải sau giờ bắt đầu.');
      return;
    }
    if (endAt.getTime() > Date.now()) {
      setStartError('Giờ kết thúc không được ở tương lai.');
      return;
    }

    setStartError('');
    onAddSleep({
      id: crypto.randomUUID(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setManualStartAt(toLocalDatetimeInput(new Date()));
    setManualEndAt(toLocalDatetimeInput(new Date()));
  };

  return (
    <div className="animate-fade-in care-screen sleep-screen">
      <ScreenHeader title="Giấc ngủ" icon="moon" onBack={onBack} />

      <section className={`sleep-live-card ${activeSleep ? 'active' : ''}`}>
        <div className="care-card-head">
          <h2>{activeSleep ? 'Đang ngủ' : 'Chưa ngủ'}</h2>
          <span>Giấc {todaySleeps.length}</span>
        </div>
        <strong className="sleep-live-timer">{activeSleep ? formatLiveDuration(activeSleep.startAt, nowMs) : '--:--'}</strong>
        <p>{activeSleep ? `Bé đã ngủ từ ${formatTime(activeSleep.startAt)}` : 'Bấm bắt đầu khi bé ngủ.'}</p>
        {!activeSleep && (
          <div className="sleep-start-options">
            <div className="sleep-start-tabs" role="tablist" aria-label="Chọn giờ bắt đầu ngủ">
              <button
                type="button"
                className={startMode === 'now' ? 'active' : ''}
                onClick={() => {
                  setStartMode('now');
                  setStartError('');
                }}
              >
                Bây giờ
              </button>
              <button
                type="button"
                className={startMode === 'custom' ? 'active' : ''}
                onClick={() => setStartMode('custom')}
              >
                Chọn giờ
              </button>
              <button
                type="button"
                className={startMode === 'manual' ? 'active' : ''}
                onClick={() => setStartMode('manual')}
              >
                Nhập tay
              </button>
            </div>
            {startMode === 'custom' && (
              <label className="sleep-start-custom">
                <span>Bé ngủ từ</span>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={customStartAt}
                  max={toLocalDatetimeInput(new Date())}
                  onChange={event => {
                    setCustomStartAt(event.target.value);
                    setStartError('');
                  }}
                />
              </label>
            )}
            {startMode === 'manual' && (
              <div className="sleep-manual-form">
                <label>
                  <span>Bắt đầu</span>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={manualStartAt}
                    max={toLocalDatetimeInput(new Date())}
                    onChange={event => {
                      setManualStartAt(event.target.value);
                      setStartError('');
                    }}
                  />
                </label>
                <label>
                  <span>Kết thúc</span>
                  <input
                    type="datetime-local"
                    className="form-input"
                    value={manualEndAt}
                    max={toLocalDatetimeInput(new Date())}
                    onChange={event => {
                      setManualEndAt(event.target.value);
                      setStartError('');
                    }}
                  />
                </label>
                <button className="btn btn-primary" type="button" onClick={handleManualSave}>
                  <GameIcon name="save" size={22} variant="cream" />
                  Lưu giấc ngủ
                </button>
              </div>
            )}
            {startError && <p className="sleep-start-error">{startError}</p>}
          </div>
        )}
        <div className="sleep-actions">
          {activeSleep ? (
            <>
              <button className="btn btn-primary" type="button" onClick={handleEnd}>
                <GameIcon name="check" size={22} variant="cream" />
                Dừng lại
              </button>
              <button className="btn btn-ghost" type="button" onClick={onMinimize}>
                <GameIcon name="moon" size={22} variant="lavender" />
                Thu nhỏ
              </button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" type="button" onClick={handleStart} disabled={startMode === 'manual'}>
                <GameIcon name="plus" size={22} variant="cream" />
                Bắt đầu ngủ
              </button>
              <button className="btn btn-ghost" type="button" onClick={handleEnd} disabled>
                <GameIcon name="check" size={22} variant="cream" />
                Kết thúc
              </button>
            </>
          )}
        </div>
      </section>

      <section className="care-card care-summary-card">
        <div className="care-card-head">
          <h2>Hôm nay</h2>
          <span>Cập nhật {formatTime(new Date())}</span>
        </div>
        <div className="sleep-today-grid">
          <div>
            <strong>{formatDuration(totalTodayMinutes)}</strong>
            <span>tổng giấc ngủ</span>
          </div>
          <div>
            <strong>{todaySleeps.length}</strong>
            <span>giấc ngủ</span>
          </div>
        </div>
        <div className="care-list compact">
          {todaySleeps.map(item => (
            <article className="care-list-item" key={item.id}>
              <time>{formatTime(item.startAt)} - {item.endAt ? formatTime(item.endAt) : 'Hiện tại'}</time>
              <span>{formatDuration(getDurationMinutes(item.startAt, item.endAt || new Date(nowMs).toISOString()))}</span>
              <button type="button" onClick={() => onDeleteSleep(item.id)}>
                <GameIcon name="trash" size={18} variant="cream" bare />
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="care-card">
        <div className="care-card-head">
          <h2>Tổng kết 7 ngày</h2>
          <span>giờ/ngày</span>
        </div>
        <MiniBarChart data={chartData} unit="giờ/ngày" />
      </section>
    </div>
  );
}

export function VaccineTab({ settings, vaccines = [], onUpdateVaccine, onBack }) {
  const next = getNextVaccine(vaccines);

  return (
    <div className="animate-fade-in care-screen vaccine-screen">
      <ScreenHeader title="Tiêm chủng" icon="syringe" onBack={onBack} />

      <section className="vaccine-baby-card">
        <div>
          <span>Thông tin bé</span>
          <h2>{settings.babyName || 'Bé yêu'}</h2>
          <p>Ngày sinh: {settings.babyBirthDate ? formatDate(settings.babyBirthDate) : 'Chưa có'}</p>
          <p>Cân nặng hiện tại lưu trong lịch sử cân nặng.</p>
        </div>
        <GameIcon name="baby" size={72} variant="orange" />
      </section>

      {next && (
        <section className="vaccine-next-card">
          <div>
            <span>Mũi tiêm sắp tới</span>
            <h2>{next.title}</h2>
            <p>{formatDate(next.dueDate)} · {daysUntil(next.dueDate) <= 0 ? 'Đến hạn' : `${daysUntil(next.dueDate)} ngày nữa`}</p>
            <ul>
              {next.vaccineNames.map(name => <li key={name}>{name}</li>)}
            </ul>
          </div>
          <GameIcon name="syringe" size={72} variant="orange" />
        </section>
      )}

      <section className="care-card">
        <div className="care-card-head">
          <h2>Lịch tiêm chủng</h2>
          <span>{vaccines.length} mốc</span>
        </div>
        <div className="vaccine-timeline">
          {vaccines.map(item => {
            const dueDays = daysUntil(item.dueDate);
            const status = item.status === 'done' ? 'done' : dueDays <= 7 ? 'soon' : 'pending';
            return (
              <article className={`vaccine-item ${status}`} key={item.id}>
                <button
                  type="button"
                  onClick={() => onUpdateVaccine(item.id, {
                    ...item,
                    status: item.status === 'done' ? 'pending' : 'done',
                    givenAt: item.status === 'done' ? '' : new Date().toISOString().slice(0, 10),
                    updatedAt: new Date().toISOString(),
                  })}
                >
                  <GameIcon name={item.status === 'done' ? 'check' : 'circle'} size={22} variant="cream" bare />
                </button>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.vaccineNames.join(', ')}</p>
                  <span>{formatDate(item.dueDate)}</span>
                </div>
                <em>{item.status === 'done' ? 'Đã tiêm' : dueDays <= 7 ? 'Sắp đến' : 'Theo lịch'}</em>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
