import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Safely trigger haptics only on native mobile platforms
const isNative = Capacitor.isNativePlatform();

export const triggerLight = async () => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerMedium = async () => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerHeavy = async () => {
  if (!isNative) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerSuccess = async () => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerError = async () => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerSelection = async () => {
  if (!isNative) return;
  try {
    await Haptics.selectionStart();
    setTimeout(() => {
      Haptics.selectionEnd();
    }, 100);
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};
