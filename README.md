# Easy Branding AI — Frontend

**React SPA** | Vite + React Router + Axios

Production URL: `https://easybranding.co.za`  
GitHub: `https://github.com/Creations11/Easybranding`

---

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Bundler | Vite |
| Routing | React Router v6 |
| HTTP | Axios |
| Deployment | Vercel |
| Domain | Domains.co.za |
| Email | Google Workspace |

---

## Project Structure

```
src/
├── components/
│   ├── ChatModal.jsx           # WhatsApp chat widget
│   ├── LeadDetailModal.jsx     # Full lead detail + operator controls
│   ├── Nav.jsx                 # Navigation (role-aware)
│   └── SuperAdminPanel.jsx     # Platform control plane (super_admin only)
│
├── pages/
│   ├── AdminDashboard.jsx      # Admin operations center
│   ├── AgentDashboard.jsx      # Agent workspace
│   ├── Dashboard.jsx           # Operations center (super_admin/admin)
│   ├── Home.jsx                # Landing page
│   ├── Login.jsx               # Authentication
│   ├── PendingApproval.jsx     # Borrower holding page
│   └── Register.jsx            # Registration + invite flow
│
├── api.js                      # Axios instance with auth interceptors
├── App.jsx                     # Router + route guards
└── main.jsx                    # Entry point
```

---

## Routing

```
/              → Home (public) | redirect to role home if logged in
/login         → Login (public) | redirect if logged in
/register      → Register (public) | supports ?invite=TOKEN
/dashboard     → Operations Center [super_admin, admin]
/admin         → Admin Dashboard [super_admin, admin]
/agent         → Agent Workspace [agent, admin, super_admin]
/pending       → Pending Approval [borrower]
```

### Role Redirects on Login

| Role | Redirects to |
|---|---|
| `super_admin` | `/admin` |
| `admin` | `/admin` |
| `agent` | `/agent` |
| `borrower` | `/pending` |

---

## Auth Storage

```js
localStorage.getItem('eb_token')  // JWT
localStorage.getItem('eb_user')   // { id, fullName, email, phone, role, tenantId }
```

---

## API Configuration

```js
// src/api.js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Auto-attaches Authorization: Bearer <token>
// Auto-redirects to /login on 401
```

---

## Environment Variables

```env
VITE_API_URL=https://equilibro-elite-loan-api.onrender.com/api
```

---

## Pages

### Home (`/`)
Landing page with organic SA hustle theme. Sections: Hero, How it works, Features, Dashboard preview, Pricing, CTA.

### Login (`/login`)
Two-panel layout. Left: brand story with feature highlights. Right: form with focus states and error handling. Role-based redirect after login.

### Register (`/register`)
Two-panel layout. Supports invite tokens via `?invite=TOKEN` URL parameter. Auto-validates invite, shows tenant name, blocks invalid invites.

### Dashboard (`/dashboard`)
Operations Center for admins. All leads list with status badges, full conversation history, takeover controls, manual messaging.

### Admin Dashboard (`/admin`)
Full operator control center. Tabs:
- **Overview** — recent activity
- **Active** — live conversations (click to open Lead Detail Modal)
- **Qualified** — qualified leads with assign button (click to open Lead Detail Modal)
- **Rejected** — rejected leads with rejection reason
- **Funnel** — stage pipeline visualization
- **Viewings** — viewing requests and schedules
- **Messages** — recent messages across all leads
- **Alerts** — stale (1hr) and abandoned (24hr) leads
- **Clients** — client management (super_admin only)
- **Users** — team management with role dropdown
- **Platform** — super_admin control plane

### Agent Dashboard (`/agent`)
Agent workspace. Tabs: Leads, Viewings, Takeover Queue, Alerts. Full conversation view with takeover/message/resume controls and viewing scheduler.

### Pending Approval (`/pending`)
Holding page for borrower role. Shows step-by-step approval progress. WhatsApp contact link.

---

## Key Components

### LeadDetailModal
Opens when clicking any lead in admin panels. Shows:
- Conversation tab — full WhatsApp history
- Details tab — all qualification data
- History tab — takeover audit trail

Controls:
- Take Over / Resume Bot
- Manual WhatsApp message input
- Schedule Viewing modal
- Close Lead
- Force Release (admin only)

### SuperAdminPanel
Platform-wide view visible only to `super_admin`. Sub-tabs:
- Overview — MRR, client counts, lead stats, user counts
- Tenants — all clients with revenue
- Users — all platform users across all tenants
- Health — API status, database connection, environment

### Nav
Role-aware navigation:
- `super_admin/admin` — Dashboard + Agent + Admin
- `agent` — Agent only
- `borrower` — nothing (redirected to /pending)
- Logged out — Sign In + Get Started

---

## Invite Flow

1. Admin generates invite link per tenant (Admin → Clients → 🔗 Invite)
2. Link format: `https://easybranding.co.za/register?invite=TOKEN`
3. Register page validates token, shows tenant name
4. User registers → auto-linked to tenant in DB
5. Admin approves → sets role → user logs in with correct tenant scope

---

## Role Visibility Rules

| Feature | super_admin | admin | agent |
|---|---|---|---|
| Dashboard link | ✅ | ❌ | ❌ |
| Agent link | ✅ | ✅ | ✅ |
| Admin link | ✅ | ✅ | ❌ |
| Clients tab | ✅ | ❌ | ❌ |
| Platform tab | ✅ | ❌ | ❌ |
| MRR stats | ✅ | ❌ | ❌ |
| All users | ✅ | Tenant only | ❌ |

---

## Design System

| Token | Value |
|---|---|
| Background | `#080A06` |
| Surface | `#0E110B` |
| Card | `#141810` |
| Lime (primary) | `#B8F040` |
| Earth (accent) | `#C4873A` |
| Moss (secondary) | `#4A6741` |
| Text | `#EEF0E8` |
| Muted | `#8A9080` |
| Font | Outfit + Fraunces |

Theme: **Machines working with organic matter** — South African hustle energy, warm and alive.

---

## Development

```bash
npm install
npm run dev     # Vite dev server
npm run build   # Production build
```

---

## Deployment

Auto-deploys on push to `main` via Vercel.

```bash
git add .
git commit -m "description"
git push
```

DNS managed at Domains.co.za. Vercel handles SSL automatically.

---

## Known Coordination Rules

- **Never modify `App.jsx`** beyond imports and route definitions
- **All page logic goes in `/pages/`** — never in App.jsx
- **All reusable components go in `/components/`**
- **Always read `res.data.data.*`** — backend wraps in `{ success, message, data, timestamp }`
- **Never hardcode API URL** — always use `import.meta.env.VITE_API_URL`
- **Coordinate with Backend Division** before adding new API calls

