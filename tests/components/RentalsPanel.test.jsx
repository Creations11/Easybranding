// EasyRentals moderation: the screen for /api/rentals/admin.
//
// Approving publishes a stranger's listing, and turning one down emails the
// landlord whatever is typed. So the tests cover what must hold: nothing is
// published without a confirmation, nothing is sent back or taken down
// without a reason, a failed load never reads as "nothing waiting", the
// server's refusal reaches the screen word for word, and the reviewer sees
// the address, the photos and who the landlord is.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, within, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import RentalsPanel from '../../src/components/RentalsPanel'

vi.mock('../../src/api', () => ({
  default: {
    get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(),
    defaults: { baseURL: 'https://api.example.co.za/api' },
  },
}))

const FLAT = {
  id: 'l1', title: '1 bedroom flat', description: 'Quiet, near the taxi rank.', propertyType: 'apartment',
  area: 'Fleurhof', extension: 'Ext 5', rent: 2000, deposit: 2000, bedrooms: 1, bathrooms: 1,
  availableFrom: null, furnished: false, amenities: ['own_entrance'],
  photos: [{ id: 'p1', url: '/api/rentals/listings/l1/photos/p1?exp=1&sig=abc', width: 1600, height: 1200 }],
  status: 'pending_review', addressLine: '7 Example Road',
  review: { submittedAt: '2026-10-06T08:49:19Z', reviewedAt: null, outcome: null, note: null },
  ownerSuspended: false,
  owner: { id: 'a1', fullName: 'Nomsa Landlord', email: 'nomsa@example.com', phone: '+27821234567', isActive: true, joinedAt: '2026-10-06T08:00:00Z' },
}
const LIVE = {
  ...FLAT, id: 'l2', title: 'Backroom with parking', status: 'published',
  review: { submittedAt: null, reviewedAt: '2026-10-06T09:00:00Z', outcome: 'approved', note: null },
}

const mockGets = ({ listings = {}, accounts = [] } = {}) => {
  const byStatus = { pending_review: [FLAT], published: [LIVE], draft: [], rented: [], archived: [], ...listings }
  api.get.mockImplementation((url, config) => {
    if (url === '/rentals/admin/listings') {
      return Promise.resolve({ data: { data: { listings: byStatus[config?.params?.status] ?? [] } } })
    }
    if (url === '/rentals/admin/accounts') return Promise.resolve({ data: { data: { accounts } } })
    return Promise.reject(new Error(`Unmocked api.get call in test: ${url}`))
  })
}

describe('RentalsPanel', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    mockGets()
    api.post.mockResolvedValue({ data: { data: { listing: { ...FLAT, status: 'published' } } } })
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows a waiting listing with everything the reviewer needs', async () => {
    renderWithProviders(<RentalsPanel />)
    const card = await screen.findByTestId('listing-l1')
    expect(within(card).getByText('1 bedroom flat')).toBeInTheDocument()
    expect(within(card).getByText(/7 Example Road/)).toBeInTheDocument()
    expect(within(card).getByText('Nomsa Landlord')).toBeInTheDocument()
    expect(within(card).getByText('nomsa@example.com')).toBeInTheDocument()
    expect(within(card).getByText(/does not ask for money before a viewing/)).toBeInTheDocument()
    // Photo links come back relative to the API; a draft's are signed.
    expect(within(card).getByRole('img', { name: 'Photo 1 of 1 bedroom flat' }))
      .toHaveAttribute('src', 'https://api.example.co.za/api/rentals/listings/l1/photos/p1?exp=1&sig=abc')
    expect(await screen.findByRole('tab', { name: 'Waiting for review (1)' })).toBeInTheDocument()
  })

  it('publishes only after the person confirms, and says so', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    renderWithProviders(<RentalsPanel />)
    const card = await screen.findByTestId('listing-l1')

    fireEvent.click(within(card).getByText('Approve'))
    expect(api.post).not.toHaveBeenCalled()

    fireEvent.click(within(card).getByText('Approve'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/rentals/admin/listings/l1/approve', {}))
    expect(confirm.mock.calls[1][0]).toMatch(/Anyone can see it straight away/)
    expect(await within(card).findByText(/It is live now/)).toBeInTheDocument()
  })

  it('sends a listing back only with a reason, and sends exactly that reason', async () => {
    const prompt = vi.spyOn(window, 'prompt').mockReturnValueOnce('   ').mockReturnValueOnce('The photos are of a different house.')
    renderWithProviders(<RentalsPanel />)
    const card = await screen.findByTestId('listing-l1')

    fireEvent.click(within(card).getByText('Send back with a reason'))
    expect(api.post).not.toHaveBeenCalled()

    fireEvent.click(within(card).getByText('Send back with a reason'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/rentals/admin/listings/l1/reject', { reason: 'The photos are of a different house.' },
    ))
    expect(prompt.mock.calls[0][0]).toMatch(/emailed exactly this/)
  })

  it("shows the server's refusal word for word", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.post.mockRejectedValue({ response: { data: { message: 'This listing is not waiting for review.' } } })
    renderWithProviders(<RentalsPanel />)
    const card = await screen.findByTestId('listing-l1')
    fireEvent.click(within(card).getByText('Approve'))
    expect(await within(card).findByText('This listing is not waiting for review.')).toBeInTheDocument()
  })

  it('takes a live listing down with a reason, and offers no Approve for it', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Reported as a scam')
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(await screen.findByRole('tab', { name: 'Live' }))
    const card = await screen.findByTestId('listing-l2')
    expect(within(card).queryByText('Approve')).not.toBeInTheDocument()
    fireEvent.click(within(card).getByText('Take down'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/rentals/admin/listings/l2/unpublish', { reason: 'Reported as a scam' },
    ))
  })

  it('suspends the landlord, with a reason', async () => {
    vi.spyOn(window, 'prompt').mockReturnValue('Posting fake listings')
    renderWithProviders(<RentalsPanel />)
    const card = await screen.findByTestId('listing-l1')
    fireEvent.click(within(card).getByText('Suspend landlord'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(
      '/rentals/admin/accounts/a1/suspend', { reason: 'Posting fake listings' },
    ))
  })

  // An empty queue on a failed load reads as "nothing to check".
  it('never says nothing is waiting when the list failed to load', async () => {
    api.get.mockRejectedValue({ response: { data: { message: 'Access denied' } } })
    renderWithProviders(<RentalsPanel />)
    expect(await screen.findByText(/Couldn't load listings/)).toBeInTheDocument()
    expect(screen.queryByText('Nothing is waiting for review.')).not.toBeInTheDocument()
  })

  it('says so when nothing is waiting', async () => {
    mockGets({ listings: { pending_review: [] } })
    renderWithProviders(<RentalsPanel />)
    expect(await screen.findByText('Nothing is waiting for review.')).toBeInTheDocument()
  })

  it('finds accounts and can reinstate a suspended one', async () => {
    mockGets({
      accounts: [{
        id: 'a9', fullName: 'Thabo Renter', email: 't@example.com', phone: '+27731234567', roles: ['renter'],
        createdAt: '2026-10-06T08:00:00Z', isActive: false, suspendedReason: 'Spam', lastLoginAt: null, listings: 0,
      }],
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(await screen.findByRole('tab', { name: 'Accounts' }))
    fireEvent.change(screen.getByLabelText('Find an account'), { target: { value: 'thabo' } })
    fireEvent.click(screen.getByText('Find'))
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/rentals/admin/accounts', { params: { q: 'thabo' } }))

    const row = await screen.findByTestId('account-a9')
    expect(within(row).getByText(/suspended: Spam/)).toBeInTheDocument()
    fireEvent.click(within(row).getByText('Reinstate'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/rentals/admin/accounts/a9/reinstate', {}))
  })
})
