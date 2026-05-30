import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useTabs } from '../hooks/use-tabs';

describe('useTabs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and group tabs correctly (positive case)', async () => {
    const mockTabs = [
      {
        id: 1,
        windowId: 1,
        url: 'https://example.com/page1',
        title: 'Example 1',
        active: false,
      },
      {
        id: 2,
        windowId: 1,
        url: 'https://example.com/page2',
        title: 'Example 2',
        active: false,
      },
      {
        id: 3,
        windowId: 1,
        url: 'https://test.com/page',
        title: 'Test',
        active: false,
      },
    ];

    (global.chrome.tabs.query as any).mockResolvedValue(mockTabs);

    const { result } = renderHook(() => useTabs());

    expect(result.current.loading).toBe(true);

    // Wait for the async fetch to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.tabGroups).toHaveLength(2);

    // Ordered by count descending
    expect(result.current.tabGroups[0].domain).toBe('example.com');
    expect(result.current.tabGroups[0].tabs).toHaveLength(2);
    expect(result.current.tabGroups[1].domain).toBe('test.com');
    expect(result.current.tabGroups[1].tabs).toHaveLength(1);
  });

  it('should handle invalid urls or chrome/edge pages (boundary case)', async () => {
    const mockTabs = [
      {
        id: 1,
        windowId: 1,
        url: 'chrome://newtab',
        title: 'New Tab',
        active: false,
      },
      {
        id: 2,
        windowId: 1,
        url: 'edge://settings',
        title: 'Settings',
        active: false,
      },
      {
        id: 3,
        windowId: 1,
        url: 'invalid-url',
        title: 'Invalid',
        active: false,
      },
      { id: 4, windowId: 1, url: undefined, title: 'No URL', active: false },
      {
        id: undefined,
        windowId: 1,
        url: 'https://test.com',
        title: 'No ID',
        active: false,
      },
    ];

    (global.chrome.tabs.query as any).mockResolvedValue(mockTabs);

    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.tabGroups).toHaveLength(3);

    const domains = result.current.tabGroups.map((g) => g.domain);
    expect(domains).toContain('chrome');
    expect(domains).toContain('edge');
    expect(domains).toContain('other'); // for invalid-url
  });

  it('should handle empty tabs gracefully', async () => {
    (global.chrome.tabs.query as any).mockResolvedValue([]);

    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.tabGroups).toHaveLength(0);
  });

  it('should handle errors in fetchTabs gracefully (negative case)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.chrome.tabs.query as any).mockRejectedValue(
      new Error('Query failed'),
    );

    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.tabGroups).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to fetch tabs:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it('should close a single tab', async () => {
    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await result.current.closeTab(1);
    });

    expect(global.chrome.tabs.remove).toHaveBeenCalledWith(1);
  });

  it('should handle error when closing a single tab', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.chrome.tabs.remove as any).mockRejectedValueOnce(
      new Error('Remove failed'),
    );

    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await result.current.closeTab(1);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should close a group of tabs', async () => {
    const mockTabs = [
      { id: 1, windowId: 1, url: 'https://example.com/page1' },
      { id: 2, windowId: 1, url: 'https://example.com/page2' },
    ];
    (global.chrome.tabs.query as any).mockResolvedValue(mockTabs);

    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.closeGroup('example.com');
    });

    expect(global.chrome.tabs.remove).toHaveBeenCalledWith([1, 2]);
  });

  it('should handle error when closing a group of tabs', async () => {
    const mockTabs = [{ id: 1, windowId: 1, url: 'https://example.com/page1' }];
    (global.chrome.tabs.query as any).mockResolvedValue(mockTabs);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.chrome.tabs.remove as any).mockRejectedValueOnce(
      new Error('Remove failed'),
    );

    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    await act(async () => {
      await result.current.closeGroup('example.com');
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should switch to a tab', async () => {
    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await result.current.switchToTab(1, 2);
    });

    expect(global.chrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
    expect(global.chrome.windows.update).toHaveBeenCalledWith(2, {
      focused: true,
    });
  });

  it('should handle error when switching to a tab', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (global.chrome.tabs.update as any).mockRejectedValueOnce(
      new Error('Update failed'),
    );

    const { result } = renderHook(() => useTabs());

    await act(async () => {
      await result.current.switchToTab(1, 2);
    });

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should refetch on chrome events', async () => {
    const { result } = renderHook(() => useTabs());

    // Clear initial fetch count
    (global.chrome.tabs.query as any).mockClear();

    // Get the listeners
    const onUpdated = (global.chrome.tabs.onUpdated.addListener as any).mock
      .calls[0][0];
    const onRemoved = (global.chrome.tabs.onRemoved.addListener as any).mock
      .calls[0][0];
    const onCreated = (global.chrome.tabs.onCreated.addListener as any).mock
      .calls[0][0];

    await act(async () => {
      onUpdated();
      onRemoved();
      onCreated();
    });

    expect(global.chrome.tabs.query).toHaveBeenCalledTimes(3);
  });
});
