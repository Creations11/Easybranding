import api from '../../api';

// FIX: these used to be fetched with Promise.all — if the takeover
// history call 403'd (e.g. a closed lead left with a dangling
// ActiveTakeover record from the WhatsApp CLOSE command), the whole
// load() rejected and setLead() never ran, so the modal opened
// completely blank with no indication of what went wrong. Fetching
// independently means a failed history call just leaves that section
// empty instead of hiding the entire lead.
//
// A failed TIMELINE call throws, though: as a query (2026-10-05) that keeps
// whatever lead was already on screen after an action's reload fails, which
// is what the old code did by simply not setting anything.
export async function loadLeadDetail(leadId) {
  const [timelineResult, historyResult] = await Promise.allSettled([
    api.get(`/admin-ops/leads/${leadId}/timeline`),
    api.get(`/takeover/${leadId}/history`),
  ]);

  if (historyResult.status === 'rejected') {
    console.error('Takeover history load error', historyResult.reason);
  }
  if (timelineResult.status === 'rejected') {
    console.error('Lead timeline load error', timelineResult.reason);
    throw timelineResult.reason;
  }

  const d = timelineResult.value.data.data;
  return {
    lead: d?.lead ?? null,
    timeline: d?.timeline || [],
    // The merged view: conversation PLUS payments, invoices, takeovers and
    // admin actions, in one chronological list. Falls back to the
    // messages-only `timeline` when the API hasn't got `events` (older deploy).
    events: d?.events || null,
    takeoverHistory: historyResult.status === 'fulfilled'
      ? historyResult.value.data.data?.takeoverHistory || []
      : [],
  };
}
