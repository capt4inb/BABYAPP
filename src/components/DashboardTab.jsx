import { useState, useMemo } from 'react';
import { Droplets, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { getBabyWeekAge, getWonderWeekStatus } from '../data/wonderWeeks';
import { getWHOMedianWeight, evaluateWeight, getMonthsBetween } from '../data/whoWeight';
import { getMilkSummary, getThawRecommendation, getAvgDailyMl, transitionBag } from '../utils/milkUtils';
import AddMilkBagModal from './AddMilkBagModal';

function timeSince(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} phút trước`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} giờ trước`;
  return `${Math.floor(hrs / 24)} ngày trước`;
}

function timeUntilNext(lastIso, intervalHours) {
  if (!lastIso) return null;
  const next = new Date(new Date(lastIso).getTime() + intervalHours * 3600000);
  const diffMs = next - Date.now();

  const hrs = next.getHours().toString().padStart(2, '0');
  const mins = next.getMinutes().toString().padStart(2, '0');

  if (diffMs <= 0) {
    return { label: `${hrs}:${mins}`, overdue: true, countdownLabel: 'Đã đến giờ bú!' };
  }

  const diffMins = Math.floor(diffMs / 60000);
  const countdownLabel = diffMins < 60
    ? `sau ${diffMins} phút`
    : `sau ${Math.floor(diffMins / 60)} giờ ${diffMins % 60} phút`;

  return { label: `${hrs}:${mins}`, overdue: false, nextDate: next, countdownLabel };
}

export default function DashboardTab({
  records,
  settings,
  onOpenFeedModal,
  milkBags = [],
  onAddMilkBag,
  onUpdateMilkBag,
  onNavigateToMilk,
  memos = [],
  onAddMemo,
  onDeleteMemo
}) {
  const { babyName, babyBirthDate, babyDueDate, feedIntervalHours, babyGender } = settings;
  const [showAddMilkBag, setShowAddMilkBag] = useState(false);

  // Notes state
  const [isWritingMemo, setIsWritingMemo] = useState(false);
  const [memoContent, setMemoContent] = useState('');
  const [memoAuthor, setMemoAuthor] = useState('Mẹ');
  const [customAuthor, setCustomAuthor] = useState('');
  const [showCustomAuthor, setShowCustomAuthor] = useState(false);

  const handleSaveMemo = (e) => {
    e.preventDefault();
    if (!memoContent.trim()) return;
    const finalAuthor = showCustomAuthor ? (customAuthor.trim() || 'Người thân') : memoAuthor;
    onAddMemo({
      id: crypto.randomUUID(),
      content: memoContent.trim(),
      author: finalAuthor,
      createdAt: new Date().toISOString()
    });
    setMemoContent('');
    setIsWritingMemo(false);
    setCustomAuthor('');
    setShowCustomAuthor(false);
  };

  const AUTHOR_MAP = {
    'Mẹ': { emoji: '👩', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', text: '#FF6B9D' },
    'Bố': { emoji: '👨', color: '#0070F3', bg: 'rgba(0, 112, 243, 0.08)', text: '#0070F3' },
    'Bà': { emoji: 'Bà', color: 'var(--color-pump)', bg: 'var(--color-pump-bg)', text: 'var(--color-pump)' },
    'Ông': { emoji: 'Ông', color: 'var(--color-wonder)', bg: 'var(--color-wonder-bg)', text: 'var(--color-wonder)' },
  };

  // Convert text initials or emojis for display
  const getAuthorMeta = (author) => {
    const defaultMeta = { emoji: author.slice(0, 2), color: 'var(--color-text-muted)', bg: 'var(--color-surface-alt)', text: 'var(--color-text)' };
    if (author === 'Mẹ') return { emoji: '👩', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', text: '#FF6B9D' };
    if (author === 'Bố') return { emoji: '👨', color: '#0070F3', bg: 'rgba(0, 112, 243, 0.08)', text: '#0070F3' };
    if (author === 'Bà') return { emoji: '👵', color: 'var(--color-pump)', bg: 'var(--color-pump-bg)', text: 'var(--color-pump)' };
    if (author === 'Ông') return { emoji: '👴', color: 'var(--color-wonder)', bg: 'var(--color-wonder-bg)', text: 'var(--color-wonder)' };
    return defaultMeta;
  };

  // Last records
  const lastFeed = useMemo(() => records.find(r => r.type === 'feed'), [records]);
  const lastWeight = useMemo(() => records.find(r => r.type === 'weight'), [records]);

  // Today counts
  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d;
  }, []);

  const todayFeeds = useMemo(() =>
    records.filter(r => r.type === 'feed' && new Date(r.timestamp) >= todayStart),
    [records, todayStart]
  );
  const todayFeedVol = todayFeeds.reduce((s, r) => s + (r.volume || 0), 0);

  // Wonder weeks
  const weekAge = babyBirthDate
    ? getBabyWeekAge(babyBirthDate, babyDueDate || null)
    : null;
  const wwStatus = weekAge !== null ? getWonderWeekStatus(weekAge) : null;

  const ageInfo = useMemo(() => {
    if (!babyBirthDate) return null;
    const birth = new Date(babyBirthDate);
    const today = new Date();
    birth.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today - birth;
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (totalDays < 0) {
      return { totalDays: 0, weeks: 0, days: 0 };
    }

    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    return { totalDays, weeks, days: remainingDays };
  }, [babyBirthDate]);

  const nextFeed = timeUntilNext(lastFeed?.timestamp, feedIntervalHours);

  // Recent 5 records for timeline
  const recent = records.slice(0, 5);

  // Weight evaluation
  let weightEval = null;
  if (lastWeight && babyBirthDate) {
    const months = getMonthsBetween(babyBirthDate, lastWeight.timestamp);
    if (months !== null) {
      const median = getWHOMedianWeight(babyGender || 'boy', months);
      weightEval = { months, median, ...evaluateWeight(lastWeight.weight, median) };
    }
  }

  // Milk storage summary
  const milkSummary = useMemo(() => getMilkSummary(milkBags), [milkBags]);
  const avgDailyMl = useMemo(() => getAvgDailyMl(records, 7), [records]);
  const thawRec = useMemo(() => getThawRecommendation(milkBags, avgDailyMl), [milkBags, avgDailyMl]);

  // Active bags breakdown for UI representation
  const activeBags = useMemo(() => {
    return milkBags.filter(b => b.storage_status !== 'used' && b.storage_status !== 'expired');
  }, [milkBags]);

  const fridgeBags = useMemo(() => activeBags.filter(b => b.storage_status === 'fridge' || (b.storage_status === 'using' && b.previous_status === 'fridge')), [activeBags]);
  const fridgeMl = fridgeBags.reduce((s, b) => s + (b.volume_ml || 0), 0);

  const freezerBags = useMemo(() => activeBags.filter(b => b.storage_status === 'freezer' || (b.storage_status === 'using' && b.previous_status === 'freezer')), [activeBags]);
  const freezerMl = freezerBags.reduce((s, b) => s + (b.volume_ml || 0), 0);

  const thawedBags = useMemo(() => activeBags.filter(b =>
    ['thawing', 'thawed', 'warmed'].includes(b.storage_status) ||
    (b.storage_status === 'using' && ['thawing', 'thawed', 'warmed'].includes(b.previous_status))
  ), [activeBags]);
  const thawedMl = thawedBags.reduce((s, b) => s + (b.volume_ml || 0), 0);

  const handleThawBags = () => {
    if (!thawRec?.toThaw || !onUpdateMilkBag) return;
    thawRec.toThaw.forEach(bag => {
      const updated = transitionBag(bag, 'thawing');
      onUpdateMilkBag(bag.id, updated);
    });
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 24 }}>
      {/* Header */}
      <div className="page-header" style={{ borderBottom: '1px solid var(--color-border)', padding: '24px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Nhật ký của bé 🍼
            </p>
            <h1 style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 800, color: 'var(--color-text)' }}>
              {babyName || 'Bé Yêu'}
            </h1>
            {ageInfo && (
              <div style={{ margin: '8px 0 0', display: 'flex', flexWrap: 'wrap', gap: '8px 12px', alignItems: 'center' }}>
                <span style={{ fontSize: 13, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: 99, fontWeight: 700 }}>
                  👶 {ageInfo.totalDays} ngày tuổi
                </span>
                <span style={{ fontSize: 13, background: 'var(--color-surface-alt)', color: 'var(--color-text)', padding: '4px 10px', borderRadius: 99, fontWeight: 600 }}>
                  🗓️ {ageInfo.weeks} tuần {ageInfo.days} ngày
                </span>
                {lastWeight && weightEval && (
                  <span style={{ fontSize: 13, background: 'linear-gradient(135deg, rgba(79, 172, 254, 0.1), rgba(0, 242, 254, 0.1))', color: '#0070F3', padding: '4px 10px', borderRadius: 99, fontWeight: 600 }}>
                    ⚖️ {lastWeight.weight} kg ({weightEval.status === 'normal' ? 'Chuẩn' : weightEval.label})
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Wonder week badge */}
          {wwStatus && wwStatus.status !== 'no_data' && (
            <div
              className={`status-pill ${wwStatus.status === 'stormy' ? 'stormy' : 'sunny'}`}
              style={{ marginTop: 4, padding: '6px 12px', borderRadius: 'var(--radius-full)', fontWeight: 800 }}
            >
              <span>{wwStatus.status === 'stormy' ? '⛈️' : '☀️'}</span>
              {wwStatus.status === 'stormy' ? 'Tuần Storm' : 'Ổn định'}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '20px 16px 0' }}>
        <button
          id="btn-log-feed"
          className="btn"
          onClick={() => onOpenFeedModal()}
          style={{
            flex: 1,
            padding: '20px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--color-primary), #FF8CB6)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(255, 107, 157, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 'auto',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Droplets size={26} color="white" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Ghi cữ bú</span>
          {nextFeed && (
            <span style={{
              fontSize: 11, fontWeight: 700,
              background: nextFeed.overdue ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255,255,255,0.25)',
              color: 'white',
              padding: '3px 10px', borderRadius: 99,
            }}>
              {nextFeed.overdue ? '⚠️ Đến giờ!' : `⏰ ${nextFeed.label}`}
            </span>
          )}
        </button>

        <button
          id="btn-quick-add-milk"
          className="btn"
          onClick={() => setShowAddMilkBag(true)}
          style={{
            flex: 1,
            padding: '20px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4FACFE, #9B59B6)',
            color: 'white',
            boxShadow: '0 6px 20px rgba(79, 172, 254, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            height: 'auto',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <div style={{ background: 'rgba(255,255,255,0.2)', padding: 10, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={26} color="white" />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Thêm bịch sữa</span>
          <span style={{
            fontSize: 11, fontWeight: 700,
            background: 'rgba(255,255,255,0.25)',
            color: 'white',
            padding: '3px 10px', borderRadius: 99,
          }}>
            🍼 Kho: {milkSummary.totalMl}ml
          </span>
        </button>
      </div>

      {/* Main Info Cards */}
      <div style={{ padding: '16px 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* 1. Feeding Session Card */}
        <div className="card" style={{ padding: 20, borderLeft: '5px solid var(--color-primary)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>🍼</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Chi tiết cữ bú
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', padding: '4px 10px', borderRadius: 8 }}>
              Hôm nay
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Số cữ bú</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', marginTop: 4 }}>
                {todayFeeds.length} <span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 600 }}>cữ</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Tổng lượng bú</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', marginTop: 4 }}>
                {todayFeedVol} <span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 600 }}>ml</span>
              </div>
            </div>
          </div>

          {/* Last Feed Info */}
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 6 }}>Cữ bú gần nhất:</div>
            {lastFeed ? (
              <div style={{ background: 'var(--color-surface-alt)', borderRadius: 12, padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                    {lastFeed.side === 'left' ? '◀️ Bú ngực Trái' : lastFeed.side === 'right' ? '▶️ Bú ngực Phải' : lastFeed.side === 'bottle' ? '🍼 Bú Bình' : '↔️ Bú Hai Bên'}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {timeSince(lastFeed.timestamp)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--color-text-muted)' }}>
                  <span>Thời gian: {new Date(lastFeed.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                  {lastFeed.volume && <strong style={{ color: 'var(--color-primary)' }}>{lastFeed.volume} ml</strong>}
                </div>
                {lastFeed.note && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 4, borderTop: '1px dashed var(--color-border)', paddingTop: 4 }}>
                    "{lastFeed.note}"
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Chưa có cữ bú nào được ghi chép.</div>
            )}
          </div>

          {/* Next Feed Banner */}
          {nextFeed && (
            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 12,
              background: nextFeed.overdue ? 'rgba(255, 107, 107, 0.08)' : 'rgba(255, 154, 92, 0.08)',
              border: `1.5px solid ${nextFeed.overdue ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 154, 92, 0.2)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}>
              <span style={{ fontSize: 18 }}>{nextFeed.overdue ? '⚠️' : '⏰'}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: nextFeed.overdue ? 'var(--color-danger)' : 'var(--color-pump)' }}>
                  {nextFeed.overdue ? 'Đã đến giờ bú!' : 'Thời gian cữ bú tiếp theo'}
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)', marginTop: 2 }}>
                  Dự kiến lúc <span style={{ color: nextFeed.overdue ? 'var(--color-danger)' : 'var(--color-primary)' }}>{nextFeed.label}</span> {nextFeed.countdownLabel ? `(${nextFeed.countdownLabel})` : ''}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Milk Storage Card */}
        <div className="card" style={{ padding: 20, borderLeft: '5px solid #667EEA', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>❄️</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: '#667EEA', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Quản lý kho sữa
              </span>
            </div>
            <button
              onClick={onNavigateToMilk}
              style={{
                background: 'none', border: 'none', color: '#667EEA', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 2, cursor: 'pointer', padding: 0
              }}
            >
              Chi tiết <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '12px 0', borderBottom: '1px solid var(--color-border)' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Tổng dung tích kho</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#667EEA', marginTop: 4 }}>
                {milkSummary.totalMl} <span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 600 }}>ml</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>Tổng số bịch sữa</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', marginTop: 4 }}>
                {milkSummary.activeBagCount} <span style={{ fontSize: 15, color: 'var(--color-text-muted)', fontWeight: 600 }}>bịch</span>
              </div>
            </div>
          </div>

          {/* Location breakdown */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8 }}>Vị trí lưu trữ:</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 90, background: '#F0F8FF', border: '1px solid #A8D8FE', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>❄️</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#4FACFE', display: 'block' }}>Ngăn mát</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{fridgeMl} ml ({fridgeBags.length} b)</span>
              </div>
              <div style={{ flex: 1, minWidth: 90, background: '#FBF5FF', border: '1px solid #D7BDE2', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>🧊</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#9B59B6', display: 'block' }}>Ngăn đông</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{freezerMl} ml ({freezerBags.length} b)</span>
              </div>
              <div style={{ flex: 1, minWidth: 90, background: '#F0FDFC', border: '1px solid #A8E6E2', borderRadius: 12, padding: '8px 10px', textAlign: 'center' }}>
                <span style={{ fontSize: 16, display: 'block', marginBottom: 2 }}>💧</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#00C9A7', display: 'block' }}>Đã rã/Dùng</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{thawedMl} ml ({thawedBags.length} b)</span>
              </div>
            </div>
          </div>

          {/* Expiry alerts */}
          {(milkSummary.urgentBags?.length > 0 || milkSummary.expiringSoonCount > 0) && (
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {milkSummary.urgentBags?.length > 0 && (
                <div style={{ background: '#FFF5F5', border: '1px solid #FFB3B3', borderRadius: 12, padding: '8px 12px', fontSize: 12, color: 'var(--color-danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🔴</span> {milkSummary.urgentBags.length} bịch sữa cần dùng ngay!
                </div>
              )}
              {milkSummary.expiringSoonCount > 0 && (
                <div style={{ background: '#FFF7F2', border: '1px solid #FFCBA4', borderRadius: 12, padding: '8px 12px', fontSize: 12, color: 'var(--color-pump)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>⚠️</span> Có {milkSummary.expiringSoonCount} bịch sắp hết hạn trong 24h
                </div>
              )}
            </div>
          )}

          {/* Thaw Recommendation inline */}
          {thawRec && (
            <div style={{
              marginTop: 14,
              padding: '12px 14px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.08))',
              border: '1.5px solid rgba(102, 126, 234, 0.2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#5B4FCF' }}>
                    Gợi ý rã đông tối nay
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, lineHeight: 1.4 }}>
                    Bé cần ~{thawRec.avgDailyMl}ml/ngày. Nên rã đông thêm <strong style={{ color: 'var(--color-pump)' }}>~{thawRec.neededMl}ml</strong> ({thawRec.toThaw.length} bịch):
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                    {thawRec.toThaw.map((bag) => (
                      <div key={bag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', border: '1px solid rgba(102, 126, 234, 0.1)', borderRadius: 8, padding: '6px 10px', fontSize: 11 }}>
                        <span style={{ fontWeight: 700, color: '#5B4FCF' }}>🧊 {bag.volume_ml}ml</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>Hút: {new Date(bag.expressed_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleThawBags}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif',
                      boxShadow: '0 4px 10px rgba(102, 126, 234, 0.2)'
                    }}
                  >
                    Rã đông {thawRec.toThaw.length} bịch này
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Family Notes Card */}
        <div className="card" style={{ padding: 20, borderLeft: '5px solid var(--color-pump)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 20 }}>📌</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-pump)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Ghi chú gia đình
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, background: 'var(--color-pump-bg)', color: 'var(--color-pump)', padding: '4px 10px', borderRadius: 8 }}>
              {memos.length} ghi chú
            </span>
          </div>

          {/* Notes list */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            marginTop: memos.length > 0 ? 8 : 0,
            maxHeight: 280,
            overflowY: 'auto',
            paddingRight: 4
          }}>
            {memos.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: 13 }}>
                Chưa có ghi chú nào. Hãy để lại lời nhắn cho cả nhà! 📝
              </div>
            ) : (
              memos.map(memo => {
                const meta = getAuthorMeta(memo.author);
                return (
                  <div key={memo.id} style={{
                    display: 'flex', gap: 12, padding: 12, borderRadius: 14,
                    background: 'var(--color-surface-alt)', border: '1px solid var(--color-border)',
                    alignItems: 'flex-start', position: 'relative'
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: meta.bg,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0
                    }}>
                      {meta.emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: meta.text }}>
                          {memo.author}
                        </span>
                        <span style={{ fontSize: 10, color: 'var(--color-text-light)', fontWeight: 600 }}>
                          {timeSince(memo.createdAt)}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text)', lineHeight: 1.4, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                        {memo.content}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeleteMemo(memo.id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--color-text-light)',
                        cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: 6, transition: 'all 0.2s', flexShrink: 0, marginLeft: 4
                      }}
                      title="Xoá ghi chú"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Add Note Section */}
          <div style={{ marginTop: 14, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
            {!isWritingMemo ? (
              <button
                onClick={() => setIsWritingMemo(true)}
                style={{
                  width: '100%', padding: '10px 14px', borderRadius: 12, border: '1px dashed var(--color-primary-light)',
                  background: 'var(--color-primary-bg)', color: 'var(--color-primary)', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontFamily: 'Outfit, sans-serif'
                }}
              >
                <Plus size={16} /> Để lại ghi chú mới...
              </button>
            ) : (
              <form onSubmit={handleSaveMemo} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  className="form-input"
                  placeholder="Nhập ghi chú (ví dụ: Bé đã bú xong, Bé đang ngủ, cần mua tã...)"
                  value={memoContent}
                  onChange={e => setMemoContent(e.target.value)}
                  rows={2}
                  required
                  style={{ resize: 'none', padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', borderRadius: 12 }}
                />

                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                    Người viết ghi chú:
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['Mèo', 'Gốu', 'Má chôu', 'Be'].map(author => {
                      const isSelected = memoAuthor === author && !showCustomAuthor;
                      const meta = getAuthorMeta(author);
                      return (
                        <button
                          key={author}
                          type="button"
                          onClick={() => {
                            setMemoAuthor(author);
                            setShowCustomAuthor(false);
                          }}
                          style={{
                            padding: '6px 12px', borderRadius: 20, border: `1.5px solid ${isSelected ? meta.text : 'var(--color-border)'}`,
                            background: isSelected ? meta.bg : 'var(--color-surface)',
                            color: isSelected ? meta.text : 'var(--color-text-muted)',
                            fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                            transition: 'all 0.2s', fontFamily: 'inherit'
                          }}
                        >
                          <span>{meta.emoji}</span> {author}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setShowCustomAuthor(true)}
                      style={{
                        padding: '6px 12px', borderRadius: 20,
                        border: `1.5px solid ${showCustomAuthor ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: showCustomAuthor ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                        color: showCustomAuthor ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                        transition: 'all 0.2s', fontFamily: 'inherit'
                      }}
                    >
                      <span>👤</span> {showCustomAuthor ? 'Khác:' : 'Khác...'}
                    </button>
                  </div>

                  {showCustomAuthor && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Tên của bạn (ví dụ: Cô giúp việc, Ông nội...)"
                      value={customAuthor}
                      onChange={e => setCustomAuthor(e.target.value)}
                      required
                      style={{ marginTop: 8, padding: '6px 10px', fontSize: 12, borderRadius: 8 }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setIsWritingMemo(false);
                      setMemoContent('');
                      setShowCustomAuthor(false);
                      setCustomAuthor('');
                    }}
                    style={{ padding: '8px 14px', fontSize: 12, height: 'auto', borderRadius: 10 }}
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ padding: '8px 16px', fontSize: 12, height: 'auto', borderRadius: 10, background: 'linear-gradient(135deg, var(--color-primary), #FF8CB6)', border: 'none' }}
                  >
                    Lưu ghi chú
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

      </div>

      {/* Wonder Week Banner */}
      {wwStatus?.currentLeap && (
        <div
          className="hero-card"
          style={{
            background: `linear-gradient(135deg, ${wwStatus.currentLeap.color}CC, ${wwStatus.currentLeap.color}88)`,
            marginTop: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{ fontSize: 28 }}>{wwStatus.currentLeap.emoji}</span>
            <div>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⛈️ Tuần nhảy vọt #{wwStatus.currentLeap.leap}
              </p>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: 'white' }}>
                {wwStatus.currentLeap.nameVi}
              </h3>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
            {wwStatus.currentLeap.description.slice(0, 120)}...
          </p>
        </div>
      )}

      {/* Recent Timeline */}
      {recent.length > 0 && (
        <div style={{ padding: '24px 16px 8px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hoạt động gần đây
          </h3>
          <div className="card">
            {recent.map((r, i) => (
              <div key={r.id} className="timeline-item" style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--color-border)' : 'none', padding: '14px 16px' }}>
                <div
                  className="timeline-dot"
                  style={{ background: r.type === 'feed' ? 'var(--color-primary)' : '#0070F3' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                      {r.type === 'feed' ? `🍼 Bú ${r.side === 'left' ? 'bên trái' : r.side === 'right' ? 'bên phải' : r.side === 'bottle' ? 'bình' : 'hai bên'}` : `⚖️ Cân nặng`}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-light)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {timeSince(r.timestamp)}
                    </span>
                  </div>
                  {r.type === 'feed' && r.volume && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {r.volume} ml
                    </div>
                  )}
                  {r.type === 'weight' && r.weight && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {r.weight} kg
                    </div>
                  )}
                  {r.note && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, fontStyle: 'italic' }}>
                      "{r.note}"
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {records.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🍼</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>
            Bắt đầu ghi chép!
          </h3>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
            Nhấn "Ghi cữ bú" ở trên để bắt đầu theo dõi.
          </p>
        </div>
      )}

      {/* Add Milk Bag Modal */}
      {showAddMilkBag && (
        <AddMilkBagModal
          onSave={(bag) => {
            onAddMilkBag(bag);
            setShowAddMilkBag(false);
          }}
          onClose={() => setShowAddMilkBag(false)}
        />
      )}
    </div>
  );
}
