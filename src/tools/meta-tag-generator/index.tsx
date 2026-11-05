import { useState } from 'react'
import { Input, Select, Textarea } from '@/components/ui/Form'
import { ErrorState } from '@/components/ui/ErrorState'
import { ToolPanel, OutputArea } from '@/tools/shared'
import { buildMetaTags } from '@/lib/phase7/generators'

export function MetaTagGenerator() {
  const [title, setTitle] = useState('TOOLZEN — free online tools')
  const [description, setDescription] = useState('Free online tools for documents, images and everyday tasks.')
  const [url, setUrl] = useState('https://www.etoolzen.com/')
  const [siteName, setSiteName] = useState('TOOLZEN')
  const [type, setType] = useState<'website' | 'article'>('website')

  const result = buildMetaTags({ title, description, url, siteName, type })

  return (
    <div className="flex flex-col gap-5">
      <ToolPanel title="The page" description="Values are HTML-escaped before they enter an attribute.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} label="Page title" aria-label="Page title" />
          <Select value={type} onChange={(event) => setType(event.target.value as 'website' | 'article')} label="Open Graph type" aria-label="Open Graph type">
            <option value="website">website</option>
            <option value="article">article</option>
          </Select>
          <Input value={url} onChange={(event) => setUrl(event.target.value)} label="Canonical URL" aria-label="Canonical URL" />
          <Input value={siteName} onChange={(event) => setSiteName(event.target.value)} label="Site name" aria-label="Site name" />
        </div>
        <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} label="Description" aria-label="Meta description" className="mt-3" />
      </ToolPanel>

      {!result.ok ? (
        <ErrorState title="Cannot build those tags" message={result.error} />
      ) : (
        <ToolPanel title="Generated tags" description="Copy these into the <head> of the page.">
          <OutputArea value={result.tags} label="Meta tags" rows={14} filename="meta-tags.html" mimeType="text/html" />
        </ToolPanel>
      )}
    </div>
  )
}

export default MetaTagGenerator
