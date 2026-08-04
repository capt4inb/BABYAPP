import { useState } from 'react';
import { createRoom, getFirebaseErrorMessage, joinRoom } from '../services/firebase';
import GameIcon from './GameIcon';

export default function SettingsTab({ 
  settings, onSaveSettings, records, onImportRecords,
  milkBags = [], onImportMilkBags, memos = [], onImportMemos,
  diapers = [], onImportDiapers, sleeps = [], onImportSleeps, vaccines = [], onImportVaccines,
  syncPin, syncStatus, syncErrorMessage = '', onJoinSync, onLeaveSync 
}) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const [joinPin, setJoinPin] = useState('');
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState('');

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSaveSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Export JSON
  const handleExport = () => {
    const data = { records, settings, milkBags, memos, diapers, sleeps, vaccines, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baby-tracker-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data.records)) throw new Error('Định dạng không hợp lệ');
        onImportRecords(data.records);
        if (data.settings) {
          onSaveSettings(data.settings);
          setForm({ ...data.settings });
        }
        if (Array.isArray(data.milkBags)) {
          onImportMilkBags(data.milkBags);
        }
        if (Array.isArray(data.memos)) {
          onImportMemos(data.memos);
        }
        if (Array.isArray(data.diapers)) {
          onImportDiapers(data.diapers);
        }
        if (Array.isArray(data.sleeps)) {
          onImportSleeps(data.sleeps);
        }
        if (Array.isArray(data.vaccines)) {
          onImportVaccines(data.vaccines);
        }
        alert('Đã nhập dữ liệu thành công!');
      } catch {
        setImportError('Tệp không hợp lệ. Vui lòng chọn tệp xuất từ ứng dụng này.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      onImportRecords([]);
      onImportMilkBags([]);
      onImportMemos([]);
      onImportDiapers([]);
      onImportSleeps([]);
      onImportVaccines([]);
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 5000);
    }
  };

  const handleCreateRoom = async () => {
    try {
      setSyncLoading(true);
      setSyncError('');
      const pin = await createRoom(records, settings, milkBags, memos, diapers, sleeps, vaccines);
      onJoinSync(pin);
    } catch (err) {
      setSyncError(getFirebaseErrorMessage(err));
    } finally {
      setSyncLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    const normalizedPin = joinPin.replace(/\D/g, '');
    if (normalizedPin.length !== 4) {
      setSyncError('Mã PIN phải gồm 4 chữ số');
      return;
    }
    try {
      setSyncLoading(true);
      setSyncError('');
      const initialData = await joinRoom(normalizedPin);
      onImportRecords(initialData.records || []);
      if (initialData.settings) {
        onSaveSettings(initialData.settings);
        setForm(initialData.settings);
      }
      onImportMilkBags(initialData.milkBags || []);
      onImportMemos(initialData.memos || []);
      onImportDiapers(initialData.diapers || []);
      onImportSleeps(initialData.sleeps || []);
      onImportVaccines(initialData.vaccines || []);
      onJoinSync(normalizedPin);
    } catch (err) {
      setSyncError(getFirebaseErrorMessage(err));
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Cài đặt</h1>
      </div>

      <div style={{ padding: '16px' }}>

        {/* Baby Info */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GameIcon name="baby" size={22} variant="blue" /> Thông tin bé
          </h2>

          <div className="form-group">
            <label className="form-label">Tên bé</label>
            <input
              type="text"
              className="form-input"
              value={form.babyName}
              onChange={e => handleChange('babyName', e.target.value)}
              placeholder="Nhập tên bé..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Giới tính</label>
            <select
              className="form-input"
              value={form.babyGender}
              onChange={e => handleChange('babyGender', e.target.value)}
            >
              <option value="boy">Bé trai</option>
              <option value="girl">Bé gái</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Ngày sinh (YYYY-MM-DD)</label>
            <input
              type="date"
              className="form-input"
              value={form.babyBirthDate}
              onChange={e => handleChange('babyBirthDate', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ngày dự sinh (thai kỳ 40 tuần)</label>
            <input
              type="date"
              className="form-input"
              value={form.babyDueDate || ''}
              onChange={e => handleChange('babyDueDate', e.target.value)}
            />
          </div>

        </div>

        {/* Reminders */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GameIcon name="clock" size={22} variant="orange" /> Nhắc nhở
          </h2>

          <div className="form-group">
            <label className="form-label">Chu kỳ bú (giờ)</label>
            <select
              className="form-input"
              value={form.feedIntervalHours}
              onChange={e => handleChange('feedIntervalHours', Number(e.target.value))}
            >
              {[1.5, 2, 2.5, 3, 3.5, 4].map(h => (
                <option key={h} value={h}>{h} giờ</option>
              ))}
            </select>
          </div>
        </div>

        {/* Save button */}
        <button
          id="btn-save-settings"
          className="btn btn-primary"
          onClick={handleSave}
          style={{ width: '100%', marginBottom: 20 }}
        >
          <GameIcon name="save" size={28} variant="cream" />
          {saved ? 'Đã lưu!' : 'Lưu cài đặt'}
        </button>

        {/* Family Sync */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GameIcon name="users" size={28} variant="lavender" />
            Đồng bộ gia đình
          </h2>

          {syncPin ? (
            <div style={{ background: 'var(--color-primary-bg)', padding: 16, borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-primary-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                    Mã phòng của bạn
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text)', letterSpacing: '0.1em' }}>
                    {syncPin}
                  </div>
                  {syncErrorMessage && (
                    <div style={{ marginTop: 8, color: 'var(--color-danger)', fontSize: 13, lineHeight: 1.4 }}>
                      {syncErrorMessage}
                    </div>
                  )}
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <GameIcon name="cloud" size={24} variant="cream" /> 
                    {syncStatus === 'connecting' ? 'Đang kết nối...' : syncStatus === 'error' ? 'Lỗi đồng bộ' : 'Đã kết nối'}
                  </div>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={onLeaveSync}
                  style={{ padding: '8px 12px', color: 'var(--color-danger)' }}
                >
                  <GameIcon name="logout" size={24} variant="orange" /> Ngắt kết nối
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                Tạo mã PIN để đồng bộ dữ liệu giữa các máy (ví dụ: máy của mẹ và bố).
              </p>

              {syncError && (
                <div style={{ marginBottom: 16, padding: '10px 12px', background: 'rgba(255,107,107,0.1)', color: 'var(--color-danger)', fontSize: 13, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <GameIcon name="warning" size={26} variant="orange" /> {syncError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập mã 4 số..."
                  value={joinPin}
                  onChange={e => setJoinPin(e.target.value.replace(/\D/g, ''))}
                  style={{ flex: 1, letterSpacing: '0.1em', fontWeight: 600 }}
                  maxLength={4}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleJoinRoom}
                  disabled={syncLoading}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {syncLoading ? <GameIcon name="clock" size={28} variant="cream" className="animate-spin" /> : 'Tham gia'}
                </button>
              </div>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-text-light)', marginBottom: 16 }}>
                hoặc
              </div>

              <button
                className="btn btn-ghost"
                onClick={handleCreateRoom}
                disabled={syncLoading}
                style={{ width: '100%', background: 'var(--color-surface-alt)' }}
              >
                {syncLoading ? <GameIcon name="clock" size={28} variant="cream" className="animate-spin" /> : 'Tạo mã phòng mới'}
              </button>
            </div>
          )}
        </div>

        {/* Data Management */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GameIcon name="save" size={22} variant="blue" /> Quản lý dữ liệu
          </h2>
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
            {records.length} bản ghi đang lưu trữ
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              className="btn btn-ghost"
              onClick={handleExport}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              <GameIcon name="download" size={28} variant="cream" />
              Xuất dữ liệu (.json)
            </button>

            <label
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', borderRadius: 'var(--radius-full)',
                background: 'var(--color-surface-alt)', cursor: 'pointer',
                fontSize: 15, fontWeight: 600, color: 'var(--color-text-muted)',
                transition: 'all 0.2s ease',
              }}
            >
              <GameIcon name="upload" size={28} variant="cream" />
              Nhập dữ liệu (.json)
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>

            {importError && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)',
                fontSize: 13, color: 'var(--color-danger)', display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <GameIcon name="warning" size={26} variant="orange" /> {importError}
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ padding: 20, border: '1px solid rgba(255, 107, 107, 0.2)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <GameIcon name="warning" size={22} variant="orange" /> Vùng nguy hiểm
          </h2>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Thao tác này không thể hoàn tác. Hãy xuất dữ liệu trước khi xoá.
          </p>
          <button
            className="btn btn-danger"
            onClick={handleClearData}
            style={{ width: '100%' }}
          >
            <GameIcon name="trash" size={28} variant="cream" />
            {showClearConfirm ? 'Nhấn lần nữa để xác nhận xoá tất cả!' : 'Xoá tất cả dữ liệu'}
          </button>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
