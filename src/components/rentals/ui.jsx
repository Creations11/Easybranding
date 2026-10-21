import { colors as c } from '../../utils/theme';
import { btn } from './helpers';

export function Result({ result }) {
  if (!result) return null;
  return (
    <div role="status" style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 13, background: result.tone + '14', color: result.tone, border: '1px solid ' + result.tone + '33' }}>
      {result.text}
    </div>
  );
}

/**
 * The temporary password the API made, shown once. Staff give it to the
 * person; it is not stored anywhere this screen can show it again.
 */
export function TemporaryPassword({ who, password, onDone }) {
  return (
    <div role="status" style={{ marginTop: 10, padding: '10px 12px', borderRadius: 8, fontSize: 13, background: c.lime + '14', border: '1px solid ' + c.lime + '44', color: c.text }}>
      <div>Temporary password for {who}. Give it to them now: it is not shown again.</div>
      <code data-testid="temporary-password" style={{ display: 'inline-block', marginTop: 6, fontSize: 15, fontWeight: 700, color: c.lime, userSelect: 'all' }}>{password}</code>
      <div style={{ marginTop: 8 }}><button onClick={onDone} style={btn(c.muted, false)}>Done</button></div>
    </div>
  );
}
