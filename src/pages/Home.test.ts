import { describe, expect, it } from 'vitest'

import { homeFaqs } from './Home'

const AVAILABILITY_QUESTION = 'Which TOOLZEN tools work right now?'

describe('homepage FAQ honesty', () => {
  it('derives the available-tools count from the registry instead of a hardcoded number', () => {
    const faq = homeFaqs(118).find((entry) => entry.question === AVAILABILITY_QUESTION)
    expect(faq?.answer).toContain('118 tools are available today')
    expect(faq?.answer).not.toContain('92')
  })

  it('changes the answer when the live count changes', () => {
    const five = homeFaqs(5).find((entry) => entry.question === AVAILABILITY_QUESTION)
    const twoHundred = homeFaqs(200).find((entry) => entry.question === AVAILABILITY_QUESTION)
    expect(five?.answer).toContain('5 tools are available today')
    expect(twoHundred?.answer).toContain('200 tools are available today')
    expect(five?.answer).not.toBe(twoHundred?.answer)
  })

  it('keeps every other FAQ answer stable across counts', () => {
    const first = homeFaqs(5)
    const second = homeFaqs(200)
    const otherQuestions = first.filter((entry) => entry.question !== AVAILABILITY_QUESTION)
    expect(otherQuestions.length).toBeGreaterThan(0)
    for (const entry of otherQuestions) {
      expect(second.find((candidate) => candidate.question === entry.question)?.answer).toBe(entry.answer)
    }
  })
})
