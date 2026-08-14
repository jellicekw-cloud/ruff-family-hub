// Utilities for Web Push notifications — service worker registration,
// iOS/standalone detection, and subscribing a specific family member's device.

export function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export type SubscribeResult =
  | { status: 'subscribed' }
  | { status: 'needs-install' } // iOS, not yet added to Home Screen
  | { status: 'permission-denied' }
  | { status: 'unsupported' }
  | { status: 'error'; message: string };

export async function subscribeMemberToPush(memberId: string): Promise<SubscribeResult> {
  if (!isPushSupported()) {
    return { status: 'unsupported' };
  }

  // iOS Safari only allows push permission requests when launched from the
  // Home Screen icon (standalone mode) — not from a regular browser tab.
  if (isIOS() && !isStandalone()) {
    return { status: 'needs-install' };
  }

  try {
    const registration = await registerServiceWorker();
    if (!registration) return { status: 'error', message: 'Service worker unavailable' };

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { status: 'permission-denied' };
    }

    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      return { status: 'error', message: 'Push notifications are not configured yet' };
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    const res = await fetch('/api/save-push-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, subscription: subscription.toJSON() }),
    });

    const data = await res.json();
    if (!data.success) {
      return { status: 'error', message: data.error || 'Failed to save subscription' };
    }

    return { status: 'subscribed' };
  } catch (err: any) {
    console.error('Push subscription failed:', err);
    return { status: 'error', message: err.message || 'Something went wrong' };
  }
}

