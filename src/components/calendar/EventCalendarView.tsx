import React, { useState } from 'react';
import type { VolunteerEvent } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Download,
  Clock,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { downloadICalFile, generateGoogleCalendarUrl } from '../../utils/calendarExport';

interface EventCalendarViewProps {
  onSelectEvent: (event: VolunteerEvent) => void;
}

export const EventCalendarView: React.FC<EventCalendarViewProps> = ({ onSelectEvent }) => {
  const { events } = useVolunteer();
  // Focus around October 2026 where sample events are located
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 1)); // October 2026
  const [selectedDateStr, setSelectedDateStr] = useState<string>('2026-10-10');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build grid days
  const calendarCells: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const day = prevMonthTotalDays - i;
    const prevMonthStr = String(month === 0 ? 12 : month).padStart(2, '0');
    const prevYear = month === 0 ? year - 1 : year;
    calendarCells.push({
      dayNum: day,
      dateStr: `${prevYear}-${prevMonthStr}-${String(day).padStart(2, '0')}`,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const mStr = String(month + 1).padStart(2, '0');
    calendarCells.push({
      dayNum: d,
      dateStr: `${year}-${mStr}-${String(d).padStart(2, '0')}`,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete 35 or 42 cells
  const remainingCells = 35 - calendarCells.length;
  if (remainingCells > 0) {
    for (let n = 1; n <= remainingCells; n++) {
      const nextMonthStr = String(month + 2 > 12 ? 1 : month + 2).padStart(2, '0');
      const nextYear = month + 1 > 11 ? year + 1 : year;
      calendarCells.push({
        dayNum: n,
        dateStr: `${nextYear}-${nextMonthStr}-${String(n).padStart(2, '0')}`,
        isCurrentMonth: false,
      });
    }
  }

  // Find events for each cell
  const getEventsForDate = (dateStr: string) => {
    return events.filter((e) => {
      // Check start date or any shift date
      if (e.startDate === dateStr || e.endDate === dateStr) return true;
      return e.shifts.some((s) => s.date === dateStr);
    });
  };

  const selectedEvents = getEventsForDate(selectedDateStr);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Exporters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Interactive Shift Calendar
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
            Select any day to review shift schedules, sync directly with Google Calendar, or download iCal files.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (events.length > 0) {
                downloadICalFile(events[0]);
              }
            }}
          >
            <Download size={14} />
            Export Monthly iCal (.ics)
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1.2fr)', gap: '1.5rem' }}>
        {/* Calendar Grid Container */}
        <div className="calendar-container">
          <div className="calendar-header">
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--slate-900)' }}>
              {monthNames[month]} {year}
            </div>

            <div style={{ display: 'flex', gap: '0.35rem' }}>
              <button
                type="button"
                className="btn-icon"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setCurrentDate(new Date(2026, 9, 1));
                  setSelectedDateStr('2026-10-10');
                }}
              >
                October 2026
              </button>
              <button
                type="button"
                className="btn-icon"
                onClick={handleNextMonth}
                aria-label="Next Month"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of week */}
          <div className="calendar-month-grid">
            {daysOfWeek.map((day) => (
              <div key={day} className="calendar-day-header">
                {day}
              </div>
            ))}
          </div>

          {/* Days cells */}
          <div className="calendar-month-grid">
            {calendarCells.map((cell, idx) => {
              const dayEvents = getEventsForDate(cell.dateStr);
              const isSelected = selectedDateStr === cell.dateStr;

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${cell.isCurrentMonth ? '' : 'other-month'} ${
                    isSelected ? 'selected' : ''
                  }`}
                  onClick={() => setSelectedDateStr(cell.dateStr)}
                >
                  <div className="day-number">{cell.dayNum}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {dayEvents.slice(0, 2).map((ev) => (
                      <span
                        key={ev.id}
                        className="day-badge-dot"
                        title={`${ev.title} (${ev.shifts.length} shifts)`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDateStr(cell.dateStr);
                          onSelectEvent(ev);
                        }}
                      >
                        {ev.title}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--slate-500)', fontWeight: 600 }}>
                        +{dayEvents.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Date Shifts & Agenda Panel */}
        <div
          style={{
            background: '#fff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)', fontWeight: 700, fontSize: '0.85rem' }}>
              <CalendarIcon size={16} />
              <span>Selected Day Agenda</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
              {selectedDateStr}
            </h3>
          </div>

          {selectedEvents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--slate-400)' }}>
              <CalendarIcon size={36} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              <div style={{ fontWeight: 600 }}>No shifts scheduled for this date.</div>
              <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Try clicking on Oct 10, Oct 18, or Oct 24 in the calendar!
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {selectedEvents.map((evt) => (
                <div
                  key={evt.id}
                  style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    background: 'var(--slate-50)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <h4
                      style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--slate-900)', cursor: 'pointer' }}
                      onClick={() => onSelectEvent(evt)}
                    >
                      {evt.title}
                    </h4>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--primary-100)',
                        color: 'var(--primary-800)',
                      }}
                    >
                      {evt.category}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--slate-600)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.75rem' }}>
                    <MapPin size={13} style={{ color: 'var(--rose-500)' }} />
                    <span>{evt.location.name}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.85rem' }}>
                    {evt.shifts.map((sh) => (
                      <div
                        key={sh.id}
                        style={{
                          background: '#fff',
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--slate-200)',
                          fontSize: '0.8rem',
                        }}
                      >
                        <div style={{ fontWeight: 600, color: 'var(--slate-800)' }}>{sh.title}</div>
                        <div style={{ color: 'var(--slate-500)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '2px' }}>
                          <Clock size={12} />
                          <span>{sh.startTime} – {sh.endTime} ({sh.hours} hrs)</span>
                          <span>•</span>
                          <span>{sh.roles.length} Roles available</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Calendar Sync Links */}
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => onSelectEvent(evt)}
                      style={{ flex: 1 }}
                    >
                      View & Sign Up
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => downloadICalFile(evt)}
                      title="Download Apple / Outlook .ics"
                    >
                      <Download size={13} />
                      iCal
                    </button>
                    <a
                      href={generateGoogleCalendarUrl(evt)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-secondary btn-sm"
                      title="Add to Google Calendar"
                    >
                      <ExternalLink size={13} />
                      Google Cal
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
