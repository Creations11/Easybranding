// The signup wizard: the path from "I just registered" to a Paystack link.
// Untested until 2026-10-05.
//
// What is pinned here is what has gone wrong before, or would cost money if
// it did:
//   - a self-served owner already HAS a business (registering created it),
//     so finishing must update that one. POSTing made a second business on
//     the same number, and getTenantByNumber then answered with whichever it
//     found first
//   - an operator onboarding a client must not call /onboarding/choose: it
//     acts on the caller's own tenant, so it would price and publish onto
//     the operator's account instead of the client's
//   - the plan's price is the one the API served, never a typed-in table
//   - when prices cannot load, the plan step says so. It promised to and did
//     not: the error was computed into a variable nothing rendered
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
vi.mock('../../src/api', () => ({
  default: { get: (...a) => get(...a), post: (...a) => post(...a), put: (...a) => put(...a) },
}))

// The lists are mocked at the source; tenantFieldsFor stays real, because it
// is what turns the chosen product into plan + monthlyFee.
const loadProducts = vi.fn()
const loadIndustries = vi.fn()
vi.mock('../../src/config/plans', async (importOriginal) => ({
  ...(await importOriginal()),
  loadProducts: (...a) => loadProducts(...a),
  loadIndustries: (...a) => loadIndustries(...a),
}))

import Onboarding from '../../src/pages/Onboarding'

const PRODUCTS = [
  { key: 'ai_receptionist', label: 'AI Receptionist', price: 99, plan: 'starter' },
  { key: 'ai_sales_assistant', label: 'AI Sales Assistant', price: 999, plan: 'growth' },
]
const INDUSTRIES = [{ id: 'salon', label: 'Hair & Beauty' }]

const OWNER = { role: 'admin', tenantId: 'tenant-own', email: 'owner@salon.co.za', fullName: 'Thandi' }
const OPERATOR = { role: 'super_admin', email: 'ops@easybranding.co.za', fullName: 'Ops' }

const renderWizard = (user) =>
  renderWithProviders(<MemoryRouter><Onboarding /></MemoryRouter>, { user })

const next = (u) => u.click(screen.getByRole('button', { name: /next/i }))

// Every step, the way a person fills it in. Stops on the plan step when asked.
async function walk(u, { stopAtPlan = false } = {}) {
  await next(u) // welcome

  await u.type(screen.getAllByPlaceholderText('ABC Rentals')[0], 'Thandi Hair')
  await next(u) // business details (industry has a default)

  await u.type(screen.getByPlaceholderText('admin@abcrentals.co.za'), 'owner@salon.co.za')
  const [contactPhone, ownerPhone] = screen.getAllByPlaceholderText('+27821234567')
  await u.type(contactPhone, '+27715550001')
  await u.type(ownerPhone, '+27715550001')
  await next(u) // contact

  await u.click(screen.getByRole('button', { name: /give me a number/i }))
  await u.type(screen.getByPlaceholderText('whatsapp:+27821234567'), 'whatsapp:+27715550002')
  await next(u) // number

  await next(u) // workflow (defaults to full)

  await waitFor(() => expect(screen.getByRole('option', { name: 'Hair & Beauty' })).toBeInTheDocument())
  await u.selectOptions(screen.getByRole('combobox'), 'salon')
  await next(u) // bot

  if (stopAtPlan) return
  await waitFor(() => expect(screen.getByRole('option', { name: /AI Receptionist/ })).toBeInTheDocument())
  await u.selectOptions(screen.getByRole('combobox'), 'ai_receptionist')
  await next(u) // plan

  await u.click(screen.getByRole('button', { name: /launch business/i }))
}

beforeEach(() => {
  localStorage.clear()
  get.mockReset(); post.mockReset(); put.mockReset()
  loadProducts.mockReset(); loadIndustries.mockReset()
  loadProducts.mockResolvedValue(PRODUCTS)
  loadIndustries.mockResolvedValue(INDUSTRIES)
  get.mockImplementation((url) => (url === '/onboarding/status'
    ? Promise.resolve({ data: { data: { business: { name: 'Thandi Hair' } } } })
    : Promise.reject(new Error(`Unmocked api.get in test: ${url}`))))
  put.mockResolvedValue({ data: { success: true } })
  post.mockImplementation((url) => Promise.resolve(url === '/onboarding/choose'
    ? { data: { data: { paymentUrl: 'https://checkout.paystack.com/test-link' } } }
    : { data: { success: true } }))
  // Validation speaks through alert(); a test that trips one should say so.
  window.alert = vi.fn()
  delete window.location
  window.location = { href: '' }
})

describe('Onboarding', () => {
  it('finishes an owner\'s OWN business, never creating a second one', async () => {
    const u = userEvent.setup()
    renderWizard(OWNER)

    await walk(u)

    await waitFor(() => expect(put).toHaveBeenCalled())
    expect(put.mock.calls[0][0]).toBe('/tenants/tenant-own')
    expect(post).not.toHaveBeenCalledWith('/tenants', expect.anything())
    expect(window.alert).not.toHaveBeenCalled()
  })

  it('charges the price the API served, for the plan they picked', async () => {
    const u = userEvent.setup()
    renderWizard(OWNER)

    await walk(u)

    await waitFor(() => expect(put).toHaveBeenCalled())
    const payload = put.mock.calls[0][1]
    expect(payload.monthlyFee).toBe(99)
    expect(payload.plan).toBe('starter')
    expect(payload.onboarding).toEqual({ productKey: 'ai_receptionist', templateId: 'salon' })
  })

  it('sends an owner to their Paystack link', async () => {
    const u = userEvent.setup()
    renderWizard(OWNER)

    await walk(u)

    await waitFor(() => expect(window.location.href).toBe('https://checkout.paystack.com/test-link'))
    expect(post).toHaveBeenCalledWith('/onboarding/choose', { productKey: 'ai_receptionist', templateId: 'salon' })
  })

  it('lets an operator create the client\'s business without pricing their own account', async () => {
    const u = userEvent.setup()
    renderWizard(OPERATOR)

    await walk(u)

    await waitFor(() => expect(post).toHaveBeenCalledWith('/tenants', expect.anything()))
    expect(put).not.toHaveBeenCalled()
    expect(post).not.toHaveBeenCalledWith('/onboarding/choose', expect.anything())
  })

  it('says so on the plan step when prices cannot load', async () => {
    loadProducts.mockRejectedValue(new Error('Price list unavailable'))
    const u = userEvent.setup()
    renderWizard(OWNER)

    await walk(u, { stopAtPlan: true })

    expect(screen.getByText('Choose Your Plan')).toBeInTheDocument()
    const alertBox = await screen.findByRole('alert')
    expect(within(alertBox).getByText(/Could not load pricing/)).toBeInTheDocument()
  })
})
