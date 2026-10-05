import React from 'react';
import type { VolunteerEvent } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { Calendar, MapPin, Layers, CheckCircle, ChevronRight } from 'lucide-react';

interface EventCardProps {
  event: VolunteerEvent;
  onSelect: (event: VolunteerEvent) => void;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect }) => {
  const { signups = [], currentUser } = useVolunteer();

  // Calculate total slots and filled slots across shifts safely
  const totalSlots = (event.shifts || []).reduce(
    (acc, sh) => acc + (sh.roles || []).reduce((rAcc, r) => rAcc + r.capacity, 0),
    0
  );

  const eventSignups = (signups || []).filter(
    (s) =>
      s.eventId === event.id &&
      (s.status === 'confirmed' || s.status === 'attended' || s.status === 'pending_approval')
  );

  const filledSlots = eventSignups.length;
  const pctFilled = totalSlots > 0 ? Math.min(100, Math.round((filledSlots / totalSlots) * 100)) : 0;

  // Check if current user is signed up for this event (safe null check for currentUser)
  const userSignedUp = currentUser
    ? (signups || []).find(
        (s) => s.eventId === event.id && s.userId === currentUser.id && s.status !== 'canceled'
      )
    : undefined;

  return (
    <div className="event-card" onClick={() => onSelect(event)}>
      <div className="card-image-wrap">
        <img src={event.coverImage} alt={event.title} className="card-image" />
        <span className="category-tag">{event.category}</span>
        <span className={`status-badge status-${event.status}`}>
          {event.status === 'completed' ? (
            <>
              <CheckCircle size={12} />
              Completed
            </>
          ) : (
            'Upcoming'
          )}
        </span>
      </div>

      <div className="card-body">
        <h3 className="card-title">{event.title}</h3>
        <p className="card-desc">{event.description}</p>

        <div className="card-meta-list">
          <div className="card-meta-item">
            <Calendar size={14} />
            <span>{event.startDate}</span>
          </div>
          <div className="card-meta-item">
            <MapPin size={14} />
            <span>{event.location?.name || 'TBA'}</span>
          </div>
          <div className="card-meta-item">
            <Layers size={14} />
            <span>{(event.shifts || []).length} Distinct Shift Slots</span>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="capacity-tracker">
          <div className="capacity-header">
            <span>Volunteer Capacity</span>
            <span>
              {filledSlots} / {totalSlots} Enrolled
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${pctFilled}%`,
                backgroundColor: pctFilled >= 100 ? 'var(--amber-500)' : 'var(--primary-600)',
              }}
            />
          </div>
        </div>

        <div className="card-footer">
          <div>
            {userSignedUp ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--emerald-600)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <CheckCircle size={14} />
                You are registered ({userSignedUp.status})
              </span>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                {totalSlots - filledSlots > 0
                  ? `${totalSlots - filledSlots} spots open`
                  : 'Waitlist available'}
              </span>
            )}
          </div>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(event);
            }}
          >
            <span>View Shifts</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};