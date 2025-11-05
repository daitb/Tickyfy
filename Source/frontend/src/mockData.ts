import { Event, Order, Category } from './types';

export const categories: Category[] = [
  'Music',
  'Sports',
  'Conference',
  'Theater',
  'Food & Drink',
  'Arts',
];

export const cities = [
  'Ho Chi Minh City',
  'Hanoi',
  'Da Nang',
  'Nha Trang',
  'Can Tho',
  'Vung Tau',
];

export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'Summer Music Festival 2025',
    slug: 'summer-music-festival-2025',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1743791022256-40413c5f019b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwbXVzaWMlMjBldmVudHxlbnwxfHx8fDE3NjEwMTQ3NjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2025-11-15',
    time: '18:00',
    venue: 'Phu Tho Stadium',
    city: 'Ho Chi Minh City',
    description: 'Experience the biggest music festival of the summer featuring international and local artists. Three stages, 20+ artists, food trucks, and amazing vibes all night long.',
    organizerId: 'org-1',
    organizerName: 'LiveNation Vietnam',
    ticketTiers: [
      {
        id: 'tier-1',
        name: 'General Admission',
        price: 500000,
        available: 450,
        total: 1000,
        description: 'Standing area with access to all stages'
      },
      {
        id: 'tier-2',
        name: 'VIP',
        price: 1200000,
        available: 80,
        total: 200,
        description: 'Reserved seating, VIP lounge, complimentary drinks'
      },
      {
        id: 'tier-3',
        name: 'Early Bird',
        price: 350000,
        available: 0,
        total: 300,
        description: 'Limited early bird offer - SOLD OUT'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-11-08'
    },
    status: 'published',
    createdAt: '2025-09-01'
  },
  {
    id: 'evt-2',
    title: 'Vietnam vs Thailand - World Cup Qualifier',
    slug: 'vietnam-thailand-world-cup',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1631746410377-b0e23f61d083?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzcG9ydHMlMjBzdGFkaXVtJTIwY3Jvd2R8ZW58MXx8fHwxNzYwOTgwMDE5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2025-11-20',
    time: '19:30',
    venue: 'My Dinh National Stadium',
    city: 'Hanoi',
    description: 'Watch the Golden Star Warriors take on Thailand in this crucial World Cup qualifier match. Support the team as they fight for glory!',
    organizerId: 'org-2',
    organizerName: 'Vietnam Football Federation',
    ticketTiers: [
      {
        id: 'tier-4',
        name: 'Category C',
        price: 200000,
        available: 5000,
        total: 10000,
        description: 'Upper tier seating'
      },
      {
        id: 'tier-5',
        name: 'Category B',
        price: 400000,
        available: 3000,
        total: 5000,
        description: 'Mid-level seating with great view'
      },
      {
        id: 'tier-6',
        name: 'Category A',
        price: 800000,
        available: 800,
        total: 2000,
        description: 'Premium seats closest to the field'
      }
    ],
    policies: {
      refundable: false,
      transferable: true
    },
    status: 'published',
    createdAt: '2025-09-10'
  },
  {
    id: 'evt-3',
    title: 'Tech Innovation Summit 2025',
    slug: 'tech-innovation-summit-2025',
    category: 'Conference',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGNvbmZlcmVuY2V8ZW58MXx8fHwxNzYwOTIwMTgwfDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2025-12-05',
    time: '08:00',
    venue: 'GEM Center',
    city: 'Ho Chi Minh City',
    description: 'Join industry leaders, innovators, and entrepreneurs for a full day of keynotes, workshops, and networking. Topics include AI, blockchain, and sustainable tech.',
    organizerId: 'org-3',
    organizerName: 'TechEvents Asia',
    ticketTiers: [
      {
        id: 'tier-7',
        name: 'Standard Pass',
        price: 2500000,
        available: 150,
        total: 300,
        description: 'Access to all sessions and lunch'
      },
      {
        id: 'tier-8',
        name: 'Premium Pass',
        price: 4500000,
        available: 40,
        total: 100,
        description: 'All sessions, VIP networking, 1-on-1 consultations'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-11-28'
    },
    status: 'published',
    createdAt: '2025-08-15'
  },
  {
    id: 'evt-4',
    title: 'Swan Lake Ballet Performance',
    slug: 'swan-lake-ballet',
    category: 'Theater',
    image: 'https://images.unsplash.com/photo-1503095396549-807759245b35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2V8ZW58MXx8fHwxNzYxMDE0NTk5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2025-11-25',
    time: '19:00',
    venue: 'Saigon Opera House',
    city: 'Ho Chi Minh City',
    description: 'Experience Tchaikovsky\'s timeless masterpiece performed by the Vietnam National Ballet. A magical evening of classical artistry.',
    organizerId: 'org-4',
    organizerName: 'Vietnam National Ballet',
    ticketTiers: [
      {
        id: 'tier-9',
        name: 'Balcony',
        price: 300000,
        available: 100,
        total: 150,
        description: 'Upper level seating'
      },
      {
        id: 'tier-10',
        name: 'Orchestra',
        price: 600000,
        available: 60,
        total: 100,
        description: 'Main floor premium seats'
      }
    ],
    policies: {
      refundable: true,
      transferable: false,
      refundDeadline: '2025-11-18'
    },
    status: 'published',
    createdAt: '2025-09-20'
  },
  {
    id: 'evt-5',
    title: 'Street Food Festival Da Nang',
    slug: 'street-food-festival-danang',
    category: 'Food & Drink',
    image: 'https://images.unsplash.com/photo-1551883709-2516220df0bc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb29kJTIwZmVzdGl2YWwlMjBvdXRkb29yfGVufDF8fHx8MTc2MDk1MzM3NXww&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2025-11-30',
    time: '16:00',
    venue: 'Han River Promenade',
    city: 'Da Nang',
    description: 'Taste the best street food from across Vietnam! 50+ vendors, live cooking demos, and cultural performances. Family-friendly event.',
    organizerId: 'org-5',
    organizerName: 'Da Nang Tourism',
    ticketTiers: [
      {
        id: 'tier-11',
        name: 'Entry Pass',
        price: 100000,
        available: 2000,
        total: 3000,
        description: 'Entry + 3 food vouchers worth 150k VND'
      },
      {
        id: 'tier-12',
        name: 'Foodie Pass',
        price: 250000,
        available: 500,
        total: 1000,
        description: 'Entry + 10 food vouchers + tasting masterclass'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-11-23'
    },
    status: 'published',
    createdAt: '2025-10-01'
  },
  {
    id: 'evt-6',
    title: 'Contemporary Art Exhibition',
    slug: 'contemporary-art-exhibition',
    category: 'Arts',
    image: 'https://images.unsplash.com/photo-1719398026703-0d3f3d162e51?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBleGhpYml0aW9uJTIwZ2FsbGVyeXxlbnwxfHx8fDE3NjA5ODQzNjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    date: '2025-12-10',
    time: '10:00',
    venue: 'The Factory Contemporary Arts Centre',
    city: 'Ho Chi Minh City',
    description: 'Explore cutting-edge contemporary art from Southeast Asian artists. Opening weekend features artist talks and guided tours.',
    organizerId: 'org-6',
    organizerName: 'The Factory',
    ticketTiers: [
      {
        id: 'tier-13',
        name: 'General Entry',
        price: 150000,
        available: 200,
        total: 300,
        description: 'Exhibition access'
      },
      {
        id: 'tier-14',
        name: 'Opening Reception',
        price: 400000,
        available: 45,
        total: 80,
        description: 'Opening night + meet the artists + drinks'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-12-03'
    },
    status: 'published',
    createdAt: '2025-10-15'
  }
];

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    userId: 'user-1',
    eventId: 'evt-1',
    tickets: [
      {
        id: 'tkt-1',
        tierId: 'tier-1',
        tierName: 'General Admission',
        price: 500000,
        qrCode: 'QR-SMF-GA-001',
        status: 'valid'
      },
      {
        id: 'tkt-2',
        tierId: 'tier-1',
        tierName: 'General Admission',
        price: 500000,
        qrCode: 'QR-SMF-GA-002',
        status: 'valid'
      }
    ],
    subtotal: 1000000,
    serviceFee: 50000,
    total: 1050000,
    status: 'completed',
    createdAt: '2025-10-15T10:30:00',
    userEmail: 'user@example.com',
    userName: 'Nguyen Van A'
  }
];
