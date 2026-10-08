// Prospecting, rebuilt on Meta-approved templates (2026-10-08).
//
// What must hold: only templates the API reports as approved for the sales
// number are offered, and an unsendable one cannot be picked; each blank is
// filled per contact (the preview shows exactly that); nothing is sent without
// a confirmation that says what goes to whom; people messaged this week are
// held back unless "send again" is ticked; and the result says who was sent,
// skipped and why, and what failed.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../test-utils'
import api from '../../src/api'
import ProspectingPanel from '../../src/components/ProspectingPanel'

vi.mock('../../src/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn(), defaults: { baseURL: '' } },
}))
vi.mock('../../src/components/CampaignReport', () => ({ default: () => <div>campaigns</div> }))

const INTRO = {
  name: 'easy_branding_intro_hx3eca', label: 'easy branding intro', category: 'MARKETING', language: 'en',
  parameterFormat: 'POSITIONAL', header: null, body: 'Hi {{1}}, we help {{2}} answer every enquiry.', footer: null,
  buttons: [], variables: { header: [], body: ['1', '2'] }, urlButtons: [], sendable: true, reason: null,
}
const CAROUSEL = { ...INTRO, name: 'wabos_ladder_v3', label: 'wabos ladder v3', body: 'Hi {{1}}', variables: { header: [], body: ['1'] }, sendable: false, reason: 'A carousel needs a picture for every card, which this screen does not send.' }
const INVOICE = { ...INTRO, name: 'client_invoice_due', label: 'client invoice due', category: 'UTILITY', body: 'Invoice {{1}} is due.', variables: { header: [], body: ['1'] } }

const PROSPECTS = [
  { _id: 'p1', phone: '+27821110001', name: 'Thabo', agencyName: "Thabo's Cuts", status: 'pending' },
  { _id: 'p2', phone: '+27821110002', name: 'Unknown', agencyName: null, status: 'pending' },
  { _id: 'p3', phone: '+27821110003', name: 'Naledi', status: 'sent', sentAt: new Date(Date.now() - 2 * 86400e3).toISOString(), deliveryStatus: 'delivered' },
  { _id: 'p4', phone: '+27821110004', name: 'Kagiso', status: 'sent', sentAt: new Date(Date.now() - 9 * 86400e3).toISOString(), deliveryStatus: 'failed', deliveryError: '131049 healthy ecosystem engagement' },
]

const ok = (data) => Promise.resolve({ data: { success: true, data } })
const serve = ({ prospects = PROSPECTS, templates = [INTRO, CAROUSEL, INVOICE] } = {}) =>
  api.get.mockImplementation((url) => {
    if (url === '/prospecting') return ok({ prospects, stats: {} })
    if (url === '/prospecting/templates') return ok({ sender: { number: '+27 65 331 8266', name: 'EasyBranding', quality: 'GREEN' }, templates })
    return Promise.reject(new Error(`unmocked ${url}`))
  })

const openSend = async () => {
  renderWithProviders(<ProspectingPanel currentUser={{ id: 'u1', role: 'super_admin' }} />)
  return screen.findByText('Choose a message')
}

describe('ProspectingPanel', () => {
  beforeEach(() => { vi.clearAllMocks(); serve() })
  afterEach(() => vi.restoreAllMocks())

  it('offers the approved marketing templates, explains the unsendable, and hides utility unless asked', async () => {
    await openSend()
    expect(await screen.findByText('easy branding intro')).toBeInTheDocument()
    expect(screen.getByText(/carousel needs a picture/)).toBeInTheDocument()
    expect(screen.queryByText('client invoice due')).toBeNull()
    fireEvent.click(screen.getByLabelText(/Also show utility templates/))
    expect(screen.getByText('client invoice due')).toBeInTheDocument()
    expect(screen.getByText(/\+27 65 331 8266/, { selector: 'strong' })).toBeInTheDocument()
  })

  it('fills each blank per contact in the preview, and sends only after a confirmation that says what goes to whom', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    api.post.mockReturnValue(ok({ template: INTRO.name, sent: [{ id: 'p1', name: 'Thabo' }], skipped: [{ id: 'p2', name: '+27821110002', reason: 'They asked us to stop (STOP).' }], failed: [] }))
    await openSend()
    fireEvent.click(await screen.findByText('easy branding intro'))

    // The example contact until someone is chosen.
    expect(screen.getByTestId('message-preview')).toHaveTextContent("Hi Thabo, we help Thabo's Cuts answer every enquiry.")
    fireEvent.click(screen.getByLabelText('Choose Thabo'))
    fireEvent.click(screen.getByLabelText('Choose +27821110002'))

    fireEvent.click(screen.getByText('Review and send to 2'))
    expect(api.post).not.toHaveBeenCalled()
    expect(confirm.mock.calls[0][0]).toMatch(/Send "easy branding intro" to 2 contacts from \+27 65 331 8266\?/)
    expect(confirm.mock.calls[0][0]).toMatch(/Thabo will read:\n"Hi Thabo, we help Thabo's Cuts/)

    fireEvent.click(screen.getByText('Review and send to 2'))
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/prospecting/send', {
      prospectIds: ['p1', 'p2'],
      templateName: INTRO.name,
      mapping: { header: {}, body: { 1: { source: 'name', text: 'there' }, 2: { source: 'business', text: 'your business' } } },
      buttonValues: {},
      sendAgain: false,
    }))
    expect(await screen.findByText(/Meta accepted 1\. 1 skipped\./)).toBeInTheDocument()
    expect(screen.getByText(/They asked us to stop/)).toBeInTheDocument()
  })

  it('holds back anyone messaged this week unless "send again" is ticked', async () => {
    await openSend()
    fireEvent.click(await screen.findByText('easy branding intro'))
    fireEvent.click(screen.getByText('Everyone'))
    expect(screen.getByLabelText('Choose Naledi')).toBeDisabled()
    expect(screen.getByLabelText('Choose Kagiso')).not.toBeDisabled()
    fireEvent.click(screen.getByLabelText(/Send again to people messaged/))
    expect(screen.getByLabelText('Choose Naledi')).not.toBeDisabled()
  })

  it('lets a blank be typed text, and will not send while it is empty', async () => {
    await openSend()
    fireEvent.click(await screen.findByText('easy branding intro'))
    fireEvent.change(screen.getByLabelText('Fill {{2}} from'), { target: { value: 'text' } })
    fireEvent.click(screen.getByLabelText('Choose Thabo'))
    expect(screen.getByText('Review and send to 1')).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Text for everyone for {{2}}'), { target: { value: 'your salon' } })
    expect(screen.getByText('Review and send to 1')).not.toBeDisabled()
    expect(screen.getByTestId('message-preview')).toHaveTextContent('we help your salon answer')
  })

  it('says why when Meta cannot be read, instead of an empty list', async () => {
    api.get.mockImplementation((url) => (url === '/prospecting/templates'
      ? Promise.reject(Object.assign(new Error('x'), { response: { data: { message: 'Could not read the approved templates from Meta: token expired' } } }))
      : ok({ prospects: PROSPECTS, stats: {} })))
    renderWithProviders(<ProspectingPanel currentUser={{ id: 'u1', role: 'super_admin' }} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('token expired')
  })

  it("shows Meta's verdict on each contact, including a decline", async () => {
    renderWithProviders(<ProspectingPanel currentUser={{ id: 'u1', role: 'super_admin' }} />)
    fireEvent.click(await screen.findByRole('tab', { name: /Contacts/ }))
    const kagiso = await screen.findByTestId('contact-p4')
    expect(within(kagiso).getByText('declined by Meta')).toBeInTheDocument()
    expect(within(kagiso).getByText(/131049/)).toBeInTheDocument()
    expect(within(screen.getByTestId('contact-p3')).getByText('delivered')).toBeInTheDocument()
  })

  it('starts on Add contacts when there are none yet', async () => {
    serve({ prospects: [] })
    renderWithProviders(<ProspectingPanel currentUser={{ id: 'u1', role: 'super_admin' }} />)
    expect(await screen.findByText('Add one contact')).toBeInTheDocument()
  })
})
