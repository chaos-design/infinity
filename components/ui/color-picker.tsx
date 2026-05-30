import * as React from 'react';
import { cn } from '../../lib/utils';
import { Input } from './input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './select';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
  density?: 'default' | 'compact';
  showPresets?: boolean;
  showValueControls?: boolean;
}

const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;
const colorPresets = [
  '#050816',
  '#0b1020',
  '#0f172a',
  '#111827',
  '#1f2937',
  '#334155',
  '#1e1b4b',
  '#312e81',
  '#3730a3',
  '#4f46e5',
  '#581c87',
  '#6d28d9',
  '#7c3aed',
  '#8b5cf6',
  '#a855f7',
  '#0f766e',
  '#0d9488',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#38bdf8',
  '#0284c7',
  '#2563eb',
  '#22c55e',
  '#16a34a',
  '#84cc16',
  '#eab308',
  '#f97316',
  '#ef4444',
  '#ec4899',
  '#f43f5e',
  '#fb7185',
] as const;

const colorFormats = ['RGB', 'HEX', 'HSB'] as const;
const checkerboardBackground =
  'linear-gradient(45deg, rgba(255,255,255,0.22) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.22) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.22) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.22) 75%)';

type ColorFormat = (typeof colorFormats)[number];
type HsbColor = {
  h: number;
  s: number;
  b: number;
};
type RgbInput = {
  r: string;
  g: string;
  b: string;
};
type HsbInput = {
  h: string;
  s: string;
  b: string;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function normalizeHue(hue: number): number {
  return ((Math.round(hue) % 360) + 360) % 360;
}

function normalizeHex(color: string): string {
  if (!color) {
    return '#000000';
  }

  const trimmedColor = color.trim();

  if (hexColorPattern.test(trimmedColor)) {
    return trimmedColor.toLowerCase();
  }

  if (/^#[0-9A-Fa-f]{3}$/.test(trimmedColor)) {
    const [r, g, b] = trimmedColor.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }

  return '#000000';
}

function hsbToRgb(h: number, s: number, b: number) {
  const saturation = clamp(s, 0, 100) / 100;
  const brightness = clamp(b, 0, 100) / 100;
  const hue = normalizeHue(h);
  const k = (n: number) => (n + hue / 60) % 6;
  const f = (n: number) =>
    brightness * (1 - saturation * Math.max(0, Math.min(k(n), 4 - k(n), 1)));

  return {
    r: Math.round(f(5) * 255),
    g: Math.round(f(3) * 255),
    b: Math.round(f(1) * 255),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (value: number) =>
    clamp(Math.round(value), 0, 255).toString(16).padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToRgb(color: string): RgbInput {
  const hex = normalizeHex(color).slice(1);

  return {
    r: String(parseInt(hex.slice(0, 2), 16)),
    g: String(parseInt(hex.slice(2, 4), 16)),
    b: String(parseInt(hex.slice(4, 6), 16)),
  };
}

function hsbToHex(h: number, s: number, b: number): string {
  const rgb = hsbToRgb(h, s, b);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function hexToHsb(color: string): HsbColor {
  const hex = normalizeHex(color).slice(1);
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = ((g - b) / delta) % 6;
    } else if (max === g) {
      h = (b - r) / delta + 2;
    } else {
      h = (r - g) / delta + 4;
    }
  }

  const hue = normalizeHue(h * 60);
  const s = max === 0 ? 0 : Math.round((delta / max) * 100);
  const brightness = Math.round(max * 100);

  return { h: hue, s, b: brightness };
}

function isSameHsb(a: HsbColor, b: HsbColor): boolean {
  return a.h === b.h && a.s === b.s && a.b === b.b;
}

function buildRgbInput(hsb: HsbColor): RgbInput {
  const rgb = hsbToRgb(hsb.h, hsb.s, hsb.b);

  return {
    r: String(rgb.r),
    g: String(rgb.g),
    b: String(rgb.b),
  };
}

function buildHsbInput(hsb: HsbColor): HsbInput {
  return {
    h: String(hsb.h),
    s: String(hsb.s),
    b: String(hsb.b),
  };
}

export function ColorPicker({
  color,
  onChange,
  className,
  density = 'default',
  showPresets = true,
  showValueControls = true,
}: ColorPickerProps) {
  const [hsb, setHsb] = React.useState<HsbColor>(() => hexToHsb(color));
  const [currentHex, setCurrentHex] = React.useState(() => normalizeHex(color));
  const [hexInput, setHexInput] = React.useState(() =>
    normalizeHex(color).slice(1),
  );
  const [rgbInput, setRgbInput] = React.useState<RgbInput>(() =>
    hexToRgb(color),
  );
  const [hsbInput, setHsbInput] = React.useState<HsbInput>(() =>
    buildHsbInput(hexToHsb(color)),
  );
  const [opacity, setOpacity] = React.useState('100');
  const [inputType, setInputType] = React.useState<ColorFormat>('RGB');
  const [isDraggingSb, setIsDraggingSb] = React.useState(false);
  const sbRef = React.useRef<HTMLDivElement>(null);
  const lastEmittedHex = React.useRef<string | null>(null);
  const isCompact = density === 'compact';
  const shouldShowValueControls = showValueControls || !isCompact;
  const selectedPreset = colorPresets.find((preset) => preset === currentHex);

  React.useEffect(() => {
    const normalizedColor = normalizeHex(color);

    if (
      lastEmittedHex.current &&
      normalizedColor === lastEmittedHex.current.toLowerCase()
    ) {
      lastEmittedHex.current = null;
      return;
    }

    const nextHsb = hexToHsb(normalizedColor);
    setHsb((previousHsb) =>
      isSameHsb(previousHsb, nextHsb) ? previousHsb : nextHsb,
    );
    setCurrentHex(normalizedColor);
    setHexInput(normalizedColor.slice(1));
    setRgbInput(hexToRgb(normalizedColor));
    setHsbInput(buildHsbInput(nextHsb));
  }, [color]);

  const commitHsb = React.useCallback(
    (nextHsb: HsbColor) => {
      const normalizedHsb = {
        h: normalizeHue(nextHsb.h),
        s: Math.round(clamp(nextHsb.s, 0, 100)),
        b: Math.round(clamp(nextHsb.b, 0, 100)),
      };
      const nextHex = hsbToHex(
        normalizedHsb.h,
        normalizedHsb.s,
        normalizedHsb.b,
      );

      lastEmittedHex.current = nextHex;
      setHsb(normalizedHsb);
      setCurrentHex(nextHex);
      setHexInput(nextHex.slice(1));
      setRgbInput(buildRgbInput(normalizedHsb));
      setHsbInput(buildHsbInput(normalizedHsb));
      onChange(nextHex);
    },
    [onChange],
  );

  const commitHex = React.useCallback(
    (nextColor: string) => {
      const normalizedColor = normalizeHex(nextColor);
      const nextHsb = hexToHsb(normalizedColor);

      lastEmittedHex.current = normalizedColor;
      setHsb(nextHsb);
      setCurrentHex(normalizedColor);
      setHexInput(normalizedColor.slice(1));
      setRgbInput(hexToRgb(normalizedColor));
      setHsbInput(buildHsbInput(nextHsb));
      onChange(normalizedColor);
    },
    [onChange],
  );

  const updateSbFromPointer = React.useCallback(
    (clientX: number, clientY: number) => {
      if (!sbRef.current) {
        return;
      }

      const rect = sbRef.current.getBoundingClientRect();
      const x = clamp((clientX - rect.left) / rect.width, 0, 1);
      const y = clamp((clientY - rect.top) / rect.height, 0, 1);

      commitHsb({
        ...hsb,
        s: Math.round(x * 100),
        b: Math.round((1 - y) * 100),
      });
    },
    [commitHsb, hsb],
  );

  React.useEffect(() => {
    if (!isDraggingSb) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      updateSbFromPointer(event.clientX, event.clientY);
    };
    const handlePointerUp = () => {
      setIsDraggingSb(false);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isDraggingSb, updateSbFromPointer]);

  const handleHexChange = (value: string) => {
    const cleanValue = value.replace(/^#/, '').slice(0, 6);
    setHexInput(cleanValue);

    if (/^[0-9A-Fa-f]{6}$/.test(cleanValue)) {
      commitHex(`#${cleanValue}`);
    }
  };

  const handleRgbChange = (key: keyof RgbInput, value: string) => {
    const nextRgbInput = { ...rgbInput, [key]: value.replace(/\D/g, '') };
    setRgbInput(nextRgbInput);

    const r = Number.parseInt(nextRgbInput.r, 10);
    const g = Number.parseInt(nextRgbInput.g, 10);
    const b = Number.parseInt(nextRgbInput.b, 10);

    if ([nextRgbInput.r, nextRgbInput.g, nextRgbInput.b].every(Boolean)) {
      const nextHex = rgbToHex(r, g, b);
      const nextHsb = hexToHsb(nextHex);

      lastEmittedHex.current = nextHex;
      setHsb(nextHsb);
      setCurrentHex(nextHex);
      setHexInput(nextHex.slice(1));
      setHsbInput(buildHsbInput(nextHsb));
      onChange(nextHex);
    }
  };

  const handleHsbChange = (key: keyof HsbInput, value: string) => {
    const nextHsbInput = { ...hsbInput, [key]: value.replace(/\D/g, '') };
    setHsbInput(nextHsbInput);

    const h = Number.parseInt(nextHsbInput.h, 10);
    const s = Number.parseInt(nextHsbInput.s, 10);
    const b = Number.parseInt(nextHsbInput.b, 10);

    if ([nextHsbInput.h, nextHsbInput.s, nextHsbInput.b].every(Boolean)) {
      commitHsb({ h, s, b });
    }
  };

  const handleOpacityChange = (value: string) => {
    const nextOpacity = value.replace(/\D/g, '').slice(0, 3);
    setOpacity(nextOpacity);

    if (nextOpacity !== '') {
      setOpacity(String(clamp(Number.parseInt(nextOpacity, 10), 0, 100)));
    }
  };

  const renderPresetSwatches = (mode: 'default' | 'compact') => (
    <div
      className={cn('flex flex-wrap', mode === 'compact' ? 'gap-1.5' : 'gap-2')}
    >
      {colorPresets.map((preset) => {
        const isSelected = selectedPreset === preset;

        return (
          <button
            key={preset}
            type="button"
            aria-pressed={isSelected}
            aria-label={`选择预设颜色 ${preset}`}
            className={cn(
              'shrink-0 cursor-pointer rounded-md border shadow-[inset_0_0_10px_rgba(255,255,255,0.14)] transition-all hover:-translate-y-0.5 hover:scale-105',
              mode === 'compact' ? 'h-5 w-5' : 'h-6 w-6',
              isSelected
                ? 'border-white/90 ring-2 ring-white/45 ring-offset-1 ring-offset-black/35'
                : 'border-white/15 hover:border-white/45',
            )}
            style={{ backgroundColor: preset }}
            onClick={() => commitHex(preset)}
          />
        );
      })}
    </div>
  );

  if (isCompact) {
    return (
      <div
        className={cn(
          'grid gap-3 rounded-xl border border-white/10 bg-black/20 p-3 text-white',
          className,
        )}
      >
        {showPresets && renderPresetSwatches('compact')}
      </div>
    );
  }

  return (
    <div
      className={cn(
        className,
        'w-full max-w-[320px] space-y-3 rounded-xl border border-white/10 bg-white/[0.96] p-4 text-zinc-950 shadow-[0_18px_60px_rgba(0,0,0,0.22)]',
      )}
    >
      <div
        ref={sbRef}
        className="relative h-40 cursor-crosshair overflow-hidden rounded-lg border border-zinc-200 shadow-sm"
        style={{
          backgroundColor: `hsl(${hsb.h}, 100%, 50%)`,
          backgroundImage:
            'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
        }}
        onPointerDown={(event) => {
          setIsDraggingSb(true);
          updateSbFromPointer(event.clientX, event.clientY);
        }}
      >
        <div
          className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute h-3 w-3 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,0.45)]"
          style={{
            left: `${hsb.s}%`,
            top: `${100 - hsb.b}%`,
            backgroundColor: currentHex,
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="grid flex-1 gap-2">
          <div className="relative h-3 overflow-hidden rounded-full">
            <input
              aria-label="调整色相"
              type="range"
              min="0"
              max="359"
              value={hsb.h}
              onChange={(event) =>
                commitHsb({ ...hsb, h: Number(event.target.value) })
              }
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
            <div
              className="h-full rounded-full"
              style={{
                background:
                  'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
              }}
            />
            <div
              className="-translate-x-1/2 pointer-events-none absolute top-0 h-3 w-3 rounded-full border border-zinc-300 bg-white shadow-sm"
              style={{ left: `${(hsb.h / 359) * 100}%` }}
            />
          </div>

          <div
            className="relative h-3 overflow-hidden rounded-full bg-zinc-100"
            style={{
              backgroundImage: checkerboardBackground,
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
              backgroundSize: '16px 16px',
            }}
          >
            <input
              aria-label="调整透明度"
              type="range"
              min="0"
              max="100"
              value={opacity || '0'}
              onChange={(event) => handleOpacityChange(event.target.value)}
              className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            />
            <div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(to right, transparent, ${currentHex})`,
              }}
            />
            <div
              className="-translate-x-1/2 pointer-events-none absolute top-0 h-3 w-3 rounded-full border border-zinc-300 bg-white shadow-sm"
              style={{
                left: `${clamp(Number.parseInt(opacity || '0', 10), 0, 100)}%`,
              }}
            />
          </div>
        </div>

        <div
          className="h-8 w-8 shrink-0 rounded-md border border-zinc-200 shadow-sm"
          style={{ backgroundColor: currentHex }}
        />
      </div>

      {showPresets && renderPresetSwatches('default')}

      {shouldShowValueControls && (
        <div className="flex gap-1.5">
          <Select
            value={inputType}
            onValueChange={(value) => setInputType(value as ColorFormat)}
          >
            <SelectTrigger className="h-8 w-[66px] rounded-md border-zinc-200 bg-white px-2 text-xs text-zinc-950">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {colorFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {inputType === 'HEX' && (
            <div className="flex flex-1 gap-1.5">
              <div className="relative flex-1">
                <span className="-translate-y-1/2 absolute left-2 top-1/2 text-xs text-zinc-500">
                  #
                </span>
                <Input
                  aria-label="HEX 颜色值"
                  value={hexInput}
                  onChange={(event) => handleHexChange(event.target.value)}
                  className="h-8 rounded-md border-zinc-200 bg-white pl-5 pr-2 font-mono text-xs uppercase text-zinc-950"
                />
              </div>
              <div className="relative w-[52px] shrink-0">
                <Input
                  aria-label="透明度"
                  value={opacity}
                  onChange={(event) => handleOpacityChange(event.target.value)}
                  className="h-8 rounded-md border-zinc-200 bg-white px-1.5 pr-4 text-center text-xs text-zinc-950"
                />
                <span className="-translate-y-1/2 pointer-events-none absolute right-1.5 top-1/2 text-[10px] text-zinc-500">
                  %
                </span>
              </div>
            </div>
          )}

          {inputType === 'RGB' && (
            <div className="flex flex-1 gap-1.5">
              {(['r', 'g', 'b'] as const).map((key) => (
                <div key={key} className="relative flex-1">
                  <Input
                    aria-label={`${key.toUpperCase()} 通道`}
                    value={rgbInput[key]}
                    onChange={(event) =>
                      handleRgbChange(key, event.target.value)
                    }
                    className="h-8 rounded-md border-zinc-200 bg-white px-1 text-center text-xs text-zinc-950"
                  />
                  <span className="absolute -bottom-2.5 left-0 w-full text-center text-[8px] font-medium uppercase text-zinc-400">
                    {key}
                  </span>
                </div>
              ))}
              <div className="relative w-[52px] shrink-0">
                <Input
                  aria-label="透明度"
                  value={opacity}
                  onChange={(event) => handleOpacityChange(event.target.value)}
                  className="h-8 rounded-md border-zinc-200 bg-white px-1.5 pr-4 text-center text-xs text-zinc-950"
                />
                <span className="-translate-y-1/2 pointer-events-none absolute right-1.5 top-1/2 text-[10px] text-zinc-500">
                  %
                </span>
              </div>
            </div>
          )}

          {inputType === 'HSB' && (
            <div className="flex flex-1 gap-1.5">
              {(['h', 's', 'b'] as const).map((key) => (
                <div key={key} className="relative flex-1">
                  <Input
                    aria-label={`${key.toUpperCase()} 通道`}
                    value={hsbInput[key]}
                    onChange={(event) =>
                      handleHsbChange(key, event.target.value)
                    }
                    className="h-8 rounded-md border-zinc-200 bg-white px-1 text-center text-xs text-zinc-950"
                  />
                  <span className="absolute -bottom-2.5 left-0 w-full text-center text-[8px] font-medium uppercase text-zinc-400">
                    {key}
                  </span>
                </div>
              ))}
              <div className="relative w-[52px] shrink-0">
                <Input
                  aria-label="透明度"
                  value={opacity}
                  onChange={(event) => handleOpacityChange(event.target.value)}
                  className="h-8 rounded-md border-zinc-200 bg-white px-1.5 pr-4 text-center text-xs text-zinc-950"
                />
                <span className="-translate-y-1/2 pointer-events-none absolute right-1.5 top-1/2 text-[10px] text-zinc-500">
                  %
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
