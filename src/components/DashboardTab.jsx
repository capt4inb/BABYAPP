import { useState, useMemo } from 'react';
import { Droplets, Clock, TrendingUp, AlertCircle, Activity, BellRing, ChevronRight } from 'lucide-react';
import { downloadICS } from '../utils/ics';
import { openAppleShortcutAlarm } from '../utils/shortcuts';
import ShortcutGuideModal from './ShortcutGuideModal';
import { getBabyWeekAge, getWonderWeekStatus } from '../data/wonderWeeks';
import { getWHOMedianWeight, evaluateWeight, getMonthsBetween } from '../data/whoWeight';
import { getMilkSummary, getThawRecommendation, getAvgDailyMl } from '../utils/milkUtils';

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
  if (diffMs <= 0) return { label: 'Đã đến giờ!', overdue: true };
  
  const hrs = next.getHours().toString().padStart(2, '0');
  const mins = next.getMinutes().toString().padStart(2, '0');
  return { label: `${hrs}:${mins}`, overdue: false, nextDate: next };
}

export default function DashboardTab({ records, settings, onOpenFeedModal, onOpenWeightModal, milkBags = [], onNavigateToMilk }) {
  const { babyName, babyBirthDate, babyDueDate, feedIntervalHours, babyGender } = settings;
  const [showShortcutGuide, setShowShortcutGuide] = useState(false);

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

  const nextFeed = timeUntilNext(lastFeed?.timestamp, feedIntervalHours);

  // Recent 4 records for timeline
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
  const hasMilkData = milkBags.some(b => b.storage_status !== 'used' && b.storage_status !== 'expired');

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Xin chào! 👋
            </p>
            <h1 style={{ margin: '2px 0 0', fontSize: 26, fontWeight: 800, color: 'var(--color-text)' }}>
              {babyName || 'Bé Yêu'}
            </h1>
            {weekAge !== null && (
              <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                Tuần tuổi: <strong style={{ color: 'var(--color-primary)' }}>{weekAge}</strong>
              </p>
            )}
          </div>
          {/* Wonder week badge */}
          {wwStatus && wwStatus.status !== 'no_data' && (
            <div
              className={`status-pill ${wwStatus.status === 'stormy' ? 'stormy' : 'sunny'}`}
              style={{ marginTop: 4 }}
            >
              <span>{wwStatus.status === 'stormy' ? '⛈️' : '☀️'}</span>
              {wwStatus.status === 'stormy' ? 'Tuần Storm' : 'Ổn định'}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '16px 16px 0' }}>
        <button
          id="btn-log-feed"
          className="btn btn-primary"
          onClick={() => onOpenFeedModal()}
          style={{ flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-md)', flexDirection: 'column', gap: 6, height: 'auto' }}
        >
          <Droplets size={26} />
          <span style={{ fontSize: 15 }}>Ghi cữ bú</span>
          {nextFeed && (
            <span style={{
              fontSize: 11, fontWeight: 700, opacity: 0.9,
              background: nextFeed.overdue ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.2)',
              padding: '2px 8px', borderRadius: 99,
            }}>
              {nextFeed.overdue ? '⚠️ ' : '⏰ '}{nextFeed.label}
            </span>
          )}
        </button>

        <button
          className="btn"
          onClick={() => onOpenWeightModal()}
          style={{ flex: 1, padding: '16px 12px', borderRadius: 'var(--radius-md)', flexDirection: 'column', gap: 6, height: 'auto', background: 'linear-gradient(135deg,#4FACFE,#00F2FE)', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          <span style={{ fontSize: 26, lineHeight: 1 }}>⚖️</span>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Ghi cân nặng</span>
          {lastWeight && (
            <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>
              Gần nhất: {lastWeight.weight} kg
            </span>
          )}
        </button>
      </div>

      {/* Alarm Action */}
      {nextFeed && !nextFeed.overdue && nextFeed.nextDate && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (localStorage.getItem('shortcut_guide_seen')) {
                openAppleShortcutAlarm(nextFeed.label);
              } else {
                setShowShortcutGuide(true);
              }
            }}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: 'var(--radius-md)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 8,
              background: 'linear-gradient(135deg, #FF9500, #FFCC00)',
              border: 'none',
              color: 'white',
              fontWeight: 700,
              fontSize: 15,
              boxShadow: '0 4px 12px rgba(255, 149, 0, 0.25)'
            }}
          >
            <BellRing size={18} />
            Báo thức Đồng hồ lúc {nextFeed.label}
          </button>
        </div>
      )}

      {/* Shortcut Guide Modal */}
      {showShortcutGuide && (
        <ShortcutGuideModal
          onClose={() => setShowShortcutGuide(false)}
          onConfirm={() => {
            localStorage.setItem('shortcut_guide_seen', 'true');
            setShowShortcutGuide(false);
            openAppleShortcutAlarm(nextFeed.label);
          }}
        />
      )}

      {/* Today's Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: lastWeight ? '1fr 1fr' : '1fr', gap: 12, padding: '12px 16px 0' }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Droplets size={16} color="var(--color-primary)" />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Hôm nay bú
            </span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
            {todayFeeds.length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
            cữ{todayFeedVol > 0 ? ` · ${todayFeedVol} ml` : ''}
          </div>
          {lastFeed && (
            <div style={{ fontSize: 11, color: 'var(--color-text-light)', marginTop: 6 }}>
              🕐 {timeSince(lastFeed.timestamp)}
            </div>
          )}
        </div>

        {lastWeight && weightEval && (
          <div className="card" style={{ padding: 16, background: weightEval.status === 'normal' ? 'var(--color-surface)' : 'rgba(255, 107, 107, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Activity size={16} color="var(--color-text)" />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Chuẩn WHO
              </span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--color-text)', lineHeight: 1 }}>
              {lastWeight.weight} <span style={{ fontSize: 14 }}>kg</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              Lúc {weightEval.months} tháng tuổi
            </div>
            <div style={{ 
              fontSize: 11, marginTop: 6, fontWeight: 700, 
              color: weightEval.status === 'normal' ? '#2ECC71' : 'var(--color-danger)'
            }}>
              {weightEval.label} (Chuẩn: {weightEval.median}kg)
            </div>
          </div>
        )}
      </div>

      {/* Milk Storage Widget */}
      {(hasMilkData || onNavigateToMilk) && (
        <div style={{ padding: '12px 16px 0' }}>
          <button
            id="btn-milk-widget"
            onClick={onNavigateToMilk}
            style={{
              width: '100%', textAlign: 'left', background: 'none',
              border: 'none', padding: 0, cursor: 'pointer',
            }}
          >
            <div className="card" style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #EEF2FF, #F5F0FF)',
              border: '1.5px solid #667EEA30',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>🍼</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#667EEA' }}>Kho sữa mẹ</span>
                  {milkSummary.totalMl > 0 && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700,
                      background: '#667EEA', color: 'white',
                    }}>
                      {milkSummary.totalMl}ml
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#667EEA' }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Xem kho</span>
                  <ChevronRight size={14} />
                </div>
              </div>

              {hasMilkData ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {milkSummary.urgentBags?.length > 0 && (
                    <div style={{ fontSize: 12, color: '#FF6B6B', fontWeight: 700 }}>
                      🔴 {milkSummary.urgentBags.length} bịch cần dùng ngay!
                    </div>
                  )}
                  {milkSummary.expiringSoonCount > 0 && (
                    <div style={{ fontSize: 12, color: '#FF9A5C', fontWeight: 600 }}>
                      ⚠️ Sắp hết hạn: {milkSummary.expiringSoonCount} bịch
                    </div>
                  )}
                  {thawRec && (
                    <div style={{ fontSize: 12, color: '#667EEA', fontWeight: 600 }}>
                      💧 Nên rã đông {thawRec.toThaw.length} bịch tối nay (~{thawRec.neededMl}ml còn thiếu)
                    </div>
                  )}
                  {!milkSummary.urgentBags?.length && !milkSummary.expiringSoonCount && !thawRec && (
                    <div style={{ fontSize: 12, color: '#00C9A7', fontWeight: 600 }}>
                      ✅ Kho sữa ổn định · {milkSummary.activeBagCount} bịch sẵn dùng
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                  Chưa có dữ liệu · Thêm bịch sữa đầu tiên →
                </div>
              )}
            </div>
          </button>
        </div>
      )}

      {/* Wonder Week Banner */}
      {wwStatus?.currentLeap && (
        <div
          className="hero-card"
          style={{
            background: `linear-gradient(135deg, ${wwStatus.currentLeap.color}CC, ${wwStatus.currentLeap.color}88)`,
            marginTop: 12,
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
        <div style={{ padding: '20px 16px 8px' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Hoạt động gần đây
          </h3>
          <div className="card">
            {recent.map((r, i) => (
              <div key={r.id} className="timeline-item" style={{ borderBottom: i < recent.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                <div
                  className="timeline-dot"
                  style={{ background: 'var(--color-primary)' }}
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
    </div>
  );
}
