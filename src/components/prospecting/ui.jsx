// src/components/prospecting/ui.jsx
// The small pieces the Prospecting screens share, so the three of them look
// like one product: cards, pills, buttons, inputs, empty states.
import { c } from './helpers';

export function Card({ children, style, ...rest }) {
  return (
    <div {...rest} style={{ background: c.card, border: '1px solid ' + c.borderDim, borderRadius: 14, padding: 18, ...style }}>
      {children}
    </div>
  );
}

export function Pill({ text, tint = c.muted, title }) {
  return (
    <span title={title} style={{
      display: 'inline-block', fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999,
      background: tint + '1A', color: tint, border: '1px solid ' + tint + '33', whiteSpace: 'nowrap',
    }}>{text}</span>
  );
}

export function Button({ tone = 'primary', disabled, children, style, ...rest }) {
  const t = { primary: c.lime, quiet: c.muted, danger: c.red, info: c.cyan }[tone] || c.lime;
  const solid = tone === 'primary';
  return (
    <button
      {...rest}
      disabled={disabled}
      style={{
        padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.45 : 1,
        background: solid ? t : t + '14', color: solid ? '#060806' : t,
        border: '1px solid ' + (solid ? t : t + '40'), ...style,
      }}
    >{children}</button>
  );
}

export function Step({ n, title, hint, children, done }) {
  return (
    <Card style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: hint ? 4 : 12 }}>
        <span style={{
          width: 24, height: 24, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, background: done ? c.lime : c.lime + '1A', color: done ? '#060806' : c.lime,
        }}>{done ? '✓' : n}</span>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: c.text, margin: 0 }}>{title}</h3>
      </div>
      {hint && <p style={{ color: c.muted, fontSize: 12, margin: '0 0 12px 34px' }}>{hint}</p>}
      {children}
    </Card>
  );
}

export function Empty({ icon = '📋', children }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 16px', color: c.muted, fontSize: 14, border: '1px dashed ' + c.borderDim, borderRadius: 14 }}>
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      {children}
    </div>
  );
}

export function Notice({ tone = 'ok', children }) {
  const t = tone === 'ok' ? c.emerald : tone === 'warn' ? c.amber : c.red;
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} style={{
      background: t + '12', border: '1px solid ' + t + '33', color: t, borderRadius: 10,
      padding: '10px 14px', fontSize: 13, marginBottom: 14, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere',
    }}>{children}</div>
  );
}
