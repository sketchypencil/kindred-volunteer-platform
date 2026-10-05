import React, { useState } from 'react';
import type { VolunteerEvent } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { VerificationQueue } from './VerificationQueue';
import { AttendanceRoster } from './AttendanceRoster';
import { QRScannerModal } from './QRScannerModal';
import { BroadcastModal } from './BroadcastModal';
import {
  Users,
  Calendar,
  ShieldCheck,
  Clock,
  Plus,
  Radio,
  QrCode,
  CheckCircle,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenCreateEvent: () => void;
  onSelectEvent: (event: VolunteerEvent) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onOpenCreateEvent,
  onSelectEvent,
}) => {
  const { events, signups, users, markEventStatus, announcements } = useVolunteer();

  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'verification' | 'roster' | 'events' | 'broadcast'>('verification');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const pendingApprovalsCount = signups.filter((s) => s.status === 'pending_approval').length;
  const totalServiceHours = users.reduce((acc, u) => acc + u.totalHoursLogged, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Admin KPI Metrics Bar */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-val">{events.length}</div>
            <div className="stat-lbl">Active Events Scheduled</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--amber-50)', color: 'var(--amber-600)' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="stat-val">{pendingApprovalsCount}</div>
            <div className="stat-lbl">Pending Verifications</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--emerald-50)', color: 'var(--emerald-600)' }}>
            <Users size={24} />
          </div>
          <div>
            <div className="stat-val">{signups.length}</div>
            <div className="stat-lbl">Total Shift Sign-Ups</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{totalServiceHours} hrs</div>
            <div className="stat-lbl">Community Hours Logged</div>
          </div>
        </div>
      </div>

      {/* Quick Action Bar for Event Day Operations */}
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
            Event Coordinator Control Panel
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Manage attendance verification, mobile barcode check-ins, and broadcast urgent updates.
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsScannerOpen(true)}
          >
            <QrCode size={16} />
            Launch QR Check-In Scanner
          </button>

          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => setIsBroadcastOpen(true)}
          >
            <Radio size={16} />
            Broadcast Alert
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenCreateEvent}
          >
            <Plus size={16} />
            New Event
          </button>
        </div>
      </div>

      {/* Subtabs inside Admin Portal */}
      <div className="filter-bar" style={{ marginBottom: '0.5rem' }}>
        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${activeAdminSubTab === 'verification' ? 'active' : ''}`}
            onClick={() => setActiveAdminSubTab('verification')}
          >
            Verification Queue ({pendingApprovalsCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeAdminSubTab === 'roster' ? 'active' : ''}`}
            onClick={() => setActiveAdminSubTab('roster')}
          >
            Attendance & CSV Rosters
          </button>
          <button
            type="button"
            className={`filter-pill ${activeAdminSubTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveAdminSubTab('events')}
          >
            Event Status & Certificate Unlocks ({events.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${activeAdminSubTab === 'broadcast' ? 'active' : ''}`}
            onClick={() => setActiveAdminSubTab('broadcast')}
          >
            Broadcast Alerts Feed ({announcements.length})
          </button>
        </div>
      </div>

      {/* Admin Content Area */}
      {activeAdminSubTab === 'verification' && <VerificationQueue />}

      {activeAdminSubTab === 'roster' && <AttendanceRoster />}

      {activeAdminSubTab === 'events' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="section-header">
            <div>
              <h3 className="section-title">Manage Event Lifecycle & Certificates</h3>
              <p className="section-subtitle">
                Marking an event as <strong>"Completed"</strong> automatically unlocks digital certificates of participation for attended volunteers.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {ev.title}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: ev.status === 'completed' ? 'var(--emerald-100)' : 'var(--primary-100)',
                        color: ev.status === 'completed' ? 'var(--emerald-800)' : 'var(--primary-800)',
                      }}
                    >
                      {ev.status.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--slate-600)' }}>
                    {ev.startDate} • {ev.location.name} • {ev.shifts.length} Shifts scheduled
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => onSelectEvent(ev)}
                  >
                    View Details
                  </button>

                  {ev.status === 'completed' ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => markEventStatus(ev.id, 'upcoming')}
                      title="Revert status to upcoming"
                    >
                      Re-open Event
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => markEventStatus(ev.id, 'completed')}
                    >
                      <CheckCircle size={14} />
                      Mark Completed (Unlock Certificates)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeAdminSubTab === 'broadcast' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="section-title">Broadcast Alerts History</h3>
              <p className="section-subtitle">
                History of urgent push notifications and emails delivered to volunteer rosters.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setIsBroadcastOpen(true)}
            >
              <Radio size={14} />
              + New Broadcast
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {announcements.map((anc) => (
              <div key={anc.id} className={`broadcast-card ${anc.urgency}`}>
                <div className="broadcast-header">
                  <div className="broadcast-title">
                    <span>{anc.title}</span>
                  </div>
                  <span className={`urgency-pill urgency-${anc.urgency}`}>
                    {anc.urgency}
                  </span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
                  {anc.message}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  <span>Event: {anc.eventTitle}</span>
                  <span>Sent by {anc.sentBy} • {new Date(anc.sentAt).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* QR Scanner Modal */}
      <QRScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />

      {/* Broadcast Modal */}
      <BroadcastModal isOpen={isBroadcastOpen} onClose={() => setIsBroadcastOpen(false)} />
    </div>
  );
};
