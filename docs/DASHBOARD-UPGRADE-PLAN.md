# Dashboard — plan to make it world class

Written 27 July 2026, after fixing a bug that is the best argument for the
whole plan: 70 closed leads, 20 fetched, and 50 silently filed under "Other"
as though nobody had closed them. Nothing errored. Nothing looked wrong. The
board just quietly lied for weeks.

That is the theme. The dashboard's problem is not that it looks dated — it is
that **it does not tell you when it is wrong**, and it makes you hunt for what
should be handed to you.

---

## Where it actually stands

Honest read, having worked in it:

**Good already.** Real multi-tenant scoping, a genuine Kanban of lead states,
takeover from the browser, allocation of industry flows in one click, live
health polling. That is more than most agency dashboards have.

**The problems, in order of how much they cost you:**

1. **It shows state, not work.** You open it and see counts. It never says
   "these five need you today". Every prioritisation decision is yours to make
   by reading rows — which is exactly what this session's lead review had to do
   by hand, and found ~R2 146/month sitting uncollected.
2. **Silent truncation and silent staleness.** The pagination bug is one
   instance. Nothing on the page distinguishes "zero" from "not loaded" from
   "only the first 20".
3. **No money view.** Invoices, payments, MRR and who owes what are absent.
   The one number that decides whether a month was good is not on the screen.
4. **No conversation view.** You can take over a chat, but you cannot read the
   thread that led there without a query. The richest data in the system —
   what customers actually said — is invisible.
5. **Everything is one page.** SuperAdminDashboard.jsx carries every tab,
   inline styles and all. It works, but it resists change.

---

## Status

- **Phase 1 — done** (27 July 2026). Truncation badges, three distinct
  panel states, `DataFreshness` on Operations, and the count reconciliation
  asserted in `tests/integration/adminOpsCrossTenant.test.js` — including the
  case where `total` degrades into "length of this page", which is the original
  bug seen from the other side.
- **Phase 2 — action rail, money view and lead timeline done** (27 July 2026). The rail
  carries five signals including the unanswered-customer row, which shipped
  only after outbound recording was made complete enough to support it.
  Per-lead timeline done too; stale-state warnings are all that remain.
- **Phase 3 — not started.**

---

## Phase 1 — Make it honest (highest value, lowest risk)

Nothing here is cosmetic. Each item removes a way the board can mislead.

- **Never truncate silently.** Every list shows "showing 20 of 70" with a
  "load all" action, or fetches everything. If a column is capped, say so on
  the column.
- **Distinguish empty from failed from loading.** Three visibly different
  states per panel. Today a failed fetch and a genuinely empty column look
  identical.
- **Surface data age.** A quiet "updated 2 min ago" per panel, and a visible
  marker when a refetch fails, so a stale board cannot masquerade as a live one.
- **Reconcile the counts.** The overview stat and the column header for the
  same concept must come from one definition. They diverged once already and
  were unified server-side — assert it in a test rather than trusting it.

**Why first:** these are the failures that cost real money silently. A prettier
board that still lies is worse, because it is more convincing.

---

## Phase 2 — Make it a work queue, not a report

The shift: from *"here is everything"* to *"here is what needs you"*.

- **An action rail at the top.** ✅ Built — `services/owedWorkService.js`,
  `GET /admin-ops/owed-work`, `components/ActionRail.jsx`. Four signals ship:
  payments pending past the settle window, invoices past due, takeovers idle
  24h, and outbox sends that failed. Each row with a lead is one click into
  the thread.

  A fifth signal — **"customer waiting on a reply"** — shipped after the
  first four, once outbound recording was complete enough to support it. It
  was held back initially and that was the right call: it reads
  `Lead.messages`, and roughly two thirds of `queueMessage()` call sites never
  passed a `leadId`, so the rail would have reported "nobody answered" for
  conversations the bot handled. The fix was to close the gap, not lower the
  bar — the outbox now resolves a lead from the recipient number (exact match,
  tenant-scoped) and the direct-to-Twilio template sends record explicitly.

  **If you add a send path that reaches a customer, it must record on the
  lead.** Nothing will fail if you don't; the signal will just quietly start
  lying again.

  Still out: **"promise made with no follow-up"** ("I'll send that tomorrow")
  needs intent read out of message text — the sales agent's job, not a keyword
  match's, which would be wrong often enough to be noise. A work queue that
  cries wolf gets ignored, and the real rows get ignored with it.
- **Money on the screen.** ✅ Built — `services/moneyViewService.js`,
  `GET /admin-ops/money`, `components/MoneyPanel.jsx`. Collected this month,
  recurring, owed to us, and unconfirmed.

  Three judgements worth keeping: collected is bucketed by **`paidAt`, not
  `createdAt`** (a payment started on the 31st and confirmed on the 1st belongs
  to the month the money landed); the comparison is against **the same point**
  in the previous month, so an early-month figure isn't automatically a
  collapse; and **`pending` is never folded into collected**, however old it
  is — the moment money that may not exist joins a revenue figure, the figure
  stops being trustworthy. A failed load says so rather than rendering R0,
  which would be indistinguishable from a bad month.
- **Per-lead timeline.** ✅ Built — `services/leadTimelineService.js`, returned
  as `events` on `GET /admin-ops/leads/:id/timeline`, rendered in
  `LeadDetailModal`. Messages, payments, invoices, takeovers and admin actions
  merged chronologically; non-message events read as centred markers in the
  thread.

  Matching notes: payments and takeovers join on a real `leadId`; **invoices
  have no `leadId`**, so they join on `recipientPhone` + `tenantId`, exact
  match only — a widened guess would show one customer another's invoice.
  Every non-message source is best-effort: losing the payment history is bad,
  losing the whole conversation because one collection errored is worse.
  `events` was added ALONGSIDE `timeline` rather than replacing it, so a
  frontend deploy that lands before the backend still renders.
- **Stale-state warnings.** Takeovers open beyond 24h, agent circuit-breaker
  trips, flows unpublished on a paying tenant. All are knowable now and all
  currently reach you only as WhatsApp alerts, if at all.

---

## Phase 3 — Make it feel world class

Only once the above is true. Polish on an honest board compounds; polish on a
misleading one is lipstick.

- **Information design over decoration.** Severity encoded in form as well as
  colour — a chip, a rule, a weight — so what needs attention reads at a glance
  and survives a colourblind viewer and a bad phone screen.
- **Density with hierarchy.** Summary first, detail on demand. The board should
  answer "is today fine?" in two seconds and "why not?" in two clicks.
- **Real charts, few of them.** Leads per day by tenant, conversion by rung of
  the product ladder, revenue trend. Three good charts beat a wall of tiles.
- **Keyboard and mobile.** You run this business from a phone — the board
  should be usable there, not merely responsive.
- **Split the file.** SuperAdminDashboard.jsx becomes a route with panel
  components. Do this WITH the redesign, not as a separate refactor nobody
  schedules.

---

## What I would not do

- **A component library or design-system rewrite.** The styling is not the
  bottleneck; the missing information is.
- **Real-time sockets.** Polling with visible freshness is enough at three
  tenants and far less to maintain.
- **A build-your-own-report feature.** You do not need flexible reporting. You
  need five specific answers, fast.

---

## Suggested order

1. Phase 1 in one pass — it is small, and it stops the board misleading you.
2. The action rail and the money view. Those two change how you work daily.
3. The lead timeline.
4. Polish, and split the file while doing it.

Phase 1 is roughly a day. The action rail is the one worth building carefully,
because it is the piece that turns the dashboard from something you check into
something that tells you what to do.
