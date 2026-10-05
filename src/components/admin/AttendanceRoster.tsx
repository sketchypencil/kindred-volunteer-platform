import React, { useState } from 'react';
import type { SignupStatus } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { exportRosterToCsv } from '../../utils/csvExport';
import {
  Printer,
  Search,
  FileSpreadsheet,
} from 'lucide-react';

export const AttendanceRoster: React.FC = () => {
  const { events, signups, updateAttendanceStatus } = useVolunteer();
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const eventSignups = signups.filter((s) => s.eventId === selectedEvent?.id);

  const filteredSignups = eventSignups.filter((s) => {
    const matchesSearch =
      s.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.qrCodeToken.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'active'
        ? s.status === 'confirmed' || s.status === 'attended'
        : s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const attendedCount = eventSignups.filter((s) => s.status === 'attended').length;
  const confirmedCount = eventSignups.filter((s) => s.status === 'confirmed').length;
  const noShowCount = eventSignups.filter((s) => s.status === 'no_show').length;
  const waitlistCount = eventSignups.filter((s) => s.status === 'waitlisted').length;

  const handleExportCsv = () => {
    if (!selectedEvent) return;
    exportRosterToCsv(selectedEvent, filteredSignups);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Header & Event selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Attendance & Volunteer Rosters
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Track live check-in statuses, review emergency contact information, and download offline rosters.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{
              padding: '0.5rem 0.85rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              background: '#fff',
            }}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.startDate})
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleExportCsv}
            title="Download CSV for Excel / Google Sheets"
          >
            <FileSpreadsheet size={15} />
            Export CSV
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handlePrint}
            title="Print Attendance Check-In Sheet"
          >
            <Printer size={15} />
            Print Sheet
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1rem',
          background: '#fff',
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>TOTAL SIGNUPS</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
            {eventSignups.length}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--emerald-600)', fontWeight: 600 }}>ATTENDED (CHECKED IN)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--emerald-600)' }}>
            {attendedCount}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600 }}>REGISTERED / CONFIRMED</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-600)' }}>
            {confirmedCount}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--rose-600)', fontWeight: 600 }}>NO-SHOW</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--rose-600)' }}>
            {noShowCount}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--amber-600)', fontWeight: 600 }}>ON WAITLIST</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--amber-600)' }}>
            {waitlistCount}
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search volunteer name, email, or check-in token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'ALL' ? 'active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All Statuses
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'attended' ? 'active' : ''}`}
            onClick={() => setStatusFilter('attended')}
          >
            Attended ({attendedCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setStatusFilter('confirmed')}
          >
            Confirmed ({confirmedCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'no_show' ? 'active' : ''}`}
            onClick={() => setStatusFilter('no_show')}
          >
            No-Show ({noShowCount})
          </button>
          <button
            type="button"
            className={`filter-pill ${statusFilter === 'waitlisted' ? 'active' : ''}`}
            onClick={() => setStatusFilter('waitlisted')}
          >
            Waitlist ({waitlistCount})
          </button>
        </div>
      </div>

      {/* Roster Table Card */}
      <div className="admin-table-card">
        {filteredSignups.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--slate-400)' }}>
            No volunteers found matching your search and filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="roster-table">
              <thead>
                <tr>
                  <th>Volunteer Details</th>
                  <th>Shift & Date</th>
                  <th>Role</th>
                  <th>Emergency Contact</th>
                  <th>QR Token</th>
                  <th>Attendance Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredSignups.map((s) => {
                  const shift = selectedEvent?.shifts.find((sh) => sh.id === s.shiftId);
                  const role = shift?.roles.find((r) => r.id === s.roleId);

                  return (
                    <tr key={s.id}>
                      {/* Name & Contact */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {s.userName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {s.userEmail}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {s.userPhone}
                        </div>
                      </td>

                      {/* Shift */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>
                          {shift?.date}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {shift?.startTime} – {shift?.endTime}
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary-700)' }}>
                          {role?.name || 'General'}
                        </span>
                        {s.waitlistPosition && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--amber-700)', fontWeight: 600 }}>
                            Waitlist Pos #{s.waitlistPosition}
                          </div>
                        )}
                      </td>

                      {/* Emergency Contact */}
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--slate-800)' }}>
                          {s.emergencyContact.name} ({s.emergencyContact.relation})
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {s.emergencyContact.phone}
                        </div>
                      </td>

                      {/* QR Token */}
                      <td>
                        <span
                          style={{
                            fontFamily: 'var(--font-mono)',
                            fontSize: '0.75rem',
                            padding: '0.2rem 0.45rem',
                            backgroundColor: 'var(--slate-100)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        >
                          {s.qrCodeToken}
                        </span>
                      </td>

                      {/* Status Toggle Selector */}
                      <td>
                        <select
                          className={`status-select ${s.status}`}
                          value={s.status}
                          onChange={(e) =>
                            updateAttendanceStatus(s.id, e.target.value as SignupStatus)
                          }
                          title="Change volunteer attendance status"
                        >
                          <option value="confirmed">Registered / Confirmed</option>
                          <option value="attended">Attended (+Hours Logged)</option>
                          <option value="no_show">No-Show</option>
                          <option value="pending_approval">Pending Approval</option>
                          <option value="waitlisted">Waitlisted</option>
                          <option value="canceled">Canceled</option>
                        </select>
                        {s.checkedInAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                            Checked in: {new Date(s.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
