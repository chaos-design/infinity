import { Sparkles, Tag } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface FloatingRadialMenuProps {
  totalTabs: number;
  onOpenBatchTag?: () => void;
}

type SnapSide = 'left' | 'right';

const BUTTON = 48;
const PANEL_W = 200;
const PANEL_H = 160;
const OVERLAP = 12;
const ROOT_W = PANEL_W + BUTTON - OVERLAP;
const ROOT_H = PANEL_H;
const EDGE = 16;
const PEEK = 22;
const DRAG_THRESHOLD = 5;

export function FloatingRadialMenu({
  onOpenBatchTag,
}: FloatingRadialMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    ox: number;
    oy: number;
    sx: number;
    sy: number;
    moved: boolean;
  } | null>(null);
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<{ x: number; y: number; s: SnapSide } | null>(null);
  const suppressClick = useRef(false);
  const [hover, setHover] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [manual, setManual] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; s: SnapSide }>({
    x: -PEEK,
    y: EDGE,
    s: 'left',
  });

  const expanded = !dragging && (hover || manual);

  const flush = useCallback(() => {
    frameRef.current = null;
    if (pendingRef.current) setPos(pendingRef.current);
  }, []);

  const schedule = useCallback(
    (p: { x: number; y: number; s: SnapSide }) => {
      pendingRef.current = p;
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(flush);
      }
    },
    [flush],
  );

  const metrics = useCallback(() => {
    const b = rootRef.current?.offsetParent;
    if (!(b instanceof HTMLElement)) return null;
    const maxY = Math.max(EDGE, b.clientHeight - ROOT_H - EDGE);
    return {
      b,
      minX: -PEEK,
      maxX: b.clientWidth - ROOT_W + PEEK,
      minY: EDGE,
      maxY,
      leftX: -PEEK,
      rightX: b.clientWidth - ROOT_W + PEEK,
    };
  }, []);

  useEffect(() => {
    const sync = () => {
      const m = metrics();
      if (!m) return;
      setPos((c) => ({
        x: c.s === 'right' ? m.rightX : m.leftX,
        y: Math.min(Math.max(c.y, m.minY), m.maxY),
        s: c.s,
      }));
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, [metrics]);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const d = dragState.current;
      const m = metrics();
      if (!d || !m) return;
      const nx = Math.min(Math.max(d.ox + e.clientX - d.sx, m.minX), m.maxX);
      const ny = Math.min(Math.max(d.oy + e.clientY - d.sy, m.minY), m.maxY);
      if (
        !d.moved &&
        Math.hypot(e.clientX - d.sx, e.clientY - d.sy) >= DRAG_THRESHOLD
      ) {
        d.moved = true;
        suppressClick.current = true;
        setDragging(true);
        setHover(false);
        setManual(false);
      }
      schedule({
        x: nx,
        y: ny,
        s: nx + ROOT_W / 2 >= m.b.clientWidth / 2 ? 'right' : 'left',
      });
    };
    const up = () => {
      const d = dragState.current;
      const m = metrics();
      if (!d || !m) {
        dragState.current = null;
        return;
      }
      if (!d.moved) {
        dragState.current = null;
        setDragging(false);
        return;
      }
      setPos((c) => {
        const src = pendingRef.current ?? c;
        const s: SnapSide =
          src.x + ROOT_W / 2 >= m.b.clientWidth / 2 ? 'right' : 'left';
        return {
          x: s === 'right' ? m.rightX : m.leftX,
          y: Math.min(Math.max(src.y, m.minY), m.maxY),
          s,
        };
      });
      dragState.current = null;
      pendingRef.current = null;
      setDragging(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [metrics, schedule]);

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    },
    [],
  );

  const items = useMemo(
    () => [
      {
        id: 'batch-tag',
        label: '批量标签',
        icon: Tag,
        onClick: onOpenBatchTag,
      },
    ],
    [onOpenBatchTag],
  );

  return (
    <div
      ref={rootRef}
      data-testid="floating-radial-menu"
      className="absolute z-20 hidden lg:block"
      style={{ left: pos.x, top: pos.y, width: ROOT_W, height: ROOT_H }}
    >
      <nav
        className="relative h-full"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => {
          setHover(false);
          setManual(false);
        }}
        onFocusCapture={() => setHover(true)}
        onBlurCapture={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setHover(false);
            setManual(false);
          }
        }}
        aria-label="悬浮菜单"
      >
        <div
          className={`absolute top-1/2 z-10 -translate-y-1/2 ${pos.s === 'right' ? 'right-0' : 'left-0'}`}
        >
          <button
            type="button"
            className={`group flex items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-[0_16px_36px_#00000047] backdrop-blur-xl transition-all duration-300 hover:bg-black/45 hover:shadow-[0_16px_40px_#00000060] ${dragging ? 'scale-[1.02] cursor-grabbing' : 'cursor-grab hover:scale-110'}`}
            style={{ width: BUTTON, height: BUTTON }}
            aria-label="打开悬浮菜单"
            aria-expanded={expanded}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              dragState.current = {
                ox: pos.x,
                oy: pos.y,
                sx: e.clientX,
                sy: e.clientY,
                moved: false,
              };
            }}
            onClick={(e) => {
              if (suppressClick.current) {
                suppressClick.current = false;
                e.preventDefault();
                return;
              }
              setManual((v) => !v);
            }}
          >
            <Sparkles className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
          </button>
        </div>

        <div
          className={`absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-out ${
            pos.s === 'right'
              ? 'right-[60px] origin-right'
              : 'left-[60px] origin-left'
          } ${
            expanded
              ? 'z-10 translate-x-0 scale-100 opacity-100'
              : pos.s === 'right'
                ? 'z-0 translate-x-4 scale-[0.92] opacity-0'
                : 'z-0 -translate-x-4 scale-[0.92] opacity-0'
          }`}
          style={{ width: PANEL_W }}
          aria-hidden={!expanded}
        >
          <div className="overflow-hidden rounded-[20px] bg-black/45 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
            <div className="px-5 py-4 pb-2">
              <span className="text-[13px] font-semibold tracking-wide text-white/60">
                工作台
              </span>
            </div>
            <div className="flex flex-col gap-1 p-2 pt-0 pb-3">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      item.onClick?.();
                      setManual(false);
                      setHover(false);
                    }}
                    className="group flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-all duration-200 hover:bg-white/10 text-white/90 hover:text-white"
                  >
                    <Icon className="h-5 w-5 text-white/80 transition-colors duration-200 group-hover:text-white" />
                    <span className="text-[15px] font-medium">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
