import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Self-hosted Inter keeps typography consistent and avoids a third-party request.
// Only the Latin subsets are bundled; other scripts fall back to system fonts.
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/inter/latin-ext-400.css'
import '@fontsource/inter/latin-ext-500.css'
import '@fontsource/inter/latin-ext-600.css'
import '@fontsource/inter/latin-ext-700.css'

import './index.css'
import { App } from './App'

const container = document.getElementById('root')

if (!container) {
  throw new Error('TOOLZEN could not start: #root element was not found.')
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
