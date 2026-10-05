import type { VolunteerEvent, Shift } from '../types';

// Helper function to safely derive a readable location string
const getSafeLocationString = (location: any): string => {
  if (!location) return 'Location TBA';
  if (typeof location === 'string') return location;
  const name = location.name || '';
  const address = location.address ? `, ${location.address}` : '';
  return `${name}${address}`.trim() || 'Location TBA';
};

const pad = (n: number): string => String(n).padStart(2, '0');

// "2026-10-15" or "2026-10-15T00:00:00.000Z" -> "20261015"
const toCompactDate = (value?: string): string =>
  value ? value.slice(0, 10).replace(/-/g, '') : '';

// Adds days to a compact date string like "20261015"
const addDaysCompact = (compact: string, days: number): string => {
  if (compact.length !== 8) return compact;
  const y = parseInt(compact.slice(0, 4), 10);
  const m = parseInt(compact.slice(4, 6), 10) - 1;
  const d = parseInt(compact.slice(6, 8), 10);
  const date = new Date(Date.UTC(y, m, d + days));
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`;
};

// Understands "08:00 AM", "1:30 PM", "08:00", and "08:00:00" (MySQL TIME format)
const parseTime = (value?: string): { h: number; m: number } | null => {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
  if (!match) return null;

  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === 'PM' && h < 12) h += 12;
  if (meridiem === 'AM' && h === 12) h = 0;
  if (h > 23 || m > 59) return null;

  return { h, m };
};

interface CalendarTimes {
  start: string;
  end: string;
  allDay: boolean;
}

// Uses the shift's exact date and times when available, otherwise the event's date range as an all-day entry
const getCalendarTimes = (event: VolunteerEvent, shift?: Shift): CalendarTimes => {
  if (shift) {
    const date = toCompactDate(shift.date || event.startDate);
    const start = parseTime(shift.startTime);
    const end = parseTime(shift.endTime);

    if (date && start && end) {
      return {
        start: `${date}T${pad(start.h)}${pad(start.m)}00`,
        end: `${date}T${pad(end.h)}${pad(end.m)}00`,
        allDay: false,
      };
    }
  }

  const startDate = toCompactDate(event.startDate);
  const endDate = toCompactDate(event.endDate) || startDate;
  return {
    start: startDate,
    // All-day end dates are exclusive, so add one day
    end: addDaysCompact(endDate, 1),
    allDay: true,
  };
};

const getTitle = (event: VolunteerEvent, shift?: Shift): string => {
  const base = event.title || 'Volunteer Event';
  return shift?.title ? `${base} - ${shift.title}` : base;
};

// Escapes text for iCalendar fields
const escapeIcsText = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

export const generateGoogleCalendarUrl = (event: VolunteerEvent, shift?: Shift): string => {
  if (!event) return '#';

  const title = encodeURIComponent(getTitle(event, shift));
  const details = encodeURIComponent(event.description || '');
  const location = encodeURIComponent(getSafeLocationString(event.location));

  const { start, end } = getCalendarTimes(event, shift);
  const dates = `${start}/${end}`;

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
};

export const downloadICalFile = (event: VolunteerEvent, shift?: Shift): void => {
  if (!event) return;

  const locationStr = getSafeLocationString(event.location);
  const { start, end, allDay } = getCalendarTimes(event, shift);
  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const uid = `${event.id}${shift ? `-${shift.id}` : ''}@kindred`;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kindred Volunteer App//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`,
    allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`,
    `SUMMARY:${escapeIcsText(getTitle(event, shift))}`,
    `DESCRIPTION:${escapeIcsText(event.description || '')}`,
    `LOCATION:${escapeIcsText(locationStr)}`,
  ];

  if (event.organizer?.email) {
    const organizerName = (event.organizer.name || 'Organizer').replace(/[";:,]/g, '');
    lines.push(`ORGANIZER;CN=${organizerName}:mailto:${event.organizer.email}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  const icsContent = lines.join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${(event.title || 'event').toLowerCase().replace(/\s+/g, '-')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};