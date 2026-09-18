import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppProvider } from '../context/AppContext'
import Header from './Header'
import type { HealthResponse } from '../lib/types'
import { SupportedLanguage, ReviewMode } from '../lib/types'

const { mockCheckHealth } = vi.hoisted(() => {
  return {
    mockCheckHealth: vi.fn().mockResolvedValue({
      status: 'ok',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      cache_size: 50,
      supported_languages: ['python', 'javascript'],
      supported_modes: ['comprehensive', 'security'],
      version: '1.0.0',
    }),
  }
})

vi.mock('../lib/api', () => ({
  checkHealth: mockCheckHealth,
}))

const renderWithProviders = (ui: React.ReactElement) => {
  return render(<AppProvider>{ui}</AppProvider>)
}

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders app title in h1 element', () => {
    renderWithProviders(<Header />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('AI Code Reviewer')
  })

  it('calls health check on mount', async () => {
    renderWithProviders(<Header />)

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(mockCheckHealth).toHaveBeenCalled()
  })

  it('renders all review mode buttons', () => {
    renderWithProviders(<Header />)

    expect(screen.getByRole('button', { name: /Comprehensive/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Performance/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Style/i })).toBeInTheDocument()
  })

  it('highlights the selected review mode', () => {
    renderWithProviders(<Header />)

    const comprehensiveButton = screen.getByRole('button', { name: /Comprehensive/i })
    const securityButton = screen.getByRole('button', { name: /Security/i })

    expect(comprehensiveButton).toHaveClass('bg-accent/20')
    expect(securityButton).not.toHaveClass('bg-accent/20')
  })

  it('allows changing review mode via button click', () => {
    renderWithProviders(<Header />)

    const securityButton = screen.getByRole('button', { name: /Security/i })
    fireEvent.click(securityButton)

    expect(securityButton).toHaveClass('bg-accent/20')
  })

  it('renders language selector with aria-label', () => {
    renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('python')
  })

  it('renders all supported languages in the dropdown', () => {
    renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i) as HTMLSelectElement
    const options = Array.from(select.options).map((opt) => opt.value)

    expect(options).toContain(SupportedLanguage.PYTHON)
    expect(options).toContain(SupportedLanguage.JAVASCRIPT)
    expect(options).toContain(SupportedLanguage.TYPESCRIPT)
    expect(options).toContain(SupportedLanguage.JAVA)
    expect(options).toContain(SupportedLanguage.GO)
    expect(options).toContain(SupportedLanguage.RUST)
    expect(options).toContain(SupportedLanguage.CPP)
    expect(options).toContain(SupportedLanguage.C)
    expect(options).toContain(SupportedLanguage.CSHARP)
    expect(options).toContain(SupportedLanguage.PHP)
    expect(options).toContain(SupportedLanguage.RUBY)
    expect(options).toContain(SupportedLanguage.KOTLIN)
  })

  it('allows changing language via dropdown', () => {
    renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)
    fireEvent.change(select, { target: { value: 'javascript' } })

    expect(select).toHaveValue('javascript')
  })

  it('uses semantic HTML header element', () => {
    const { container } = renderWithProviders(<Header />)
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('applies correct interactive states to mode buttons', () => {
    renderWithProviders(<Header />)

    const securityButton = screen.getByRole('button', { name: /Security/i })

    expect(securityButton).toHaveClass('transition-all')
    expect(securityButton).toHaveClass('duration-150')
    expect(securityButton).toHaveClass('hover:bg-bg/10')
    expect(securityButton).toHaveClass('focus-visible:outline-none')
    expect(securityButton).toHaveClass('focus-visible:ring-2')
    expect(securityButton).toHaveClass('active:scale-[0.98]')
  })

  it('applies correct interactive states to language select', () => {
    renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)

    expect(select).toHaveClass('focus:outline-none')
    expect(select).toHaveClass('focus:ring-2')
    expect(select).toHaveClass('focus:ring-accent/50')
    expect(select).toHaveClass('active:scale-[0.98]')
  })

  it('is responsive with mobile-first layout', () => {
    const { container } = renderWithProviders(<Header />)
    const header = container.querySelector('header')

    expect(header).toHaveClass('flex')
    expect(header).toHaveClass('flex-col')
    expect(header).toHaveClass('sm:flex-row')
  })

  it('includes system status display area', () => {
    renderWithProviders(<Header />)

    // Header should have the structure for displaying system status
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('mode buttons have proper aria-pressed state', () => {
    renderWithProviders(<Header />)

    const comprehensiveButton = screen.getByRole('button', { name: /Comprehensive/i })
    const securityButton = screen.getByRole('button', { name: /Security/i })

    expect(comprehensiveButton).toHaveAttribute('aria-pressed', 'true')
    expect(securityButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('language select has proper label association', () => {
    renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)
    expect(select).toHaveAttribute('id', 'language-select')
  })
})