import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel } from '@/tools/shared'
import { SegmentedControl } from '@/tools/shared'
import {
  ACTIVITY_LEVELS,
  ETHNICITY_ADJUSTMENT_NOTE,
  assess,
  bmrKatchMcArdle,
  bmrMifflin,
  calorieTargets,
  cmToFtIn,
  ftInToCm,
  lbToKg,
  tdee,
} from './logic'
import type { Sex } from './logic'

type UnitSystem = 'metric' | 'imperial'
type SexKey = Sex | 'lean'

export function BmiCalculatorTool() {
  const [system, setSystem] = useState<UnitSystem>('metric')
  const [weightInput, setWeightInput] = useState('70')
  const [heightInput, setHeightInput] = useState('175')
  const [feetInput, setFeetInput] = useState('5')
  const [inchesInput, setInchesInput] = useState('9')
  const [poundsInput, setPoundsInput] = useState('154')

  const [ageInput, setAgeInput] = useState('30')
  const [sexKey, setSexKey] = useState<SexKey>('male')
  const [activity, setActivity] = useState('sedentary')
  const [leanInput, setLeanInput] = useState('55')

  const weightKg = useMemo(() => {
    const value = Number(weightInput)
    if (!Number.isFinite(value)) return Number.NaN
    return system === 'metric' ? value : lbToKg(value)
  }, [system, weightInput])

  const heightCm = useMemo(() => {
    if (system === 'metric') {
      const value = Number(heightInput)
      return Number.isFinite(value) ? value : Number.NaN
    }
    const feet = Number(feetInput)
    const inches = Number(inchesInput)
    if (!Number.isFinite(feet) || !Number.isFinite(inches)) return Number.NaN
    return ftInToCm(feet, inches)
  }, [system, heightInput, feetInput, inchesInput])

  const result = useMemo(() => {
    try {
      return { error: null, value: assess(weightKg, heightCm) }
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Those measurements could not be used.', value: null }
    }
  }, [weightKg, heightCm])

  const age = Number(ageInput)
  const lean = Number(leanInput)

  const metabolic = useMemo(() => {
    try {
      const bmr =
        sexKey === 'lean' ? bmrKatchMcArdle(lean) : bmrMifflin(weightKg, heightCm, age, sexKey)
      const factor = ACTIVITY_LEVELS.find((level) => level.id === activity)?.factor ?? 1.2
      return { error: null, bmr, maintenance: tdee(bmr, factor) }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Those details could not be used.',
        bmr: null,
        maintenance: null,
      }
    }
  }, [sexKey, weightKg, heightCm, age, lean, activity])

  const convertedHeight = Number.isFinite(heightCm) ? cmToFtIn(heightCm) : null

  return (
    <div className="flex flex-col gap-6">
      <ToolPanel title="Your measurements" description="BMI is weight in kilograms divided by height in metres squared.">
        <SegmentedControl
          label="Unit system"
          value={system}
          onChange={setSystem}
          size="sm"
          options={[
            { value: 'metric', label: 'Centimetres & kg' },
            { value: 'imperial', label: 'Feet, inches & lb' },
          ]}
        />

        {system === 'metric' ? (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Weight (kg)"
              type="number"
              inputMode="decimal"
              step="any"
              value={weightInput}
              containerClassName="w-40"
              onChange={(event) => setWeightInput(event.target.value)}
            />
            <Input
              label="Height (cm)"
              type="number"
              inputMode="decimal"
              step="any"
              value={heightInput}
              containerClassName="w-40"
              onChange={(event) => setHeightInput(event.target.value)}
            />
          </div>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label="Feet"
              type="number"
              inputMode="numeric"
              step="1"
              value={feetInput}
              containerClassName="w-24"
              onChange={(event) => setFeetInput(event.target.value)}
            />
            <Input
              label="Inches"
              type="number"
              inputMode="decimal"
              step="any"
              value={inchesInput}
              containerClassName="w-24"
              onChange={(event) => setInchesInput(event.target.value)}
            />
            <Input
              label="Weight (lb)"
              type="number"
              inputMode="decimal"
              step="any"
              value={poundsInput}
              containerClassName="w-32"
              onChange={(event) => setPoundsInput(event.target.value)}
            />
          </div>
        )}

        {Number.isFinite(weightKg) && Number.isFinite(heightCm) && (
          <p className="text-xs text-muted">
            Working in {weightKg.toFixed(1)} kg and {heightCm.toFixed(1)} cm
            {convertedHeight ? ` (${convertedHeight.feet}′ ${convertedHeight.inches}″)` : ''}.
          </p>
        )}
      </ToolPanel>

      {result.error && <ErrorState title="Those measurements could not be used" message={result.error} />}

      {result.value && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile
              label="BMI"
              value={<span className="tabular-nums">{result.value.value.toFixed(1)}</span>}
              hint="kg per square metre"
            />
            <StatTile
              label="Band"
              value={<span className="text-base">{result.value.band.name}</span>}
              hint={`18.5–24.9 is the healthy range`}
            />
            <StatTile
              label="Healthy weight for your height"
              value={
                <span className="tabular-nums">
                  {result.value.healthyRange.low}–{result.value.healthyRange.high} kg
                </span>
              }
              hint="BMI 18.5 to 24.9"
            />
            <StatTile
              label="Position on the scale"
              value={<span className="tabular-nums">{result.value.position}%</span>}
              hint="between BMI 15 and 40"
            />
          </div>

          <ToolPanel title="Where you sit">
            <div className="flex flex-col gap-2">
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2">
                <div className="absolute inset-y-0 left-[15%] w-[45%] rounded-full bg-success/25" />
                <div
                  className="absolute inset-y-0 w-1.5 rounded-full bg-brand"
                  style={{ left: `${Math.min(Math.max(result.value.position, 0), 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted">
                <span>15</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted">{result.value.band.advice}</p>
          </ToolPanel>
        </>
      )}

      <ToolPanel
        title="Calories"
        description="Mifflin–St Jeor resting metabolism, multiplied by an activity factor to get maintenance calories."
      >
        <div className="flex flex-wrap items-end gap-3">
          <SegmentedControl
            label="Which rate"
            value={sexKey}
            onChange={setSexKey}
            size="sm"
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'lean', label: 'Use lean mass' },
            ]}
          />
          {sexKey === 'lean' ? (
            <Input
              label="Lean body mass (kg)"
              type="number"
              inputMode="decimal"
              step="any"
              value={leanInput}
              containerClassName="w-44"
              onChange={(event) => setLeanInput(event.target.value)}
            />
          ) : (
            <Input
              label="Age (years)"
              type="number"
              inputMode="numeric"
              step="1"
              value={ageInput}
              containerClassName="w-32"
              onChange={(event) => setAgeInput(event.target.value)}
            />
          )}
        </div>

        <label className="flex flex-col gap-1 text-xs text-muted">
          Activity level
          <select
            value={activity}
            onChange={(event) => setActivity(event.target.value)}
            className="h-10 rounded-xl border border-line bg-surface px-3 text-sm text-fg"
          >
            {ACTIVITY_LEVELS.map((level) => (
              <option key={level.id} value={level.id}>
                {level.label} (×{level.factor})
              </option>
            ))}
          </select>
        </label>

        {metabolic.error && <ErrorState title="Those details could not be used" message={metabolic.error} />}

        {metabolic.bmr !== null && metabolic.maintenance !== null && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile
                label="Resting metabolism"
                value={<span className="tabular-nums">{metabolic.bmr.toLocaleString('en-US')}</span>}
                hint="kcal per day at rest"
              />
              <StatTile
                label="Maintenance"
                value={<span className="tabular-nums">{metabolic.maintenance.toLocaleString('en-US')}</span>}
                hint="kcal per day at your activity level"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {calorieTargets(metabolic.maintenance).map((target) => (
                <StatTile
                  key={target.id}
                  label={target.label}
                  value={<span className="tabular-nums">{target.calories.toLocaleString('en-US')}</span>}
                  hint={
                    target.weeklyChangeKg === 0
                      ? 'no change expected'
                      : `${target.weeklyChangeKg} kg per week`
                  }
                />
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-2 rounded-xl border border-line bg-surface-2/30 p-3">
          <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
            <strong className="shrink-0 text-fg">What BMI cannot see.</strong> It takes no account of muscle mass,
            frame size, age, pregnancy or where fat sits on the body. An athlete can score as overweight while
            carrying very little fat.
          </p>
          <p className="text-xs leading-relaxed text-muted">{ETHNICITY_ADJUSTMENT_NOTE}</p>
          <p className="text-xs leading-relaxed text-muted">
            The calorie figures use the 7,700 kcal-per-kilogram rule of thumb for weekly change. That is an
            average, not a promise, and this is not medical advice.
          </p>
        </div>
      </ToolPanel>

      {result.value && (
        <ToolPanel title="How this was worked out">
          <ul className="flex list-disc flex-col gap-1.5 pl-5 text-xs leading-relaxed text-muted">
            <li>
              BMI = {Number.isFinite(weightKg) ? weightKg.toFixed(1) : '—'} kg ÷ (
              {Number.isFinite(heightCm) ? (heightCm / 100).toFixed(2) : '—'} m)
              <sup>2</sup>
            </li>
            <li>
              Healthy range = 18.5 and 24.9 multiplied by the same squared height, which is why it moves with
              height.
            </li>
            <li>
              Mifflin–St Jeor: 10 × weight + 6.25 × height − 5 × age{' '}
              {sexKey === 'female' ? '− 161' : '+ 5'}.
            </li>
          </ul>
        </ToolPanel>
      )}
    </div>
  )
}

export default BmiCalculatorTool
