import { Alert, Platform } from 'react-native';

/**
 * Avisos e confirmações que funcionam nas três plataformas.
 *
 * No react-native-web o `Alert.alert` é um no-op (não mostra nada), então as
 * telas ficariam sem retorno nenhum ao rodar no navegador. Aqui caímos para os
 * diálogos nativos do browser e mantemos o `Alert` no Android/iOS.
 */

function browser(): any | null {
  const g = globalThis as any;
  return Platform.OS === 'web' && typeof g?.alert === 'function' ? g : null;
}

/** Mensagem simples de sucesso/erro. */
export function notify(title: string, message?: string): void {
  const g = browser();
  if (g) {
    g.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Confirmação de uma ação (normalmente destrutiva) antes de executá-la. */
export function confirmAction(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}): void {
  const { title, message, confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', destructive, onConfirm } = options;

  const g = browser();
  if (g) {
    if (typeof g.confirm === 'function' ? g.confirm(message ? `${title}\n\n${message}` : title) : true) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
