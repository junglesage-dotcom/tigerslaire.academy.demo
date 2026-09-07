// src/lib/telegram.ts — Telegram Mini App bridge helpers
type AnyWebApp = any;

export function getWebApp(): AnyWebApp | null {
  const w = window as any;
  return w?.Telegram?.WebApp ?? null;
}

export const isMiniApp = () => !!getWebApp()?.initData;

export function initMiniApp() {
  const wa = getWebApp();
  if (!wa) return;
  try {
    wa.ready();
    wa.expand();
    wa.setHeaderColor?.('#171007');
    wa.setBackgroundColor?.('#171007');
    wa.enableClosingConfirmation?.();
    wa.disableVerticalSwipes?.();
  } catch {}
}

/** Shows the native Back button; returns an unsubscribe function. */
export function bindBackButton(onBack: () => void): () => void {
  const wa = getWebApp();
  if (!wa?.BackButton) return () => {};
  const handler = () => onBack();
  wa.BackButton.show();
  wa.BackButton.onClick(handler);
  return () => {
    wa.BackButton.offClick(handler);
    wa.BackButton.hide();
  };
}

export function haptic(style: 'success' | 'error' | 'warning' | 'light' | 'medium' | 'heavy' = 'light') {
  const H = getWebApp()?.HapticFeedback;
  if (!H) return;
  try {
    if (style === 'success') H.notificationOccurred('success');
    else if (style === 'error') H.notificationOccurred('error');
    else if (style === 'warning') H.notificationOccurred('warning');
    else H.impactOccurred(style);
  } catch {}
}

/** Shows the native MainButton; returns an unsubscribe function. */
export function showMainButton(text: string, onClick: () => void): () => void {
  const wa = getWebApp();
  if (!wa?.MainButton) return () => {};
  wa.MainButton.setText(text);
  wa.MainButton.show();
  wa.MainButton.onClick(onClick);
  return () => {
    wa.MainButton.offClick(onClick);
    wa.MainButton.hide();
  };
}

export function openTelegramLink(url: string) {
  const wa = getWebApp();
  if (wa?.openTelegramLink) wa.openTelegramLink(url);
  else window.open(url, '_blank');
}

export function openLink(url: string) {
  const wa = getWebApp();
  if (wa?.openLink) wa.openLink(url);
  else window.open(url, '_blank');
}

/** Deep-link into the bot, e.g. botDeepLink('chan_course123') */
export function botDeepLink(payload: string, botUsername = 'jsagebutlerbot') {
  openTelegramLink(`https://t.me/${botUsername}?start=${payload}`);
}