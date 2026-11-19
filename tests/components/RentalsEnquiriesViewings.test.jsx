// EasyRentals tabs for "see all inquiries, see all bookings, see all
// applications" (Ayanda, 2026-11-19): Enquiries, Viewings, and the place each
// application is for. Pinned: who is waiting for an answer stands out, a
// booking that never reached the diary says so with Google's reason, a
// failed load says it failed rather than "nothing here", and an application
// names its place.
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

const ENQUIRIES = [
  {
    id: 'e1', phone: '+27831110001', name: 'Kigo', kind: 'renter', waiting: true,
    place: { id: 'l1', title: 'Room to Rent', place: 'Ferndale, Randburg' },
    lastMessage: 'Is the room still available?', lastMessageAt: '2026-11-19T06:00:00Z',
    lastReply: null, lastReplyAt: null, firstSeenAt: '2026-11-18T06:00:00Z',
  },
  {
    id: 'e2', phone: '+27831110003', name: null, kind: 'landlord', waiting: false, place: null,
    lastMessage: 'I have a place to rent out', lastMessageAt: '2026-11-19T04:00:00Z',
    lastReply: 'Great', lastReplyAt: '2026-11-19T04:05:00Z', firstSeenAt: '2026-11-19T04:00:00Z',
  },
]
const VIEWINGS = [
  {
    id: 'v1', status: 'booked', start: '2026-11-19T13:00:00Z', name: 'Kigo', phone: '+27831110001', via: 'whatsapp',
    place: { id: 'l1', title: 'Room to Rent', place: 'Ferndale, Randburg' }, landlord: { name: 'Wayne' },
    feeAgreed: true, inDiary: false, diaryError: 'Not Found', cancelledAt: null, cancelledBy: null,
  },
]
const APPLICATIONS = [
  {
    id: 'a1', fullName: 'Sipho Dlamini', phone: '+27831110002', email: null, status: 'submitted', via: 'whatsapp',
    monthlyIncome: 9500, occupants: 2, documents: [], createdAt: '2026-11-18T09:00:00Z',
    listing: { id: 'l2', title: 'Bachelor Available Florida Lake', place: 'Florida, Roodepoort' },
  },
]

const mockGets = ({ failEnquiries = false } = {}) => {
  api.get.mockImplementation((url, config) => {
    if (url === '/rentals/admin/listings') return Promise.resolve({ data: { data: { listings: [] } } })
    if (url === '/rentals/admin/placements') return Promise.resolve({ data: { data: { owed: 0, placements: [] } } })
    if (url === '/rentals/admin/enquiries') {
      if (failEnquiries) return Promise.reject({ response: { data: { message: 'The database is busy.' } } })
      const list = config?.params?.waiting ? ENQUIRIES.filter((e) => e.waiting) : ENQUIRIES
      return Promise.resolve({ data: { data: { enquiries: list } } })
    }
    if (url === '/rentals/admin/viewings') {
      return Promise.resolve({ data: { data: { viewings: config?.params?.show === 'upcoming' ? VIEWINGS : [] } } })
    }
    if (url === '/rentals/admin/applications') return Promise.resolve({ data: { data: { applications: APPLICATIONS } } })
    if (url === '/rentals/admin/overview') return Promise.resolve({ data: { data: { overview: OVERVIEW } } })
    return Promise.reject(new Error(`Unmocked api.get call in test: ${url}`))
  })
}

const OVERVIEW = {
  waiting: { count: 25, today: 5, newest: [{ id: 'e1', name: 'Kigo', phone: '+27831110001', lastMessage: 'Is the room still available?', lastMessageAt: new Date().toISOString() }] },
  viewings: { today: [VIEWINGS[0]], nextSevenDays: 6, pickingATime: 1 },
  applicationsNew: 15,
  listingsToReview: 0,
  listingsLive: 7,
  feesDue: { count: 0, owed: 0 },
}

describe('RentalsPanel: the overview', () => {
  beforeEach(() => {
    api.get.mockReset()
    mockGets()
  })
  afterEach(() => vi.restoreAllMocks())

  it('opens first, with the numbers to act on and today\'s viewings', async () => {
    renderWithProviders(<RentalsPanel />)
    expect(await screen.findByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument()
    const waiting = await screen.findByRole('button', { name: /Waiting for an answer/ })
    expect(waiting).toHaveTextContent('25')
    expect(waiting).toHaveTextContent('5 wrote today')
    expect(screen.getByRole('button', { name: /New applications/ })).toHaveTextContent('15')
    expect(screen.getByRole('button', { name: /Viewings today/ })).toHaveTextContent('6 in the next 7 days')
    const today = screen.getByTestId('today-v1')
    expect(within(today).getByText('Room to Rent')).toBeInTheDocument()
    expect(within(today).getByText('not in the diary')).toBeInTheDocument()
    expect(screen.getByText(/Is the room still available\?/)).toBeInTheDocument()
  })

  it('a tile opens its list already filtered: waiting enquiries, new applications', async () => {
    renderWithProviders(<RentalsPanel />)
    fireEvent.click(await screen.findByRole('button', { name: /Waiting for an answer/ }))
    expect(await screen.findByRole('checkbox', { name: /Only those waiting/ })).toBeChecked()
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/rentals/admin/enquiries', { params: { waiting: 1 } }))

    fireEvent.click(screen.getByRole('tab', { name: 'Overview' }))
    fireEvent.click(await screen.findByRole('button', { name: /New applications/ }))
    expect(await screen.findByRole('combobox', { name: 'Show' })).toHaveValue('submitted')
    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/rentals/admin/applications', { params: { status: 'submitted' } }))
  })

  it('a failed overview says so in the server\'s words, never shows zeros', async () => {
    api.get.mockImplementation((url) => (url === '/rentals/admin/overview'
      ? Promise.reject({ response: { data: { message: 'The database is busy.' } } })
      : Promise.resolve({ data: { data: { listings: [], owed: 0, placements: [] } } })))
    renderWithProviders(<RentalsPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the overview. The database is busy.")
    expect(screen.queryByRole('button', { name: /Waiting for an answer/ })).not.toBeInTheDocument()
  })
})

const open = async (name) => fireEvent.click(await screen.findByRole('tab', { name }))

describe('RentalsPanel: enquiries, viewings, applications', () => {
  beforeEach(() => {
    api.get.mockReset()
    mockGets()
  })
  afterEach(() => vi.restoreAllMocks())

  it('Enquiries shows who wrote, what they said, about which place, and who is still waiting', async () => {
    renderWithProviders(<RentalsPanel />)
    await open('Enquiries')
    const kigo = await screen.findByTestId('enquiry-e1')
    expect(within(kigo).getByText('Kigo')).toBeInTheDocument()
    expect(within(kigo).getByText(/Is the room still available\?/)).toBeInTheDocument()
    expect(within(kigo).getByText('Room to Rent')).toBeInTheDocument()
    expect(within(kigo).getByText('Waiting for an answer')).toBeInTheDocument()
    expect(within(kigo).getByRole('link', { name: '+27831110001' })).toHaveAttribute('href', 'https://wa.me/27831110001')
    const landlord = screen.getByTestId('enquiry-e2')
    expect(within(landlord).getByText('Landlord')).toBeInTheDocument()
    expect(within(landlord).getByText('Answered')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('checkbox', { name: /Only those waiting/ }))
    expect(await screen.findByTestId('enquiry-e1')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByTestId('enquiry-e2')).not.toBeInTheDocument())
    expect(api.get).toHaveBeenCalledWith('/rentals/admin/enquiries', { params: { waiting: 1 } })
  })

  it('a failed load says so, in the server\'s words, never "no enquiries"', async () => {
    mockGets({ failEnquiries: true })
    renderWithProviders(<RentalsPanel />)
    await open('Enquiries')
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load enquiries. The database is busy.")
    expect(screen.queryByText('No enquiries yet.')).not.toBeInTheDocument()
  })

  it('Viewings shows the time, the place, the renter and landlord, and a booking missing from the diary', async () => {
    renderWithProviders(<RentalsPanel />)
    await open('Viewings')
    const v = await screen.findByTestId('viewing-v1')
    expect(within(v).getByText('Room to Rent')).toBeInTheDocument()
    expect(within(v).getByText('Kigo')).toBeInTheDocument()
    expect(within(v).getByText('Wayne')).toBeInTheDocument()
    expect(within(v).getByText('not in the diary: Not Found')).toBeInTheDocument()
    expect(within(v).getByText('Booked')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('combobox', { name: 'Show' }), { target: { value: 'cancelled' } })
    expect(await screen.findByText('No viewings here.')).toBeInTheDocument()
  })

  it('every application can be reached: Show more fetches the next page until the last one', async () => {
    // 53 in production on 2026-11-19, and the tab showed the newest 20 with no way to the rest.
    const row = (n) => ({ ...APPLICATIONS[0], id: `a${n}`, fullName: `Applicant ${n}` })
    api.get.mockImplementation((url, config) => {
      if (url === '/rentals/admin/applications') {
        const page = config?.params?.page || 1
        const rows = page === 1 ? Array.from({ length: 20 }, (_, i) => row(i + 1)) : Array.from({ length: 5 }, (_, i) => row(i + 21))
        return Promise.resolve({ data: { data: { applications: rows } } })
      }
      if (url === '/rentals/admin/listings') return Promise.resolve({ data: { data: { listings: [] } } })
      if (url === '/rentals/admin/placements') return Promise.resolve({ data: { data: { owed: 0, placements: [] } } })
      return Promise.reject(new Error(`Unmocked api.get call in test: ${url}`))
    })
    renderWithProviders(<RentalsPanel />)
    await open('Applications')
    expect(await screen.findByText('Showing 20 applications.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Show more' }))
    expect(await screen.findByTestId('application-a25')).toBeInTheDocument()
    expect(screen.getByText('Showing 25 applications, all of them.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Show more' })).not.toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/rentals/admin/applications', { params: { page: 2 } })
  })

  it('Applications names the place each one is for', async () => {
    renderWithProviders(<RentalsPanel />)
    await open('Applications')
    const a = await screen.findByTestId('application-a1')
    expect(within(a).getByText('Bachelor Available Florida Lake')).toBeInTheDocument()
    expect(within(a).getByText(/on WhatsApp/)).toBeInTheDocument()
    expect(within(a).getByText('earns R9 500 a month')).toBeInTheDocument()
  })
})
