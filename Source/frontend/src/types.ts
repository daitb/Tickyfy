export interface Event {
  id: string;
  title: string;
  slug: string;
  category: Category;
  image: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  description: string;
  organizerId: string;
  organizerName: string;
  organizerAvatar?: string;
  ticketTiers: TicketTier[];
  policies: EventPolicies;
  status: 'draft' | 'published' | 'cancelled';
  createdAt: string;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  available: number;
  total: number;
  description?: string;
}

export interface EventPolicies {
  refundable: boolean;
  transferable: boolean;
  refundDeadline?: string;
}

export interface CartItem {
  eventId: string;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  tierId: string;
  tierName: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  eventId: string;
  tickets: OrderTicket[];
  subtotal: number;
  serviceFee: number;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  userEmail: string;
  userName: string;
}

export interface OrderTicket {
  id: string;
  tierId: string;
  tierName: string;
  price: number;
  qrCode: string;
  status: 'valid' | 'used' | 'cancelled';
}

export type Category = 
  | 'Music' 
  | 'Sports' 
  | 'Conference' 
  | 'Theater' 
  | 'Food & Drink' 
  | 'Arts' 
  | 'Other';

export interface Filter {
  city?: string;
  category?: Category;
  date?: string;
  minPrice?: number;
  maxPrice?: number;
}

export type SortOption = 'popularity' | 'date' | 'price-asc' | 'price-desc';
