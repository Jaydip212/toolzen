import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Icon, type IconName } from './Icon'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  /** Auto-dismiss delay in milliseconds. */
  duration?: number
}

interface ToastItem extends Required<Pick<ToastOptions, 'title' | 'variant'>> {
  id: number
  description?: string
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const variantStyles: Record<ToastVariant, { icon: IconName; accent: string }> = {
  success: { icon: 'circle-check', accent: 'text-success' },
  error: { icon: 'alert-circle', accent: 'text-danger' },
  info: { icon: 'info', accent: 'text-brand' },
}

/** Provides `useToast()` to the tree and renders the toast region. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const counter = useRef(0)
  const timers = useRef<number[]>([])

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = 'info', duration = 4000 }: ToastOptions) => {
      counter.current += 1
      const id = counter.current
      setItems((prev) => [...prev, { id, title, description, variant }])
      const handle = window.setTimeout(() => remove(id), duration)
      timers.current.push(handle)
    },
    [remove],
  )

  // Clear any pending timers when the provider unmounts.
  useEffect(() => {
    const handles = timers.current
    return () => handles.forEach((handle) => window.clearTimeout(handle))
  }, [])

  const value = useMemo(() => ({ toast }), [toast])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end"
        role="region"
        aria-label="Notifications"
      >
        {items.map((item) => {
          const style = variantStyles[item.variant]
          return (
            <div
              key={item.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-xl border border-line bg-surface p-4 shadow-pop"
            >
              <Icon name={style.icon} size={18} className={cn('mt-0.5 shrink-0', style.accent)} />
              <div className="flex-1">
                <p className="text-sm font-medium text-fg">{item.title}</p>
                {item.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{item.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-md p-1 text-muted transition-colors hover:bg-surface-2 hover:text-fg"
                aria-label="Dismiss notification"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

/** Access the toast dispatcher. Must be used inside `<ToastProvider>`. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within a ToastProvider')
  return ctx
}
