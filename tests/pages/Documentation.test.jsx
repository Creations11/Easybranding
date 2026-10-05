// The public docs page, linked as "Docs" from the site's nav. Untested until
// 2026-10-05, when three things on it were found to be wrong:
//   - its search box filtered nothing (the filtered list was computed and
//     never rendered)
//   - its FAQ quoted a price ladder that does not exist: "Professional R999,
//     Business R2,499, Enterprise Custom"
//   - it promised "First 30 days free" and "Cancel anytime", where the Terms
//     require 30 days' written notice and a self-serve signup pays before it
//     goes live
// Prices now come from /api/products, like the landing page's.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { renderWithProviders } from '../test-utils'

const loadProducts = vi.fn()
vi.mock('../../src/config/plans', async (importOriginal) => ({
  ...(await importOriginal()),
  loadProducts: (...a) => loadProducts(...a),
}))

import Documentation from '../../src/pages/Documentation'

const PRODUCTS = [
  { key: 'ai_receptionist', label: 'AI Receptionist', price: 99, pitch: 'Every message gets answered in seconds.' },
  { key: 'ai_follow_up', label: 'AI Follow-up System', price: 499, pitch: 'Follows up until they buy or say no.' },
  { key: 'ai_sales_assistant', label: 'AI Sales Assistant', price: 999, pitch: 'It runs the whole conversation.' },
]

const renderDocs = () => renderWithProviders(<MemoryRouter><Documentation /></MemoryRouter>)
const openFaq = () => fireEvent.click(screen.getByRole('button', { name: /FAQ/ }))
const text = () => document.body.textContent

describe('Documentation', () => {
  beforeEach(() => { loadProducts.mockReset() })

  it('quotes the plans and prices the API serves', async () => {
    loadProducts.mockResolvedValue(PRODUCTS)
    renderDocs()
    openFaq()

    await waitFor(() => expect(text()).toMatch(/AI Receptionist, R99 a month/))
    expect(text()).toMatch(/AI Follow-up System, R499 a month/)
    expect(text()).toMatch(/AI Sales Assistant, R999 a month/)
  })

  it('never quotes the plans that do not exist', async () => {
    loadProducts.mockResolvedValue(PRODUCTS)
    renderDocs()
    openFaq()

    await waitFor(() => expect(text()).toMatch(/R99 a month/))
    expect(text()).not.toMatch(/R2,499|Professional:|Enterprise: Custom/)
  })

  it('names no price at all when the price list cannot load', async () => {
    loadProducts.mockRejectedValue(new Error('Price list unavailable'))
    renderDocs()
    openFaq()

    await waitFor(() => expect(text()).toMatch(/Current prices are shown when you sign up/))
    expect(text()).not.toMatch(/R\s?\d+\s*(a month|\/month)/)
  })

  it('promises no free trial, and says what cancelling actually takes', () => {
    loadProducts.mockResolvedValue(PRODUCTS)
    renderDocs()
    openFaq()

    expect(text()).not.toMatch(/days free|free trial/i)
    expect(text()).toMatch(/30 days' written notice/)
  })

  it('filters the section list as you type in the search box', () => {
    loadProducts.mockResolvedValue(PRODUCTS)
    renderDocs()
    expect(screen.getByRole('button', { name: /Getting Started/ })).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search documentation...'), { target: { value: 'faq' } })

    expect(screen.getByRole('button', { name: /FAQ/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Getting Started/ })).not.toBeInTheDocument()
  })

  it('says so when nothing matches the search', () => {
    loadProducts.mockResolvedValue(PRODUCTS)
    renderDocs()

    fireEvent.change(screen.getByPlaceholderText('Search documentation...'), { target: { value: 'zzz-nothing' } })

    expect(screen.getByText('No sections match.')).toBeInTheDocument()
  })
})
