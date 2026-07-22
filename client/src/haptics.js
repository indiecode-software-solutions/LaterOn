import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Check at call-time (not at module load) to avoid race conditions
const isNative = () => Capacitor.isNativePlatform();

export const triggerLight = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    try { await Haptics.vibrate({ duration: 50 }); } catch (_) {}
  }
};

export const triggerMedium = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    try { await Haptics.vibrate({ duration: 100 }); } catch (_) {}
  }
};

export const triggerHeavy = async () => {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (e) {
    try { await Haptics.vibrate({ duration: 200 }); } catch (_) {}
  }
};

export const triggerSuccess = async () => {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    try { await Haptics.vibrate({ duration: 150 }); } catch (_) {}
  }
};

export const triggerError = async () => {
  if (!isNative()) return;
  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (e) {
    try { await Haptics.vibrate({ duration: 300 }); } catch (_) {}
  }
};

export const triggerSelection = async () => {
  if (!isNative()) return;
  try {
    await Haptics.selectionChanged();
  } catch (e) {
    try { await Haptics.vibrate({ duration: 30 }); } catch (_) {}
  }
};
