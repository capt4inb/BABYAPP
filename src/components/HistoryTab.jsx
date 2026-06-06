import { useState, useMemo } from 'react';
import { Droplets, Zap, Edit2, Trash2, ChevronDown, ChevronUp, Search } from 'lucide-react';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'long', day: '2-digit', month: '2-digit',
  });
}

function groupByDay(records) {
  const groups = {};
  records.forEach(r => {
    const day = new Date(r.timestamp).toDateString();
    if (!groups[day]) groups[day] = [];
    groups[day].push(r);
  });
  return Object.entries(groups).map(([day, recs]) => ({ day, recs }));
}

export default function HistoryTab({ records, onOpenFeedModal, onOpenPumpModal, onDeleteRecord }) {
  const [filter, setFilter] = useState('all'); // all | feed | pump
  const [search, setSearch] = useState('');
  const [expandedDays, setExpandedDays] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = useMemo(() => {
    let r = records;
    if (filter !== 'all') r = r.filter(rec => rec.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(rec =>
        rec.note?.toLowerCase().includes(q) ||
        String(rec.volume || '').includes(q)
      );
    }
    return r;
  }, [records, filter, search]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);

  const toggleDay = (day) => {
    setExpandedDays(prev => ({ ...prev, [day]: !prev[day] }));
  };

  const handleDelete = (id) => {
    if (deleteConfirm === id) {
      onDeleteRecord(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 style={{ margin: '0 0 16px', fontSize: 24, fontWeight: 800 }}>Lịch sử</h1>

        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <Search size={16} style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
          }} />
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm ghi chú, số ml..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 40 }}
          />
        </div>

        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'all', label: 'Tất cả', emoji: '📋' },
            { value: 'feed', label: 'Cữ bú', emoji: '🍼' },
            { value: 'pump', label: 'Hút sữa', emoji: '⚡' },
          ].map(f => (
            <button
              key={f.value}
              className={`tag ${
                f.value === 'all' ? 'tag-primary' : f.value === 'feed' ? 'tag-baby' : 'tag-pump'
              } ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.emoji} {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '8px 16px 16px' }}>
        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 32px' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 15 }}>
              {search ? 'Không tìm thấy kết quả' : 'Chưa có dữ liệu'}
            </p>
          </div>
        ) : (
          groups.map(({ day, recs }) => {
            const isExpanded = expandedDays[day] !== false; // default expanded
            const dayTotal = recs.reduce((s, r) => s + (r.volume || 0), 0);
            return (
              <div key={day} className="card" style={{ marginBottom: 12, overflow: 'visible' }}>
                {/* Day header */}
                <button
                  onClick={() => toggleDay(day)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', padding: '14px 16px',
                    background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: isExpanded ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text)' }}>
                      {formatDate(recs[0].timestamp)}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {recs.length} lần{dayTotal > 0 ? ` · ${dayTotal} ml` : ''}
                    </div>
                  </div>
                  <div style={{ color: 'var(--color-text-muted)' }}>
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </div>
                </button>

                {/* Records */}
                {isExpanded && recs.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display: 'flex', alignItems: 'flex-start',
                      padding: '12px 16px',
                      borderBottom: i < recs.length - 1 ? '1px solid var(--color-border)' : 'none',
                      gap: 12,
                    }}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: r.type === 'feed' ? 'var(--color-primary-bg)' : 'var(--color-pump-bg)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {r.type === 'feed'
                        ? <Droplets size={18} color="var(--color-primary)" />
                        : <Zap size={18} color="var(--color-pump)" />
                      }
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
                            {r.type === 'feed'
                              ? `Bú ${r.side === 'left' ? 'trái' : r.side === 'right' ? 'phải' : r.side === 'bottle' ? 'bình' : 'hai bên'}`
                              : 'Hút sữa'}
                          </span>
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                            {new Date(r.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            {r.volume ? ` · ${r.volume} ml` : ''}
                            {r.duration ? ` · ${r.duration} phút` : ''}
                          </div>
                          {r.note && (
                            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: 2 }}>
                              "{r.note}"
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => r.type === 'feed' ? onOpenFeedModal(r) : onOpenPumpModal(r)}
                            style={{
                              width: 30, height: 30, borderRadius: 8, border: 'none',
                              background: 'var(--color-surface-alt)', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: 'var(--color-text-muted)',
                            }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleDelete(r.id)}
                            style={{
                              width: 30, height: 30, borderRadius: 8, border: 'none',
                              background: deleteConfirm === r.id ? 'var(--color-danger)' : 'var(--color-surface-alt)',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: deleteConfirm === r.id ? 'white' : 'var(--color-text-muted)',
                              transition: 'all 0.2s ease',
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
