import {
  BookOpen,
  BriefcaseBusiness,
  Edit3,
  ExternalLink,
  Gamepad2,
  Globe,
  Home,
  Plus,
  Search,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useTabs } from '../hooks/use-tabs';
import { useTags } from '../hooks/use-tags';
import {
  buildDomainTagData,
  buildTagContainersFromDomainData,
} from '../lib/tag-relations';
import { DEFAULT_UNCATEGORIZED_TAG } from '../lib/tag-storage';
import { TAG_ICONS, type TagIconName, TagInput } from './tag-input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';

interface TabManagerProps {
  onOpenBatchTag?: () => void;
  scrollThroughNestedPanels?: boolean;
  tabsViewMode?: 'domain' | 'tag';
  onTabsViewModeChange?: (mode: 'domain' | 'tag') => void;
}

interface ScrollDampingProfile {
  inputMultiplier: number;
  stepMultiplier: number;
  decay: number;
  maxVelocity: number;
}

type ScrollDampingTarget = 'root' | 'panel' | 'card';

const defaultTagOptions = [
  { label: '学习', icon: BookOpen, iconName: 'BookOpen' as const },
  {
    label: '工作',
    icon: BriefcaseBusiness,
    iconName: 'BriefcaseBusiness' as const,
  },
  { label: '生活', icon: Home, iconName: 'Home' as const },
  { label: '娱乐', icon: Gamepad2, iconName: 'Gamepad2' as const },
] as const;

const defaultTagSet = new Set<string>(
  defaultTagOptions.map((option) => option.label),
);

const horizontalGestureBias = 1.15;
const pageSwitchIntentThreshold = 420;
const pageSwitchIntentMinDelta = 90;
const pageSwitchIntentTimeoutMs = 280;

const rootScrollDamping: ScrollDampingProfile = {
  inputMultiplier: 0.12,
  stepMultiplier: 0.9,
  decay: 0.78,
  maxVelocity: 96,
};

const panelScrollDamping: ScrollDampingProfile = {
  inputMultiplier: 0.1,
  stepMultiplier: 0.66,
  decay: 0.8,
  maxVelocity: 72,
};

const cardScrollDamping: ScrollDampingProfile = {
  inputMultiplier: 0.36,
  stepMultiplier: 0.42,
  decay: 0.82,
  maxVelocity: 240,
};

export function TabManager({
  scrollThroughNestedPanels = true,
  tabsViewMode = 'domain',
  onTabsViewModeChange,
}: TabManagerProps) {
  const { tabGroups, loading, closeTab, closeGroup, switchToTab } = useTabs();
  const {
    domainTagsMap,
    addDomainTag,
    removeDomainTag,
    updateDomainTag,
    addDomainTagToMany,
    setDomainPrimaryTag = () => {},
    renameGlobalTag = () => {},
    removeGlobalTag = () => {},
  } = useTags();

  const enrichedGroups = useMemo(
    () =>
      tabGroups.map((group) => ({
        ...group,
        tags: domainTagsMap[group.domain] || [],
        tagLabels:
          (domainTagsMap[group.domain] || []).length > 0
            ? (domainTagsMap[group.domain] || []).map((tag) => tag.label)
            : [DEFAULT_UNCATEGORIZED_TAG],
      })),
    [tabGroups, domainTagsMap],
  );

  const [selectedDomains, setSelectedDomains] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('tabManager_selectedDomains');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [selectedTags, setSelectedTags] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem('tabManager_selectedTags');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'tabManager_selectedDomains',
      JSON.stringify(selectedDomains),
    );
  }, [selectedDomains]);

  useEffect(() => {
    localStorage.setItem(
      'tabManager_selectedTags',
      JSON.stringify(selectedTags),
    );
  }, [selectedTags]);

  const [domainQuery, setDomainQuery] = useState('');
  const [domainTagInputOpen, setDomainTagInputOpen] = useState<string | null>(
    null,
  );
  const [editingTag, setEditingTag] = useState<{
    domain: string;
    tagId: string;
  } | null>(null);
  const [pendingCloseDomain, setPendingCloseDomain] = useState<string | null>(
    null,
  );
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isBatchTagDialogOpen, setIsBatchTagDialogOpen] = useState(false);
  const [editingGlobalTag, setEditingGlobalTag] = useState<string | null>(null);
  const [draggingDomain, setDraggingDomain] = useState<string | null>(null);
  const [dragOverTagLabel, setDragOverTagLabel] = useState<string | null>(null);
  const [batchDomainQuery, setBatchDomainQuery] = useState('');
  const [batchSelectedDomains, setBatchSelectedDomains] = useState<string[]>(
    [],
  );
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const rootScrollTargetRef = useRef<HTMLElement | null>(null);
  const rootScrollFrameRef = useRef<number | null>(null);
  const rootScrollVelocityRef = useRef(0);
  const rootScrollDirectionRef = useRef(0);
  const dampingProfileRef = useRef(rootScrollDamping);
  const pageSwitchIntentRef = useRef(0);
  const pageSwitchIntentDirectionRef = useRef(0);
  const pageSwitchIntentLastAtRef = useRef(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (rootScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(rootScrollFrameRef.current);
      }
    };
  }, []);

  // The useEffect for ensureDefaultTagForDomains has been removed.

  const normalizedDomainQuery = domainQuery.trim().toLowerCase();
  const searchableGroups = normalizedDomainQuery
    ? enrichedGroups.filter((group) =>
        group.domain.toLowerCase().includes(normalizedDomainQuery),
      )
    : enrichedGroups;

  const domainFilteredGroups = searchableGroups.filter((group) => {
    if (selectedDomains.length === 0) return true;
    return selectedDomains.includes(group.domain);
  });

  const filteredGroups = domainFilteredGroups
    .map((group) => {
      if (selectedTags.length === 0) {
        return group;
      }

      if (selectedTags.some((tag) => group.tagLabels.includes(tag))) {
        return group;
      }

      return null;
    })
    .filter(
      (group): group is (typeof enrichedGroups)[number] => group !== null,
    );

  const filterableTagState = (() => {
    const tagSet = new Set<string>();
    const domainBoundTagSet = new Set<string>();
    for (const group of domainFilteredGroups) {
      if (tabsViewMode === 'tag' && group.tags.length === 0) {
        tagSet.add(DEFAULT_UNCATEGORIZED_TAG);
        domainBoundTagSet.add(DEFAULT_UNCATEGORIZED_TAG);
      }
      for (const tag of group.tags) {
        if (
          tabsViewMode === 'domain' &&
          tag.label === DEFAULT_UNCATEGORIZED_TAG
        ) {
          continue;
        }
        tagSet.add(tag.label);
        domainBoundTagSet.add(tag.label);
      }
    }
    for (const option of defaultTagOptions) {
      tagSet.add(option.label);
    }
    return {
      domainBoundTagSet,
      tags: Array.from(tagSet).sort((a, b) => {
        const aIsDefault = defaultTagSet.has(a);
        const bIsDefault = defaultTagSet.has(b);
        if (aIsDefault && !bIsDefault) return -1;
        if (!aIsDefault && bIsDefault) return 1;
        return a.localeCompare(b);
      }),
    };
  })();
  const filterableTags = filterableTagState.tags;
  const domainBoundTagSet = filterableTagState.domainBoundTagSet;

  const labelIconMap = useMemo(() => {
    const iconMap: Record<string, TagIconName | undefined> = {};
    for (const tags of Object.values(domainTagsMap)) {
      for (const tag of tags) {
        if (!iconMap[tag.label] && tag.iconName) {
          iconMap[tag.label] = tag.iconName;
        }
      }
    }
    return iconMap;
  }, [domainTagsMap]);

  const batchSelectableGroups = useMemo(
    () => [...enrichedGroups].sort((a, b) => a.domain.localeCompare(b.domain)),
    [enrichedGroups],
  );

  const filteredBatchGroups = useMemo(() => {
    const normalizedQuery = batchDomainQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return batchSelectableGroups;
    }
    return batchSelectableGroups.filter((group) =>
      group.domain.toLowerCase().includes(normalizedQuery),
    );
  }, [batchDomainQuery, batchSelectableGroups]);

  const actionableBatchSelectedDomains = useMemo(() => {
    const visibleBatchDomains = new Set(
      filteredBatchGroups.map((group) => group.domain),
    );
    return batchSelectedDomains.filter((domain) =>
      visibleBatchDomains.has(domain),
    );
  }, [batchSelectedDomains, filteredBatchGroups]);

  const [columnCount, setColumnCount] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      if (window.innerWidth > 1350) {
        setColumnCount(4);
      } else if (window.innerWidth >= 1100) {
        setColumnCount(3);
      } else if (window.innerWidth >= 800) {
        setColumnCount(2);
      } else {
        setColumnCount(1);
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  const masonryColumns = useMemo(() => {
    const cols: (typeof filteredGroups)[] = Array.from(
      { length: columnCount },
      () => [],
    );
    filteredGroups.forEach((group, index) => {
      cols[index % columnCount].push(group);
    });
    return cols;
  }, [filteredGroups, columnCount]);

  const tagBoardContainers = useMemo(() => {
    const domainTagData = buildDomainTagData(
      filteredGroups.map((group) => group.domain),
      domainTagsMap,
    );
    const groupLookup = new Map(
      filteredGroups.map((group) => [group.domain, group]),
    );

    return buildTagContainersFromDomainData(domainTagData).map((container) => {
      const groups = container.origin
        .map((domain) => groupLookup.get(domain))
        .filter((group): group is (typeof filteredGroups)[number] =>
          Boolean(group),
        );

      groups.sort((a, b) => {
        const aTags = domainTagsMap[a.domain] || [];
        const bTags = domainTagsMap[b.domain] || [];
        const aPrimary = aTags[0];
        const bPrimary = bTags[0];
        const aTime = aPrimary?.updatedAt || 0;
        const bTime = bPrimary?.updatedAt || 0;

        if (aTime !== bTime) {
          return bTime - aTime;
        }
        return a.domain.localeCompare(b.domain);
      });

      return {
        ...container,
        groups,
      };
    });
  }, [domainTagsMap, filteredGroups]);

  const isHorizontalWheelGesture = useCallback(
    (deltaX: number, deltaY: number) => {
      const absX = Math.abs(deltaX);
      const absY = Math.abs(deltaY);
      return absX > 0 && absX >= absY * horizontalGestureBias;
    },
    [],
  );

  const resetPageSwitchIntent = useCallback(() => {
    pageSwitchIntentRef.current = 0;
    pageSwitchIntentDirectionRef.current = 0;
    pageSwitchIntentLastAtRef.current = 0;
  }, []);

  const shouldForwardPageScroll = useCallback(
    (deltaY: number) => {
      const direction = Math.sign(deltaY);
      const absDelta = Math.abs(deltaY);
      if (direction === 0 || absDelta < pageSwitchIntentMinDelta) {
        resetPageSwitchIntent();
        return false;
      }

      const now = Date.now();
      if (
        pageSwitchIntentDirectionRef.current !== 0 &&
        pageSwitchIntentDirectionRef.current !== direction
      ) {
        resetPageSwitchIntent();
      }

      if (
        pageSwitchIntentLastAtRef.current > 0 &&
        now - pageSwitchIntentLastAtRef.current > pageSwitchIntentTimeoutMs
      ) {
        resetPageSwitchIntent();
      }

      pageSwitchIntentDirectionRef.current = direction;
      pageSwitchIntentLastAtRef.current = now;
      pageSwitchIntentRef.current = Math.min(
        pageSwitchIntentThreshold,
        pageSwitchIntentRef.current + absDelta,
      );

      return pageSwitchIntentRef.current >= pageSwitchIntentThreshold;
    },
    [resetPageSwitchIntent],
  );

  const applyDampedScroll = useCallback(
    (
      target: HTMLElement,
      deltaY: number,
      dampingTarget: ScrollDampingTarget,
    ) => {
      rootScrollTargetRef.current = target;

      if (dampingTarget === 'root' || target.id === 'newtab-scroll-root') {
        dampingProfileRef.current = rootScrollDamping;
      } else if (dampingTarget === 'panel') {
        dampingProfileRef.current = panelScrollDamping;
      } else {
        dampingProfileRef.current = cardScrollDamping;
      }

      const profile = dampingProfileRef.current;
      const direction = Math.sign(deltaY);
      if (
        direction !== 0 &&
        rootScrollDirectionRef.current !== 0 &&
        direction !== rootScrollDirectionRef.current
      ) {
        rootScrollVelocityRef.current = 0;
      }
      if (direction !== 0) {
        rootScrollDirectionRef.current = direction;
      }
      const nextVelocity =
        rootScrollVelocityRef.current + deltaY * profile.inputMultiplier;
      rootScrollVelocityRef.current = Math.max(
        -profile.maxVelocity,
        Math.min(profile.maxVelocity, nextVelocity),
      );

      if (rootScrollFrameRef.current !== null) {
        return;
      }

      const tick = () => {
        const scrollTarget = rootScrollTargetRef.current;
        const velocity = rootScrollVelocityRef.current;

        if (!scrollTarget || Math.abs(velocity) < 0.28) {
          rootScrollVelocityRef.current = 0;
          rootScrollFrameRef.current = null;
          return;
        }

        scrollTarget.scrollBy({
          top: velocity * dampingProfileRef.current.stepMultiplier,
          behavior: 'auto',
        });
        rootScrollVelocityRef.current *= dampingProfileRef.current.decay;
        rootScrollFrameRef.current = window.requestAnimationFrame(tick);
      };

      rootScrollFrameRef.current = window.requestAnimationFrame(tick);
    },
    [],
  );

  const forwardWheelToPage = (
    event: React.WheelEvent<HTMLElement>,
    dampingTarget: ScrollDampingTarget = 'panel',
  ) => {
    if (isHorizontalWheelGesture(event.deltaX, event.deltaY)) {
      return;
    }

    const container = event.currentTarget;
    const canScroll = container.scrollHeight > container.clientHeight + 1;
    const root = document.getElementById('newtab-scroll-root');

    if (!canScroll) {
      if (scrollThroughNestedPanels && root) {
        if (shouldForwardPageScroll(event.deltaY)) {
          applyDampedScroll(root, event.deltaY, 'root');
        }
        event.preventDefault();
      } else {
        resetPageSwitchIntent();
      }
      return;
    }

    const isAtTop = container.scrollTop <= 0;
    const isAtBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 1;

    if ((isAtTop && event.deltaY < 0) || (isAtBottom && event.deltaY > 0)) {
      if (scrollThroughNestedPanels && root) {
        if (shouldForwardPageScroll(event.deltaY)) {
          applyDampedScroll(root, event.deltaY, 'root');
        }
      } else {
        resetPageSwitchIntent();
        applyDampedScroll(container, event.deltaY, dampingTarget);
      }
      event.preventDefault();
      return;
    }

    resetPageSwitchIntent();
    applyDampedScroll(container, event.deltaY, dampingTarget);
    event.preventDefault();
  };

  const handleTagBoardWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (!isHorizontalWheelGesture(event.deltaX, event.deltaY)) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.scrollBy({
      left: event.deltaX,
      behavior: 'auto',
    });
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-white/50">Loading tabs...</div>
    );
  }

  if (enrichedGroups.length === 0) {
    return null;
  }

  const visibleTabs = filteredGroups.reduce(
    (sum, group) => sum + group.tabs.length,
    0,
  );

  const clearFilters = () => {
    setSelectedDomains([]);
    setSelectedTags([]);
    setDomainQuery('');
  };

  const closeBatchDialog = () => {
    setIsBatchTagDialogOpen(false);
    setBatchDomainQuery('');
    setBatchSelectedDomains([]);
  };

  const toggleBatchDomain = (domain: string) => {
    setBatchSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((currentDomain) => currentDomain !== domain)
        : [...prev, domain],
    );
  };

  const notifySuccess = (title: string, description?: string) => {
    toast(title, { description });
  };

  const handleBatchAddTag = (
    domains: string[],
    tag: string,
    iconName?: TagIconName,
  ) => {
    if (domains.length === 0) {
      return;
    }

    addDomainTagToMany(domains, tag, iconName, tabsViewMode === 'tag');
    notifySuccess(
      '批量标签已添加',
      `已为 ${domains.length} 个域名添加「${tag}」`,
    );
    closeBatchDialog();
  };

  const getTagIcon = (tag: string, iconName?: TagIconName) => {
    if (iconName && TAG_ICONS[iconName]) {
      return TAG_ICONS[iconName];
    }

    const tagMeta = defaultTagOptions.find((option) => option.label === tag);
    if (tagMeta) return tagMeta.icon;
    const mappedIconName = labelIconMap[tag];
    if (mappedIconName && TAG_ICONS[mappedIconName]) {
      return TAG_ICONS[mappedIconName];
    }
    return Tag;
  };

  return (
    <Dialog
      open={pendingCloseDomain !== null}
      onOpenChange={(open) => {
        if (!open) {
          setPendingCloseDomain(null);
        }
      }}
    >
      <div className="relative h-full min-h-0 w-full">
        <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-white/10 bg-black/15 p-4 outline-none backdrop-blur-xl shadow-[0_24px_64px_rgba(0,0,0,0.18)] md:p-4 xl:p-5">
          <div className="mb-3 flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:justify-between">
            <div className="flex min-w-0 flex-col gap-1 min-[900px]:flex-1 min-[1351px]:flex-row min-[1351px]:items-baseline min-[1351px]:gap-x-3">
              <h2 className="text-2xl font-semibold leading-none text-white min-[1351px]:text-[28px]">
                Open Tabs
              </h2>
              <p className="min-w-0 text-xs leading-5 text-white/55 min-[1351px]:flex-1 min-[1351px]:truncate min-[1351px]:text-sm">
                智能按域名聚合，采用符合自然阅读顺序的紧凑瀑布流布局；独创域名维度的私有标签体系，让筛选与管理更轻量、更专业。
              </p>
            </div>
            <div className="flex w-full flex-nowrap items-center gap-2 overflow-hidden min-[900px]:w-auto">
              <div className="inline-flex justify-self-start rounded-full border border-white/10 bg-white/6 p-1 text-xs text-white/70">
                {[
                  { value: 'domain', icon: Globe, label: '域名视图' },
                  { value: 'tag', icon: Tag, label: '标签视图' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      onTabsViewModeChange?.(option.value as 'domain' | 'tag')
                    }
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                      tabsViewMode === option.value
                        ? 'bg-white text-black'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    aria-label={option.label}
                    title={option.label}
                  >
                    <option.icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsBatchTagDialogOpen(true)}
                className="inline-flex min-w-0 justify-self-start items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-white/80 transition-colors hover:bg-white/10 min-[900px]:gap-2 min-[900px]:px-4 min-[900px]:text-sm"
              >
                <Plus className="h-4 w-4 text-white/65" />
                <span className="truncate">批量加标签</span>
              </button>
              <div className="flex min-w-0 max-w-[48%] items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 min-[900px]:max-w-none min-[900px]:gap-2 min-[900px]:px-4 min-[900px]:text-sm">
                <Sparkles className="h-4 w-4 text-white/60" />
                <span className="truncate">
                  {filteredGroups.length} 个分组 / {visibleTabs} Tabs
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-30 mb-3" ref={searchContainerRef}>
            <div
              className={`flex flex-wrap items-center gap-1.5 border px-3 py-2 backdrop-blur-md transition-all ${
                isSearchOpen
                  ? 'rounded-t-[14px] border-white/10 border-b-transparent bg-[#2c2c2e]/95'
                  : 'rounded-lg border-white/10 bg-white/[0.04]'
              }`}
            >
              <Search className="mr-1 h-4 w-4 flex-shrink-0 text-white/50" />

              {selectedDomains.map((domain) => (
                <div
                  key={domain}
                  className="flex flex-shrink-0 items-center gap-1 rounded-full bg-white/15 py-0.5 pl-2 pr-1 text-[11px] text-white"
                >
                  <Globe className="h-3 w-3 opacity-70" />
                  <span className="max-w-[150px] truncate">{domain}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedDomains((prev) =>
                        prev.filter((d) => d !== domain),
                      );
                    }}
                    className="ml-0.5 h-4 w-4 rounded-full p-0 hover:bg-white/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              {selectedTags.map((tag) => (
                <div
                  key={tag}
                  className="flex flex-shrink-0 items-center gap-1 rounded-full bg-white/15 py-0.5 pl-2 pr-1 text-[11px] text-white"
                >
                  {(() => {
                    const Icon = getTagIcon(tag);
                    return Icon ? (
                      <Icon className="h-3 w-3 opacity-70" />
                    ) : (
                      <Tag className="h-3 w-3 opacity-70" />
                    );
                  })()}
                  <span className="max-w-[100px] truncate">{tag}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTags((prev) => prev.filter((t) => t !== tag));
                    }}
                    className="ml-0.5 h-4 w-4 rounded-full p-0 hover:bg-white/20"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}

              <Input
                type="text"
                value={domainQuery}
                onChange={(event) => setDomainQuery(event.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                onClick={() => setIsSearchOpen(true)}
                className="h-auto min-w-[100px] flex-1 border-0 bg-transparent p-0 text-xs text-white shadow-none placeholder:text-white/35 focus-visible:ring-0"
                placeholder="搜索域名或选择标签..."
              />
              {(domainQuery ||
                selectedDomains.length > 0 ||
                selectedTags.length > 0) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearFilters();
                  }}
                  className="h-6 w-6 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white/80"
                  title="清空"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {isSearchOpen && (
              <div className="absolute left-0 right-0 top-full flex flex-col gap-3 rounded-b-[14px] border border-t-0 border-white/10 bg-[#2c2c2e]/95 p-3 backdrop-blur-xl shadow-2xl">
                <div className="grid gap-3 xl:grid-cols-[7fr_3fr]">
                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs text-white/65">
                      <Globe className="h-3.5 w-3.5 flex-shrink-0 text-white/50" />
                      <span>域名筛选</span>
                    </div>
                    <div
                      className="flex max-h-36 flex-wrap items-start gap-1.5 overflow-y-auto pr-2 pt-1 custom-scrollbar"
                      onWheel={(e) => forwardWheelToPage(e, 'panel')}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSelectedDomains([])}
                        className={`h-auto rounded-full px-2.5 py-0.5 text-[11px] ${
                          selectedDomains.length === 0
                            ? 'bg-white font-medium text-black'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        全部域名
                      </Button>
                      {searchableGroups.map((group) => (
                        <Button
                          type="button"
                          variant="ghost"
                          key={group.domain}
                          onClick={() => {
                            setSelectedDomains((prev) =>
                              prev.includes(group.domain)
                                ? prev.filter((d) => d !== group.domain)
                                : [...prev, group.domain],
                            );
                          }}
                          className={`h-auto max-w-full rounded-full px-2.5 py-0.5 text-[11px] ${
                            selectedDomains.includes(group.domain)
                              ? 'bg-white font-medium text-black'
                              : 'bg-white/10 text-white/70 hover:bg-white/20'
                          }`}
                        >
                          <span className="break-all">{group.domain}</span>
                          <span className="ml-1 text-[10px] opacity-70">
                            {group.tabs.length}
                          </span>
                        </Button>
                      ))}
                      {searchableGroups.length === 0 && (
                        <p className="pt-2 text-xs text-white/45">
                          没有匹配的域名。
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs text-white/65">
                      <Tag className="h-3.5 w-3.5 flex-shrink-0 text-white/50" />
                      <span>标签筛选</span>
                    </div>
                    <div
                      className="flex max-h-36 flex-wrap gap-x-1.5 gap-y-2 overflow-y-auto pb-1 pr-2 pt-1 custom-scrollbar"
                      onWheel={(e) => forwardWheelToPage(e, 'panel')}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSelectedTags([])}
                        className={`h-auto rounded-full px-2.5 py-0.5 text-[11px] ${
                          selectedTags.length === 0
                            ? 'bg-white font-medium text-black'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        全部标签
                      </Button>
                      {filterableTags.map((tag) => {
                        if (
                          tabsViewMode === 'tag' &&
                          tag === DEFAULT_UNCATEGORIZED_TAG
                        ) {
                          return null;
                        }
                        const IconToUse = getTagIcon(tag);
                        const isDefaultOnly =
                          defaultTagSet.has(tag) && !domainBoundTagSet.has(tag);
                        const canDeleteTag =
                          tag !== DEFAULT_UNCATEGORIZED_TAG && !isDefaultOnly;

                        return (
                          <span
                            key={tag}
                            className="group/tag-filter relative inline-flex items-center rounded-full bg-white/10 text-white/70"
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTags((prev) =>
                                  prev.includes(tag)
                                    ? prev.filter((t) => t !== tag)
                                    : [...prev, tag],
                                );
                              }}
                              className={`h-auto rounded-full px-2.5 py-0.5 text-[11px] ${
                                selectedTags.includes(tag)
                                  ? 'bg-white font-medium text-black'
                                  : 'hover:bg-white/20'
                              }`}
                            >
                              <span className="inline-flex items-center gap-1">
                                {IconToUse && <IconToUse className="h-3 w-3" />}
                                {tag}
                              </span>
                            </Button>
                            {canDeleteTag ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeGlobalTag(tag);
                                  setSelectedTags((prev) =>
                                    prev.filter(
                                      (currentTag) => currentTag !== tag,
                                    ),
                                  );
                                  notifySuccess(
                                    '标签已删除',
                                    `已删除标签「${tag}」`,
                                  );
                                }}
                                className="absolute -right-1.5 -top-1.5 h-4 w-4 rounded-full bg-black/70 p-0 text-white/70 opacity-0 transition-opacity hover:bg-black/70 group-hover/tag-filter:opacity-100"
                                aria-label={`删除标签 ${tag}`}
                                title={`删除标签 ${tag}`}
                              >
                                <X className="h-2.5 w-2.5" />
                              </Button>
                            ) : null}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div
            className="min-h-0 flex-1 overflow-y-auto pb-3 pr-1 custom-scrollbar"
            onWheel={(e) => forwardWheelToPage(e, 'panel')}
          >
            {filteredGroups.length === 0 ? (
              <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/5 px-6 text-center text-white/60">
                当前筛选下没有匹配的标签页，试试切换域名或标签。
              </div>
            ) : tabsViewMode === 'tag' ? (
              <div
                className="flex h-full min-h-[360px] gap-4 overflow-x-auto pb-4 pr-1 custom-scrollbar"
                onWheel={handleTagBoardWheel}
              >
                {tagBoardContainers.map((container) => {
                  const IconComp = getTagIcon(
                    container.label,
                    container.iconName,
                  );
                  const isEditingContainer =
                    editingGlobalTag === container.label;
                  const isDefaultContainer =
                    container.label === DEFAULT_UNCATEGORIZED_TAG;

                  return (
                    <fieldset
                      key={container.label}
                      aria-label={`${container.label} 标签容器`}
                      className={`flex min-h-full w-[340px] min-w-[340px] flex-shrink-0 flex-col rounded-xl border p-3 backdrop-blur-xl transition-all ${
                        dragOverTagLabel === container.label
                          ? 'border-white/30 bg-white/[0.12] shadow-[0_20px_48px_rgba(255,255,255,0.08)]'
                          : 'border-white/10 bg-black/20'
                      }`}
                      onDragOver={(event) => event.preventDefault()}
                      onDragEnter={(event) => {
                        event.preventDefault();
                        setDragOverTagLabel(container.label);
                      }}
                      onDragLeave={(event) => {
                        if (
                          !event.currentTarget.contains(
                            event.relatedTarget as Node,
                          )
                        ) {
                          setDragOverTagLabel((current) =>
                            current === container.label ? null : current,
                          );
                        }
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const domain =
                          event.dataTransfer.getData('application/domain') ||
                          event.dataTransfer.getData('text/plain');
                        if (!domain) {
                          return;
                        }
                        setDomainPrimaryTag(
                          domain,
                          container.label,
                          container.iconName,
                        );
                        notifySuccess(
                          '域名已归类',
                          `已将 ${domain} 移动到「${container.label}」`,
                        );
                        setDragOverTagLabel(null);
                        setDraggingDomain(null);
                      }}
                      data-testid={`tag-container-${container.label}`}
                    >
                      <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                        <div className="min-w-0 flex-1">
                          {isEditingContainer ? (
                            <TagInput
                              onSubmit={(nextLabel, nextIconName) => {
                                renameGlobalTag(
                                  container.label,
                                  nextLabel,
                                  nextIconName,
                                );
                                notifySuccess(
                                  '标签容器已更新',
                                  `已将「${container.label}」更新为「${nextLabel}」`,
                                );
                                setEditingGlobalTag(null);
                              }}
                              onClose={() => setEditingGlobalTag(null)}
                              placeholder="修改标签容器"
                              initialValue={container.label}
                              initialIconName={container.iconName ?? null}
                              inputClassName="w-32"
                              className="border-white/15 bg-white/12"
                            />
                          ) : isDefaultContainer ? (
                            <div className="flex max-w-full items-center gap-2 rounded-xl px-1 py-1 text-left">
                              <IconComp className="h-4 w-4 flex-shrink-0 text-white/75" />
                              <span className="truncate font-medium text-white/90">
                                {container.label}
                              </span>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() =>
                                setEditingGlobalTag(container.label)
                              }
                              className="group/tag-board-title h-auto max-w-full justify-start rounded-xl px-1 py-1 text-left hover:bg-white/8"
                              title={`编辑标签容器 ${container.label}`}
                            >
                              <IconComp className="h-4 w-4 flex-shrink-0 text-white/75" />
                              <span className="truncate font-medium text-white/90">
                                {container.label}
                              </span>
                              <Edit3 className="h-3.5 w-3.5 flex-shrink-0 text-white/0 transition-colors group-hover/tag-board-title:text-white/45" />
                            </Button>
                          )}
                          <p className="mt-1 text-xs text-white/45">
                            {container.groups.length} 个域名
                          </p>
                        </div>
                        <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                          {container.groups.reduce(
                            (sum, group) => sum + group.tabs.length,
                            0,
                          )}{' '}
                          Tabs
                        </span>
                        {!isDefaultContainer && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              removeGlobalTag(container.label);
                              notifySuccess(
                                '标签容器已删除',
                                `已删除「${container.label}」`,
                              );
                              setEditingGlobalTag((current) =>
                                current === container.label ? null : current,
                              );
                            }}
                            className="h-8 w-8 rounded-lg p-1.5 text-white/45 hover:bg-red-500/15 hover:text-red-300"
                            aria-label={`删除标签容器 ${container.label}`}
                            title={`删除标签容器 ${container.label}`}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>

                      <div
                        className="min-h-[220px] flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar"
                        onWheel={(e) => forwardWheelToPage(e, 'panel')}
                      >
                        {container.groups.length === 0 ? (
                          <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-white/12 bg-white/5 px-4 text-center text-xs text-white/40">
                            将域名卡片拖入这里
                          </div>
                        ) : (
                          container.groups.map((group) => (
                            <article
                              key={group.domain}
                              draggable
                              onDragStart={(event) => {
                                setDraggingDomain(group.domain);
                                event.dataTransfer.setData(
                                  'application/domain',
                                  group.domain,
                                );
                                event.dataTransfer.setData(
                                  'text/plain',
                                  group.domain,
                                );
                                event.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragEnd={() => {
                                setDraggingDomain(null);
                                setDragOverTagLabel(null);
                              }}
                              className={`rounded-lg border border-white/10 bg-white/[0.06] p-3 transition-all ${
                                group.tabs.length > 0
                                  ? 'hover:bg-white/[0.09]'
                                  : ''
                              } ${
                                draggingDomain === group.domain
                                  ? 'scale-[0.98] opacity-60 shadow-[0_20px_40px_rgba(0,0,0,0.28)]'
                                  : ''
                              }`}
                            >
                              <div className="mb-2 flex items-start justify-between gap-3 border-b border-white/10 pb-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <Globe className="h-4 w-4 flex-shrink-0 text-white/65" />
                                    <h3
                                      className="truncate text-sm font-medium text-white/90"
                                      title={group.domain}
                                    >
                                      {group.domain}
                                    </h3>
                                    <span className="flex-shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/65">
                                      {group.tabs.length}
                                    </span>
                                  </div>

                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {/* 标签视图下不展示域名卡上的标签 */}
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    setPendingCloseDomain(group.domain)
                                  }
                                  className="h-8 w-8 rounded-lg p-1.5 text-white/50 hover:bg-white/10 hover:text-white/80"
                                  title="Close all tabs in this group"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>

                              <div
                                className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1 custom-scrollbar"
                                onWheel={(e) => forwardWheelToPage(e, 'card')}
                              >
                                {group.tabs.map((tab) => (
                                  <div
                                    key={tab.id}
                                    className="group/tab-item relative flex flex-col rounded-xl border border-transparent p-2"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        className="h-auto flex-1 cursor-pointer justify-start overflow-hidden rounded-lg p-0 text-left hover:bg-transparent"
                                        onClick={() =>
                                          switchToTab(tab.id, tab.windowId)
                                        }
                                      >
                                        {tab.favIconUrl ? (
                                          <img
                                            src={tab.favIconUrl}
                                            alt=""
                                            className="h-4 w-4 flex-shrink-0 rounded-sm bg-white/10"
                                          />
                                        ) : (
                                          <ExternalLink className="h-4 w-4 flex-shrink-0 text-white/50" />
                                        )}
                                        <span
                                          className="truncate text-sm text-white/80"
                                          title={tab.title}
                                        >
                                          {tab.title}
                                        </span>
                                      </Button>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => closeTab(tab.id)}
                                        className="h-6 w-6 rounded p-1 text-white/50 hover:bg-white/20 hover:text-red-400"
                                        title="Close tab"
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </article>
                          ))
                        )}
                      </div>
                    </fieldset>
                  );
                })}
              </div>
            ) : (
              <div
                className="flex items-start gap-[0.875rem]"
                data-testid="domain-masonry-grid"
              >
                {masonryColumns.map((columnGroups, colIndex) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: Columns are stable
                    key={`column-${colIndex}`}
                    className="flex min-w-0 flex-1 flex-col gap-3"
                    data-testid="domain-masonry-column"
                  >
                    {columnGroups.map((group) => {
                      const isTagEditorActive =
                        domainTagInputOpen === group.domain ||
                        editingTag?.domain === group.domain;

                      return (
                        <article
                          key={group.domain}
                          className={`relative w-full rounded-xl border border-white/10 bg-black/20 p-3 backdrop-blur-xl ${
                            isTagEditorActive ? 'z-20' : 'z-0'
                          } ${
                            group.tags.length === 0
                              ? ''
                              : 'hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="mb-3 flex items-start justify-between gap-3 border-b border-white/10 pb-2.5">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 overflow-hidden">
                                <Globe className="h-4 w-4 flex-shrink-0 text-white/70" />
                                <h3
                                  className="truncate font-medium text-white/90"
                                  title={group.domain}
                                >
                                  {group.domain}
                                </h3>
                                <span className="flex-shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                                  {group.tabs.length}
                                </span>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                {group.tags
                                  .filter(
                                    (t) =>
                                      t.label !== DEFAULT_UNCATEGORIZED_TAG,
                                  )
                                  .map((tag) => {
                                    const IconComp = getTagIcon(
                                      tag.label,
                                      tag.iconName,
                                    );
                                    const isEditingTag =
                                      editingTag?.domain === group.domain &&
                                      editingTag.tagId === tag.id;

                                    if (isEditingTag) {
                                      return (
                                        <TagInput
                                          key={tag.id}
                                          onSubmit={(
                                            nextLabel,
                                            nextIconName,
                                          ) => {
                                            updateDomainTag(
                                              group.domain,
                                              tag.id,
                                              nextLabel,
                                              nextIconName,
                                            );
                                            notifySuccess(
                                              '域名标签已更新',
                                              `${group.domain} 已更新为「${nextLabel}」`,
                                            );
                                            setEditingTag(null);
                                          }}
                                          onClose={() => setEditingTag(null)}
                                          placeholder="修改标签"
                                          initialValue={tag.label}
                                          initialIconName={tag.iconName ?? null}
                                          inputClassName="w-20"
                                          className="border-white/15 bg-white/12"
                                        />
                                      );
                                    }

                                    return (
                                      <span
                                        key={tag.id}
                                        className="group/tag relative inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] text-white/70"
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setDomainTagInputOpen(null);
                                            setEditingTag({
                                              domain: group.domain,
                                              tagId: tag.id,
                                            });
                                          }}
                                          className="inline-flex items-center gap-1 rounded-full text-left transition-colors hover:text-white"
                                          title={`编辑标签 ${tag.label}`}
                                        >
                                          <IconComp className="h-3 w-3" />
                                          <span>{tag.label}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            removeDomainTag(
                                              group.domain,
                                              tag.id,
                                            );
                                            notifySuccess(
                                              '域名标签已删除',
                                              `${group.domain} 已移除「${tag.label}」`,
                                            );
                                          }}
                                          className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/70 text-white/70 opacity-0 transition-opacity group-hover/tag:opacity-100"
                                          aria-label={`Remove domain tag ${tag.label}`}
                                        >
                                          <X className="h-2.5 w-2.5" />
                                        </button>
                                      </span>
                                    );
                                  })}

                                {domainTagInputOpen === group.domain ? (
                                  <TagInput
                                    onSubmit={(tag, iconName) => {
                                      addDomainTag(group.domain, tag, iconName);
                                      notifySuccess(
                                        '域名标签已添加',
                                        `${group.domain} 已添加「${tag}」`,
                                      );
                                      setDomainTagInputOpen(null);
                                    }}
                                    onClose={() => setDomainTagInputOpen(null)}
                                    placeholder="域名标签"
                                    inputClassName="w-16"
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTag(null);
                                      setDomainTagInputOpen(group.domain);
                                    }}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-white/20 text-white/55"
                                    title="添加域名标签"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setPendingCloseDomain(group.domain)
                              }
                              className="rounded-lg p-2 text-white/50"
                              title="Close all tabs in this group"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div
                            className="max-h-[380px] space-y-1.5 overflow-y-auto pr-1 custom-scrollbar"
                            onWheel={(e) => forwardWheelToPage(e, 'card')}
                          >
                            {group.tabs.map((tab) => (
                              <div
                                key={tab.id}
                                className="group/tab-item relative flex flex-col rounded-xl border border-transparent p-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    className="flex flex-1 cursor-pointer items-center gap-2 overflow-hidden text-left"
                                    onClick={() =>
                                      switchToTab(tab.id, tab.windowId)
                                    }
                                  >
                                    {tab.favIconUrl ? (
                                      <img
                                        src={tab.favIconUrl}
                                        alt=""
                                        className="h-4 w-4 flex-shrink-0 rounded-sm bg-white/10"
                                      />
                                    ) : (
                                      <ExternalLink className="h-4 w-4 flex-shrink-0 text-white/50" />
                                    )}
                                    <span
                                      className="truncate text-sm text-white/80"
                                      title={tab.title}
                                    >
                                      {tab.title}
                                    </span>
                                  </button>
                                  <div className="flex flex-shrink-0 items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => closeTab(tab.id)}
                                      className="rounded p-1 text-white/50 transition-all hover:bg-white/20 hover:text-red-400"
                                      title="Close tab"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <DialogContent showClose={false} className="w-[90vw] max-w-md rounded-xl">
        <DialogTitle className="text-lg font-semibold">
          关闭整个域名分组？
        </DialogTitle>
        <DialogDescription className="mt-2 text-sm text-white/65">
          {pendingCloseDomain
            ? `将关闭 ${pendingCloseDomain} 下的所有标签页，此操作不可撤销。`
            : '将关闭该域名下的所有标签页。'}
        </DialogDescription>
        <div className="mt-6 flex justify-end gap-3">
          <DialogClose asChild>
            <Button type="button" variant="secondary" className="rounded-lg">
              取消
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            className="rounded-lg bg-red-500/90 hover:bg-red-500"
            onClick={() => {
              if (pendingCloseDomain) {
                closeGroup(pendingCloseDomain);
              }
              setPendingCloseDomain(null);
            }}
          >
            确认关闭
          </Button>
        </div>
      </DialogContent>

      <Dialog
        open={isBatchTagDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeBatchDialog();
          }
        }}
      >
        <DialogContent
          showClose={false}
          className="w-[92vw] max-w-3xl rounded-2xl"
        >
          <DialogClose asChild>
            <Button
              type="button"
              variant="icon"
              size="icon"
              className="absolute right-4 top-4 h-9 w-9 rounded-full border border-white/10 bg-white/8 text-white/70 hover:bg-white/12 hover:text-white"
              aria-label="关闭批量添加弹窗"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
          <DialogTitle className="text-lg font-semibold">
            批量给多个域名添加标签
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-white/65">
            先勾选域名，再输入标签；按钮会用 disabled
            状态直接提示当前是否可添加。
          </DialogDescription>

          <div className="mt-5 space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/6 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-white/75">
                    <Tag className="h-4 w-4 text-white/55" />
                    <span>批量标签</span>
                  </div>
                  <p className="text-xs leading-5 text-white/45">
                    当前结果中已选 {actionableBatchSelectedDomains.length}{' '}
                    个域名。未选择域名时，确认按钮保持禁用。
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() =>
                      setBatchSelectedDomains(
                        filteredBatchGroups.map((group) => group.domain),
                      )
                    }
                    className="h-auto rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/75 hover:bg-white/12"
                  >
                    全选当前结果
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setBatchSelectedDomains([])}
                    className="h-auto rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-white/75 hover:bg-white/12"
                  >
                    清空选择
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2">
                <TagInput
                  onSubmit={(tag, iconName) => {
                    handleBatchAddTag(
                      actionableBatchSelectedDomains,
                      tag,
                      iconName,
                    );
                  }}
                  onClose={closeBatchDialog}
                  placeholder="输入标签内容"
                  inputClassName="min-w-[120px] flex-1 py-0.5 px-1 text-xs"
                  className="min-w-[180px] flex-1 rounded-xl border-white/15 bg-white/8 px-1.5 py-0.5"
                  closeOnBlur={false}
                  submitButtonLabel="确认添加"
                  submitDisabled={actionableBatchSelectedDomains.length === 0}
                />
                <div className="flex flex-wrap gap-2">
                  {defaultTagOptions.map((option) => (
                    <Button
                      key={option.label}
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        handleBatchAddTag(
                          actionableBatchSelectedDomains,
                          option.label,
                          option.iconName,
                        );
                      }}
                      disabled={actionableBatchSelectedDomains.length === 0}
                      className="h-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option.icon className="h-3 w-3" />
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/6 p-4">
              <Input
                type="text"
                value={batchDomainQuery}
                onChange={(event) => setBatchDomainQuery(event.target.value)}
                className="h-auto rounded-lg px-4 py-3 text-sm placeholder:text-white/35"
                placeholder="搜索要批量添加标签的域名..."
              />

              <div
                className="mt-3 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar"
                onWheel={(e) => forwardWheelToPage(e, 'panel')}
              >
                {filteredBatchGroups.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2.5">
                    {filteredBatchGroups.map((group) => {
                      const isChecked = batchSelectedDomains.includes(
                        group.domain,
                      );
                      const visibleTags = group.tags.filter(
                        (t) => t.label !== DEFAULT_UNCATEGORIZED_TAG,
                      );
                      return (
                        <label
                          key={group.domain}
                          className={`group/batch-domain relative flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 transition-colors ${
                            isChecked
                              ? 'border-white/20 bg-white/12'
                              : `border-white/10 bg-white/5 ${
                                  visibleTags.length > 0
                                    ? 'hover:bg-white/8'
                                    : ''
                                }`
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <Checkbox
                              checked={isChecked}
                              onCheckedChange={() =>
                                toggleBatchDomain(group.domain)
                              }
                            />
                            <span className="min-w-0">
                              <span className="block truncate text-sm text-white">
                                {group.domain}
                              </span>
                              <span className="block text-xs text-white/45">
                                {group.tabs.length} Tabs / {visibleTags.length}{' '}
                                标签
                              </span>
                            </span>
                          </span>
                          {visibleTags.length > 0 && (
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/55">
                              {visibleTags.length}
                            </span>
                          )}
                          {visibleTags.length > 0 ? (
                            <span className="pointer-events-none absolute right-3 top-10 z-10 hidden min-w-36 max-w-56 rounded-xl border border-white/10 bg-slate-950/95 p-2 text-left text-xs text-white/70 shadow-2xl group-hover/batch-domain:block">
                              <span className="flex flex-wrap gap-1">
                                {visibleTags.map((tag) => (
                                  <span
                                    key={tag.id}
                                    className="rounded-full bg-white/10 px-2 py-0.5"
                                  >
                                    {tag.label}
                                  </span>
                                ))}
                              </span>
                            </span>
                          ) : null}
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/45">
                    没有匹配的域名。
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
