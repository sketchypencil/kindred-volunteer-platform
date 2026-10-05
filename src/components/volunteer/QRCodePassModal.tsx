import React, { useState, useEffect } from 'react';
import type { Signup, VolunteerEvent, Shift, ShiftRole } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { Modal } from '../common/Modal';
import { generateQrDataUrl } from '../../utils/qrCode';
import { QrCode, Clock, MapPin } from 'lucide-react';

interface QRCodePassModalProps {
  signup: Signup | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QRCodePassModal: React.FC<QRCodePassModalProps> = ({
  signup,
  isOpen,
  onClose,
}) => {
  const { events } = useVolunteer();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const event: VolunteerEvent | undefined = events.find((e) => e.id === signup?.eventId);
  const shift: Shift | undefined = event?.shifts.find((s) => s.id === signup?.shiftId);
  const role: ShiftRole | undefined = shift?.roles.find((r) => r.id === signup?.roleId);

  useEffect(() => {
    if (signup?.qrCodeToken) {
      generateQrDataUrl(signup.qrCodeToken).then((url) => setQrDataUrl(url));
    }
  }, [signup]);

  if (!signup || !event) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mobile Check-In Digital Pass"
      subtitle="Present this QR code to the shift coordinator at the venue entrance"
      maxWidth="500px"
    >
      <div className="qr-modal-body">
        {/* Event & Shift Banner */}
        <div style={{ width: '100%', background: 'var(--slate-50)', padding: '0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem', textAlign: 'left' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-600)' }}>
            {event.category}
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {event.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '0.25rem' }}>
            <Clock size={13} />
            <span>{shift?.date} • {shift?.startTime} – {shift?.endTime}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--slate-600)', marginTop: '0.2rem' }}>
            <MapPin size={13} />
            <span>{event.location.name}</span>
          </div>
        </div>

        {/* Assigned Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>Assigned Role:</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            {role?.name || 'General Volunteer'}
          </span>
          <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'var(--emerald-100)', color: 'var(--emerald-800)', fontWeight: 700 }}>
            {signup.status.toUpperCase()}
          </span>
        </div>

        {/* Big QR Code image */}
        <div className="qr-code-wrapper">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt="Check-in QR Code" className="qr-code-img" />
          ) : (
            <div style={{ width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={48} style={{ color: 'var(--slate-300)' }} />
            </div>
          )}
        </div>

        {/* Check-In Token */}
        <div className="qr-token-pill" title="Click to copy check-in code">
          {signup.qrCodeToken}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', marginTop: '0.75rem', maxWidth: '340px' }}>
          Organizers can scan this barcode or enter the token into the Admin QR Scanner to automatically log your attendance and service hours.
        </div>
      </div>
    </Modal>
  );
};
