import ImagesToPdf from '../images-to-pdf'

/**
 * JPG images to PDF.
 *
 * Same engine as the general image tool, with the picker narrowed to JPEG.
 * Each image becomes one page, in the order they are added.
 */
export default function JpgToPdf() {
  return (
    <ImagesToPdf
      accept="image/jpeg"
      hint="JPG files only. Each becomes one page, in the order you add them."
      combinedName="jpg-images.pdf"
    />
  )
}
