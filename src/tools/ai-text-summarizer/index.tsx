import { AiTool } from '@/tools/shared/AiTool'

/** Condense a long piece of text into a shorter summary. */
export default function AiTextSummarizer() {
  return <AiTool taskId="summarise" filename="summary.txt" />
}
