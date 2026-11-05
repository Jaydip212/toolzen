import { useState } from 'react'
import { Input, Select } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { generateTokens, TOKEN_CHARSETS, type TokenCharset } from '@/lib/phase7/generators'

export function RandomTokenGenerator() {
  const [charset, setCharset] = useState<TokenCharset>('base64url')
  const [length, setLength] = useState('32')
  const [count, setCount] = useState('5')
  const [result, setResult] = useState<{ ok: true; tokens: string[] } | { ok: false; error: string } | null>(null)

  function run() {
    setResult(generateTokens(charset, Number(length.trim()), Number(count.trim())))
  }

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Token settings">
        <div className="grid gap-3 sm:grid-cols-3">
          <Select value={charset} onChange={(event) => setCharset(event.target.value as TokenCharset)} label="Characters" aria-label="Character set">
            {Object.entries(TOKEN_CHARSETS).map(([id, info]) => (
              <option key={id} value={id}>{info.label}</option>
            ))}
          </Select>
          <Input value={length} onChange={(event) => setLength(event.target.value)} inputMode="numeric" label="Length" aria-label="Token length" />
          <Input value={count} onChange={(event) => setCount(event.target.value)} inputMode="numeric" label="How many" aria-label="How many tokens" />
        </div>
        <button
          type="button"
          onClick={run}
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-brand-fg transition-opacity hover:opacity-90"
        >
          Generate
        </button>
      </ToolPanel>

      {result && !result.ok ? (
        <ErrorState title="Cannot generate those tokens" message={result.error} />
      ) : result && result.ok ? (
        <ToolPanel title="Tokens" description="Generated locally with crypto.getRandomValues. Nothing is sent anywhere or stored.">
          <OutputArea
            value={result.tokens.join('\n')}
            label="Random tokens"
            rows={8}
            filename="tokens.txt"
          />
        </ToolPanel>
      ) : null}
    </div>
  )
}

export default RandomTokenGenerator
