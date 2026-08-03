import { useState, useEffect, useCallback } from 'react';
import DashboardTab from './components/DashboardTab';
import HistoryTab from './components/HistoryTab';
import SettingsTab from './components/SettingsTab';
import MilkStorageTab from './components/MilkStorageTab';
import { DiaperTab, SleepTab, VaccineTab } from './components/CareTabs';
import RecordModal from './components/RecordModal';
import QuickAddModal from './components/QuickAddModal';
import GameIcon from './components/GameIcon';
import {
  getFirebaseErrorMessage,
  subscribeToRoom,
  updateRoomDiapers,
  updateRoomMilkBags,
  updateRoomMemos,
  updateRoomRecords,
  updateRoomSettings,
  updateRoomSleeps,
  updateRoomVaccines,
} from './services/firebase';
import { formatLiveDuration, generateVaccineSchedule } from './utils/careUtils';

// ── localStorage keys ─────────────────────────────────────────
const STORAGE_KEYS = {
  RECORDS: 'bmt_records',
  SETTINGS: 'bmt_settings',
  MILK_BAGS: 'bmt_milk_bags',
  MEMOS: 'bmt_memos',
  DIAPERS: 'bmt_diapers',
  SLEEPS: 'bmt_sleeps',
  VACCINES: 'bmt_vaccines',
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
function SleepFloatingBubble({ sleep, nowMs, onOpen }) {
  if (!sleep) return null;

  return (
    <button className="sleep-floating-bubble animate-scale-in" type="button" onClick={onOpen} aria-label="Mở thời gian ngủ">
      <span className="sleep-floating-icon">
        <GameIcon name="moon" size={42} variant="cream" bare />
      </span>
      <span>Thời gian ngủ</span>
      <strong>{formatLiveDuration(sleep.startAt, nowMs)}</strong>
    </button>
  );
}

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
  const [diapers, setDiapers] = useState(() =>
    loadFromStorage(STORAGE_KEYS.DIAPERS, [])
  );
  const [sleeps, setSleeps] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SLEEPS, [])
  );
  const [vaccines, setVaccines] = useState(() => {
    const storedVaccines = loadFromStorage(STORAGE_KEYS.VACCINES, []);
    return storedVaccines.length > 0 ? storedVaccines : generateVaccineSchedule(settings.babyBirthDate, []);
  });
  const [modal, setModal] = useState(null); // null | { type: 'feed' | 'weight', editRecord: null | object }
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [sleepNowMs, setSleepNowMs] = useState(() => Date.now());
  const [sleepBubbleMinimized, setSleepBubbleMinimized] = useState(false);
  
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
      (remoteDiapers) => {
        setDiapers(remoteDiapers);
      },
      (remoteSleeps) => {
        setSleeps(remoteSleeps);
      },
      (remoteVaccines) => {
        const seededVaccines = remoteVaccines.length > 0
          ? remoteVaccines
          : generateVaccineSchedule(settings.babyBirthDate, []);
        setVaccines(seededVaccines);
        if (remoteVaccines.length === 0 && seededVaccines.length > 0) {
          updateRoomVaccines(syncPin, seededVaccines).catch(console.error);
        }
      },
      (error) => {
        setSyncStatus('error');
        setSyncError(getFirebaseErrorMessage(error));
      }
    );

    return () => unsubscribe();
  }, [settings.babyBirthDate, syncPin]);

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

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.DIAPERS, diapers);
  }, [diapers]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SLEEPS, sleeps);
  }, [sleeps]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.VACCINES, vaccines);
  }, [vaccines]);

  const activeSleep = sleeps.find(item => !item.endAt);
  const activeSleepId = activeSleep?.id || '';
  const activeSleepStartAt = activeSleep?.startAt || '';

  useEffect(() => {
    if (!activeSleepId) return undefined;
    const intervalId = window.setInterval(() => setSleepNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [activeSleepId, activeSleepStartAt]);

  useEffect(() => {
    if (!settings.babyBirthDate || vaccines.length > 0) return;
    const seededVaccines = generateVaccineSchedule(settings.babyBirthDate, vaccines);
    if (seededVaccines.length === 0) return;

    if (syncPin) updateRoomVaccines(syncPin, seededVaccines).catch(console.error);
  }, [settings.babyBirthDate, syncPin, vaccines]);

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

  const addDiaper = useCallback((diaper) => {
    setDiapers(prev => {
      const next = [diaper, ...prev].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      if (syncPin) updateRoomDiapers(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const updateDiaper = useCallback((id, updated) => {
    setDiapers(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updated } : item);
      if (syncPin) updateRoomDiapers(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const deleteDiaper = useCallback((id) => {
    setDiapers(prev => {
      const next = prev.filter(item => item.id !== id);
      if (syncPin) updateRoomDiapers(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const addSleep = useCallback((sleep) => {
    setSleepNowMs(Date.now());
    setSleepBubbleMinimized(false);
    setSleeps(prev => {
      const next = [sleep, ...prev].sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
      if (syncPin) updateRoomSleeps(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const updateSleep = useCallback((id, updated) => {
    if (updated.endAt) setSleepBubbleMinimized(false);
    setSleeps(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updated } : item);
      if (syncPin) updateRoomSleeps(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const deleteSleep = useCallback((id) => {
    setSleeps(prev => {
      const next = prev.filter(item => item.id !== id);
      if (syncPin) updateRoomSleeps(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const updateVaccine = useCallback((id, updated) => {
    setVaccines(prev => {
      const next = prev.map(item => item.id === id ? { ...item, ...updated } : item);
      if (syncPin) updateRoomVaccines(syncPin, next).catch(console.error);
      return next;
    });
  }, [syncPin]);

  const handleSaveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    if (syncPin) updateRoomSettings(syncPin, newSettings).catch(console.error);
    if (newSettings.babyBirthDate && vaccines.length === 0) {
      const seededVaccines = generateVaccineSchedule(newSettings.babyBirthDate, []);
      setVaccines(seededVaccines);
      if (syncPin) updateRoomVaccines(syncPin, seededVaccines).catch(console.error);
    }
  }, [syncPin, vaccines.length]);

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
            diapers={diapers}
            sleeps={sleeps}
            vaccines={vaccines}
            onAddMilkBag={addMilkBag}
            onUpdateMilkBag={updateMilkBag}
            onNavigateToMilk={() => setActiveTab('milk')}
            onNavigateToCare={setActiveTab}
            memos={memos}
            onAddMemo={addMemo}
            onDeleteMemo={deleteMemo}
          />
        )}
        {activeTab === 'history'   && <HistoryTab   {...sharedProps} />}
        {activeTab === 'diaper' && (
          <DiaperTab
            diapers={diapers}
            onAddDiaper={addDiaper}
            onUpdateDiaper={updateDiaper}
            onDeleteDiaper={deleteDiaper}
            onBack={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'sleep' && (
          <SleepTab
            sleeps={sleeps}
            nowMs={sleepNowMs}
            onAddSleep={addSleep}
            onUpdateSleep={updateSleep}
            onDeleteSleep={deleteSleep}
            onMinimize={() => {
              setSleepBubbleMinimized(true);
              setActiveTab('dashboard');
            }}
            onBack={() => setActiveTab('dashboard')}
          />
        )}
        {activeTab === 'vaccine' && (
          <VaccineTab
            settings={settings}
            vaccines={vaccines}
            onUpdateVaccine={updateVaccine}
            onBack={() => setActiveTab('dashboard')}
          />
        )}
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
            diapers={diapers}
            onImportDiapers={(items) => {
              setDiapers(items);
              if (syncPin) updateRoomDiapers(syncPin, items).catch(console.error);
            }}
            sleeps={sleeps}
            onImportSleeps={(items) => {
              setSleeps(items);
              if (syncPin) updateRoomSleeps(syncPin, items).catch(console.error);
            }}
            vaccines={vaccines}
            onImportVaccines={(items) => {
              setVaccines(items);
              if (syncPin) updateRoomVaccines(syncPin, items).catch(console.error);
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

      {activeSleep && sleepBubbleMinimized && (
        <SleepFloatingBubble
          sleep={activeSleep}
          nowMs={sleepNowMs}
          onOpen={() => {
            setSleepBubbleMinimized(false);
            setActiveTab('sleep');
          }}
        />
      )}

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
