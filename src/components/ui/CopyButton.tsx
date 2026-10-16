import { useEffect, useRef, useState } from 'react'
import { copyText } from '@/lib/clipboard'
import { Button, type ButtonProps } from './Button'
import { Icon } from './Icon'

export interface CopyButtonProps extends Omit<ButtonProps, 'children' | 'onClick'> {
  /** Text placed on the clipboard. */
  value: string
  label?: string
  copiedLabel?: string
}

/** Copies `value` to the clipboard and confirms success inline. */
export function CopyButton({
  value,
  label = 'Copy',
  copiedLabel = 'Copied',
  variant = 'secondary',
  size = 'sm',
  disabled,
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  async function handleCopy() {
    const ok = await copyText(value)
    if (!ok) return
    setCopied(true)
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      disabled={disabled || !value}
      {...rest}
    >
      <Icon name={copied ? 'check' : 'copy'} size={16} />
      <span aria-live="polite">{copied ? copiedLabel : label}</span>
    </Button>
  )
}

export default CopyButton
