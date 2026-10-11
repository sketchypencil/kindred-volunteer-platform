import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import type {
  User,
  VolunteerEvent,
  Signup,
  SignupStatus,
  ResourceItem,
  BroadcastAlert,
  DiscussionComment,
  Badge,
  NotificationToast,
  DiscussionCategory,
  EventStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_EVENTS,
  INITIAL_SIGNUPS,
  INITIAL_RESOURCES,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_DISCUSSIONS,
  INITIAL_BADGES,
} from '../mock/initialData';

const API_BASE = 'http://localhost:5000/api';

interface VolunteerContextType {
  currentUser: User | null;
  users: User[];
  events: VolunteerEvent[];
  signups: Signup[];
  resources: ResourceItem[];
  announcements: BroadcastAlert[];
  discussions: DiscussionComment[];
  badges: Badge[];
  toasts: NotificationToast[];
  setCurrentUserById: (userId: string | null) => void;
  setCurrentUser: (user: any) => void;
  registerUser: (data: any) => Promise<{ success: boolean; message?: string; user?: User }>;
  loginUser: (email: string, password: string) => Promise<{ success: boolean; message?: string; user?: User }>;
  logout: () => void;
  signUpForShift: (
    eventId: string,
    shiftId: string,
    roleId: string,
    notes?: string
  ) => Promise<{ success: boolean; status: SignupStatus; message: string }>;
  cancelSignup: (signupId: string) => void;
  approveSignup: (signupId: string) => void;
  rejectSignup: (signupId: string, reason?: string) => void;
  updateAttendanceStatus: (signupId: string, status: SignupStatus) => void;
  checkInWithQrToken: (
    token: string
  ) => { success: boolean; signup?: Signup; message: string };
  createEvent: (eventData: Omit<VolunteerEvent, 'id'>) => string;
  updateEvent: (event: VolunteerEvent) => void;
  markEventStatus: (eventId: string, status: EventStatus) => void;
  addResource: (resource: Omit<ResourceItem, 'id' | 'uploadedAt'>) => void;
  deleteResource: (resourceId: string) => void;
  broadcastAnnouncement: (
    data: Omit<BroadcastAlert, 'id' | 'sentAt'>
  ) => void;
  postComment: (
    eventId: string,
    message: string,
    category: DiscussionCategory
  ) => void;
  likeComment: (commentId: string) => void;
  removeToast: (toastId: string) => void;
  addToast: (
    title: string,
    message: string,
    type?: 'info' | 'success' | 'warning' | 'alert'
  ) => void;
  resetToDefaultData: () => void;
}

const STORAGE_KEY_PREFIX = 'intprog_volunteer_';

function getInitialStorageData<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch (err) {
    console.error(`Failed to parse ${key} from LocalStorage:`, err);
    return fallback;
  }
}

const VolunteerContext = createContext<VolunteerContextType | undefined>(undefined);

export const VolunteerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() =>
    getInitialStorageData('users', INITIAL_USERS)
  );

  const [currentUser, setCurrentUserState] = useState<User | null>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}currentUser`);
    return saved ? JSON.parse(saved) : null;
  });

  const [events, setEvents] = useState<VolunteerEvent[]>(() =>
    getInitialStorageData('events', INITIAL_EVENTS)
  );

  const [signups, setSignups] = useState<Signup[]>(() =>
    getInitialStorageData('signups', INITIAL_SIGNUPS)
  );

  const [resources, setResources] = useState<ResourceItem[]>(() =>
    getInitialStorageData('resources', INITIAL_RESOURCES)
  );

  const [announcements, setAnnouncements] = useState<BroadcastAlert[]>(() =>
    getInitialStorageData('announcements', INITIAL_ANNOUNCEMENTS)
  );

  const [discussions, setDiscussions] = useState<DiscussionComment[]>(() =>
    getInitialStorageData('discussions', INITIAL_DISCUSSIONS)
  );

  const [badges] = useState<Badge[]>(INITIAL_BADGES);
  const [toasts, setToasts] = useState<NotificationToast[]>([]);

  // Sync Data with Express MySQL Backend on initial render
  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const [eventsRes, signupsRes, announcementsRes] = await Promise.all([
          axios.get(`${API_BASE}/events`),
          axios.get(`${API_BASE}/signups`),
          axios.get(`${API_BASE}/announcements`),
        ]);

        if (Array.isArray(eventsRes.data)) setEvents(eventsRes.data);
        if (Array.isArray(signupsRes.data)) setSignups(signupsRes.data);
        if (Array.isArray(announcementsRes.data)) setAnnouncements(announcementsRes.data);
      } catch (error) {
        console.warn('Backend unavailable, falling back to cached local storage data.');
      }
    };

    fetchBackendData();
  }, []);


  // Sync state changes to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}currentUser`, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}currentUser`);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}signups`, JSON.stringify(signups));
  }, [signups]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}events`, JSON.stringify(events));
  }, [events]);

  const logout = () => {
    setCurrentUserState(null);
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}currentUser`);
    addToast('Logged Out', 'You have been logged out successfully.', 'info');
  };

  const setCurrentUser = (user: any) => {
    if (user) {
      setUsers((prev) => {
        const exists = prev.some(
          (u) => String(u.id) === String(user.id) || u.email?.toLowerCase() === user.email?.toLowerCase()
        );
        if (!exists) return [...prev, user];
        return prev;
      });
    }
    setCurrentUserState(user);
  };

  const registerUser = async (data: any) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, data);
      const result = response.data;

      setCurrentUser(result.user);
      addToast('Welcome to Kindred!', `Account created for ${result.user.name}`, 'success');
      return { success: true, user: result.user as User };
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (axios.isAxiosError(err) ? 'Cannot reach the server. Please try again.' : err.message);
      addToast('Registration Error', message, 'alert');
      return { success: false, message };
    }
  };

  const loginUser = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      const result = response.data;

      // result.user comes straight from the database, including the real role
      setCurrentUser(result.user);
      addToast('Logged In', `Welcome back, ${result.user.name}!`, 'success');
      return { success: true, user: result.user as User };
    } catch (err: any) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.message ||
        (axios.isAxiosError(err) ? 'Cannot reach the server. Please try again.' : err.message);
      addToast('Login Failed', message, 'alert');
      return { success: false, message };
    }
  };

  const setCurrentUserById = (userId: string | null) => {
    if (!userId) {
      logout();
      return;
    }
    const target = users.find((u) => String(u.id) === String(userId));
    if (target) {
      setCurrentUser(target);
      addToast('Profile Switched', `Logged in as ${target.name} (${target.role.toUpperCase()})`, 'info');
    }
  };

  const addToast = (
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'alert' = 'info'
  ) => {
    const newToast: NotificationToast = {
      id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      message,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
    };
    setToasts((prev) => [newToast, ...prev].slice(0, 8));
  };

  const removeToast = (toastId: string) => {
    setToasts((prev) => prev.filter((t) => String(t.id) !== String(toastId)));
  };

  const signUpForShift = async (
    eventId: string,
    shiftId: string,
    roleId: string,
    notes?: string
  ): Promise<{ success: boolean; status: SignupStatus; message: string }> => {
    if (!currentUser) {
      return { success: false, status: 'canceled', message: 'Please log in to sign up for a shift.' };
    }

    // 1. Locate Target Event, Shift, and Role
    const targetEvent = events.find((e) => String(e.id) === String(eventId));
    const targetShift = targetEvent?.shifts?.find((s) => String(s.id) === String(shiftId));
    const targetRole = targetShift?.roles?.find((r) => String(r.id) === String(roleId));

    // 2. Calculate Current Active Enrollments for this Role
    const existingRoleSignups = signups.filter(
      (s) =>
        String(s.eventId) === String(eventId) &&
        String(s.shiftId) === String(shiftId) &&
        String(s.roleId) === String(roleId) &&
        s.status !== 'canceled'
    );

    const filledCapacity = existingRoleSignups.filter(
      (s) => s.status === 'confirmed' || s.status === 'attended' || s.status === 'pending_approval'
    ).length;

    // 3. Determine Correct Signup Status
    let computedStatus: SignupStatus = 'confirmed';
    if (targetRole && filledCapacity >= targetRole.capacity) {
      computedStatus = 'waitlisted';
    } else if (targetRole?.requiresApproval) {
      computedStatus = 'pending_approval';
    }

    // 4. Fallback Client Signup Object (double type assertion safely bypasses TS2352)
    const fallbackSignup: Signup = {
      id: `signup-${Date.now()}`,
      eventId: String(eventId),
      shiftId: String(shiftId),
      roleId: String(roleId),
      userId: String(currentUser.id),
      userName: currentUser.name,
      userEmail: currentUser.email,
      status: computedStatus,
      notes: notes || '',
      qrCodeToken: `QR-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      waitlistPosition:
        computedStatus === 'waitlisted'
          ? existingRoleSignups.filter((s) => s.status === 'waitlisted').length + 1
          : undefined,
    } as unknown as Signup;

    let finalSignup: Signup = fallbackSignup;

    try {
      const response = await axios.post(`${API_BASE}/signups`, {
        eventId,
        shiftId,
        roleId,
        notes,
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        status: computedStatus,
      });

      const resData = response.data;
      // The server replies with { signupId, status, waitlistPosition, qrCodeToken }
      if (resData && (resData.signupId || resData.id)) {
        finalSignup = {
          ...fallbackSignup,
          id: String(resData.signupId || resData.id),
          status: resData.status || computedStatus,
          qrCodeToken: resData.qrCodeToken || fallbackSignup.qrCodeToken,
          waitlistPosition: resData.waitlistPosition ?? fallbackSignup.waitlistPosition,
        };
      }
    } catch (err) {
      console.warn('Backend server unavailable. Updating local state.');
    }

    // 5. Update React Context State
    setSignups((prev) => [finalSignup, ...prev]);

    // 6. Display Contextual Toast based on evaluated status
    if (finalSignup.status === 'pending_approval') {
      addToast('Application Submitted!', 'Your request is pending organizer approval.', 'info');
      return { success: true, status: 'pending_approval', message: 'Application submitted! Pending approval.' };
    } else if (finalSignup.status === 'waitlisted') {
      addToast('Added to Waitlist', 'This shift is full. You are on the waitlist.', 'warning');
      return { success: true, status: 'waitlisted', message: 'Added to waitlist.' };
    } else {
      addToast('Shift Confirmed!', 'You are signed up for this shift!', 'success');
      return { success: true, status: 'confirmed', message: 'Shift confirmed!' };
    }
  };

  const cancelSignup = (signupId: string) => {
    const target = signups.find((s) => String(s.id) === String(signupId));
    if (!target) return;

    setSignups((prev) =>
      prev.map((s) => (String(s.id) === String(signupId) ? { ...s, status: 'canceled' as SignupStatus } : s))
    );
    addToast('Registration Canceled', `Canceled registration for ${target.userName}.`, 'info');
  };

  const approveSignup = (signupId: string) => {
    setSignups((prev) =>
      prev.map((s) => (String(s.id) === String(signupId) ? { ...s, status: 'confirmed' } : s))
    );
    const approved = signups.find((s) => String(s.id) === String(signupId));
    if (approved) {
      addToast('Volunteer Approved', `${approved.userName} has been confirmed.`, 'success');
    }
  };

  const rejectSignup = (signupId: string) => {
    cancelSignup(signupId);
  };

  const updateAttendanceStatus = (signupId: string, newStatus: SignupStatus) => {
    setSignups((prev) =>
      prev.map((s) => (String(s.id) === String(signupId) ? { ...s, status: newStatus } : s))
    );
  };

  const checkInWithQrToken = (token: string) => {
    const cleanToken = token.trim();
    const targetSignup = signups.find(
      (s) => s.qrCodeToken?.toLowerCase() === cleanToken.toLowerCase()
    );

    if (!targetSignup) {
      return { success: false, message: `Invalid or unrecognized QR token.` };
    }

    updateAttendanceStatus(targetSignup.id, 'attended');
    return { success: true, signup: targetSignup, message: `Welcome ${targetSignup.userName}!` };
  };

  const createEvent = (eventData: Omit<VolunteerEvent, 'id'>): string => {
    const id = `evt-${Date.now()}`;
    const newEvent: VolunteerEvent = { ...eventData, id };
    setEvents((prev) => [newEvent, ...prev]);
    return id;
  };

  const updateEvent = (updated: VolunteerEvent) => {
    setEvents((prev) => prev.map((e) => (String(e.id) === String(updated.id) ? updated : e)));
  };

  const markEventStatus = (eventId: string, status: EventStatus) => {
    setEvents((prev) => prev.map((e) => (String(e.id) === String(eventId) ? { ...e, status } : e)));
  };

  const addResource = (data: Omit<ResourceItem, 'id' | 'uploadedAt'>) => {
    const item: ResourceItem = { ...data, id: `res-${Date.now()}`, uploadedAt: new Date().toISOString() };
    setResources((prev) => [item, ...prev]);
  };

  const deleteResource = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => String(r.id) !== String(resourceId)));
  };

  const broadcastAnnouncement = (data: Omit<BroadcastAlert, 'id' | 'sentAt'>) => {
    const alert: BroadcastAlert = { ...data, id: `anc-${Date.now()}`, sentAt: new Date().toISOString() };
    setAnnouncements((prev) => [alert, ...prev]);
  };

  const postComment = (eventId: string, message: string, category: DiscussionCategory) => {
    if (!currentUser) return;
    const comment: DiscussionComment = {
      id: `dsc-${Date.now()}`,
      eventId: String(eventId),
      userId: String(currentUser.id),
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      message,
      category,
      createdAt: new Date().toISOString(),
      likes: 0,
    };
    setDiscussions((prev) => [...prev, comment]);
  };

  const likeComment = (commentId: string) => {
    setDiscussions((prev) =>
      prev.map((c) => (String(c.id) === String(commentId) ? { ...c, likes: c.likes + 1 } : c))
    );
  };

  const resetToDefaultData = () => {
    localStorage.clear();
    setUsers(INITIAL_USERS);
    setCurrentUserState(null);
    setEvents(INITIAL_EVENTS);
    setSignups(INITIAL_SIGNUPS);
    setResources(INITIAL_RESOURCES);
    setAnnouncements(INITIAL_ANNOUNCEMENTS);
    setDiscussions(INITIAL_DISCUSSIONS);
    setToasts([]);
  };

  return (
    <VolunteerContext.Provider
      value={{
        currentUser,
        users,
        events,
        signups,
        resources,
        announcements,
        discussions,
        badges,
        toasts,
        setCurrentUserById,
        setCurrentUser,
        registerUser,
        loginUser,
        logout,
        signUpForShift,
        cancelSignup,
        approveSignup,
        rejectSignup,
        updateAttendanceStatus,
        checkInWithQrToken,
        createEvent,
        updateEvent,
        markEventStatus,
        addResource,
        deleteResource,
        broadcastAnnouncement,
        postComment,
        likeComment,
        removeToast,
        addToast,
        resetToDefaultData,
      }}
    >
      {children}
    </VolunteerContext.Provider>
  );
};

export const useVolunteer = () => {
  const context = useContext(VolunteerContext);
  if (!context) {
    throw new Error('useVolunteer must be used within a VolunteerProvider');
  }
  return context;
};