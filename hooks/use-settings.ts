import { useCallback, useEffect, useRef, useState } from 'react';

export interface Shortcut {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface Settings {
  searchEngine: 'google' | 'bing';
  backgroundType: 'color' | 'gradient' | 'unsplash' | 'none';
  backgroundColor: string;
  backgroundGradient: string;
  backgroundGradientFrom: string;
  backgroundGradientVia: string;
  backgroundGradientTo: string;
  theme: 'light' | 'dark' | 'system';
  activePage: string;
  tabsViewMode: 'domain' | 'tag';
  showSeconds: boolean;
  scrollThroughNestedPanels: boolean;
  shortcuts: Shortcut[];
}

const defaultSettings: Settings = {
  searchEngine: 'google',
  backgroundType: 'unsplash',
  backgroundColor: '#0f172a',
  backgroundGradient: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
  backgroundGradientFrom: '#0f172a',
  backgroundGradientVia: '#581c87',
  backgroundGradientTo: '#0f172a',
  theme: 'system',
  activePage: 'home',
  tabsViewMode: 'domain',
  showSeconds: true,
  scrollThroughNestedPanels: true,
  shortcuts: [
    { id: '1', title: 'Rain120', url: 'https://github.com/rain120' },
    {
      id: '2',
      title: 'Daily Phrases',
      url: 'https://daily-phrases.chaosmic.cn',
    },
  ],
};

function normalizeSearchEngine(
  value: unknown,
): Settings['searchEngine'] | undefined {
  if (value === 'google' || value === 'bing') {
    return value;
  }

  return undefined;
}

function normalizeActivePage(
  value: unknown,
): Settings['activePage'] | undefined {
  if (typeof value === 'string') {
    return value;
  }

  return undefined;
}

function normalizeTabsViewMode(
  value: unknown,
): Settings['tabsViewMode'] | undefined {
  if (value === 'domain' || value === 'tag') {
    return value;
  }

  return undefined;
}

function normalizeTheme(value: unknown): Settings['theme'] | undefined {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }

  return undefined;
}

function normalizeBackgroundType(
  value: unknown,
): Settings['backgroundType'] | undefined {
  if (
    value === 'color' ||
    value === 'gradient' ||
    value === 'unsplash' ||
    value === 'none'
  ) {
    return value;
  }

  return undefined;
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeColor(value: unknown, fallback: string): string {
  return typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)
    ? value
    : fallback;
}

function buildBackgroundGradient(
  from: string,
  via: string,
  to: string,
): string {
  return `linear-gradient(135deg, ${from}, ${via}, ${to})`;
}

function normalizeSettings(value: Partial<Settings> | undefined): Settings {
  const backgroundGradientFrom = normalizeColor(
    value?.backgroundGradientFrom,
    defaultSettings.backgroundGradientFrom,
  );
  const backgroundGradientVia = normalizeColor(
    value?.backgroundGradientVia,
    defaultSettings.backgroundGradientVia,
  );
  const backgroundGradientTo = normalizeColor(
    value?.backgroundGradientTo,
    defaultSettings.backgroundGradientTo,
  );

  return {
    ...defaultSettings,
    ...value,
    backgroundType:
      normalizeBackgroundType(value?.backgroundType) ??
      defaultSettings.backgroundType,
    backgroundColor: normalizeColor(
      value?.backgroundColor,
      defaultSettings.backgroundColor,
    ),
    backgroundGradient: buildBackgroundGradient(
      backgroundGradientFrom,
      backgroundGradientVia,
      backgroundGradientTo,
    ),
    backgroundGradientFrom,
    backgroundGradientVia,
    backgroundGradientTo,
    searchEngine:
      normalizeSearchEngine(value?.searchEngine) ??
      defaultSettings.searchEngine,
    activePage:
      normalizeActivePage(value?.activePage) ?? defaultSettings.activePage,
    tabsViewMode:
      normalizeTabsViewMode(value?.tabsViewMode) ??
      defaultSettings.tabsViewMode,
    theme: normalizeTheme(value?.theme) ?? defaultSettings.theme,
    showSeconds: normalizeBoolean(
      value?.showSeconds,
      defaultSettings.showSeconds,
    ),
    scrollThroughNestedPanels: normalizeBoolean(
      value?.scrollThroughNestedPanels,
      defaultSettings.scrollThroughNestedPanels,
    ),
  };
}

function areSettingsEqual(left: Settings, right: Settings): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      try {
        const raw = localStorage.getItem('newtab_settings');
        if (raw) {
          return normalizeSettings(JSON.parse(raw) as Partial<Settings>);
        }
      } catch {
        // ignore
      }
    }
    return defaultSettings;
  });
  const [loading, setLoading] = useState(
    () => typeof chrome !== 'undefined' && !!chrome.storage,
  );
  const settingsRef = useRef(settings);

  const applySettings = useCallback((nextSettings: Settings) => {
    setSettings((currentSettings) => {
      if (areSettingsEqual(currentSettings, nextSettings)) {
        settingsRef.current = currentSettings;
        return currentSettings;
      }

      settingsRef.current = nextSettings;
      return nextSettings;
    });
  }, []);

  useEffect(() => {
    if (typeof chrome === 'undefined' || !chrome.storage) {
      return;
    }

    // Load initial settings
    chrome.storage.local.get(['newtab_settings'], (result) => {
      if (result.newtab_settings) {
        applySettings(
          normalizeSettings(result.newtab_settings as Partial<Settings>),
        );
      }
      setLoading(false);
    });

    // Listen for changes
    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === 'local' && changes.newtab_settings) {
        const nextSettings =
          (changes.newtab_settings.newValue as Partial<Settings> | undefined) ??
          {};
        applySettings(normalizeSettings(nextSettings));
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, [applySettings]);

  const updateSettings = useCallback((newSettings: Partial<Settings>) => {
    const updated = normalizeSettings({
      ...settingsRef.current,
      ...newSettings,
    });

    if (areSettingsEqual(settingsRef.current, updated)) {
      return;
    }

    settingsRef.current = updated;
    setSettings(updated);

    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.set({ newtab_settings: updated });
    } else {
      try {
        localStorage.setItem('newtab_settings', JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  }, []);

  return { settings, updateSettings, loading };
}
