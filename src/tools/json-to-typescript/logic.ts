/**
 * JSON → TypeScript interface generation.
 *
 * Deterministic structural typing: every object becomes a named interface,
 * arrays get their element type, and null becomes an explicit union member.
 * No heuristics about optionality — a key present in the JSON is emitted as
 * required, because inventing `?` where the data didn't say so would be a lie.
 */

export interface TypeResult {
  /** The generated TypeScript, interfaces plus an exported root alias. */
  code: string
  /** Names of every interface emitted, in dependency order. */
  interfaces: string[]
}

const RESERVED = new Set(['default', 'delete', 'function', 'class', 'interface', 'new', 'return', 'type', 'var', 'void'])

/** Turn a JSON key into a safe TypeScript property name. */
export function propertyName(key: string): string {
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) && !RESERVED.has(key)) return key
  return `'${key.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

/** Turn a JSON key into a valid interface name fragment, e.g. "order-item" → "OrderItem". */
export function interfaceName(key: string): string {
  const parts = key.split(/[^A-Za-z0-9]+/).filter((part) => part !== '')
  const joined = parts.map((part) => part[0]!.toUpperCase() + part.slice(1)).join('')
  const safe = /^[A-Za-z]/.test(joined) ? joined : `Item${joined}`
  return safe === '' ? 'Item' : safe
}

interface Ctx {
  order: string[]
  blocks: Map<string, string>
  counter: Map<string, number>
  /** Objects already emitted, keyed by their JSON shape, so identical shapes share one interface. */
  byShape: Map<string, string>
}

/** Reserve a unique interface name, de-duplicating with a numeric suffix. */
function reserveName(ctx: Ctx, base: string): string {
  const seen = ctx.counter.get(base) ?? 0
  ctx.counter.set(base, seen + 1)
  const name = seen === 0 ? base : `${base}${seen + 1}`
  return name
}

function describeObject(value: Record<string, unknown>, ctx: Ctx, name: string): void {
  // The name is already reserved by the caller — record it before recursing so
  // the root interface is the first declaration emitted.
  ctx.order.push(name)
  const lines: string[] = []
  for (const [key, child] of Object.entries(value)) {
    lines.push(`  ${propertyName(key)}: ${describe(child, ctx, key)}`)
  }
  ctx.blocks.set(name, `interface ${name} {\n${lines.join('\n')}\n}`)
}

function describe(value: unknown, ctx: Ctx, keyHint: string): string {
  if (value === null) return 'null'
  switch (typeof value) {
    case 'string':
      return 'string'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]'
    const members = [...new Set(value.map((item) => describe(item, ctx, singular(keyHint))))]
    return members.length === 1 ? `${members[0]}[]` : `(${members.join(' | ')})[]`
  }
  // Object: compute the members first, then key the dedupe cache on the
  // structural signature — two objects with the same keys and types share one
  // interface even when their data values differ.
  const record = value as Record<string, unknown>
  const lines = Object.entries(record).map(
    ([key, child]) => `  ${propertyName(key)}: ${describe(child, ctx, key)}`,
  )
  const signature = JSON.stringify(lines)
  const existing = ctx.byShape.get(signature)
  if (existing !== undefined) return existing
  const name = reserveName(ctx, interfaceName(keyHint))
  ctx.byShape.set(signature, name)
  ctx.order.push(name)
  ctx.blocks.set(name, `interface ${name} {\n${lines.join('\n')}\n}`)
  return name
}

/** Pluralise → singularise the key hint for array element interface names. */
function singular(key: string): string {
  if (/ies$/i.test(key)) return key.replace(/ies$/i, 'y')
  if (/(ses|xes|zes|ches|shes)$/i.test(key)) return key.replace(/es$/i, '')
  if (/s$/i.test(key) && !/ss$/i.test(key)) return key.replace(/s$/i, '')
  return key
}

/** Generate TypeScript interfaces for a parsed JSON value. */
export function generateTypes(value: unknown, rootName = 'Root'): TypeResult {
  const ctx: Ctx = { order: [], blocks: new Map(), counter: new Map(), byShape: new Map() }

  // An object root becomes the root interface itself — no pointless "type Root = Root" alias.
  // The root name is reserved first so it is the first declaration emitted.
  if (value !== null && !Array.isArray(value) && typeof value === 'object') {
    const name = reserveName(ctx, interfaceName(rootName))
    describeObject(value as Record<string, unknown>, ctx, name)
  } else {
    const rootType = describe(value, ctx, rootName)
    ctx.order.push(`type:${rootName}`)
    ctx.blocks.set(`type:${rootName}`, `export type ${rootName} = ${rootType}`)
  }

  const blocks = ctx.order.map((name) => ctx.blocks.get(name)!)
  return { code: blocks.join('\n\n') + '\n', interfaces: ctx.order }
}

/** Full entry point: parse JSON text, or return a readable error. */
export function generateFromJson(text: string, rootName = 'Root'): { ok: true; result: TypeResult } | { ok: false; error: string } {
  if (text.trim() === '') return { ok: false, error: 'Paste some JSON to generate types from.' }
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown parse error'
    return { ok: false, error: `That is not valid JSON — ${message}` }
  }
  return { ok: true, result: generateTypes(parsed, rootName) }
}
