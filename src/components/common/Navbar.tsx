import React, { useState, useRef, useEffect } from 'react';
import { useVolunteer } from '../../context/VolunteerContext';
import {
  Calendar as CalendarIcon,
  Users,
  ShieldCheck,
  ClipboardList,
  QrCode,
  Radio,
  Sparkles,
  Bell,
  HeartHandshake,
  LogIn,
  LogOut,
  PlusCircle,
  ChevronDown,
  Briefcase,
  User,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateEvent?: () => void;
  onOpenAuth?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenCreateEvent,
  onOpenAuth,
}) => {
  const {
    currentUser,
    logout,
    signups = [],
    announcements = [],
  } = useVolunteer();

  const [showAdminDropdown, setShowAdminDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAnnouncementsDropdown, setShowAnnouncementsDropdown] = useState(false);

  const adminDropdownRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const announcementsDropdownRef = useRef<HTMLDivElement>(null);

  const pendingApprovalsCount = (signups || []).filter((s) => s.status === 'pending_approval').length;
  const isAdmin = currentUser?.role === 'admin';
  const isAdminTabActive = ['verification', 'roster', 'scanner', 'broadcast'].includes(activeTab);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target as Node)) {
        setShowAdminDropdown(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (announcementsDropdownRef.current && !announcementsDropdownRef.current.contains(event.target as Node)) {
        setShowAnnouncementsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const displayName = currentUser?.name || currentUser?.email || 'User';
  const initialLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      <div className="navbar-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem', width: '100%' }}>
        
        {/* Brand Logo */}
        <div 
          className="brand-section" 
          onClick={() => setActiveTab('events')}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
        >
          <div className="brand-icon" style={{ backgroundColor: '#2563eb', color: '#fff', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
            <HeartHandshake size={24} />
          </div>
          <div>
            <div className="brand-title" style={{ fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.2 }}>Kindred</div>
            <div className="brand-subtitle" style={{ fontSize: '0.75rem', color: '#64748b' }}>Volunteer Operations Platform</div>
          </div>
        </div>

        {/* Categorized Center Navigation */}
        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {/* Main Hub Link */}
          <button
            type="button"
            className={`nav-item ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            <Users size={16} />
            {isAdmin ? 'Events Hub' : 'Explore Events'}
          </button>

          {/* Calendar Link */}
          <button
            type="button"
            className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon size={16} />
            Calendar & iCal
          </button>

          {/* Volunteer Shifts Link */}
          {!isAdmin && currentUser && (
            <button
              type="button"
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <Sparkles size={16} />
              My Shifts & Badges
            </button>
          )}

          {/* Admin Operations Dropdown */}
          {isAdmin && (
            <div ref={adminDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                className={`nav-item ${isAdminTabActive ? 'active' : ''}`}
                onClick={() => setShowAdminDropdown((prev) => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Briefcase size={16} />
                <span>Organizer Suite</span>
                {pendingApprovalsCount > 0 && (
                  <span className="nav-badge" style={{ backgroundColor: '#f43f5e', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px', fontWeight: 700 }}>
                    {pendingApprovalsCount}
                  </span>
                )}
                <ChevronDown size={14} style={{ transform: showAdminDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </button>

              {showAdminDropdown && (
                <div style={{ position: 'absolute', top: '125%', left: 0, width: '230px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', padding: '0.5rem', zIndex: 2000, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <button
                    type="button"
                    className={`dropdown-item ${activeTab === 'verification' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('verification'); setShowAdminDropdown(false); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.75rem', borderRadius: '6px', border: 'none', background: activeTab === 'verification' ? '#eff6ff' : 'transparent', color: activeTab === 'verification' ? '#2563eb' : '#334155', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ShieldCheck size={16} color="#2563eb" /> Verification Queue
                    </span>
                    {pendingApprovalsCount > 0 && (
                      <span style={{ backgroundColor: '#f43f5e', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.35rem', borderRadius: '8px', fontWeight: 700 }}>
                        {pendingApprovalsCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    className={`dropdown-item ${activeTab === 'roster' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('roster'); setShowAdminDropdown(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '6px', border: 'none', background: activeTab === 'roster' ? '#eff6ff' : 'transparent', color: activeTab === 'roster' ? '#2563eb' : '#334155', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <ClipboardList size={16} color="#059669" /> Attendance & Rosters
                  </button>

                  <button
                    type="button"
                    className={`dropdown-item ${activeTab === 'scanner' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('scanner'); setShowAdminDropdown(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '6px', border: 'none', background: activeTab === 'scanner' ? '#eff6ff' : 'transparent', color: activeTab === 'scanner' ? '#2563eb' : '#334155', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <QrCode size={16} color="#d97706" /> QR Scanner
                  </button>

                  <button
                    type="button"
                    className={`dropdown-item ${activeTab === 'broadcast' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('broadcast'); setShowAdminDropdown(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: '6px', border: 'none', background: activeTab === 'broadcast' ? '#eff6ff' : 'transparent', color: activeTab === 'broadcast' ? '#2563eb' : '#334155', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}
                  >
                    <Radio size={16} color="#dc2626" /> Broadcast Alerts
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          
          {/* Create Event Button (Admins) */}
          {isAdmin && onOpenCreateEvent && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenCreateEvent}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.85rem', fontWeight: 600, borderRadius: '8px' }}
            >
              <PlusCircle size={16} />
              <span>Create Event</span>
            </button>
          )}

          {/* Announcements Bell */}
          <div ref={announcementsDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn-icon"
              title="Broadcast Announcements"
              onClick={() => setShowAnnouncementsDropdown((prev) => !prev)}
              style={{ position: 'relative', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.55rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Bell size={18} color="#475569" />
              {(announcements || []).length > 0 && (
                <span style={{ position: 'absolute', top: '2px', right: '2px', width: '9px', height: '9px', backgroundColor: '#f43f5e', borderRadius: '50%', border: '2px solid #fff' }} />
              )}
            </button>

            {showAnnouncementsDropdown && (
              <div style={{ position: 'absolute', right: 0, top: '130%', width: '300px', backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.15)', padding: '0.85rem', zIndex: 2000 }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', color: '#0f172a' }}>
                  Broadcast Alerts ({(announcements || []).length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {(announcements || []).length === 0 ? (
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '0.5rem' }}>
                      No announcements broadcasted yet.
                    </div>
                  ) : (
                    (announcements || []).map((anc) => (
                      <div key={anc.id} style={{ padding: '0.6rem', borderRadius: '6px', backgroundColor: '#f8fafc', fontSize: '0.75rem', borderLeft: '3px solid #2563eb' }}>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{anc.title}</div>
                        <div style={{ color: '#475569', marginTop: '0.25rem' }}>{anc.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown Menu */}
          {currentUser ? (
            <div ref={userDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowUserDropdown((prev) => !prev)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.35rem 0.65rem 0.35rem 0.35rem', borderRadius: '30px', cursor: 'pointer', transition: 'background-color 0.2s ease' }}
              >
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: currentUser.role === 'admin' ? '#dc2626' : '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                  {initialLetter}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.15 }}>
                  <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#0f172a', maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {displayName}
                  </span>
                  <span style={{ fontSize: '0.675rem', color: currentUser.role === 'admin' ? '#dc2626' : '#2563eb', fontWeight: 600 }}>
                    {currentUser.role === 'admin' ? 'Organizer / Admin' : 'Volunteer'}
                  </span>
                </div>
                <ChevronDown size={14} color="#64748b" style={{ transform: showUserDropdown ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }} />
              </button>

              {/* User Dropdown Menu Card */}
              {showUserDropdown && (
                <div style={{ position: 'absolute', right: 0, top: '125%', width: '240px', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', padding: '0.75rem', zIndex: 2000 }}>
                  <div style={{ paddingBottom: '0.65rem', marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>{displayName}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>{currentUser.email}</div>
                  </div>

                  {!isAdmin && (
                    <button
                      type="button"
                      onClick={() => { setActiveTab('dashboard'); setShowUserDropdown(false); }}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 0.65rem', borderRadius: '6px', border: 'none', background: 'transparent', color: '#334155', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600, textAlign: 'left', marginBottom: '0.25rem' }}
                    >
                      <User size={15} color="#2563eb" />
                      <span>My Profile & Hours</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.65rem', borderRadius: '6px', border: 'none', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 700, textAlign: 'left', marginTop: '0.25rem' }}
                  >
                    <LogOut size={15} color="#dc2626" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            onOpenAuth && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onOpenAuth}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.5rem 0.85rem' }}
              >
                <LogIn size={15} />
                <span>Log In / Sign Up</span>
              </button>
            )
          )}

        </div>
      </div>
    </header>
  );
};