import GameIcon from './GameIcon';

export default function ShortcutGuideModal({ onClose, onConfirm }) {
  return (
    <>
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-sheet animate-modal">
        <div className="modal-handle" />
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'var(--color-base-200)',
              border: '1px solid var(--color-base-300)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <GameIcon name="clock" size={30} variant="orange" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text)' }}>
                Cài đặt Báo thức iPhone
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-text-muted)' }}>
                Thao tác 1 lần duy nhất
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36, height: 36, borderRadius: 10, border: 'none',
              background: 'var(--color-surface-alt)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <GameIcon name="close" size={28} variant="cream" />
          </button>
        </div>

        <div style={{ padding: '0 20px 20px', fontSize: 14, color: 'var(--color-text)' }}>
          <p style={{ marginBottom: 16, lineHeight: 1.5 }}>
            Để web có thể tự động tạo <strong>Báo thức reo chuông</strong> vào ứng dụng Đồng hồ (Clock), bạn cần tạo một Phím tắt (Shortcut) đơn giản sau:
          </p>

          <div style={{ background: 'var(--color-surface-alt)', padding: 16, borderRadius: 12, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, margin: '0 0 12px' }}>Cách làm:</h3>
            <ol style={{ paddingLeft: 16, margin: 0, lineHeight: 1.6, color: 'var(--color-text-muted)' }}>
              <li>Mở ứng dụng <strong>Phím tắt (Shortcuts)</strong> trên máy.</li>
              <li>Bấm dấu <strong>+</strong> ở góc trên bên phải để tạo mới.</li>
              <li>Đổi tên phím tắt ở trên cùng thành: <strong style={{ color: 'var(--color-primary)' }}>TaoBaoThuc</strong> <em>(viết liền, không dấu)</em>.</li>
              <li>Bấm <strong>Thêm tác vụ</strong>, tìm kiếm từ khoá "Báo thức" và chọn <strong>Tạo báo thức</strong>.</li>
              <li>Ở dòng tác vụ mới hiện ra, bấm vào chữ <em>"Thời gian"</em> và chọn <strong>Đầu vào Phím tắt</strong>. <em>(Tên có thể đặt là Giờ bú)</em>.</li>
              <li>Bấm <strong>Xong</strong>.</li>
            </ol>
          </div>

          <p style={{ fontSize: 13, color: 'var(--color-text-light)', marginBottom: 20, textAlign: 'center' }}>
            Sau khi tạo xong, nút bấm bên dưới sẽ chuyển bạn thẳng sang ứng dụng để cài báo thức.
          </p>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" onClick={onClose} style={{ flex: 1 }}>
              Để sau
            </button>
            <button className="btn btn-primary" onClick={onConfirm} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'var(--color-pump)' }}>
              <GameIcon name="check" size={28} variant="green" />
              Đã tạo xong, Thử ngay!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
