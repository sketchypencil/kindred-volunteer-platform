import React from 'react';
import { useVolunteer } from '../../context/VolunteerContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, signups, events } = useVolunteer();

  if (!isOpen || !currentUser) return null;

  // Filter signups for the logged-in user
  const userSignups = signups.filter(
    (s) => String(s.userId) === String(currentUser.id)
  );

  // Safely calculate hours per shift
  const calculateShiftHours = (shift: any) => {
    if (shift?.hours) return Number(shift.hours);
    if (shift?.startTime && shift?.endTime) {
      const [h1, m1] = String(shift.startTime).split(':').map(Number);
      const [h2, m2] = String(shift.endTime).split(':').map(Number);
      if (!isNaN(h1) && !isNaN(h2)) {
        const diff = (h2 * 60 + (m2 || 0)) - (h1 * 60 + (m1 || 0));
        return diff > 0 ? diff / 60 : 4;
      }
    }
    return 4;
  };

  // Safely format event location whether string or object
  const getLocationString = (location: any): string => {
    if (!location) return 'Remote / On-site';
    if (typeof location === 'string') return location;
    if (typeof location === 'object') {
      return location.name || location.address || 'Remote / On-site';
    }
    return 'Remote / On-site';
  };

  let totalHoursEarned = 0;
  let totalHoursRegistered = 0;

  const projectHistory = userSignups.map((signup) => {
    const event = events.find((e) => String(e.id) === String(signup.eventId));
    const shift = event?.shifts?.find((s) => String(s.id) === String(signup.shiftId));
    const role = shift?.roles?.find((r) => String(r.id) === String(signup.roleId));
    const hours = calculateShiftHours(shift);

    if (signup.status === 'attended' || signup.status === 'confirmed') {
      totalHoursEarned += hours;
    }
    if (signup.status !== 'canceled') {
      totalHoursRegistered += hours;
    }

    const roleTitle =
      (role as any)?.title ||
      (role as any)?.name ||
      (role as any)?.roleName ||
      'Volunteer Participant';

    const shiftName = shift?.title || (shift as any)?.name || 'Standard Shift';
    const rawDate = (signup as any).signupDate || (signup as any).createdAt;

    return {
      signupId: signup.id,
      eventTitle: event?.title || 'Volunteer Project',
      category: event?.category || 'Community',
      location: getLocationString(event?.location),
      roleTitle,
      shiftName,
      status: signup.status,
      hours,
      signupDate: rawDate ? new Date(rawDate).toLocaleDateString() : 'Recently',
    };
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'attended':
      case 'confirmed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending_approval':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'waitlisted':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'canceled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden border border-slate-100 transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md text-white font-bold text-2xl flex items-center justify-center border-2 border-white/30 shadow-inner">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentUser.name}</h2>
              <p className="text-indigo-100 text-sm">{currentUser.email}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white">
                {(currentUser.role || 'Volunteer').toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 border-b border-slate-100">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hours Earned</p>
            <p className="text-2xl font-extrabold text-indigo-600 mt-1">{totalHoursEarned} hrs</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Signed Up</p>
            <p className="text-2xl font-extrabold text-purple-600 mt-1">{userSignups.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Est. Total Hours</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{totalHoursRegistered} hrs</p>
          </div>
        </div>

        {/* History List */}
        <div className="p-6 max-h-80 overflow-y-auto">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Volunteering Projects & Shifts</h3>

          {projectHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p className="text-sm">You haven't signed up for any volunteer projects yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projectHistory.map((item) => (
                <div
                  key={item.signupId}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 transition bg-white flex items-center justify-between shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{item.eventTitle}</span>
                      <span className="text-xs text-slate-400">• {item.category}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium text-slate-700">{item.roleTitle}</span> ({item.shiftName})
                    </p>
                    <p className="text-xs text-slate-400">📍 {item.location}</p>
                  </div>

                  <div className="text-right flex flex-col items-end space-y-1.5">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${getStatusBadge(
                        item.status
                      )}`}
                    >
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      ⏱ {item.hours} hrs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium text-sm transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};