import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AppProvider } from '../context/AppContext'
import Header from './Header'
import type { HealthResponse } from '../lib/types'
import { SupportedLanguage, ReviewMode } from '../lib/types'

const { mockCheckHealth } = vi.hoisted(() => {
  return {
    mockCheckHealth: vi.fn(),
  }
})

vi.mock('../lib/api', () => ({
  checkHealth: mockCheckHealth,
}))

const renderWithProviders = async (ui: React.ReactElement) => {
  return await act(() => {
    return render(<AppProvider>{ui}</AppProvider>)
  })
}

describe('Header Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders app title in h1 element', async () => {
    const { container } = await renderWithProviders(<Header />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading).toHaveTextContent('AI Code Reviewer')
  })

  it('calls health check on mount', async () => {
    await renderWithProviders(<Header />)

    await new Promise(resolve => setTimeout(resolve, 50))

    expect(mockCheckHealth).toHaveBeenCalled()
  })

  it('shows loading state during health check', async () => {
    mockCheckHealth.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          status: 'ok',
          provider: 'gemini',
          model: 'gemini-2.5-flash',
          cache_size: 50,
          supported_languages: ['python', 'javascript'],
          supported_modes: ['comprehensive', 'security'],
          version: '1.0.0',
        }), 100)
      )
    )

    await renderWithProviders(<Header />)

    // Should show loading indicator immediately
    await waitFor(() => {
      expect(screen.getByText(/Checking\.\.\./i)).toBeInTheDocument()
    })

    // Wait for health check to complete
    await waitFor(() => {
      expect(screen.getByText(/🟢 Gemini 2.5-Flash/i)).toBeInTheDocument()
    })
  })

  it('shows error state when health check fails', async () => {
    mockCheckHealth.mockRejectedValueOnce(new Error('Network error'))

    await renderWithProviders(<Header />)

    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Failed to connect to server/i)).toBeInTheDocument()
    })
  })

  it('disables interactive elements during health check loading', async () => {
    mockCheckHealth.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    await renderWithProviders(<Header />)

    // During loading, buttons and select should be disabled
    const modeButton = screen.getByRole('button', { name: /Security/i })
    const languageSelect = screen.getByLabelText(/select programming language/i)

    expect(modeButton).toBeDisabled()
    expect(languageSelect).toBeDisabled()

    // Wait for completion
    await new Promise(resolve => setTimeout(resolve, 150))

    // Should be enabled after completion
    expect(modeButton).not.toBeDisabled()
    expect(languageSelect).not.toBeDisabled()
  })

  it('renders all review mode buttons', async () => {
    await renderWithProviders(<Header />)

    expect(screen.getByRole('button', { name: /Comprehensive/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Security/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Performance/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Style/i })).toBeInTheDocument()
  })

  it('highlights the selected review mode', async () => {
    await renderWithProviders(<Header />)

    const comprehensiveButton = screen.getByRole('button', { name: /Comprehensive/i })
    const securityButton = screen.getByRole('button', { name: /Security/i })

    expect(comprehensiveButton).toHaveClass('bg-accent/20')
    expect(securityButton).not.toHaveClass('bg-accent/20')
  })

  it('allows changing review mode via button click', async () => {
    // Mock health check to resolve immediately so buttons are not disabled during test
    mockCheckHealth.mockResolvedValue({
      status: 'ok',
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      cache_size: 50,
      supported_languages: ['python', 'javascript'],
      supported_modes: ['comprehensive', 'security'],
      version: '1.0.0',
    })

    await renderWithProviders(<Header />)

    // Wait for the health check to complete (so that the buttons are not disabled)
    await waitFor(() => {
      expect(screen.getByText(/🟢 Gemini 2.5-Flash/i)).toBeInTheDocument()
    })

    const comprehensiveButton = screen.getByRole('button', { name: /Comprehensive/i })
    const securityButton = screen.getByRole('button', { name: /Security/i })

    // Initially, comprehensive button should be active
    expect(comprehensiveButton).toHaveClass('bg-accent/20')
    expect(securityButton).not.toHaveClass('bg-accent/20')

    // Click the security button
    fireEvent.click(securityButton)

    // Now, security button should be active
    expect(securityButton).toHaveClass('bg-accent/20')
    expect(comprehensiveButton).not.toHaveClass('bg-accent/20')
  })

  it('renders language selector with aria-label', async () => {
    await renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue('python')
  })

  it('renders all supported languages in the dropdown', async () => {
    await renderWithProviders(<Header />)

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

  it('allows changing language via dropdown', async () => {
    await renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)
    fireEvent.change(select, { target: { value: 'javascript' } })

    expect(select).toHaveValue('javascript')
  })

  it('uses semantic HTML header element', async () => {
    const { container } = await renderWithProviders(<Header />)
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('applies correct interactive states to mode buttons', async () => {
    await renderWithProviders(<Header />)

    const securityButton = screen.getByRole('button', { name: /Security/i })

    expect(securityButton).toHaveClass('transition-all')
    expect(securityButton).toHaveClass('duration-150')
    expect(securityButton).toHaveClass('hover:text-foreground')
    expect(securityButton).toHaveClass('focus-visible:outline-none')
    expect(securityButton).toHaveClass('focus-visible:ring-2')
    expect(securityButton).toHaveClass('active:scale-[0.98]')
    expect(securityButton).toHaveClass('disabled:opacity-50')
    expect(securityButton).toHaveClass('disabled:cursor-not-allowed')
  })

  it('applies correct interactive states to language select', async () => {
    await renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)

    expect(select).toHaveClass('focus:outline-none')
    expect(select).toHaveClass('focus:ring-2')
    expect(select).toHaveClass('focus:border-accent/40')
    expect(select).toHaveClass('active:scale-[0.98]')
    expect(select).toHaveClass('disabled:opacity-50')
    expect(select).toHaveClass('disabled:cursor-not-allowed')
  })

  it('is responsive with mobile-first layout', async () => {
    await renderWithProviders(<Header />)

    const { container } = await renderWithProviders(<Header />)
    const header = container.querySelector('header')

    expect(header).toHaveClass('flex')
    expect(header).toHaveClass('flex-col')
    expect(header).toHaveClass('sm:flex-row')
  })

  it('includes system status display area', async () => {
    await renderWithProviders(<Header />)

    // Header should have the structure for displaying system status
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
  })

  it('mode buttons have proper aria-pressed state', async () => {
    await renderWithProviders(<Header />)

    const comprehensiveButton = screen.getByRole('button', { name: /Comprehensive/i })
    const securityButton = screen.getByRole('button', { name: /Security/i })

    expect(comprehensiveButton).toHaveAttribute('aria-pressed', 'true')
    expect(securityButton).toHaveAttribute('aria-pressed', 'false')
  })

  it('language select has proper label association', async () => {
    await renderWithProviders(<Header />)

    const select = screen.getByLabelText(/select programming language/i)
    expect(select).toHaveAttribute('id', 'language-select')
  })
})