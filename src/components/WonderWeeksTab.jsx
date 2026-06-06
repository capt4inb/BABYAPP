import { useMemo, useState } from 'react';
import { LEAPS, getBabyWeekAge, getWonderWeekStatus } from '../data/wonderWeeks';
import { ChevronDown, ChevronUp, CheckCircle, Cloud, Sun } from 'lucide-react';

function WeekTimeline({ weekAge }) {
  const maxWeek = 80;
  const pct = (weekAge / maxWeek) * 100;

  return (
    <div className="week-timeline" style={{ margin: '16px 0' }}>
      {/* Leap markers */}
      {LEAPS.map(leap => {
        const leapPct = (leap.week / maxWeek) * 100;
        const isInStorm = weekAge >= leap.stormStart && weekAge <= leap.stormEnd;
        return (
          <div
            key={leap.leap}
            className="week-leap-marker"
            style={{
              left: `${leapPct}%`,
              background: isInStorm ? leap.color : `${leap.color}66`,
              height: isInStorm ? 34 : 22,
            }}
            title={`Leap ${leap.leap}: ${leap.nameVi}`}
          />
        );
      })}

      {/* Current week marker */}
      {weekAge >= 0 && weekAge <= maxWeek && (
        <div
          className="week-current-marker"
          style={{ left: `${pct}%` }}
        />
      )}
    </div>
  );
}

export default function WonderWeeksTab({ settings }) {
  const { babyBirthDate, babyDueDate } = settings;
  const [expandedLeap, setExpandedLeap] = useState(null);
  const [activeSection, setActiveSection] = useState('skills'); // skills | symptoms

  const weekAge = babyBirthDate
    ? getBabyWeekAge(babyBirthDate, babyDueDate || null)
    : null;
  const wwStatus = weekAge !== null ? getWonderWeekStatus(weekAge) : null;

  if (!babyBirthDate) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Tuần Vàng</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '64px 32px' }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🌟</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Nhập ngày sinh của bé</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14, lineHeight: 1.6 }}>
            Vào tab <strong>Cài đặt</strong> để nhập ngày sinh và ngày dự sinh của bé để xem thông tin Wonder Weeks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ background: 'linear-gradient(180deg, var(--color-wonder-bg) 0%, var(--color-surface) 100%)' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800 }}>Tuần Vàng</h1>
        <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Wonder Weeks — 10 bước nhảy vọt của bé
        </p>

        {/* Current status card */}
        <div
          className="card-glass"
          style={{
            padding: 16,
            background: wwStatus?.status === 'stormy'
              ? 'linear-gradient(135deg, rgba(255,159,67,0.15), rgba(255,107,107,0.1))'
              : 'linear-gradient(135deg, rgba(0,201,167,0.12), rgba(78,205,196,0.08))',
            border: wwStatus?.status === 'stormy'
              ? '1px solid rgba(255,159,67,0.3)'
              : '1px solid rgba(0,201,167,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {wwStatus?.status === 'stormy'
              ? <Cloud size={22} color="var(--color-warning)" />
              : <Sun size={22} color="var(--color-success)" />
            }
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                Tuần tuổi hiện tại
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--color-text)' }}>
                Tuần {weekAge}
              </div>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <div className={`status-pill ${wwStatus?.status === 'stormy' ? 'stormy' : 'sunny'}`}>
                {wwStatus?.status === 'stormy' ? '⛈️ Storm' : '☀️ Sunny'}
              </div>
            </div>
          </div>

          {wwStatus?.currentLeap && (
            <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
                {wwStatus.currentLeap.emoji} Leap {wwStatus.currentLeap.leap}: {wwStatus.currentLeap.nameVi}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Giai đoạn storm: tuần {wwStatus.currentLeap.stormStart}–{wwStatus.currentLeap.stormEnd}
              </div>
            </div>
          )}

          {wwStatus?.nextLeap && !wwStatus.currentLeap && (
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              ⏭️ Leap tiếp theo: <strong>{wwStatus.nextLeap.nameVi}</strong> (~tuần {wwStatus.nextLeap.stormStart})
              {wwStatus.weeksUntilNext !== null && ` · còn ${wwStatus.weeksUntilNext} tuần`}
            </div>
          )}
        </div>

        {/* Timeline */}
        {weekAge !== null && <WeekTimeline weekAge={weekAge} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-light)', fontWeight: 600 }}>
          <span>Tuần 0</span>
          <span>Tuần 80</span>
        </div>
      </div>

      {/* Leap List */}
      <div style={{ padding: '12px 16px 16px' }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          10 Bước nhảy vọt
        </h3>

        {LEAPS.map(leap => {
          const isPassed = weekAge !== null && weekAge > leap.stormEnd;
          const isCurrent = weekAge !== null && weekAge >= leap.stormStart && weekAge <= leap.stormEnd;
          const isExpanded = expandedLeap === leap.leap;

          return (
            <div
              key={leap.leap}
              className={`leap-card card ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
              style={{ marginBottom: 10, background: isCurrent ? leap.colorLight : 'white' }}
            >
              {/* Leap header */}
              <button
                onClick={() => setExpandedLeap(isExpanded ? null : leap.leap)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 12, background: 'none', border: 'none', cursor: 'pointer',
                  padding: 0, textAlign: 'left',
                }}
              >
                {/* Emoji circle */}
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: `${leap.color}22`,
                  border: `2px solid ${leap.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                }}>
                  {isPassed ? <CheckCircle size={22} color={leap.color} /> : leap.emoji}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-muted)' }}>
                      Leap {leap.leap}
                    </span>
                    {isCurrent && (
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                        background: 'var(--color-warning)', color: 'white',
                      }}>
                        ĐANG XẢY RA
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text)', lineHeight: 1.2 }}>
                    {leap.emoji} {leap.nameVi}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Tuần {leap.stormStart}–{leap.stormEnd}
                    {weekAge !== null && !isPassed && !isCurrent && ` · còn ${leap.stormStart - weekAge} tuần`}
                  </div>
                </div>

                <div style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>
                  {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </button>

              {/* Expanded detail */}
              {isExpanded && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${leap.color}33` }}>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--color-text)', lineHeight: 1.6 }}>
                    {leap.description}
                  </p>

                  {/* Section toggle */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    {[
                      { value: 'skills', label: '✨ Kỹ năng mới' },
                      { value: 'symptoms', label: '⚠️ Dấu hiệu' },
                    ].map(s => (
                      <button
                        key={s.value}
                        onClick={() => setActiveSection(s.value)}
                        style={{
                          padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 700,
                          border: 'none', cursor: 'pointer', transition: 'all 0.2s ease',
                          background: activeSection === s.value ? leap.color : 'var(--color-surface-alt)',
                          color: activeSection === s.value ? 'white' : 'var(--color-text-muted)',
                        }}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {(activeSection === 'skills' ? leap.skillsVi : leap.symptomsVi).map((item, i) => (
                      <li key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 8,
                        padding: '6px 0', fontSize: 13, color: 'var(--color-text)',
                        borderBottom: i < (activeSection === 'skills' ? leap.skillsVi : leap.symptomsVi).length - 1
                          ? '1px solid var(--color-border)' : 'none',
                      }}>
                        <span style={{ color: leap.color, flexShrink: 0, marginTop: 1 }}>•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
