import React from 'react';
import { OrganizerWizard } from './OrganizerWizard';

// This page wraps OrganizerWizard for correct route naming and separation
const CreateEvent: React.FC = () => {
  return <OrganizerWizard onNavigate={() => {}} />;
};

export default CreateEvent;
