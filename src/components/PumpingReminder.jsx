import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import GameIcon from './GameIcon';
import {
  DEFAULT_PUMP_INTERVAL_MINUTES, formatPumpCountdown, formatPumpInterval,
  formatPumpTime, getPumpReminder, getPumpSessions, isValidPumpInterval,
} from '../utils/pumpingUtils';

function IntervalFields({ draft, onChange, error }) {
  return (
    <fieldset className="pump-interval-fields">
      <label className="pump-reminder-toggle">
        <input type="checkbox" checked={draft.enabled} onChange={event => onChange({ ...draft, enabled: event.target.checked })} />
        Nhắc cữ hút tiếp theo
      </label>
      {draft.enabled && (
        <div className="pump-interval-inputs">
          <span>Sau khi hút xong</span>
          <label>
            <input className="form-input" type="number" min="0" max="24" step="1" inputMode="numeric" required
              value={draft.hours} onChange={event => onChange({ ...draft, hours: event.target.value })} />
            <span>giờ</span>
          </label>
          <label>
            <input className="form-input" type="number" min="0" max="59" step="1" inputMode="numeric" required
              value={draft.minutes} onChange={event => onChange({ ...draft, minutes: event.target.value })} />
            <span>phút</span>
          </label>
        </div>
      )}
      {error && <p className="pump-form-error" role="alert">{error}</p>}
    </fieldset>
  );
}

function toDatetimeInput(dateLike) {
  const date = new Date(dateLike);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export default function PumpingReminder({
  pumpingSessions, settings, onAddPumpingSession, onUpdatePumpingSession,
  onDeletePumpingSession, onSaveSettings,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [dialog, setDialog] = useState(null);
  const [draft, setDraft] = useState({ enabled: true, hours: '3', minutes: '0' });
  const [error, setError] = useState('');
  const [editSession, setEditSession] = useState(null);
  const [completedAt, setCompletedAt] = useState('');
  const dialogRef = useRef(null);
  const lastClickRef = useRef(0);
  const sessions = useMemo(() => getPumpSessions(pumpingSessions), [pumpingSessions]);
  const reminder = getPumpReminder(sessions, settings.pumpReminder, nowMs);

  useEffect(() => {
    const tick = () => setNowMs(Date.now());
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('focus', tick);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', tick);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const element = dialogRef.current;
    element?.querySelector('input, button')?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') setDialog(null);
      if (event.key !== 'Tab') return;
      const controls = [...(element?.querySelectorAll('button, input, select, summary, a[href]') || [])]
        .filter(control => !control.disabled && control.getClientRects().length > 0);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [dialog]);

  function openSchedule() {
    const minutes = reminder.intervalMinutes;
    setDraft({
      enabled: settings.pumpReminder?.enabled ?? true,
      hours: String(Math.floor(minutes / 60)),
      minutes: String(minutes % 60),
    });
    setError('');
    setDialog('schedule');
  }

  function openRecord(session = null) {
    setEditSession(session);
    setCompletedAt(toDatetimeInput(session?.completedAt || new Date()));
    setError('');
    setDialog('record');
  }

  function readSchedule() {
    const minutes = Number(draft.hours) * 60 + Number(draft.minutes);
    if (draft.enabled && (!isValidPumpInterval(minutes) || Number(draft.minutes) > 59 || Number(draft.minutes) < 0)) {
      setError('Khoảng cách giữa các cữ cần từ 1 phút đến 24 giờ.');
      return null;
    }
    return {
      enabled: draft.enabled,
      intervalMinutes: isValidPumpInterval(minutes) ? minutes : DEFAULT_PUMP_INTERVAL_MINUTES,
    };
  }

  function saveSchedule(event) {
    event.preventDefault();
    const pumpReminder = readSchedule();
    if (!pumpReminder) return;
    onSaveSettings({ ...settings, pumpReminder });
    setDialog(null);
  }

  const finishPumping = useCallback((finishedAt) => {
    const pumpReminder = { enabled: true, intervalMinutes: reminder.intervalMinutes };
    onSaveSettings({ ...settings, pumpReminder });
    onAddPumpingSession({ id: crypto.randomUUID(), completedAt: finishedAt });
    setNowMs(Date.now());
    setDialog(null);
  }, [onAddPumpingSession, onSaveSettings, reminder.intervalMinutes, settings]);

  const finishNow = useCallback(() => {
    const now = Date.now();
    if (now - lastClickRef.current < 1000) return;
    lastClickRef.current = now;
    finishPumping(new Date(now).toISOString());
  }, [finishPumping]);

  const saveRecord = useCallback((event) => {
    event.preventDefault();
    const date = new Date(completedAt);
    if (!Number.isFinite(date.getTime()) || date.getTime() > Date.now()) {
      setError('Giờ hút xong không được ở tương lai.');
      return;
    }
    if (editSession) {
      onUpdatePumpingSession(editSession.id, { completedAt: date.toISOString() });
      setNowMs(Date.now());
      setDialog('schedule');
    } else {
      finishPumping(date.toISOString());
    }
  }, [completedAt, editSession, finishPumping, onUpdatePumpingSession]);

  const status = !reminder.enabled
    ? (settings.pumpReminder ? 'Đã tắt nhắc hút sữa' : 'Chưa đặt lịch nhắc')
    : !reminder.lastSession ? 'Chưa có cữ hút nào'
      : reminder.due ? 'Đến giờ hút sữa' : `Cữ tiếp theo · ${formatPumpTime(reminder.nextMs, nowMs)}`;

  return (
    <>
      <section className={`home-pump-reminder ${reminder.due ? 'is-due' : ''}`} aria-label="Lịch hút sữa">
        <header className="pump-reminder-heading">
          <GameIcon name="pump" size={30} variant="lavender" />
          <h2>Lịch hút sữa</h2>
          <button className="pump-icon-button" type="button" title="Chỉnh lịch hút sữa" aria-label="Chỉnh lịch hút sữa" onClick={openSchedule}>
            <GameIcon name="settings" size={28} bare />
          </button>
        </header>
        <div className="pump-reminder-main">
          <div className="pump-reminder-clock">
            <span role="status">{status}</span>
            {reminder.enabled && reminder.lastSession ? (
              <strong role="timer" aria-label="Đếm ngược cữ hút tiếp theo" aria-live="off">{formatPumpCountdown(reminder.remainingMs)}</strong>
            ) : <strong aria-label="Chưa bắt đầu đếm ngược">--:--:--</strong>}
            {reminder.overdueMs >= 60000 && <small>Quá lịch {formatPumpInterval(Math.floor(reminder.overdueMs / 60000))}</small>}
          </div>
          <button type="button" className="btn btn-primary pump-finish-button" onClick={() => finishNow()}>
            <GameIcon name="check" size={24} bare />Hút xong
          </button>
        </div>
        <p className="pump-reminder-last">
          {reminder.lastSession
            ? `Hút xong lúc ${formatPumpTime(reminder.lastSession.completedMs, nowMs)}`
            : 'Chưa ghi nhận giờ hút xong'}
          {reminder.enabled && <span>Cách {formatPumpInterval(reminder.intervalMinutes)}</span>}
        </p>
      </section>

      {dialog && createPortal(
        <>
          <div className="modal-backdrop" onClick={() => setDialog(null)} />
          <div ref={dialogRef} className="pump-schedule-modal" role="dialog" aria-modal="true" aria-labelledby="pump-schedule-title">
            <header>
              <h2 id="pump-schedule-title">{dialog === 'schedule' ? 'Lịch hút sữa' : editSession ? 'Sửa giờ hút xong' : 'Ghi giờ hút xong'}</h2>
              <button type="button" className="pump-icon-button" aria-label="Đóng lịch hút sữa" title="Đóng" onClick={() => setDialog(null)}>
                <GameIcon name="close" size={28} bare />
              </button>
            </header>
            {dialog === 'record' ? (
              <form onSubmit={event => saveRecord(event)}>
                <div className="form-group">
                  <label className="form-label" htmlFor="pump-completed-at">Giờ hút xong</label>
                  <input id="pump-completed-at" type="datetime-local" className="form-input" value={completedAt}
                    onChange={event => setCompletedAt(event.target.value)} max={toDatetimeInput(nowMs)} required />
                </div>
                {error && <p className="pump-form-error" role="alert">{error}</p>}
                <footer>
                  <button type="button" className="btn btn-ghost" onClick={() => setDialog('schedule')}>Hủy</button>
                  <button type="submit" className="btn btn-primary"><GameIcon name="save" size={24} bare />Lưu giờ hút</button>
                </footer>
              </form>
            ) : <form onSubmit={saveSchedule}>
              <IntervalFields draft={draft} onChange={setDraft} error={error} />
              <button type="button" className="pump-setup-button" onClick={() => openRecord()}>
                <GameIcon name="clock" size={24} bare />Ghi giờ hút khác
              </button>
              <details className="pump-recent-sessions">
                <summary>Lịch sử hút sữa ({sessions.length})</summary>
                <div className="pump-session-list">
                  {sessions.map(session => (
                    <div className="pump-session-row" key={session.id}>
                      <time>{formatPumpTime(session.completedMs, nowMs)}</time>
                      <div className="pump-session-actions">
                        <button type="button" className="pump-icon-button" title="Sửa giờ hút" aria-label={`Sửa giờ hút ${formatPumpTime(session.completedMs, nowMs)}`} onClick={() => openRecord(session)}>
                          <GameIcon name="edit" size={26} bare />
                        </button>
                        <button type="button" className="pump-icon-button" title="Xóa cữ hút" aria-label={`Xóa cữ hút ${formatPumpTime(session.completedMs, nowMs)}`} onClick={() => {
                          if (window.confirm('Xóa cữ hút này?')) onDeletePumpingSession(session.id);
                        }}>
                          <GameIcon name="trash" size={26} bare />
                        </button>
                      </div>
                    </div>
                  ))}
                  </div>
                {sessions.length === 0 && <p>Chưa có cữ hút nào.</p>}
              </details>
              <footer>
                <button type="button" className="btn btn-ghost" onClick={() => setDialog(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><GameIcon name="save" size={24} bare />Lưu lịch</button>
              </footer>
            </form>}
          </div>
        </>, document.body
      )}
    </>
  );
}
