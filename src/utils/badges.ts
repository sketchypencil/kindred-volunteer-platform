import type { Badge, Signup, VolunteerEvent } from '../types';

export function calculateEarnedBadges(
  allBadges: Badge[],
  userSignups: Signup[],
  events: VolunteerEvent[],
  totalHours: number
): { earnedBadgeIds: string[]; newlyEarned: Badge[] } {
  const attendedSignups = userSignups.filter((s) => s.status === 'attended');
  const uniqueAttendedEventIds = new Set(attendedSignups.map((s) => s.eventId));

  // Check roles attended
  const attendedRoles: string[] = [];
  attendedSignups.forEach((s) => {
    const event = events.find((e) => e.id === s.eventId);
    const shift = event?.shifts.find((sh) => sh.id === s.shiftId);
    const role = shift?.roles.find((r) => r.id === s.roleId);
    if (role) {
      attendedRoles.push(role.name.toLowerCase());
    }
  });

  const earnedIds: string[] = [];

  allBadges.forEach((badge) => {
    let earned = false;

    if (badge.id === 'b1' && attendedSignups.length >= 1) {
      earned = true;
    } else if (badge.id === 'b2' && totalHours >= 5) {
      earned = true;
    } else if (badge.id === 'b3' && totalHours >= 10) {
      earned = true;
    } else if (badge.id === 'b4' && totalHours >= 25) {
      earned = true;
    } else if (badge.id === 'b5') {
      // First Responder
      earned = attendedRoles.some((r) => r.includes('first aid') || r.includes('medical') || r.includes('safety'));
    } else if (badge.id === 'b6') {
      // Logistics
      earned = attendedRoles.some((r) => r.includes('logistics') || r.includes('gear') || r.includes('setup'));
    } else if (badge.id === 'b7' && uniqueAttendedEventIds.size >= 3) {
      earned = true;
    }

    if (earned) {
      earnedIds.push(badge.id);
    }
  });

  return {
    earnedBadgeIds: earnedIds,
    newlyEarned: allBadges.filter((b) => earnedIds.includes(b.id)),
  };
}
