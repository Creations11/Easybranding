// EasyRentals accounts managed by staff: make, edit, reset password, delete.
//
// Pinned: a new account's temporary password is shown once and never typed
// by staff; an edit sends only what changed; a password reset and a delete
// each need a confirmation that says what happens.
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

const THABO = {
  id: 'a9', fullName: 'Thabo Mokoena', email: 'thabo@example.com', phone: '+27821112222', roles: ['renter'],
  isActive: true, listings: 2, createdAt: '2026-10-06T08:00:00Z', lastLoginAt: null,
}

const openAccounts = async () => {
  renderWithProviders(<RentalsPanel />)
  fireEvent.click(screen.getByRole('tab', { name: 'Accounts' }))
  await screen.findByTestId('account-a9')
}

describe('RentalsPanel accounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.get.mockImplementation((url) => Promise.resolve({
      data: { data: url === '/rentals/admin/accounts' ? { accounts: [THABO] } : { listings: [] } },
    }))
  })
  afterEach(() => vi.restoreAllMocks())

  it('makes an account and shows the temporary password once', async () => {
    api.post.mockResolvedValue({ data: { data: { account: { ...THABO, id: 'a10', fullName: 'Lindiwe K' }, temporaryPassword: 'Xy7_kq2Lm9Pw' } } })
    await openAccounts()
    fireEvent.click(screen.getByText('+ New account'))
    expect(screen.queryByLabelText(/password/i)).toBeNull() // staff never type one
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Lindiwe K' } })
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'lindiwe@example.com' } })
    fireEvent.change(screen.getByLabelText('Cellphone'), { target: { value: '0827654321' } })
    fireEvent.click(screen.getByLabelText('Landlord'))
    fireEvent.click(screen.getByText('Make account'))

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/rentals/admin/accounts', {
      fullName: 'Lindiwe K', email: 'lindiwe@example.com', phone: '0827654321', roles: ['renter', 'landlord'],
    }))
    expect(await screen.findByTestId('temporary-password')).toHaveTextContent('Xy7_kq2Lm9Pw')
    fireEvent.click(screen.getByText('Done'))
    expect(screen.queryByText('Xy7_kq2Lm9Pw')).toBeNull()
  })

  it('edits only what changed', async () => {
    api.patch.mockResolvedValue({ data: { data: { account: THABO } } })
    await openAccounts()
    fireEvent.click(screen.getByText('Edit'))
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'thabo.new@example.com' } })
    fireEvent.click(screen.getByLabelText('Landlord'))
    fireEvent.click(screen.getByText('Save'))
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith('/rentals/admin/accounts/a9', {
      email: 'thabo.new@example.com', roles: ['renter', 'landlord'],
    }))
  })

  it('resets a password only after a confirmation, and shows the new one', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    api.post.mockResolvedValue({ data: { data: { account: THABO, temporaryPassword: 'N3w-Pass_123' } } })
    await openAccounts()
    fireEvent.click(screen.getByText('Reset password'))
    expect(api.post).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Reset password'))
    expect(confirm.mock.calls[1][0]).toMatch(/stops working at once/)
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/rentals/admin/accounts/a9/reset-password', {}))
    expect(await screen.findByTestId('temporary-password')).toHaveTextContent('N3w-Pass_123')
  })

  it('deletes only after a confirmation that says what happens to their listings', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    api.delete.mockResolvedValue({ data: { data: { archivedListings: 2, closedApplications: 0, withdrawnApplications: 0 } } })
    await openAccounts()
    fireEvent.click(screen.getByText('Delete'))
    expect(api.delete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByText('Delete'))
    expect(confirm.mock.calls[1][0]).toMatch(/2 listings are archived/)
    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/rentals/admin/accounts/a9'))
  })
})
