import { Haptics, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

// Safely trigger haptics only on native mobile platforms
const isNative = Capacitor.isNativePlatform();

export const triggerLight = async () => {
  if (!isNative) return;
  try {
    // 30ms short vibrate is excellent for standard button taps
    await Haptics.vibrate({ duration: 35 });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerMedium = async () => {
  if (!isNative) return;
  try {
    // 60ms is a solid tactile button press
    await Haptics.vibrate({ duration: 60 });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerHeavy = async () => {
  if (!isNative) return;
  try {
    await Haptics.vibrate({ duration: 100 });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};

export const triggerSuccess = async () => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (e) {
    // Fallback if notification patterns fail
    await Haptics.vibrate({ duration: 120 });
  }
};

export const triggerError = async () => {
  if (!isNative) return;
  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (e) {
    // Fallback if notification patterns fail
    await Haptics.vibrate({ duration: 200 });
  }
};

export const triggerSelection = async () => {
  if (!isNative) return;
  try {
    // Very quick tap for list selection/tab switching
    await Haptics.vibrate({ duration: 20 });
  } catch (e) {
    console.warn('Haptics failed', e);
  }
};
