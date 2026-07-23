import { registerPlugin, Capacitor } from '@capacitor/core';

// Our custom native plugin - direct Android Vibrator calls
const NativeVibration = registerPlugin('NativeVibration');

const isNative = () => Capacitor.isNativePlatform();

const vibrate = async (duration) => {
  if (!isNative()) return;
  try {
    await NativeVibration.vibrate({ duration });
  } catch (e) {
    console.warn('[Haptics] vibrate failed', e);
  }
};

// Light tap - navigation, small buttons
export const triggerLight = () => vibrate(80);

// Medium tap - standard button presses
export const triggerMedium = () => vibrate(150);

// Heavy - major actions
export const triggerHeavy = () => vibrate(300);

// Success - double short pulses feel like success
export const triggerSuccess = () => vibrate(120);

// Error - longer buzz feels like an error
export const triggerError = () => vibrate(250);

// Selection - very short tick
export const triggerSelection = () => vibrate(40);
