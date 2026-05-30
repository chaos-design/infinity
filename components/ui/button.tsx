import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/45 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'border border-white/15 bg-white text-slate-950 shadow-sm hover:bg-white/90',
        secondary:
          'border border-white/10 bg-white/10 text-white shadow-sm hover:bg-white/15',
        ghost: 'text-white/75 hover:bg-white/10 hover:text-white',
        destructive:
          'border border-red-400/25 bg-red-500/80 text-white shadow-sm hover:bg-red-500',
        outline:
          'border border-white/15 bg-transparent text-white hover:bg-white/10',
        icon: 'border border-white/10 bg-white/10 text-white hover:bg-white/15',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-11 rounded-2xl px-5 text-base',
        icon: 'h-9 w-9 rounded-full p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
