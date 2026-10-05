import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader2, Users } from 'lucide-react';
import { Modal } from '../common/Modal';
import type { VolunteerEvent, Shift, ShiftRole, Signup } from '../../types';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: VolunteerEvent | null;
  currentUser?: { id: string; role?: string } | null;
  signups?: Signup[];
  onSignUp?: (eventId: string, shiftId: string, roleId: string) => Promise<void> | void;
  onViewPass?: (signup: Signup) => void;
}

// Signup statuses that take up a spot in a role
const COUNTED_STATUSES = ['confirmed', 'attended', 'pending_approval'];

const STATUS_LABELS: Record<string, string> = {
  confirmed: 'Confirmed',
  attended: 'Attended',
  pending_approval: 'Pending approval',
  waitlisted: 'Waitlisted',
  no_show: 'No-show',
};

// The organizer can be an object ({ name, email, organization }) or, in older data, a plain string
const getOrganizerName = (organizer: any): string => {
  if (!organizer) return 'Community Organizer';
  if (typeof organizer === 'string') return organizer;
  return organizer.name || organizer.organization || 'Community Organizer';
};

const getOrganizerEmail = (organizer: any): string => {
  if (organizer && typeof organizer === 'object' && organizer.email) return organizer.email;
  return 'support@kindred.org';
};

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUser = null,
  signups = [],
  onSignUp,
  onViewPass,
}) => {
  const [loadingRoleId, setLoadingRoleId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!event) return null;

  const isAdmin = currentUser?.role === 'admin';
  const shifts: Shift[] = event.shifts ?? [];

  // All active (non-canceled) signups for one role in one shift
  const getRoleSignups = (shift: Shift, role: ShiftRole): Signup[] =>
    signups.filter(
      (s) =>
        String(s.roleId) === String(role.id) &&
        String(s.shiftId) === String(shift.id) &&
        s.status !== 'canceled'
    );

  const handleSignUpClick = async (shiftId: string, roleId: string) => {
    setErrorMessage(null);

    if (!currentUser) {
      setErrorMessage('Please log in to sign up for shifts.');
      return;
    }
    if (!onSignUp) {
      setErrorMessage('Sign up is not available right now.');
      return;
    }

    try {
      setLoadingRoleId(roleId);
      await onSignUp(event.id, shiftId, roleId);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to submit signup request.');
    } finally {
      setLoadingRoleId(null);
    }
  };

  const handleClose = () => {
    setErrorMessage(null);
    onClose();
  };

  const renderVolunteerAction = (
    shift: Shift,
    role: ShiftRole,
    userSignup: Signup | undefined,
    isFull: boolean
  ) => {
    const isLoading = loadingRoleId === role.id;

    if (userSignup?.status === 'pending_approval') {
      return (
        <button type="button" className="btn btn-secondary btn-sm" disabled>
          Pending Approval
        </button>
      );
    }

    if (userSignup?.status === 'waitlisted') {
      return (
        <button type="button" className="btn btn-secondary btn-sm" disabled>
          Waitlisted{userSignup.waitlistPosition ? ` #${userSignup.waitlistPosition}` : ''}
        </button>
      );
    }

    if (userSignup?.status === 'confirmed' || userSignup?.status === 'attended') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" disabled>
            <CheckCircle size={14} />
            Joined
          </button>
          {onViewPass && userSignup.status === 'confirmed' && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onViewPass(userSignup)}
            >
              View Pass
            </button>
          )}
        </div>
      );
    }

    return (
      <button
        type="button"
        className={`btn ${isFull ? 'btn-secondary' : 'btn-primary'} btn-sm`}
        onClick={() => handleSignUpClick(shift.id, role.id)}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} />
            Submitting...
          </>
        ) : isFull ? (
          'Join Waitlist'
        ) : (
          'Sign Up'
        )}
      </button>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={event.title}
      subtitle={`${event.category} • Organized by ${getOrganizerName(event.organizer)}`}
      maxWidth="760px"
      footer={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            width: '100%',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Need help? Contact organizer at {getOrganizerEmail(event.organizer)}
          </span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={handleClose}>
            Close
          </button>
        </div>
      }
    >
      {errorMessage && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: '0.8rem',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMessage}</span>
        </div>
      )}

      {isAdmin && (
        <div
          style={{
            padding: '0.6rem 0.85rem',
            marginBottom: '1rem',
            borderRadius: '6px',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-800)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          Organizer view: see who has signed up for each role.
        </div>
      )}

      {shifts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--slate-400)' }}>
          <AlertCircle size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
          <p>No shifts available for this event.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {shifts.map((shift) => (
            <div key={shift.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                  {shift.title}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: '1rem',
                    fontSize: '0.8rem',
                    color: 'var(--slate-500)',
                    marginTop: '0.25rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Calendar size={14} />
                    {shift.date}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Clock size={14} />
                    {shift.startTime} – {shift.endTime}
                    {shift.hours ? ` (${shift.hours} hrs)` : ''}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(shift.roles ?? []).length === 0 ? (
                  <p style={{ fontSize: '0.8rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                    No roles available for this shift.
                  </p>
                ) : (
                  (shift.roles ?? []).map((role) => {
                    const roleSignups = getRoleSignups(shift, role);
                    const filled = roleSignups.filter((s) => COUNTED_STATUSES.includes(s.status)).length;
                    const openSpots = Math.max(0, role.capacity - filled);
                    const isFull = filled >= role.capacity;
                    const userSignup = currentUser
                      ? roleSignups.find((s) => String(s.userId) === String(currentUser.id))
                      : undefined;

                    return (
                      <div
                        key={role.id}
                        style={{
                          padding: '0.9rem 1rem',
                          background: '#f8fafc',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '1rem',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--slate-800)' }}>
                              {role.name}
                            </div>
                            {role.description && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.15rem' }}>
                                {role.description}
                              </div>
                            )}
                            <div style={{ fontSize: '0.78rem', color: 'var(--slate-500)', marginTop: '0.25rem' }}>
                              <strong style={{ color: 'var(--slate-700)' }}>
                                {filled} / {role.capacity}
                              </strong>{' '}
                              filled • {openSpots} open {openSpots === 1 ? 'spot' : 'spots'}
                              {role.requiresApproval ? ' • Requires approval' : ''}
                            </div>
                          </div>

                          {!isAdmin && renderVolunteerAction(shift, role, userSignup, isFull)}
                        </div>

                        {isAdmin && (
                          <div style={{ marginTop: '0.65rem', fontSize: '0.78rem', color: 'var(--slate-600)' }}>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontWeight: 600,
                                marginBottom: '0.25rem',
                              }}
                            >
                              <Users size={13} />
                              Signed up ({roleSignups.length})
                            </div>
                            {roleSignups.length === 0 ? (
                              <div style={{ color: 'var(--slate-400)', fontStyle: 'italic' }}>
                                No volunteers yet.
                              </div>
                            ) : (
                              <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
                                {roleSignups.map((s) => (
                                  <li key={s.id}>
                                    {s.userName} – {STATUS_LABELS[s.status] || s.status}
                                    {s.status === 'waitlisted' && s.waitlistPosition
                                      ? ` #${s.waitlistPosition}`
                                      : ''}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};