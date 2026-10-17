import ImageFormatConverter from '@/tools/image-format-converter'

/**
 * JPG to PNG.
 *
 * A thin page over the general converter, so the two cannot drift apart.
 * The format is already chosen for you, which is the whole point of a
 * job-specific page.
 */
export default function JpgToPng() {
  return <ImageFormatConverter forcedTarget="png" />
}
