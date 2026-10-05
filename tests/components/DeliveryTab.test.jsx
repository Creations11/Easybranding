// The delivery tab is the first screen for a business whose whole product
// has lived inside WhatsApp, so what it must never do is claim a number that
// is not there. Every figure on it is somebody's money: what a driver is
// owed, what a shop's wallet holds, what the business kept.
//
// These cover the two things that are not cosmetic — an endpoint failing
// must not blank the tab, and the parts of a delivery that are deliberately
// absent must stay absent — plus the empty states, which on a pilot are what
// the owner actually sees most days.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render as rtlRender, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import api from '../../src/api'
import DeliveryTab from '../../src/components/DeliveryTab'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

const OVERVIEW = {
  enabled: true, name: 'Kasi Delivery', open: 2, today: 3, waiting: 1,
  drivers: { total: 1, onShift: 1 },
  money: { revenue: 15.5, paystackFees: 2.53, refunds: 0, driverOwed: 20, vendorOwed: 49.5, walletHeld: 500 },
}

const ORDERS = [
  {
    reference: 'DLV-AAA111', status: 'pending', paymentStatus: 'paid', customerName: 'Thandi',
    customerPhone: '+27715550993', driverName: null, vendorName: "Mama's Kitchen", total: 85,
    createdAt: new Date().toISOString(), orderSource: 'CUSTOMER_KASI',
  },
  {
    reference: 'DLV-BBB222', status: 'on_the_way', paymentStatus: 'paid', customerName: 'Sipho',
    customerPhone: '+27760001111', driverName: 'Sipho D', vendorName: 'Alex Pharmacy', total: 45,
    createdAt: new Date(Date.now() - 3600000).toISOString(), orderSource: 'BUSINESS_WHATSAPP',
  },
]

const reply = (data) => Promise.resolve({ data: { success: true, data } })

const wire = ({ overview = OVERVIEW, orders = ORDERS, drivers = [], businesses = [], payouts = { batches: [] } } = {}) => {
  api.get.mockImplementation((url) => {
    if (url === '/delivery/overview') return reply(overview)
    if (url === '/delivery/orders') return reply(orders)
    if (url.startsWith('/delivery/orders/')) {
      return reply({
        reference: 'DLV-AAA111', status: 'pending', customerName: 'Thandi', customerPhone: '+27715550993',
        dropoffAddress: '45 7th Avenue', vendorName: "Mama's Kitchen", driverName: null,
        quotedKm: 7.2, distanceSource: 'OSRM', total: 85, driverFee: 20, kasiFee: 15.5,
        trackingUrl: 'https://api.example/track/abc', history: [{ status: 'pending', at: new Date().toISOString() }],
      })
    }
    if (url === '/delivery/drivers') return reply(drivers)
    if (url === '/delivery/businesses') return reply(businesses)
    if (url === '/delivery/payouts') return reply(payouts)
    return reply([])
  })
}

// A fresh query client per render, retries off: a test that fails a panel
// wants the banner now, not after the real app's backoff.
const render = (ui) => rtlRender(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    {ui}
  </QueryClientProvider>
)

describe('DeliveryTab', () => {
  beforeEach(() => { vi.clearAllMocks() })

  // The bug that hid the whole feature: a platform session has no tenant, so
  // it is asked which business rather than shown nothing.
  it('asks a platform session which business, then loads that one', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/delivery/overview') {
        return reply({ enabled: true, needsTenant: true, tenants: [{ id: 't1', name: 'Kasi Delivery' }] })
      }
      if (url.startsWith('/delivery/overview?tenantId=t1')) return reply(OVERVIEW)
      if (url.startsWith('/delivery/orders?tenantId=t1')) return reply(ORDERS)
      return reply([])
    })
    render(<DeliveryTab />)

    await waitFor(() => expect(screen.getByText('Kasi Delivery')).toBeInTheDocument())
    expect(screen.getByText(/Which delivery business/i)).toBeInTheDocument()

    fireEvent.click(screen.getByText('Kasi Delivery'))


    // Every call after the choice carries it.
    await waitFor(() => expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument())
    expect(api.get).toHaveBeenCalledWith('/delivery/orders?tenantId=t1')
  })

  // Choosing a business makes every later overview carry a tenantId, so it
  // stops answering needsTenant. Recomputing the list from that answer wiped
  // it and took the way back with it: one business per page load.
  it('keeps the way back to another business after one is picked', async () => {
    api.get.mockImplementation((url) => {
      if (url === '/delivery/overview') {
        return reply({
          enabled: true,
          needsTenant: true,
          tenants: [{ id: 't1', name: 'Kasi Delivery' }, { id: 't2', name: 'Soweto Runs' }],
        })
      }
      if (url.startsWith('/delivery/overview?')) return reply(OVERVIEW)
      if (url.startsWith('/delivery/orders?')) return reply(ORDERS)
      return reply([])
    })
    render(<DeliveryTab />)

    await waitFor(() => expect(screen.getByText(/Which delivery business/i)).toBeInTheDocument())
    fireEvent.click(screen.getByText('Soweto Runs'))

    await waitFor(() => expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument())
    expect(screen.getByText(/Another business/i)).toBeInTheDocument()
  })

  // Nothing belonging to one business may be on screen under another's name,
  // not even for the second a load takes.
  it('empties the screen while a different business loads', async () => {
    let release
    const held = new Promise((r) => { release = r })
    api.get.mockImplementation((url) => {
      if (url === '/delivery/overview') {
        return reply({
          enabled: true,
          needsTenant: true,
          tenants: [{ id: 't1', name: 'Kasi Delivery' }, { id: 't2', name: 'Soweto Runs' }],
        })
      }
      if (url.includes('tenantId=t2')) return held.then(() => ({ data: { success: true, data: [] } }))
      if (url.startsWith('/delivery/overview?')) return reply(OVERVIEW)
      if (url.startsWith('/delivery/orders?')) return reply(ORDERS)
      return reply([])
    })
    render(<DeliveryTab />)

    await waitFor(() => expect(screen.getByText(/Which delivery business/i)).toBeInTheDocument())
    fireEvent.click(screen.getByText('Kasi Delivery'))
    await waitFor(() => expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument())

    fireEvent.click(screen.getByText(/Another business/i))
    fireEvent.click(screen.getByText('Soweto Runs'))

    expect(screen.queryByText(/DLV-AAA111/)).not.toBeInTheDocument()
    release()
  })

  it('shows the day, and puts an order nobody has taken first', async () => {
    wire()
    render(<DeliveryTab />)

    await waitFor(() => expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument())
    // Paid, unclaimed: the only row where looking at the screen changes anything.
    expect(screen.getByText(/Paid, and nobody has taken it/i)).toBeInTheDocument()
    const rows = screen.getAllByText(/DLV-/)
    expect(rows[0].textContent).toContain('DLV-AAA111')
  })

  it('says which shop sent a business-initiated delivery', async () => {
    wire()
    render(<DeliveryTab />)

    await waitFor(() => expect(screen.getByText(/sent by Alex Pharmacy/i)).toBeInTheDocument())
  })

  it('opens one order and keeps the three fees apart', async () => {
    wire()
    render(<DeliveryTab />)
    await waitFor(() => expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument())

    fireEvent.click(screen.getByText(/DLV-AAA111/))

    await waitFor(() => expect(screen.getByText('45 7th Avenue')).toBeInTheDocument())
    expect(screen.getByText('Driver earns')).toBeInTheDocument()
    expect(screen.getByText('We keep')).toBeInTheDocument()
    // A measured route says so; an estimate says "estimated".
    expect(screen.getByText(/7\.2 km by road/)).toBeInTheDocument()
  })

  // One dead endpoint must not take the tab with it.
  it('keeps working when a panel fails, and says which', async () => {
    wire()
    api.get.mockImplementation((url) => {
      if (url === '/delivery/drivers') return Promise.reject(new Error('boom'))
      if (url === '/delivery/overview') return reply(OVERVIEW)
      if (url === '/delivery/orders') return reply(ORDERS)
      return reply([])
    })

    render(<DeliveryTab />)

    await waitFor(() => expect(screen.getByText(/Could not load drivers/i)).toBeInTheDocument())
    expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument()
  })

  // Not "today" and not "yet": the endpoint returns anything still moving,
  // whatever its age, PLUS the last 24 hours — so an empty list means neither
  // of those, and both words would be a claim the data does not support.
  it('says something useful when there is nothing yet', async () => {
    wire({ orders: [] })
    render(<DeliveryTab />)

    await waitFor(() => expect(screen.getByText(/last 24 hours/i)).toBeInTheDocument())
    expect(screen.getByText(/nothing still moving/i)).toBeInTheDocument()
  })

  it('shows a wallet only for a subscriber', async () => {
    wire({
      businesses: [
        { id: '1', name: "Mama's Kitchen", phone: '+27760005555', category: 'food', open: true, plan: 'subscriber', wallet: 500 },
        { id: '2', name: 'Pay As You Go', phone: '+27760007777', category: 'spaza', open: false, plan: 'standard', wallet: null },
      ],
    })
    render(<DeliveryTab />)
    await waitFor(() => expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument())

    fireEvent.click(screen.getByText(/Businesses/i))

    await waitFor(() => expect(screen.getByText("Mama's Kitchen")).toBeInTheDocument())
    expect(screen.getByText('R500')).toBeInTheDocument()
    expect(screen.getAllByText('Wallet')).toHaveLength(1)     // not on the standard one
  })

  it('keeps the drivers money out of what the business kept', async () => {
    wire()
    render(<DeliveryTab />)
    await waitFor(() => expect(screen.getByText(/DLV-AAA111/)).toBeInTheDocument())

    fireEvent.click(screen.getByText(/Money/i))

    await waitFor(() => expect(screen.getByText('We kept')).toBeInTheDocument())
    // Money we are HOLDING sits under its own heading, never inside what the
    // business earned. ("🛵 Drivers" is also the section button, hence the
    // heading rather than the row.)
    expect(screen.getByText(/Owed out right now/i)).toBeInTheDocument()
    expect(screen.getByText(/never ours/i)).toBeInTheDocument()
  })
})
