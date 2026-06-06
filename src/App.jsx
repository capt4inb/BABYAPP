import { useState, useEffect, useCallback } from 'react';
import { Home, Clock, BarChart2, Star, Settings } from 'lucide-react';
import DashboardTab from './components/DashboardTab';
import HistoryTab from './components/HistoryTab';
import StatsTab from './components/StatsTab';
import WonderWeeksTab from './components/WonderWeeksTab';
import SettingsTab from './components/SettingsTab';
import RecordModal from './components/RecordModal';

// ── localStorage keys ─────────────────────────────────────────
const STORAGE_KEYS = {
  RECORDS: 'bmt_records',
  SETTINGS: 'bmt_settings',
};

const DEFAULT_SETTINGS = {
  babyName: 'Bé Yêu',
  babyBirthDate: '', // YYYY-MM-DD
  babyDueDate: '',   // YYYY-MM-DD (optional, for Wonder Weeks)
  feedIntervalHours: 3,
  pumpIntervalHours: 3,
  volumeUnit: 'ml',
};

// ── Tab config ────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Trang chủ', Icon: Home },
  { id: 'history',   label: 'Lịch sử',   Icon: Clock },
  { id: 'stats',     label: 'Thống kê',   Icon: BarChart2 },
  { id: 'wonder',    label: 'Tuần vàng',  Icon: Star },
  { id: 'settings',  label: 'Cài đặt',   Icon: Settings },
];

// ── Utility ───────────────────────────────────────────────────
function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// ── App Component ─────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [records, setRecords] = useState(() =>
    loadFromStorage(STORAGE_KEYS.RECORDS, [])
  );
  const [settings, setSettings] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [modal, setModal] = useState(null); // null | { type: 'feed' | 'pump', editRecord: null | object }

  // Persist records
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RECORDS, records);
  }, [records]);

  // Persist settings
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // ── Record CRUD ──────────────────────────────────────────────
  const addRecord = useCallback((record) => {
    setRecords(prev => [record, ...prev].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    ));
  }, []);

  const updateRecord = useCallback((id, updated) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
  }, []);

  const deleteRecord = useCallback((id) => {
    setRecords(prev => prev.filter(r => r.id !== id));
  }, []);

  // ── Modal helpers ────────────────────────────────────────────
  const openFeedModal = useCallback((editRecord = null) => {
    setModal({ type: 'feed', editRecord });
  }, []);

  const openPumpModal = useCallback((editRecord = null) => {
    setModal({ type: 'pump', editRecord });
  }, []);

  const closeModal = useCallback(() => setModal(null), []);

  const handleModalSave = useCallback((record) => {
    if (modal?.editRecord) {
      updateRecord(modal.editRecord.id, record);
    } else {
      addRecord(record);
    }
    closeModal();
  }, [modal, addRecord, updateRecord, closeModal]);

  // ── Shared props ─────────────────────────────────────────────
  const sharedProps = {
    records,
    settings,
    onAddRecord: addRecord,
    onUpdateRecord: updateRecord,
    onDeleteRecord: deleteRecord,
    onOpenFeedModal: openFeedModal,
    onOpenPumpModal: openPumpModal,
  };

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', position: 'relative', minHeight: '100dvh' }}>
      {/* Page Content */}
      <div className="page">
        {activeTab === 'dashboard' && <DashboardTab {...sharedProps} />}
        {activeTab === 'history'   && <HistoryTab   {...sharedProps} />}
        {activeTab === 'stats'     && <StatsTab      {...sharedProps} />}
        {activeTab === 'wonder'    && <WonderWeeksTab {...sharedProps} />}
        {activeTab === 'settings'  && (
          <SettingsTab
            settings={settings}
            onSaveSettings={setSettings}
            records={records}
            onImportRecords={setRecords}
          />
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="tab-bar">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            className={`tab-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-label={label}
          >
            <div className="tab-icon">
              <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 1.8} />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Record Modal */}
      {modal && (
        <RecordModal
          type={modal.type}
          editRecord={modal.editRecord}
          onSave={handleModalSave}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
