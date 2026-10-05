import React, { useState } from 'react';
import type { EventCategory, Shift, ShiftRole } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { Modal } from '../common/Modal';
import { Plus, Trash2 } from 'lucide-react';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose }) => {
  const { createEvent, currentUser } = useVolunteer();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<EventCategory>('Community');
  const [locationName, setLocationName] = useState('');
  const [locationAddress, setLocationAddress] = useState('');
  const [startDate, setStartDate] = useState('2026-11-05');
  const [endDate, setEndDate] = useState('2026-11-05');
  const coverImage = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=900&auto=format&fit=crop&q=80';
  const [requiresVerification, setRequiresVerification] = useState(false);

  // Dynamic Shifts
  const [shifts, setShifts] = useState<
    {
      title: string;
      startTime: string;
      endTime: string;
      date: string;
      hours: number;
      roles: {
        name: string;
        description: string;
        capacity: number;
        requiresApproval: boolean;
        skillsStr: string;
      }[];
    }[]
  >([
    {
      title: 'Morning Flight: Setup & Registration',
      startTime: '08:00 AM',
      endTime: '12:00 PM',
      date: '2026-11-05',
      hours: 4,
      roles: [
        {
          name: 'Logistics & Gear Lead',
          description: 'Distribute volunteer check-in materials and set up tables.',
          capacity: 3,
          requiresApproval: false,
          skillsStr: 'Logistics, Setup',
        },
        {
          name: 'Safety & First Aid Lead',
          description: 'Stationed at medical hub; monitor volunteer wellness.',
          capacity: 2,
          requiresApproval: true,
          skillsStr: 'First Aid Certified, CPR',
        },
      ],
    },
  ]);

  const handleAddShift = () => {
    setShifts((prev) => [
      ...prev,
      {
        title: `Afternoon Shift: Operations & Tear-Down`,
        startTime: '01:00 PM',
        endTime: '05:00 PM',
        date: startDate,
        hours: 4,
        roles: [
          {
            name: 'General Support & Cleanup',
            description: 'Pack materials and oversee recycling bins.',
            capacity: 4,
            requiresApproval: false,
            skillsStr: 'General, Teamwork',
          },
        ],
      },
    ]);
  };

  const handleRemoveShift = (shiftIndex: number) => {
    if (shifts.length <= 1) return;
    setShifts((prev) => prev.filter((_, i) => i !== shiftIndex));
  };

  const handleAddRole = (shiftIndex: number) => {
    setShifts((prev) =>
      prev.map((s, idx) => {
        if (idx === shiftIndex) {
          return {
            ...s,
            roles: [
              ...s.roles,
              {
                name: 'Crowd & Directional Guide',
                description: 'Direct attendees and answer logistical inquiries.',
                capacity: 2,
                requiresApproval: false,
                skillsStr: 'Friendly, Customer Service',
              },
            ],
          };
        }
        return s;
      })
    );
  };

  const handleRemoveRole = (shiftIndex: number, roleIndex: number) => {
    setShifts((prev) =>
      prev.map((s, idx) => {
        if (idx === shiftIndex) {
          if (s.roles.length <= 1) return s;
          return {
            ...s,
            roles: s.roles.filter((_, rIdx) => rIdx !== roleIndex),
          };
        }
        return s;
      })
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim()) return;

    // Convert shifts to typed structure
    const generatedShifts: Shift[] = shifts.map((sh, sIdx) => {
      const shiftId = `sh-gen-${Date.now()}-${sIdx}`;
      const roles: ShiftRole[] = sh.roles.map((r, rIdx) => ({
        id: `r-gen-${Date.now()}-${sIdx}-${rIdx}`,
        name: r.name,
        description: r.description,
        capacity: Number(r.capacity) || 1,
        requiresApproval: r.requiresApproval,
        skillsSuggested: r.skillsStr
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      }));

      return {
        id: shiftId,
        eventId: '', // filled by createEvent
        title: sh.title,
        startTime: sh.startTime,
        endTime: sh.endTime,
        date: sh.date || startDate,
        hours: Number(sh.hours) || 4,
        roles,
      };
    });

    createEvent({
      title: title.trim(),
      description: description.trim() || 'Join us to make an active difference in our neighborhood.',
      category,
      location: {
        name: locationName.trim(),
        address: locationAddress.trim() || 'Central Community Plaza',
        mapUrl: `https://maps.google.com/?q=${encodeURIComponent(locationName)}`,
      },
      startDate,
      endDate: endDate || startDate,
      status: 'upcoming',
      organizer: {
        name: currentUser.name,
        email: currentUser.email,
        organization: 'Community Reach Coalition',
      },
      coverImage:
        coverImage.trim() ||
        'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=900&auto=format&fit=crop&q=80',
      requiresVerification,
      shifts: generatedShifts,
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Volunteer Event"
      subtitle="Schedule multi-slot shifts and configure role-based headcount limits"
      maxWidth="900px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Core details */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              Event Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Green Valley Urban Tree Planting Drive"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem',
                background: '#fff',
              }}
            >
              <option value="Environment">Environment & Ecology</option>
              <option value="Community">Community & Outreach</option>
              <option value="Health & Relief">Health & Disaster Relief</option>
              <option value="Education">Youth & Education</option>
              <option value="Arts & Culture">Arts & Cultural Heritage</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Detailed overview, mission goals, and what volunteers should expect..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              marginTop: '0.25rem',
            }}
          />
        </div>

        {/* Location & Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              Venue Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Riverside Park Pavilion"
              value={locationName}
              onChange={(e) => setLocationName(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              Address
            </label>
            <input
              type="text"
              placeholder="e.g. 500 Waterfront Ave"
              value={locationAddress}
              onChange={(e) => setLocationAddress(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              Start Date *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem',
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                marginTop: '0.25rem',
              }}
            />
          </div>
        </div>

        {/* Verification setting */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={requiresVerification}
            onChange={(e) => setRequiresVerification(e.target.checked)}
          />
          Require manual organizer approval for all volunteer sign-ups on this event
        </label>

        {/* Multi-Slot Shift Scheduling */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                Multi-Slot Shifts & Role Limits ({shifts.length})
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                Divide this event into distinct time slots and configure max headcounts per role.
              </p>
            </div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={handleAddShift}>
              <Plus size={14} />
              Add Another Shift
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {shifts.map((shift, sIdx) => (
              <div
                key={sIdx}
                style={{
                  background: 'var(--slate-50)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--primary-700)' }}>
                    Shift Slot #{sIdx + 1}
                  </div>
                  {shifts.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => handleRemoveShift(sIdx)}
                      title="Remove shift"
                    >
                      <Trash2 size={14} style={{ color: 'var(--rose-500)' }} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      Shift Label
                    </label>
                    <input
                      type="text"
                      value={shift.title}
                      onChange={(e) => {
                        const val = e.target.value;
                        setShifts((prev) =>
                          prev.map((s, i) => (i === sIdx ? { ...s, title: val } : s))
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      Start Time
                    </label>
                    <input
                      type="text"
                      value={shift.startTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setShifts((prev) =>
                          prev.map((s, i) => (i === sIdx ? { ...s, startTime: val } : s))
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      End Time
                    </label>
                    <input
                      type="text"
                      value={shift.endTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setShifts((prev) =>
                          prev.map((s, i) => (i === sIdx ? { ...s, endTime: val } : s))
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      Hours Credit
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={shift.hours}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        setShifts((prev) =>
                          prev.map((s, i) => (i === sIdx ? { ...s, hours: val } : s))
                        );
                      }}
                      style={{
                        width: '100%',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-sm)',
                        marginTop: '0.2rem',
                      }}
                    />
                  </div>
                </div>

                {/* Roles inside this shift */}
                <div style={{ background: '#fff', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-800)' }}>
                      Roles for this Shift
                    </span>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleAddRole(sIdx)}
                      style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    >
                      + Add Role
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    {shift.roles.map((role, rIdx) => (
                      <div
                        key={rIdx}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 2fr 1fr auto',
                          gap: '0.5rem',
                          alignItems: 'center',
                          padding: '0.5rem',
                          background: 'var(--slate-50)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      >
                        <input
                          type="text"
                          placeholder="Role Name (e.g. First Aid)"
                          value={role.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShifts((prev) =>
                              prev.map((s, sI) =>
                                sI === sIdx
                                  ? {
                                      ...s,
                                      roles: s.roles.map((r, rI) =>
                                        rI === rIdx ? { ...r, name: val } : r
                                      ),
                                    }
                                  : s
                              )
                            );
                          }}
                          style={{
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.775rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />

                        <input
                          type="number"
                          min="1"
                          placeholder="Max Cap"
                          value={role.capacity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setShifts((prev) =>
                              prev.map((s, sI) =>
                                sI === sIdx
                                  ? {
                                      ...s,
                                      roles: s.roles.map((r, rI) =>
                                        rI === rIdx ? { ...r, capacity: val } : r
                                      ),
                                    }
                                  : s
                              )
                            );
                          }}
                          style={{
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.775rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />

                        <input
                          type="text"
                          placeholder="Skills required (comma separated)"
                          value={role.skillsStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            setShifts((prev) =>
                              prev.map((s, sI) =>
                                sI === sIdx
                                  ? {
                                      ...s,
                                      roles: s.roles.map((r, rI) =>
                                        rI === rIdx ? { ...r, skillsStr: val } : r
                                      ),
                                    }
                                  : s
                              )
                            );
                          }}
                          style={{
                            padding: '0.35rem 0.5rem',
                            fontSize: '0.775rem',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />

                        <label style={{ fontSize: '0.725rem', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={role.requiresApproval}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setShifts((prev) =>
                                prev.map((s, sI) =>
                                  sI === sIdx
                                    ? {
                                        ...s,
                                        roles: s.roles.map((r, rI) =>
                                          rI === rIdx ? { ...r, requiresApproval: checked } : r
                                        ),
                                      }
                                    : s
                                )
                              );
                            }}
                          />
                          Verify
                        </label>

                        {shift.roles.length > 1 && (
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleRemoveRole(sIdx, rIdx)}
                            style={{ padding: '0.25rem' }}
                          >
                            <Trash2 size={12} style={{ color: 'var(--rose-500)' }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Publish Event & Open Shifts
          </button>
        </div>
      </form>
    </Modal>
  );
};
