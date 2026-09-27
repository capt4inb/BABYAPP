// Runs before the app bundle, so a failed or slow download remains recoverable.
(() => {
  const status = document.getElementById('startup-status');
  const retry = document.getElementById('startup-retry');
  retry.addEventListener('click', () => window.location.reload());
  const timeout = window.setTimeout(() => {
    status.textContent = 'Kết nối hơi chậm. Bạn có thể chờ thêm hoặc tải lại.';
    retry.hidden = false;
  }, 15000);
  window.addEventListener('babyapp:ready', () => window.clearTimeout(timeout), { once: true });
  window.addEventListener('babyapp:error', () => {
    window.clearTimeout(timeout);
    status.textContent = 'Chưa thể mở ứng dụng. Vui lòng kiểm tra mạng và thử lại.';
    retry.hidden = false;
  }, { once: true });
})();
