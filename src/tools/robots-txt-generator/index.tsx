import { useState } from 'react'
import { Input, Textarea } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { buildRobotsTxt } from '@/lib/phase7/generators'

export function RobotsTxtGenerator() {
  const [userAgent, setUserAgent] = useState('*')
  const [allow, setAllow] = useState('/')
  const [disallow, setDisallow] = useState('/admin/')
  const [crawlDelay, setCrawlDelay] = useState('')
  const [sitemap, setSitemap] = useState('https://www.etoolzen.com/sitemap.xml')

  const result = buildRobotsTxt({
    userAgent,
    allow: allow.split(/\r?\n/),
    disallow: disallow.split(/\r?\n/),
    crawlDelay: crawlDelay.trim() === '' ? null : Number(crawlDelay),
    sitemap,
  })

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="Crawl rules" description="One path per line. Paths must start with / — line breaks are refused.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={userAgent} onChange={(event) => setUserAgent(event.target.value)} label="User-agent" aria-label="User agent" />
          <Input value={crawlDelay} onChange={(event) => setCrawlDelay(event.target.value)} inputMode="decimal" label="Crawl delay (optional seconds)" aria-label="Crawl delay" />
          <Textarea value={allow} onChange={(event) => setAllow(event.target.value)} rows={3} label="Allow" aria-label="Allowed paths" />
          <Textarea value={disallow} onChange={(event) => setDisallow(event.target.value)} rows={3} label="Disallow" aria-label="Disallowed paths" />
        </div>
        <Input value={sitemap} onChange={(event) => setSitemap(event.target.value)} label="Sitemap URL (optional)" aria-label="Sitemap URL" className="mt-3" />
      </ToolPanel>

      {!result.ok ? (
        <ErrorState title="Cannot build that file" message={result.error} />
      ) : (
        <ToolPanel title="robots.txt" description="Save this file at the root of your site.">
          <OutputArea value={result.text} label="robots.txt" rows={12} filename="robots.txt" />
        </ToolPanel>
      )}
    </div>
  )
}

export default RobotsTxtGenerator
