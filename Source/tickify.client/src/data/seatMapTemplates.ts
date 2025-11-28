// Seat map templates based on real stadiums in Vietnam

export interface SeatMapTemplate {
  id: string;
  name: string;
  venue: string;
  description: string;
  rows: number;
  cols: number;
  zones: {
    id: string;
    name: string;
    color: string;
    price: number;
    rowRange: { start: number; end: number };
    colRange: { start: number; end: number };
  }[];
  seats: {
    row: number;
    col: number;
    zoneId: string;
    isBlocked: boolean;
    isWheelchair: boolean;
  }[];
}

export const vietnamStadiumTemplates: SeatMapTemplate[] = [
  {
    id: "my-dinh",
    name: "Sân vận động Mỹ Đình",
    venue: "Mỹ Đình National Stadium",
    description: "Sân vận động quốc gia với sức chứa lớn, phù hợp cho các sự kiện thể thao và concert",
    rows: 25,
    cols: 40,
    zones: [
      {
        id: "zone1",
        name: "VIP",
        color: "#FF6B6B",
        price: 500000,
        rowRange: { start: 0, end: 4 },
        colRange: { start: 0, end: 40 },
      },
      {
        id: "zone2",
        name: "Khán đài A",
        color: "#4ECDC4",
        price: 300000,
        rowRange: { start: 5, end: 12 },
        colRange: { start: 0, end: 40 },
      },
      {
        id: "zone3",
        name: "Khán đài B",
        color: "#45B7D1",
        price: 200000,
        rowRange: { start: 13, end: 20 },
        colRange: { start: 0, end: 40 },
      },
      {
        id: "zone4",
        name: "Khán đài C",
        color: "#96CEB4",
        price: 150000,
        rowRange: { start: 21, end: 24 },
        colRange: { start: 0, end: 40 },
      },
    ],
    seats: [],
  },
  {
    id: "thong-nhat",
    name: "Sân vận động Thống Nhất",
    venue: "Thống Nhất Stadium",
    description: "Sân vận động truyền thống ở TP.HCM, phù hợp cho các sự kiện vừa và nhỏ",
    rows: 18,
    cols: 30,
    zones: [
      {
        id: "zone1",
        name: "Khán đài VIP",
        color: "#FF6B6B",
        price: 400000,
        rowRange: { start: 0, end: 3 },
        colRange: { start: 0, end: 30 },
      },
      {
        id: "zone2",
        name: "Khán đài chính",
        color: "#4ECDC4",
        price: 250000,
        rowRange: { start: 4, end: 10 },
        colRange: { start: 0, end: 30 },
      },
      {
        id: "zone3",
        name: "Khán đài phụ",
        color: "#45B7D1",
        price: 150000,
        rowRange: { start: 11, end: 17 },
        colRange: { start: 0, end: 30 },
      },
    ],
    seats: [],
  },
  {
    id: "hang-day",
    name: "Sân vận động Hàng Đẫy",
    venue: "Hàng Đẫy Stadium",
    description: "Sân vận động nhỏ gọn, phù hợp cho các sự kiện âm nhạc và thể thao trong nhà",
    rows: 15,
    cols: 25,
    zones: [
      {
        id: "zone1",
        name: "VIP",
        color: "#FF6B6B",
        price: 350000,
        rowRange: { start: 0, end: 3 },
        colRange: { start: 0, end: 25 },
      },
      {
        id: "zone2",
        name: "Khán đài A",
        color: "#4ECDC4",
        price: 200000,
        rowRange: { start: 4, end: 9 },
        colRange: { start: 0, end: 25 },
      },
      {
        id: "zone3",
        name: "Khán đài B",
        color: "#96CEB4",
        price: 120000,
        rowRange: { start: 10, end: 14 },
        colRange: { start: 0, end: 25 },
      },
    ],
    seats: [],
  },
];

// Helper function to generate seats from template
export function generateSeatsFromTemplate(template: SeatMapTemplate): {
  id: string;
  row: number;
  col: number;
  zoneId: string | null;
  isBlocked: boolean;
  isWheelchair: boolean;
  label?: string;
}[] {
  const seats: {
    id: string;
    row: number;
    col: number;
    zoneId: string | null;
    isBlocked: boolean;
    isWheelchair: boolean;
    label?: string;
  }[] = [];

  // Generate seats based on zones
  for (let row = 0; row < template.rows; row++) {
    for (let col = 0; col < template.cols; col++) {
      // Skip center aisle (middle column)
      if (col === Math.floor(template.cols / 2)) {
        continue;
      }

      // Find which zone this seat belongs to
      let zoneId: string | null = null;
      for (const zone of template.zones) {
        if (
          row >= zone.rowRange.start &&
          row <= zone.rowRange.end &&
          col >= zone.colRange.start &&
          col <= zone.colRange.end
        ) {
          zoneId = zone.id;
          break;
        }
      }

      // Add wheelchair accessible seats in first row of each zone
      const isWheelchair = row === 0 || row === 5 || row === 13 || row === 21;

      seats.push({
        id: `${row}-${col}`,
        row,
        col,
        zoneId,
        isBlocked: false,
        isWheelchair,
      });
    }
  }

  // Auto-number seats
  const rowLetters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const seatsByRow = new Map<number, typeof seats>();
  seats.forEach((seat) => {
    const rowSeats = seatsByRow.get(seat.row) || [];
    rowSeats.push(seat);
    seatsByRow.set(seat.row, rowSeats);
  });

  return seats.map((seat) => {
    const rowSeats = seatsByRow.get(seat.row) || [];
    rowSeats.sort((a, b) => a.col - b.col);
    const seatIndex = rowSeats.findIndex((s) => s.id === seat.id);
    const rowLabel = rowLetters[seat.row % 26];
    return {
      ...seat,
      label: `${rowLabel}${seatIndex + 1}`,
    };
  });
}

// Helper function to convert template zones to SeatMapBuilder format
export function convertTemplateZonesToBuilderFormat(
  template: SeatMapTemplate
): {
  id: string;
  name: string;
  color: string;
  price: number;
  capacity: number;
}[] {
  return template.zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    color: zone.color,
    price: zone.price,
    capacity: 0, // Will be calculated when seats are generated
  }));
}

