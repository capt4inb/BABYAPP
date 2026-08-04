import { useMemo, useState } from 'react';
import GameIcon from './GameIcon';
import {
  WONDER_WEEKS,
  formatWonderDate,
  getLeapTiming,
  getWonderWeekState,
} from '../data/wonderWeeks';
import moodGentle from '../assets/wonder-mood-gentle.png';
import moodCalm from '../assets/wonder-mood-calm.png';
import moodFussy from '../assets/wonder-mood-fussy.png';
import moodIrritated from '../assets/wonder-mood-irritated.png';
import moodCrying from '../assets/wonder-mood-crying.png';
import moodCryMore from '../assets/wonder-mood-cry-more.png';

const WONDER_MOODS = {
  gentle: { label: 'Dịu dàng', image: moodGentle, color: '#2FC9A3', soft: '#E9FAF6' },
  calm: { label: 'Ngoan ngoãn', image: moodCalm, color: '#5CA8F6', soft: '#EAF5FF' },
  fussy: { label: 'Khó tính', image: moodFussy, color: '#F0AE32', soft: '#FFF7E5' },
  irritated: { label: 'Bực bội', image: moodIrritated, color: '#F27645', soft: '#FFF0E9' },
  crying: { label: 'Quấy khóc', image: moodCrying, color: '#EE5F7C', soft: '#FFF0F4' },
  cryMore: { label: 'Khóc nhiều', image: moodCryMore, color: '#D93A50', soft: '#FFECEF' },
};

function WonderMoodPortrait({ moodKey, compact = false }) {
  const mood = WONDER_MOODS[moodKey] || WONDER_MOODS.gentle;

  return (
    <span
      className={`wonder-mood-portrait ${compact ? 'compact' : ''}`}
      style={{ '--wonder-mood-color': mood.color, '--wonder-mood-soft': mood.soft }}
      aria-hidden="true"
    >
      <img src={mood.image} alt="" draggable="false" />
    </span>
  );
}

function timingLabel(timing) {
  if (!timing) return '';
  return `${formatWonderDate(timing.startDate)} - ${formatWonderDate(timing.endDate, { year: 'numeric' })}`;
}

function statusCopy(state, timing) {
  if (state === 'active') return `Còn khoảng ${timing.daysRemaining} ngày`;
  if (state === 'passed') return 'Đã đi qua';
  return `Còn khoảng ${timing.daysUntil} ngày`;
}

export default function WonderWeeksTab({ settings, onSaveSettings, onBack }) {
  const [dueDateDraft, setDueDateDraft] = useState(null);
  const wonderState = useMemo(
    () => getWonderWeekState(settings.babyDueDate),
    [settings.babyDueDate]
  );
  const [selectedNumberOverride, setSelectedNumberOverride] = useState(null);
  const draftDueDate = dueDateDraft ?? settings.babyDueDate ?? '';
  const selectedNumber = selectedNumberOverride ?? wonderState?.focus?.number ?? 1;

  const selectedLeap = WONDER_WEEKS.find(leap => leap.number === selectedNumber) || WONDER_WEEKS[0];
  const selectedTiming = useMemo(
    () => getLeapTiming(selectedLeap, settings.babyDueDate),
    [selectedLeap, settings.babyDueDate]
  );

  const handleSaveDueDate = () => {
    if (!draftDueDate) return;
    onSaveSettings({ ...settings, babyDueDate: draftDueDate });
    setDueDateDraft(null);
  };

  return (
    <div className="wonder-screen animate-fade-in">
      <header className="wonder-header">
        <button type="button" className="icon-button" onClick={onBack} aria-label="Quay lại" title="Quay lại">
          <GameIcon name="left" size={30} variant="lavender" />
        </button>
        <div>
          <span>Phát triển của bé</span>
          <h1>Wonder Week</h1>
        </div>
        <GameIcon name="wonder" size={46} variant="lavender" />
      </header>

      {!wonderState ? (
        <section className="wonder-setup-card">
          <div className="wonder-setup-copy">
            <GameIcon name="calendar" size={42} variant="lavender" />
            <div>
              <h2>Ngày dự sinh</h2>
              <p>Tính theo mốc thai kỳ đủ 40 tuần.</p>
            </div>
          </div>
          <div className="wonder-date-form">
            <input
              type="date"
              className="form-input"
              value={draftDueDate}
              onInput={event => setDueDateDraft(event.currentTarget.value)}
              aria-label="Ngày dự sinh"
            />
            <button type="button" className="btn btn-primary" onClick={handleSaveDueDate} disabled={!draftDueDate}>
              <GameIcon name="check" size={24} variant="cream" />
              Lưu ngày
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className={`wonder-current-card ${wonderState.status}`}>
            <div className="wonder-current-top">
              <WonderMoodPortrait moodKey={wonderState.focus?.mood} />
              <div className="wonder-current-copy">
                <span className="wonder-kicker">
                  {wonderState.current ? 'Đang trong giai đoạn' : wonderState.next ? 'Giai đoạn sắp tới' : 'Đã hoàn thành'}
                </span>
                <h2>
                  {wonderState.focus ? `Tuần kỳ diệu ${wonderState.focus.number}` : '10 tuần kỳ diệu'}
                </h2>
                <p>{wonderState.focus?.title}</p>
              </div>
              {wonderState.focus && (
                <span className="wonder-state-badge">
                  {wonderState.status === 'active'
                    ? `${wonderState.focus.daysRemaining} ngày nữa`
                    : wonderState.status === 'waiting'
                      ? `${wonderState.focus.daysUntil} ngày nữa`
                      : 'Hoàn thành'}
                </span>
              )}
            </div>

            {wonderState.focus && (
              <>
                <div className="wonder-current-dates">
                  <span>Tuần {wonderState.focus.startWeek}-{wonderState.focus.endWeek}</span>
                  <strong>{timingLabel(wonderState.focus)}</strong>
                </div>
                <div className="wonder-progress" aria-label={`Tiến độ ${wonderState.focus.progress}%`}>
                  <span style={{ width: `${wonderState.focus.progress}%` }} />
                </div>
              </>
            )}
          </section>

          <section className="wonder-calendar-card">
            <div className="wonder-section-head">
              <div>
                <span>Lịch phát triển</span>
                <h2>10 giai đoạn đầu đời</h2>
              </div>
              <span className="wonder-age-pill">Tuần {wonderState.ageWeek}</span>
            </div>

            <div className="wonder-leap-grid">
              {wonderState.timeline.map(timing => (
                <button
                  type="button"
                  key={timing.number}
                  className={`wonder-leap-button ${timing.state} ${selectedNumber === timing.number ? 'selected' : ''}`}
                  onClick={() => setSelectedNumberOverride(timing.number)}
                  aria-pressed={selectedNumber === timing.number}
                  style={{
                    '--wonder-mood-color': WONDER_MOODS[timing.mood]?.color,
                    '--wonder-mood-soft': WONDER_MOODS[timing.mood]?.soft,
                  }}
                >
                  <span>Giai đoạn {timing.number}</span>
                  <WonderMoodPortrait moodKey={timing.mood} compact />
                  <strong>Tuần {timing.peakWeek}</strong>
                  <small>{WONDER_MOODS[timing.mood]?.label}</small>
                  <i aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          {selectedTiming && (
            <section className={`wonder-detail-card ${selectedTiming.state}`}>
              <div className="wonder-detail-hero">
                <div>
                  <span className="wonder-kicker">
                    Tuần kỳ diệu {selectedTiming.number} · {WONDER_MOODS[selectedTiming.mood]?.label}
                  </span>
                  <h2>{selectedTiming.title}</h2>
                  <p>{selectedTiming.summary}</p>
                </div>
                <div className="wonder-detail-status">
                  <strong>{statusCopy(selectedTiming.state, selectedTiming)}</strong>
                  <span>{timingLabel(selectedTiming)}</span>
                </div>
              </div>

              <div className="wonder-detail-section">
                <h3>
                  <GameIcon name="baby" size={28} variant="pink" />
                  Dấu hiệu nổi bật
                </h3>
                <div className="wonder-chip-grid">
                  {selectedTiming.signs.map(sign => <span key={sign}>{sign}</span>)}
                </div>
              </div>

              <div className="wonder-detail-section">
                <h3>
                  <GameIcon name="search" size={28} variant="blue" />
                  Quan sát theo sinh hoạt
                </h3>
                <div className="wonder-observation-grid">
                  {selectedTiming.observations.map(group => (
                    <section className="wonder-observation-group" key={group.title}>
                      <div className="wonder-observation-heading">
                        <GameIcon name={group.icon} size={30} variant={group.variant} />
                        <h4>{group.title}</h4>
                      </div>
                      <ul>
                        {group.items.map(item => <li key={item}>{item}</li>)}
                      </ul>
                    </section>
                  ))}
                </div>
              </div>

              <div className="wonder-detail-section">
                <h3>
                  <GameIcon name="sparkles" size={28} variant="lavender" />
                  Bé có thể học gì mới?
                </h3>
                <div className="wonder-skill-grid">
                  {selectedTiming.skills.map((skill, index) => (
                    <article key={skill}>
                      <strong>{String(index + 1).padStart(2, '0')}</strong>
                      <span>{skill}</span>
                    </article>
                  ))}
                </div>
              </div>

              <div className="wonder-detail-section wonder-tips">
                <h3>
                  <GameIcon name="light" size={28} variant="orange" />
                  Gợi ý cho ba mẹ
                </h3>
                <div>
                  {selectedTiming.tips.map(tip => (
                    <span key={tip}><GameIcon name="check" size={20} variant="green" />{tip}</span>
                  ))}
                </div>
              </div>
            </section>
          )}

          <p className="wonder-disclaimer">
            Tổng hợp từ mô tả Wonder Weeks và mốc phát triển CDC. Thời điểm có thể lệch khoảng 2 tuần và không phải bé nào cũng có mọi biểu hiện. Đây không phải công cụ chẩn đoán; nếu bé mất kỹ năng đã có hoặc có thay đổi khiến bạn lo lắng, hãy trao đổi với bác sĩ nhi khoa.
          </p>
        </>
      )}
    </div>
  );
}
