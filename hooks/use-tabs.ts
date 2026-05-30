import { useCallback, useEffect, useState } from 'react';

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

export function useTabs() {
  const [tabGroups, setTabGroups] = useState<TabGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTabs = useCallback(async () => {
    try {
      const tabs = await chrome.tabs.query({});

      const groupsMap = new Map<string, TabInfo[]>();

      for (const tab of tabs) {
        if (!tab.id || !tab.url) continue;

        // Skip extension pages and new tab pages if desired, but user might want to see them.
        // Let's filter out chrome:// and edge:// maybe? Or just keep all.
        // To group by domain:
        let domain = 'other';
        try {
          const url = new URL(tab.url);
          if (url.protocol === 'chrome:') {
            domain = 'chrome';
          } else if (url.protocol === 'edge:') {
            domain = 'edge';
          } else {
            domain = url.hostname;
          }
        } catch (_e) {
          // Invalid URL
          domain = 'other';
        }

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

      // Sort groups by number of tabs (descending)
      groups.sort((a, b) => b.tabs.length - a.tabs.length);

      setTabGroups(groups);
    } catch (error) {
      console.error('Failed to fetch tabs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTabs();

    // Listen to tab changes
    const handleTabUpdated = () => {
      fetchTabs();
    };
    const handleTabRemoved = () => {
      fetchTabs();
    };
    const handleTabCreated = () => {
      fetchTabs();
    };

    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    chrome.tabs.onCreated.addListener(handleTabCreated);

    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabUpdated);
      chrome.tabs.onRemoved.removeListener(handleTabRemoved);
      chrome.tabs.onCreated.removeListener(handleTabCreated);
    };
  }, [fetchTabs]);

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
