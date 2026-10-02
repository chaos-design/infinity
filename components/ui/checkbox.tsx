import { Check } from 'lucide-react';
import * as React from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    { className, checked = false, disabled, onCheckedChange, ...props },
    ref,
  ) => (
    <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn(
          'peer h-4 w-4 shrink-0 cursor-pointer appearance-none rounded-[3px] border border-white/30 bg-transparent outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-white data-[state=checked]:bg-white',
          className,
        )}
        onChange={(event) => onCheckedChange?.(event.currentTarget.checked)}
        {...props}
      />
      <Check
        className={cn(
          'pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-slate-950 transition-opacity',
          checked ? 'opacity-100' : 'opacity-0',
        )}
      />
    </span>
  ),
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
