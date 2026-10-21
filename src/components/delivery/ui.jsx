// The small pieces every section of the delivery tab is drawn with.
import { colors } from '../../utils/theme';

export const Chip = ({ text, tint }) => (
  <span style={{
    background: `${tint}1A`, color: tint, border: `1px solid ${tint}40`,
    borderRadius: '999px', padding: '2px 10px', fontSize: '11px', fontWeight: 600,
    whiteSpace: 'nowrap',
  }}>{text}</span>
);

export const Card = ({ children, onClick, active }) => {
  // Clickable cards are real buttons to the keyboard and to screen readers.
  // The target check keeps Enter on an inner link from also toggling the card.
  const key = onClick
    ? (e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
      }
    : undefined;
  return (
    <div
      onClick={onClick}
      onKeyDown={key}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-expanded={onClick ? !!active : undefined}
      style={{
        background: colors.card,
        border: `1px solid ${active ? colors.lime : colors.borderDim}`,
        borderRadius: '12px', padding: '14px', marginBottom: '10px',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >{children}</div>
  );
};

/** Says what is actually true, rather than "no data". */
export const Empty = ({ children }) => (
  <div style={{
    color: colors.muted, fontSize: '13px', padding: '28px 14px',
    textAlign: 'center', border: `1px dashed ${colors.borderDim}`, borderRadius: '12px',
  }}>{children}</div>
);

export const Row = ({ left, right }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', margin: '3px 0', fontSize: '13px' }}>
    <span style={{ color: colors.muted }}>{left}</span>
    <span style={{ color: colors.text, textAlign: 'right' }}>{right}</span>
  </div>
);

export const Said = ({ result }) => (result ? (
  <div role="status" style={{ color: result.tint, fontSize: '12px', marginTop: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result.text}</div>
) : null);

export const Field = ({ label, children }) => (
  <label style={{ display: 'grid', gap: '4px', fontSize: '12px', color: colors.muted }}>{label}{children}</label>
);
