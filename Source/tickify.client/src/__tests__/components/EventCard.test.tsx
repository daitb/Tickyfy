import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventCard } from '../../components/EventCard';
import { authService } from '../../services/authService';
import type { Event } from '../../types';

// Mock dependencies
vi.mock('../../services/authService');
vi.mock('../../components/WishlistButton', () => ({
  WishlistButton: () => <div data-testid="wishlist-button">Wishlist</div>,
}));

describe('EventCard', () => {
  const mockEvent: Event = {
    id: '1',
    title: 'Test Event',
    slug: 'test-event',
    category: 'Music',
    image: 'https://example.com/image.jpg',
    date: '2024-12-01T10:00:00Z',
    time: '10:00 AM',
    venue: 'Test Venue',
    city: 'Ho Chi Minh City',
    description: 'Test Description',
    organizerId: '1',
    organizerName: 'Test Organizer',
    ticketTiers: [
      { id: '1', name: 'VIP', price: 100000, available: 50, total: 100 },
      { id: '2', name: 'Standard', price: 50000, available: 100, total: 200 },
    ],
    policies: {
      refundable: true,
      transferable: true,
    },
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
  };

  const mockOnClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);
  });

  it('should render event card with all information', () => {
    // Act
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Assert
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    // EventCard displays city, not venue
    expect(screen.getByText('Ho Chi Minh City')).toBeInTheDocument();
    // Category badge is displayed
    expect(screen.getByText('Music')).toBeInTheDocument();
  });

  it('should call onClick when card is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Act
    const card = screen.getByText('Test Event').closest('div');
    if (card) {
      await user.click(card);
    }

    // Assert
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('should display formatted date correctly', () => {
    // Act
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Assert
    const dateElement = screen.getByText(/Dec 1, 2024/i);
    expect(dateElement).toBeInTheDocument();
  });

  it('should display price range when tickets available', () => {
    // Act
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Assert
    // Price should be displayed (50k - 100k VND)
    const priceText = screen.getByText(/50k - 100k VND/i);
    expect(priceText).toBeInTheDocument();
  });

  it('should display single price when min and max are same', () => {
    // Arrange
    const eventWithSamePrice: Event = {
      ...mockEvent,
      ticketTiers: [
        { id: '1', name: 'Standard', price: 50000, available: 100, total: 200 },
      ],
    };

    // Act
    render(<EventCard event={eventWithSamePrice} onClick={mockOnClick} />);

    // Assert
    const priceText = screen.getByText(/50k VND/i);
    expect(priceText).toBeInTheDocument();
  });

  it('should display TBD when no tickets available', () => {
    // Arrange
    const eventNoTickets: Event = {
      ...mockEvent,
      ticketTiers: [],
    };

    // Act
    render(<EventCard event={eventNoTickets} onClick={mockOnClick} />);

    // Assert
    const tbdText = screen.getByText('TBD');
    expect(tbdText).toBeInTheDocument();
  });

  it('should show wishlist button when user is authenticated', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(true);

    // Act
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Assert
    expect(screen.getByTestId('wishlist-button')).toBeInTheDocument();
  });

  it('should not show wishlist button when user is not authenticated', () => {
    // Arrange
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);

    // Act
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Assert
    expect(screen.queryByTestId('wishlist-button')).not.toBeInTheDocument();
  });

  it('should display event image with fallback', () => {
    // Act
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Assert
    const image = screen.getByAltText('Test Event');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should display category badge', () => {
    // Act
    render(<EventCard event={mockEvent} onClick={mockOnClick} />);

    // Assert
    expect(screen.getByText('Music')).toBeInTheDocument();
  });
});

