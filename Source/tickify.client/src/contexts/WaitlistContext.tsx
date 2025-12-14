import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ReactNode } from "react";
import { waitlistService, type WaitlistDto } from "../services/waitlistService";
import { authService } from "../services/authService";

interface WaitlistContextType {
  waitlistEntries: WaitlistDto[];
  waitlistCount: number;
  activeCount: number;
  notifiedCount: number;
  isLoading: boolean;
  isInWaitlist: (eventId: number) => boolean;
  joinWaitlist: (eventId: number, ticketTypeId?: number) => Promise<void>;
  leaveWaitlist: (waitlistId: number) => Promise<void>;
  refreshWaitlistStatus: () => Promise<void>;
}

const WaitlistContext = createContext<WaitlistContextType | undefined>(
  undefined
);

export function WaitlistProvider({ children }: { children: ReactNode }) {
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate counts
  const waitlistCount = waitlistEntries.length;
  const activeCount = waitlistEntries.filter(
    (e) => e.status === "active"
  ).length;
  const notifiedCount = waitlistEntries.filter(
    (e) => e.status === "notified"
  ).length;

  // Load waitlist status on mount
  const refreshWaitlistStatus = useCallback(async () => {
    if (!authService.isAuthenticated()) {
      setWaitlistEntries([]);
      return;
    }

    setIsLoading(true);
    try {
      const entries = await waitlistService.getMyWaitlist();
      setWaitlistEntries(entries);
    } catch (error) {
      console.error("Failed to load waitlist status:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWaitlistStatus();
  }, [refreshWaitlistStatus]);

  // Listen for auth changes
  useEffect(() => {
    const checkAuth = () => {
      if (!authService.isAuthenticated()) {
        setWaitlistEntries([]);
      } else {
        refreshWaitlistStatus();
      }
    };

    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, [refreshWaitlistStatus]);

  const isInWaitlist = useCallback(
    (eventId: number): boolean => {
      return waitlistEntries.some(
        (e) =>
          e.eventId === eventId && e.status !== "expired" && !e.hasPurchased
      );
    },
    [waitlistEntries]
  );

  const joinWaitlist = useCallback(
    async (eventId: number, ticketTypeId?: number) => {
      try {
        const result = await waitlistService.joinWaitlist({
          eventId,
          ticketTypeId,
          requestedQuantity: 1,
        });

        // Add new entry to state
        setWaitlistEntries((prev) => [result, ...prev]);
      } catch (error) {
        // If conflict (already in waitlist), refresh to get current state
        await refreshWaitlistStatus();
        throw error;
      }
    },
    [refreshWaitlistStatus]
  );

  const leaveWaitlist = useCallback(
    async (waitlistId: number) => {
      // Optimistic update
      setWaitlistEntries((prev) =>
        prev.filter((e) => e.waitlistId !== waitlistId)
      );

      try {
        await waitlistService.leaveWaitlist(waitlistId);
      } catch (error) {
        // Revert on error
        await refreshWaitlistStatus();
        throw error;
      }
    },
    [refreshWaitlistStatus]
  );

  return (
    <WaitlistContext.Provider
      value={{
        waitlistEntries,
        waitlistCount,
        activeCount,
        notifiedCount,
        isLoading,
        isInWaitlist,
        joinWaitlist,
        leaveWaitlist,
        refreshWaitlistStatus,
      }}
    >
      {children}
    </WaitlistContext.Provider>
  );
}

export function useWaitlistContext() {
  const context = useContext(WaitlistContext);
  if (context === undefined) {
    throw new Error(
      "useWaitlistContext must be used within a WaitlistProvider"
    );
  }
  return context;
}
