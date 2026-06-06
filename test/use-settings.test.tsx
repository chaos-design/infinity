import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { useSettings } from '../hooks/use-settings';

describe('useSettings tabs view mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defaults invalid tabsViewMode to domain mode', async () => {
    (chrome.storage.local.get as Mock).mockImplementation(
      (_keys: unknown, callback: (value: unknown) => void) => {
        callback({
          newtab_settings: {
            tabsViewMode: 'invalid',
          },
        });
      },
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.tabsViewMode).toBe('domain');
  });

  it('defaults invalid theme and background type to safe settings', async () => {
    (chrome.storage.local.get as Mock).mockImplementation(
      (_keys: unknown, callback: (value: unknown) => void) => {
        callback({
          newtab_settings: {
            theme: 'neon',
            backgroundType: 'video',
          },
        });
      },
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.settings.theme).toBe('system');
    expect(result.current.settings.backgroundType).toBe('unsplash');
  });

  it('persists tag mode in local settings', async () => {
    (chrome.storage.local.get as Mock).mockImplementation(
      (_keys: unknown, callback: (value: unknown) => void) => {
        callback({
          newtab_settings: {
            tabsViewMode: 'domain',
          },
        });
      },
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.updateSettings({ tabsViewMode: 'tag' });
    });

    await waitFor(() =>
      expect(result.current.settings.tabsViewMode).toBe('tag'),
    );
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        newtab_settings: expect.objectContaining({ tabsViewMode: 'tag' }),
      }),
    );
  });

  it('does not persist when settings are unchanged', async () => {
    (chrome.storage.local.get as Mock).mockImplementation(
      (_keys: unknown, callback: (value: unknown) => void) => {
        callback({
          newtab_settings: {
            tabsViewMode: 'domain',
          },
        });
      },
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.updateSettings({ tabsViewMode: 'domain' });
    });

    expect(chrome.storage.local.set).not.toHaveBeenCalled();
  });

  it('keeps the same settings reference for duplicate storage broadcasts', async () => {
    (chrome.storage.local.get as Mock).mockImplementation(
      (_keys: unknown, callback: (value: unknown) => void) => {
        callback({
          newtab_settings: {
            tabsViewMode: 'domain',
          },
        });
      },
    );

    const { result } = renderHook(() => useSettings());

    await waitFor(() => expect(result.current.loading).toBe(false));
    const currentSettings = result.current.settings;
    const listener = (chrome.storage.onChanged.addListener as Mock).mock
      .calls[0][0];

    act(() => {
      listener(
        {
          newtab_settings: {
            newValue: currentSettings,
          },
        },
        'local',
      );
    });

    expect(result.current.settings).toBe(currentSettings);
  });
});
