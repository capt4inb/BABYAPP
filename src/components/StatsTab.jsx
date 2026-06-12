import { useMemo, useState } from 'react';
import { TrendingUp, Droplets, Zap, Calendar } from 'lucide-react';

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

function dayKey(date) {
  return date.toDateString();
}

function shortDayLabel(date) {
  return date.toLocaleDateString('vi-VN', { weekday: 'short' }).slice(0, 2);
}

export default function StatsTab({ records }) {
  const [period, setPeriod] = useState('7d'); // 7d | 30d

  const days7 = useMemo(() => getLast7Days(), []);

  const periodStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (period === '7d') d.setDate(d.getDate() - 6);
    else d.setDate(d.getDate() - 29);
    return d;
  }, [period]);

  const periodRecords = useMemo(() =>
    records.filter(r => new Date(r.timestamp) >= periodStart),
    [records, periodStart]
  );

  const feedRecords = useMemo(() => periodRecords.filter(r => r.type === 'feed'), [periodRecords]);

  // Per-day stats for bar chart (last 7)
  const dailyStats = useMemo(() => {
    return days7.map(day => {
      const key = dayKey(day);
      const dayFeeds = records.filter(r => r.type === 'feed' && new Date(r.timestamp).toDateString() === key);
      const feedVol = dayFeeds.reduce((s, r) => s + (r.volume || 0), 0);
      return { day, label: shortDayLabel(day), feedCount: dayFeeds.length, feedVol };
    });
  }, [days7, records]);

  const maxFeed = Math.max(...dailyStats.map(d => d.feedCount), 1);

  // Summary stats
  const totalFeedVol = feedRecords.reduce((s, r) => s + (r.volume || 0), 0);
  const avgFeedPerDay = (feedRecords.length / (period === '7d' ? 7 : 30)).toFixed(1);

  // Feed side distribution
  const sideStats = useMemo(() => {
    const counts = { left: 0, right: 0, both: 0, bottle: 0 };
    feedRecords.forEach(r => { if (r.side) counts[r.side] = (counts[r.side] || 0) + 1; });
    return counts;
  }, [feedRecords]);

  const sideLabels = { left: 'Bên trái', right: 'Bên phải', both: 'Hai bên', bottle: 'Bình sữa' };
  const sideEmoji = { left: '◀️', right: '▶️', both: '↔️', bottle: '🍼' };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800 }}>Thống kê</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: '7d', label: '7 ngày' },
            { value: '30d', label: '30 ngày' },
          ].map(p => (
            <button
              key={p.value}
              className={`tag tag-primary ${period === p.value ? 'active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '8px 16px 16px' }}>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 16 }}>
          {/* Feed summary */}
          <div className="card" style={{ padding: 16, background: 'var(--color-primary-bg)', borderColor: 'var(--color-primary-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Droplets size={15} color="var(--color-primary)" />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cữ bú
              </span>
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--color-primary)', lineHeight: 1 }}>
              {feedRecords.length}
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
              lần · TB {avgFeedPerDay}/ngày
            </div>
            {totalFeedVol > 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-primary)', marginTop: 4, fontWeight: 600 }}>
                {totalFeedVol} ml tổng cộng
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart - Last 7 days */}
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
            📊 7 ngày gần nhất
          </h3>

          {/* Feed bars */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', marginBottom: 8 }}>
              🍼 Cữ bú
            </div>
            <div className="bar-chart-container">
              {dailyStats.map((d, i) => (
                <div key={i} className="bar-wrap">
                  {d.feedCount > 0 && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-primary)' }}>
                      {d.feedCount}
                    </span>
                  )}
                  <div
                    className="bar"
                    style={{
                      height: `${(d.feedCount / maxFeed) * 80}%`,
                      background: d.feedCount > 0
                        ? 'linear-gradient(180deg, var(--color-primary), var(--color-primary-light))'
                        : 'var(--color-border)',
                      minHeight: 4,
                    }}
                  />
                  <div className="bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feed side distribution */}
        {feedRecords.length > 0 && (
          <div className="card" style={{ padding: 16, marginBottom: 16 }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
              🍼 Phân bổ cách bú
            </h3>
            {Object.entries(sideStats).filter(([, count]) => count > 0).map(([side, count]) => {
              const pct = Math.round((count / feedRecords.length) * 100);
              return (
                <div key={side} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
                    <span>{sideEmoji[side]} {sideLabels[side]}</span>
                    <span style={{ color: 'var(--color-text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                      borderRadius: 99,
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {periodRecords.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>
              Chưa có dữ liệu trong {period === '7d' ? '7 ngày' : '30 ngày'} qua
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
