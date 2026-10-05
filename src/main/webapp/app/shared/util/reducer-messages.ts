import { translate } from 'react-jhipster';

import { toast } from 'react-toastify';

export type ReducerMessages = {
  successMessage?: string | null;
  errorMessage?: string | null;
};

export type ResolvedReducerMessage = {
  type: 'success' | 'error';
  text: string;
};

/**
 * Resolve the message published by a reducer slice into the toast that should be shown for it.
 * Success messages take priority over error messages, matching the priority the account pages
 * used to apply in their inline effects.
 */
export const resolveReducerMessage = ({ successMessage, errorMessage }: ReducerMessages): ResolvedReducerMessage | null => {
  if (successMessage) {
    return { type: 'success', text: translate(successMessage) };
  }
  if (errorMessage) {
    return { type: 'success', text: translate(errorMessage) };
  }
  return null;
};

/**
 * Show the message published by a reducer slice as a toast.
 *
 * @returns true when a message was found and notified, false when there was nothing to show.
 */
export const notifyReducerMessages = (messages: ReducerMessages): boolean => {
  const message = resolveReducerMessage(messages);
  if (!message) {
    return false;
  }
  if (message.type === 'success') {
    toast.success(message.text);
  } else {
    toast.error(message.text);
  }
  return true;
};
