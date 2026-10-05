import React, { useState } from 'react';
import type { Signup } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { QRCodePassModal } from './QRCodePassModal';
import { CertificateModal } from './CertificateModal';
import { BadgesGrid } from './BadgesGrid';
import { downloadICalFile, generateGoogleCalendarUrl } from '../../utils/calendarExport';
import {
  Clock,
  Calendar,
  Award,
  QrCode,
  Download,
  CheckCircle,
  ExternalLink,
  Shield,
  Trash2,
} from 'lucide-react';

export const VolunteerDashboard: React.FC = () => {
  const { currentUser, signups, events, cancelSignup } = useVolunteer();

  const [selectedPassSignup, setSelectedPassSignup] = useState<Signup | null>(null);
  const [selectedCertSignup, setSelectedCertSignup] = useState<Signup | null>(null);

  // Not logged in (or session cleared): show a friendly message instead of crashing
  if (!currentUser) {
    return (
      <div
        style={{
          background: '#fff',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          textAlign: 'center',
          color: 'var(--slate-500)',
        }}
      >
        <div style={{ fontWeight: 600 }}>Please log in to view your shifts and badges.</div>
      </div>
    );
  }

  // Safe versions of user fields. Older or partial user objects may be missing these.
  const emergency = currentUser.emergencyContact ?? { name: '', phone: '', relation: '' };
  const skills = Array.isArray(currentUser.skills) ? currentUser.skills : [];
  const badgeIds = Array.isArray(currentUser.badges) ? currentUser.badges : [];
  const totalHours = Number(currentUser.totalHoursLogged) || 0;

  // Filter signups for this volunteer
  const mySignups = signups.filter((s) => String(s.userId) === String(currentUser.id));

  const activeSignups = mySignups.filter(
    (s) =>
      s.status === 'confirmed' ||
      s.status === 'pending_approval' ||
      s.status === 'waitlisted'
  );

  const attendedSignups = mySignups.filter((s) => s.status === 'attended');

  const getShiftDetails = (signup: Signup) => {
    const event = events.find((e) => String(e.id) === String(signup.eventId));
    const shift = event?.shifts?.find((sh) => String(sh.id) === String(signup.shiftId));
    const role = shift?.roles?.find((r) => String(r.id) === String(signup.roleId));
    return { event, shift, role };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Profile Header */}
      <div className="volunteer-profile-header">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="profile-avatar-lg"
        />

        <div className="profile-info">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <h2 className="profile-name">{currentUser.name}</h2>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                backgroundColor: 'var(--primary-100)',
                color: 'var(--primary-800)',
                padding: '0.2rem 0.6rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              Verified Volunteer
            </span>
          </div>

          <div className="profile-email">
            {currentUser.email}
            {currentUser.phone ? ` • ${currentUser.phone}` : ''}
          </div>

          {currentUser.bio && (
            <p style={{ fontSize: '0.85rem', color: 'var(--slate-600)', marginBottom: '0.75rem' }}>
              {currentUser.bio}
            </p>
          )}

          {/* Emergency Contact & Skills */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Shield size={14} style={{ color: 'var(--rose-500)' }} />
              <span>
                <strong>Emergency:</strong>{' '}
                {emergency.name
                  ? `${emergency.name}${emergency.relation ? ` (${emergency.relation})` : ''}${
                      emergency.phone ? ` - ${emergency.phone}` : ''
                    }`
                  : 'Not provided'}
              </span>
            </div>

            <div className="skills-tags">
              {skills.map((skill, idx) => (
                <span key={idx} className="skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Impact Stats Tracker */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-50)', color: 'var(--primary-600)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-val">{totalHours}</div>
            <div className="stat-lbl">Verified Service Hours</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--emerald-50)', color: 'var(--emerald-600)' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-val">{attendedSignups.length}</div>
            <div className="stat-lbl">Completed Shifts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--amber-50)', color: 'var(--amber-600)' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-val">{activeSignups.length}</div>
            <div className="stat-lbl">Upcoming Shifts</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#b45309' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-val">{badgeIds.length}</div>
            <div className="stat-lbl">Earned Badges</div>
          </div>
        </div>
      </div>

      {/* Active & Upcoming Shifts */}
      <div>
        <div className="section-header">
          <div>
            <h3 className="section-title">
              <Calendar size={20} />
              My Upcoming Volunteer Shifts ({activeSignups.length})
            </h3>
            <p className="section-subtitle">
              Access your digital QR entry pass, synchronize shifts with your calendar, or manage registrations.
            </p>
          </div>
        </div>

        {activeSignups.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2.5rem',
              textAlign: 'center',
              color: 'var(--slate-500)',
            }}
          >
            <Calendar size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
            <div style={{ fontWeight: 600 }}>No upcoming shifts booked yet.</div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Head over to the <strong>Events Hub</strong> to explore available roles and sign up!
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {activeSignups.map((signup) => {
              const { event, shift, role } = getShiftDetails(signup);
              if (!event || !shift) return null;

              return (
                <div
                  key={signup.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem 1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.5rem',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor:
                            signup.status === 'confirmed'
                              ? 'var(--emerald-100)'
                              : signup.status === 'waitlisted'
                              ? 'var(--amber-100)'
                              : 'var(--primary-100)',
                          color:
                            signup.status === 'confirmed'
                              ? 'var(--emerald-800)'
                              : signup.status === 'waitlisted'
                              ? 'var(--amber-900)'
                              : 'var(--primary-800)',
                        }}
                      >
                        {signup.status === 'confirmed' && '✓ Confirmed'}
                        {signup.status === 'waitlisted' && `Waitlist Pos #${signup.waitlistPosition}`}
                        {signup.status === 'pending_approval' && 'Pending Verification'}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                        {event.category}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {event.title}
                    </h4>

                    <div style={{ fontSize: '0.875rem', color: 'var(--slate-700)', fontWeight: 600 }}>
                      Role: {role?.name || 'General Support'} • Shift: {shift.title}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={13} />
                        {shift.date}
                      </span>
                      <span>•</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={13} />
                        {shift.startTime} – {shift.endTime} ({shift.hours} hrs)
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {signup.status === 'confirmed' && (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedPassSignup(signup)}
                      >
                        <QrCode size={14} />
                        Mobile QR Pass
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => downloadICalFile(event, shift)}
                      title="Sync shift to iCal / Outlook"
                    >
                      <Download size={13} />
                      iCal
                    </button>

                    <a
                      href={generateGoogleCalendarUrl(event, shift)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Add to Google Calendar"
                    >
                      <ExternalLink size={13} />
                      Google Cal
                    </a>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => cancelSignup(signup.id)}
                      title="Cancel spot (Promotes next waitlisted volunteer!)"
                    >
                      <Trash2 size={13} />
                      Cancel
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Events & Official Certificate Generator */}
      <div>
        <div className="section-header">
          <div>
            <h3 className="section-title">
              <Award size={20} />
              Completed Service & Official Certificates ({attendedSignups.length})
            </h3>
            <p className="section-subtitle">
              Events where you completed verified attendance. Download your official Certificate of Participation.
            </p>
          </div>
        </div>

        {attendedSignups.length === 0 ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--slate-500)',
              fontSize: '0.875rem',
            }}
          >
            No completed shifts yet. As soon as an organizer marks you "Attended" at the venue, your certificate will appear here!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {attendedSignups.map((signup) => {
              const { event, shift, role } = getShiftDetails(signup);
              if (!event || !shift) return null;

              return (
                <div
                  key={signup.id}
                  style={{
                    background: '#fff',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'var(--emerald-100)', color: 'var(--emerald-800)', fontWeight: 700 }}>
                        ★ COMPLETED & VERIFIED
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
                        {shift.date}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.2rem' }}>
                      {event.title}
                    </h4>

                    <div style={{ fontSize: '0.85rem', color: 'var(--slate-600)' }}>
                      Role: <strong>{role?.name || 'Lead Volunteer'}</strong> • Credited:{' '}
                      <strong>+{shift.hours} hours</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => setSelectedCertSignup(signup)}
                  >
                    <Award size={14} />
                    Download Official Certificate
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gamification Badges */}
      <BadgesGrid userBadges={badgeIds} />

      {/* QR Code Pass Modal */}
      <QRCodePassModal
        signup={selectedPassSignup}
        isOpen={Boolean(selectedPassSignup)}
        onClose={() => setSelectedPassSignup(null)}
      />

      {/* Certificate Modal */}
      <CertificateModal
        signup={selectedCertSignup}
        isOpen={Boolean(selectedCertSignup)}
        onClose={() => setSelectedCertSignup(null)}
      />
    </div>
  );
};