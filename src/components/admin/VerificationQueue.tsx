import React from 'react';
import type { Signup } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { ShieldCheck, Check, X, Phone, Mail } from 'lucide-react';

export const VerificationQueue: React.FC = () => {
  const { signups, events, approveSignup, rejectSignup } = useVolunteer();

  const pendingSignups = signups.filter((s) => s.status === 'pending_approval');

  const getShiftDetails = (signup: Signup) => {
    const event = events.find((e) => e.id === signup.eventId);
    const shift = event?.shifts.find((sh) => sh.id === signup.shiftId);
    const role = shift?.roles.find((r) => r.id === signup.roleId);
    return { event, shift, role };
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="section-header">
        <div>
          <h3 className="section-title">
            <ShieldCheck size={22} style={{ color: 'var(--amber-600)' }} />
            Volunteer Verification Queue ({pendingSignups.length})
          </h3>
          <p className="section-subtitle">
            Review and approve volunteers applying for specialized roles (e.g. First Aid, Heavy Equipment, or Minors) before confirming their spot.
          </p>
        </div>
      </div>

      {pendingSignups.length === 0 ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--slate-500)',
          }}
        >
          <ShieldCheck size={40} style={{ margin: '0 auto 0.75rem', color: 'var(--emerald-500)' }} />
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--slate-800)' }}>
            All Applications Verified!
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
            There are no pending volunteer applications waiting for admin approval right now.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {pendingSignups.map((signup) => {
            const { event, shift, role } = getShiftDetails(signup);

            return (
              <div
                key={signup.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--amber-200)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                }}
              >
                {/* Volunteer details */}
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {signup.userName}
                    </span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--amber-100)',
                        color: 'var(--amber-900)',
                      }}
                    >
                      Awaiting Verification
                    </span>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: 'var(--slate-600)', display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Mail size={13} /> {signup.userEmail}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Phone size={13} /> {signup.userPhone}
                    </span>
                  </div>

                  <div style={{ background: 'var(--slate-50)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)', fontSize: '0.8rem' }}>
                    <div>
                      <strong>Event:</strong> {event?.title}
                    </div>
                    <div>
                      <strong>Role Applied:</strong>{' '}
                      <span style={{ color: 'var(--primary-700)', fontWeight: 700 }}>
                        {role?.name || 'Specialized Role'}
                      </span>{' '}
                      ({shift?.date} • {shift?.startTime} - {shift?.endTime})
                    </div>
                    {signup.notes && (
                      <div style={{ marginTop: '0.35rem', color: 'var(--slate-700)' }}>
                        <strong>Applicant Notes:</strong> <em>"{signup.notes}"</em>
                      </div>
                    )}
                    <div style={{ marginTop: '0.25rem', color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                      Emergency Contact: {signup.emergencyContact.name} ({signup.emergencyContact.relation}) - {signup.emergencyContact.phone}
                    </div>
                  </div>
                </div>

                {/* Approval buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-success btn-sm"
                    onClick={() => approveSignup(signup.id)}
                  >
                    <Check size={14} />
                    Approve & Confirm Spot
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => rejectSignup(signup.id)}
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
