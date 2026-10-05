// Removing someone from the EasyBranding team.
//
// It used to demote them to `borrower`, the old loan-app role, which left a
// working account behind and did nothing to a session they already had. A
// platform role sees every client's data, so that was up to seven days of it
// after being let go. Removal is now the account's soft delete, and the API
// checks the account on every request (protect, 2026-10-05), so the removed
// member is locked out of the session they hold as well.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import EBTeamPanel from '../../src/components/EBTeamPanel'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const TEAM = [
  { _id: 'u-owner', fullName: 'Ayanda', role: 'super_admin' },
  { _id: 'u-mgr', fullName: 'Sipho Manager', role: 'eb_manager' },
]

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockImplementation((url) => {
    if (url === '/users') return Promise.resolve({ data: { data: { users: TEAM } } })
    if (url === '/prospecting') return Promise.resolve({ data: { data: { prospects: [] } } })
    return Promise.reject(new Error(`Unmocked api.get in test: ${url}`))
  })
  api.delete.mockResolvedValue({ data: { success: true } })
  window.confirm = vi.fn(() => true)
})

describe('EBTeamPanel', () => {
  it('removes a team member by deactivating the account, not by demoting it', async () => {
    renderWithProviders(<EBTeamPanel isSuperAdmin />)
    await waitFor(() => expect(screen.getByText('Sipho Manager')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith('/users/u-mgr'))
    expect(api.put).not.toHaveBeenCalled()
  })

  it('says, before it happens, that access ends on every device', async () => {
    renderWithProviders(<EBTeamPanel isSuperAdmin />)
    await waitFor(() => expect(screen.getByText('Sipho Manager')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/access ends immediately/i))
  })

  it('does nothing if the confirmation is declined', async () => {
    window.confirm = vi.fn(() => false)
    renderWithProviders(<EBTeamPanel isSuperAdmin />)
    await waitFor(() => expect(screen.getByText('Sipho Manager')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))

    expect(api.delete).not.toHaveBeenCalled()
  })

  // The owner's own row has no Remove button: a platform without its
  // super_admin is a platform nobody can run.
  it('offers no way to remove the super_admin', async () => {
    renderWithProviders(<EBTeamPanel isSuperAdmin />)
    await waitFor(() => expect(screen.getByText('Ayanda')).toBeInTheDocument())

    expect(screen.getAllByRole('button', { name: 'Remove' })).toHaveLength(1)
  })
})
