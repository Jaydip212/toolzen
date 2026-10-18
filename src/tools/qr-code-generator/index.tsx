import { useCallback, useMemo, useState } from 'react'

import { DownloadButton, SegmentedControl, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Spinner } from '@/components/ui/Spinner'
import { StatTile } from '@/components/tools/StatTile'
import { Input, Textarea } from '@/components/ui/Form'

import {
  EC_LEVELS,
  OUTPUTS,
  SIZES,
  WIFI_SECURITY,
  capabilityNote,
  capacityFor,
  contactError,
  isTooLong,
  looksLikeLink,
  modeOf,
  qrName,
  qrSummary,
  vcardPayload,
  wifiPayload,
  type ContactFields,
  type EcLevel,
  type QrOutput,
  type WifiSecurity,
} from './logic'

/** What the code holds, which decides which fields are asked for. */
const KINDS = [
  { value: 'text', label: 'Text or link' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'contact', label: 'Contact card' },
] as const

type Kind = (typeof KINDS)[number]['value']

const EC_OPTIONS = EC_LEVELS.map((entry) => ({ value: entry.value, label: entry.label }))
const SIZE_OPTIONS = SIZES.map((entry) => ({ value: entry.value, label: entry.label }))
const OUTPUT_OPTIONS = OUTPUTS.map((entry) => ({ value: entry.value, label: entry.label }))
const WIFI_OPTIONS = WIFI_SECURITY.map((entry) => ({ value: entry.value, label: entry.label }))

const EMPTY_CONTACT: ContactFields = { name: '', phone: '', organisation: '', email: '' }

/** Create QR codes for links, text, Wi-Fi settings and contact cards. */
export default function QrCodeGenerator() {
  const [kind, setKind] = useState<Kind>('text')
  const [text, setText] = useState('')
  const [wifi, setWifi] = useState({ network: '', password: '', security: 'WPA' as WifiSecurity })
  const [contact, setContact] = useState<ContactFields>(EMPTY_CONTACT)

  const [level, setLevel] = useState<EcLevel>('M')
  const [size, setSize] = useState('256')
  const [output, setOutput] = useState<QrOutput>('png')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [download, setDownload] = useState<{ blob: Blob; name: string } | null>(null)

  // The payload the encoder will be handed, built up from whichever kind is
  // on screen. Everything the tool says about the code refers to this string.
  const payload = useMemo(() => {
    if (kind === 'text') return text
    if (kind === 'wifi') {
      return wifi.network.trim() === '' ? '' : wifiPayload(wifi.network, wifi.password, wifi.security)
    }
    if (contactError(contact)) return ''
    return vcardPayload(contact)
  }, [kind, text, wifi, contact])

  const note = capabilityNote(payload, level)
  const summary = qrSummary(payload, level)
  // A dense code still scans, so it is a warning rather than a block. Only an
  // empty payload, a payload past the ceiling, or an unusable contact card
  // should stop the button.
  const blocked = payload === '' || isTooLong(payload, level) || (kind === 'contact' && contactError(contact) !== null)

  const handleRender = useCallback(async () => {
    if (blocked || payload === '') return
    setBusy(true)
    setError(null)
    setPreview(null)
    setDownload(null)
    try {
      // The encoder is pulled in only once someone actually asks for a code,
      // so visitors who never open this tool never download it.
      const QR = (await import('qrcode')).default
      const pixels = Number(size)
      const options = { errorCorrection: level, margin: 4, width: pixels }
      const name = qrName(output)

      if (output === 'svg') {
        const svg = await QR.toString(payload, { ...options, type: 'svg' })
        setPreview(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
        setDownload({ blob: new Blob([svg], { type: 'image/svg+xml' }), name })
      } else {
        const url = await QR.toDataURL(payload, { ...options, type: 'image/png' })
        setPreview(url)
        // A data URL is the one portable way to get the bytes back out without
        // a canvas round trip, and at these sizes it is a few kilobytes.
        const base64 = url.slice(url.indexOf(',') + 1)
        const binary = atob(base64)
        const bytes = new Uint8Array(binary.length)
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
        setDownload({ blob: new Blob([bytes], { type: 'image/png' }), name })
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The QR code could not be drawn.')
    } finally {
      setBusy(false)
    }
  }, [blocked, payload, size, level, output])

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="1. What goes in the code">
        <SegmentedControl
          label="Kind of code"
          options={KINDS.map((entry) => ({ value: entry.value, label: entry.label }))}
          value={kind}
          onChange={(value) => setKind(value as Kind)}
        />

        {kind === 'text' && (
          <div className="mt-4">
            <label htmlFor="qr-text" className="text-sm font-medium text-fg">
              The text or link to encode
            </label>
            <Textarea
              id="qr-text"
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setPreview(null)
                setDownload(null)
              }}
              rows={5}
              spellCheck={false}
              placeholder={'https://example.com\n\nor any plain text'}
              className="mt-2 text-sm"
            />
            {looksLikeLink(text) && (
              <p className="mt-2 text-xs text-muted">
                This looks like a link. Most phone cameras open it straight to the browser.
              </p>
            )}
          </div>
        )}

        {kind === 'wifi' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="qr-network" className="text-sm font-medium text-fg">
                Network name
              </label>
              <Input
                id="qr-network"
                value={wifi.network}
                onChange={(event) => setWifi({ ...wifi, network: event.target.value })}
                placeholder="Jayvik Guest"
                className="mt-2 text-sm"
              />
            </div>
            <div>
              <SegmentedControl
                label="Security"
                options={WIFI_OPTIONS}
                value={wifi.security}
                onChange={(value) => setWifi({ ...wifi, security: value as WifiSecurity })}
              />
            </div>
            <div>
              <label htmlFor="qr-password" className="text-sm font-medium text-fg">
                Password
              </label>
              <Input
                id="qr-password"
                value={wifi.password}
                onChange={(event) => setWifi({ ...wifi, password: event.target.value })}
                disabled={wifi.security === 'nopass'}
                placeholder="The Wi-Fi password"
                className="mt-2 text-sm"
              />
            </div>
          </div>
        )}

        {kind === 'contact' && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="qr-name" className="text-sm font-medium text-fg">
                Name
              </label>
              <Input
                id="qr-name"
                value={contact.name}
                onChange={(event) => setContact({ ...contact, name: event.target.value })}
                className="mt-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="qr-org" className="text-sm font-medium text-fg">
                Organisation
              </label>
              <Input
                id="qr-org"
                value={contact.organisation}
                onChange={(event) => setContact({ ...contact, organisation: event.target.value })}
                className="mt-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="qr-phone" className="text-sm font-medium text-fg">
                Phone
              </label>
              <Input
                id="qr-phone"
                value={contact.phone}
                onChange={(event) => setContact({ ...contact, phone: event.target.value })}
                placeholder="+91 98765 43210"
                className="mt-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="qr-email" className="text-sm font-medium text-fg">
                Email
              </label>
              <Input
                id="qr-email"
                value={contact.email}
                onChange={(event) => setContact({ ...contact, email: event.target.value })}
                className="mt-2 text-sm"
              />
            </div>
          </div>
        )}

        <p className="mt-3 text-xs text-muted">Nothing is uploaded. The code is drawn in this tab.</p>
      </ToolPanel>

      <ToolPanel title="2. How it should scan">
        <div className="grid gap-4 sm:grid-cols-3">
          <SegmentedControl
            label="Recovery level"
            options={EC_OPTIONS}
            value={level}
            onChange={(value) => setLevel(value as EcLevel)}
          />
          <SegmentedControl
            label="Size"
            options={SIZE_OPTIONS}
            value={size}
            onChange={(value) => setSize(value)}
          />
          <SegmentedControl
            label="Format"
            options={OUTPUT_OPTIONS}
            value={output}
            onChange={(value) => setOutput(value as QrOutput)}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <StatTile label="Characters" value={payload === '' ? '—' : String(payload.length)} />
          <StatTile label="Mode" value={payload === '' ? '—' : modeOf(payload) === 'byte' ? 'byte data' : modeOf(payload)} />
          <StatTile
            label="Room left"
            value={payload === '' ? '—' : Math.max(0, capacityFor(payload, level) - payload.length).toLocaleString()}
          />
        </div>
        <p className="mt-3 text-sm text-fg">{summary}</p>
        {note && (
          <p className={`mt-2 text-xs ${isTooLong(payload, level) ? 'text-danger' : 'text-warning'}`}>{note}</p>
        )}
        <p className="mt-3 text-xs text-muted">
          A higher recovery level survives more damage, but every module carries data, so the code gets denser and
          harder to read from far away. M is the right choice for anything a phone camera will scan close up.
        </p>
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {preview ? (
        <ToolPanel title="Your code" className="border-success/30">
          <div className="flex flex-col-reverse items-start gap-5 sm:flex-row">
            <img
              src={preview}
              alt="The generated QR code"
              className="rounded-xl border border-border bg-white"
              style={{ width: 192, height: 192 }}
            />
            <div className="flex flex-col gap-3">
              <DownloadButton
                blob={download?.blob ?? new Blob()}
                filename={download?.name ?? qrName(output)}
                label={`Download the ${output.toUpperCase()}`}
                size="md"
              />
              <p className="text-sm text-muted">
                {size} px at {level} recovery — printed at 300 dpi that is{' '}
                {((Number(size) / 300) * 25.4).toFixed(1)} mm wide.
              </p>
              <p className="text-xs text-muted">
                Scan it before you print it. A code that scans on a laptop monitor can still fail on glossy paper at
                small sizes.
              </p>
            </div>
          </div>
        </ToolPanel>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => void handleRender()} disabled={busy || blocked} size="lg">
            {busy ? (
              <>
                <Spinner size={16} label="Drawing" />
                Drawing…
              </>
            ) : (
              <>
                <Icon name="qr" size={16} />
                Draw the code
              </>
            )}
          </Button>
          {blocked && note && <span className="text-sm text-danger">{note}</span>}

        </div>
      )}
    </div>
  )
}
