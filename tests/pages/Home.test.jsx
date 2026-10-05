// The landing page's price.
//
// Most of our inbound clicks an ad selling the R99 product by name, then lands
// here. The price on this page used to be a typed-in "R999/month.", which is
// the top of the ladder, so an R99 ad led to an R999 page. It now comes from
// /api/products, and when that list cannot load the page says nothing about
// price rather than guessing one: plans.js throws on purpose because every
// fallback price in this system has been wrong at least once.
//
// loadProducts is mocked rather than the HTTP client underneath it. The page's
// contract is "given the price list, or given none", and plans.js keeps a
// module-level cache that would otherwise leak one test's answer into the next.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const loadProducts = vi.fn()
vi.mock('../../src/config/plans', () => ({ loadProducts: (...a) => loadProducts(...a) }))

import Home from '../../src/pages/Home'

const renderHome = () => render(<MemoryRouter><Home /></MemoryRouter>)

// "R<digits>/month" anywhere on the page. The phone mock-up's "R450 paid" is a
// pretend customer's receipt, not a price we quote, and does not match.
const QUOTED_PRICE = /R\s?\d+\s*\/\s*month/

describe('Home', () => {
  beforeEach(() => { loadProducts.mockReset() })

  it('quotes the cheapest price the API serves', async () => {
    loadProducts.mockResolvedValue([{ price: 499 }, { price: 99 }, { price: 999 }])
    renderHome()

    await waitFor(() => expect(screen.getByText(/From R99\/month\./)).toBeInTheDocument())
    expect(screen.getByText(/Less than one missed job/)).toBeInTheDocument()
  })

  it('quotes nothing while the price list is on its way', () => {
    loadProducts.mockReturnValue(new Promise(() => {}))
    renderHome()

    expect(document.body.textContent).not.toMatch(QUOTED_PRICE)
    expect(document.body.textContent).not.toMatch(/R999/)
  })

  // The case the old fallback existed for. A page that cannot reach the price
  // list must not invent one, and must still let somebody start.
  it('quotes nothing when the price list cannot load, and keeps the way in', async () => {
    loadProducts.mockRejectedValue(new Error('Price list unavailable'))
    renderHome()

    await waitFor(() => expect(loadProducts).toHaveBeenCalled())
    await new Promise((r) => setTimeout(r, 0))

    expect(document.body.textContent).not.toMatch(QUOTED_PRICE)
    expect(document.body.textContent).not.toMatch(/R999/)
    // The comparison lines only make sense next to a real price.
    expect(screen.queryByText(/Less than one missed job/)).not.toBeInTheDocument()
    expect(screen.getByText(/Start today/)).toBeInTheDocument()
  })
})
