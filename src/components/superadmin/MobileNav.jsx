import { c } from './tokens';

/** The hamburger, its overlay and the drawer: the navigation on a phone. */
export default function MobileNav({ navSections, section, setSection, user, signOut, mobileMenuOpen, setMobileMenuOpen }) {
  return (
    <>
          {/* Mobile hamburger */}
          <button className="mobile-hamburger" onClick={() => setMobileMenuOpen(true)} style={{ display: 'none', position: 'fixed', top: 14, left: 12, zIndex: 200, width: 44, height: 44, borderRadius: 10, background: c.sidebar, border: '1px solid ' + c.borderDim, color: c.lime, fontSize: 20, cursor: 'pointer' }}>☰</button>

          {/* Mobile drawer overlay */}
          {mobileMenuOpen && <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 250 }} />}

          {/* Mobile drawer */}
          <div className="mobile-drawer" style={{ display: 'none', position: 'fixed', top: 0, left: 0, bottom: 0, width: 260, maxWidth: '80vw', background: c.sidebar, borderRight: '1px solid ' + c.borderDim, zIndex: 300, flexDirection: 'column', overflowY: 'auto', transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 0.25s ease' }}>
            <div style={{ padding: '20px 16px', borderBottom: '1px solid ' + c.borderDim, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,' + c.lime + ',' + c.moss + ')', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 }}>🌿</div>
              <div style={{ flex: 1 }}><p style={{ fontSize: 14, fontWeight: 700, color: c.text }}>Easy Branding</p><p style={{ fontSize: 11, color: c.lime, fontWeight: 600 }}>AI</p></div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: 'none', border: 'none', color: c.muted, fontSize: 24, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ padding: '12px 8px', flex: 1 }}>
              {navSections.map(nav => (
                <button key={nav.id} onClick={() => { setSection(nav.id); setMobileMenuOpen(false); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: section === nav.id ? 'rgba(184,240,64,0.12)' : 'transparent', color: section === nav.id ? c.lime : c.muted, fontSize: 15, fontWeight: section === nav.id ? 600 : 400, fontFamily: 'inherit', marginBottom: 2, textAlign: 'left' }}>
                  <span style={{ fontSize: 20, width: 26, textAlign: 'center' }}>{nav.icon}</span>
                  <span style={{ flex: 1 }}>{nav.label}</span>
                  {nav.badge > 0 && <span style={{ background: c.amber, color: '#080A06', fontSize: 11, fontWeight: 800, padding: '2px 7px', borderRadius: 999 }}>{nav.badge}</span>}
                </button>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: '1px solid ' + c.borderDim }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: c.text, marginBottom: 2 }}>{user?.fullName || 'Ayanda'}</p>
              <p style={{ fontSize: 12, color: c.lime, marginBottom: 12 }}>{user?.role}</p>
              <button onClick={signOut} style={{ width: '100%', padding: 11, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>Sign Out</button>
            </div>
          </div>
    </>
  );
}
