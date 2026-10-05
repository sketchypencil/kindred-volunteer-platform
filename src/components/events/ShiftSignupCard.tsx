import React, { useState } from 'react';
import type { Shift, VolunteerEvent, Signup } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { Clock, ShieldCheck, CheckCircle2, AlertTriangle, Calendar, UserCheck, Hourglass } from 'lucide-react';

interface ShiftSignupCardProps {
  shift: Shift;
  event: VolunteerEvent;
  onViewPass?: (signup: Signup) => void;
}

export const ShiftSignupCard: React.FC<ShiftSignupCardProps> = ({
  shift,
  event,
  onViewPass,
}) => {
  const { currentUser, signups, signUpForShift, cancelSignup } = useVolunteer();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [signupNotes, setSignupNotes] = useState('');

  // 1. Safe ID String conversion to prevent number/string mismatch issues
  const shiftSignups = signups.filter(
    (s) =>
      String(s.eventId) === String(event.id) &&
      String(s.shiftId) === String(shift.id) &&
      s.status !== 'canceled'
  );

  // 2. Find current user's signup for this shift
  const userSignupInShift = currentUser
    ? shiftSignups.find((s) => String(s.userId) === String(currentUser.id))
    : undefined;

  const handleConfirmSignup = (roleId: string) => {
    if (!currentUser) {
      alert('Please log in to sign up for shifts.');
      return;
    }
    signUpForShift(event.id, shift.id, roleId, signupNotes);
    setSelectedRoleId(null);
    setSignupNotes('');
  };

  return (
    <div className="shift-box">
      {/* Shift Header */}
      <div className="shift-box-header">
        <div className="shift-title-area">
          <h3>{shift.title}</h3>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            <span className="shift-time-badge">
              <Calendar size={14} />
              {shift.date}
            </span>
            <span className="shift-time-badge">
              <Clock size={14} />
              {shift.startTime} – {shift.endTime} ({shift.hours} hrs)
            </span>
          </div>
        </div>

        {/* Header Status Badge */}
        {userSignupInShift && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor:
                  userSignupInShift.status === 'confirmed' || userSignupInShift.status === 'attended'
                    ? 'var(--emerald-100)'
                    : userSignupInShift.status === 'waitlisted'
                    ? 'var(--amber-100)'
                    : 'var(--primary-100)',
                color:
                  userSignupInShift.status === 'confirmed' || userSignupInShift.status === 'attended'
                    ? 'var(--emerald-800)'
                    : userSignupInShift.status === 'waitlisted'
                    ? 'var(--amber-900)'
                    : 'var(--primary-800)',
              }}
            >
              {userSignupInShift.status === 'confirmed' && '✓ Confirmed Spot'}
              {userSignupInShift.status === 'attended' && '★ Attended & Hours Logged'}
              {userSignupInShift.status === 'waitlisted' &&
                `Waitlist #${userSignupInShift.waitlistPosition ?? 1}`}
              {userSignupInShift.status === 'pending_approval' && '⏳ Pending Verification'}
            </span>

            {onViewPass && userSignupInShift.status === 'confirmed' && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onViewPass(userSignupInShift)}
              >
                QR Pass
              </button>
            )}

            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => cancelSignup(userSignupInShift.id)}
              title="Cancel your spot"
            >
              Cancel Spot
            </button>
          </div>
        )}
      </div>

      {/* Role List */}
      <div className="roles-container">
        {shift.roles.map((role) => {
          // 3. Include pending_approval in filled headcount so 0/2 updates to 1/2
          const filledCount = shiftSignups.filter(
            (s) =>
              String(s.roleId) === String(role.id) &&
              (s.status === 'confirmed' || s.status === 'attended' || s.status === 'pending_approval')
          ).length;

          const waitlistCount = shiftSignups.filter(
            (s) => String(s.roleId) === String(role.id) && s.status === 'waitlisted'
          ).length;

          const isFull = filledCount >= role.capacity;
          const isUserInThisRole = userSignupInShift && String(userSignupInShift.roleId) === String(role.id);
          const isSelectingThisRole = selectedRoleId === role.id;
          const capacityPct = Math.min(100, Math.round((filledCount / role.capacity) * 100));

          return (
            <div key={role.id} className="role-row">
              <div className="role-info">
                <div className="role-name-row">
                  <span className="role-name">{role.name}</span>
                  {role.requiresApproval && (
                    <span className="approval-badge" title="Organizer verifies applicants before approval">
                      <ShieldCheck size={12} />
                      Approval Required
                    </span>
                  )}
                </div>

                <p className="role-desc">{role.description}</p>

                {role.skillsSuggested && role.skillsSuggested.length > 0 && (
                  <div className="skills-tags">
                    {role.skillsSuggested.map((skill, idx) => (
                      <span key={idx} className="skill-tag">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Headcount Capacity Tracker */}
              <div className="role-status-area">
                <div className="headcount-badge">
                  <div className="headcount-num">
                    {filledCount} / {role.capacity}
                  </div>
                  <div className="headcount-label">
                    {isFull ? (
                      <span style={{ color: 'var(--amber-600)', fontWeight: 700 }}>
                        Full ({waitlistCount} on waitlist)
                      </span>
                    ) : (
                      `${role.capacity - filledCount} open spots`
                    )}
                  </div>
                  <div className="progress-bar-bg" style={{ width: '90px', marginTop: '4px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${capacityPct}%`,
                        backgroundColor: isFull ? 'var(--amber-500)' : 'var(--primary-600)',
                      }}
                    />
                  </div>
                </div>

                {/* Sign up / Dynamic Status Actions */}
                <div>
                  {isUserInThisRole ? (
                    userSignupInShift.status === 'pending_approval' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.85rem' }}>
                        <Hourglass size={16} />
                        <span>Pending Approval</span>
                      </div>
                    ) : userSignupInShift.status === 'waitlisted' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--amber-600)', fontWeight: 600, fontSize: '0.85rem' }}>
                        <AlertTriangle size={16} />
                        <span>On Waitlist</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--emerald-600)', fontWeight: 600, fontSize: '0.85rem' }}>
                        <CheckCircle2 size={16} />
                        <span>Enrolled</span>
                      </div>
                    )
                  ) : userSignupInShift ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontStyle: 'italic' }}>
                      In another role
                    </span>
                  ) : currentUser?.role === 'admin' ? (
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      Organizer View
                    </span>
                  ) : (
                    <div>
                      {!isSelectingThisRole ? (
                        <button
                          type="button"
                          className={`btn btn-sm ${isFull ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => setSelectedRoleId(role.id)}
                        >
                          {isFull ? (
                            <>
                              <AlertTriangle size={14} style={{ color: 'var(--amber-500)' }} />
                              Join Waitlist
                            </>
                          ) : role.requiresApproval ? (
                            <>
                              <ShieldCheck size={14} />
                              Apply for Spot
                            </>
                          ) : (
                            <>
                              <UserCheck size={14} />
                              Sign Up
                            </>
                          )}
                        </button>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.4rem',
                            minWidth: '220px',
                            background: 'var(--slate-50)',
                            padding: '0.6rem',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-color)',
                          }}
                        >
                          <label style={{ fontSize: '0.725rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                            Notes / Relevant Experience (optional):
                          </label>
                          <input
                            type="text"
                            placeholder="e.g., CPR certified..."
                            value={signupNotes}
                            onChange={(e) => setSignupNotes(e.target.value)}
                            style={{
                              padding: '0.35rem 0.5rem',
                              fontSize: '0.775rem',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                            }}
                          />
                          <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              style={{ flex: 1 }}
                              onClick={() => handleConfirmSignup(role.id)}
                            >
                              {isFull
                                ? 'Confirm Waitlist'
                                : role.requiresApproval
                                ? 'Submit Application'
                                : 'Confirm Sign Up'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => setSelectedRoleId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};