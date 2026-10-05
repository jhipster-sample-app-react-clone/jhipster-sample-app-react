import { beforeEach, describe, expect, it, vi } from 'vitest';
import { translate } from 'react-jhipster';

import { renderHook } from '@testing-library/react';
import { toast } from 'react-toastify';

import { useReducerMessages } from './use-reducer-messages';

vi.mock('react-toastify', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('useReducerMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not toast anything when there is no message', () => {
    renderHook(() => useReducerMessages({}));

    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('should toast a success message once', () => {
    renderHook(() => useReducerMessages({ successMessage: 'password.messages.success' }));

    expect(toast.success).toHaveBeenCalledTimes(1);
    expect(toast.success).toHaveBeenCalledWith(translate('password.messages.success'));
  });

  it('should notify the caller once a message has been shown', () => {
    const onNotified = vi.fn();

    renderHook(() => useReducerMessages({ successMessage: 'password.messages.success' }, onNotified));

    expect(onNotified).toHaveBeenCalledTimes(1);
  });

  it('should not notify the caller when there is no message', () => {
    const onNotified = vi.fn();

    renderHook(() => useReducerMessages({}, onNotified));

    expect(onNotified).not.toHaveBeenCalled();
  });
});
