import { useState, useEffect } from "react";
import { eventService } from "@/services";

export const useEvents = (filters?: any) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await eventService.getAll(filters);
        setEvents(data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Không thể tải danh sách sự kiện"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filters]);

  return { events, loading, error };
};

export const useEvent = (id: number) => {
  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const data = await eventService.getById(id);
        setEvent(data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Không thể tải thông tin sự kiện"
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvent();
    }
  }, [id]);

  return { event, loading, error };
};

export const useFeaturedEvents = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const data = await eventService.getFeatured();
        setEvents(data);
        setError(null);
      } catch (err: any) {
        setError(
          err.response?.data?.message || "Không thể tải sự kiện nổi bật"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, loading, error };
};
