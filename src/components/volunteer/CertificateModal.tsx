import React, { useEffect } from 'react';
import type { Signup, VolunteerEvent, Shift, ShiftRole } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { Modal } from '../common/Modal';
import confetti from 'canvas-confetti';
import { Printer } from 'lucide-react';

interface CertificateModalProps {
  signup: Signup | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  signup,
  isOpen,
  onClose,
}) => {
  const { events } = useVolunteer();

  useEffect(() => {
    if (isOpen) {
      // Trigger festive celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#f59e0b', '#10b981', '#6366f1'],
      });
    }
  }, [isOpen]);

  if (!signup) return null;

  const event: VolunteerEvent | undefined = events.find((e) => e.id === signup.eventId);
  const shift: Shift | undefined = event?.shifts.find((s) => s.id === signup.shiftId);
  const role: ShiftRole | undefined = shift?.roles.find((r) => r.id === signup.roleId);
  const hours = shift?.hours || 4;
  const certId = `CERT-${signup.eventId.toUpperCase()}-${signup.id.slice(-6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Official Certificate of Participation"
      subtitle="Verified proof of community service hours completed"
      maxWidth="880px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Serial ID: <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{certId}</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handlePrint}>
              <Printer size={14} />
              Print / Save as PDF
            </button>
          </div>
        </div>
      }
    >
      <div className="certificate-preview-container">
        <div className="certificate-frame" id="printable-certificate">
          <div className="cert-inner-border">
            {/* Medallion / Seal */}
            <div className="cert-seal">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="46" stroke="#b45309" strokeWidth="4" fill="#fef3c7" />
                <circle cx="50" cy="50" r="38" stroke="#d97706" strokeWidth="2" strokeDasharray="4 2" />
                <path d="M50 24L57 38L73 40L61 51L64 67L50 59L36 67L39 51L27 40L43 38L50 24Z" fill="#b45309" />
              </svg>
            </div>

            <div className="cert-header">COMMUNITY REACH ALLIANCE</div>
            <h1 className="cert-title">Certificate of Appreciation</h1>
            <p className="cert-subtext">This honor is proudly conferred upon</p>

            <div className="cert-recipient">{signup.userName}</div>

            <p className="cert-body-text">
              In grateful recognition of distinguished volunteer dedication, completing{' '}
              <strong>{hours} hours</strong> of verified service in the role of{' '}
              <strong>{role?.name || 'Lead Volunteer'}</strong> during the{' '}
              <strong>{event?.title || 'Community Service Operation'}</strong>.
            </p>

            {/* Signature Block */}
            <div className="cert-signatures">
              <div className="sig-block">
                <div className="sig-script">{event?.organizer.name || 'Sarah Jenkins'}</div>
                <div className="sig-line">
                  {event?.organizer.name || 'Sarah Jenkins'}<br />
                  Lead Operations Coordinator
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#b45309' }}>
                  ★ OFFICIAL SEAL ★
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                  Verified: {new Date(signup.checkedInAt || shift?.date || Date.now()).toLocaleDateString()}
                </div>
              </div>

              <div className="sig-block">
                <div className="sig-script" style={{ fontFamily: 'var(--font-mono)', fontSize: '1.2rem', paddingTop: '0.7rem' }}>
                  {certId}
                </div>
                <div className="sig-line">
                  Verification Registry<br />
                  State Volunteer Council
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
