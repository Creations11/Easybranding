// The navigation on a phone. "mobile-hamburger" and "mobile-drawer" are the
// classes the page's own CSS shows below 769px (SuperAdminDashboard.jsx).
// Hidden otherwise by an inline display:none, deliberately not a class: it is
// the element's state, not its look, and it must hold without a stylesheet,
// or the tests (which have none) and anything else reading the page see
// every menu item twice. The page's !important rules still win on a phone.

/** The hamburger, its overlay and the drawer: the navigation on a phone. */
export default function MobileNav({ navSections, section, setSection, user, signOut, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <>
      {/* Mobile hamburger */}
      <button type="button" style={{ display: 'none' }} className="mobile-hamburger fixed top-3.5 left-3 z-[200] h-11 w-11 cursor-pointer items-center justify-center rounded-[10px] border border-edge bg-[#080B08] text-xl text-lime"
        onClick={() => setMobileMenuOpen(true)} aria-label="Open the menu">☰</button>

      {/* Mobile drawer overlay */}
      {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-[250] bg-black/60" />}

      {/* Mobile drawer */}
      <div style={{ display: 'none' }} className={`mobile-drawer fixed top-0 bottom-0 left-0 z-[300] w-[260px] max-w-[80vw] flex-col overflow-y-auto border-r border-edge bg-[#080B08] transition-transform duration-[250ms] ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2.5 border-b border-edge px-4 py-5">
          <div className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-gradient-to-br from-lime to-moss text-[17px]">🌿</div>
          <div className="flex-1"><p className="text-sm font-bold text-ink">Easy Branding</p><p className="text-[11px] font-semibold text-lime">AI</p></div>
          <button type="button" onClick={() => setMobileMenuOpen(false)} aria-label="Close the menu" className="min-h-[44px] min-w-[44px] cursor-pointer text-2xl text-muted">×</button>
        </div>
        <div className="flex-1 px-2 py-3">
          {navSections.map(nav => (
            <button key={nav.id} type="button" onClick={() => { setSection(nav.id); setMobileMenuOpen(false); }}
              className={`mb-0.5 flex min-h-[48px] w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 text-left text-[15px] ${
                section === nav.id ? 'bg-lime/12 font-semibold text-lime' : 'bg-transparent text-muted'
              }`}>
              <span className="w-[26px] text-center text-xl">{nav.icon}</span>
              <span className="flex-1">{nav.label}</span>
              {nav.badge > 0 && <span className="rounded-full bg-amber px-[7px] py-0.5 font-mono text-[11px] font-extrabold text-[#080A06]">{nav.badge}</span>}
            </button>
          ))}
        </div>
        <div className="border-t border-edge p-4">
          <p className="mb-0.5 text-sm font-semibold text-ink">{user?.fullName || 'Ayanda'}</p>
          <p className="mb-3 text-xs text-lime">{user?.role}</p>
          <button type="button" onClick={signOut} className="min-h-[44px] w-full cursor-pointer rounded-lg border border-edge bg-white/5 text-sm text-muted">Sign Out</button>
        </div>
      </div>
    </>
  );
}
