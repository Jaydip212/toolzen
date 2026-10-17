import ImageFormatConverter from '@/tools/image-format-converter'

/**
 * webp converter.
 *
 * A thin page over the general converter, so the two cannot drift apart.
 * The target format is already chosen, which is the whole point of a
 * job-specific page.
 */
export default function WebpConverter() {
  return <ImageFormatConverter forcedTarget="webp" />
}
