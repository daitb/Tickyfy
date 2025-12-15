import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { organizerService, type OrganizerProfileDto } from '../services/organizerService';
import { authService } from '../services/authService';

const OrganizerProfile: React.FC = () => {
  const [organizer, setOrganizer] = useState<OrganizerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const organizerId = authService.getCurrentOrganizerId();

  useEffect(() => {
    if (!organizerId) {
      setLoading(false);
      return;
    }

    organizerService
      .getOrganizerProfile(organizerId)
      .then((data: OrganizerProfileDto) => {
        setOrganizer(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load organizer profile.');
        setLoading(false);
      });
  }, [organizerId]);

  if (!organizerId) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-lg w-full bg-white rounded-2xl p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold mb-3">Organizer profile unavailable</h2>
          <p className="text-neutral-600 mb-6">
            You need an approved organizer account to view this page.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate('/home')} className="flex-1">
              Back to Home
            </Button>
            <Button
              onClick={() => navigate('/become-organizer')}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
            >
              Become an Organizer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!organizer) return <div>No organizer data found.</div>;

  return (
    <div className="organizer-profile">
      <h2>Organizer Profile</h2>
      <p><strong>Company Name:</strong> {organizer.companyName}</p>
      <p><strong>Email:</strong> {organizer.companyEmail}</p>
      <p><strong>Phone:</strong> {organizer.companyPhone}</p>
      <p><strong>Description:</strong> {organizer.description}</p>
      <p><strong>Website:</strong> {organizer.website}</p>
      <p><strong>Verified:</strong> {organizer.isVerified ? 'Yes' : 'No'}</p>
      {/* Add more fields as needed */}
    </div>
  );
};

export default OrganizerProfile;
