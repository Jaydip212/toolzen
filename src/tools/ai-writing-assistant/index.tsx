import { AiTool } from '@/tools/shared/AiTool'

/** Draft text from a brief, in a chosen tone and shape. */
export default function AiWritingAssistant() {
  return <AiTool taskId="write" filename="draft.txt" />
}
