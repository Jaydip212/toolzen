import { AiTool } from '@/tools/shared/AiTool'

/** Draft an email from a short brief, with a chosen tone and length. */
export default function AiEmailDrafting() {
  return <AiTool taskId="email" filename="email.txt" />
}
