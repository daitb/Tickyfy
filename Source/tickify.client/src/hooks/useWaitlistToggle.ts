import { useWaitlistContext } from "../contexts/WaitlistContext";

interface UseWaitlistToggleResult {
  isInWaitlist: (eventId: number) => boolean;
  joinWaitlist: (eventId: number, ticketTypeId?: number) => Promise<void>;
  leaveWaitlist: (waitlistId: number) => Promise<void>;
  waitlistEntries: any[];
  waitlistCount: number;
  activeCount: number;
  notifiedCount: number;
  isLoading: boolean;
  refreshWaitlistStatus: () => Promise<void>;
}

/**
 * Global hook for managing waitlist state across the application.
 * This is a wrapper around WaitlistContext.
 */
export function useWaitlistToggle(): UseWaitlistToggleResult {
  const context = useWaitlistContext();
  
  return {
    isInWaitlist: context.isInWaitlist,
    joinWaitlist: context.joinWaitlist,
    leaveWaitlist: context.leaveWaitlist,
    waitlistEntries: context.waitlistEntries,
    waitlistCount: context.waitlistCount,
    activeCount: context.activeCount,
    notifiedCount: context.notifiedCount,
    isLoading: context.isLoading,
    refreshWaitlistStatus: context.refreshWaitlistStatus,
  };
}
