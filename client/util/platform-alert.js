// client/util/platform-alert.js
import { Alert, Platform } from 'react-native';

/**
 * Platform-compatible alert that works on web and mobile
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Array} buttons - Array of button configs [{text, onPress, style}]
 * @param {Object} options - Additional options
 */
export const showAlert = (title, message, buttons = [], options = {}) => {
  if (Platform.OS === 'web') {
    return showWebAlert(title, message, buttons, options);
  } else {
    // Mobile - use native Alert
    Alert.alert(title, message, buttons, options);
  }
};

/**
 * Web-compatible alert implementation
 */
const showWebAlert = (title, message, buttons = [], options = {}) => {
  const fullMessage = title ? `${title}\n\n${message}` : message;

  // No buttons or single button - simple alert
  if (!buttons || buttons.length === 0) {
    window.alert(fullMessage);
    return;
  }

  if (buttons.length === 1) {
    window.alert(fullMessage);
    if (buttons[0].onPress) {
      buttons[0].onPress();
    }
    return;
  }

  // Two buttons - use confirm dialog
  if (buttons.length === 2) {
    const confirmed = window.confirm(fullMessage);
    
    // Find cancel and confirm buttons
    const cancelButton = buttons.find(b => b.style === 'cancel');
    const confirmButton = buttons.find(b => b.style !== 'cancel') || buttons[1];
    
    if (confirmed) {
      if (confirmButton && confirmButton.onPress) {
        confirmButton.onPress();
      }
    } else {
      if (cancelButton && cancelButton.onPress) {
        cancelButton.onPress();
      }
    }
    return;
  }

  // More than 2 buttons - show numbered options
  showMultiButtonWebAlert(title, message, buttons);
};

/**
 * Handle 3+ buttons on web using prompt
 */
const showMultiButtonWebAlert = (title, message, buttons) => {
  const fullMessage = `${title}\n\n${message}\n\nChoose an option:`;
  const buttonLabels = buttons.map((b, i) => `${i + 1}. ${b.text}`).join('\n');
  const choice = window.prompt(`${fullMessage}\n\n${buttonLabels}\n\nEnter number (1-${buttons.length}):`);
  
  if (choice) {
    const index = parseInt(choice) - 1;
    if (index >= 0 && index < buttons.length && buttons[index].onPress) {
      buttons[index].onPress();
    }
  } else {
    // User cancelled - trigger cancel button if exists
    const cancelButton = buttons.find(b => b.style === 'cancel');
    if (cancelButton && cancelButton.onPress) {
      cancelButton.onPress();
    }
  }
};

/**
 * Simple alert with just OK button
 */
export const showSimpleAlert = (title, message) => {
  showAlert(title, message, [{ text: 'OK' }]);
};

/**
 * Confirmation dialog
 */
export const showConfirmAlert = (title, message, onConfirm, onCancel) => {
  showAlert(title, message, [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    { text: 'OK', onPress: onConfirm }
  ]);
};

export default showAlert;