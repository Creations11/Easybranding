// The navigation on a desktop. "sidebar" is the class the page's own CSS
// hides on a phone (SuperAdminDashboard.jsx), so it stays.
const navItem = (on) => `nav-item-hover mb-0.5 flex min-h-[44px] w-full cursor-pointer items-center gap-2.5 rounded-[10px] px-2 text-left text-sm ${
  on ? 'bg-lime/12 font-semibold text-lime' : 'bg-transparent text-muted'
}`;

/** The navigation on a desktop. */
export default function Sidebar({ navSections, section, setSection, user, signOut, sidebarOpen, setSidebarOpen }) {
  return (
    <div className={`sidebar fixed top-16 bottom-0 left-0 z-50 flex min-h-screen flex-col overflow-x-hidden overflow-y-auto border-r border-edge bg-[#080B08] transition-[width] duration-200 ${sidebarOpen ? 'w-[220px]' : 'w-16'}`}>
      <div className="flex items-center gap-2.5 border-b border-edge px-4 pt-5 pb-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-lime to-moss text-base">🌿</div>
        {sidebarOpen && <div><p className="text-[13px] font-bold text-ink">Easy Branding</p><p className="text-[11px] font-semibold text-lime">AI</p></div>}
        <button type="button" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label={sidebarOpen ? 'Narrow the menu' : 'Widen the menu'}
          className="ml-auto min-h-[44px] min-w-8 shrink-0 cursor-pointer text-base text-muted">{sidebarOpen ? '←' : '→'}</button>
      </div>
      <div className="flex-1 px-2 py-3">
        {navSections.map(nav => (
          <button key={nav.id} type="button" onClick={() => setSection(nav.id)} className={navItem(section === nav.id)} title={sidebarOpen ? undefined : nav.label}>
            <span className="w-6 shrink-0 text-center text-lg">{nav.icon}</span>
            {sidebarOpen && <span className="flex-1 whitespace-nowrap">{nav.label}</span>}
            {sidebarOpen && nav.badge > 0 && <span className="rounded-full bg-amber px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[#080A06]">{nav.badge}</span>}
          </button>
        ))}
      </div>
      <div className="border-t border-edge px-4 py-3">
        {sidebarOpen ? (
          <>
            <p className="mb-0.5 text-[13px] font-semibold text-ink">{user?.fullName || 'Ayanda'}</p>
            <p className="mb-2.5 text-[11px] text-lime">{user?.role}</p>
            <button type="button" onClick={signOut}
              className="min-h-[44px] w-full cursor-pointer rounded-lg border border-edge bg-white/5 text-xs text-muted hover:bg-raise">Sign Out</button>
          </>
        ) : <button type="button" onClick={signOut} aria-label="Sign out" className="min-h-[44px] w-full cursor-pointer text-lg text-muted">↩</button>}
      </div>
    </div>
  );
}
