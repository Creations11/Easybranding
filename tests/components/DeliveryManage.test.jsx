// Managing drivers and shops from the delivery tab (useDeliveryManage).
//
// What must hold: nothing that messages a driver or a shop, or removes
// anything, happens without a confirmation that says so; an edit sends only
// what changed; the API's refusal ("is out with 1 delivery right now") is
// shown word for word; and a platform session's choice of business rides on
// every write, as it does on every read.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render as rtlRender, screen, waitFor, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import api from '../../src/api'
import DeliveryTab from '../../src/components/DeliveryTab'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

const reply = (data) => Promise.resolve({ data: { success: true, data } })
const OVERVIEW = { enabled: true, name: 'Kasi Delivery', open: 0, drivers: { total: 1, onShift: 0 }, money: null }

const SIPHO = {
  name: 'Sipho', phone: '+27821234567', onShift: false, kycStatus: 'pending', status: 'active',
  vehicleType: 'motorbike', vehicleRegistration: null, fullName: null, practiceRequired: true, practiceDoneAt: null,
  carrying: null, owed: 0,
}
const MAMA = {
  id: 'v1', name: "Mama's Kitchen", phone: '+27760005555', category: 'food', open: false, plan: 'standard',
  wallet: null, paystackSubaccount: null, onboardingStep: 'review', active: false, contactName: null, address: null,
  commissionPct: 10, prepMinutes: null, deliveryOnly: false, joinCode: 'ABC123', joinLink: null,
}

const wire = ({ base = '', drivers = [SIPHO], businesses = [MAMA] } = {}) => {
  api.get.mockImplementation((url) => {
    if (url === '/delivery/overview') {
      return base ? reply({ enabled: true, needsTenant: true, tenants: [{ id: 't1', name: 'Kasi Delivery' }] }) : reply(OVERVIEW)
    }
    if (url === `/delivery/overview${base}`) return reply(OVERVIEW)
    if (url === `/delivery/drivers${base}`) return reply(drivers)
    if (url === `/delivery/businesses${base}`) return reply(businesses)
    if (url === '/delivery/manage/categories') return reply([{ id: 'food', label: 'Food & Takeaways' }, { id: 'spaza', label: 'Spaza & Convenience' }])
    return reply([])
  })
}

const render = (ui) => rtlRender(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
)

const open = async (section) => {
  render(<DeliveryTab />)
  await waitFor(() => expect(screen.getByText(section)).toBeInTheDocument())
  fireEvent.click(screen.getByText(section))
}

const refusal = (message) => Promise.reject(Object.assign(new Error('409'), { response: { data: { message } } }))

describe('managing drivers and shops', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    wire()
  })
  afterEach(() => vi.restoreAllMocks())

  it('adds a driver and shows the link to send them', async () => {
    api.post.mockReturnValue(reply({ driver: { name: 'Thabo', phone: '+27831112222' }, joinLink: 'https://wa.me/27843689501?text=START' }))
    await open('🛵 Drivers')
    fireEvent.click(await screen.findByText('+ Add driver'))
    fireEvent.change(screen.getByLabelText('Driver name'), { target: { value: ' Thabo ' } })
    fireEvent.change(screen.getByLabelText('Driver phone'), { target: { value: '0831112222' } })
    fireEvent.click(screen.getByText('Add driver', { selector: 'button' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/delivery/manage/drivers', {
      name: 'Thabo', phone: '0831112222', vehicleType: null, vehicleRegistration: null,
    }))
    expect(await screen.findByText(/wa\.me\/27843689501/)).toBeInTheDocument()
  })

  it('removes a driver only after a confirmation, and shows the refusal word for word', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    api.delete.mockImplementation(() => refusal('Sipho is out with 1 delivery right now. Suspend them first.'))
    await open('🛵 Drivers')
    fireEvent.click(await screen.findByText('Remove'))
    expect(api.delete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByText('Remove'))
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/delivery/manage/drivers/%2B27821234567'))
    expect(await screen.findByText('Sipho is out with 1 delivery right now. Suspend them first.')).toBeInTheDocument()
    expect(confirm).toHaveBeenCalledTimes(2)
  })

  it('says a driver is messaged before accepting papers, and needs a reason to send them back', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.spyOn(window, 'prompt').mockReturnValueOnce('  ').mockReturnValueOnce('Licence photo is blurry')
    api.post.mockReturnValue(reply({ kycStatus: 'verified' }))
    await open('🛵 Drivers')

    fireEvent.click(await screen.findByText('Accept papers'))
    expect(confirm.mock.calls[0][0]).toMatch(/They get a WhatsApp/)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/delivery/manage/drivers/%2B27821234567/verify', {}))

    fireEvent.click(screen.getByText('Send papers back'))
    expect(api.post).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Send papers back'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/delivery/manage/drivers/%2B27821234567/reject', { reason: 'Licence photo is blurry' }))
  })

  it('edits a driver, sending only what changed', async () => {
    api.patch.mockReturnValue(reply({ driver: { name: 'Sipho N' } }))
    await open('🛵 Drivers')
    fireEvent.click(await screen.findByText('Edit'))
    fireEvent.change(screen.getByLabelText('Driver name'), { target: { value: 'Sipho N' } })
    fireEvent.change(screen.getByLabelText('Registration'), { target: { value: 'ab12cd gp' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/delivery/manage/drivers/%2B27821234567', {
      name: 'Sipho N', vehicleRegistration: 'ab12cd gp',
    }))
  })

  it("approves a shop that is waiting, after saying it will be told, and edits only what changed", async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.post.mockReturnValue(reply({}))
    api.patch.mockReturnValue(reply({ shop: { id: 'v1' } }))
    await open('🏪 Businesses')

    await screen.findByText("Mama's Kitchen")
    expect(screen.queryByText('Switch on')).toBeNull() // not before approval
    fireEvent.click(screen.getByText('Approve'))
    expect(confirm.mock.calls[0][0]).toMatch(/They get a WhatsApp/)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/delivery/manage/shops/v1/approve', {}))

    fireEvent.click(screen.getByText('Edit'))
    fireEvent.change(screen.getByLabelText('Commission'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('Address'), { target: { value: '12 Main Rd' } })
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/delivery/manage/shops/v1', { address: '12 Main Rd', commissionPct: 12 }))
  })

  it('adds a shop from the categories the API gives, and shows its join link', async () => {
    api.post.mockReturnValue(reply({ shop: { id: 'v2', name: 'Spaza One', joinCode: 'XYZ789' }, joinLink: 'https://wa.me/27843689501?text=JOIN%20XYZ789' }))
    await open('🏪 Businesses')
    fireEvent.click(await screen.findByText('+ Add shop'))
    fireEvent.change(screen.getByLabelText('Shop name'), { target: { value: 'Spaza One' } })
    await screen.findByRole('option', { name: 'Spaza & Convenience' })
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'spaza' } })
    fireEvent.change(screen.getByLabelText('Shop phone'), { target: { value: '0760006666' } })
    fireEvent.click(screen.getByText('Add shop', { selector: 'button' }))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/delivery/manage/shops', {
      name: 'Spaza One', category: 'spaza', phone: '0760006666', contactName: null, deliveryOnly: false, commissionPct: 0,
    }))
    expect(await screen.findByText(/Join code: XYZ789/)).toBeInTheDocument()
  })

  it("carries a platform session's choice of business on every write", async () => {
    localStorage.setItem('eb_user', JSON.stringify({ role: 'super_admin' }))
    wire({ base: '?tenantId=t1' })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    api.post.mockReturnValue(reply({ status: 'suspended', carrying: 0 }))
    render(<DeliveryTab />)
    fireEvent.click(await screen.findByText('Kasi Delivery'))
    fireEvent.click(await screen.findByText('🛵 Drivers'))
    fireEvent.click(await screen.findByText('Suspend'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/delivery/manage/drivers/%2B27821234567/suspend?tenantId=t1', {}))
  })
})
