import React from 'react';
import { useVolunteer } from '../../context/VolunteerContext';
import {
  Sparkles,
  Award,
  Medal,
  Trophy,
  HeartPulse,
  Boxes,
  Users,
  Lock,
} from 'lucide-react';

interface BadgesGridProps {
  userBadges: string[];
}

export const BadgesGrid: React.FC<BadgesGridProps> = ({ userBadges }) => {
  const { badges, currentUser } = useVolunteer();

  const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles size={26} />;
      case 'Award':
        return <Award size={26} />;
      case 'Medal':
        return <Medal size={26} />;
      case 'Trophy':
        return <Trophy size={26} />;
      case 'HeartPulse':
        return <HeartPulse size={26} />;
      case 'Boxes':
        return <Boxes size={26} />;
      default:
        return <Users size={26} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--slate-900)' }}>
          Badges & Achievement Milestones
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--slate-500)' }}>
          Unlock special recognition as you complete shifts, log service hours, and lead specialized roles.
        </p>
      </div>

      <div className="badges-container">
        {badges.map((badge) => {
          const isUnlocked = userBadges.includes(badge.id);

          return (
            <div
              key={badge.id}
              className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
            >
              <div
                className="badge-icon-wrap"
                style={{
                  backgroundColor: isUnlocked ? 'var(--amber-100)' : 'var(--slate-200)',
                  color: isUnlocked ? 'var(--amber-700)' : 'var(--slate-500)',
                }}
              >
                {getBadgeIcon(badge.icon)}
              </div>

              <div className="badge-name">{badge.title}</div>
              <div className="badge-desc">{badge.description}</div>

              <div style={{ marginTop: 'auto' }}>
                {isUnlocked ? (
                  <span className="badge-tag">
                    ★ Unlocked
                  </span>
                ) : (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--slate-500)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Lock size={11} />
                    {badge.unit === 'hours'
                      ? `${currentUser.totalHoursLogged} / ${badge.requiredCount} Hours`
                      : 'Requires Event Criteria'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
