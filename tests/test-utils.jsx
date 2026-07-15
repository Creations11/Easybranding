// tests/test-utils.jsx
// Shared render helper for dashboard tests.
//
// Deliberately does NOT wrap with <AuthProvider> — useAuth()'s no-context
// fallback (src/context/AuthContext.jsx) reads localStorage['eb_user']
// synchronously with no network call, which is simpler and fully
// sufficient for controlling auth state in these tests than mounting the
// real provider (which would trigger a real GET /auth/me on mount).
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const DEFAULT_USER = { role: 'super_admin', fullName: 'Test Admin', email: 'admin@test.co.za' }

export function seedUser(user = DEFAULT_USER) {
  localStorage.setItem('eb_user', JSON.stringify(user))
}

export function renderWithProviders(ui, { user = DEFAULT_USER } = {}) {
  seedUser(user)
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    ),
  }
}
