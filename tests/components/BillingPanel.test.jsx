// Clients & Billing — the screen for /api/admin-ops/billing.
//
// Each action here moves money or silences a business's customers, so the
// tests cover what must hold: a failed load is never "nothing owed", nothing
// posts without its required fields or a confirmation, and the server's own
// refusal and consequence text reach the screen verbatim.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, within } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import BillingPanel from '../../src/components/BillingPanel'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))

const VENBUS = {
  tenantId: 't-venbus', businessName: 'Venbus', status: 'suspended', suspendReason: 'R99 unpaid',
  monthlyFee: 99, contactPhone: '+27814023301', canSend: true, sendBlocker: null, owed: 99,
  openInvoices: [{ id: 'inv-1', invoiceNumber: 'INV-2026-00001', total: 99, status: 'sent' }],
  lastPayment: null,
}
const LONARS = {
  tenantId: 't-lonars', businessName: "Lonars' Soft Comfort", status: 'trial', monthlyFee: 0,
  contactPhone: '+27603481157', canSend: false, sendBlocker: 'cloud tenant with no phone_number_id — number is not registered',
  owed: 0, openInvoices: [], lastPayment: null,
}

const list = (clients = [VENBUS, LONARS]) => ({ data: { data: clients } })
const row = (id) => screen.getByTestId(`client-${id}`)

describe('BillingPanel', () => {
  beforeEach(() => {
    api.get.mockReset()
    api.post.mockReset()
    api.get.mockResolvedValue(list())
  })
  afterEach(() => vi.restoreAllMocks())

  it('shows each client with what it owes, its status, and whether it can send', async () => {
    renderWithProviders(<BillingPanel />)
    expect(await screen.findByText('Venbus')).toBeInTheDocument()
    expect(within(row('t-venbus')).getByText('owes R99')).toBeInTheDocument()
    expect(within(row('t-venbus')).getByText(/INV-2026-00001/)).toBeInTheDocument()
    expect(within(row('t-lonars')).getByText(/can't send/)).toBeInTheDocument()
    expect(screen.getByText(/R99/, { selector: 'strong' })).toBeInTheDocument()
  })

  // A zero on a failed load reads as "everyone is paid up".
  it('never shows "nothing owed" when the figures failed to load', async () => {
    api.get.mockRejectedValue(new Error('down'))
    renderWithProviders(<BillingPanel />)
    expect(await screen.findByText(/Couldn't load billing/)).toBeInTheDocument()
    expect(screen.queryByText('nothing owed')).not.toBeInTheDocument()
  })

  describe('Record EFT', () => {
    const open = async () => {
      renderWithProviders(<BillingPanel />)
      await screen.findByText('Venbus')
      fireEvent.click(within(row('t-venbus')).getByText('Record EFT'))
    }

    it('will not submit without the bank reference', async () => {
      await open()
      expect(screen.getByText('Record payment')).toBeDisabled()
      expect(api.post).not.toHaveBeenCalled()
    })

    it('records it against the invoice, switches them back on, and shows what the server said', async () => {
      api.post.mockResolvedValue({ data: { data: {
        paymentId: 'p1', invoice: { id: 'inv-1', invoiceNumber: 'INV-2026-00001', closed: true }, reactivated: true,
        warnings: ['Their monthly fee is R99; this payment is R100.'],
      } } })
      await open()
      fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '100' } })
      fireEvent.change(screen.getByLabelText('Bank reference'), { target: { value: 'Standard Bank 4152557323' } })
      expect(screen.getByLabelText('Switch them back on')).toBeChecked()
      fireEvent.click(screen.getByText('Record payment'))

      await waitFor(() => expect(api.post).toHaveBeenCalledTimes(1))
      const [url, body] = api.post.mock.calls[0]
      expect(url).toBe('/admin-ops/billing/clients/t-venbus/eft-payment')
      expect(body).toMatchObject({ amount: 100, bankReference: 'Standard Bank 4152557323', invoiceId: 'inv-1', reactivate: true })
      expect(body.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)

      expect(await screen.findByText(/Invoice INV-2026-00001 closed/)).toBeInTheDocument()
      expect(screen.getByText(/monthly fee is R99; this payment is R100/)).toBeInTheDocument()
      await waitFor(() => expect(api.get.mock.calls.length).toBeGreaterThan(1)) // list refreshed
    })

    it("shows the server's refusal verbatim and keeps the form open", async () => {
      api.post.mockRejectedValue({ response: { status: 409, data: { message: 'Already recorded: R99 with reference "x".' } } })
      await open()
      fireEvent.change(screen.getByLabelText('Bank reference'), { target: { value: 'x' } })
      fireEvent.click(screen.getByText('Record payment'))
      expect(await screen.findByText(/Already recorded: R99/)).toBeInTheDocument()
      expect(screen.getByLabelText('Bank reference')).toBeInTheDocument()
    })
  })

  describe('Send Pay Now', () => {
    it('asks first, and sends nothing if you say no', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      renderWithProviders(<BillingPanel />)
      await screen.findByText('Venbus')
      fireEvent.click(within(row('t-venbus')).getByText('Send Pay Now'))
      expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/INV-2026-00001.*\+27814023301/))
      expect(api.post).not.toHaveBeenCalled()
    })

    it('sends it for the oldest open invoice when you confirm', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      api.post.mockResolvedValue({ data: { data: { sent: true, link: null, invoice: { invoiceNumber: 'INV-2026-00001', total: 99 } } } })
      renderWithProviders(<BillingPanel />)
      await screen.findByText('Venbus')
      fireEvent.click(within(row('t-venbus')).getByText('Send Pay Now'))
      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/billing/clients/t-venbus/payment-link', { invoiceId: 'inv-1' }))
      expect(await screen.findByText(/Pay Now sent for INV-2026-00001/)).toBeInTheDocument()
    })

    // Minted but undelivered: hand the link over, never invite a second charge.
    it('hands over the link when WhatsApp did not deliver it', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      api.post.mockResolvedValue({ data: { data: { sent: false, link: 'https://checkout.paystack.com/abc', invoice: { invoiceNumber: 'INV-2026-00001', total: 99 } } } })
      renderWithProviders(<BillingPanel />)
      await screen.findByText('Venbus')
      fireEvent.click(within(row('t-venbus')).getByText('Send Pay Now'))
      expect(await screen.findByText(/checkout\.paystack\.com\/abc/)).toBeInTheDocument()
      expect(screen.getByText(/second charge/)).toBeInTheDocument()
    })

    it('is disabled when there is nothing open to pay', async () => {
      renderWithProviders(<BillingPanel />)
      await screen.findByText("Lonars' Soft Comfort")
      expect(within(row('t-lonars')).getByText('Send Pay Now')).toBeDisabled()
    })
  })

  describe('Suspend / Reactivate', () => {
    it('requires a reason to suspend, then shows what it means for their customers', async () => {
      api.get.mockResolvedValue(list([{ ...VENBUS, status: 'active' }]))
      const prompt = vi.spyOn(window, 'prompt').mockReturnValueOnce('').mockReturnValueOnce('R99 unpaid')
      api.post.mockResolvedValue({ data: { data: { status: 'suspended', consequence: "Their customers' messages are recorded on their account, and nobody replies." } } })
      renderWithProviders(<BillingPanel />)
      await screen.findByText('Venbus')

      fireEvent.click(within(row('t-venbus')).getByText('Suspend'))
      expect(api.post).not.toHaveBeenCalled() // empty reason → nothing sent

      fireEvent.click(within(row('t-venbus')).getByText('Suspend'))
      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/billing/clients/t-venbus/suspend', { reason: 'R99 unpaid' }))
      expect(await screen.findByText(/nobody replies/)).toBeInTheDocument()
      expect(prompt).toHaveBeenCalledTimes(2)
    })

    it('reactivates on confirmation and shows the consequence, including a number that still cannot send', async () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      api.post.mockResolvedValue({ data: { data: { status: 'active', consequence: 'Active again — but their number cannot send (no phone_number_id).' } } })
      renderWithProviders(<BillingPanel />)
      await screen.findByText('Venbus')
      fireEvent.click(within(row('t-venbus')).getByText('Reactivate'))
      await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admin-ops/billing/clients/t-venbus/reactivate', {}))
      expect(await screen.findByText(/number cannot send/)).toBeInTheDocument()
    })
  })
})
