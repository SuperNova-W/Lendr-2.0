import { Alert, AlertButton, Platform } from 'react-native';

// Cross-platform replacement for Alert.alert. React Native's Alert is a no-op
// on web, so there we fall back to the browser's alert()/confirm(). Same
// signature as Alert.alert, so call sites can swap in directly.
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const body = message ? `${title}\n\n${message}` : title;

  // No buttons or a single button → informational alert; run its handler after.
  if (!buttons || buttons.length <= 1) {
    window.alert(body);
    buttons?.[0]?.onPress?.();
    return;
  }

  // Multiple buttons → confirm. OK runs the primary (first non-cancel) action;
  // dismissing runs the cancel button's handler if there is one.
  const cancel = buttons.find(b => b.style === 'cancel');
  const primary = buttons.find(b => b.style !== 'cancel') ?? buttons[0];
  if (window.confirm(body)) primary.onPress?.();
  else cancel?.onPress?.();
}
