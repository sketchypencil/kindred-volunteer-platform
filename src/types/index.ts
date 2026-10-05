export type UserRole = 'admin' | 'volunteer';

export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar: string;
  emergencyContact: EmergencyContact;
  skills: string[];
  totalHoursLogged: number;
  badges: string[]; // Badge IDs
  bio?: string;
}

export interface ShiftRole {
  id: string;
  name: string;
  description: string;
  capacity: number;
  requiresApproval: boolean;
  skillsSuggested?: string[];
}

export interface Shift {
  id: string;
  eventId: string;
  title: string;
  startTime: string; // e.g. "08:00 AM"
  endTime: string;   // e.g. "12:00 PM"
  date: string;      // e.g. "2026-10-15"
  hours: number;     // e.g. 4
  roles: ShiftRole[];
}

export type SignupStatus =
  | 'confirmed'
  | 'pending_approval'
  | 'waitlisted'
  | 'attended'
  | 'no_show'
  | 'canceled';

export interface Signup {
  id: string;
  eventId: string;
  shiftId: string;
  roleId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  emergencyContact: EmergencyContact;
  status: SignupStatus;
  waitlistPosition?: number;
  qrCodeToken: string; // e.g. "VOL-EVT1-SH1-U1-9876"
  registeredAt: string;
  checkedInAt?: string;
  notes?: string;
}

export type ResourceType = 'document' | 'slide' | 'map' | 'waiver' | 'guideline';

export interface ResourceItem {
  id: string;
  eventId: string;
  title: string;
  type: ResourceType;
  url: string;
  description: string;
  fileSize: string;
  isPinned: boolean;
  uploadedAt: string;
}

export type AlertUrgency = 'normal' | 'urgent' | 'critical';

export interface BroadcastAlert {
  id: string;
  eventId: string;
  eventTitle: string;
  title: string;
  message: string;
  urgency: AlertUrgency;
  sentAt: string;
  sentBy: string;
  channels: ('in_app' | 'email')[];
}

export type DiscussionCategory = 'General' | 'Carpool' | 'Question' | 'Logistics';

export interface DiscussionComment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userRole: UserRole;
  message: string;
  category: DiscussionCategory;
  createdAt: string;
  likes: number;
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: 'hours' | 'events' | 'specialty' | 'milestone';
  icon: string;
  requiredCount: number;
  unit: 'hours' | 'events' | 'action';
}

export type EventCategory =
  | 'Community'
  | 'Environment'
  | 'Health & Relief'
  | 'Education'
  | 'Arts & Culture';

export type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'canceled';

export interface VolunteerEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  location: {
    name: string;
    address: string;
    mapUrl?: string;
  };
  startDate: string;
  endDate: string;
  status: EventStatus;
  organizer: {
    name: string;
    email: string;
    organization: string;
  };
  coverImage: string;
  shifts: Shift[];
  requiresVerification: boolean;
}

export interface NotificationToast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  read: boolean;
}
