'use client';

import React, { useState } from 'react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchTab: (tab: string) => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: any;
}

export default function AIAssistantDrawer({ isOpen, onClose, onSwitchTab }: AIAssistantDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your BeeVibe Operating System AI Assistant. How can I assist you with today\'s venue schedule, payment audits, or lead follow-ups?',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string, explicitTool?: string) => {
    const textToSend = (queryText || input).trim();
    if (!textToSend && !explicitTool) return;

    const userMsg: Message = { role: 'user', content: textToSend || `Run tool: ${explicitTool}` };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
      const res = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ query: textToSend, tool: explicitTool }),
      });

      if (res.ok) {
        const json = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: json.aiMessage || 'Data retrieved successfully.',
            data: json.data,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Unable to retrieve records. Please ensure your admin session is active.' },
        ]);
      }
    } catch (err) {
      console.error('Assistant error:', err);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Connection error while communicating with business engine.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'flex-end',
        background: 'rgba(0, 0, 0, 0.35)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        style={{
          width: '460px',
          maxWidth: '92vw',
          height: '100%',
          background: '#ffffff',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* DRAWER HEADER */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🤖</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.01em' }}>
                BeeVibe Copilot
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Authorised Business Data Assistant
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '1.3rem',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        {/* QUICK TOOL CHIPS */}
        <div
          style={{
            padding: '12px 18px',
            background: '#f8fafc',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => handleSend('Daily Briefing', 'daily_briefing')}
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            📊 Today's Schedule
          </button>
          <button
            onClick={() => handleSend('Audit Payments', 'payment_audit')}
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            💳 Pending Balances
          </button>
          <button
            onClick={() => handleSend('Triage Leads', 'lead_triage')}
            style={{
              whiteSpace: 'nowrap',
              padding: '6px 12px',
              borderRadius: '9999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            🎯 High-Intent Leads
          </button>
        </div>

        {/* CHAT MESSAGES BODY */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {messages.map((m, idx) => (
            <div
              key={idx}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '88%',
                background: m.role === 'user' ? '#1e293b' : '#f8fafc',
                color: m.role === 'user' ? '#ffffff' : '#1e293b',
                padding: '12px 16px',
                borderRadius: '16px',
                border: m.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                fontSize: '0.86rem',
                lineHeight: '1.45',
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />

              {/* Structured Tool Data Cards */}
              {m.data?.todaySchedule && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {m.data.todaySchedule.map((s: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        background: '#ffffff',
                        padding: '8px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        fontSize: '0.78rem',
                      }}
                    >
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{s.customerName}</div>
                      <div style={{ color: '#64748b' }}>{s.room} • {s.timeSlot}</div>
                      <div style={{ color: s.balanceCollected ? '#16a34a' : '#d97706', fontWeight: 600 }}>
                        {s.balanceCollected ? 'Balance Settled' : `₹${s.balanceDue} Due`}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: '16px',
                fontSize: '0.82rem',
                color: '#64748b',
              }}
            >
              Querying authorized business tools...
            </div>
          )}
        </div>

        {/* INPUT BAR */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{
            padding: '16px 20px',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            gap: '10px',
            background: '#ffffff',
          }}
        >
          <input
            type="text"
            placeholder="Ask about revenue, check-ins, leads..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: '9999px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '10px 18px',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
