import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translate } from 'react-jhipster';

import { toast } from 'react-toastify';

import { notifyReducerMessages, resolveReducerMessage } from './reducer-messages';

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Reducer messages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('resolveReducerMessage', () => {
    it('should resolve a success message', () => {
      expect(resolveReducerMessage({ successMessage: 'settings.messages.success' })).toEqual({
        type: 'success',
        text: translate('settings.messages.success'),
      });
    });

    it('should resolve an error message', () => {
      expect(resolveReducerMessage({ errorMessage: 'password.messages.error' })?.text).toBe(translate('password.messages.error'));
    });

    it('should give priority to the success message', () => {
      const resolved = resolveReducerMessage({ successMessage: 'a.messages.success', errorMessage: 'b.messages.error' });

      expect(resolved?.text).toBe(translate('a.messages.success'));
    });

    it('should return null when neither message is set', () => {
      expect(resolveReducerMessage({})).toBeNull();
      expect(resolveReducerMessage({ successMessage: null, errorMessage: null })).toBeNull();
    });
  });

  describe('notifyReducerMessages', () => {
    it('should toast a success message and report it as notified', () => {
      expect(notifyReducerMessages({ successMessage: 'settings.messages.success' })).toBe(true);
      expect(toast.success).toHaveBeenCalledWith(translate('settings.messages.success'));
    });

    it('should notify an error message', () => {
      expect(notifyReducerMessages({ errorMessage: 'password.messages.error' })).toBe(true);
      expect(toast.success).toHaveBeenCalledWith(translate('password.messages.error'));
    });

    it('should not toast anything when there is no message', () => {
      expect(notifyReducerMessages({})).toBe(false);
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
