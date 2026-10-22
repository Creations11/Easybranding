// EasyRentals on WhatsApp, as staff see it in the Rentals panel.
//
// Pinned: an account shows whether its WhatsApp is linked (the number the
// handset proved, not the one typed at sign-up) and can be unlinked after a
// confirmation; the Alerts tab says plainly whether anything is being sent,
// lists who asked for what, and stops an alert only after a confirmation.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import RentalsPanel from '../../src/components/RentalsPanel'

vi.mock('../../src/api', () => ({
  default: {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: 'https://api.example.co.za/api' },
  },
}))

const LINKED = {
  id: 'a1', fullName: 'Nomsa Dube', email: 'nomsa@example.com', phone: '+27821112222', roles: ['landlord'],
  isActive: true, listings: 1, createdAt: '2026-10-06T08:00:00Z', lastLoginAt: null, whatsappPhone: '+27831110001',
}
const UNLINKED = { ...LINKED, id: 'a2', fullName: 'Thabo M', whatsappPhone: null }

const ALERTS = {
  counts: { active: 1, removed: 0 },
  sending: { number: '+27653318266', on: false },
  alerts: [{
    id: 'al1', phone: '+27831110001', firstName: 'Thandi', status: 'active',
    criteria: { extension: 'Ext 3', propertyType: 'backroom', maxRent: 3000, minBedrooms: null, furnished: null },
    createdAt: '2026-10-08T08:00:00Z', removedAt: null, matched: 2, told: 0, lastToldAt: null,
  }],
}

describe('RentalsPanel and WhatsApp', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => Promise.resolve({
      data: {
        data: url === '/rentals/admin/accounts' ? { accounts: [LINKED, UNLINKED] }
          : url === '/rentals/admin/alerts' ? ALERTS
          : { listings: [] },
      },
    }))
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows which accounts have WhatsApp linked, and unlinks only after a confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    api.post.mockResolvedValue({ data: { data: { whatsapp: { linked: false } } } })
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(screen.getByRole('tab', { name: 'Accounts' }))

    const linked = await screen.findByTestId('account-a1')
    expect(linked).toHaveTextContent('WhatsApp linked: +27831110001')
    expect(screen.getByTestId('account-a2')).toHaveTextContent('WhatsApp not linked')
    expect(screen.getAllByText('Unlink WhatsApp')).toHaveLength(1)

    fireEvent.click(screen.getByText('Unlink WhatsApp'))
    expect(api.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Unlink WhatsApp'))
    expect(confirm.mock.calls[1][0]).toMatch(/stops messaging that number/)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/rentals/admin/accounts/a1/whatsapp/unlink', {}))
  })

  it('the Alerts tab says nothing is being sent yet, and who asked for what', async () => {
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(screen.getByRole('tab', { name: 'Alerts' }))
    const row = await screen.findByTestId('alert-al1')
    expect(screen.getByText('Not sending yet')).toBeInTheDocument()
    expect(screen.getByText(/nothing is sent until the approved template is switched on/)).toHaveTextContent('+27653318266')
    expect(row).toHaveTextContent('Thandi')
    expect(row).toHaveTextContent('Ext 3 · Backroom · up to R3')
    expect(row).toHaveTextContent('2 matched · 0 sent')
    expect(api.get).toHaveBeenCalledWith('/rentals/admin/alerts', { params: { status: 'active' } })
  })

  it('stops an alert only after a confirmation', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    api.delete.mockResolvedValue({ data: { data: { removed: true } } })
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(screen.getByRole('tab', { name: 'Alerts' }))
    await screen.findByTestId('alert-al1')
    fireEvent.click(screen.getByText('Stop alert'))
    expect(api.delete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Stop alert'))
    expect(confirm.mock.calls[1][0]).toMatch(/no more messages about this search/)
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/rentals/admin/alerts/al1'))
  })

  it('tells staff the owner can moderate from WhatsApp', () => {
    renderWithProviders(<RentalsPanel />)
    expect(screen.getByText(/From the owner's phone/)).toHaveTextContent('LISTINGS')
  })
})
