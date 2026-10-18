import { AiTool } from '@/tools/shared/AiTool'

/** Translate text into one of ten target languages. */
export default function AiTranslation() {
  return <AiTool taskId="translate" filename="translation.txt" />
}
