import React, { useState } from 'react';
import type { ResourceItem, ResourceType } from '../../types';
import { useVolunteer } from '../../context/VolunteerContext';
import {
  FileText,
  MapPin,
  Presentation,
  Shield,
  BookOpen,
  Pin,
  Download,
  Plus,
  Trash2,
} from 'lucide-react';

interface ResourceHubProps {
  eventId: string;
}

export const ResourceHub: React.FC<ResourceHubProps> = ({ eventId }) => {
  const { resources, addResource, deleteResource, currentUser } = useVolunteer();
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [type, setType] = useState<ResourceType>('document');
  const [description, setDescription] = useState('');
  const fileSize = '1.5 MB PDF';
  const [isPinned, setIsPinned] = useState(true);

  const eventResources = resources.filter((r) => r.eventId === eventId);
  const isAdmin = currentUser.role === 'admin';

  const getTypeIcon = (resType: ResourceType) => {
    switch (resType) {
      case 'map':
        return <MapPin size={20} />;
      case 'slide':
        return <Presentation size={20} />;
      case 'waiver':
        return <Shield size={20} />;
      case 'guideline':
        return <BookOpen size={20} />;
      default:
        return <FileText size={20} />;
    }
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addResource({
      eventId,
      title: title.trim(),
      type,
      description: description.trim() || 'Essential event documentation for verified volunteers.',
      url: '#sample-doc',
      fileSize: fileSize.trim() || '1.0 MB PDF',
      isPinned,
    });

    setTitle('');
    setDescription('');
    setShowAddForm(false);
  };

  const handleSimulateDownload = (resource: ResourceItem) => {
    // Generate a simple text file download simulating the resource
    const content = `========================================================\n${resource.title.toUpperCase()}\nType: ${resource.type.toUpperCase()}\nEvent ID: ${resource.eventId}\nUploaded: ${new Date(resource.uploadedAt).toLocaleDateString()}\n========================================================\n\n${resource.description}\n\nThis document is issued by the Event Organization Committee for registered volunteers.\nPlease review prior to arriving at the venue check-in checkpoint.`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${resource.title.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Shared Resource Hub
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>
            Official briefing slides, safety guidelines, venue maps, and liability waivers.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus size={14} />
            {showAddForm ? 'Cancel' : 'Upload Resource'}
          </button>
        )}
      </div>

      {/* Admin Add Resource Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateResource}
          style={{
            background: 'var(--slate-50)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--slate-800)' }}>
            Pin New Resource Document
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                Document Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Volunteer Safety Protocol & Parking Pass"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.825rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  marginTop: '0.2rem',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                Resource Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ResourceType)}
                style={{
                  width: '100%',
                  padding: '0.45rem 0.65rem',
                  fontSize: '0.825rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  marginTop: '0.2rem',
                  background: '#fff',
                }}
              >
                <option value="document">Briefing Document</option>
                <option value="slide">Presentation Slides</option>
                <option value="map">Location / Parking Map</option>
                <option value="waiver">Liability Waiver</option>
                <option value="guideline">Safety & Dress Code</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)' }}>
              Summary & Instructions
            </label>
            <input
              type="text"
              placeholder="e.g. Bring signed copy to Pavilion B entrance."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '0.45rem 0.65rem',
                fontSize: '0.825rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                marginTop: '0.2rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              Pin to Top of Event Hub
            </label>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary btn-sm">
                Save & Publish
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Resource Cards */}
      {eventResources.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-400)', fontSize: '0.875rem' }}>
          No resources pinned to this event yet.
        </div>
      ) : (
        <div className="resource-list">
          {eventResources.map((res) => (
            <div key={res.id} className={`resource-card ${res.isPinned ? 'pinned' : ''}`}>
              <div className="resource-icon-wrap">{getTypeIcon(res.type)}</div>
              <div className="resource-details">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <h4>{res.title}</h4>
                  {res.isPinned && (
                    <Pin size={12} style={{ color: 'var(--primary-600)', fill: 'var(--primary-600)' }} />
                  )}
                </div>
                <p>{res.description}</p>
                <div className="resource-meta">
                  <span>{res.fileSize}</span>
                  <span>•</span>
                  <span>{new Date(res.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <button
                  type="button"
                  className="btn-icon"
                  title="Download / View document"
                  onClick={() => handleSimulateDownload(res)}
                >
                  <Download size={14} />
                </button>
                {isAdmin && (
                  <button
                    type="button"
                    className="btn-icon"
                    title="Delete resource"
                    onClick={() => deleteResource(res.id)}
                  >
                    <Trash2 size={14} style={{ color: 'var(--rose-500)' }} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
