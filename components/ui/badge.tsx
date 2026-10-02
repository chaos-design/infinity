import { cva, type VariantProps } from 'class-variance-authority';
import type * as React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-white/35',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-white text-slate-950',
        secondary: 'border-white/10 bg-white/10 text-white',
        active: 'border-white/20 bg-white/20 text-white',
        destructive: 'border-red-400/25 bg-red-500/80 text-white',
        outline: 'border-white/15 bg-transparent text-white/75',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, className }))} {...props} />
  );
}

export { Badge, badgeVariants };
