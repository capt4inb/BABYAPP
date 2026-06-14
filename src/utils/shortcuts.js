export function openAppleShortcutAlarm(timeLabel) {
  // timeLabel is expected to be "HH:mm"
  // Run the shortcut named 'TaoBaoThuc' and pass the time as input
  const url = `shortcuts://run-shortcut?name=TaoBaoThuc&input=${encodeURIComponent(timeLabel)}`;
  window.location.href = url;
}
