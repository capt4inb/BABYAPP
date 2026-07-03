import { useMemo, useState } from 'react';
import { LEAPS, getBabyWeekAge, getWonderWeekStatus } from '../data/wonderWeeks';
import GameIcon from './GameIcon';

function WeekTimeline({ weekAge }) {
  const maxWeek = 80;
  const clampedWeek = Math.max(0, Math.min(weekAge, maxWeek));
  const pct = (clampedWeek / maxWeek) * 100;

  return (
    <div className="wonder-map">
      <div className="week-timeline">
        <div className="week-track" style={{ background: 'linear-gradient(90deg, rgba(255,79,139,0.3), rgba(255,176,0,0.35), rgba(24,183,179,0.3), rgba(124,77,255,0.35))' }} />
        {LEAPS.map(leap => {
          const leapPct = (leap.week / maxWeek) * 100;
          const isInStorm = weekAge >= leap.stormStart && weekAge <= leap.stormEnd;
          const isPassed = weekAge > leap.stormEnd;
          return (
            <div
              key={leap.leap}
              className={`week-leap-marker ${isPassed ? 'passed' : ''} ${isInStorm ? 'current' : ''}`}
              style={{
                left: `${leapPct}%`,
                background: isInStorm ? leap.color : `${leap.color}88`,
                height: isInStorm ? 36 : 24,
              }}
              title={`Leap ${leap.leap}: ${leap.nameVi}`}
            />
          );
        })}

        <div className="week-current-marker" style={{ left: `${pct}%` }}>
          <GameIcon name="star" size={18} variant="pink" bare />
        </div>
      </div>

      <div className="wonder-map-footer">
        <span>Tuần 0</span>
        <strong>{Math.round(pct)}%</strong>
        <span>Tuần 80</span>
      </div>
    </div>
  );
}

function InfoTile({ icon, label, value, tone = 'primary' }) {
  return (
    <div className={`wonder-info-tile ${tone}`}>
      <GameIcon name={icon} size={30} variant={tone === 'baby' ? 'blue' : tone === 'pump' ? 'orange' : 'pink'} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function WonderWeeksTab({ settings }) {
  const { babyBirthDate, babyDueDate } = settings;
  const [expandedLeap, setExpandedLeap] = useState(null);
  const [activeSection, setActiveSection] = useState('skills');

  const weekAge = babyBirthDate
    ? getBabyWeekAge(babyBirthDate, babyDueDate || null)
    : null;
  const wwStatus = weekAge !== null ? getWonderWeekStatus(weekAge) : null;

  const nextMilestone = useMemo(() => {
    if (weekAge === null) return null;
    return LEAPS.find(leap => weekAge <= leap.stormEnd) || LEAPS[LEAPS.length - 1];
  }, [weekAge]);

  if (!babyBirthDate) {
    return (
      <div className="animate-fade-in wonder-screen">
        <div className="page-header wonder-header">
          <div className="wonder-title-row">
            <div>
              <p className="wonder-eyebrow">Quest map</p>
              <h1>Tuần Vàng</h1>
            </div>
            <div className="wonder-orb">
              <GameIcon name="sparkles" size={38} variant="pink" />
            </div>
          </div>
        </div>

        <div className="wonder-empty card">
          <GameIcon name="sparkles" size={54} variant="lavender" />
          <h3>Nhập ngày sinh của bé</h3>
          <p>
            Vào tab Cài đặt để nhập ngày sinh và ngày dự sinh, sau đó màn này sẽ mở bản đồ Wonder Weeks theo tuần tuổi của bé.
          </p>
        </div>
      </div>
    );
  }

  const isStormy = wwStatus?.status === 'stormy';
  const currentLeap = wwStatus?.currentLeap;
  const currentLabel = isStormy ? 'Storm Quest' : 'Sunny Zone';
  const nextLeap = wwStatus?.nextLeap;

  return (
    <div className="animate-fade-in wonder-screen">
      <div className="page-header wonder-header">
        <div className="wonder-title-row">
          <div>
            <p className="wonder-eyebrow">Wonder Weeks Map</p>
            <h1>Tuần Vàng</h1>
            <p className="wonder-subtitle">Theo dõi 10 bước nhảy vọt như một hành trình nhỏ của bé.</p>
          </div>
          <div className={`wonder-orb ${isStormy ? 'storm' : 'sunny'}`}>
            <GameIcon name={isStormy ? 'cloud' : 'sun'} size={40} variant={isStormy ? 'orange' : 'green'} />
          </div>
        </div>

        <div className={`wonder-status-card ${isStormy ? 'storm' : 'sunny'}`}>
          <div className="wonder-status-top">
            <div>
              <span className="wonder-status-label">{currentLabel}</span>
              <strong>Tuần {weekAge}</strong>
            </div>
            <div className={`status-pill ${isStormy ? 'stormy' : 'sunny'}`}>
              {isStormy ? 'Cần vỗ về' : 'Ổn định'}
            </div>
          </div>

          {currentLeap ? (
            <div className="wonder-current-quest">
              <div className="quest-icon" style={{ background: `${currentLeap.color}22`, color: currentLeap.color }}>
                <GameIcon name="sparkles" size={34} variant="orange" />
              </div>
              <div>
                <span>Đang ở Leap {currentLeap.leap}</span>
                <strong>{currentLeap.nameVi}</strong>
                <small>Storm: tuần {currentLeap.stormStart}-{currentLeap.stormEnd}</small>
              </div>
            </div>
          ) : (
            <div className="wonder-current-quest">
              <div className="quest-icon">
                <GameIcon name="target" size={34} variant="lavender" />
              </div>
              <div>
                <span>Leap tiếp theo</span>
                <strong>{nextLeap ? nextLeap.nameVi : 'Đã hoàn tất bản đồ'}</strong>
                {nextLeap && (
                  <small>
                    Mở ở khoảng tuần {nextLeap.stormStart}
                    {wwStatus.weeksUntilNext !== null ? `, còn ${wwStatus.weeksUntilNext} tuần` : ''}
                  </small>
                )}
              </div>
            </div>
          )}

          <div className="wonder-info-grid">
            <InfoTile icon="calendar" label="Tuần tuổi" value={`Tuần ${weekAge}`} tone="primary" />
            <InfoTile icon="map" label="Mốc gần nhất" value={nextMilestone ? `Leap ${nextMilestone.leap}` : 'Hoàn tất'} tone="baby" />
            <InfoTile icon="shield" label="Trạng thái" value={isStormy ? 'Storm' : 'Sunny'} tone="pump" />
          </div>
        </div>

        <WeekTimeline weekAge={weekAge} />
      </div>

      <div className="wonder-content">
        <div className="wonder-section-head">
          <div>
            <span>Quest list</span>
            <h2>10 bước nhảy vọt</h2>
          </div>
          <GameIcon name="flag" size={32} variant="lavender" />
        </div>

        <div className="wonder-quest-list">
          {LEAPS.map(leap => {
            const isPassed = weekAge !== null && weekAge > leap.stormEnd;
            const isCurrent = weekAge !== null && weekAge >= leap.stormStart && weekAge <= leap.stormEnd;
            const isExpanded = expandedLeap === leap.leap;
            const weeksUntil = weekAge !== null ? leap.stormStart - weekAge : null;

            return (
              <div
                key={leap.leap}
                className={`leap-card card wonder-quest-card ${isCurrent ? 'current' : ''} ${isPassed ? 'passed' : ''}`}
                style={{
                  '--leap-color': leap.color,
                  background: isCurrent
                    ? `linear-gradient(180deg, ${leap.colorLight}, #ffffff)`
                    : undefined,
                }}
              >
                <button
                  className="wonder-quest-button"
                  onClick={() => setExpandedLeap(isExpanded ? null : leap.leap)}
                  aria-expanded={isExpanded}
                >
                  <div className="wonder-quest-rank" style={{ background: `${leap.color}22`, color: leap.color }}>
                    {isPassed ? <GameIcon name="check" size={30} variant="green" /> : <span>{leap.leap}</span>}
                  </div>

                  <div className="wonder-quest-main">
                    <div className="wonder-quest-meta">
                      <span>Leap {leap.leap}</span>
                      {isCurrent && <strong>Đang xảy ra</strong>}
                      {isPassed && <em>Hoàn tất</em>}
                    </div>
                    <h3>{leap.nameVi}</h3>
                    <p>
                      Tuần {leap.stormStart}-{leap.stormEnd}
                      {weeksUntil !== null && !isPassed && !isCurrent && weeksUntil > 0 ? ` · còn ${weeksUntil} tuần` : ''}
                    </p>
                  </div>

                  <div className="wonder-chevron">
                    <GameIcon name={isExpanded ? 'up' : 'down'} size={24} variant="cream" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="wonder-quest-detail">
                    <p>{leap.description}</p>

                    <div className="wonder-toggle" role="tablist" aria-label="Nội dung Leap">
                      <button
                        type="button"
                        className={activeSection === 'skills' ? 'active' : ''}
                        onClick={() => setActiveSection('skills')}
                      >
                        <GameIcon name="sparkles" size={20} variant="pink" />
                        Kỹ năng mới
                      </button>
                      <button
                        type="button"
                        className={activeSection === 'symptoms' ? 'active' : ''}
                        onClick={() => setActiveSection('symptoms')}
                      >
                        <GameIcon name="shield" size={20} variant="orange" />
                        Dấu hiệu
                      </button>
                    </div>

                    <ul className="wonder-reward-list">
                      {(activeSection === 'skills' ? leap.skillsVi : leap.symptomsVi).map((item, i) => (
                        <li key={i}>
                          <span style={{ background: leap.color }} />
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
    </div>
  );
}
