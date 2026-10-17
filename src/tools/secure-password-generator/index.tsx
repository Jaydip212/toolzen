import { useCallback, useMemo, useState } from 'react'
import { Checkbox, Input, Select } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { SegmentedControl, ToolPanel } from '@/tools/shared'
import { cn, formatNumber } from '@/lib/utils'
import {
  DEFAULT_GENERATOR_OPTIONS,
  MAX_LENGTH,
  MAX_WORDS,
  MIN_LENGTH,
  MIN_WORDS,
  SEPARATORS,
  WORDLIST,
  buildAlphabet,
  generateBatch,
  generatePassphrase,
  generatePassword,
  passphraseEntropyBits,
  passwordEntropyBits,
  strengthVerdict,
  validateOptions,
  type GeneratorOptions,
  type Separator,
} from './logic'

type Mode = 'password' | 'passphrase'

const METER_TONE: Record<number, string> = {
  0: 'bg-danger',
  1: 'bg-danger',
  2: 'bg-warning',
  3: 'bg-success',
  4: 'bg-success',
}

export function SecurePasswordGeneratorTool() {
  const [mode, setMode] = useState<Mode>('password')
  const [options, setOptions] = useState<GeneratorOptions>(DEFAULT_GENERATOR_OPTIONS)
  const [wordCount, setWordCount] = useState(4)
  const [separator, setSeparator] = useState<Separator>('-')
  const [capitalise, setCapitalise] = useState(false)
  const [batchSize, setBatchSize] = useState(5)
  // Seed the first result during the initial render so the tool is never empty.
  const [result, setResult] = useState(() => generatePassword(DEFAULT_GENERATOR_OPTIONS))
  const [batch, setBatch] = useState<string[]>([])

  const optionError = validateOptions(options)
  const alphabet = useMemo(() => buildAlphabet(options), [options])

  const generate = useCallback(() => {
    if (mode === 'password') {
      if (optionError) {
        setResult('')
        setBatch([])
        return
      }
      setResult(generatePassword(options))
      setBatch([])
      return
    }
    setResult(generatePassphrase(wordCount, separator, undefined, capitalise))
    setBatch([])
  }, [mode, options, optionError, wordCount, separator, capitalise])

  function update<K extends keyof GeneratorOptions>(key: K, value: GeneratorOptions[K]) {
    setOptions((current) => ({ ...current, [key]: value }))
  }

  const entropy =
    mode === 'password'
      ? passwordEntropyBits(options.length, alphabet.length)
      : passphraseEntropyBits(wordCount, WORDLIST.length, SEPARATORS.length)
  const verdict = strengthVerdict(entropy)

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="What to generate">
        <SegmentedControl
          label="Generation mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'password', label: 'Random password' },
            { value: 'passphrase', label: 'Passphrase' },
          ]}
        />
      </ToolPanel>

      {mode === 'password' ? (
        <ToolPanel title="Password rules">
          <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface-2/30 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Input
                label="Length"
                type="number"
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                value={options.length}
                containerClassName="w-full sm:w-32"
                onChange={(event) => update('length', Number(event.target.value))}
              />
              <input
                type="range"
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                value={options.length}
                aria-label="Password length"
                className="h-2 w-full flex-1 cursor-pointer accent-brand"
                onChange={(event) => update('length', Number(event.target.value))}
              />
            </div>

            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
              <Checkbox
                label="Lowercase letters (a–z)"
                checked={options.lower}
                onChange={(event) => update('lower', event.target.checked)}
              />
              <Checkbox
                label="Uppercase letters (A–Z)"
                checked={options.upper}
                onChange={(event) => update('upper', event.target.checked)}
              />
              <Checkbox
                label="Digits (0–9)"
                checked={options.digits}
                onChange={(event) => update('digits', event.target.checked)}
              />
              <Checkbox
                label="Symbols (!@#$…)"
                checked={options.symbols}
                onChange={(event) => update('symbols', event.target.checked)}
              />
              <Checkbox
                label="Exclude look-alike characters"
                hint="Removes 0/O, 1/l/I and similar, which are easy to misread."
                checked={options.excludeAmbiguous}
                onChange={(event) => update('excludeAmbiguous', event.target.checked)}
              />
              <Checkbox
                label="Guarantee one of each type"
                hint="Places at least one character from every selected set."
                checked={options.requireEachSet}
                onChange={(event) => update('requireEachSet', event.target.checked)}
              />
            </div>

            {optionError && <ErrorState title="Check the rules" message={optionError} />}
          </div>
        </ToolPanel>
      ) : (
        <ToolPanel title="Passphrase rules">
          <div className="grid gap-4 rounded-2xl border border-line bg-surface-2/30 p-4 sm:grid-cols-2">
            <Input
              label="Number of words"
              type="number"
              min={MIN_WORDS}
              max={MAX_WORDS}
              value={wordCount}
              hint={`Between ${MIN_WORDS} and ${MAX_WORDS}.`}
              onChange={(event) => setWordCount(Number(event.target.value))}
            />
            <Select
              label="Separator"
              value={separator}
              onChange={(event) => setSeparator(event.target.value as Separator)}
            >
              <option value="-">Hyphen ( - )</option>
              <option value=".">Full stop ( . )</option>
              <option value="_">Underscore ( _ )</option>
              <option value=" ">Space</option>
              <option value="+">Plus ( + )</option>
              <option value="">None</option>
            </Select>
            <Checkbox
              label="Capitalise each word"
              hint="Easier to read, but slightly harder to type."
              checked={capitalise}
              onChange={(event) => setCapitalise(event.target.checked)}
            />
          </div>
        </ToolPanel>
      )}

      <ToolPanel
        title="Result"
        actions={
          <Button variant="primary" size="sm" onClick={generate}>
            <Icon name="refresh" size={16} />
            Generate
          </Button>
        }
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface-2/40 p-4">
            <code className="min-w-0 flex-1 break-all font-mono text-base leading-relaxed text-fg">
              {result || '—'}
            </code>
            <CopyButton value={result} label="Copy" disabled={result === ''} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5" role="presentation">
              {[0, 1, 2, 3, 4].map((segment) => (
                <span
                  key={segment}
                  className={cn(
                    'h-2 flex-1 rounded-full',
                    segment <= verdict.score ? METER_TONE[verdict.score] : 'bg-line',
                  )}
                />
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn('text-sm font-medium', verdict.tone)}>{verdict.label}</span>
              <span className="text-xs text-muted">
                about {Math.round(entropy)} bits of entropy
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile
              label={mode === 'password' ? 'Alphabet' : 'Word list'}
              value={
                mode === 'password'
                  ? formatNumber(alphabet.length)
                  : formatNumber(WORDLIST.length)
              }
              hint={mode === 'password' ? 'distinct characters' : 'distinct words'}
            />
            <StatTile
              label="Entropy"
              value={`${Math.round(entropy)} bits`}
              hint="theoretical maximum"
            />
            <StatTile
              label={mode === 'password' ? 'Length' : 'Words'}
              value={
                mode === 'password' ? formatNumber(options.length) : formatNumber(wordCount)
              }
            />
          </div>
        </div>
      </ToolPanel>

      <ToolPanel
        title="Generate several at once"
        description="Handy when you are setting up a batch of accounts."
        actions={
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={50}
              value={batchSize}
              aria-label="How many to generate"
              containerClassName="w-24"
              onChange={(event) => setBatchSize(Number(event.target.value))}
            />
            <Button
              variant="outline"
              size="sm"
              disabled={mode === 'password' && Boolean(optionError)}
              onClick={() =>
                setBatch(
                  mode === 'password'
                    ? generateBatch(batchSize, options)
                    : Array.from({ length: Math.min(50, Math.max(1, batchSize)) }, () =>
                        generatePassphrase(wordCount, separator, undefined, capitalise),
                      ),
                )
              }
            >
              <Icon name="list" size={16} />
              Generate list
            </Button>
          </div>
        }
      >
        {batch.length === 0 ? (
          <p className="text-sm text-muted">
            Nothing generated yet. Each entry gets its own fresh randomness.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-line overflow-hidden rounded-xl border border-line">
            {batch.map((value, index) => (
              <div key={`${value}-${index}`} className="flex items-center gap-3 p-3">
                <Badge variant="neutral">{index + 1}</Badge>
                <code className="min-w-0 flex-1 break-all font-mono text-xs text-fg">{value}</code>
                <CopyButton value={value} label="Copy" />
              </div>
            ))}
          </div>
        )}
      </ToolPanel>

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-2/30 p-4 text-xs leading-relaxed text-muted">
        <p className="flex items-start gap-2">
          <Icon name="lock" size={14} className="mt-0.5 shrink-0 text-brand" />
          <span>
            Randomness comes from <code className="font-mono">crypto.getRandomValues</code>, the
            browser’s cryptographically secure generator, with rejection sampling so every
            character is equally likely. Nothing is sent anywhere and no generated value is stored.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-warning" />
          <span>
            Entropy is a theoretical maximum for an attacker who knows only the rules you chose. A
            password is only as safe as where you keep it — save generated passwords in a password
            manager and never reuse them across sites.
          </span>
        </p>
      </div>
    </div>
  )
}

export default SecurePasswordGeneratorTool
