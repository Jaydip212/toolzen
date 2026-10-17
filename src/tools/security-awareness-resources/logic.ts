/**
 * A curated reading list plus a phishing-spotting exercise.
 *
 * Every link points at the publisher's own site — no affiliate links, no
 * re-hosting. The quiz is hand-written; its "signals" are the things a careful
 * reader can actually point at in the message.
 */

export type ResourceTopic =
  | 'phishing'
  | 'passwords'
  | 'updates'
  | 'privacy'
  | 'business'
  | 'reporting'

export interface TopicInfo {
  id: ResourceTopic
  label: string
  description: string
}

export const TOPICS: TopicInfo[] = [
  { id: 'phishing', label: 'Phishing and scams', description: 'Recognising a message that is trying to trick you.' },
  { id: 'passwords', label: 'Passwords and sign-in', description: 'Account security, 2FA and password managers.' },
  { id: 'updates', label: 'Updates and devices', description: 'Keeping software and hardware current.' },
  { id: 'privacy', label: 'Privacy', description: 'Reducing what you expose, and to whom.' },
  { id: 'business', label: 'For small business', description: 'Guidance aimed at organisations rather than individuals.' },
  { id: 'reporting', label: 'Reporting a crime', description: 'Where to report fraud and where to get help.' },
]

export interface Resource {
  title: string
  publisher: string
  url: string
  topic: ResourceTopic
  /** Who it is written for. */
  audience: 'everyone' | 'business' | 'technical'
  description: string
}

export const RESOURCES: Resource[] = [
  {
    title: 'Phishing: how to recognise and report it',
    publisher: 'NCSC (UK)',
    url: 'https://www.ncsc.gov.uk/collection/phishing-scams',
    topic: 'phishing',
    audience: 'everyone',
    description:
      'A short, practical guide from the UK National Cyber Security Centre. Covers the tells in a suspicious message and what to do next.',
  },
  {
    title: 'Recognise and report scams',
    publisher: 'FTC (US)',
    url: 'https://consumer.ftc.gov/scams',
    topic: 'phishing',
    audience: 'everyone',
    description:
      'The US Federal Trade Commission\'s consumer scam hub, with plain-language breakdowns of common frauds and a reporting route.',
  },
  {
    title: 'Have I Been Pwned',
    publisher: 'HIBP',
    url: 'https://haveibeenpwned.com/',
    topic: 'passwords',
    audience: 'everyone',
    description:
      'Check whether an email address appears in a known data breach. Run by Troy Hunt; the address lookup is free.',
  },
  {
    title: 'Password managers: how they help you secure your passwords',
    publisher: 'NCSC (UK)',
    url: 'https://www.ncsc.gov.uk/collection/top-tips-for-staying-secure-online/password-managers',
    topic: 'passwords',
    audience: 'everyone',
    description:
      'Explains what a password manager actually does and how to choose one, without recommending a specific product.',
  },
  {
    title: 'Multi-factor authentication guidance',
    publisher: 'CISA (US)',
    url: 'https://www.cisa.gov/MFA',
    topic: 'passwords',
    audience: 'everyone',
    description:
      'CISA\'s explanation of the MFA options, ranked by strength, and why SMS codes are the weakest form still in common use.',
  },
  {
    title: 'Keep your software up to date',
    publisher: 'CISA (US)',
    url: 'https://www.cisa.gov/secure-our-world/update-software',
    topic: 'updates',
    audience: 'everyone',
    description:
      'Why patching matters, which devices people forget, and how to turn on automatic updates on common platforms.',
  },
  {
    title: 'Secure Our World — the four basic steps',
    publisher: 'CISA (US)',
    url: 'https://www.cisa.gov/secure-our-world',
    topic: 'updates',
    audience: 'everyone',
    description:
      'A short campaign covering four habits: strong passwords, MFA, software updates and spotting phishing.',
  },
  {
    title: 'Personal data and privacy guidance',
    publisher: 'ICO (UK)',
    url: 'https://ico.org.uk/for-the-public/',
    topic: 'privacy',
    audience: 'everyone',
    description:
      'The UK Information Commissioner\'s public guidance: your rights over your data, and how to complain when they are ignored.',
  },
  {
    title: 'Privacy Guides',
    publisher: 'Privacy Guides',
    url: 'https://www.privacyguides.org/',
    topic: 'privacy',
    audience: 'technical',
    description:
      'Community-maintained, criteria-based recommendations for privacy-respecting tools. Opinionated but transparent about its criteria.',
  },
  {
    title: 'Cyber Essentials',
    publisher: 'NCSC (UK)',
    url: 'https://www.ncsc.gov.uk/cyberessentials/overview',
    topic: 'business',
    audience: 'business',
    description:
      'A government-backed baseline of five technical controls for small organisations. Useful as a checklist even if you never certify.',
  },
  {
    title: 'Small Business Cybersecurity Corner',
    publisher: 'NIST (US)',
    url: 'https://www.nist.gov/itl/smallbusinesscyber',
    topic: 'business',
    audience: 'business',
    description:
      'NIST\'s small-business resources, including the Fundamentals quick-start guide and a set of worked scenarios.',
  },
  {
    title: 'OWASP Top 10',
    publisher: 'OWASP',
    url: 'https://owasp.org/www-project-top-ten/',
    topic: 'business',
    audience: 'technical',
    description:
      'The ten most critical web application security risks, with concrete examples. The standard starting point for a development team.',
  },
  {
    title: 'OWASP Application Security Verification Standard',
    publisher: 'OWASP',
    url: 'https://owasp.org/www-project-application-security-verification-standard/',
    topic: 'business',
    audience: 'technical',
    description:
      'A testable checklist of application security requirements, levelled from opportunistic to advanced.',
  },
  {
    title: 'Report fraud',
    publisher: 'Action Fraud (UK)',
    url: 'https://www.actionfraud.police.uk/',
    topic: 'reporting',
    audience: 'everyone',
    description:
      'The UK national reporting centre for fraud and cybercrime. Reports feed into intelligence even when no individual case is investigated.',
  },
  {
    title: 'Report fraud to the FTC',
    publisher: 'FTC (US)',
    url: 'https://reportfraud.ftc.gov/',
    topic: 'reporting',
    audience: 'everyone',
    description:
      'The US route for reporting scams and bad business practice. Takes about five minutes and produces a reference number.',
  },
  {
    title: 'Get help with a hacked account',
    publisher: 'NCSC (UK)',
    url: 'https://www.ncsc.gov.uk/collection/cyber-security-breaches',
    topic: 'reporting',
    audience: 'everyone',
    description:
      'Step-by-step recovery advice if an account or device has been compromised, including what to do in the first hour.',
  },
  {
    title: 'Stop. Think. Connect.',
    publisher: 'CISA (US)',
    url: 'https://www.cisa.gov/stopthinkconnect',
    topic: 'phishing',
    audience: 'everyone',
    description:
      'Awareness materials aimed at home users and small teams, including shareable one-page tip sheets.',
  },
  {
    title: 'Surveillance Self-Defense',
    publisher: 'EFF',
    url: 'https://ssd.eff.org/',
    topic: 'privacy',
    audience: 'technical',
    description:
      'Threat-model-driven guides from the Electronic Frontier Foundation, written for people who want to reason about their own risk.',
  },
]

/** Keep resources matching a free-text query and an optional topic. */
export function filterResources(
  resources: Resource[],
  options: { query?: string; topic?: ResourceTopic | 'all'; audience?: Resource['audience'] | 'all' } = {},
): Resource[] {
  const query = (options.query ?? '').trim().toLowerCase()
  const topic = options.topic ?? 'all'
  const audience = options.audience ?? 'all'

  return resources.filter((resource) => {
    if (topic !== 'all' && resource.topic !== topic) return false
    if (audience !== 'all' && resource.audience !== audience) return false
    if (query === '') return true
    return (
      resource.title.toLowerCase().includes(query) ||
      resource.publisher.toLowerCase().includes(query) ||
      resource.description.toLowerCase().includes(query)
    )
  })
}

/** Count resources per topic, for the filter chips. */
export function countByTopic(resources: Resource[]): Record<ResourceTopic, number> {
  const counts = {
    phishing: 0,
    passwords: 0,
    updates: 0,
    privacy: 0,
    business: 0,
    reporting: 0,
  } as Record<ResourceTopic, number>
  for (const resource of resources) counts[resource.topic] += 1
  return counts
}

/* -------------------------------------------------------------------------- */
/* Phishing exercise                                                          */
/* -------------------------------------------------------------------------- */

export interface PhishingExample {
  id: string
  /** What the message claims to be. */
  channel: 'email' | 'sms'
  from: string
  subject: string
  body: string
  /** True when the message is a phishing attempt. */
  isPhishing: boolean
  /** The specific things a careful reader can point at. */
  signals: string[]
  explanation: string
}

export const PHISHING_EXAMPLES: PhishingExample[] = [
  {
    id: 'delivery',
    channel: 'sms',
    from: '+44 7700 900123',
    subject: 'Your parcel is on hold',
    body:
      'DPD: Your parcel could not be delivered today. A redelivery fee of £1.45 is required. Pay within 24 hours at http://dpd-redelivery-pay.info/track?id=8842 or the parcel will be returned to sender.',
    isPhishing: true,
    signals: [
      'A small fee is demanded to release something you were not expecting',
      'The link is a lookalike domain (dpd-redelivery-pay.info), not dpd.co.uk',
      'A 24-hour deadline creates urgency',
      'You never gave this sender your number for a delivery',
    ],
    explanation:
      'The small fee is the point: it harvests card details. A real courier links to its own domain and does not charge a redelivery fee by text message.',
  },
  {
    id: 'ceo',
    channel: 'email',
    from: 'Chief Executive <ceo@company-mail.net>',
    subject: 'Quick favour — are you at your desk?',
    body:
      'Hi, I am in meetings all morning and cannot talk. I need you to arrange a £4,800 payment to a new supplier today. I will send the bank details separately. Please keep this between us for now — it is commercially sensitive.',
    isPhishing: true,
    signals: [
      'The display name is right but the domain is company-mail.net, not your company domain',
      'The request is unusual and urgent',
      'It asks for secrecy, which blocks the one person who would spot it',
      'Bank details arrive separately, so they cannot be checked against an existing record',
    ],
    explanation:
      'This is business email compromise. The secrecy request is the tell — real payment processes do not require you to bypass a colleague.',
  },
  {
    id: 'mfa',
    channel: 'sms',
    from: 'Microsoft',
    subject: 'Verification code',
    body:
      'Your Microsoft verification code is 481920. If you did not request this, reply STOP and a support agent will call you to secure your account.',
    isPhishing: true,
    signals: [
      'You did not request a code — someone else is trying to sign in',
      'It invites you to reply, which starts a conversation with an attacker',
      'It offers a phone call, which is how the real code gets talked out of you',
    ],
    explanation:
      'The code is real; the message around it is not. Never share a one-time code, and never reply. Change your password and check your sign-in history instead.',
  },
  {
    id: 'invoice',
    channel: 'email',
    from: 'Accounts <accounts@your-supplier.co.uk>',
    subject: 'Invoice 2026-0417 attached',
    body:
      'Please find attached invoice 2026-0417 for the October order, due in 30 days as usual. Our bank details are unchanged. Thanks, Priya',
    isPhishing: false,
    signals: [],
    explanation:
      'Nothing here asks you to act urgently or change anything. It still deserves the normal check: confirm the attachment is the type you expect, and pay against the details already on file rather than the ones in the message.',
  },
  {
    id: 'password-expiry',
    channel: 'email',
    from: 'IT Service Desk <it-helpdesk@company-portal.support>',
    subject: 'Action required: your password expires in 2 hours',
    body:
      'Our records show your password expires today. To avoid losing access, sign in at https://company-portal.support/reset and confirm your current password, then choose a new one.',
    isPhishing: true,
    signals: [
      'The domain is company-portal.support, not your organisation\'s domain',
      'Asking you to "confirm your current password" is never legitimate',
      'A two-hour deadline is designed to stop you thinking',
      'Most organisations no longer expire passwords on a schedule at all',
    ],
    explanation:
      'No legitimate password reset asks for the existing password. A reset flow either emails you a link or asks you to prove identity some other way.',
  },
  {
    id: 'shared-doc',
    channel: 'email',
    from: 'Priya Raman <priya.raman@contractors-mail.com>',
    subject: 'Priya shared "Q4 budget.xlsx" with you',
    body:
      'Priya Raman has shared a file with you. Open in OneDrive. If the button does not work, sign in with your Microsoft account to view the file.',
    isPhishing: true,
    signals: [
      'The sender is on an outside domain but claims to be a colleague',
      'It asks you to "sign in" from the email rather than opening the app directly',
      'You were not expecting a file from this person',
    ],
    explanation:
      'Credential-harvesting pages clone a real sign-in screen. Open the file from the app or the site directly, never from the email link.',
  },
]

export interface QuizResult {
  correct: number
  total: number
  /** Ids the user got wrong. */
  missed: string[]
  /** One-line summary. */
  verdict: string
}

/** Score a set of answers, where `answers[id]` is the user's "is this phishing?" choice. */
export function scoreQuiz(
  answers: Record<string, boolean>,
  examples: PhishingExample[] = PHISHING_EXAMPLES,
): QuizResult {
  let correct = 0
  const missed: string[] = []
  for (const example of examples) {
    const answer = answers[example.id]
    if (answer === undefined) continue
    if (answer === example.isPhishing) correct += 1
    else missed.push(example.id)
  }
  const total = examples.length
  const share = total === 0 ? 0 : correct / total
  let verdict = 'Have another look at the ones you missed.'
  if (share === 1) verdict = 'Every message read correctly — including the genuine one.'
  else if (share >= 0.7) verdict = 'Good instincts. The missed ones are worth reading again.'
  else verdict = 'Worth slowing down: several of these are easier to spot than they look.'

  return { correct, total, missed, verdict }
}

/** The number of answers submitted so far. */
export function answeredCount(answers: Record<string, boolean>): number {
  return Object.keys(answers).length
}
