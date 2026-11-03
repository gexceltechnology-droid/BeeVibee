'use client';

import React, { useState, useEffect } from 'react';
import type { Lead, LeadStage, LeadSource } from '@/lib/leads';

interface LeadHubProps {
  onConvertLeadToBooking?: (lead: Lead) => void;
}

export default function LeadHub({ onConvertLeadToBooking }: LeadHubProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  // New Lead Modal State
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadPhone, setNewLeadPhone] = useState('');
  const [newLeadEmail, setNewLeadEmail] = useState('');
  const [newLeadOccasion, setNewLeadOccasion] = useState('Birthday Celebration');
  const [newLeadDate, setNewLeadDate] = useState('');
  const [newLeadSource, setNewLeadSource] = useState<LeadSource>('WhatsApp');
  const [newLeadPackage, setNewLeadPackage] = useState('Royal Butterfly Room');
  const [newLeadNotes, setNewLeadNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Edit Lead Modal State
  const [isEditLeadModalOpen, setIsEditLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editOccasion, setEditOccasion] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editSlot, setEditSlot] = useState('');
  const [editGuests, setEditGuests] = useState('2');
  const [editPackage, setEditPackage] = useState('');
  const [editBudget, setEditBudget] = useState('');
  const [editSource, setEditSource] = useState<LeadSource>('WhatsApp');
  const [editStage, setEditStage] = useState<LeadStage>('new');
  const [editNotes, setEditNotes] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const STAGES: { id: LeadStage; title: string; color: string; bg: string }[] = [
    { id: 'new', title: 'New Inquiries', color: '#0284c7', bg: '#e0f2fe' },
    { id: 'contacted', title: 'Contacted', color: '#d97706', bg: '#fef3c7' },
    { id: 'qualified', title: 'Qualified', color: '#9333ea', bg: '#f3e8ff' },
    { id: 'visit_scheduled', title: 'Venue Visit', color: '#2563eb', bg: '#dbeafe' },
    { id: 'converted', title: 'Won / Booked', color: '#16a34a', bg: '#dcfce7' },
    { id: 'lost', title: 'Lost', color: '#64748b', bg: '#f1f5f9' },
  ];

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
      const res = await fetch('/api/leads', {
        headers: {
          'X-Admin-Passcode': activePasscode,
        },
      });
      if (res.ok) {
        const json = await res.json();
        setLeads(json.leads || []);
      }
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    // Optimistic UI update
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, stage: newStage } : l)));
    try {
      const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
      await fetch('/api/leads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id: leadId, stage: newStage }),
      });
    } catch (err) {
      console.error('Failed to update stage:', err);
      fetchLeads();
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadPhone.trim()) return;

    setSubmitting(true);
    try {
      const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          customerName: newLeadName || 'Inquiry Guest',
          phone: newLeadPhone,
          email: newLeadEmail || undefined,
          occasion: newLeadOccasion,
          preferredDate: newLeadDate || undefined,
          source: newLeadSource,
          packageInterest: newLeadPackage,
          notes: newLeadNotes || undefined,
        }),
      });

      if (res.ok) {
        setIsNewLeadModalOpen(false);
        setNewLeadName('');
        setNewLeadPhone('');
        setNewLeadEmail('');
        setNewLeadDate('');
        setNewLeadNotes('');
        fetchLeads();
      }
    } catch (err) {
      console.error('Error creating lead:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setEditName(lead.customerName || '');
    setEditPhone(lead.phone || '');
    setEditEmail(lead.email || '');
    setEditOccasion(lead.occasion || 'Birthday Celebration');
    setEditDate(lead.preferredDate || '');
    setEditSlot(lead.preferredTimeSlot || '');
    setEditGuests(String(lead.guestCount || 2));
    setEditPackage(lead.packageInterest || 'Royal Butterfly Room');
    setEditBudget(lead.budget ? String(lead.budget) : '');
    setEditSource(lead.source || 'WhatsApp');
    setEditStage(lead.stage || 'new');
    setEditNotes(Array.isArray(lead.notes) ? lead.notes.join('\n') : (lead.notes || ''));
    setIsEditLeadModalOpen(true);
  };

  const handleSaveEditLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setEditSubmitting(true);
    try {
      const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({
          id: editingLead.id,
          customerName: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim() || undefined,
          occasion: editOccasion.trim(),
          preferredDate: editDate || undefined,
          preferredTimeSlot: editSlot || undefined,
          guestCount: Number(editGuests) || 2,
          packageInterest: editPackage,
          budget: editBudget ? Number(editBudget) : undefined,
          source: editSource,
          stage: editStage,
          notes: editNotes.trim() ? editNotes.split('\n').map(n => n.trim()).filter(Boolean) : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === editingLead.id ? data.lead : l)));
        setIsEditLeadModalOpen(false);
        setEditingLead(null);
      } else {
        alert('Failed to update lead.');
      }
    } catch (err) {
      console.error('Error saving lead edits:', err);
      alert('Error updating lead.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteLead = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete the lead for "${name}"?`)) return;
    const activePasscode = (sessionStorage.getItem('bee_vibe_admin_passcode') || '').trim();
    try {
      const res = await fetch('/api/leads', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Passcode': activePasscode,
        },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      } else {
        alert('Failed to delete lead.');
      }
    } catch (err) {
      console.error('Error deleting lead:', err);
      alert('Error deleting lead.');
    }
  };

  const filteredLeads = leads.filter((l) => {
    const matchesSearch =
      l.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.phone.includes(searchTerm) ||
      (l.occasion && l.occasion.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStage = stageFilter === 'all' || l.stage === stageFilter;
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchesSearch && matchesStage && matchesSource;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* HEADER SECTION */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #f1f5f9',
          boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
            Unified Lead Hub & Conversion Pipeline
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Capture, classify, and convert event inquiries across WhatsApp, Website, and Walk-ins
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {/* Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: '#f1f5f9',
              borderRadius: '9999px',
              padding: '4px',
              gap: '4px',
            }}
          >
            <button
              onClick={() => setViewMode('kanban')}
              style={{
                border: 'none',
                background: viewMode === 'kanban' ? '#ffffff' : 'transparent',
                color: viewMode === 'kanban' ? '#1e293b' : '#64748b',
                fontWeight: viewMode === 'kanban' ? 700 : 500,
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '9999px',
                cursor: 'pointer',
                boxShadow: viewMode === 'kanban' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              📋 Kanban Pipeline
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                border: 'none',
                background: viewMode === 'table' ? '#ffffff' : 'transparent',
                color: viewMode === 'table' ? '#1e293b' : '#64748b',
                fontWeight: viewMode === 'table' ? 700 : 500,
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: '9999px',
                cursor: 'pointer',
                boxShadow: viewMode === 'table' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              📊 Table Register
            </button>
          </div>

          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            style={{
              background: '#1e293b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px 18px',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(30, 41, 59, 0.15)',
            }}
          >
            + New Lead
          </button>
        </div>
      </div>

      {/* FILTER & METRICS BAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search leads by name, phone, occasion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              padding: '9px 16px',
              borderRadius: '9999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '0.82rem',
              minWidth: '240px',
              outline: 'none',
            }}
          />

          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '0.8rem',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Stages</option>
            {STAGES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: '9999px',
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              fontSize: '0.8rem',
              color: '#475569',
              cursor: 'pointer',
            }}
          >
            <option value="all">All Sources</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Website">Website</option>
            <option value="Instagram">Instagram</option>
            <option value="Phone Call">Phone Call</option>
            <option value="Walk-in">Walk-in</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', fontSize: '0.82rem', color: '#64748b' }}>
          <span>Total: <strong>{leads.length}</strong></span>
          <span>•</span>
          <span>Filtered: <strong>{filteredLeads.length}</strong></span>
          <span>•</span>
          <span>Converted: <strong style={{ color: '#16a34a' }}>{leads.filter((l) => l.stage === 'converted').length}</strong></span>
        </div>
      </div>

      {/* KANBAN PIPELINE VIEW */}
      {viewMode === 'kanban' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            alignItems: 'start',
          }}
        >
          {STAGES.map((stage) => {
            const stageLeads = filteredLeads.filter((l) => l.stage === stage.id);
            return (
              <div
                key={stage.id}
                style={{
                  background: '#f8fafc',
                  borderRadius: '16px',
                  padding: '16px',
                  border: '1px solid #f1f5f9',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Stage Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '9999px',
                        background: stage.bg,
                        color: stage.color,
                        fontSize: '0.78rem',
                        fontWeight: 700,
                      }}
                    >
                      {stage.title}
                    </span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#64748b' }}>
                      {stageLeads.length}
                    </span>
                  </div>
                </div>

                {/* Lead Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {stageLeads.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>
                      No leads in this stage
                    </div>
                  )}

                  {stageLeads.map((lead) => (
                    <div
                      key={lead.id}
                      style={{
                        background: '#ffffff',
                        borderRadius: '12px',
                        padding: '14px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>
                            {lead.customerName}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            📞 +{lead.phone}
                          </div>
                        </div>

                        {/* Intent Pill */}
                        {lead.aiClassification && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              background:
                                lead.aiClassification.intent === 'high'
                                  ? '#dcfce7'
                                  : lead.aiClassification.intent === 'medium'
                                  ? '#fef3c7'
                                  : '#f1f5f9',
                              color:
                                lead.aiClassification.intent === 'high'
                                  ? '#15803d'
                                  : lead.aiClassification.intent === 'medium'
                                  ? '#b45309'
                                  : '#64748b',
                            }}
                          >
                            {lead.aiClassification.intent.toUpperCase()} INTENT
                          </span>
                        )}
                      </div>

                      {/* Occasion & Date */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '0.74rem' }}>
                        <span style={{ background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' }}>
                          🎉 {lead.occasion || 'Celebration'}
                        </span>
                        {lead.preferredDate && (
                          <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                            📅 {lead.preferredDate}
                          </span>
                        )}
                        <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: '4px' }}>
                          {lead.source}
                        </span>
                        {lead.budget && (
                          <span style={{ background: '#ecfdf5', color: '#047857', padding: '2px 6px', borderRadius: '4px' }}>
                            ₹{lead.budget}
                          </span>
                        )}
                      </div>

                      {/* AI Suggestion */}
                      {lead.aiClassification?.suggestedAction && (
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: '#475569',
                            background: '#faf5ff',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            borderLeft: '2px solid #a855f7',
                            marginTop: '2px',
                          }}
                        >
                          💡 {lead.aiClassification.suggestedAction}
                        </div>
                      )}

                      {/* Action Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', flexWrap: 'wrap', gap: '6px' }}>
                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="new">Move to: New</option>
                          <option value="contacted">Move to: Contacted</option>
                          <option value="qualified">Move to: Qualified</option>
                          <option value="visit_scheduled">Move to: Venue Visit</option>
                          <option value="converted">Move to: Converted</option>
                          <option value="lost">Move to: Lost</option>
                        </select>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenEditLead(lead)}
                            style={{
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              color: '#475569',
                              fontWeight: 600,
                            }}
                            title="Edit lead details"
                          >
                            ✏️ Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteLead(lead.id, lead.customerName)}
                            style={{
                              border: '1px solid #fecaca',
                              background: '#fef2f2',
                              borderRadius: '6px',
                              padding: '3px 8px',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              color: '#ef4444',
                            }}
                            title="Delete lead"
                          >
                            🗑️
                          </button>

                          <a
                            href={`https://wa.me/91${lead.phone.slice(-10)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: '0.75rem',
                              color: '#16a34a',
                              fontWeight: 600,
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <span>WhatsApp</span>
                            <span>↗</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: '20px',
            padding: '24px',
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.03)',
            overflowX: 'auto',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', color: '#64748b', fontSize: '0.75rem' }}>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Customer Details</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Occasion & Date</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Lead Source</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>AI Intent Classification</th>
                <th style={{ padding: '12px 14px', fontWeight: 600 }}>Pipeline Stage</th>
                <th style={{ padding: '12px 14px', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>{lead.customerName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>📱 +{lead.phone}</div>
                    {lead.email && <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>✉️ {lead.email}</div>}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <div style={{ fontWeight: 500, color: '#1e293b' }}>{lead.occasion || 'Celebration'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {lead.preferredDate ? `📅 ${lead.preferredDate}` : 'No date set'}
                    </div>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ padding: '3px 8px', borderRadius: '4px', background: '#f1f5f9', fontSize: '0.75rem', color: '#475569' }}>
                      {lead.source}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {lead.aiClassification && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background:
                            lead.aiClassification.intent === 'high'
                              ? '#dcfce7'
                              : lead.aiClassification.intent === 'medium'
                              ? '#fef3c7'
                              : '#f1f5f9',
                          color:
                            lead.aiClassification.intent === 'high'
                              ? '#15803d'
                              : lead.aiClassification.intent === 'medium'
                              ? '#b45309'
                              : '#64748b',
                        }}
                      >
                        {lead.aiClassification.intent.toUpperCase()} INTENT
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <select
                      value={lead.stage}
                      onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.78rem',
                        background: '#ffffff',
                        cursor: 'pointer',
                      }}
                    >
                      {STAGES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenEditLead(lead)}
                        style={{
                          border: '1px solid #cbd5e1',
                          background: '#f8fafc',
                          borderRadius: '6px',
                          padding: '4px 10px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          color: '#475569',
                          fontWeight: 600,
                        }}
                        title="Edit lead"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteLead(lead.id, lead.customerName)}
                        style={{
                          border: '1px solid #fecaca',
                          background: '#fef2f2',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          fontSize: '0.74rem',
                          cursor: 'pointer',
                          color: '#ef4444',
                        }}
                        title="Delete lead"
                      >
                        🗑️
                      </button>
                      <a
                        href={`https://wa.me/91${lead.phone.slice(-10)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none', fontSize: '0.8rem', marginLeft: '4px' }}
                      >
                        Chat ↗
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* NEW LEAD MODAL */}
      {isNewLeadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '480px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>Create New Lead</h2>
              <button
                onClick={() => setIsNewLeadModalOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Customer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={newLeadName}
                  onChange={(e) => setNewLeadName(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={newLeadPhone}
                  onChange={(e) => setNewLeadPhone(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="rahul@example.com"
                  value={newLeadEmail}
                  onChange={(e) => setNewLeadEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Occasion</label>
                  <select
                    value={newLeadOccasion}
                    onChange={(e) => setNewLeadOccasion(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                  >
                    <option value="Birthday Celebration">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Romantic Date">Romantic Date</option>
                    <option value="Farewell / Friends">Friends Hangout</option>
                    <option value="Gaming Night">Gaming Night</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Lead Source</label>
                  <select
                    value={newLeadSource}
                    onChange={(e) => setNewLeadSource(e.target.value as any)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Walk-in">Walk-in</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Preferred Date</label>
                <input
                  type="date"
                  value={newLeadDate}
                  onChange={(e) => setNewLeadDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Inquiry Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add specific requirements (fog, cake, special requests)..."
                  value={newLeadNotes}
                  onChange={(e) => setNewLeadNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsNewLeadModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {submitting ? 'Saving...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LEAD MODAL */}
      {isEditLeadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '28px',
              maxWidth: '540px',
              width: '92%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                  ✏️ Edit Lead Details
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                  ID: {editingLead?.id}
                </div>
              </div>
              <button
                onClick={() => setIsEditLeadModalOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Occasion</label>
                  <input
                    type="text"
                    value={editOccasion}
                    onChange={(e) => setEditOccasion(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Pipeline Stage</label>
                  <select
                    value={editStage}
                    onChange={(e) => setEditStage(e.target.value as LeadStage)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Preferred Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Preferred Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 05:30 PM - 07:30 PM"
                    value={editSlot}
                    onChange={(e) => setEditSlot(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Guest Count</label>
                  <input
                    type="number"
                    min="1"
                    value={editGuests}
                    onChange={(e) => setEditGuests(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Budget (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Package Interest</label>
                  <input
                    type="text"
                    value={editPackage}
                    onChange={(e) => setEditPackage(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Lead Source</label>
                  <select
                    value={editSource}
                    onChange={(e) => setEditSource(e.target.value as any)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px', background: '#ffffff' }}
                  >
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Website">Website</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Walk-in">Walk-in</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b' }}>Inquiry Notes & Requests</label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '4px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsEditLeadModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#1e293b',
                    color: '#ffffff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
