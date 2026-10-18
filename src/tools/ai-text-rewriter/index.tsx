import { AiTool } from '@/tools/shared/AiTool'

/** Rewrite text in a simpler, shorter, more formal or more engaging style. */
export default function AiTextRewriter() {
  return <AiTool taskId="rewrite" filename="rewritten.txt" />
}
