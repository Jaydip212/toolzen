/**
 * The checklist is hand-written content, not generated text: every item is a
 * concrete action with a reason, so the output is useful rather than decorative.
 */

export type ContextId = 'personal' | 'business' | 'developer'

export type Priority = 'essential' | 'recommended' | 'advanced'

export type Effort = 'quick' | 'moderate' | 'involved'

export type ChecklistCategory = 'accounts' | 'devices' | 'data' | 'network' | 'people' | 'recovery'

export interface ContextInfo {
  id: ContextId
  label: string
  description: string
}

export const CONTEXTS: ContextInfo[] = [
  {
    id: 'personal',
    label: 'Personal',
    description: 'Your own accounts, laptop and phone.',
  },
  {
    id: 'business',
    label: 'Small business or team',
    description: 'A handful of staff, shared systems and customer data.',
  },
  {
    id: 'developer',
    label: 'Developer or technical',
    description: 'You build and run software that other people use.',
  },
]

export interface CategoryInfo {
  id: ChecklistCategory
  label: string
  description: string
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'accounts', label: 'Accounts and access', description: 'Who can get in, and how.' },
  { id: 'devices', label: 'Devices', description: 'The laptops, phones and servers you rely on.' },
  { id: 'data', label: 'Data and backups', description: 'Keeping information safe and recoverable.' },
  { id: 'network', label: 'Network', description: 'Wi-Fi, routers and how traffic moves.' },
  { id: 'people', label: 'People and process', description: 'Habits and agreements that hold up under pressure.' },
  { id: 'recovery', label: 'Detection and recovery', description: 'What you do when something goes wrong.' },
]

export interface ChecklistItem {
  id: string
  title: string
  /** Why this matters, in one or two sentences. */
  why: string
  category: ChecklistCategory
  priority: Priority
  effort: Effort
  /** The contexts this item is relevant to. */
  contexts: ContextId[]
}

const ALL: ContextId[] = ['personal', 'business', 'developer']
const BIZ: ContextId[] = ['business', 'developer']
const DEV: ContextId[] = ['developer']

export const CHECKLIST_ITEMS: ChecklistItem[] = [
  /* ---------------------------------------------------------------- accounts */
  {
    id: 'acc-2fa',
    title: 'Turn on two-factor authentication everywhere it is offered',
    why: 'A stolen password stops being enough on its own. Prefer an authenticator app or a hardware key over SMS, which can be intercepted by a SIM swap.',
    category: 'accounts',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'acc-manager',
    title: 'Use a password manager and give every account a unique password',
    why: 'Reused passwords turn one breached site into a breach of everything. A manager makes unique long passwords practical.',
    category: 'accounts',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'acc-breach',
    title: 'Check your email addresses against known breaches',
    why: 'Have I Been Pwned lists breaches by address. Any password that appears there should be changed everywhere it was used, not just on the breached site.',
    category: 'accounts',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'acc-recovery',
    title: 'Set recovery options and store recovery codes offline',
    why: 'Losing a phone should not lock you out permanently. Print or write the codes and keep them somewhere a burglar would not look first.',
    category: 'accounts',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'acc-prune',
    title: 'Close accounts you no longer use',
    why: 'An abandoned account is an unmonitored way in. Delete it, or at least change its password and turn on 2FA.',
    category: 'accounts',
    priority: 'recommended',
    effort: 'moderate',
    contexts: ALL,
  },
  {
    id: 'acc-third-party',
    title: 'Review third-party app access and revoke what you do not recognise',
    why: 'Signing in with Google or Microsoft often grants lasting access to mail or files. The list grows silently.',
    category: 'accounts',
    priority: 'recommended',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'acc-admin-split',
    title: 'Keep a separate admin account, used only for admin work',
    why: 'Day-to-day browsing with admin rights means any mistake or malicious document runs with full power.',
    category: 'accounts',
    priority: 'recommended',
    effort: 'moderate',
    contexts: BIZ,
  },
  {
    id: 'acc-offboard',
    title: 'Write an offboarding checklist that revokes access the same day',
    why: 'Leavers keep access far longer than anyone expects. A checklist turns a memory problem into a process.',
    category: 'accounts',
    priority: 'essential',
    effort: 'moderate',
    contexts: BIZ,
  },

  /* ----------------------------------------------------------------- devices */
  {
    id: 'dev-updates',
    title: 'Turn on automatic updates for the OS, browser and apps',
    why: 'Most successful attacks exploit a patch that already exists. Automatic updates close that gap without anyone remembering.',
    category: 'devices',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'dev-encryption',
    title: 'Turn on full-disk encryption',
    why: 'BitLocker, FileVault and LUKS make a stolen laptop a hardware loss rather than a data breach. The key is your login.',
    category: 'devices',
    priority: 'essential',
    effort: 'moderate',
    contexts: ALL,
  },
  {
    id: 'dev-lock',
    title: 'Set a screen lock with a short timeout',
    why: 'An unlocked laptop in a café is an open session. A one-minute timeout costs nothing.',
    category: 'devices',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'dev-tracking',
    title: 'Enable device tracking and remote wipe',
    why: 'Find My and Find My Device let you lock or erase a lost phone before anyone reads it.',
    category: 'devices',
    priority: 'recommended',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'dev-inventory',
    title: 'Keep a list of every device and who is responsible for it',
    why: 'You cannot patch or wipe a device you have forgotten exists. Include personal phones used for work email.',
    category: 'devices',
    priority: 'recommended',
    effort: 'moderate',
    contexts: BIZ,
  },
  {
    id: 'dev-uninstall',
    title: 'Uninstall software you do not use, once a quarter',
    why: 'Every installed app is another thing that needs updating and another potential vulnerability.',
    category: 'devices',
    priority: 'recommended',
    effort: 'moderate',
    contexts: ALL,
  },
  {
    id: 'dev-standard-user',
    title: 'Do daily work from a standard user account',
    why: 'Without admin rights, malware cannot install a service or change system settings without a prompt you will see.',
    category: 'devices',
    priority: 'advanced',
    effort: 'moderate',
    contexts: BIZ,
  },

  /* -------------------------------------------------------------------- data */
  {
    id: 'data-321',
    title: 'Keep a backup that malware cannot reach',
    why: 'Ransomware encrypts connected drives, including network shares. The 3-2-1 rule — three copies, two media, one offline — is what survives.',
    category: 'data',
    priority: 'essential',
    effort: 'involved',
    contexts: ALL,
  },
  {
    id: 'data-restore-test',
    title: 'Test a restore, not just a backup',
    why: 'An untested backup is a hope. Restore one file and one whole folder, and time how long it takes.',
    category: 'data',
    priority: 'essential',
    effort: 'involved',
    contexts: ALL,
  },
  {
    id: 'data-encrypt',
    title: 'Encrypt sensitive files before they leave your device',
    why: 'Email and most cloud links are not end-to-end encrypted. A password-protected archive or age/GPG file is.',
    category: 'data',
    priority: 'recommended',
    effort: 'moderate',
    contexts: ALL,
  },
  {
    id: 'data-retention',
    title: 'Decide how long you keep data, then delete what has expired',
    why: 'Data you do not hold cannot leak. Retention limits also reduce the scope of any future breach.',
    category: 'data',
    priority: 'recommended',
    effort: 'moderate',
    contexts: BIZ,
  },
  {
    id: 'data-classify',
    title: 'Write down what counts as sensitive and who may see it',
    why: 'People protect what they can recognise. A one-page classification makes the rest of the checklist decidable.',
    category: 'data',
    priority: 'recommended',
    effort: 'involved',
    contexts: BIZ,
  },

  /* ----------------------------------------------------------------- network */
  {
    id: 'net-wifi',
    title: 'Use WPA2 or WPA3 with a long passphrase, and change the router admin password',
    why: 'Default router credentials are published. WPA2 with a short or guessable passphrase is barely better than open.',
    category: 'network',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'net-router-updates',
    title: 'Update router firmware and check it is still supported',
    why: 'Routers are rarely patched automatically and are directly exposed to the internet. An unsupported model should be replaced.',
    category: 'network',
    priority: 'recommended',
    effort: 'moderate',
    contexts: ALL,
  },
  {
    id: 'net-wps',
    title: 'Turn off WPS and remote administration on the router',
    why: 'WPS PINs can be brute-forced in hours, and remote admin exposes the login page to the whole internet.',
    category: 'network',
    priority: 'recommended',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'net-vpn',
    title: 'Avoid sensitive work on untrusted networks, or use a VPN you trust',
    why: 'HTTPS protects the content, but a hostile network still sees which sites you visit and can block or spoof DNS.',
    category: 'network',
    priority: 'recommended',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'net-iot',
    title: 'Put smart devices on their own network',
    why: 'Cheap IoT firmware is often unpatched. A guest network or VLAN stops a compromised bulb from reaching your laptop.',
    category: 'network',
    priority: 'advanced',
    effort: 'involved',
    contexts: ALL,
  },

  /* ------------------------------------------------------------------ people */
  {
    id: 'ppl-verify',
    title: 'Verify any urgent money or credential request through a second channel',
    why: 'This one rule defeats most invoice fraud and CEO-fraud attempts. Call the number you already have, not the one in the message.',
    category: 'people',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'ppl-secrets',
    title: 'Agree that passwords and keys are never sent over chat or email',
    why: 'Chat history is backed up, searchable and often retained for years. Use a password manager share or a one-time link.',
    category: 'people',
    priority: 'essential',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'ppl-phishing-training',
    title: 'Run a short phishing session and repeat it annually',
    why: 'People are the most targeted layer. A 30-minute session with real examples beats a policy nobody read.',
    category: 'people',
    priority: 'recommended',
    effort: 'moderate',
    contexts: BIZ,
  },
  {
    id: 'ppl-contacts',
    title: 'Publish a one-page incident contact list',
    why: 'Under pressure, nobody remembers who to call. Name the person, the backup and the out-of-hours number.',
    category: 'people',
    priority: 'recommended',
    effort: 'quick',
    contexts: BIZ,
  },
  {
    id: 'ppl-reporting',
    title: 'Give people an obvious way to report a mistake without blame',
    why: 'Fast reporting limits damage. If the first reaction is punishment, the report arrives days later or never.',
    category: 'people',
    priority: 'recommended',
    effort: 'quick',
    contexts: BIZ,
  },

  /* ---------------------------------------------------------------- recovery */
  {
    id: 'rec-stolen-laptop',
    title: 'Write down what you would do if a laptop were stolen',
    why: 'Remote wipe, password resets, session revocation, and who to tell. Deciding in advance is far easier than deciding at 2am.',
    category: 'recovery',
    priority: 'essential',
    effort: 'moderate',
    contexts: ALL,
  },
  {
    id: 'rec-signout',
    title: 'Know how to sign out of every session at once',
    why: 'Google, Microsoft and Apple all offer “sign out everywhere”. Find it now, before you need it.',
    category: 'recovery',
    priority: 'recommended',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'rec-offline-contacts',
    title: 'Keep an offline copy of critical contacts and account numbers',
    why: 'If your phone and email are compromised, the recovery information stored in them is gone too.',
    category: 'recovery',
    priority: 'recommended',
    effort: 'quick',
    contexts: ALL,
  },
  {
    id: 'rec-drill',
    title: 'Run one restore or incident drill a year',
    why: 'A plan that has never been executed has unknown gaps. A drill finds them while the stakes are low.',
    category: 'recovery',
    priority: 'advanced',
    effort: 'involved',
    contexts: BIZ,
  },
  {
    id: 'rec-breach-report',
    title: 'Know your breach-notification obligations',
    why: 'GDPR requires notice within 72 hours of becoming aware; other regimes differ. Knowing the clock in advance changes what you log.',
    category: 'recovery',
    priority: 'advanced',
    effort: 'involved',
    contexts: BIZ,
  },

  /* --------------------------------------------------------------- developer */
  {
    id: 'dev-secrets',
    title: 'Never commit secrets — use environment variables and a pre-commit scanner',
    why: 'A key pushed once is public forever, even after the commit is rewritten. A scanner catches it before the push.',
    category: 'accounts',
    priority: 'essential',
    effort: 'quick',
    contexts: DEV,
  },
  {
    id: 'dev-deps',
    title: 'Automate dependency updates and review what arrives',
    why: 'Most breaches in small projects arrive through a dependency. Dependabot or Renovate plus a lockfile makes that visible.',
    category: 'devices',
    priority: 'essential',
    effort: 'moderate',
    contexts: DEV,
  },
  {
    id: 'dev-password-hashing',
    title: 'Hash passwords with Argon2id, bcrypt or scrypt — never a bare SHA-256',
    why: 'Fast hashes are brute-forced at billions per second on a GPU. A password hash must be deliberately slow and salted.',
    category: 'accounts',
    priority: 'essential',
    effort: 'quick',
    contexts: DEV,
  },
  {
    id: 'dev-parameterised',
    title: 'Use parameterised queries everywhere',
    why: 'String-concatenated SQL is still the most common route to a full database compromise. ORMs do this for you only if you let them.',
    category: 'data',
    priority: 'essential',
    effort: 'quick',
    contexts: DEV,
  },
  {
    id: 'dev-headers',
    title: 'Send CSP, HSTS and nosniff on every response',
    why: 'These three headers blunt cross-site scripting, protocol downgrade and content sniffing with no application change.',
    category: 'network',
    priority: 'recommended',
    effort: 'moderate',
    contexts: DEV,
  },
  {
    id: 'dev-rate-limit',
    title: 'Rate-limit login, signup and password-reset endpoints',
    why: 'Without a limit, credential stuffing and reset-token guessing run at full speed. Limit per account and per IP.',
    category: 'network',
    priority: 'recommended',
    effort: 'moderate',
    contexts: DEV,
  },
  {
    id: 'dev-csrf',
    title: 'Protect state-changing requests against CSRF',
    why: 'SameSite cookies help, but a token or an explicit origin check is what actually stops a forged request.',
    category: 'network',
    priority: 'recommended',
    effort: 'moderate',
    contexts: DEV,
  },
  {
    id: 'dev-logging',
    title: 'Log authentication events and alert on repeated failures',
    why: 'You cannot respond to an attack you cannot see. Log the event, the account and the source, and keep the log out of the app database.',
    category: 'recovery',
    priority: 'recommended',
    effort: 'moderate',
    contexts: DEV,
  },
  {
    id: 'dev-dependency-scan',
    title: 'Scan dependencies and container images in CI',
    why: 'A scanner turns a vague worry into a list of versions to bump. Run it on every pull request.',
    category: 'devices',
    priority: 'advanced',
    effort: 'moderate',
    contexts: DEV,
  },
  {
    id: 'dev-disclosure',
    title: 'Publish a security.txt and a disclosure address',
    why: 'A researcher who cannot find a contact publishes the bug instead. One file gives them a private route.',
    category: 'people',
    priority: 'advanced',
    effort: 'quick',
    contexts: DEV,
  },
]

export interface BuildOptions {
  context: ContextId
  /** Which priorities to include. Defaults to all three. */
  priorities?: Priority[]
}

/**
 * Filter the master list for one context and priority set.
 *
 * Order is stable: category order, then essential → recommended → advanced,
 * then the order they were written in.
 */
export function buildChecklist(options: BuildOptions): ChecklistItem[] {
  const priorities = options.priorities ?? ['essential', 'recommended', 'advanced']
  const categoryRank = new Map(CATEGORIES.map((category, index) => [category.id, index]))
  const priorityRank: Record<Priority, number> = { essential: 0, recommended: 1, advanced: 2 }

  return CHECKLIST_ITEMS.filter(
    (item) => item.contexts.includes(options.context) && priorities.includes(item.priority),
  ).sort((a, b) => {
    const category = (categoryRank.get(a.category) ?? 99) - (categoryRank.get(b.category) ?? 99)
    if (category !== 0) return category
    return priorityRank[a.priority] - priorityRank[b.priority]
  })
}

/** Group items by category, preserving the canonical category order. */
export function groupChecklist(items: ChecklistItem[]): Array<{
  category: CategoryInfo
  items: ChecklistItem[]
}> {
  return CATEGORIES.map((category) => ({
    category,
    items: items.filter((item) => item.category === category.id),
  })).filter((group) => group.items.length > 0)
}

export interface ChecklistStats {
  total: number
  essential: number
  recommended: number
  advanced: number
  quick: number
  moderate: number
  involved: number
  /** Rough total effort in minutes, using a midpoint per effort band. */
  estimatedMinutes: number
}

const EFFORT_MINUTES: Record<Effort, number> = { quick: 5, moderate: 30, involved: 120 }

/** Counts and a rough time estimate for a checklist. */
export function checklistStats(items: ChecklistItem[]): ChecklistStats {
  const stats: ChecklistStats = {
    total: items.length,
    essential: 0,
    recommended: 0,
    advanced: 0,
    quick: 0,
    moderate: 0,
    involved: 0,
    estimatedMinutes: 0,
  }
  for (const item of items) {
    stats[item.priority] += 1
    stats[item.effort] += 1
    stats.estimatedMinutes += EFFORT_MINUTES[item.effort]
  }
  return stats
}

/** Format the estimate as a readable span. */
export function formatEstimate(minutes: number): string {
  if (minutes <= 0) return 'nothing to do'
  if (minutes < 60) return `about ${minutes} minutes`
  const hours = Math.round((minutes / 60) * 10) / 10
  if (hours < 8) return `about ${hours} hour${hours === 1 ? '' : 's'}`
  const days = Math.round((hours / 8) * 10) / 10
  return `about ${days} working day${days === 1 ? '' : 's'}`
}

/** A Markdown checklist with real `- [ ]` boxes. */
export function toMarkdown(items: ChecklistItem[], context: ContextId): string {
  const contextInfo = CONTEXTS.find((entry) => entry.id === context)
  const lines: string[] = [
    `# Security checklist — ${contextInfo?.label ?? context}`,
    '',
    `Generated ${new Date().toISOString().slice(0, 10)} by TOOLZEN. ${items.length} item${items.length === 1 ? '' : 's'}.`,
    '',
  ]

  for (const group of groupChecklist(items)) {
    lines.push(`## ${group.category.label}`)
    lines.push('')
    for (const item of group.items) {
      lines.push(`- [ ] **${item.title}** _(${item.priority}, ${item.effort})_`)
      lines.push(`  ${item.why}`)
    }
    lines.push('')
  }

  lines.push('---')
  lines.push('')
  lines.push(
    'A checklist is a starting point. It cannot know your threat model, and ticking every box is not the same as being secure.',
  )
  lines.push('')
  return lines.join('\n')
}

function csvField(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/** A CSV export, one row per item. */
export function toCsv(items: ChecklistItem[]): string {
  const lines = ['category,priority,effort,title,why']
  for (const item of items) {
    lines.push(
      [item.category, item.priority, item.effort, item.title, item.why].map(csvField).join(','),
    )
  }
  return lines.join('\n')
}
