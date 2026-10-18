import { AiTool } from '@/tools/shared/AiTool'

/** Answer a question using only the document that was pasted. */
export default function AiDocumentAssistant() {
  return <AiTool taskId="document-qa" filename="answer.txt" />
}
