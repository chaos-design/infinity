import * as LucideIcons from 'lucide-react';
import { Plus, Tag } from 'lucide-react';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export const TAG_ICONS = {
  BookOpen: LucideIcons.BookOpen,
  BriefcaseBusiness: LucideIcons.BriefcaseBusiness,
  Home: LucideIcons.Home,
  Star: LucideIcons.Star,
  Heart: LucideIcons.Heart,
  Flag: LucideIcons.Flag,
  Zap: LucideIcons.Zap,
  Coffee: LucideIcons.Coffee,
  Music: LucideIcons.Music,
  Lightbulb: LucideIcons.Lightbulb,
  Smile: LucideIcons.Smile,
  ThumbsUp: LucideIcons.ThumbsUp,
  MessageCircle: LucideIcons.MessageCircle,
  Globe: LucideIcons.Globe,
  Monitor: LucideIcons.Monitor,
  ShoppingCart: LucideIcons.ShoppingCart,
  Gamepad2: LucideIcons.Gamepad2,
  Palette: LucideIcons.Palette,
  Code: LucideIcons.Code,
  Database: LucideIcons.Database,
  Cloud: LucideIcons.Cloud,
  Camera: LucideIcons.Camera,
  Video: LucideIcons.Video,
  Mic: LucideIcons.Mic,
  Bookmark: LucideIcons.Bookmark,
  Folder: LucideIcons.Folder,
  FileText: LucideIcons.FileText,
  Clock: LucideIcons.Clock,
  Calendar: LucideIcons.Calendar,
  Award: LucideIcons.Award,
  Gift: LucideIcons.Gift,
  Rocket: LucideIcons.Rocket,
  Shield: LucideIcons.Shield,
  Key: LucideIcons.Key,
  Lock: LucideIcons.Lock,
  Eye: LucideIcons.Eye,
  Smartphone: LucideIcons.Smartphone,
  Server: LucideIcons.Server,
  Wifi: LucideIcons.Wifi,
  Sun: LucideIcons.Sun,
  Moon: LucideIcons.Moon,
  Anchor: LucideIcons.Anchor,
  Plane: LucideIcons.Plane,
  Car: LucideIcons.Car,
  Bike: LucideIcons.Bike,
  Map: LucideIcons.Map,
  Compass: LucideIcons.Compass,
  Bell: LucideIcons.Bell,
  Phone: LucideIcons.Phone,
  Mail: LucideIcons.Mail,
  Send: LucideIcons.Send,
  Download: LucideIcons.Download,
  Upload: LucideIcons.Upload,
  Link: LucideIcons.Link,
  Copy: LucideIcons.Copy,
  Scissors: LucideIcons.Scissors,
  Trash2: LucideIcons.Trash2,
  Edit: LucideIcons.Edit,
  PenLine: LucideIcons.PenLine,
  TrendingUp: LucideIcons.TrendingUp,
  Activity: LucideIcons.Activity,
  Briefcase: LucideIcons.Briefcase,
  Layers: LucideIcons.Layers,
  Layout: LucideIcons.Layout,
  LifeBuoy: LucideIcons.LifeBuoy,
  Cpu: LucideIcons.Cpu,
  Feather: LucideIcons.Feather,
  Headphones: LucideIcons.Headphones,
  Hexagon: LucideIcons.Hexagon,
  Image: LucideIcons.Image,
  Inbox: LucideIcons.Inbox,
  PenTool: LucideIcons.PenTool,
  PieChart: LucideIcons.PieChart,
  Printer: LucideIcons.Printer,
  Radio: LucideIcons.Radio,
  Target: LucideIcons.Target,
  Terminal: LucideIcons.Terminal,
  Wrench: LucideIcons.Wrench,
  Truck: LucideIcons.Truck,
  Umbrella: LucideIcons.Umbrella,
  Watch: LucideIcons.Watch,
  Wind: LucideIcons.Wind,
  Search: LucideIcons.Search,
  Settings: LucideIcons.Settings,
  User: LucideIcons.User,
  Users: LucideIcons.Users,
  Box: LucideIcons.Box,
  Hash: LucideIcons.Hexagon,
  Grid: LucideIcons.Grid,
};

export type TagIconName = keyof typeof TAG_ICONS;
type PickerPlacement = 'top' | 'bottom';
const ICON_PICKER_ESTIMATED_HEIGHT = 184;
const ICON_PICKER_VIEWPORT_GAP = 16;

interface TagInputProps {
  onSubmit: (tag: string, iconName?: TagIconName) => void;
  onClose: () => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
  initialIconName?: TagIconName | null;
  inputClassName?: string;
  closeOnBlur?: boolean;
  submitButtonLabel?: string;
  submitDisabled?: boolean;
}

export function TagInput({
  onSubmit,
  onClose,
  placeholder = '输入标签...',
  className = '',
  initialValue = '',
  initialIconName = null,
  inputClassName = 'w-16',
  closeOnBlur = true,
  submitButtonLabel,
  submitDisabled = false,
}: TagInputProps) {
  const [value, setValue] = useState(initialValue);
  const [selectedIcon, setSelectedIcon] = useState<TagIconName | null>(
    initialIconName,
  );
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [pickerPlacement, setPickerPlacement] =
    useState<PickerPlacement>('bottom');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasSubmittedRef = useRef(false);

  const updatePickerPlacement = useCallback(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const rect = container.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - rect.bottom - ICON_PICKER_VIEWPORT_GAP;
    const spaceAbove = rect.top - ICON_PICKER_VIEWPORT_GAP;

    if (spaceBelow >= ICON_PICKER_ESTIMATED_HEIGHT) {
      setPickerPlacement('bottom');
      return;
    }

    if (spaceAbove >= ICON_PICKER_ESTIMATED_HEIGHT) {
      setPickerPlacement('top');
      return;
    }

    setPickerPlacement(spaceAbove > spaceBelow ? 'top' : 'bottom');
  }, []);

  const submitOrClose = useCallback(() => {
    if (hasSubmittedRef.current) {
      return;
    }

    const trimmedValue = value.trim();
    if (submitDisabled) {
      return;
    }
    if (trimmedValue) {
      hasSubmittedRef.current = true;
      onSubmit(trimmedValue, selectedIcon || undefined);
    }
    onClose();
  }, [onClose, onSubmit, selectedIcon, submitDisabled, value]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const handleFocusOut = (event: FocusEvent) => {
      if (!closeOnBlur) {
        return;
      }
      const nextTarget = event.relatedTarget as Node | null;
      if (nextTarget && container.contains(nextTarget)) {
        return;
      }
      submitOrClose();
    };

    container.addEventListener('focusout', handleFocusOut);
    return () => container.removeEventListener('focusout', handleFocusOut);
  }, [closeOnBlur, submitOrClose]);

  useEffect(() => {
    if (!showIconPicker) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowIconPicker(false);
      }
    };

    updatePickerPlacement();
    window.addEventListener('resize', updatePickerPlacement);
    document.addEventListener('mousedown', handleOutsideClick);

    return () => {
      window.removeEventListener('resize', updatePickerPlacement);
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showIconPicker, updatePickerPlacement]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      submitOrClose();
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  const SelectedIconComp = selectedIcon ? TAG_ICONS[selectedIcon] : Tag;
  const canSubmit = value.trim().length > 0 && !submitDisabled;

  const filteredIcons = Object.entries(TAG_ICONS).filter(([name]) =>
    name.toLowerCase().includes(iconSearchQuery.toLowerCase()),
  );

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center gap-1 rounded-full border border-white/20 bg-black/35 p-0.5 ${className}`}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => {
          if (!showIconPicker) {
            updatePickerPlacement();
          }
          setShowIconPicker(!showIconPicker);
        }}
        className="h-6 w-6 flex-shrink-0 rounded-full p-0 hover:bg-white/20"
        title="选择图标"
      >
        {SelectedIconComp ? (
          <SelectedIconComp className="h-3.5 w-3.5 text-white" />
        ) : (
          <Tag className="h-3.5 w-3.5 text-white/60" />
        )}
      </Button>

      <Input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className={`h-auto min-w-[3.75rem] cursor-text border-0 bg-transparent py-0 text-xs leading-5 text-white caret-white shadow-none placeholder:text-white/40 selection:bg-white/25 focus-visible:ring-0 ${inputClassName}`}
        placeholder={placeholder}
      />

      {submitButtonLabel && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={submitOrClose}
          disabled={!canSubmit}
          aria-label={submitButtonLabel}
          title={submitButtonLabel}
          className={`h-7 w-7 flex-shrink-0 rounded-full p-0 ${
            canSubmit
              ? 'bg-white/18 text-white hover:bg-white/24'
              : 'cursor-not-allowed bg-white/8 text-white/30'
          }`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      )}

      {showIconPicker && (
        <div
          className={`absolute left-0 z-[240] flex w-64 flex-col rounded-xl border border-white/10 bg-slate-950/95 py-2.5 shadow-2xl backdrop-blur-xl ${
            pickerPlacement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          data-testid="tag-icon-picker"
          data-placement={pickerPlacement}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <div className="mb-2 px-2.5">
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/40 px-2 py-1">
              <LucideIcons.Search className="h-3.5 w-3.5 text-white/50" />
              <Input
                type="text"
                value={iconSearchQuery}
                onChange={(e) => setIconSearchQuery(e.target.value)}
                placeholder="搜索图标..."
                className="h-auto w-full border-0 bg-transparent p-0 text-xs text-white shadow-none placeholder:text-white/40 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setShowIconPicker(false);
                    inputRef.current?.focus();
                  }
                }}
              />
            </div>
          </div>
          {filteredIcons.length > 0 ? (
            <div className="grid max-h-[168px] grid-cols-6 gap-1 overflow-y-auto overscroll-contain px-2.5 custom-scrollbar">
              {filteredIcons.map(([name, IconComp]) => (
                <Button
                  key={name}
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedIcon(name as TagIconName);
                    setShowIconPicker(false);
                    setIconSearchQuery('');
                    inputRef.current?.focus();
                  }}
                  className={`h-6 w-6 rounded-lg p-0 ${selectedIcon === name ? 'bg-white/20 text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'}`}
                  title={name}
                >
                  <IconComp className="h-3.5 w-3.5" />
                </Button>
              ))}
            </div>
          ) : (
            <div className="mx-3 flex h-20 items-center justify-center text-xs text-white/40">
              没有找到相关图标
            </div>
          )}
        </div>
      )}
    </div>
  );
}
