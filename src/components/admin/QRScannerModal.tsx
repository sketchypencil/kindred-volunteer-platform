import React, { useState } from 'react';
import type { Signup } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { Modal } from '../common/Modal';
import { QrCode, CheckCircle2, AlertCircle, Camera, ArrowRight } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({ isOpen, onClose }) => {
  const { signups, events, checkInWithQrToken } = useVolunteer();
  const [tokenInput, setTokenInput] = useState('');
  const [scanResult, setScanResult] = useState<{
    success: boolean;
    message: string;
    signup?: Signup;
  } | null>(null);

  // Active confirmed signups that haven't attended yet (for quick test clicks!)
  const eligibleSignups = signups.filter(
    (s) => s.status === 'confirmed' || s.status === 'attended'
  );

  const handleScanSubmit = (tokenToScan: string) => {
    if (!tokenToScan.trim()) return;
    const res = checkInWithQrToken(tokenToScan);
    setScanResult(res);
    setTokenInput('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Venue Mobile QR Scanner & Check-In"
      subtitle="Scan volunteer passes or enter registration tokens for instant attendance logging"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Scanner Simulation Viewport */}
        <div className="scanner-viewport">
          <div className="scan-laser" />
          <div className="scanner-crosshair" />
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              color: '#94a3b8',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Camera size={14} />
            <span>Camera Stream Active • Aim at Volunteer Pass</span>
          </div>
        </div>

        {/* Scan Result Feedback Banner */}
        {scanResult && (
          <div
            style={{
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${scanResult.success ? 'var(--emerald-500)' : 'var(--rose-500)'}`,
              backgroundColor: scanResult.success ? 'var(--emerald-50)' : 'var(--rose-50)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
            }}
          >
            {scanResult.success ? (
              <CheckCircle2 size={24} style={{ color: 'var(--emerald-600)', flexShrink: 0 }} />
            ) : (
              <AlertCircle size={24} style={{ color: 'var(--rose-600)', flexShrink: 0 }} />
            )}
            <div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: scanResult.success ? 'var(--emerald-900)' : 'var(--rose-900)',
                }}
              >
                {scanResult.success ? 'Check-In Verified!' : 'Check-In Unsuccessful'}
              </div>
              <p
                style={{
                  fontSize: '0.85rem',
                  color: scanResult.success ? 'var(--emerald-800)' : 'var(--rose-800)',
                  marginTop: '0.2rem',
                }}
              >
                {scanResult.message}
              </p>
            </div>
          </div>
        )}

        {/* Manual Token Entry Form */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Type or paste QR Token (e.g. VOL-EVT1-SH101-UALEX-1002)..."
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleScanSubmit(tokenInput);
            }}
            style={{
              flex: 1,
              padding: '0.6rem 0.85rem',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
            }}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => handleScanSubmit(tokenInput)}
          >
            <QrCode size={16} />
            Process Token
          </button>
        </div>

        {/* Quick Demo Scanner Shortcuts */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '0.5rem' }}>
            Click-To-Scan Volunteer Quick Test (No camera required):
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
            {eligibleSignups.map((s) => {
              const ev = events.find((e) => e.id === s.eventId);

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    background: s.status === 'attended' ? 'var(--emerald-50)' : 'var(--slate-50)',
                    fontSize: '0.8rem',
                  }}
                >
                  <div>
                    <strong>{s.userName}</strong> ({ev?.title.slice(0, 30)}...)
                    <span style={{ marginLeft: '0.5rem', fontFamily: 'var(--font-mono)', color: 'var(--slate-500)', fontSize: '0.75rem' }}>
                      [{s.qrCodeToken}]
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleScanSubmit(s.qrCodeToken)}
                  >
                    {s.status === 'attended' ? 'Re-verify' : 'Simulate Scan'}
                    <ArrowRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
