import React, { useState } from 'react';
import { VolunteerProvider, useVolunteer } from './context/VolunteerContext';
import { Navbar } from './components/common/Navbar';
import { NotificationToast } from './components/common/NotificationToast';
import { EventCard } from './components/events/EventCard';
import { EventDetailModal } from './components/events/EventDetailModal';
import { EventFormModal } from './components/events/EventFormModal';
import { EventCalendarView } from './components/calendar/EventCalendarView';
import { VolunteerDashboard } from './components/volunteer/VolunteerDashboard';
import { VerificationQueue } from './components/admin/VerificationQueue';
import { AttendanceRoster } from './components/admin/AttendanceRoster';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { QRCodePassModal } from './components/volunteer/QRCodePassModal';
import { QRScannerModal } from './components/admin/QRScannerModal';
import { AuthModal } from './components/auth/AuthModal';
import type { VolunteerEvent, Signup } from './types';
import {
  Search,
  Plus,
  Users,
  Sparkles,
  ClipboardList,
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import './App.css';

const CATEGORIES = [
  { id: 'ALL', label: 'All Sectors' },
  { id: 'Environment', label: '🌱 Environment' },
  { id: 'Health & Relief', label: '🏥 Health & Relief' },
  { id: 'Community', label: '🤝 Community' },
  { id: 'Education', label: '🎓 Education' },
];

const MainApp: React.FC = () => {
  const { currentUser, events, signups = [], signUpForShift } = useVolunteer();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('events');
  const [selectedEvent, setSelectedEvent] = useState<VolunteerEvent | null>(null);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [activePassSignup, setActivePassSignup] = useState<Signup | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [guestBrowsing, setGuestBrowsing] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  // Filter events by search query and category safely
  const filteredEvents = events.filter((ev) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      ev.title.toLowerCase().includes(query) ||
      ev.description.toLowerCase().includes(query) ||
      (ev.location?.name && ev.location.name.toLowerCase().includes(query));

    const matchesCategory =
      categoryFilter === 'ALL' ? true : ev.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleSignUp = async (eventId: string, shiftId: string, roleId: string) => {
    if (signUpForShift) {
      await signUpForShift(eventId, shiftId, roleId);
    }
  };

  // Called after a successful login or sign-up.
  // VolunteerContext has already saved the real user from the server,
  // so this must NOT overwrite it. Just close the modal and start on a safe tab.
  const handleAuthSuccess = () => {
    setActiveTab('events');
    setSelectedEvent(null);
    setIsAuthOpen(false);
  };

  // SCREEN GATE 1: Initial Auth Landing View (When not logged in and not explicitly browsing as guest)
  if (!currentUser && !guestBrowsing) {
    return (
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Radial Glow */}
        <div
          style={{
            position: 'absolute',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37,99,235,0.25) 0%, rgba(15,23,42,0) 70%)',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '460px', width: '100%', textAlign: 'center', zIndex: 10 }}>
          {/* Brand Header */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              backgroundColor: '#2563eb',
              marginBottom: '1.25rem',
              boxShadow: '0 10px 25px -5px rgba(37,99,235,0.5)',
            }}
          >
            <HeartHandshake size={36} color="#ffffff" />
          </div>

          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
            Kindred
          </h1>
          <p style={{ fontSize: '1rem', color: '#94a3b8', marginBottom: '2rem', lineHeight: 1.5 }}>
            Volunteer Operations & Event Management Platform
          </p>

          {/* Action Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsAuthOpen(true)}
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '1rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                borderRadius: '8px',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              }}
            >
              <span>Log In or Sign Up</span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              onClick={() => setGuestBrowsing(true)}
              style={{
                background: 'transparent',
                border: '1px solid #334155',
                color: '#cbd5e1',
                padding: '0.75rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Explore Public Events as Guest
            </button>
          </div>

          {/* Key Features Pill */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              fontSize: '0.75rem',
              color: '#64748b',
              marginTop: '1rem',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <ShieldCheck size={14} color="#3b82f6" /> Secure Role Access
            </span>
            <span>•</span>
            <span>QR Entry Passes</span>
            <span>•</span>
            <span>Live Rosters</span>
          </div>
        </div>

        {/* Auth Modal Trigger */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  // SCREEN 2: Main Application Platform
  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCreateEvent={() => setIsCreateEventOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Hero Subbar */}
      <section className="app-hero">
        <div className="hero-inner">
          <div className="hero-text">
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(255, 255, 255, 0.15)',
                padding: '0.2rem 0.65rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              {currentUser ? (
                <>
                  <span>Welcome back,</span>
                  <strong style={{ color: '#fef08a' }}>{currentUser.name}</strong> (
                  {isAdmin ? 'Organizer / Admin' : 'Volunteer'})
                </>
              ) : (
                <>
                  <span>Browsing Mode:</span>
                  <strong style={{ color: '#93c5fd' }}>Guest Mode</strong>
                </>
              )}
            </div>
            <h1>Empowering Hands, Transforming Communities</h1>
            <p>
              {isAdmin
                ? 'Organizer Portal: Schedule multi-slot shifts, review verification queues, manage day-of attendance, and broadcast emergency updates.'
                : 'Volunteer Hub: Choose shift roles matching your strengths, track service hours, obtain entry QR passes, and earn verified participation certificates.'}
            </p>
          </div>

          <div className="hero-actions">
            {isAdmin ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsCreateEventOpen(true)}
                >
                  <Plus size={16} />
                  New Event
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('roster')}
                >
                  <ClipboardList size={16} />
                  Day-of Rosters
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setActiveTab('events')}
                >
                  <Search size={16} />
                  Explore Opportunities
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setActiveTab('dashboard')}
                >
                  <Sparkles size={16} />
                  My Passes & Hours
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main App Content Views */}
      <main className="main-content">
        {/* VIEW 1: EXPLORE EVENTS */}
        {activeTab === 'events' && (
          <div>
            <div className="section-header">
              <div>
                <h2 className="section-title">
                  <Users size={22} />
                  {isAdmin ? 'All Scheduled Events & Operations' : 'Available Community Events'}
                </h2>
                <p className="section-subtitle">
                  Browse opportunities with distinct morning/afternoon shifts and role-based allocations.
                </p>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsCreateEventOpen(true)}
                >
                  <Plus size={16} />
                  Create New Event
                </button>
              )}
            </div>

            {/* Search & Category Filter Toolbar */}
            <div className="filter-bar">
              <div className="search-box">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search events by title, description, or venue location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`filter-pill ${categoryFilter === cat.id ? 'active' : ''}`}
                    onClick={() => setCategoryFilter(cat.id)}
                  >
                    {cat.id === 'ALL' ? `${cat.label} (${events.length})` : cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Events Grid */}
            {filteredEvents.length === 0 ? (
              <div
                style={{
                  padding: '3.5rem',
                  textAlign: 'center',
                  color: 'var(--slate-400)',
                  background: '#fff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                }}
              >
                No events found matching your search query. Try clearing the filter.
              </div>
            ) : (
              <div className="events-grid">
                {filteredEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onSelect={(ev) => setSelectedEvent(ev)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 2: CALENDAR & ICAL */}
        {activeTab === 'calendar' && (
          <EventCalendarView onSelectEvent={(ev) => setSelectedEvent(ev)} />
        )}

        {/* VIEW 3: VOLUNTEER DASHBOARD */}
        {activeTab === 'dashboard' && currentUser && <VolunteerDashboard />}

        {/* VIEW 4: ADMIN VERIFICATION QUEUE */}
        {activeTab === 'verification' && isAdmin && <VerificationQueue />}

        {/* VIEW 5: ATTENDANCE & ROSTERS */}
        {activeTab === 'roster' && isAdmin && <AttendanceRoster />}

        {/* VIEW 6: QR SCANNER (ADMIN) */}
        {activeTab === 'scanner' && isAdmin && (
          <QRScannerModal isOpen={true} onClose={() => setActiveTab('events')} />
        )}

        {/* VIEW 7: BROADCAST ALERTS (ADMIN) */}
        {activeTab === 'broadcast' && isAdmin && (
          <AdminDashboard
            onOpenCreateEvent={() => setIsCreateEventOpen(true)}
            onSelectEvent={(ev) => setSelectedEvent(ev)}
          />
        )}
      </main>

      {/* Modals */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        currentUser={currentUser}
        signups={signups}
        onSignUp={handleSignUp}
        onViewPass={(signup) => setActivePassSignup(signup)}
      />

      <EventFormModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
      />

      <QRCodePassModal
        signup={activePassSignup}
        isOpen={Boolean(activePassSignup)}
        onClose={() => setActivePassSignup(null)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleAuthSuccess}
      />

      {/* Floating Notifications */}
      <NotificationToast />
    </div>
  );
};

export function App() {
  return (
    <VolunteerProvider>
      <MainApp />
    </VolunteerProvider>
  );
}

export default App;