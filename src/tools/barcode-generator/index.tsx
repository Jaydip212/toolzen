import { useEffect, useRef, useState } from 'react'

import { DownloadButton, SegmentedControl, ToolPanel } from '@/tools/shared'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { Input } from '@/components/ui/Form'
import { FORMATS, barcodeName, barcodeSummary, encodeValue, isNumeric, validateInput, type BarcodeFormat } from './logic'

const FORMAT_OPTIONS = FORMATS.map((entry) => ({ value: entry.value, label: entry.label }))

/** What the user typed, remembered per format so switching back is not a loss. */
const START: Record<BarcodeFormat, string> = {
  CODE128: 'TOOLZEN-2026',
  EAN13: '4006381333931',
  EAN8: '96385074',
  CODE39: 'TOOLZEN',
  ITF14: '15400141288763',
}

/** Generate 1D barcodes for printing, with the check digit worked out for you. */
export default function BarcodeGenerator() {
  const [format, setFormat] = useState<BarcodeFormat>('CODE128')
  const [values, setValues] = useState<Record<BarcodeFormat, string>>(START)
  const [scale, setScale] = useState(2)
  const [height, setHeight] = useState(60)
  const [showNumber, setShowNumber] = useState(true)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [drawn, setDrawn] = useState(false)
  // The serialised SVG is kept in state so the download is exactly the code
  // that was drawn, and so the download button only enables once it exists.
  const [svg, setSvg] = useState('')

  const input = values[format]
  const value = encodeValue(format, input)
  const problem = validateInput(format, input)
  const summary = barcodeSummary(format, input)

  // JsBarcode writes into the DOM directly, so the redraw is an effect rather
  // than a render. The canvas is what a person sees; the SVG is what downloads,
  // and both are written from the same value in one pass.
  useEffect(() => {
    if (!value || !canvasRef.current || !svgRef.current) {
      setDrawn(false)
      setSvg('')
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const JsBarcode = (await import('jsbarcode')).default
        if (cancelled) return
        const options = {
          width: scale,
          height,
          displayValue: showNumber,
          fontSize: 16,
          // The margin is what keeps a scanner from reading the neighbouring
          // ink as part of the code.
          margin: 10,
          lineColor: '#000000',
          background: '#ffffff',
        }
        const canvas = canvasRef.current
        const vector = svgRef.current
        if (!canvas || !vector) return
        JsBarcode(canvas, value, { ...options, format })
        JsBarcode(vector, value, { ...options, format })
        if (cancelled) return
        setSvg(new XMLSerializer().serializeToString(vector))
        setError(null)
        setDrawn(true)
      } catch (cause) {
        if (!cancelled) {
          setDrawn(false)
          setSvg('')
          setError(cause instanceof Error ? cause.message : 'The barcode could not be drawn.')
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [value, format, scale, height, showNumber])

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="1. The format and the data">
        <SegmentedControl
          label="Barcode format"
          options={FORMAT_OPTIONS}
          value={format}
          onChange={(next) => {
            setFormat(next as BarcodeFormat)
          }}
        />

        <div className="mt-4">
          <label htmlFor="barcode-data" className="text-sm font-medium text-fg">
            The data to encode
          </label>
          <Input
            id="barcode-data"
            value={input}
            onChange={(event) => {
              setValues({ ...values, [format]: event.target.value })
            }}
            spellCheck={false}
            placeholder={START[format]}
            className="mt-2 text-sm"
          />
          <p className="mt-2 text-xs text-muted">
            {isNumeric(format)
              ? 'This format takes digits only.'
              : 'This format takes printable characters.'}{' '}
            Leave off the final check digit and it will be worked out for you.
          </p>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="barcode-scale" className="text-sm font-medium text-fg">
              Bar width: {scale}px
            </label>
            <input
              id="barcode-scale"
              type="range"
              min={1}
              max={5}
              step={1}
              value={scale}
              onChange={(event) => setScale(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
          <div>
            <label htmlFor="barcode-height" className="text-sm font-medium text-fg">
              Height: {height}px
            </label>
            <input
              id="barcode-height"
              type="range"
              min={30}
              max={140}
              step={10}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm text-fg">
          <input
            type="checkbox"
            checked={showNumber}
            onChange={(event) => setShowNumber(event.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Print the digits under the bars
        </label>

        <p className="mt-3 text-sm text-fg">{summary}</p>
        {problem && <p className="mt-2 text-xs text-danger">{problem}</p>}
      </ToolPanel>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/8 px-4 py-3 text-sm text-danger">{error}</p>
      )}

      {problem ? (
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled size="lg">
            <Icon name="barcode" size={16} />
            Draw the barcode
          </Button>
          <span className="text-sm text-danger">Fix the data above first.</span>
        </div>
      ) : (
        <ToolPanel title="Your barcode" className={drawn ? 'border-success/30' : undefined}>
          <div className="flex flex-col-reverse items-start gap-5 sm:flex-row">
            {/* The canvas is what a person sees; the SVG is what downloads. */}
            <canvas ref={canvasRef} className="max-w-full rounded-xl border border-border bg-white" />
            <svg ref={svgRef} className="hidden" aria-hidden="true" />
            <div className="flex flex-col gap-3">
              <DownloadButton
                text={svg}
                mimeType="image/svg+xml"
                filename={barcodeName(format)}
                label="Download the SVG"
                size="md"
                disabled={!drawn}
              />
              <p className="text-xs text-muted">
                An SVG prints at any size without softening. There is no PNG option, because a pixel image blurs the
                bar edges at print resolution, and a blurred edge is a scan that fails.
              </p>
            </div>
          </div>
        </ToolPanel>
      )}
    </div>
  )
}
