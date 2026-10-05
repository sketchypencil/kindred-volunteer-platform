import React, { useState } from 'react';
import type { AlertUrgency } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { Modal } from '../common/Modal';
import { Radio, Mail, Bell } from 'lucide-react';

interface BroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BroadcastModal: React.FC<BroadcastModalProps> = ({ isOpen, onClose }) => {
  const { events, signups, broadcastAnnouncement, currentUser } = useVolunteer();

  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgency, setUrgency] = useState<AlertUrgency>('urgent');
  const [channelInApp, setChannelInApp] = useState(true);
  const [channelEmail, setChannelEmail] = useState(true);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || events[0];

  const recipientCount = signups.filter(
    (s) =>
      s.eventId === selectedEvent?.id &&
      (s.status === 'confirmed' || s.status === 'waitlisted' || s.status === 'pending_approval')
  ).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !selectedEvent) return;

    const channels: ('in_app' | 'email')[] = [];
    if (channelInApp) channels.push('in_app');
    if (channelEmail) channels.push('email');

    broadcastAnnouncement({
      eventId: selectedEvent.id,
      eventTitle: selectedEvent.title,
      title: title.trim(),
      message: message.trim(),
      urgency,
      sentBy: `${currentUser.name} (Organizer)`,
      channels,
    });

    setTitle('');
    setMessage('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Broadcast Urgent Announcement"
      subtitle="Push immediate notifications to all enrolled volunteers for an event"
      maxWidth="640px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Target event */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
            Target Event & Volunteer Cohort *
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginTop: '0.25rem',
              background: '#fff',
            }}
          >
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.title} ({ev.startDate})
              </option>
            ))}
          </select>
          <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600, marginTop: '0.25rem' }}>
            Will reach {recipientCount} signed-up volunteers
          </div>
        </div>

        {/* Urgency Level */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.35rem', display: 'block' }}>
            Urgency Level
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <label
              style={{
                border: `2px solid ${urgency === 'normal' ? 'var(--primary-600)' : 'var(--border-color)'}`,
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: urgency === 'normal' ? 'var(--primary-50)' : '#fff',
              }}
            >
              <input
                type="radio"
                name="urgency"
                value="normal"
                checked={urgency === 'normal'}
                onChange={() => setUrgency('normal')}
                style={{ display: 'none' }}
              />
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary-800)' }}>Normal</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>General Update</div>
            </label>

            <label
              style={{
                border: `2px solid ${urgency === 'urgent' ? 'var(--amber-500)' : 'var(--border-color)'}`,
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: urgency === 'urgent' ? 'var(--amber-50)' : '#fff',
              }}
            >
              <input
                type="radio"
                name="urgency"
                value="urgent"
                checked={urgency === 'urgent'}
                onChange={() => setUrgency('urgent')}
                style={{ display: 'none' }}
              />
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--amber-800)' }}>Urgent</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Venue / Time Delay</div>
            </label>

            <label
              style={{
                border: `2px solid ${urgency === 'critical' ? 'var(--rose-600)' : 'var(--border-color)'}`,
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                textAlign: 'center',
                backgroundColor: urgency === 'critical' ? 'var(--rose-50)' : '#fff',
              }}
            >
              <input
                type="radio"
                name="urgency"
                value="critical"
                checked={urgency === 'critical'}
                onChange={() => setUrgency('critical')}
                style={{ display: 'none' }}
              />
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--rose-800)' }}>Critical</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)' }}>Weather / Hazard</div>
            </label>
          </div>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
            Alert Headline *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Venue Entrance Shifted to Gate 4 Due to Construction"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginTop: '0.25rem',
            }}
          />
        </div>

        {/* Message */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>
            Broadcast Message *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Clear, actionable instructions for all volunteers arriving on site..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              marginTop: '0.25rem',
            }}
          />
        </div>

        {/* Delivery Channels */}
        <div>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)', marginBottom: '0.35rem', display: 'block' }}>
            Dispatch Channels
          </label>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={channelInApp}
                onChange={(e) => setChannelInApp(e.target.checked)}
              />
              <Bell size={15} />
              In-App Push Banner
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={channelEmail}
                onChange={(e) => setChannelEmail(e.target.checked)}
              />
              <Mail size={15} />
              Simulated Instant Email
            </label>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-danger">
            <Radio size={16} />
            Transmit Broadcast Alert
          </button>
        </div>
      </form>
    </Modal>
  );
};
