import { OrganizerWizard } from "./OrganizerWizard";

interface CreateEventProps {
  onNavigate: (page: string, eventId?: string) => void;
}

/**
 * Alias page so routes can reference `/create-event` while reusing the wizard UI.
 */
export function CreateEvent({ onNavigate }: CreateEventProps) {
  return <OrganizerWizard onNavigate={onNavigate} />;
}
