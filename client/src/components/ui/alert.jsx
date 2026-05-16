import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const alertVariants = cva('relative w-full rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'bg-card text-foreground border-border',
      destructive: 'border-destructive/50 text-destructive bg-destructive/10',
      success: 'border-success/50 text-success bg-success/10',
      warning: 'border-warning/50 text-warning-foreground bg-warning/10',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

function Alert({ className, variant, ...props }) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}

function AlertDescription({ className, ...props }) {
  return <div className={cn('text-sm leading-relaxed', className)} {...props} />
}

export { Alert, AlertDescription }
