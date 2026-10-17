import { describe, expect, it } from 'vitest'

import {
  PHISHING_EXAMPLES,
  RESOURCES,
  TOPICS,
  answeredCount,
  countByTopic,
  filterResources,
  scoreQuiz,
} from './logic'

describe('RESOURCES', () => {
  it('gives every resource an https link', () => {
    for (const resource of RESOURCES) {
      expect(resource.url.startsWith('https://'), resource.title).toBe(true)
    }
  })

  it('uses only known topics', () => {
    const known = new Set(TOPICS.map((topic) => topic.id))
    for (const resource of RESOURCES) expect(known.has(resource.topic), resource.title).toBe(true)
  })

  it('describes every resource', () => {
    for (const resource of RESOURCES) {
      expect(resource.description.length, resource.title).toBeGreaterThan(50)
      expect(resource.publisher.length, resource.title).toBeGreaterThan(2)
    }
  })

  it('has no duplicate URLs', () => {
    const urls = RESOURCES.map((resource) => resource.url)
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('covers every topic', () => {
    const counts = countByTopic(RESOURCES)
    for (const topic of TOPICS) expect(counts[topic.id], topic.id).toBeGreaterThan(0)
  })

  it('includes business and technical audiences', () => {
    expect(RESOURCES.some((resource) => resource.audience === 'business')).toBe(true)
    expect(RESOURCES.some((resource) => resource.audience === 'technical')).toBe(true)
    expect(RESOURCES.some((resource) => resource.audience === 'everyone')).toBe(true)
  })
})

describe('countByTopic', () => {
  it('counts each topic', () => {
    const counts = countByTopic([
      { title: 'a', publisher: 'p', url: 'https://a', topic: 'phishing', audience: 'everyone', description: 'd' },
      { title: 'b', publisher: 'p', url: 'https://b', topic: 'phishing', audience: 'everyone', description: 'd' },
      { title: 'c', publisher: 'p', url: 'https://c', topic: 'privacy', audience: 'everyone', description: 'd' },
    ])
    expect(counts.phishing).toBe(2)
    expect(counts.privacy).toBe(1)
    expect(counts.business).toBe(0)
  })

  it('returns zeros for an empty list', () => {
    expect(countByTopic([]).reporting).toBe(0)
  })
})

describe('filterResources', () => {
  it('returns everything by default', () => {
    expect(filterResources(RESOURCES)).toHaveLength(RESOURCES.length)
  })

  it('filters by topic', () => {
    const filtered = filterResources(RESOURCES, { topic: 'phishing' })
    expect(filtered.length).toBeGreaterThan(0)
    for (const resource of filtered) expect(resource.topic).toBe('phishing')
  })

  it('filters by audience', () => {
    const filtered = filterResources(RESOURCES, { audience: 'business' })
    expect(filtered.length).toBeGreaterThan(0)
    for (const resource of filtered) expect(resource.audience).toBe('business')
  })

  it('matches the title', () => {
    const filtered = filterResources(RESOURCES, { query: 'OWASP' })
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('matches the publisher', () => {
    const filtered = filterResources(RESOURCES, { query: 'NCSC' })
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('matches the description', () => {
    const filtered = filterResources(RESOURCES, { query: 'password manager' })
    expect(filtered.length).toBeGreaterThan(0)
  })

  it('is case-insensitive', () => {
    expect(filterResources(RESOURCES, { query: 'owasp' }).length).toBe(
      filterResources(RESOURCES, { query: 'OWASP' }).length,
    )
  })

  it('returns nothing for a query with no match', () => {
    expect(filterResources(RESOURCES, { query: 'zzzzzz' })).toEqual([])
  })

  it('combines topic and query', () => {
    const filtered = filterResources(RESOURCES, { topic: 'privacy', query: 'EFF' })
    expect(filtered).toHaveLength(1)
    expect(filtered[0].publisher).toBe('EFF')
  })

  it('treats "all" as no filter', () => {
    expect(filterResources(RESOURCES, { topic: 'all', audience: 'all' })).toHaveLength(RESOURCES.length)
  })
})

describe('PHISHING_EXAMPLES', () => {
  it('has unique ids', () => {
    const ids = PHISHING_EXAMPLES.map((example) => example.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes at least one genuine message', () => {
    expect(PHISHING_EXAMPLES.some((example) => !example.isPhishing)).toBe(true)
  })

  it('gives every phishing example at least two signals', () => {
    for (const example of PHISHING_EXAMPLES.filter((entry) => entry.isPhishing)) {
      expect(example.signals.length, example.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('gives the genuine example no signals', () => {
    for (const example of PHISHING_EXAMPLES.filter((entry) => !entry.isPhishing)) {
      expect(example.signals).toEqual([])
    }
  })

  it('explains every example', () => {
    for (const example of PHISHING_EXAMPLES) {
      expect(example.explanation.length, example.id).toBeGreaterThan(50)
    }
  })

  it('has no obviously wrong URL in a phishing example that looks legitimate', () => {
    // A sanity check that the phishing URLs are not real domains of the brands they mimic.
    const delivery = PHISHING_EXAMPLES.find((example) => example.id === 'delivery')
    expect(delivery?.body).toContain('dpd-redelivery-pay.info')
  })
})

describe('scoreQuiz', () => {
  it('scores every correct answer', () => {
    const answers = Object.fromEntries(PHISHING_EXAMPLES.map((example) => [example.id, example.isPhishing]))
    const result = scoreQuiz(answers)
    expect(result.correct).toBe(PHISHING_EXAMPLES.length)
    expect(result.missed).toEqual([])
    expect(result.verdict).toContain('Every message')
  })

  it('records missed ids', () => {
    const answers: Record<string, boolean> = {}
    for (const example of PHISHING_EXAMPLES) answers[example.id] = !example.isPhishing
    const result = scoreQuiz(answers)
    expect(result.correct).toBe(0)
    expect(result.missed).toHaveLength(PHISHING_EXAMPLES.length)
  })

  it('ignores unanswered examples in the score', () => {
    const first = PHISHING_EXAMPLES[0]
    const result = scoreQuiz({ [first.id]: first.isPhishing })
    expect(result.correct).toBe(1)
    expect(result.total).toBe(PHISHING_EXAMPLES.length)
  })

  it('grades a strong score as good instincts', () => {
    const answers: Record<string, boolean> = {}
    PHISHING_EXAMPLES.forEach((example, index) => {
      answers[example.id] = index === 0 ? !example.isPhishing : example.isPhishing
    })
    const result = scoreQuiz(answers)
    expect(result.verdict).toContain('Good instincts')
  })

  it('grades a weak score as worth slowing down', () => {
    const answers: Record<string, boolean> = {}
    PHISHING_EXAMPLES.forEach((example) => {
      answers[example.id] = false
    })
    const result = scoreQuiz(answers)
    expect(result.verdict).toContain('slowing down')
  })
})

describe('answeredCount', () => {
  it('counts submitted answers', () => {
    expect(answeredCount({ a: true, b: false })).toBe(2)
  })

  it('returns zero for none', () => {
    expect(answeredCount({})).toBe(0)
  })
})
