import { useState, useEffect, useCallback } from 'react';
import DashboardTab from './components/DashboardTab';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';
import MilkStorageTab from './components/MilkStorageTab';
import RecordModal from './components/RecordModal';
import QuickAddModal from './components/QuickAddModal';
import GameIcon from './components/GameIcon';
import { getFirebaseErrorMessage, subscribeToRoom, updateRoomRecords, updateRoomSettings, updateRoomMilkBags, updateRoomMemos } from './services/firebase';

// ── localStorage keys ─────────────────────────────────────────
const STORAGE_KEYS = {
  RECORDS: 'bmt_records',
  SETTINGS: 'bmt_settings',
  MILK_BAGS: 'bmt_milk_bags',
  MEMOS: 'bmt_memos',
};

const DEFAULT_SETTINGS = {
  babyName: 'Bé Yêu',
  babyGender: 'boy', // 'boy' | 'girl'
  babyBirthDate: '', // YYYY-MM-DD
  feedIntervalHours: 3,
  volumeUnit: 'ml',
};

// ── Tab config ────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Trang chủ', icon: 'home', tone: 'pink' },
  { id: 'history',   label: 'Lịch sử',   icon: 'history', tone: 'green' },
  { id: 'milk',      label: 'Kho sữa',   icon: 'milk', tone: 'blue' },
  { id: 'settings',  label: 'Cài đặt',   icon: 'settings', tone: 'blue' },
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
  const [milkBags, setMilkBags] = useState(() =>
    loadFromStorage(STORAGE_KEYS.MILK_BAGS, [])
  );
  const [memos, setMemos] = useState(() =>
    loadFromStorage(STORAGE_KEYS.MEMOS, [])
  );
  const [modal, setModal] = useState(null); // null | { type: 'feed' | 'weight', editRecord: null | object }
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  
  // Sync state
  const [syncPin, setSyncPin] = useState(() => loadFromStorage('bmt_sync_pin', null));
  const [syncStatus, setSyncStatus] = useState(() =>
    loadFromStorage('bmt_sync_pin', null) ? 'connecting' : 'disconnected'
  ); // disconnected | connecting | connected | error
  const [syncError, setSyncError] = useState('');

  // Firebase Realtime Subscription
  useEffect(() => {
    saveToStorage('bmt_sync_pin', syncPin);
    if (!syncPin) {
      return;
    }

    const unsubscribe = subscribeToRoom(
      syncPin,
      (remoteRecords) => {
        setRecords(remoteRecords);
        setSyncStatus('connected');
        setSyncError('');
      },
      (remoteSettings) => {
        setSettings(remoteSettings);
      },
      (remoteMilkBags) => {
        setMilkBags(remoteMilkBags);
      },
      (remoteMemos) => {
        setMemos(remoteMemos);
      },
      (error) => {
        setSyncStatus('error');
        setSyncError(getFirebaseErrorMessage(error));
      }
    );

    return () => unsubscribe();
  }, [syncPin]);

  // Persist records to local storage as fallback
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.RECORDS, records);
  }, [records]);

  // Persist settings to local storage as fallback
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
  }, [settings]);

  // Persist milkBags to local storage as fallback
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MILK_BAGS, milkBags);
  }, [milkBags]);

  // Persist memos to local storage as fallback
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.MEMOS, memos);
  }, [memos]);

  // ── Record CRUD ──────────────────────────────────────────────
  const addRecord = useCallback((record) => {
    setRecords(prev => {
      const next = [record, ...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (syncPin) updateRoomRecords(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const updateRecord = useCallback((id, updated) => {
    setRecords(prev => {
      const next = prev.map(r => r.id === id ? { ...r, ...updated } : r);
      if (syncPin) updateRoomRecords(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const deleteRecord = useCallback((id) => {
    setRecords(prev => {
      const next = prev.filter(r => r.id !== id);
      if (syncPin) updateRoomRecords(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  // ── Milk Bag CRUD ────────────────────────────────────────────
  const addMilkBag = useCallback((bag) => {
    setMilkBags(prev => {
      const next = [bag, ...prev];
      if (syncPin) updateRoomMilkBags(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const updateMilkBag = useCallback((id, updated) => {
    setMilkBags(prev => {
      const next = prev.map(b => b.id === id ? { ...b, ...updated } : b);
      if (syncPin) updateRoomMilkBags(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const deleteMilkBag = useCallback((id) => {
    setMilkBags(prev => {
      const next = prev.filter(b => b.id !== id);
      if (syncPin) updateRoomMilkBags(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  // ── Memo CRUD ────────────────────────────────────────────────
  const addMemo = useCallback((memo) => {
    setMemos(prev => {
      const next = [memo, ...prev];
      if (syncPin) updateRoomMemos(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const deleteMemo = useCallback((id) => {
    setMemos(prev => {
      const next = prev.filter(m => m.id !== id);
      if (syncPin) updateRoomMemos(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    if (syncPin) updateRoomSettings(syncPin, newSettings).catch(console.error);
  }, [syncPin]);

  // ── Modal helpers ────────────────────────────────────────────
  const openFeedModal = useCallback((editRecord = null) => {
    setModal({ type: 'feed', editRecord });
  }, []);

  const openWeightModal = useCallback((editRecord = null) => {
    setModal({ type: 'weight', editRecord });
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
    onOpenWeightModal: openWeightModal,
  };

  return (
    <div className="app-container" data-theme="pastel">
      {/* Page Content */}
      <div className="page">
        {activeTab === 'dashboard' && (
          <DashboardTab
            {...sharedProps}
            milkBags={milkBags}
            onAddMilkBag={addMilkBag}
            onUpdateMilkBag={updateMilkBag}
            onNavigateToMilk={() => setActiveTab('milk')}
            memos={memos}
            onAddMemo={addMemo}
            onDeleteMemo={deleteMemo}
          />
        )}
        {activeTab === 'history'   && <HistoryTab   {...sharedProps} />}
        {activeTab === 'milk'      && (
          <MilkStorageTab
            milkBags={milkBags}
            records={records}
            onAddMilkBag={addMilkBag}
            onUpdateMilkBag={updateMilkBag}
            onDeleteMilkBag={deleteMilkBag}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'settings'  && (
          <SettingsTab
            settings={settings}
            onSaveSettings={handleSaveSettings}
            records={records}
            onImportRecords={(recs) => {
              setRecords(recs);
              if (syncPin) updateRoomRecords(syncPin, recs).catch(console.error);
            }}
            milkBags={milkBags}
            onImportMilkBags={(bags) => {
              setMilkBags(bags);
              if (syncPin) updateRoomMilkBags(syncPin, bags).catch(console.error);
            }}
            memos={memos}
            onImportMemos={(mems) => {
              setMemos(mems);
              if (syncPin) updateRoomMemos(syncPin, mems).catch(console.error);
            }}
            syncPin={syncPin}
            syncStatus={syncStatus}
            syncErrorMessage={syncError}
            onJoinSync={(pin) => {
              setSyncError('');
              setSyncStatus('connecting');
              setSyncPin(pin);
            }}
            onLeaveSync={() => {
              setSyncError('');
              setSyncStatus('disconnected');
              setSyncPin(null);
            }}
          />
        )}
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="tab-bar">
        {TABS.slice(0, 2).map(({ id, label, icon, tone }) => (
          <button
            key={id}
            className={`tab-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-label={label}
            aria-current={activeTab === id ? 'page' : undefined}
            title={label}
          >
            <div className="tab-icon">
              <GameIcon name={icon} size={activeTab === id ? 32 : 30} variant={tone} />
            </div>
            <span>{label}</span>
          </button>
        ))}
        <button
          className="tab-fab"
          type="button"
          onClick={() => setShowQuickAdd(true)}
          aria-label="Thêm nhanh"
          title="Thêm nhanh"
        >
          <GameIcon name="plus" size={40} variant="cream" />
        </button>
        {TABS.slice(2).map(({ id, label, icon, tone }) => (
          <button
            key={id}
            className={`tab-item ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-label={label}
            aria-current={activeTab === id ? 'page' : undefined}
            title={label}
          >
            <div className="tab-icon">
              <GameIcon name={icon} size={activeTab === id ? 32 : 30} variant={tone} />
            </div>
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Record Modal */}
      {modal && (
        <RecordModal
          key={`${modal.type}-${modal.editRecord?.id || 'new'}`}
          type={modal.type}
          editRecord={modal.editRecord}
          onSave={handleModalSave}
          onClose={closeModal}
        />
      )}

      {showQuickAdd && (
        <QuickAddModal
          onClose={() => setShowQuickAdd(false)}
          onSaveFeed={addRecord}
          onSaveMilkBag={addMilkBag}
        />
      )}
    </div>
  );
}
