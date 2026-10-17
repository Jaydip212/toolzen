import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { cn, formatNumber } from '@/lib/utils'
import { analyzePassword, type PatternFinding } from './logic'

const SEVERITY_TONE: Record<PatternFinding['severity'], string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-muted',
}

const METER_TONE: Record<string, string> = {
  'very-weak': 'bg-danger',
  weak: 'bg-danger',
  fair: 'bg-warning',
  strong: 'bg-success',
  'very-strong': 'bg-success',
}

export function PasswordStrengthEstimatorTool() {
  const [password, setPassword] = useState('')
  const [revealed, setRevealed] = useState(false)

  const analysis = useMemo(() => analyzePassword(password), [password])
  const hasPassword = password.length > 0

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel
        title="Check a password"
        description="Type or paste a password. Everything is evaluated here in your browser."
      >
        <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface-2/30 p-4">
          <Input
            label="Password"
            type={revealed ? 'text' : 'password'}
            value={password}
            autoComplete="off"
            spellCheck={false}
            className="font-mono"
            placeholder="Type the password you want to check…"
            onChange={(event) => setPassword(event.target.value)}
            trailing={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={revealed ? 'Hide password' : 'Show password'}
                title={revealed ? 'Hide password' : 'Show password'}
                onClick={() => setRevealed((current) => !current)}
              >
                <Icon name={revealed ? 'eye-off' : 'eye'} size={16} />
              </Button>
            }
          />

          <div className="flex flex-col gap-2">
            <div className="flex gap-1.5" role="presentation">
              {[0, 1, 2, 3, 4].map((segment) => {
                const filled = hasPassword && segment <= analysis.band.score
                return (
                  <span
                    key={segment}
                    className={cn(
                      'h-2 flex-1 rounded-full transition-colors duration-200',
                      filled ? METER_TONE[analysis.band.level] : 'bg-line',
                    )}
                  />
                )
              })}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={cn('text-sm font-medium', analysis.band.tone)}>
                {analysis.band.label}
              </span>
              {hasPassword && (
                <span className="text-xs text-muted">
                  about {formatNumber(Math.round(analysis.entropyBits))} bits of entropy
                </span>
              )}
            </div>
          </div>
        </div>
      </ToolPanel>

      {!hasPassword && (
        <EmptyState
          icon="shield"
          title="Enter a password to estimate its strength"
          description="The estimator looks at length, the character sets you use, and common patterns such as repeated characters, keyboard walks, dictionary words and known-breached passwords."
        />
      )}

      {hasPassword && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="Entropy"
              value={`${Math.round(analysis.entropyBits)} bits`}
              hint="after pattern penalties"
            />
            <StatTile label="Length" value={formatNumber(password.length)} hint="characters" />
            <StatTile
              label="Character pool"
              value={formatNumber(analysis.charset.poolSize)}
              hint="distinct characters it draws from"
            />
            <StatTile
              label="Guesses needed"
              value={
                analysis.guesses >= 1e15
                  ? `${analysis.guesses.toExponential(1)}`
                  : formatNumber(Math.round(analysis.guesses))
              }
              hint="on average, to find it"
            />
          </div>

          <ToolPanel title="Character sets in use">
            {analysis.charset.labels.length === 0 ? (
              <p className="text-sm text-muted">No recognisable character sets.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {analysis.charset.labels.map((label) => (
                  <Badge key={label} variant="brand">
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </ToolPanel>

          <ToolPanel
            title="Patterns that weaken it"
            description="Anything found here makes the password easier to guess than its length suggests."
          >
            {analysis.patterns.length === 0 ? (
              <p className="flex items-center gap-2 rounded-2xl border border-success/30 bg-success/8 p-4 text-sm text-fg">
                <Icon name="circle-check" size={18} className="shrink-0 text-success" />
                No common weak patterns detected.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {analysis.patterns.map((finding) => (
                  <li
                    key={finding.id}
                    className="flex items-start gap-3 rounded-2xl border border-line bg-surface-2/30 p-4"
                  >
                    <Icon
                      name="alert-triangle"
                      size={18}
                      className={cn('mt-0.5 shrink-0', SEVERITY_TONE[finding.severity])}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg">{finding.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">{finding.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ToolPanel>

          <ToolPanel
            title="Estimated time to crack"
            description="How long an attacker would need, at a few realistic guessing speeds."
          >
            <div className="overflow-hidden rounded-xl border border-line">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-surface-2">
                  <tr className="border-b border-line">
                    <th scope="col" className="px-3 py-2 text-left font-medium text-muted">
                      Attack
                    </th>
                    <th scope="col" className="px-3 py-2 text-left font-medium text-muted">
                      Time to crack
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.estimates.map((estimate) => (
                    <tr
                      key={estimate.scenario.id}
                      className="border-b border-line last:border-b-0"
                    >
                      <td className="px-3 py-3 align-top">
                        <p className="font-medium text-fg">{estimate.scenario.label}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-muted">
                          {estimate.scenario.detail}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 align-top font-medium text-fg">
                        {estimate.human}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ToolPanel>

          <ToolPanel title="How to make it stronger">
            <ul className="flex flex-col gap-2">
              {analysis.advice.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-fg">
                  <Icon name="arrow-right" size={15} className="mt-1 shrink-0 text-brand" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </ToolPanel>
        </>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-line bg-surface-2/30 p-4 text-xs leading-relaxed text-muted">
        <p className="flex items-start gap-2">
          <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-brand" />
          <span>
            This password is checked entirely in your browser. It is never sent to a server, never
            logged and never stored — reload the page and it is gone.
          </span>
        </p>
        <p className="flex items-start gap-2">
          <Icon name="alert-triangle" size={14} className="mt-0.5 shrink-0 text-warning" />
          <span>
            This is an estimate, not a verdict. The crack times are order-of-magnitude figures for a
            stolen password hash. The biggest real-world risks are reusing a password across sites
            and a breach at a site that stores it — neither of which any strength meter can see.
            Use a password manager and a unique password everywhere.
          </span>
        </p>
      </div>
    </div>
  )
}

export default PasswordStrengthEstimatorTool
