import { useCallback, useEffect, useRef, useState } from 'react';

export interface TabInfo {
  id: number;
  windowId: number;
  url: string;
  title: string;
  favIconUrl?: string;
  active: boolean;
}

export interface TabGroup {
  domain: string;
  tabs: TabInfo[];
  tags: string[];
}

const tabsRefreshDelayMs = 50;

function getTabDomain(urlValue: string): string {
  try {
    const url = new URL(urlValue);
    if (url.protocol === 'chrome:') {
      return 'chrome';
    }
    if (url.protocol === 'edge:') {
      return 'edge';
    }
    return url.hostname;
  } catch (_error) {
    return 'other';
  }
}

function buildTabGroups(tabs: chrome.tabs.Tab[]): TabGroup[] {
  const groupsMap = new Map<string, TabInfo[]>();

  for (const tab of tabs) {
    if (!tab.id || !tab.url) continue;

    const domain = getTabDomain(tab.url);
    const tabInfo: TabInfo = {
      id: tab.id,
      windowId: tab.windowId,
      url: tab.url,
      title: tab.title || tab.url,
      favIconUrl: tab.favIconUrl,
      active: tab.active,
    };

    if (!groupsMap.has(domain)) {
      groupsMap.set(domain, []);
    }
    groupsMap.get(domain)!.push(tabInfo);
  }

  const groups: TabGroup[] = Array.from(groupsMap.entries()).map(
    ([domain, tabs]) => ({
      domain,
      tabs,
      tags: [],
    }),
  );

  groups.sort((a, b) => a.domain.localeCompare(b.domain));
  return groups;
}

function areTabGroupsEqual(left: TabGroup[], right: TabGroup[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((leftGroup, groupIndex) => {
    const rightGroup = right[groupIndex];
    if (
      leftGroup.domain !== rightGroup.domain ||
      leftGroup.tabs.length !== rightGroup.tabs.length
    ) {
      return false;
    }

    return leftGroup.tabs.every((leftTab, tabIndex) => {
      const rightTab = rightGroup.tabs[tabIndex];
      return (
        leftTab.id === rightTab.id &&
        leftTab.windowId === rightTab.windowId &&
        leftTab.url === rightTab.url &&
        leftTab.title === rightTab.title &&
        leftTab.favIconUrl === rightTab.favIconUrl &&
        leftTab.active === rightTab.active
      );
    });
  });
}

export function useTabs() {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(false);
  const isFetchingRef = useRef(false);
  const needsRefreshRef = useRef(false);
  const refreshTimerRef = useRef<number | null>(null);

  const fetchTabs = useCallback(async () => {
    if (isFetchingRef.current) {
      needsRefreshRef.current = true;
      return;
    }

    isFetchingRef.current = true;

    try {
      do {
        needsRefreshRef.current = false;
        const groups = buildTabGroups(await chrome.tabs.query({}));

        if (!isMountedRef.current) {
          return;
        }

        setTabGroups((currentGroups) =>
          areTabGroupsEqual(currentGroups, groups) ? currentGroups : groups,
        );
      } while (needsRefreshRef.current && isMountedRef.current);
    } catch (error) {
      console.error('Failed to fetch tabs:', error);
    } finally {
      isFetchingRef.current = false;
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const scheduleFetchTabs = useCallback(() => {
    if (refreshTimerRef.current !== null) {
      return;
    }

    refreshTimerRef.current = window.setTimeout(() => {
      refreshTimerRef.current = null;
      void fetchTabs();
    }, tabsRefreshDelayMs);
  }, [fetchTabs]);

  useEffect(() => {
    isMountedRef.current = true;
    void fetchTabs();

    const handleTabChanged = () => {
      scheduleFetchTabs();
    };

    chrome.tabs.onUpdated.addListener(handleTabChanged);
    chrome.tabs.onRemoved.addListener(handleTabChanged);
    chrome.tabs.onCreated.addListener(handleTabChanged);

    return () => {
      isMountedRef.current = false;
      if (refreshTimerRef.current !== null) {
        window.clearTimeout(refreshTimerRef.current);
      }
      chrome.tabs.onUpdated.removeListener(handleTabChanged);
      chrome.tabs.onRemoved.removeListener(handleTabChanged);
      chrome.tabs.onCreated.removeListener(handleTabChanged);
    };
  }, [fetchTabs, scheduleFetchTabs]);

  const closeTab = async (tabId: number) => {
    try {
      await chrome.tabs.remove(tabId);
      // fetchTabs will be called by the onRemoved listener
    } catch (error) {
      console.error('Failed to close tab:', error);
    }
  };

  const closeGroup = async (domain: string) => {
    const group = tabGroups.find((g) => g.domain === domain);
    if (group) {
      const tabIds = group.tabs.map((t) => t.id);
      try {
        await chrome.tabs.remove(tabIds);
      } catch (error) {
        console.error('Failed to close group:', error);
      }
    }
  };

  const switchToTab = async (tabId: number, windowId: number) => {
    try {
      await chrome.tabs.update(tabId, { active: true });
      await chrome.windows.update(windowId, { focused: true });
    } catch (error) {
      console.error('Failed to switch to tab:', error);
    }
  };

  return {
    tabGroups,
    loading,
    closeTab,
    closeGroup,
    switchToTab,
    refreshTabs: fetchTabs,
  };
}
