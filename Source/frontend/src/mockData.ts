import { Event, Order, Category, WishlistItem, WaitlistEntry } from './types';

// Categories for filtering
export const categories: Category[] = [
  'Music',
  'Sports',
  'Conference',
  'Theater',
  'Food & Drink',
  'Arts',
  'Other'
];

// Cities for location filtering
export const cities: string[] = [
  'Hanoi',
  'Ho Chi Minh City',
  'Da Nang',
  'Hai Phong',
  'Can Tho',
  'Bien Hoa',
  'Hue',
  'Nha Trang',
  'Buon Ma Thuot',
  'Phan Thiet',
  'Bac Giang',
  'Bac Ninh',
  'Hai Duong',
  'Hung Yen',
  'Nam Dinh',
  'Thai Binh',
  'Vinh Phuc',
  'Ha Long',
  'Vung Tau'
];

export const mockEvents: Event[] = [
  {
    id: 'evt-1',
    title: 'Summer Music Festival 2025',
    slug: 'summer-music-festival-2025',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea',
    date: '2025-07-15',
    time: '14:00',
    venue: 'My Dinh National Stadium',
    city: 'Hanoi',
    description: 'Experience the biggest summer music festival in Vietnam featuring top international and local artists.',
    fullDescription: 'Join us for an unforgettable musical journey at the Summer Music Festival 2025. This year, we are bringing together the best artists from around the world for three days of non-stop entertainment. Enjoy multiple stages, diverse music genres, and a vibrant atmosphere perfect for music lovers of all ages.',
    organizerId: 'org-1',
    organizerName: 'Live Nation Vietnam',
    organizerAvatar: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623',
    ticketTiers: [
      {
        id: 'tier-1',
        name: 'General Admission',
        price: 500000,
        available: 2500,
        total: 5000,
        description: 'Standing access to main stage area'
      },
      {
        id: 'tier-2',
        name: 'VIP Pass',
        price: 1500000,
        available: 150,
        total: 500,
        description: 'Priority viewing area, VIP lounge access, complimentary drinks'
      },
      {
        id: 'tier-3',
        name: 'Premium Package',
        price: 3000000,
        available: 25,
        total: 100,
        description: 'All VIP benefits plus backstage access and meet & greet'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-07-08'
    },
    status: 'published',
    createdAt: '2025-05-01T10:00:00',
    highlights: [
      {
        icon: 'music',
        title: '20+ International Artists',
        description: 'Top performers from around the world'
      },
      {
        icon: 'clock',
        title: '12 Hours of Music',
        description: 'Non-stop entertainment from 2 PM to 2 AM'
      },
      {
        icon: 'award',
        title: 'Multiple Stages',
        description: 'Main stage, EDM stage, and acoustic lounge'
      }
    ],
    faqs: [
      {
        question: 'What time does the festival start?',
        answer: 'Gates open at 2:00 PM and the first performance starts at 3:00 PM.'
      },
      {
        question: 'Can I bring my own food and drinks?',
        answer: 'Outside food and beverages are not permitted. We have a wide variety of food and drink vendors on-site.'
      },
      {
        question: 'Is there parking available?',
        answer: 'Yes, parking is available at the stadium. We recommend arriving early or using public transportation.'
      }
    ],
    venueDetails: {
      fullAddress: 'My Dinh National Stadium, Pham Hung Street, Tu Liem District, Hanoi',
      latitude: 21.0285,
      longitude: 105.7650,
      publicTransit: 'Bus routes 14, 22, 34, 41 stop nearby. Cat Linh-Ha Dong metro line planned.',
      parking: 'On-site parking available for 50,000 VND/day'
    }
  },
  {
    id: 'evt-2',
    title: 'Vietnam National Music Awards 2025',
    slug: 'vietnam-national-music-awards-2025',
    category: 'Music',
    image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3',
    date: '2025-08-20',
    time: '19:00',
    venue: 'Hanoi Opera House',
    city: 'Hanoi',
    description: 'An annual celebration of Vietnamese music excellence honoring the best artists, songs, and performances.',
    fullDescription: 'The Vietnam National Music Awards is the most prestigious music awards ceremony in Vietnam. Join us for an elegant evening celebrating the finest Vietnamese musical talent across all genres.',
    organizerId: 'org-2',
    organizerName: 'Vietnam Music Association',
    ticketTiers: [
      {
        id: 'tier-4',
        name: 'Category A',
        price: 800000,
        available: 120,
        total: 200,
        description: 'Premium orchestra seating with excellent view'
      },
      {
        id: 'tier-5',
        name: 'Category B',
        price: 500000,
        available: 200,
        total: 300,
        description: 'Balcony seating with good view'
      },
      {
        id: 'tier-6',
        name: 'Category C',
        price: 300000,
        available: 150,
        total: 200,
        description: 'Upper balcony seating'
      }
    ],
    policies: {
      refundable: false,
      transferable: true
    },
    status: 'published',
    createdAt: '2025-05-15T14:30:00',
    highlights: [
      {
        icon: 'award',
        title: 'Prestigious Awards',
        description: 'Honoring the best in Vietnamese music'
      },
      {
        icon: 'star',
        title: 'Live Performances',
        description: 'Special performances by nominated artists'
      },
      {
        icon: 'users',
        title: 'Celebrity Guests',
        description: 'Meet your favorite Vietnamese stars'
      }
    ],
    faqs: [
      {
        question: 'What is the dress code?',
        answer: 'Smart casual to formal attire is recommended for this prestigious event.'
      },
      {
        question: 'Will the event be televised?',
        answer: 'Yes, the awards will be broadcast live on VTV1 and streamed online.'
      }
    ],
    venueDetails: {
      fullAddress: '1 Trang Tien Street, Hoan Kiem District, Hanoi',
      latitude: 21.0245,
      longitude: 105.8542,
      publicTransit: 'Located in central Hanoi, accessible by bus routes 9, 14, 36',
      parking: 'Limited street parking, public parking garages nearby'
    }
  },
  {
    id: 'evt-3',
    title: 'Tech Innovation Summit 2025',
    slug: 'tech-innovation-summit-2025',
    category: 'Conference',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87',
    date: '2025-09-30',
    time: '09:00',
    venue: 'Saigon Convention Center',
    city: 'Ho Chi Minh City',
    description: 'The leading technology conference in Southeast Asia, featuring keynotes from industry leaders and hands-on workshops.',
    fullDescription: 'Join technology professionals, entrepreneurs, and innovators at the Tech Innovation Summit 2025. This two-day conference features inspiring keynotes, practical workshops, and unparalleled networking opportunities.',
    organizerId: 'org-3',
    organizerName: 'TechViet Events',
    ticketTiers: [
      {
        id: 'tier-7',
        name: 'Standard Pass',
        price: 2500000,
        available: 450,
        total: 800,
        description: 'Access to all keynotes and exhibition hall'
      },
      {
        id: 'tier-8',
        name: 'Workshop Pass',
        price: 4500000,
        available: 80,
        total: 200,
        description: 'Standard pass benefits plus access to all workshops'
      },
      {
        id: 'tier-9',
        name: 'VIP All-Access',
        price: 8000000,
        available: 15,
        total: 50,
        description: 'Complete access including VIP networking dinner'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-09-23'
    },
    status: 'published',
    createdAt: '2025-04-20T09:00:00',
    highlights: [
      {
        icon: 'briefcase',
        title: '50+ Expert Speakers',
        description: 'Industry leaders from Google, Microsoft, and more'
      },
      {
        icon: 'users',
        title: 'Networking Opportunities',
        description: 'Connect with 2000+ tech professionals'
      },
      {
        icon: 'book',
        title: '20+ Workshops',
        description: 'Hands-on learning in AI, blockchain, and cloud'
      }
    ],
    faqs: [
      {
        question: 'What topics will be covered?',
        answer: 'AI, Machine Learning, Blockchain, Cloud Computing, Cybersecurity, and Startup Growth Strategies.'
      },
      {
        question: 'Are meals included?',
        answer: 'Light refreshments and lunch are included with all ticket types.'
      },
      {
        question: 'Will presentations be recorded?',
        answer: 'Yes, all keynotes will be recorded and shared with ticket holders after the event.'
      }
    ],
    venueDetails: {
      fullAddress: '37 Ton Duc Thang Street, District 1, Ho Chi Minh City',
      latitude: 10.7862,
      longitude: 106.7019,
      publicTransit: 'Nearby metro station: Ba Son (Metro Line 1)',
      parking: 'Underground parking available for 30,000 VND/day'
    }
  },
  {
    id: 'evt-4',
    title: 'Contemporary Art Exhibition',
    slug: 'contemporary-art-exhibition',
    category: 'Arts',
    image: 'https://images.unsplash.com/photo-1531243269054-5ebf6f34081e',
    date: '2025-10-15',
    time: '10:00',
    venue: 'Vietnam National Museum of Fine Arts',
    city: 'Hanoi',
    description: 'A curated exhibition showcasing contemporary Vietnamese and international artists exploring themes of identity and transformation.',
    fullDescription: 'Immerse yourself in the world of contemporary art with works from over 30 Vietnamese and international artists. This exhibition explores modern interpretations of traditional themes and cutting-edge artistic techniques.',
    organizerId: 'org-4',
    organizerName: 'Vietnam Fine Arts Association',
    ticketTiers: [
      {
        id: 'tier-10',
        name: 'General Admission',
        price: 150000,
        available: 500,
        total: 1000,
        description: 'Access to all exhibition halls'
      },
      {
        id: 'tier-11',
        name: 'Guided Tour',
        price: 350000,
        available: 45,
        total: 100,
        description: 'General admission plus expert-guided tour'
      },
      {
        id: 'tier-12',
        name: 'Artist Meet & Greet',
        price: 750000,
        available: 18,
        total: 30,
        description: 'VIP evening event with featured artists'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-10-13'
    },
    status: 'published',
    createdAt: '2025-06-10T11:00:00',
    highlights: [
      {
        icon: 'palette',
        title: '30+ Artists',
        description: 'Vietnamese and international contemporary artists'
      },
      {
        icon: 'image',
        title: '100+ Artworks',
        description: 'Paintings, sculptures, installations, and multimedia'
      },
      {
        icon: 'calendar',
        title: 'Month-Long Exhibition',
        description: 'Open daily from October 15 to November 15'
      }
    ],
    faqs: [
      {
        question: 'Can I take photos?',
        answer: 'Photography is allowed without flash in most areas. Some artworks may have restrictions.'
      },
      {
        question: 'Is the museum accessible?',
        answer: 'Yes, the museum is wheelchair accessible with elevators and ramps.'
      },
      {
        question: 'Are there student discounts?',
        answer: 'Students with valid ID receive 30% discount on General Admission tickets.'
      }
    ],
    venueDetails: {
      fullAddress: '66 Nguyen Thai Hoc Street, Ba Dinh District, Hanoi',
      latitude: 21.0341,
      longitude: 105.8372,
      publicTransit: 'Bus routes 9, 18, 33 stop nearby',
      parking: 'Street parking available, arrive early on weekends'
    }
  },
  {
    id: 'evt-5',
    title: 'Vietnam International Marathon',
    slug: 'vietnam-international-marathon',
    category: 'Sports',
    image: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3',
    date: '2025-11-20',
    time: '05:30',
    venue: 'Hoan Kiem Lake',
    city: 'Hanoi',
    description: 'Join thousands of runners in Hanoi\'s premier marathon event with routes through the city\'s most scenic locations.',
    fullDescription: 'The Vietnam International Marathon welcomes runners of all levels. Choose from full marathon (42km), half marathon (21km), 10km run, or 5km fun run. Experience Hanoi\'s beauty while challenging yourself!',
    organizerId: 'org-5',
    organizerName: 'Vietnam Athletics Federation',
    ticketTiers: [
      {
        id: 'tier-13',
        name: 'Full Marathon (42km)',
        price: 850000,
        available: 1200,
        total: 2000,
        description: 'Full marathon registration with race kit'
      },
      {
        id: 'tier-14',
        name: 'Half Marathon (21km)',
        price: 550000,
        available: 1800,
        total: 3000,
        description: 'Half marathon registration with race kit'
      },
      {
        id: 'tier-15',
        name: '10km Run',
        price: 350000,
        available: 2500,
        total: 4000,
        description: '10km race registration with race kit'
      },
      {
        id: 'tier-16',
        name: '5km Fun Run',
        price: 200000,
        available: 3000,
        total: 5000,
        description: '5km fun run registration with race kit'
      }
    ],
    policies: {
      refundable: false,
      transferable: false
    },
    status: 'published',
    createdAt: '2025-06-01T08:00:00',
    highlights: [
      {
        icon: 'trophy',
        title: 'International Event',
        description: 'AIMS certified marathon course'
      },
      {
        icon: 'map',
        title: 'Scenic Route',
        description: 'Run through Hanoi\'s historic landmarks'
      },
      {
        icon: 'gift',
        title: 'Race Kit Included',
        description: 'T-shirt, bib, medal, and more'
      }
    ],
    faqs: [
      {
        question: 'What is included in the race kit?',
        answer: 'Race bib, timing chip, official t-shirt, finisher medal, and race bag with sponsor items.'
      },
      {
        question: 'Are there age restrictions?',
        answer: 'Full and half marathon: minimum 18 years. 10km: minimum 16 years. 5km: minimum 12 years with guardian.'
      },
      {
        question: 'Will there be water stations?',
        answer: 'Yes, water stations every 2.5km along all routes.'
      }
    ],
    venueDetails: {
      fullAddress: 'Starting point: Hoan Kiem Lake, Hoan Kiem District, Hanoi',
      latitude: 21.0285,
      longitude: 105.8542,
      publicTransit: 'Multiple bus routes to Hoan Kiem Lake. Early morning service available on race day.',
      parking: 'Limited parking. Participants encouraged to use public transport or hotel shuttles.'
    }
  },
  {
    id: 'evt-6',
    title: 'Vietnamese Street Food Festival',
    slug: 'vietnamese-street-food-festival',
    category: 'Food & Drink',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1',
    date: '2025-12-05',
    time: '11:00',
    venue: 'Pham Ngu Lao Park',
    city: 'Ho Chi Minh City',
    description: 'Celebrate Vietnam\'s rich culinary heritage with over 100 food vendors serving authentic street food from across the country.',
    fullDescription: 'Experience the flavors of Vietnam at our annual Street Food Festival! Sample dishes from all regions, watch cooking demonstrations by celebrity chefs, and enjoy live traditional music performances.',
    organizerId: 'org-6',
    organizerName: 'Saigon Food Culture',
    ticketTiers: [
      {
        id: 'tier-17',
        name: 'General Entry',
        price: 100000,
        available: 5000,
        total: 8000,
        description: 'Festival entry and welcome drink token'
      },
      {
        id: 'tier-18',
        name: 'Foodie Pass',
        price: 500000,
        available: 800,
        total: 1500,
        description: 'Entry plus 10 food tokens and chef demo access'
      },
      {
        id: 'tier-19',
        name: 'VIP Culinary Experience',
        price: 1200000,
        available: 75,
        total: 150,
        description: 'All benefits plus VIP lounge and chef meet & greet'
      }
    ],
    policies: {
      refundable: true,
      transferable: true,
      refundDeadline: '2025-12-01'
    },
    status: 'published',
    createdAt: '2025-07-01T10:00:00',
    highlights: [
      {
        icon: 'utensils',
        title: '100+ Food Vendors',
        description: 'Authentic dishes from all Vietnamese regions'
      },
      {
        icon: 'chef-hat',
        title: 'Celebrity Chefs',
        description: 'Cooking demonstrations and workshops'
      },
      {
        icon: 'music',
        title: 'Live Entertainment',
        description: 'Traditional music and cultural performances'
      }
    ],
    faqs: [
      {
        question: 'How do food tokens work?',
        answer: 'Purchase tokens at the entrance or upgrade booths. Each token is worth 50,000 VND and can be used at any vendor.'
      },
      {
        question: 'Are there vegetarian options?',
        answer: 'Yes! We have a dedicated vegetarian and vegan food zone with over 20 vendors.'
      },
      {
        question: 'Is the event family-friendly?',
        answer: 'Absolutely! We have a kids zone with activities and a special children\'s menu.'
      }
    ],
    venueDetails: {
      fullAddress: 'Pham Ngu Lao Park, District 1, Ho Chi Minh City',
      latitude: 10.7676,
      longitude: 106.6918,
      publicTransit: 'Bus routes 11, 36, 152 stop nearby',
      parking: 'Nearby parking at 23/9 Park parking garage'
    }
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
    userName: 'Nguyen Van A',
    paymentMethod: 'Visa •••• 4242'
  },
  {
    id: 'ord-2',
    userId: 'user-1',
    eventId: 'evt-2',
    tickets: [
      {
        id: 'tkt-3',
        tierId: 'tier-4',
        tierName: 'Category A',
        price: 800000,
        qrCode: 'QR-VNM-THA-001',
        status: 'valid',
        seatInfo: 'Section A, Row 5, Seat 12'
      }
    ],
    subtotal: 800000,
    serviceFee: 40000,
    total: 840000,
    status: 'completed',
    createdAt: '2025-10-20T14:15:00',
    userEmail: 'user@example.com',
    userName: 'Nguyen Van A',
    paymentMethod: 'MoMo'
  },
  {
    id: 'ord-3',
    userId: 'user-1',
    eventId: 'evt-3',
    tickets: [
      {
        id: 'tkt-4',
        tierId: 'tier-7',
        tierName: 'Standard Pass',
        price: 2500000,
        qrCode: 'QR-TIS-STD-001',
        status: 'valid'
      }
    ],
    subtotal: 2500000,
    serviceFee: 125000,
    total: 2625000,
    status: 'completed',
    createdAt: '2025-10-25T09:00:00',
    userEmail: 'user@example.com',
    userName: 'Nguyen Van A',
    paymentMethod: 'VNPay'
  }
];

export const mockWishlist: WishlistItem[] = [
  {
    id: 'wish-1',
    userId: 'user-1',
    eventId: 'evt-1',
    addedAt: '2025-10-01T10:00:00'
  },
  {
    id: 'wish-2',
    userId: 'user-1',
    eventId: 'evt-3',
    addedAt: '2025-10-05T14:30:00'
  },
  {
    id: 'wish-3',
    userId: 'user-1',
    eventId: 'evt-4',
    addedAt: '2025-10-10T08:15:00'
  }
];

export const mockWaitlist: WaitlistEntry[] = [
  {
    id: 'wait-1',
    userId: 'user-1',
    eventId: 'evt-1',
    position: 15,
    status: 'active',
    joinedAt: '2025-11-01T10:00:00',
    estimatedNotification: '2025-12-01'
  },
  {
    id: 'wait-2',
    userId: 'user-1',
    eventId: 'evt-2',
    position: 1,
    status: 'notified',
    joinedAt: '2025-10-28T16:20:00',
    estimatedNotification: '2025-11-15'
  },
  {
    id: 'wait-3',
    userId: 'user-1',
    eventId: 'evt-3',
    position: 0,
    status: 'expired',
    joinedAt: '2025-10-01T12:00:00'
  }
];
