import { c } from './tokens';

/** The navigation on a desktop. */
export default function Sidebar({ navSections, section, setSection, user, signOut, sidebarOpen, setSidebarOpen }) {
  return (
    <div className="sidebar" style={{ width: sidebarOpen ? 220 : 64, minHeight: '100vh', background: c.sidebar, borderRight: '1px solid ' + c.borderDim, display: 'flex', flexDirection: 'column', position: 'fixed', top: 64, left: 0, bottom: 0, zIndex: 50, transition: 'width 0.2s ease', overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid ' + c.borderDim, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,' + c.lime + ',' + c.moss + ')', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>🌿</div>
        {sidebarOpen && <div><p style={{ fontSize: 13, fontWeight: 700, color: c.text }}>Easy Branding</p><p style={{ fontSize: 11, color: c.lime, fontWeight: 600 }}>AI</p></div>}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 16, padding: 4, flexShrink: 0 }}>{sidebarOpen ? '←' : '→'}</button>
      </div>
      <div style={{ padding: '12px 8px', flex: 1 }}>
        {navSections.map(nav => (
          <button key={nav.id} onClick={() => setSection(nav.id)} className="nav-item-hover" style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 8px', borderRadius: 10, border: 'none', cursor: 'pointer', background: section === nav.id ? 'rgba(184,240,64,0.12)' : 'transparent', color: section === nav.id ? c.lime : c.muted, fontSize: 14, fontWeight: section === nav.id ? 600 : 400, fontFamily: 'inherit', marginBottom: 2, textAlign: 'left' }}>
            <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>{nav.icon}</span>
            {sidebarOpen && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{nav.label}</span>}
            {sidebarOpen && nav.badge > 0 && <span style={{ background: c.amber, color: '#080A06', fontSize: 10, fontWeight: 800, padding: '2px 6px', borderRadius: 999 }}>{nav.badge}</span>}
          </button>
        ))}
      </div>
      <div style={{ padding: '12px 16px', borderTop: '1px solid ' + c.borderDim }}>
        {sidebarOpen ? (
          <>
            <p style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 2 }}>{user?.fullName || 'Ayanda'}</p>
            <p style={{ fontSize: 11, color: c.lime, marginBottom: 10 }}>{user?.role}</p>
            <button onClick={signOut} style={{ width: '100%', padding: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid ' + c.borderDim, color: c.muted, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>Sign Out</button>
          </>
        ) : <button onClick={signOut} style={{ width: '100%', padding: 8, background: 'none', border: 'none', color: c.muted, cursor: 'pointer', fontSize: 18 }}>↩</button>}
      </div>
    </div>
  );
}
