import React, { useEffect, useState } from 'react';
import { organizerService, type OrganizerProfileDto } from '../services/organizerService';

const OrganizerProfile: React.FC = () => {
  const [organizer, setOrganizer] = useState<OrganizerProfileDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // TODO: Replace with actual organizerId from auth/user context
    const organizerId = 1;
    organizerService.getOrganizerProfile(organizerId)
      .then((data: OrganizerProfileDto) => {
        setOrganizer(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError('Failed to load organizer profile.');
        setLoading(false);
      });
  }, []);

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
