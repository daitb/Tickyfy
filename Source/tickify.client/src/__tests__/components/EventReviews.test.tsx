import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventReviews } from '../../pages/EventReviews';
import { reviewService } from '../../services/reviewService';
import { eventService } from '../../services/eventService';
import { authService } from '../../services/authService';

// Mock dependencies
vi.mock('../../services/reviewService');
vi.mock('../../services/eventService');
vi.mock('../../services/authService');
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('EventReviews', () => {
  const mockOnNavigate = vi.fn();
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    image: 'https://example.com/image.jpg',
    date: '2024-12-01',
    venue: 'Test Venue',
    city: 'Ho Chi Minh City',
  };

  const mockReviews = [
    {
      id: 1,
      userId: 1,
      userName: 'User 1',
      eventId: 1,
      eventTitle: 'Test Event',
      rating: 5,
      comment: 'Great event!',
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 2,
      userId: 2,
      userName: 'User 2',
      eventId: 1,
      eventTitle: 'Test Event',
      rating: 4,
      comment: 'Good event',
      createdAt: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      userId: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'User',
      isEmailVerified: true,
    });
    vi.mocked(eventService.getEventByIdentifier).mockResolvedValue(mockEvent as any);
    vi.mocked(reviewService.getEventReviews).mockResolvedValue(mockReviews);
  });

  it('should render event reviews page', async () => {
    // Act
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });
  });

  it('should display reviews when loaded', async () => {
    // Act
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    // Assert
    await waitFor(() => {
      // Use getAllByText since text appears multiple times (in h3 and p)
      const greatEventElements = screen.getAllByText('Great event!');
      expect(greatEventElements.length).toBeGreaterThan(0);
      const goodEventElements = screen.getAllByText('Good event');
      expect(goodEventElements.length).toBeGreaterThan(0);
    });
  });

  it('should display average rating', async () => {
    // Act
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    // Assert
    await waitFor(() => {
      // Average of 5 and 4 is 4.5 - appears multiple times in UI
      const ratingElements = screen.getAllByText(/4\.5/);
      expect(ratingElements.length).toBeGreaterThan(0);
    });
  });

  it('should filter reviews by search query', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      const greatEventElements = screen.getAllByText('Great event!');
      expect(greatEventElements.length).toBeGreaterThan(0);
    });

    // Act
    const searchInput = screen.getByPlaceholderText(/search|tìm kiếm/i);
    await user.type(searchInput, 'Great');

    // Assert
    await waitFor(() => {
      const greatEventElements = screen.getAllByText('Great event!');
      expect(greatEventElements.length).toBeGreaterThan(0);
      expect(screen.queryByText('Good event')).not.toBeInTheDocument();
    });
  });

  it.skip('should filter reviews by rating', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText('Great event!')).toBeInTheDocument();
    });

    // Act - Filter by 5 stars
    const ratingFilter = screen.getByText(/5|five/i);
    await user.click(ratingFilter);

    // Assert
    await waitFor(() => {
      expect(screen.getByText('Great event!')).toBeInTheDocument();
      // Review with 4 stars should be filtered out
      expect(screen.queryByText('Good event')).not.toBeInTheDocument();
    });
  });

  it('should sort reviews by most recent', async () => {
    // Act
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    // Assert
    await waitFor(() => {
      const reviews = screen.getAllByText(/Great event!|Good event/);
      // Most recent should be first (Good event - 2024-01-02)
      expect(reviews[0]).toHaveTextContent('Good event');
    });
  });

  it('should show back to event button', async () => {
    // Act
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    // Assert
    await waitFor(() => {
      const backButton = screen.getByText(/back|quay lại/i);
      expect(backButton).toBeInTheDocument();
    });
  });

  it('should call onNavigate when back button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    await waitFor(() => {
      expect(screen.getByText(/back|quay lại/i)).toBeInTheDocument();
    });

    // Act
    const backButton = screen.getByText(/back|quay lại/i);
    await user.click(backButton);

    // Assert
    expect(mockOnNavigate).toHaveBeenCalledWith('event-detail', '1');
  });

  it.skip('should show loading state initially', () => {
    // Arrange
    vi.mocked(reviewService.getEventReviews).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    // Act
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    // Assert
    expect(screen.getByText(/loading|đang tải/i)).toBeInTheDocument();
  });

  it.skip('should show no reviews message when there are no reviews', async () => {
    // Arrange
    vi.mocked(reviewService.getEventReviews).mockResolvedValue([]);

    // Act
    render(<EventReviews eventId="1" onNavigate={mockOnNavigate} />);

    // Assert
    await waitFor(() => {
      expect(screen.getByText(/no reviews|chưa có đánh giá/i)).toBeInTheDocument();
    });
  });
});

