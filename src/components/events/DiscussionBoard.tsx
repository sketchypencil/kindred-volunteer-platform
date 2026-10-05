import React, { useState } from 'react';
import type { DiscussionCategory } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import { MessageSquare, Heart, Send, Car, HelpCircle, Box, Users } from 'lucide-react';

interface DiscussionBoardProps {
  eventId: string;
}

export const DiscussionBoard: React.FC<DiscussionBoardProps> = ({ eventId }) => {
  const { discussions, postComment, likeComment } = useVolunteer();
  const [newComment, setNewComment] = useState('');
  const [category, setCategory] = useState<DiscussionCategory>('General');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const eventComments = discussions.filter((d) => d.eventId === eventId);
  const filteredComments =
    filterCategory === 'ALL'
      ? eventComments
      : eventComments.filter((c) => c.category === filterCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    postComment(eventId, newComment.trim(), category);
    setNewComment('');
  };

  const getCategoryIcon = (cat: DiscussionCategory) => {
    switch (cat) {
      case 'Carpool':
        return <Car size={12} />;
      case 'Question':
        return <HelpCircle size={12} />;
      case 'Logistics':
        return <Box size={12} />;
      default:
        return <Users size={12} />;
    }
  };

  return (
    <div className="discussion-board">
      {/* Filter tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Team Activity Feed & Discussions
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Coordinate carpools, ask questions, or connect with fellow shift members.
          </p>
        </div>

        <div className="filter-pills">
          <button
            type="button"
            className={`filter-pill ${filterCategory === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilterCategory('ALL')}
          >
            All ({eventComments.length})
          </button>
          <button
            type="button"
            className={`filter-pill ${filterCategory === 'Carpool' ? 'active' : ''}`}
            onClick={() => setFilterCategory('Carpool')}
          >
            🚗 Carpool
          </button>
          <button
            type="button"
            className={`filter-pill ${filterCategory === 'Question' ? 'active' : ''}`}
            onClick={() => setFilterCategory('Question')}
          >
            ❓ Questions
          </button>
          <button
            type="button"
            className={`filter-pill ${filterCategory === 'Logistics' ? 'active' : ''}`}
            onClick={() => setFilterCategory('Logistics')}
          >
            📦 Logistics
          </button>
        </div>
      </div>

      {/* Composer */}
      <form onSubmit={handleSubmit} className="discussion-composer">
        <textarea
          className="composer-textarea"
          placeholder="Share a carpool offer, ask about gear, or coordinate with the crew..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <div className="composer-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
              Category:
            </span>
            <select
              className="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as DiscussionCategory)}
            >
              <option value="General">💬 General Discussion</option>
              <option value="Carpool">🚗 Carpool Coordination</option>
              <option value="Question">❓ Volunteer Question</option>
              <option value="Logistics">📦 Gear & Logistics</option>
            </select>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!newComment.trim()}
          >
            <Send size={14} />
            Post Comment
          </button>
        </div>
      </form>

      {/* Comment Feed */}
      {filteredComments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
          <MessageSquare size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
          <div>No messages in this category yet. Be the first to start the conversation!</div>
        </div>
      ) : (
        <div className="comments-feed">
          {filteredComments.map((comment) => (
            <div key={comment.id} className="comment-card">
              <img
                src={comment.userAvatar}
                alt={comment.userName}
                className="comment-avatar"
              />
              <div className="comment-content">
                <div className="comment-header">
                  <div className="comment-author-group">
                    <span className="comment-author">{comment.userName}</span>
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.1rem 0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor:
                          comment.userRole === 'admin' ? 'var(--primary-100)' : 'var(--slate-100)',
                        color:
                          comment.userRole === 'admin' ? 'var(--primary-700)' : 'var(--slate-700)',
                      }}
                    >
                      {comment.userRole === 'admin' ? 'Organizer' : 'Volunteer'}
                    </span>
                    <span className={`tag-badge tag-${comment.category}`}>
                      {getCategoryIcon(comment.category)} {comment.category}
                    </span>
                  </div>

                  <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                    {new Date(comment.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div className="comment-body">{comment.message}</div>

                <div className="comment-actions">
                  <button
                    type="button"
                    className="like-btn"
                    onClick={() => likeComment(comment.id)}
                  >
                    <Heart
                      size={14}
                      style={{
                        fill: comment.likes > 0 ? 'var(--rose-500)' : 'none',
                        color: comment.likes > 0 ? 'var(--rose-500)' : 'inherit',
                      }}
                    />
                    <span>{comment.likes}</span>
                  </button>
                  <span>•</span>
                  <span>Direct reply coming soon</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
