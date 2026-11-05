import { useState } from 'react'
import { Textarea } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { StatTile } from '@/components/tools/StatTile'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { buildSitemapXml } from '@/lib/phase7/generators'

export function SitemapXmlGenerator() {
  const [urls, setUrls] = useState('https://www.etoolzen.com/\nhttps://www.etoolzen.com/tools\nhttps://www.etoolzen.com/guides')
  const result = buildSitemapXml(urls)

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="URLs" description="One absolute http(s) URL per line. Up to 5000 per file.">
        <Textarea value={urls} onChange={(event) => setUrls(event.target.value)} rows={8} aria-label="URLs for the sitemap" spellCheck={false} />
      </ToolPanel>

      {!result.ok ? (
        <ErrorState title="Cannot build that sitemap" message={result.error} />
      ) : (
        <ToolPanel title="sitemap.xml" description="URL characters are XML-escaped before they enter the file.">
          <div className="mb-4 grid gap-3 sm:grid-cols-2">
            <StatTile label="URLs" value={String(result.count)} />
            <StatTile label="Format" value="Sitemap 0.9" />
          </div>
          <OutputArea value={result.xml} label="sitemap.xml" rows={12} filename="sitemap.xml" mimeType="application/xml" />
        </ToolPanel>
      )}
    </div>
  )
}

export default SitemapXmlGenerator
