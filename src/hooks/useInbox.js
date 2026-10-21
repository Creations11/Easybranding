// src/hooks/useInbox.js
//
// The WhatsApp API inbox's data (components/inbox/). The conversation list is
// the CRM's own query (useCrmLeads): every lead already carries who is waiting
// on us, whether we took over, and the last message. This file adds the one
// open conversation, and keeps it fresh.
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../api';

/** How often an open conversation asks for new messages. */
export const THREAD_REFRESH_MS = 8000;

/**
 * One conversation: the lead and its merged timeline. Polls while it is open
 * and the tab is visible, which is the whole difference from the old Chat
 * tab, where a customer's reply only appeared after you sent something.
 * Keyed under 'lead-detail' so LeadDetailModal's and the CRM's actions
 * refresh it too.
 */
export function useThread(leadId) {
  return useQuery({
    queryKey: ['lead-detail', 'timeline', leadId],
    queryFn: () => api.get(`/admin-ops/leads/${leadId}/timeline`).then((r) => r.data.data),
    enabled: !!leadId,
    refetchInterval: THREAD_REFRESH_MS,
    refetchIntervalInBackground: false,
  });
}

/** Send and take over: the same endpoints, and the same guards, as before. */
export function useInboxActions() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['lead-detail'] });
    qc.invalidateQueries({ queryKey: ['admin-ops'] });
  };
  return {
    // Resolves with the server's notice when it HELD the message (outside the
    // 24-hour window it nudges them with a template and sends this once they
    // reply), so the screen can say so instead of implying it arrived.
    send: async (leadId, message) => {
      const r = await api.post(`/admin-ops/leads/${leadId}/message`, { message });
      refresh();
      const d = r?.data?.data || {};
      return typeof d.held === 'boolean' ? (r.data.message || '') : '';
    },
    takeOver: async (leadId) => {
      await api.post(`/admin-ops/leads/${leadId}/takeover`, { reason: 'Chat' });
      refresh();
    },
  };
}

const REPLIES_KEY = 'wabos.savedReplies';
const readReplies = () => {
  try {
    const v = JSON.parse(localStorage.getItem(REPLIES_KEY) || '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()) : [];
  } catch { return []; }
};

/**
 * Saved replies: your own short answers, one tap into the message box (never
 * straight to the customer). Kept in this browser, so each person who uses
 * the dashboard has their own. Starts empty: what to say to a customer is
 * the owner's to write, not ours.
 */
export function useSavedReplies() {
  const [replies, setReplies] = useState(readReplies);
  const save = (next) => {
    setReplies(next);
    try { localStorage.setItem(REPLIES_KEY, JSON.stringify(next)); } catch { /* still works for this visit */ }
  };
  return {
    replies,
    add: (text) => { const t = text.trim(); if (t && !replies.includes(t)) save([...replies, t]); },
    remove: (text) => save(replies.filter((r) => r !== text)),
  };
}
