import * as React from 'react';
import { cn } from '../../lib/utils';

type RadioGroupContextValue = {
  disabled?: boolean;
  name: string;
  onValueChange?: (value: string) => void;
  value?: string;
};

const RadioGroupContext = React.createContext<RadioGroupContextValue | null>(
  null,
);

interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  disabled?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  value?: string;
}

const RadioGroup = React.forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    { className, disabled = false, name, onValueChange, value, ...props },
    ref,
  ) => {
    const generatedName = React.useId();

    return (
      <RadioGroupContext.Provider
        value={{
          disabled,
          name: name ?? generatedName,
          onValueChange,
          value,
        }}
      >
        <div
          ref={ref}
          role="radiogroup"
          className={cn('grid gap-2', className)}
          {...props}
        />
      </RadioGroupContext.Provider>
    );
  },
);
RadioGroup.displayName = 'RadioGroup';

interface RadioGroupItemProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'checked' | 'name' | 'onChange' | 'type'
  > {
  value: string;
}

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, disabled, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const checked = context?.value === value;
    const isDisabled = disabled ?? context?.disabled ?? false;

    return (
      <input
        ref={ref}
        type="radio"
        name={context?.name}
        value={value}
        checked={checked}
        disabled={isDisabled}
        data-state={checked ? 'checked' : 'unchecked'}
        className={cn('sr-only', className)}
        onChange={() => context?.onValueChange?.(value)}
        {...props}
      />
    );
  },
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };
