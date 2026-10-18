import { AiTool } from '@/tools/shared/AiTool'

/** Fix grammar, spelling and punctuation, and list what changed. */
export default function AiGrammarHelper() {
  return <AiTool taskId="grammar" filename="corrected.txt" />
}
