import { useState, useEffect } from 'react';
import { seatService, type SeatDto, type SeatAvailabilityDto } from '../services/seatService';

export function useSeats(eventId: number) {
  const [seats, setSeats] = useState<SeatDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const data = await seatService.getSeatsByEvent(eventId);
        setSeats(data);
        setError(null);
      } catch (err) {
        setError('Failed to load seats');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchSeats();
    }
  }, [eventId]);

  return { seats, loading, error, setSeats };
}

export function useSeatAvailability(ticketTypeId: number) {
  const [availability, setAvailability] = useState<SeatAvailabilityDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        setLoading(true);
        const data = await seatService.getSeatAvailabilityByTicketType(ticketTypeId);
        setAvailability(data);
        setError(null);
      } catch (err) {
        setError('Failed to load seat availability');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (ticketTypeId) {
      fetchAvailability();
    }
  }, [ticketTypeId]);

  const refetch = async () => {
    try {
      setLoading(true);
      const data = await seatService.getSeatAvailabilityByTicketType(ticketTypeId);
      setAvailability(data);
      setError(null);
    } catch (err) {
      setError('Failed to load seat availability');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { availability, loading, error, refetch };
}

