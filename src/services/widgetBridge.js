import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';

const BabyWidget = registerPlugin('BabyWidget');

function latestDate(items, field, predicate = () => true) {
  return items
    .filter(item => predicate(item) && Number.isFinite(new Date(item?.[field]).getTime()))
    .sort((a, b) => new Date(b[field]) - new Date(a[field]))[0]?.[field] || '';
}

export async function syncWidgetSnapshot(records, pumpingSessions) {
  if (!Capacitor.isNativePlatform()) return;

  await BabyWidget.update({
    lastFeedAt: latestDate(records, 'timestamp', item => item.type === 'feed'),
    lastPumpAt: latestDate(pumpingSessions, 'completedAt'),
  });
}

function actionFromUrl(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'babyapp:' || parsed.hostname !== 'quick-add') return null;
    const action = parsed.pathname.replace(/^\//, '');
    return action === 'feed' || action === 'pump' ? action : null;
  } catch {
    return null;
  }
}

export async function listenForWidgetActions(onAction) {
  if (!Capacitor.isNativePlatform()) return () => {};

  const launchUrl = await CapacitorApp.getLaunchUrl();
  const launchAction = actionFromUrl(launchUrl?.url);
  if (launchAction) onAction(launchAction);

  const listener = await CapacitorApp.addListener('appUrlOpen', ({ url }) => {
    const action = actionFromUrl(url);
    if (action) onAction(action);
  });

  return () => listener.remove();
}
