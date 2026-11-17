import * as Haptics from 'expo-haptics';

export function triggerImpact(style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) {
  try {
    Haptics.impactAsync(style);
  } catch {
    // Non-blocking fallback for web/simulator
  }
}

export function triggerSelection() {
  try {
    Haptics.selectionAsync();
  } catch {
    // Non-blocking fallback
  }
}

export function triggerNotification(type: Haptics.NotificationFeedbackType = Haptics.NotificationFeedbackType.Success) {
  try {
    Haptics.notificationAsync(type);
  } catch {
    // Non-blocking fallback
  }
}
