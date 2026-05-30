import { useEffect, useRef, useState } from 'react';
import { Toaster } from 'sonner';
import styled from 'styled-components';
import { AnchorNav } from '../../components/anchor';
import { Clock } from '../../components/clock';
import { SearchBar } from '../../components/search-bar';
import { SettingsPanel } from '../../components/settings-panel';
import { Shortcuts } from '../../components/shortcuts';
import { TabManager } from '../../components/tab-manager';
import { useSettings } from '../../hooks/use-settings';

type ResolvedTheme = 'light' | 'dark';

const AppContainer = styled.div<{
  $theme: ResolvedTheme;
}>`
  width: 100%;
  height: 100dvh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  background-color: var(--background-color, transparent);
  color: ${(props) => (props.$theme === 'light' ? '#0f172a' : '#ffffff')};
  transition: background 0.5s ease;
`;

const BackgroundLayer = styled.div<{
  $bgType: string;
  $bgColor: string;
  $bgGradient: string;
  $bgImage: string;
  $theme: ResolvedTheme;
}>`
  position: absolute;
  inset: 0;
  z-index: 0;
  background-color: ${(props) => {
    if (props.$bgType === 'none') {
      return props.$theme === 'light' ? '#f8fafc' : '#050816';
    }
    return props.$bgType === 'color' ? props.$bgColor : 'transparent';
  }};
  background-image: ${(props) => {
    if (props.$bgType === 'none') {
      if (props.$theme === 'light') {
        return `
          radial-gradient(circle at 18% 18%, rgba(14, 165, 233, 0.16), transparent 28%),
          radial-gradient(circle at 82% 12%, rgba(168, 85, 247, 0.12), transparent 30%),
          radial-gradient(circle at 50% 86%, rgba(20, 184, 166, 0.10), transparent 34%),
          linear-gradient(135deg, #f8fafc 0%, #e0f2fe 52%, #f5f3ff 100%)
        `;
      }
      return `
        radial-gradient(circle at 18% 18%, rgba(56, 189, 248, 0.16), transparent 28%),
        radial-gradient(circle at 82% 12%, rgba(168, 85, 247, 0.14), transparent 30%),
        radial-gradient(circle at 50% 86%, rgba(14, 165, 233, 0.10), transparent 34%),
        linear-gradient(135deg, #050816 0%, #0f172a 52%, #020617 100%)
      `;
    }
    if (props.$bgType === 'gradient') return props.$bgGradient;
    return props.$bgType === 'unsplash' ? `url(${props.$bgImage})` : 'none';
  }};
  background-size: cover;
  background-position: center;
  transition: background 0.5s ease;
`;

const NativeBottomBarMask = styled.div<{
  $theme: ResolvedTheme;
}>`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  height: 22px;
  pointer-events: none;
  background:
    ${(props) =>
      props.$theme === 'light'
        ? 'linear-gradient(to top, rgba(248, 250, 252, 0.88), rgba(248, 250, 252, 0.72))'
        : 'linear-gradient(to top, rgba(17, 10, 6, 0.88), rgba(17, 10, 6, 0.72))'},
    var(--background-color, transparent);
  backdrop-filter: blur(12px);
`;

const PAGES = [
  { id: 0, key: 'home', label: 'Home' },
  { id: 1, key: 'tabs', label: 'Open Tabs' },
];

export default function App() {
  const { settings, updateSettings, loading } = useSettings();
  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return true;
    }

    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [bgImage, _setBgImage] = useState(
    'https://picsum.photos/1920/1080?random',
  );
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const hasRestoredPageRef = useRef(false);
  const persistedPageRef = useRef(settings.activePage);
  const isProgrammaticScrollRef = useRef(false);
  const [activePage, setActivePage] = useState(settings.activePage);
  const resolvedTheme: ResolvedTheme =
    settings.theme === 'system'
      ? systemPrefersDark
        ? 'dark'
        : 'light'
      : settings.theme;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const syncSystemTheme = () => setSystemPrefersDark(mediaQuery.matches);

    syncSystemTheme();
    mediaQuery.addEventListener('change', syncSystemTheme);

    return () => {
      mediaQuery.removeEventListener('change', syncSystemTheme);
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;

    if (resolvedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (loading) {
      return;
    }

    persistedPageRef.current = settings.activePage;
    setActivePage(settings.activePage);
  }, [loading, settings.activePage]);

  useEffect(() => {
    if (loading || hasRestoredPageRef.current) {
      return;
    }

    const root = scrollRootRef.current;
    if (!root) {
      return;
    }

    hasRestoredPageRef.current = true;

    window.requestAnimationFrame(() => {
      const pageIndex = PAGES.findIndex((p) => p.key === settings.activePage);
      const targetIndex = pageIndex === -1 ? 0 : pageIndex;
      root.scrollTo({
        top: targetIndex * root.clientHeight,
        behavior: 'auto',
      });
    });
  }, [loading, settings.activePage]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const root = scrollRootRef.current;
    if (!root) {
      return;
    }

    const syncActivePage = () => {
      if (isProgrammaticScrollRef.current) return;

      const pageIndex = Math.floor(
        (root.scrollTop + root.clientHeight / 2) / root.clientHeight,
      );
      const targetIndex = Math.max(0, Math.min(pageIndex, PAGES.length - 1));
      const nextPage = PAGES[targetIndex]?.key || PAGES[0].key;

      setActivePage((currentPage) =>
        currentPage === nextPage ? currentPage : nextPage,
      );
    };

    syncActivePage();
    root.addEventListener('scroll', syncActivePage, { passive: true });

    return () => {
      root.removeEventListener('scroll', syncActivePage);
    };
  }, [loading]);

  useEffect(() => {
    if (
      loading ||
      !hasRestoredPageRef.current ||
      persistedPageRef.current === activePage
    ) {
      return;
    }

    persistedPageRef.current = activePage;
    updateSettings({ activePage });
  }, [activePage, loading, updateSettings]);

  const scrollToPage = (pageKey: string) => {
    const root = scrollRootRef.current;
    if (!root) {
      return;
    }

    const pageIndex = PAGES.findIndex((p) => p.key === pageKey);
    if (pageIndex === -1) return;

    const nextTop = pageIndex * root.clientHeight;
    setActivePage(pageKey);
    isProgrammaticScrollRef.current = true;
    root.scrollTo({ top: nextTop, behavior: 'smooth' });

    const clearFlag = () => {
      isProgrammaticScrollRef.current = false;
      root.removeEventListener('scrollend', clearFlag);
    };
    root.addEventListener('scrollend', clearFlag, { once: true });
  };

  if (loading) return null;

  return (
    <AppContainer $theme={resolvedTheme}>
      <BackgroundLayer
        $bgType={settings.backgroundType}
        $bgColor={settings.backgroundColor}
        $bgGradient={settings.backgroundGradient}
        $bgImage={bgImage}
        $theme={resolvedTheme}
      >
        <div
          className={`pointer-events-none absolute inset-0 z-0 ${
            resolvedTheme === 'light' ? 'bg-white/10' : 'bg-black/20'
          }`}
        />
      </BackgroundLayer>

      {/* Content wrapper */}
      <div
        id="newtab-scroll-root"
        ref={scrollRootRef}
        className="relative z-10 flex-1 overflow-y-auto overscroll-y-contain snap-y snap-mandatory custom-scrollbar"
      >
        {/* First Screen */}
        <section className="relative h-dvh snap-start snap-always shrink-0 box-border flex flex-col overflow-hidden px-6 pt-[9vh]">
          <div className="relative z-10 mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center">
            <Clock showSeconds={settings.showSeconds} />
            <div className="mt-10 w-full max-w-3xl flex-shrink-0">
              <SearchBar
                engine={settings.searchEngine}
                onEngineChange={(searchEngine) =>
                  updateSettings({ searchEngine })
                }
              />
            </div>
            <div className="mt-6 min-h-0 w-full flex-1">
              <Shortcuts
                shortcuts={settings.shortcuts}
                onUpdate={(shortcuts) => updateSettings({ shortcuts })}
              />
            </div>
          </div>
        </section>

        {/* Second Screen */}
        <section className="relative h-dvh snap-start snap-always shrink-0 box-border flex flex-col px-6 pt-8 pb-6">
          <div className="w-full flex-1 min-h-0 max-w-none mx-auto flex flex-col relative z-10">
            <div className="flex-1 min-h-0">
              <TabManager
                tabsViewMode={settings.tabsViewMode}
                onTabsViewModeChange={(tabsViewMode) =>
                  updateSettings({ tabsViewMode })
                }
                scrollThroughNestedPanels={settings.scrollThroughNestedPanels}
              />
            </div>
          </div>
        </section>
      </div>

      <AnchorNav
        activeId={activePage}
        items={PAGES}
        onSelect={(pageId) => scrollToPage(pageId)}
      />
      <NativeBottomBarMask $theme={resolvedTheme} />
      <SettingsPanel settings={settings} onUpdate={updateSettings} />
      <Toaster richColors theme={resolvedTheme} position="top-center" />
    </AppContainer>
  );
}
