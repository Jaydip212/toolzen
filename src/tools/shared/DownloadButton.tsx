import { Button, type ButtonProps } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { downloadBlob, downloadDataUrl, downloadText } from '@/lib/download'

export interface DownloadButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /** Name the file is saved as, including extension. */
  filename: string
  /** Binary output. Takes precedence over `text` and `dataUrl`. */
  blob?: Blob | null
  /** Text output, downloaded as `mimeType` (default `text/plain`). */
  text?: string
  /** Data URL output, used for canvas and QR results. */
  dataUrl?: string
  mimeType?: string
  label?: string
}

/**
 * Download button that understands the three shapes tool output takes:
 * a Blob, a string, or a data URL. Disabled until there is something to save.
 */
export function DownloadButton({
  filename,
  blob,
  text,
  dataUrl,
  mimeType,
  label = 'Download',
  variant = 'primary',
  size = 'sm',
  disabled,
  ...rest
}: DownloadButtonProps) {
  const hasOutput = Boolean(blob) || Boolean(dataUrl) || (text !== undefined && text.length > 0)

  function handleDownload() {
    if (blob) downloadBlob(blob, filename)
    else if (dataUrl) downloadDataUrl(dataUrl, filename)
    else if (text !== undefined) downloadText(text, filename, mimeType)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={disabled || !hasOutput}
      {...rest}
    >
      <Icon name="download" size={16} />
      {label}
    </Button>
  )
}

export default DownloadButton
