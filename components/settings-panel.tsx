import {
  Code2,
  Info,
  Link,
  Settings as SettingsIcon,
  Sparkles,
  X,
} from 'lucide-react';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import type { Settings } from '../hooks/use-settings';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { ColorPicker } from './ui/color-picker';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from './ui/drawer';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SettingsPanelProps {
  settings: Settings;
  onUpdate: (settings: Partial<Settings>) => void;
}

type GradientStopKey =
  | 'backgroundGradientFrom'
  | 'backgroundGradientVia'
  | 'backgroundGradientTo';

const searchEngineOptions: Array<{
  label: string;
  value: Settings['searchEngine'];
}> = [
  { label: 'Google', value: 'google' },
  { label: 'Bing', value: 'bing' },
];

const backgroundTypeOptions: Array<{
  label: string;
  value: Settings['backgroundType'];
}> = [
  { label: 'None', value: 'none' },
  { label: 'Solid Color', value: 'color' },
  { label: 'Gradient', value: 'gradient' },
  { label: 'Random Image', value: 'unsplash' },
];

const gradientStops: Array<{
  key: GradientStopKey;
  label: string;
  description: string;
}> = [
  {
    key: 'backgroundGradientFrom',
    label: 'Origin',
    description: '能量起点',
  },
  {
    key: 'backgroundGradientVia',
    label: 'Core',
    description: '星核过渡',
  },
  {
    key: 'backgroundGradientTo',
    label: 'Horizon',
    description: '远端光晕',
  },
];

const gradientPresets = [
  {
    name: 'Nebula',
    from: '#0f172a',
    via: '#7c3aed',
    to: '#06b6d4',
  },
  {
    name: 'Aurora',
    from: '#042f2e',
    via: '#22c55e',
    to: '#67e8f9',
  },
  {
    name: 'Cyber',
    from: '#111827',
    via: '#ec4899',
    to: '#38bdf8',
  },
  {
    name: 'Plasma',
    from: '#1e1b4b',
    via: '#f97316',
    to: '#f0abfc',
  },
  {
    name: 'Deep Space',
    from: '#020617',
    via: '#1d4ed8',
    to: '#a855f7',
  },
  {
    name: 'Quantum',
    from: '#030712',
    via: '#14b8a6',
    to: '#e879f9',
  },
  {
    name: 'Ocean',
    from: '#082f49',
    via: '#0ea5e9',
    to: '#22d3ee',
  },
  {
    name: 'Forest',
    from: '#052e16',
    via: '#16a34a',
    to: '#bef264',
  },
  {
    name: 'Sunset',
    from: '#431407',
    via: '#f97316',
    to: '#fb7185',
  },
  {
    name: 'Violet',
    from: '#2e1065',
    via: '#8b5cf6',
    to: '#f0abfc',
  },
  {
    name: 'Graphite',
    from: '#020617',
    via: '#334155',
    to: '#94a3b8',
  },
  {
    name: 'Mint',
    from: '#064e3b',
    via: '#10b981',
    to: '#99f6e4',
  },
  {
    name: 'Ember',
    from: '#450a0a',
    via: '#dc2626',
    to: '#facc15',
  },
  {
    name: 'Lagoon',
    from: '#083344',
    via: '#0891b2',
    to: '#5eead4',
  },
  {
    name: 'Dawn',
    from: '#312e81',
    via: '#f472b6',
    to: '#fde68a',
  },
  {
    name: 'Solar',
    from: '#713f12',
    via: '#eab308',
    to: '#fef3c7',
  },
  {
    name: 'Iris',
    from: '#1e1b4b',
    via: '#6366f1',
    to: '#c4b5fd',
  },
  {
    name: 'Coral',
    from: '#4a044e',
    via: '#fb7185',
    to: '#fdba74',
  },
  {
    name: 'Arctic',
    from: '#0f172a',
    via: '#38bdf8',
    to: '#e0f2fe',
  },
  {
    name: 'Lime',
    from: '#1a2e05',
    via: '#84cc16',
    to: '#d9f99d',
  },
  {
    name: 'Rose',
    from: '#4c0519',
    via: '#e11d48',
    to: '#fda4af',
  },
  {
    name: 'Indigo',
    from: '#111827',
    via: '#4f46e5',
    to: '#7dd3fc',
  },
  {
    name: 'Copper',
    from: '#292524',
    via: '#c2410c',
    to: '#fed7aa',
  },
  {
    name: 'Prism',
    from: '#020617',
    via: '#a855f7',
    to: '#22d3ee',
  },
] as const;

function buildGradientCss(from: string, via: string, to: string): string {
  return `linear-gradient(135deg, ${from}, ${via}, ${to})`;
}

function buildGradientUpdate(
  settings: Settings,
  key: GradientStopKey,
  color: string,
): Partial<Settings> {
  const gradientColors = {
    backgroundGradientFrom: settings.backgroundGradientFrom,
    backgroundGradientVia: settings.backgroundGradientVia,
    backgroundGradientTo: settings.backgroundGradientTo,
    [key]: color,
  };

  return {
    ...gradientColors,
    backgroundGradient: buildGradientCss(
      gradientColors.backgroundGradientFrom,
      gradientColors.backgroundGradientVia,
      gradientColors.backgroundGradientTo,
    ),
  };
}

function buildGradientPresetUpdate(
  preset: (typeof gradientPresets)[number],
): Partial<Settings> {
  return {
    backgroundGradientFrom: preset.from,
    backgroundGradientVia: preset.via,
    backgroundGradientTo: preset.to,
    backgroundGradient: buildGradientCss(preset.from, preset.via, preset.to),
  };
}

function clampPopoverPosition(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function ColorPickerPopover({
  id,
  label,
  value,
  onChange,
  swatchSize = 'default',
  showValueControls = true,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (color: string) => void;
  swatchSize?: 'default' | 'compact';
  showValueControls?: boolean;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [position, setPosition] = React.useState({
    top: 0,
    left: 0,
    placement: 'bottom' as 'bottom' | 'top',
  });
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) {
      return;
    }

    const updatePosition = () => {
      if (!triggerRef.current) {
        return;
      }

      const rect = triggerRef.current.getBoundingClientRect();
      const popoverWidth = 336;
      const estimatedPopoverHeight = showValueControls ? 430 : 340;
      const viewportWidth = window.innerWidth || popoverWidth;
      const viewportHeight = window.innerHeight || estimatedPopoverHeight;
      const margin = 12;
      const left = clampPopoverPosition(
        rect.right - popoverWidth,
        margin,
        Math.max(margin, viewportWidth - popoverWidth - margin),
      );
      const shouldOpenAbove =
        rect.bottom + estimatedPopoverHeight + margin > viewportHeight &&
        rect.top > estimatedPopoverHeight;

      setPosition({
        left,
        top: shouldOpenAbove ? rect.top - 8 : rect.bottom + 8,
        placement: shouldOpenAbove ? 'top' : 'bottom',
      });
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;

      if (
        triggerRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }

      setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, showValueControls]);

  const popover =
    isOpen &&
    createPortal(
      <section
        ref={panelRef}
        aria-label={`${label} 取色面板`}
        className={cn(
          'fixed z-[180] rounded-2xl border border-white/15 bg-slate-950/70 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl',
          position.placement === 'top' && '-translate-y-full',
        )}
        style={{
          left: position.left,
          top: position.top,
        }}
        onWheel={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <ColorPicker
          color={value}
          onChange={onChange}
          showPresets={false}
          showValueControls={showValueControls}
        />
      </section>,
      document.body,
    );

  return (
    <>
      <button
        id={id}
        ref={triggerRef}
        type="button"
        aria-label={`选择 ${label} 颜色`}
        aria-expanded={isOpen}
        className={cn(
          'flex shrink-0 cursor-pointer items-center rounded-lg border border-white/10 bg-white/[0.05] font-semibold uppercase text-white/70 transition-all hover:border-white/25 hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35',
          swatchSize === 'compact'
            ? 'gap-1.5 px-1.5 py-1 text-[10px]'
            : 'gap-2 px-2 py-1 text-[11px]',
        )}
        onClick={() => setIsOpen((current) => !current)}
      >
        {value}
        <span
          aria-hidden="true"
          className={cn(
            'rounded-md border border-white/15 shadow-[inset_0_0_10px_rgba(255,255,255,0.14)]',
            swatchSize === 'compact' ? 'h-5 w-5' : 'h-6 w-6',
          )}
          style={{ backgroundColor: value }}
        />
      </button>
      {popover}
    </>
  );
}

function ColorPickerField({
  id,
  label,
  description,
  value,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label className="text-sm font-semibold text-white">{label}</Label>
          <p className="mt-1 text-xs text-white/45">{description}</p>
        </div>
        <ColorPickerPopover
          id={id}
          label={label}
          value={value}
          onChange={onChange}
        />
      </div>
      <ColorPicker
        color={value}
        onChange={onChange}
        className="border-0 bg-transparent p-0 [&>div]:gap-2"
        density="compact"
        showValueControls={false}
      />
    </div>
  );
}

function GradientFlowEditor({
  settings,
  onPresetSelect,
  onStopChange,
}: {
  settings: Settings;
  onPresetSelect: (preset: (typeof gradientPresets)[number]) => void;
  onStopChange: (key: GradientStopKey, color: string, label: string) => void;
}) {
  return (
    <div className="space-y-4 overflow-hidden rounded-2xl border border-cyan-300/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_34%),rgba(255,255,255,0.04)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_18px_50px_rgba(8,47,73,0.18)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label htmlFor="settings-background-gradient-preview">
            Gradient Colors
          </Label>
          <p className="mt-1 max-w-xl text-sm leading-6 text-white/50">
            先选择一个预设快速建立氛围，再分别微调 Origin、Core、Horizon
            三个节点，最终会实时合成为页面背景渐变。
          </p>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-cyan-100/80">
          Stream
        </div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {gradientPresets.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-1.5 text-left transition-all hover:border-cyan-300/40 hover:bg-white/[0.08]"
            onClick={() => onPresetSelect(preset)}
          >
            <div
              className="h-4 rounded-md shadow-[inset_0_0_12px_rgba(255,255,255,0.14)]"
              style={{
                background: buildGradientCss(
                  preset.from,
                  preset.via,
                  preset.to,
                ),
              }}
            />
            <p className="mt-1.5 truncate text-[11px] font-semibold text-white/78 transition-colors group-hover:text-white">
              {preset.name}
            </p>
          </button>
        ))}
      </div>

      <div
        id="settings-background-gradient-preview"
        className="group relative h-20 overflow-hidden rounded-2xl border-y border-r border-white/10 shadow-[inset_0_0_28px_rgba(255,255,255,0.12)]"
        style={{ background: settings.backgroundGradient }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.28),transparent_24%),radial-gradient(circle_at_70%_38%,rgba(255,255,255,0.18),transparent_30%),linear-gradient(110deg,transparent_8%,rgba(255,255,255,0.22)_28%,transparent_52%)] opacity-45 blur-[0.5px]" />
        <div className="absolute -left-1/4 top-0 h-full w-1/2 rotate-6 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)] opacity-55 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[190%]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_48%,rgba(0,0,0,0.22)_100%)]" />
        <div className="absolute inset-x-5 top-1/2 flex -translate-y-1/2 justify-between">
          {gradientStops.map((stop, index) => (
            <div
              key={stop.key}
              className="flex flex-col items-center gap-1"
              data-testid={`gradient-preview-stop-${index + 1}`}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full border border-white/35 bg-black/25 text-[11px] font-bold text-white/90 shadow-[0_0_18px_rgba(255,255,255,0.24)] backdrop-blur-sm"
                style={{ backgroundColor: `${settings[stop.key]}66` }}
              >
                {index + 1}
              </span>
              <span className="text-[10px] font-semibold text-white/75 drop-shadow-[0_1px_8px_rgba(0,0,0,0.55)]">
                {stop.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          {gradientStops.map((stop, index) => (
            <div
              key={stop.key}
              className="relative min-w-0 rounded-xl border border-white/10 bg-black/20 p-3"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/20 text-[11px] font-bold text-white shadow-[0_0_18px_rgba(34,211,238,0.35)]"
                    style={{ backgroundColor: settings[stop.key] }}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {stop.label}
                    </p>
                    <p className="text-[11px] text-white/42">
                      {stop.description}
                    </p>
                  </div>
                </div>
                <ColorPickerPopover
                  id={`settings-${stop.key}`}
                  label={stop.label}
                  value={settings[stop.key]}
                  onChange={(color) =>
                    onStopChange(stop.key, color, stop.label)
                  }
                  swatchSize="compact"
                />
              </div>
              <ColorPicker
                color={settings[stop.key]}
                onChange={(color) => onStopChange(stop.key, color, stop.label)}
                className="border-white/5 bg-white/[0.03] p-2"
                density="compact"
                showValueControls={false}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  settings,
  onUpdate,
}) => {
  const commitUpdate = (
    nextSettings: Partial<Settings>,
    title: string,
    description?: string,
  ) => {
    onUpdate(nextSettings);
    toast(title, { description });
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button
          aria-label="打开设置"
          size="icon"
          className="fixed bottom-6 right-6 z-[110] h-[46px] w-[46px] rounded-full border border-white/15 bg-black/30 text-white shadow-[0_16px_36px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-all hover:rotate-90 hover:bg-black/45"
        >
          <SettingsIcon className="w-[22px] h-[22px]" />
        </Button>
      </DrawerTrigger>

      <DrawerContent
        side="right"
        className="overflow-hidden bg-[linear-gradient(180deg,rgba(2,8,31,0.96),rgba(1,4,20,0.98))] p-0 shadow-[0_36px_120px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <DrawerTitle className="text-2xl font-semibold text-white">
              Settings
            </DrawerTitle>
            <DrawerDescription className="mt-1.5">
              管理首页偏好、外观和项目信息。
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button
              type="button"
              aria-label="关闭设置"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </div>

        <Tabs
          defaultValue="general"
          className="flex h-[calc(100dvh-89px)] flex-col"
        >
          <div className="px-6 pt-3 pb-1">
            <TabsList className="grid w-full grid-cols-3 rounded-xl border border-white/10 bg-white/[0.06] p-1 text-white/60">
              <TabsTrigger
                value="general"
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:text-white data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                General
              </TabsTrigger>
              <TabsTrigger
                value="appearance"
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:text-white data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                Appearance
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-lg px-3 py-1.5 text-sm font-medium transition-all hover:text-white data-[state=active]:bg-white/15 data-[state=active]:text-white data-[state=active]:shadow-sm"
              >
                About
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 custom-scrollbar">
            <TabsContent value="general" className="mt-0 space-y-6">
              <div className="space-y-2">
                <Label id="settings-search-engine-label">Search Engine</Label>
                <RadioGroup
                  value={settings.searchEngine}
                  onValueChange={(searchEngine) =>
                    commitUpdate(
                      {
                        searchEngine: searchEngine as Settings['searchEngine'],
                      },
                      '搜索引擎已更新',
                      `当前搜索引擎：${searchEngine === 'google' ? 'Google' : 'Bing'}`,
                    )
                  }
                  aria-labelledby="settings-search-engine-label"
                  className="grid-cols-2"
                >
                  {searchEngineOptions.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`settings-search-engine-${option.value}`}
                      className={cn(
                        'flex h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-sm font-semibold transition-all',
                        settings.searchEngine === option.value
                          ? 'border-cyan-300/45 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(34,211,238,0.16)]'
                          : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
                      )}
                    >
                      <RadioGroupItem
                        id={`settings-search-engine-${option.value}`}
                        value={option.value}
                      />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label
                      htmlFor="settings-show-seconds"
                      className="text-base font-semibold text-white cursor-pointer"
                    >
                      显示秒
                    </Label>
                    <p className="mt-1 text-sm text-white/50">
                      首页时间展示到秒级。
                    </p>
                  </div>
                  <Switch
                    id="settings-show-seconds"
                    checked={settings.showSeconds}
                    onCheckedChange={(showSeconds) =>
                      commitUpdate(
                        { showSeconds },
                        '时间显示已更新',
                        showSeconds ? '已开启秒级显示' : '已关闭秒级显示',
                      )
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <Label
                      htmlFor="settings-scroll-nested"
                      className="text-base font-semibold text-white cursor-pointer"
                    >
                      滚轮透传
                    </Label>
                    <p className="mt-1 text-sm text-white/50">
                      内部区域不可滚动时，继续驱动整页滚动。
                    </p>
                  </div>
                  <Switch
                    id="settings-scroll-nested"
                    checked={settings.scrollThroughNestedPanels}
                    onCheckedChange={(scrollThroughNestedPanels) =>
                      commitUpdate(
                        { scrollThroughNestedPanels },
                        '滚动配置已更新',
                        scrollThroughNestedPanels
                          ? '已开启滚轮透传'
                          : '已关闭滚轮透传',
                      )
                    }
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="appearance" className="mt-0 space-y-6">
              {/* <div className="space-y-2">
                <Label htmlFor="settings-theme">Theme</Label>
                <Select
                  value={settings.theme}
                  onValueChange={(theme) =>
                    commitUpdate(
                      { theme: theme as Settings['theme'] },
                      '主题已更新',
                      `当前主题：${theme}`,
                    )
                  }
                >
                  <SelectTrigger
                    id="settings-theme"
                    className="h-auto rounded-2xl px-4 py-4 text-base"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div> */}

              <div className="space-y-2">
                <Label id="settings-background-type-label">
                  Background Type
                </Label>
                <RadioGroup
                  value={settings.backgroundType}
                  onValueChange={(backgroundType) =>
                    commitUpdate(
                      {
                        backgroundType: backgroundType as
                          | 'color'
                          | 'gradient'
                          | 'unsplash'
                          | 'none',
                      },
                      '背景模式已更新',
                      `当前模式：${backgroundType}`,
                    )
                  }
                  aria-labelledby="settings-background-type-label"
                  className="grid-cols-4"
                >
                  {backgroundTypeOptions.map((option) => (
                    <Label
                      key={option.value}
                      htmlFor={`settings-background-type-${option.value}`}
                      className={cn(
                        'flex h-11 cursor-pointer items-center justify-center rounded-xl border px-3 text-center text-xs font-semibold transition-all',
                        settings.backgroundType === option.value
                          ? 'border-cyan-300/45 bg-cyan-300/15 text-white shadow-[0_0_18px_rgba(34,211,238,0.16)]'
                          : 'border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white',
                      )}
                    >
                      <RadioGroupItem
                        id={`settings-background-type-${option.value}`}
                        value={option.value}
                      />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {settings.backgroundType === 'color' && (
                <ColorPickerField
                  id="settings-background-color"
                  label="Background Color"
                  description="选择纯色背景。"
                  value={settings.backgroundColor}
                  onChange={(backgroundColor) =>
                    commitUpdate(
                      { backgroundColor },
                      '背景颜色已更新',
                      backgroundColor,
                    )
                  }
                />
              )}

              {settings.backgroundType === 'gradient' && (
                <GradientFlowEditor
                  settings={settings}
                  onPresetSelect={(preset) =>
                    commitUpdate(
                      buildGradientPresetUpdate(preset),
                      '渐变预设已应用',
                      preset.name,
                    )
                  }
                  onStopChange={(key, color, label) =>
                    commitUpdate(
                      buildGradientUpdate(settings, key, color),
                      '渐变配置已更新',
                      `${label}: ${color}`,
                    )
                  }
                />
              )}
            </TabsContent>
            <TabsContent value="about" className="mt-0 space-y-5">
              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl border border-white/10 bg-white/10 p-3">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      Infinity
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/58">
                      一个面向 Chrome / Chromium
                      的新标签页工作台，聚合快速搜索、
                      常用入口、标签页整理和个性化外观，让浏览器首页更高效、更可控。
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <a
                  href="https://github.com/chaos-design/infinity"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 text-white transition-colors hover:bg-white/[0.09]"
                >
                  <Link className="h-5 w-5" />
                  <p className="mt-3 text-base font-semibold">
                    GitHub Repository
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    查看源码、使用说明和项目更新。
                  </p>
                </a>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <Code2 className="h-5 w-5 text-white" />
                  <p className="mt-3 text-base font-semibold text-white">
                    Tech Stack
                  </p>
                  <p className="mt-1 text-sm text-white/50">
                    WXT · React · TypeScript · Tailwind CSS
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-sm font-semibold text-white">
                    Core Workflow
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    搜索、快捷方式、域名聚合、标签视图和批量标记围绕同一个新标签页完成。
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                  <p className="text-sm font-semibold text-white">
                    Local First
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/50">
                    设置、快捷方式和标签关系默认保存在本地浏览器存储中。
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                <div className="flex items-center gap-2 text-white">
                  <Info className="h-4 w-4" />
                  <p className="text-sm font-semibold">Project Notes</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-white/50">
                  项目强调紧凑玻璃拟态界面、快速反馈和低干扰操作，适合把浏览器新标签页
                  作为轻量个人工作台使用。
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </DrawerContent>
    </Drawer>
  );
};
