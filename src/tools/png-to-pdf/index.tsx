import ImagesToPdf from '../images-to-pdf'

/**
 * PNG images to PDF.
 *
 * Same engine as the general image tool, with the picker narrowed to PNG.
 * Transparent PNGs are flattened onto white, because a PDF page has no way
 * to show see-through areas over the paper background.
 */
export default function PngToPdf() {
  return (
    <ImagesToPdf
      accept="image/png"
      hint="PNG files only. Each becomes one page, in the order you add them."
      combinedName="png-images.pdf"
    />
  )
}
