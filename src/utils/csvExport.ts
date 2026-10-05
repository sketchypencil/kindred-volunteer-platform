import type { Signup, VolunteerEvent } from '../types';

export function exportRosterToCsv(event: VolunteerEvent, signups: Signup[]): void {
  const headers = [
    'Event Title',
    'Shift Date',
    'Shift Time',
    'Volunteer Name',
    'Volunteer Email',
    'Volunteer Phone',
    'Assigned Role',
    'Status',
    'Waitlist Pos',
    'Emergency Contact Name',
    'Emergency Contact Phone',
    'Emergency Contact Relation',
    'Check-in Token',
    'Check-in Time',
    'Notes',
  ];

  const rows = signups.map((s) => {
    const shift = event.shifts.find((sh) => sh.id === s.shiftId);
    const role = shift?.roles.find((r) => r.id === s.roleId);

    return [
      `"${event.title.replace(/"/g, '""')}"`,
      `"${shift?.date || ''}"`,
      `"${shift ? `${shift.startTime} - ${shift.endTime}` : ''}"`,
      `"${s.userName.replace(/"/g, '""')}"`,
      `"${s.userEmail}"`,
      `"${s.userPhone}"`,
      `"${role?.name || 'General'}"`,
      `"${s.status.toUpperCase()}"`,
      s.waitlistPosition ? `"${s.waitlistPosition}"` : '""',
      `"${s.emergencyContact.name.replace(/"/g, '""')}"`,
      `"${s.emergencyContact.phone}"`,
      `"${s.emergencyContact.relation}"`,
      `"${s.qrCodeToken}"`,
      `"${s.checkedInAt || 'Not Checked In'}"`,
      `"${(s.notes || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedTitle = event.title.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('download', `Roster_${sanitizedTitle}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
