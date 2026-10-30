// What people do on the EasyRentals website, on the Rentals screen (backend
// services/rentals/siteActivity.js). Pinned: the totals in words, where
// people came from, each place's views and Apply/WhatsApp taps, and the
// period buttons asking the API for that many days.
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

const ACTIVITY = {
  days: 7,
  totals: { visitors: 4, views: 11, placeViews: 6, applyViews: 2, whatsappTaps: 1, onPhone: 3 },
  byDay: [{ day: '2026-10-29', views: 0, visitors: 0 }, { day: '2026-10-30', views: 11, visitors: 4 }],
  sources: [{ source: 'facebook', visitors: 3 }, { source: 'google', visitors: 1 }],
  campaigns: [{ campaign: 'fb_groups', visitors: 2 }],
  places: [{ listingId: 'l1', title: 'Bachelor Available Florida Lake', status: 'published', example: false, views: 6, visitors: 3, applyViews: 2, whatsappTaps: 1 }],
  pages: [{ path: '/listings/l1', views: 6, visitors: 3 }, { path: '/', views: 5, visitors: 4 }],
}

describe('RentalsPanel website activity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => Promise.resolve({
      data: { data: url === '/rentals/admin/site-activity' ? ACTIVITY : { listings: [], placements: [] } },
    }))
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows who came, from where, and what they looked at', async () => {
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(screen.getByRole('tab', { name: 'Website' }))
    const totals = await screen.findByTestId('website-totals')
    expect(totals).toHaveTextContent('4 visitors · 11 pages seen · 6 place views · 2 opened Apply · 1 WhatsApp taps')
    expect(totals).toHaveTextContent('75% on a phone')
    expect(screen.getByTestId('source-facebook')).toHaveTextContent('Facebook3 visitors')
    expect(screen.getByText(/fb_groups \(2\)/)).toBeInTheDocument()
    expect(screen.getByTestId('place-l1')).toHaveTextContent('Bachelor Available Florida Lake')
    expect(screen.getByTestId('place-l1')).toHaveTextContent('6 views · 3 people · 2 opened Apply · 1 WhatsApp')
    expect(api.get).toHaveBeenCalledWith('/rentals/admin/site-activity', { params: { days: 7 } })
  })

  it('asks for the period chosen', async () => {
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(screen.getByRole('tab', { name: 'Website' }))
    await screen.findByTestId('website-totals')
    fireEvent.click(screen.getByRole('tab', { name: '30 days' }))
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/rentals/admin/site-activity', { params: { days: 30 } }))
  })
})
