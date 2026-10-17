import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Badge } from '@/components/ui/Badge'
import { CopyButton } from '@/components/ui/CopyButton'
import { EmptyState } from '@/components/ui/EmptyState'
import { ToolPanel } from '@/tools/shared'
import { cn } from '@/lib/utils'
import {
  adjustLightness,
  bestTextColor,
  contrastRatio,
  contrastVerdict,
  formatHsl,
  formatRgb,
  formatRgba,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToShortHex,
} from './logic'
const PRESETS = [
  '#4f46e5',
  '#0ea5e9',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#8b5cf6',
  '#64748b',
]

/** One labelled output row with a copy button. */
function ValueRow({
  label,
  value,
  swatch,
}: {
  label: string
  value: string
  swatch?: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-2 last:border-b-0">
      <span className="w-32 shrink-0 text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {swatch && (
        <span
          className="h-5 w-5 shrink-0 rounded border border-line"
          style={{ backgroundColor: swatch }}
          aria-hidden="true"
        />
      )}
      <code className="min-w-0 flex-1 truncate font-mono text-sm text-fg">{value}</code>
      <CopyButton value={value} label="Copy" />
    </div>
  )
}

export function ColorConverterTool() {
  const [input, setInput] = useState('#4f46e5')

  const rgb = useMemo(() => parseColor(input), [input])

  const derived = useMemo(() => {
    if (!rgb) return null
    return {
      hex: rgbToHex(rgb),
      shortHex: rgbToShortHex(rgb),
      rgb: formatRgb(rgb),
      rgba: formatRgba(rgb, 1),
      hsl: formatHsl(rgbToHsl(rgb)),
      hsv: rgbToHsv(rgb),
      hslValues: rgbToHsl(rgb),
      whiteContrast: contrastRatio(rgb, { r: 255, g: 255, b: 255 }),
      blackContrast: contrastRatio(rgb, { r: 0, g: 0, b: 0 }),
      bestText: bestTextColor(rgb),
      lighter: rgbToHex(adjustLightness(rgb, 12)),
      darker: rgbToHex(adjustLightness(rgb, -12)),
    }
  }, [rgb])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <Input
          label="Colour value"
          value={input}
          containerClassName="min-w-64 flex-1"
          placeholder="#4f46e5, rgb(79, 70, 229), hsl(243, 75%, 59%) or a name like tomato"
          hint="Accepts hex, rgb(), rgba(), hsl(), hsla() and CSS colour names."
          onChange={(event) => setInput(event.target.value)}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="colour-picker" className="text-sm font-medium text-fg">
            Pick
          </label>
          <input
            id="colour-picker"
            type="color"
            value={rgb ? rgbToHex(rgb) : '#000000'}
            onChange={(event) => setInput(event.target.value)}
            className="h-10 w-16 cursor-pointer rounded-xl border border-line bg-surface p-1"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            title={preset}
            aria-label={`Use ${preset}`}
            onClick={() => setInput(preset)}
            className={cn(
              'h-8 w-8 rounded-full border border-line transition-transform hover:scale-110',
              rgb && rgbToHex(rgb) === preset && 'ring-2 ring-brand ring-offset-2 ring-offset-surface',
            )}
            style={{ backgroundColor: preset }}
          />
        ))}
        <Button variant="ghost" size="sm" onClick={() => setInput('')} disabled={!input}>
          <Icon name="trash" size={16} />
          Clear
        </Button>
      </div>

      {!rgb && (
        <>
          {input.trim() === '' ? (
            <EmptyState
              icon="palette"
              title="Enter a colour to convert"
              description="Type a hex code, an rgb() or hsl() value, or a CSS colour name. You can also use the picker above."
              action={
                <Button variant="secondary" onClick={() => setInput('#4f46e5')}>
                  Try #4f46e5
                </Button>
              }
            />
          ) : (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-2xl border border-danger/30 bg-danger/8 p-4 text-sm"
            >
              <Icon name="alert-triangle" size={18} className="mt-0.5 shrink-0 text-danger" />
              <div>
                <p className="font-medium text-fg">That colour could not be read</p>
                <p className="mt-1 text-muted">
                  Try a hex value such as <code className="font-mono">#4f46e5</code>, an{' '}
                  <code className="font-mono">rgb(79, 70, 229)</code> value, or a CSS colour name
                  like <code className="font-mono">tomato</code>.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {rgb && derived && (
        <>
          {/* Large preview swatch */}
          <div
            className="flex h-28 items-center justify-center rounded-2xl border border-line text-sm font-semibold"
            style={{ backgroundColor: derived.hex, color: derived.bestText }}
          >
            {derived.hex} — best text colour {derived.bestText}
          </div>

          <ToolPanel title="All formats" description="Every representation of the same colour.">
            <div className="rounded-2xl border border-line bg-surface-2/20 px-4">
              <ValueRow label="HEX" value={derived.hex} swatch={derived.hex} />
              <ValueRow label="HEX short" value={derived.shortHex} swatch={derived.shortHex} />
              <ValueRow label="RGB" value={derived.rgb} />
              <ValueRow label="RGBA" value={derived.rgba} />
              <ValueRow label="HSL" value={derived.hsl} />
              <ValueRow
                label="HSV / HSB"
                value={`hsv(${derived.hsv.h}, ${derived.hsv.s}%, ${derived.hsv.v}%)`}
              />
              <ValueRow label="CSS name" value={cssName(derived.hex)} />
            </div>
          </ToolPanel>

          <ToolPanel title="Shades" description="The same hue, lighter and darker.">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'Lighter', hex: derived.lighter },
                { label: 'Base', hex: derived.hex },
                { label: 'Darker', hex: derived.darker },
              ].map((shade) => (
                <div
                  key={shade.label}
                  className="flex flex-col gap-2 rounded-xl border border-line p-3"
                >
                  <div
                    className="h-14 rounded-lg border border-line"
                    style={{ backgroundColor: shade.hex }}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted">{shade.label}</span>
                    <code className="font-mono text-xs text-fg">{shade.hex}</code>
                  </div>
                </div>
              ))}
            </div>
          </ToolPanel>

          <ToolPanel
            title="Contrast and accessibility"
            description="WCAG 2.1 contrast ratios against black and white text."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: 'White text on this colour', ratio: derived.whiteContrast, fg: '#ffffff' },
                { label: 'Black text on this colour', ratio: derived.blackContrast, fg: '#000000' },
              ].map((item) => {
                const verdict = contrastVerdict(item.ratio)
                return (
                  <div key={item.label} className="flex flex-col gap-3 rounded-xl border border-line p-4">
                    <div
                      className="flex h-14 items-center justify-center rounded-lg border border-line text-sm font-semibold"
                      style={{ backgroundColor: derived.hex, color: item.fg }}
                    >
                      Sample text
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted">{item.label}</span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-fg">
                        {item.ratio.toFixed(2)}:1
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant={verdict.aa ? 'success' : 'danger'}>
                        AA {verdict.aa ? 'pass' : 'fail'}
                      </Badge>
                      <Badge variant={verdict.aaLarge ? 'success' : 'danger'}>
                        AA large {verdict.aaLarge ? 'pass' : 'fail'}
                      </Badge>
                      <Badge variant={verdict.aaa ? 'success' : 'warning'}>
                        AAA {verdict.aaa ? 'pass' : 'fail'}
                      </Badge>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-muted">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              AA needs 4.5:1 for normal text and 3:1 for large text. AAA needs 7:1 and 4.5:1
              respectively. These ratios are calculated from the WCAG 2.1 relative-luminance
              formula.
            </p>
          </ToolPanel>
        </>
      )}
    </div>
  )
}

/** Find the CSS colour name for a hex value, if there is one. */
function cssName(hex: string): string {
  const names: Record<string, string> = {
    '#000000': 'black',
    '#ffffff': 'white',
    '#ff0000': 'red',
    '#00ff00': 'lime',
    '#0000ff': 'blue',
    '#ffff00': 'yellow',
    '#00ffff': 'aqua',
    '#ff00ff': 'fuchsia',
    '#808080': 'gray',
    '#c0c0c0': 'silver',
    '#800000': 'maroon',
    '#808000': 'olive',
    '#008000': 'green',
    '#800080': 'purple',
    '#008080': 'teal',
    '#000080': 'navy',
    '#ffa500': 'orange',
    '#ffc0cb': 'pink',
    '#a52a2a': 'brown',
    '#ffd700': 'gold',
  }
  return names[hex.toLowerCase()] ?? '—'
}

export default ColorConverterTool
