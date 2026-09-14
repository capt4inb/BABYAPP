import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Plus, Trash2, X } from 'lucide-react';
import GameIcon from './GameIcon';
import { createMilkBagBatch, MAX_BATCH_BAGS, MILK_BATCH_STORAGE } from '../utils/milkBatchUtils';

function localDatetime(dateLike = new Date()) {
  const date = new Date(dateLike);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function StorageSelect({ value, onChange, label }) {
  const id = useId();
  return (
    <div className="milk-batch-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="form-input" value={value} onChange={event => onChange(event.target.value)}>
        {MILK_BATCH_STORAGE.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </div>
  );
}

export default function AddMilkBagsModal({ onSave, onClose, initialValues }) {
  const [expressedAt, setExpressedAt] = useState(() => initialValues?.expressedAt || localDatetime());
  const [storageStatus, setStorageStatus] = useState(initialValues?.storageStatus || 'fridge');
  const [rows, setRows] = useState(() => [{ id: crypto.randomUUID(), volume: initialValues?.volume || '', quantity: '1', custom: false }]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const closeRef = useRef(onClose);
  const modalRef = useRef(null);
  const nextFocusRef = useRef(null);
  const totalBags = rows.reduce((sum, row) => sum + (Math.max(0, Number(row.quantity)) || 0), 0);
  const totalMl = rows.reduce((sum, row) => sum + (Math.max(0, Number(row.volume)) || 0) * (Math.max(0, Number(row.quantity)) || 0), 0);
  const format = value => value.toLocaleString('vi-VN', { maximumFractionDigits: 2 });

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    const keyDown = event => {
      if (event.key === 'Escape' && !savingRef.current) closeRef.current();
      if (event.key !== 'Tab') return;
      const controls = [...modalRef.current.querySelectorAll('button, input, select')].filter(el => !el.disabled);
      const first = controls[0];
      const last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first?.focus();
      }
    };
    document.addEventListener('keydown', keyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', keyDown);
      previousFocus?.focus();
    };
  }, []);

  useEffect(() => {
    if (!nextFocusRef.current) return;
    document.getElementById(`batch-volume-${nextFocusRef.current}`)?.focus();
    nextFocusRef.current = null;
  }, [rows]);

  function updateRow(id, changes) {
    setRows(previous => previous.map(row => row.id === id ? { ...row, ...changes } : row));
    setError('');
  }

  function addRow(source) {
    const row = { ...(source || { volume: '', quantity: '1', custom: false }), id: crypto.randomUUID() };
    nextFocusRef.current = row.id;
    setRows(previous => [...previous, row]);
    setError('');
  }

  async function submit(event) {
    event.preventDefault();
    if (savingRef.current) return;
    setError('');
    try {
      const bags = createMilkBagBatch(rows, { expressedAt, storageStatus });
      savingRef.current = true;
      setSaving(true);
      await onSave(bags);
      onClose();
    } catch (err) {
      savingRef.current = false;
      setSaving(false);
      setError(err.message || 'Chưa lưu được. Vui lòng thử lại.');
    }
  }

  return createPortal(
    <>
      <div className="modal-backdrop" onClick={() => !savingRef.current && onClose()} />
      <section ref={modalRef} tabIndex={-1} className="milk-batch-modal" role="dialog" aria-modal="true" aria-labelledby="milk-batch-title">
        <header>
          <GameIcon name="milk" size={34} variant="blue" />
          <h2 id="milk-batch-title">Thêm sữa vào kho</h2>
          <button className="milk-batch-icon" type="button" onClick={onClose} disabled={saving} aria-label="Đóng" title="Đóng"><X size={20} /></button>
        </header>
        <form onSubmit={submit}>
          <div className="milk-batch-scroll">
            <div className="milk-batch-defaults">
              <label className="milk-batch-field">
                <span>Giờ hút chung</span>
                <input className="form-input" type="datetime-local" value={expressedAt} onChange={event => setExpressedAt(event.target.value)} required />
              </label>
              <StorageSelect label="Nơi cất chung" value={storageStatus} onChange={setStorageStatus} />
            </div>
            <div className="milk-batch-rows">
              {rows.map((row, index) => (
                <div key={row.id} className="milk-batch-row">
                  <div className="milk-batch-row-head">
                    <strong>Dòng {index + 1}</strong>
                    <button className="milk-batch-icon" type="button" disabled={rows.length >= MAX_BATCH_BAGS} title="Nhân đôi dòng" aria-label={`Nhân đôi dòng ${index + 1}`} onClick={() => addRow(row)}><Copy size={17} /></button>
                    <button className="milk-batch-icon" type="button" disabled={rows.length === 1} title="Xóa dòng" aria-label={`Xóa dòng ${index + 1}`} onClick={() => setRows(previous => previous.filter(item => item.id !== row.id))}><Trash2 size={17} /></button>
                  </div>
                  <div className="milk-batch-numbers">
                    <label className="milk-batch-field" htmlFor={`batch-volume-${row.id}`}>
                      <span>ml / bịch</span>
                      <input id={`batch-volume-${row.id}`} className="form-input" type="number" inputMode="decimal" min="1" max="1000" step="any" placeholder="150" value={row.volume} onChange={event => updateRow(row.id, { volume: event.target.value })} required />
                    </label>
                    <label className="milk-batch-field">
                      <span>Số bịch</span>
                      <input className="form-input" type="number" inputMode="numeric" min="1" max={MAX_BATCH_BAGS} step="1" value={row.quantity} onChange={event => updateRow(row.id, { quantity: event.target.value })} required />
                    </label>
                  </div>
                  <label className="milk-batch-custom">
                    <input type="checkbox" checked={row.custom} onChange={event => updateRow(row.id, { custom: event.target.checked, expressedAt: row.expressedAt || expressedAt, storageStatus: row.storageStatus || storageStatus })} />
                    Giờ / nơi cất riêng
                  </label>
                  {row.custom && <div className="milk-batch-overrides">
                    <label className="milk-batch-field">
                      <span>Giờ hút dòng {index + 1}</span>
                      <input className="form-input" type="datetime-local" value={row.expressedAt} onChange={event => updateRow(row.id, { expressedAt: event.target.value })} required />
                    </label>
                    <StorageSelect label={`Nơi cất dòng ${index + 1}`} value={row.storageStatus} onChange={value => updateRow(row.id, { storageStatus: value })} />
                  </div>}
                </div>
              ))}
            </div>
            <button className="btn btn-ghost milk-batch-add" type="button" onClick={() => addRow()} disabled={rows.length >= MAX_BATCH_BAGS}><Plus size={18} />Thêm dòng</button>
          </div>
          <footer>
            {error && <p role="alert" className="milk-batch-error">{error}</p>}
            <div className="milk-batch-total"><span>{format(totalBags)} bịch</span><strong>{format(totalMl)} ml</strong></div>
            <div className="milk-batch-actions">
              <button className="btn btn-ghost" type="button" disabled={saving} onClick={onClose}>Hủy</button>
              <button className="btn btn-primary" type="submit" disabled={saving}><GameIcon name="save" size={24} bare />{saving ? 'Đang lưu...' : `Lưu ${format(totalBags)} bịch`}</button>
            </div>
          </footer>
        </form>
      </section>
    </>, document.body
  );
}
