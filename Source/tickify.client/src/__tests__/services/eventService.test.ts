import { describe, it, expect, vi, beforeEach } from 'vitest';
import { eventService } from '../../services/eventService';
import apiClient from '../../services/apiClient';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../services/apiClient');
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('EventService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getEventById', () => {
    it('should return event when API call succeeds', async () => {
      // Arrange
      const eventId = 1;
      const mockEventDetail = {
        eventId: 1,
        title: 'Test Event',
        description: 'Test Description',
        venue: 'Test Venue',
        startDate: '2024-12-01T10:00:00Z',
        endDate: '2024-12-01T18:00:00Z',
        totalSeats: 100,
        availableSeats: 50,
        categoryName: 'Music',
        organizerName: 'Test Organizer',
        ticketTypes: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEventDetail,
      } as any);

      // Act
      const result = await eventService.getEventById(eventId);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(result.title).toBe('Test Event');
      expect(apiClient.get).toHaveBeenCalledWith(`/events/${eventId}`);
    });

    it('should show error toast and throw when API call fails', async () => {
      // Arrange
      const eventId = 999;
      const error = {
        response: {
          data: {
            message: 'Event not found',
          },
        },
      };

      vi.mocked(apiClient.get).mockRejectedValue(error);

      // Act & Assert
      await expect(eventService.getEventById(eventId)).rejects.toBeDefined();
      expect(toast.error).toHaveBeenCalledWith('Event not found');
    });
  });

  describe('getEventByIdentifier', () => {
    it('should return event when identifier is numeric ID', async () => {
      // Arrange
      const identifier = 1;
      const mockEventDetail = {
        eventId: 1,
        title: 'Test Event',
        description: 'Test Description',
        venue: 'Test Venue',
        startDate: '2024-12-01T10:00:00Z',
        endDate: '2024-12-01T18:00:00Z',
        totalSeats: 100,
        availableSeats: 50,
        categoryName: 'Music',
        organizerName: 'Test Organizer',
        ticketTypes: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEventDetail,
      } as any);

      // Act
      const result = await eventService.getEventByIdentifier(identifier);

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe('1');
    });

    it('should return null when event not found', async () => {
      // Arrange
      const identifier = '999';
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Not found'));

      // Act
      const result = await eventService.getEventByIdentifier(identifier);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getEvents', () => {
    it('should return list of events', async () => {
      // Arrange
      const mockEvents = {
        items: [
          {
            eventId: 1,
            title: 'Event 1',
            venue: 'Venue 1',
            startDate: '2024-12-01T10:00:00Z',
            categoryName: 'Music',
            organizerName: 'Organizer 1',
            availableSeats: 50,
            minPrice: 100,
            maxPrice: 200,
            status: 'Published',
          },
          {
            eventId: 2,
            title: 'Event 2',
            venue: 'Venue 2',
            startDate: '2024-12-02T10:00:00Z',
            categoryName: 'Sports',
            organizerName: 'Organizer 2',
            availableSeats: 30,
            minPrice: 150,
            maxPrice: 250,
            status: 'Published',
          },
        ],
        totalCount: 2,
        pageNumber: 1,
        pageSize: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEvents,
      } as any);

      // Act
      const result = await eventService.getEvents();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
      expect(apiClient.get).toHaveBeenCalledWith('/events?Status=Published');
    });

    it('should return empty array when API call fails', async () => {
      // Arrange
      vi.mocked(apiClient.get).mockRejectedValue(new Error('Network error'));

      // Act
      const result = await eventService.getEvents();

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('getFeaturedEvents', () => {
    it('should return featured events', async () => {
      // Arrange
      const count = 5;
      const mockEvents = [
        {
          eventId: 1,
          title: 'Featured Event',
          venue: 'Venue',
          startDate: '2024-12-01T10:00:00Z',
          categoryName: 'Music',
          organizerName: 'Organizer',
          availableSeats: 50,
          minPrice: 100,
          maxPrice: 200,
          status: 'Published',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEvents,
      } as any);

      // Act
      const result = await eventService.getFeaturedEvents(count);

      // Assert
      expect(result).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith(`/events/featured?count=${count}`);
    });
  });

  describe('getUpcomingEvents', () => {
    it('should return upcoming events', async () => {
      // Arrange
      const count = 10;
      const mockEvents = [
        {
          eventId: 1,
          title: 'Upcoming Event',
          venue: 'Venue',
          startDate: '2024-12-01T10:00:00Z',
          categoryName: 'Music',
          organizerName: 'Organizer',
          availableSeats: 50,
          minPrice: 100,
          maxPrice: 200,
          status: 'Published',
        },
      ];

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEvents,
      } as any);

      // Act
      const result = await eventService.getUpcomingEvents(count);

      // Assert
      expect(result).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith(`/events/upcoming?count=${count}`);
    });
  });

  describe('searchEvents', () => {
    it('should return search results', async () => {
      // Arrange
      const query = 'concert';
      const mockEvents = {
        items: [
          {
            eventId: 1,
            title: 'Concert Event',
            venue: 'Venue',
            startDate: '2024-12-01T10:00:00Z',
            categoryName: 'Music',
            organizerName: 'Organizer',
            availableSeats: 50,
            minPrice: 100,
            maxPrice: 200,
            status: 'Published',
          },
        ],
        totalCount: 1,
        pageNumber: 1,
        pageSize: 20,
      };

      vi.mocked(apiClient.get).mockResolvedValue({
        data: mockEvents,
      } as any);

      // Act
      const result = await eventService.searchEvents(query);

      // Assert
      expect(result).toHaveLength(1);
      expect(apiClient.get).toHaveBeenCalledWith(
        `/events/search?q=${encodeURIComponent(query)}&pageNumber=1&pageSize=20`
      );
    });
  });

  describe('createEvent', () => {
    it('should create event successfully', async () => {
      // Arrange
      const createDto = {
        organizerId: 1,
        categoryId: 1,
        title: 'New Event',
        description: 'Description',
        venue: 'Venue',
        startDate: '2024-12-01T10:00:00Z',
        endDate: '2024-12-01T18:00:00Z',
        totalSeats: 100,
      };

      const mockEventDetail = {
        eventId: 1,
        ...createDto,
        availableSeats: 100,
        categoryName: 'Music',
        organizerName: 'Organizer',
        ticketTypes: [],
      };

      vi.mocked(apiClient.post).mockResolvedValue({
        data: mockEventDetail,
      } as any);

      // Act
      const result = await eventService.createEvent(createDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(apiClient.post).toHaveBeenCalledWith('/events', createDto);
    });
  });

  describe('updateEvent', () => {
    it('should update event successfully', async () => {
      // Arrange
      const eventId = 1;
      const updateDto = {
        categoryId: 1,
        title: 'Updated Event',
        description: 'Updated Description',
        venue: 'Updated Venue',
        startDate: '2024-12-01T10:00:00Z',
        endDate: '2024-12-01T18:00:00Z',
        totalSeats: 150,
        isFeatured: false,
      };

      const mockEventDetail = {
        eventId: 1,
        ...updateDto,
        availableSeats: 150,
        categoryName: 'Music',
        organizerName: 'Organizer',
        ticketTypes: [],
      };

      vi.mocked(apiClient.put).mockResolvedValue({
        data: mockEventDetail,
      } as any);

      // Act
      const result = await eventService.updateEvent(eventId, updateDto);

      // Assert
      expect(result).toBeDefined();
      expect(result.title).toBe('Updated Event');
      expect(apiClient.put).toHaveBeenCalledWith(`/events/${eventId}`, updateDto);
    });
  });
});

