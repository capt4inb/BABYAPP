import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardTab from './components/DashboardTab';
import FeedTab from './components/FeedTab';
import StatsTab from './components/StatsTab';
import WonderWeeksTab from './components/WonderWeeksTab';
import SettingsTab from './components/SettingsTab';
import MilkStorageTab from './components/MilkStorageTab';
import { DiaperTab, SleepTab } from './components/CareTabs';
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
import {
  formatLiveDuration,
  generateVaccineSchedule,
  getBabyAgeWeeks,
  getDurationMinutes,
  getWakeWindowForAge,
} from './utils/careUtils';

// ── localStorage keys ─────────────────────────────────────────
const STORAGE_KEYS = {
  RECORDS: 'bmt_records',
  SETTINGS: 'bmt_settings',
  MILK_BAGS: 'bmt_milk_bags',
  MEMOS: 'bmt_memos',
  DIAPERS: 'bmt_diapers',
  SLEEPS: 'bmt_sleeps',
  VACCINES: 'bmt_vaccines',
  SLEEP_BUBBLE: 'bmt_sleep_bubble_position',
};

const DEFAULT_SETTINGS = {
  babyName: 'Bé Yêu',
  babyGender: 'boy', // 'boy' | 'girl'
  babyBirthDate: '', // YYYY-MM-DD
  babyDueDate: '', // YYYY-MM-DD, 40-week estimated due date
  feedIntervalHours: 3,
  volumeUnit: 'ml',
};

// ── Tab config ────────────────────────────────────────────────
const TABS = [
  { id: 'dashboard', label: 'Trang chủ', icon: 'home', tone: 'pink' },
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
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

const TIMER_BUBBLE_SIZE = 112;

function formatCompactMinutes(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}p`;
  return minutes ? `${hours}h${minutes}` : `${hours}h`;
}

function SleepFloatingBubble({ mode, startAt, nowMs, wakeWindow, position, onPositionChange, onOpen }) {
  const dragRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [isDragging, setIsDragging] = useState(false);

  if (!startAt) return null;

  const isAwake = mode === 'awake';
  const awakeMinutes = isAwake
    ? getDurationMinutes(startAt, new Date(nowMs).toISOString())
    : 0;
  const isOverdue = Boolean(isAwake && wakeWindow && awakeMinutes > wakeWindow.maxMinutes);
  const bubbleStatus = isOverdue
    ? 'Cho bé ngủ ngay'
    : wakeWindow
      ? `Tối đa ${formatCompactMinutes(wakeWindow.maxMinutes)}`
      : 'Theo dõi giờ thức';
  const safeMargin = 8;
  const bubbleStyle = position && typeof window !== 'undefined'
    ? {
        left: clamp(position.x, safeMargin, window.innerWidth - TIMER_BUBBLE_SIZE - safeMargin),
        top: clamp(position.y, safeMargin, window.innerHeight - TIMER_BUBBLE_SIZE - safeMargin),
        right: 'auto',
        bottom: 'auto',
      }
    : undefined;

  const handlePointerDown = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originLeft: rect.left,
      originTop: rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) drag.moved = true;

    onPositionChange({
      x: clamp(drag.originLeft + dx, safeMargin, window.innerWidth - drag.width - safeMargin),
      y: clamp(drag.originTop + dy, safeMargin, window.innerHeight - drag.height - safeMargin),
    });
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      suppressClickRef.current = Boolean(drag.moved);
      dragRef.current = null;
    }
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setIsDragging(false);
  };

  const handleClick = (event) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onOpen();
  };

  return (
    <button
      className={`sleep-floating-bubble ${isAwake ? 'awake' : 'sleeping'} ${isOverdue ? 'overdue' : ''} animate-scale-in ${isDragging ? 'dragging' : ''}`}
      type="button"
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={bubbleStyle}
      aria-label={isAwake ? `Bé đang thức ${formatLiveDuration(startAt, nowMs)}` : `Bé đang ngủ ${formatLiveDuration(startAt, nowMs)}`}
    >
      <span className="sleep-floating-icon">
        <GameIcon name={isAwake ? 'sun' : 'moon'} size={42} variant="cream" bare />
      </span>
      <span>{isAwake ? 'Đang thức' : 'Thời gian ngủ'}</span>
      <strong>{formatLiveDuration(startAt, nowMs)}</strong>
      {isAwake && <small>{bubbleStatus}</small>}
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
  const [sleepBubblePosition, setSleepBubblePosition] = useState(() =>
    loadFromStorage(STORAGE_KEYS.SLEEP_BUBBLE, null)
  );
  
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
        setSleepNowMs(Date.now());
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

  useEffect(() => {
    if (sleepBubblePosition) saveToStorage(STORAGE_KEYS.SLEEP_BUBBLE, sleepBubblePosition);
  }, [sleepBubblePosition]);

  const activeSleep = sleeps.find(item => !item.endAt);
  const activeSleepId = activeSleep?.id || '';
  const latestCompletedSleep = [...sleeps]
    .filter(item => item.endAt && new Date(item.endAt).getTime() <= sleepNowMs)
    .sort((a, b) => new Date(b.endAt) - new Date(a.endAt))[0] || null;
  const awakeStartAt = activeSleep ? '' : latestCompletedSleep?.endAt || '';
  const babyAgeWeeks = getBabyAgeWeeks(settings.babyBirthDate, sleepNowMs);
  const wakeWindow = getWakeWindowForAge(settings.babyBirthDate, sleepNowMs);
  const awakeMinutes = awakeStartAt
    ? getDurationMinutes(awakeStartAt, new Date(sleepNowMs).toISOString())
    : 0;
  const wakeOverdue = Boolean(wakeWindow && awakeMinutes > wakeWindow.maxMinutes);
  const timerStartAt = activeSleep?.startAt || awakeStartAt;
  const timerStateId = activeSleepId || (awakeStartAt ? `awake-${awakeStartAt}` : '');

  useEffect(() => {
    if (!timerStateId || !sleepBubblePosition) return undefined;

    const normalizeBubblePosition = () => {
      const safeMargin = 8;
      setSleepBubblePosition(prev => {
        if (!prev) return prev;
        const next = {
          x: clamp(prev.x, safeMargin, window.innerWidth - TIMER_BUBBLE_SIZE - safeMargin),
          y: clamp(prev.y, safeMargin, window.innerHeight - TIMER_BUBBLE_SIZE - safeMargin),
        };

        return next.x === prev.x && next.y === prev.y ? prev : next;
      });
    };

    normalizeBubblePosition();
    window.addEventListener('resize', normalizeBubblePosition);
    return () => window.removeEventListener('resize', normalizeBubblePosition);
  }, [sleepBubblePosition, timerStateId]);

  useEffect(() => {
    if (!timerStartAt) return undefined;
    const intervalId = window.setInterval(() => setSleepNowMs(Date.now()), 1000);
    return () => window.clearInterval(intervalId);
  }, [timerStartAt]);

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
    if (updated.endAt) {
      setSleepNowMs(Date.now());
      setSleepBubbleMinimized(false);
    }
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
            onAddMilkBag={addMilkBag}
            onUpdateMilkBag={updateMilkBag}
            onOpenFeed={() => setActiveTab('feed')}
            onNavigateToMilk={() => setActiveTab('milk')}
            onNavigateToCare={setActiveTab}
            memos={memos}
            onAddMemo={addMemo}
            onDeleteMemo={deleteMemo}
          />
        )}
        {activeTab === 'feed' && (
          <FeedTab
            records={records}
            settings={settings}
            onOpenFeedModal={openFeedModal}
            onDeleteRecord={deleteRecord}
          />
        )}
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
            awakeStartAt={awakeStartAt}
            babyAgeWeeks={babyAgeWeeks}
            wakeWindow={wakeWindow}
            wakeOverdue={wakeOverdue}
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
        {activeTab === 'stats' && (
          <StatsTab
            records={records}
            sleeps={sleeps}
            settings={settings}
            onOpenWeightModal={openWeightModal}
          />
        )}
        {activeTab === 'wonder' && (
          <WonderWeeksTab
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onBack={() => setActiveTab('dashboard')}
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
        {TABS.slice(0, Math.ceil(TABS.length / 2)).map(({ id, label, icon, tone }) => (
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
        {TABS.slice(Math.ceil(TABS.length / 2)).map(({ id, label, icon, tone }) => (
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

      {timerStartAt && (!activeSleep || sleepBubbleMinimized || activeTab !== 'sleep') && (
        <SleepFloatingBubble
          mode={activeSleep ? 'sleep' : 'awake'}
          startAt={timerStartAt}
          nowMs={sleepNowMs}
          wakeWindow={activeSleep ? null : wakeWindow}
          position={sleepBubblePosition}
          onPositionChange={setSleepBubblePosition}
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
