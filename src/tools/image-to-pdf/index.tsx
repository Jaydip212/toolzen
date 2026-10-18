import ImagesToPdf from '../images-to-pdf'

/**
 * Any image to PDF.
 *
 * The engine lives in the shared images-to-pdf component, because the only
 * thing that differs between this and the format-specific tools is which
 * files the picker accepts.
 */
export default function ImageToPdf() {
  return (
    <ImagesToPdf
      accept="image/*"
      hint="Each image becomes one page, in the order you add them."
      combinedName="images.pdf"
    />
  )
}
