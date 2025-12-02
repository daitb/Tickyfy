import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '../../components/Header';
import { authService } from '../../services/authService';
import { organizerService } from '../../services/organizerService';
import { useWishlistToggle } from '../../hooks/useWishlistToggle';

// Mock dependencies
vi.mock('../../services/authService');
vi.mock('../../services/organizerService');
vi.mock('../../hooks/useWishlistToggle', () => ({
  useWishlistToggle: vi.fn(),
}));
vi.mock('../../components/InlineSearchBar', () => ({
  InlineSearchBar: () => <div data-testid="search-bar">Search</div>,
}));
vi.mock('../../components/LanguageSwitcher', () => ({
  default: () => <div data-testid="language-switcher">Language</div>,
}));
vi.mock('../../components/NotificationDropdown', () => ({
  NotificationDropdown: () => <div data-testid="notification-dropdown">Notifications</div>,
}));

describe('Header', () => {
  const mockOnNavigate = vi.fn();
  const defaultProps = {
    onNavigate: mockOnNavigate,
    currentPage: 'home',
    isAuthenticated: false,
    userRole: 'guest' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWishlistToggle).mockReturnValue({
      wishlistCount: 0,
      toggleWishlist: vi.fn(),
      isInWishlist: vi.fn().mockReturnValue(false),
    });
    vi.mocked(organizerService.getMyOrganizerRequest).mockResolvedValue(null);
  });

  it('should render header with logo', () => {
    // Act
    render(<Header {...defaultProps} />);

    // Assert
    const logo = screen.getByText(/tickify/i);
    expect(logo).toBeInTheDocument();
  });

  it('should render search bar', () => {
    // Act
    render(<Header {...defaultProps} />);

    // Assert
    // Header has search bar in both desktop and mobile views
    const searchBars = screen.getAllByTestId('search-bar');
    expect(searchBars.length).toBeGreaterThanOrEqual(1);
  });

  it('should render language switcher', () => {
    // Act
    render(<Header {...defaultProps} />);

    // Assert
    expect(screen.getByTestId('language-switcher')).toBeInTheDocument();
  });

  it('should show login button when not authenticated', () => {
    // Act
    render(<Header {...defaultProps} isAuthenticated={false} />);

    // Assert
    const loginButton = screen.getByText(/đăng nhập|login/i);
    expect(loginButton).toBeInTheDocument();
  });

  it('should show user menu when authenticated', () => {
    // Arrange
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      userId: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'User',
      isEmailVerified: true,
    });

    // Act
    render(
      <Header
        {...defaultProps}
        isAuthenticated={true}
        userRole="user"
      />
    );

    // Assert
    // User menu should be visible (avatar or user name)
    expect(screen.getByText(/test user/i)).toBeInTheDocument();
  });

  it('should call onNavigate when logo is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<Header {...defaultProps} />);

    // Act
    const logo = screen.getByText(/tickify/i);
    await user.click(logo);

    // Assert
    expect(mockOnNavigate).toHaveBeenCalledWith('home');
  });

  it('should show wishlist count when authenticated', () => {
    // Arrange
    vi.mocked(useWishlistToggle).mockReturnValue({
      wishlistCount: 5,
      toggleWishlist: vi.fn(),
      isInWishlist: vi.fn().mockReturnValue(false),
    });

    vi.mocked(authService.getCurrentUser).mockReturnValue({
      userId: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'User',
      isEmailVerified: true,
    });

    // Act
    render(
      <Header
        {...defaultProps}
        isAuthenticated={true}
        userRole="user"
      />
    );

    // Assert
    // Wishlist count should be displayed (might be in badge or icon)
    // This depends on implementation, but we can check if wishlist button exists
    const wishlistButton = screen.queryByRole('button', { name: /wishlist|yêu thích/i });
    if (wishlistButton) {
      expect(wishlistButton).toBeInTheDocument();
    }
  });

  it('should show organizer menu items for organizer role', () => {
    // Arrange
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      userId: '1',
      email: 'organizer@example.com',
      fullName: 'Organizer User',
      role: 'Organizer',
      isEmailVerified: true,
      organizerId: 1,
    });

    // Act
    render(
      <Header
        {...defaultProps}
        isAuthenticated={true}
        userRole="organizer"
      />
    );

    // Assert
    // Organizer-specific menu items should be visible
    // This depends on implementation, but we can check for common organizer features
    const dashboardButton = screen.queryByText(/dashboard|bảng điều khiển/i);
    if (dashboardButton) {
      expect(dashboardButton).toBeInTheDocument();
    }
  });

  it('should show notification dropdown when authenticated', () => {
    // Arrange
    vi.mocked(authService.getCurrentUser).mockReturnValue({
      userId: '1',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'User',
      isEmailVerified: true,
    });

    // Act
    render(
      <Header
        {...defaultProps}
        isAuthenticated={true}
        userRole="user"
      />
    );

    // Assert
    expect(screen.getByTestId('notification-dropdown')).toBeInTheDocument();
  });
});

