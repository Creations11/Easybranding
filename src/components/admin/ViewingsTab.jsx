import { colors } from '../../utils/theme';

export default function ViewingsTab({ viewingRequests, setLeadDetailId }) {
  return (
    <div>
      <h2 style={{ marginBottom: '20px', fontSize: '20px' }}>Viewing Requests ({viewingRequests.length})</h2>
      {viewingRequests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.muted }}>
          <p style={{ fontSize: '40px', marginBottom: '16px' }}>📅</p>
          <p>No viewing requests yet.</p>
        </div>
      ) : viewingRequests.map(v => (
        <div key={v._id} onClick={() => setLeadDetailId(v._id)} style={{ background: colors.card, border: `1px solid ${colors.borderDim}`, borderRadius: '14px', padding: '18px 24px', marginBottom: '10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: '15px' }}>{v.name !== 'Unknown' ? v.name : v.phone}</strong>
            <p style={{ color: colors.muted, fontSize: '13px', marginTop: '2px' }}>{v.phone}</p>
            {v.propertyAddress && <p style={{ color: colors.muted, fontSize: '12px' }}>📍 {v.propertyAddress}</p>}
          </div>
          <div style={{ textAlign: 'right' }}>
            {v.viewingScheduledAt ? (
              <>
                <p style={{ color: colors.lime, fontWeight: '700' }}>{new Date(v.viewingScheduledAt).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                <p style={{ color: colors.muted, fontSize: '12px' }}>{new Date(v.viewingScheduledAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
              </>
            ) : (
              <span style={{ fontSize: '12px', color: '#fbbf24' }}>Pending schedule</span>
            )}
            <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(52,211,153,0.15)', color: '#34d399', display: 'block', marginTop: '4px' }}>
              {v.viewingStatus || 'requested'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
