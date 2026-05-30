import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';

export interface AnchorItem {
  id: number;
  key: string;
  label: string;
  prefix?: string;
}

export interface AnchorNavProps {
  activeId: string;
  items: AnchorItem[];
  onSelect: (key: string) => void;
}

const AnchorNav = ({ activeId, items, onSelect }: AnchorNavProps) => {
  if (!items || items.length === 0) {
    return null;
  }

  const activeIndex = items.findIndex((item) => item.key === activeId);

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 flex flex-col items-center py-4 px-2 rounded-full bg-black/30 backdrop-blur-md gap-2 z-50">
      <style>{`
        @keyframes anchor-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(245,166,35,0.3); }
          50% { box-shadow: 0 0 0 6px rgba(245,166,35,0.12); }
        }
      `}</style>
      <TooltipProvider delayDuration={100}>
        <div className="relative flex flex-col items-center gap-2">
          {activeIndex !== -1 && (
            <div
              className="absolute w-2.5 h-6 bg-[#F5A623] rounded-full animate-[anchor-pulse_2s_ease-in-out_infinite] transition-transform duration-300 ease-in-out"
              style={{
                transform: `translateY(${activeIndex * 40}px)`,
                top: '4px',
              }}
            />
          )}

          {items.map((item, index) => {
            const isActive = item.key === activeId;
            const prefix = item.prefix || `${index + 1}`.padStart(2, '0');
            return (
              <Tooltip key={item.key}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    aria-label={item.label}
                    onClick={() => onSelect(item.key)}
                    className="group relative flex items-center justify-center w-3 h-8 cursor-pointer z-10"
                  >
                    <div
                      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#66D3A5] opacity-0 transition-all duration-300 ease-out pointer-events-none ${
                        isActive
                          ? ''
                          : 'group-hover:opacity-30 group-hover:scale-100 scale-50'
                      }`}
                    />
                    <div
                      className={`relative w-2 h-2 rounded-full transition-colors transition-transform duration-300 pointer-events-none ${
                        isActive
                          ? 'opacity-0 scale-50 bg-[#66D3A5]'
                          : 'opacity-100 group-hover:scale-125 bg-[#66D3A5] group-hover:bg-[#00B87A]'
                      }`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="left"
                  sideOffset={14}
                  className="flex items-center gap-2 rounded-[12px] bg-[#1a202c] px-3 py-2 text-[15px] text-white shadow-xl animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 z-[100]"
                >
                  <div className="flex h-[22px] min-w-[28px] items-center justify-center rounded-[6px] bg-[#00D37A] px-1.5 text-xs font-bold leading-none tracking-wider">
                    {prefix}
                  </div>
                  <span className="font-medium tracking-wide">
                    {item.label}
                  </span>
                  <TooltipArrow
                    className="fill-[#1a202c]"
                    width={10}
                    height={6}
                  />
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
    </div>
  );
};

export { AnchorNav };
