// src/components/QuestionEditor.jsx
//
// NEW (28 June 2026): the real, long-term fix for a class of bug
// found this week — a "what's your contact number" question
// accepted a single digit ("5") as a valid answer because there was
// no way to declare what TYPE of answer a question expects, and no
// UI anywhere to set one. tenantWorkflowService.js can now validate
// phone/email/number answers properly, but it needs an explicit
// `type` field to act on with full confidence — this is where that
// field gets set, deliberately, at question-creation time, instead
// of being guessed at afterward from the question's wording.
//
// Renders a list of questions (key/label/ask/type), each editable,
// with add/remove. Parent component (ClientModal) owns the actual
// array in state and passes it down via value/onChange, same
// controlled-component pattern as a plain <input>.
import { useState } from 'react';

const c = {
  card: '#121710', lime: '#B8F040', cyan: '#22d3ee',
  amber: '#fbbf24', red: '#f87171', text: '#EEF0E8',
  muted: '#8A9080', borderDim: 'rgba(255,255,255,0.06)',
};

const QUESTION_TYPES = [
  { value: '',       label: 'Free text (any answer accepted)' },
  { value: 'phone',  label: '📞 Phone number — validated, re-asks if invalid' },
  { value: 'email',  label: '✉️ Email address' },
  { value: 'number', label: '🔢 Number (budget, income, quantity, etc.)' },
];

const blankQuestion = () => ({
  key: '',
  label: '',
  ask: '',
  type: '',
});

export default function QuestionEditor({ questions, onChange }) {
  const list = Array.isArray(questions) ? questions : [];
  const [expandedIndex, setExpandedIndex] = useState(null);

  const updateQuestion = (index, field, value) => {
    const next = list.map((q, i) => (i === index ? { ...q, [field]: value } : q));
    onChange(next);
  };

  const addQuestion = () => {
    onChange([...list, blankQuestion()]);
    setExpandedIndex(list.length); // auto-expand the new one
  };

  const removeQuestion = (index) => {
    if (!window.confirm('Remove this question? This cannot be undone after saving.')) return;
    onChange(list.filter((_, i) => i !== index));
    setExpandedIndex(null);
  };

  const moveQuestion = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= list.length) return;
    const next = [...list];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    onChange(next);
  };

  const iStyle = {
    width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)',
    border: `1px solid ${c.borderDim}`, borderRadius: '8px', color: c.text,
    fontSize: '13px', outline: 'none', fontFamily: 'inherit', marginBottom: '8px',
  };

  return (
    <div>
      <p style={{ color: c.muted, fontSize: '12px', marginBottom: '14px', lineHeight: 1.5 }}>
        Each question your bot asks during qualification. Set a <strong style={{ color: c.text }}>type</strong> on
        any question collecting a phone number, email, or number — the bot will validate the
        answer and re-ask if it doesn't look right, instead of silently accepting anything.
      </p>

      {list.length === 0 && (
        <p style={{ color: c.muted, fontSize: '13px', textAlign: 'center', padding: '20px 0', fontStyle: 'italic' }}>
          No custom questions yet. Add one below, or leave empty to use the default questions for this industry.
        </p>
      )}

      {list.map((q, i) => {
        const isExpanded = expandedIndex === i;
        const hasTypeWarning = !q.type && /phone|contact|cell|mobile|email|budget|income/i.test(
          [q.key, q.label, q.ask].filter(Boolean).join(' ')
        );

        return (
          <div
            key={i}
            style={{
              background: c.card,
              border: `1px solid ${hasTypeWarning ? c.amber + '55' : c.borderDim}`,
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '8px',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
            >
              <span style={{ color: c.muted, fontSize: '12px', fontFamily: 'monospace', flexShrink: 0 }}>
                Q{i + 1}
              </span>
              <span style={{ color: c.text, fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {q.ask || q.label || q.key || '(untitled question)'}
              </span>
              {q.type && (
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${c.cyan}18`, color: c.cyan, flexShrink: 0 }}>
                  {QUESTION_TYPES.find(t => t.value === q.type)?.label.split(' ')[0] || q.type}
                </span>
              )}
              {hasTypeWarning && (
                <span title="This question mentions phone/email/number but has no type set" style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: `${c.amber}18`, color: c.amber, flexShrink: 0 }}>
                  ⚠️ no type set
                </span>
              )}
              <span style={{ color: c.muted, fontSize: '12px', flexShrink: 0 }}>{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${c.borderDim}` }}>
                <label style={{ color: c.muted, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  Field key (no spaces — e.g. "contactNumber")
                </label>
                <input
                  value={q.key}
                  onChange={e => updateQuestion(i, 'key', e.target.value.replace(/\s+/g, ''))}
                  placeholder="contactNumber"
                  style={iStyle}
                />

                <label style={{ color: c.muted, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  Label (short internal name)
                </label>
                <input
                  value={q.label}
                  onChange={e => updateQuestion(i, 'label', e.target.value)}
                  placeholder="contact"
                  style={iStyle}
                />

                <label style={{ color: c.muted, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  Question text (what the bot actually asks)
                </label>
                <textarea
                  value={q.ask}
                  onChange={e => updateQuestion(i, 'ask', e.target.value)}
                  placeholder="What's the best number to reach you on?"
                  rows={2}
                  style={{ ...iStyle, resize: 'vertical', fontFamily: 'inherit' }}
                />

                <label style={{ color: c.muted, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                  Answer type — what should this question validate?
                </label>
                <select
                  value={q.type || ''}
                  onChange={e => updateQuestion(i, 'type', e.target.value)}
                  style={{ ...iStyle, cursor: 'pointer' }}
                >
                  {QUESTION_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>

                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button
                    onClick={() => moveQuestion(i, -1)}
                    disabled={i === 0}
                    style={{ padding: '6px 10px', background: 'transparent', border: `1px solid ${c.borderDim}`, color: i === 0 ? c.muted : c.text, borderRadius: '6px', cursor: i === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: i === 0 ? 0.4 : 1 }}
                  >
                    ↑ Move up
                  </button>
                  <button
                    onClick={() => moveQuestion(i, 1)}
                    disabled={i === list.length - 1}
                    style={{ padding: '6px 10px', background: 'transparent', border: `1px solid ${c.borderDim}`, color: i === list.length - 1 ? c.muted : c.text, borderRadius: '6px', cursor: i === list.length - 1 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: i === list.length - 1 ? 0.4 : 1 }}
                  >
                    ↓ Move down
                  </button>
                  <button
                    onClick={() => removeQuestion(i)}
                    style={{ padding: '6px 10px', background: `${c.red}18`, border: `1px solid ${c.red}33`, color: c.red, borderRadius: '6px', cursor: 'pointer', fontSize: '12px', marginLeft: 'auto' }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={addQuestion}
        style={{ width: '100%', padding: '11px', background: `${c.lime}12`, border: `1px solid ${c.lime}33`, color: c.lime, borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', marginTop: '6px' }}
      >
        + Add Question
      </button>
    </div>
  );
}