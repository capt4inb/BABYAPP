import { useMemo } from 'react';
import { Droplets, Zap, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { getBabyWeekAge, getWonderWeekStatus } from '../data/wonderWeeks';

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
  return { label: `${hrs}:${mins}`, overdue: false };
}

export default function DashboardTab({ records, settings, onOpenFeedModal }) {
  const { babyName, babyBirthDate, babyDueDate, feedIntervalHours } = settings;

  // Last records
  const lastFeed = useMemo(() => records.find(r => r.type === 'feed'), [records]);

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, padding: '16px 16px 0' }}>
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
      </div>

      {/* Today's Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, padding: '12px 16px 0' }}>
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
      </div>

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
                      🍼 Bú {r.side === 'left' ? 'bên trái' : r.side === 'right' ? 'bên phải' : r.side === 'bottle' ? 'bình' : 'hai bên'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-text-light)', whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {timeSince(r.timestamp)}
                    </span>
                  </div>
                  {r.volume && (
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {r.volume} ml
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
