// EasyRentals placement fees on the Rentals screen (backend
// services/rentals/placements.js). Pinned: the due ones and the total to
// invoice show first; paid records an optional reference; waiving needs a
// reason, and backing out sends nothing.
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

const DUE = {
  id: 'p1', listingId: 'l1', applicationId: 'a1', landlordId: 'o1', fee: 300, version: 'placement-2026-10-29-r300',
  status: 'due', acceptedAt: '2026-11-02T08:00:00Z', dueAt: '2026-11-05T08:00:00Z', settledAt: null, note: null,
  listing: { title: 'Sunny backroom', rent: 2800 },
  landlord: { fullName: 'Nomsa Dube', email: null, phone: '+27821112222' },
}

const openPlacements = async () => {
  renderWithProviders(<RentalsPanel />)
  fireEvent.click(await screen.findByRole('tab', { name: /Placements/ }))
  await screen.findByTestId('placement-p1')
}

describe('RentalsPanel placements', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => Promise.resolve({
      data: { data: url === '/rentals/admin/placements' ? { owed: 300, placements: [DUE] } : { listings: [] } },
    }))
    api.post.mockResolvedValue({ data: { data: { placement: { ...DUE, status: 'paid' } } } })
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows what is due, the total to invoice, and counts it on the tab', async () => {
    await openPlacements()
    expect(screen.getByTestId('placements-owed')).toHaveTextContent('R300 to invoice')
    expect(screen.getByTestId('placement-p1')).toHaveTextContent('Nomsa Dube')
    expect(screen.getByTestId('placement-p1')).toHaveTextContent('Sunny backroom, R2')
    expect(screen.getByRole('tab', { name: 'Placements (1)' })).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/rentals/admin/placements', { params: { status: 'due' } })
  })

  it('marks one paid with a reference', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('EFT 5 Nov')
    await openPlacements()
    fireEvent.click(screen.getByText('Mark paid'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/rentals/admin/placements/p1/settle', { status: 'paid', note: 'EFT 5 Nov' }))
    expect(await screen.findByText(/is recorded as paid/)).toBeInTheDocument()
  })

  it('waives only with a reason, and backing out sends nothing', async () => {
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue(null)
    await openPlacements()
    fireEvent.click(screen.getByText('Waive'))
    expect(api.post).not.toHaveBeenCalled()
    prompt.mockReturnValue('First landlord, goodwill')
    fireEvent.click(screen.getByText('Waive'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/rentals/admin/placements/p1/settle', { status: 'waived', note: 'First landlord, goodwill' }))
  })
})
