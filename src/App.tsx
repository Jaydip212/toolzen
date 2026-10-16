import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/Toast'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { Home } from '@/pages/Home'
import { AllTools } from '@/pages/AllTools'
import { CategoryPage } from '@/pages/CategoryPage'
import { ToolPage } from '@/pages/ToolPage'
import { About } from '@/pages/About'
import { Privacy } from '@/pages/Privacy'
import { Terms } from '@/pages/Terms'
import { NotFound } from '@/pages/NotFound'

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ToastProvider>
        <ScrollToTop />

        <a href="#main-content" className="tz-skip-link">
          Skip to content
        </a>

        <div className="flex min-h-screen flex-col">
          <Header />

          <main id="main-content" className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/tools" element={<AllTools />} />
              <Route path="/tools/:toolId" element={<ToolPage />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          <Footer />
        </div>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App
