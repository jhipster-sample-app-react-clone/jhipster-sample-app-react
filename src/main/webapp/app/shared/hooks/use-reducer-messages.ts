import { useEffect } from 'react';

import { notifyReducerMessages, ReducerMessages } from 'app/shared/util/reducer-messages';

/**
 * Show the success/error message published by a reducer slice as a toast, and let the caller
 * clear the message once it has been notified.
 */
export const useReducerMessages = (messages: ReducerMessages, onNotified?: () => void): void => {
  useEffect(() => {
    if (notifyReducerMessages(messages) && onNotified) {
      onNotified();
    }
  }, [messages]);
};
