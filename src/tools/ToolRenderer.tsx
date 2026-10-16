import type { ComponentType } from 'react'
import { WordCounterTool } from './word-counter'
import { CharacterCounterTool } from './character-counter'
import { CaseConverterTool } from './case-converter'

/**
 * Maps a registry tool id to its implementation.
 *
 * Adding a new tool means adding one entry here plus its component folder —
 * the tool page shell, routing, search and SEO all pick it up automatically.
 * A tool with no entry here is treated as "not yet implemented" and the tool
 * page renders a coming-soon notice instead of a fake control.
 */
const toolComponents: Record<string, ComponentType> = {
  'word-counter': WordCounterTool,
  'character-counter': CharacterCounterTool,
  'case-converter': CaseConverterTool,
}

/** Resolve the component for a tool id, if it has been implemented. */
export function getToolComponent(id: string): ComponentType | undefined {
  return toolComponents[id]
}

/** Whether a tool id has a working implementation. */
export function hasToolComponent(id: string): boolean {
  return id in toolComponents
}
