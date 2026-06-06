import { useState } from 'react';
import { Save, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';

export default function SettingsTab({ settings, onSaveSettings, records, onImportRecords }) {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);
  const [importError, setImportError] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

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
    const data = { records, settings, exportedAt: new Date().toISOString() };
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
        alert(`✅ Đã nhập ${data.records.length} bản ghi thành công!`);
      } catch (err) {
        setImportError('Tệp không hợp lệ. Vui lòng chọn tệp xuất từ ứng dụng này.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearData = () => {
    if (showClearConfirm) {
      onImportRecords([]);
      setShowClearConfirm(false);
    } else {
      setShowClearConfirm(true);
      setTimeout(() => setShowClearConfirm(false), 5000);
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
            👶 Thông tin bé
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
            <label className="form-label">Ngày sinh (YYYY-MM-DD)</label>
            <input
              type="date"
              className="form-input"
              value={form.babyBirthDate}
              onChange={e => handleChange('babyBirthDate', e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Ngày dự sinh — tùy chọn (để tính Wonder Weeks chính xác hơn)</label>
            <input
              type="date"
              className="form-input"
              value={form.babyDueDate}
              onChange={e => handleChange('babyDueDate', e.target.value)}
            />
          </div>
        </div>

        {/* Reminders */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            ⏰ Nhắc nhở
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

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Chu kỳ hút sữa (giờ)</label>
            <select
              className="form-input"
              value={form.pumpIntervalHours}
              onChange={e => handleChange('pumpIntervalHours', Number(e.target.value))}
            >
              {[2, 2.5, 3, 3.5, 4, 5, 6].map(h => (
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
          <Save size={18} />
          {saved ? '✅ Đã lưu!' : 'Lưu cài đặt'}
        </button>

        {/* Data Management */}
        <div className="card" style={{ padding: 20, marginBottom: 16 }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            💾 Quản lý dữ liệu
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
              <Download size={18} />
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
              <Upload size={18} />
              Nhập dữ liệu (.json)
              <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
            </label>

            {importError && (
              <div style={{
                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 107, 107, 0.1)', border: '1px solid rgba(255, 107, 107, 0.3)',
                fontSize: 13, color: 'var(--color-danger)', display: 'flex', gap: 8, alignItems: 'center',
              }}>
                <AlertTriangle size={16} /> {importError}
              </div>
            )}
          </div>
        </div>

        {/* Danger zone */}
        <div className="card" style={{ padding: 20, border: '1px solid rgba(255, 107, 107, 0.2)' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: 8 }}>
            ⚠️ Vùng nguy hiểm
          </h2>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Thao tác này không thể hoàn tác. Hãy xuất dữ liệu trước khi xoá.
          </p>
          <button
            className="btn btn-danger"
            onClick={handleClearData}
            style={{ width: '100%' }}
          >
            <Trash2 size={18} />
            {showClearConfirm ? '⚠️ Nhấn lần nữa để xác nhận xoá tất cả!' : 'Xoá tất cả dữ liệu'}
          </button>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  );
}
