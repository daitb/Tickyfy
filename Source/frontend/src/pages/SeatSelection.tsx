import { useState, useEffect } from 'react';
import {
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Clock,
  X,
  Check,
  Star,
  Circle,
  AlertCircle,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription } from '../components/ui/alert';
import { mockEvents } from '../mockData';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

interface SeatSelectionProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

type SeatStatus = 'available' | 'selected' | 'booked' | 'vip';

interface Seat {
  row: string;
  number: number;
  status: SeatStatus;
  price: number;
  type: string;
}

// Generate seat map
const generateSeats = (): Seat[] => {
  const rows = 'ABCDEFGHIJ'.split('');
  const seats: Seat[] = [];
  
  rows.forEach((row, rowIndex) => {
    for (let num = 1; num <= 20; num++) {
      let status: SeatStatus = 'available';
      let price = 250000; // Standard
      let type = 'Standard';

      // VIP seats (first 2 rows)
      if (rowIndex < 2) {
        status = 'vip';
        price = 500000;
        type = 'VIP';
      }

      // Some booked seats
      if (Math.random() > 0.7) {
        status = 'booked';
      }

      // Don't mark special seats as booked
      if (status === 'vip') {
        if (Math.random() > 0.5) {
          status = status; // Keep original status
        }
      }

      seats.push({ row, number: num, status, price, type });
    }
  });

  return seats;
};

export function SeatSelection({ eventId, onNavigate }: SeatSelectionProps) {
  const [seats, setSeats] = useState<Seat[]>(generateSeats());
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [zoom, setZoom] = useState(1);
  const [ticketType, setTicketType] = useState('standard');
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds

  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reset selections
          setSelectedSeats([]);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'booked') return;

    const isSelected = selectedSeats.find((s) => s.row === seat.row && s.number === seat.number);

    if (isSelected) {
      // Deselect
      setSelectedSeats(selectedSeats.filter((s) => !(s.row === seat.row && s.number === seat.number)));
      setSeats(
        seats.map((s) =>
          s.row === seat.row && s.number === seat.number
            ? { ...s, status: s.status === 'selected' ? (s.type === 'VIP' ? 'vip' : 'available') as SeatStatus : s.status }
            : s
        )
      );
    } else {
      // Check max seats
      if (selectedSeats.length >= 8) {
        alert('Maximum 8 seats can be selected');
        return;
      }

      // Select
      setSelectedSeats([...selectedSeats, seat]);
      setSeats(
        seats.map((s) =>
          s.row === seat.row && s.number === seat.number ? { ...s, status: 'selected' } : s
        )
      );
    }
  };

  const getSeatColor = (status: SeatStatus) => {
    switch (status) {
      case 'available':
        return 'border-gray-300 bg-white hover:bg-gray-50';
      case 'selected':
        return 'border-purple-600 bg-purple-600 text-white';
      case 'booked':
        return 'border-red-500 bg-red-500 text-white cursor-not-allowed';
      case 'vip':
        return 'border-yellow-500 bg-yellow-50 hover:bg-yellow-100';
      default:
        return 'border-gray-300 bg-white';
    }
  };

  const getSeatIcon = (status: SeatStatus) => {
    switch (status) {
      case 'selected':
        return <Check size={12} />;
      case 'booked':
        return <X size={12} />;
      case 'vip':
        return <Star size={12} />;
      default:
        return <Circle size={8} />;
    }
  };

  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const platformFee = subtotal * 0.05;
  const total = subtotal + platformFee;

  const clearSelection = () => {
    setSelectedSeats([]);
    setSeats(generateSeats());
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Event Header with Background */}
      <div className="relative h-48 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/70 z-10" />
        <ImageWithFallback
          src={event.image}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover blur-sm"
        />
        <div className="relative z-20 max-w-7xl mx-auto px-4 h-full flex flex-col justify-center text-white">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-4">
            <button onClick={() => onNavigate('home')} className="hover:underline">
              Home
            </button>
            <ChevronRight size={14} />
            <button onClick={() => onNavigate('event-detail', event.id)} className="hover:underline">
              {event.title}
            </button>
            <ChevronRight size={14} />
            <span>Select Seats</span>
          </div>

          <h1 className="mb-2">{event.title}</h1>
          <p className="text-white/90">
            {event.date} • {event.time} • {event.venue}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Seat Map */}
          <div className="flex-1">
            <Card>
              <CardContent className="p-6">
                {/* Timer Warning */}
                {timeRemaining <= 300 && timeRemaining > 0 && (
                  <Alert className="mb-4 bg-orange-50 border-orange-200">
                    <Clock className="text-orange-600" size={16} />
                    <AlertDescription className="text-orange-800">
                      Your seats are reserved for {formatTime(timeRemaining)}
                    </AlertDescription>
                  </Alert>
                )}

                {timeRemaining === 0 && (
                  <Alert className="mb-4 bg-red-50 border-red-200">
                    <AlertCircle className="text-red-600" size={16} />
                    <AlertDescription className="text-red-800">
                      Your seat reservation has expired. Please select seats again.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Zoom Controls */}
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-neutral-900">Select Your Seats</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    >
                      <ZoomOut size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(1.5, zoom + 0.1))}
                    >
                      <ZoomIn size={16} />
                    </Button>
                  </div>
                </div>

                {/* Stage */}
                <div className="mb-8">
                  <div className="bg-gradient-to-b from-gray-600 to-gray-500 text-white text-center py-4 rounded-t-full">
                    STAGE
                  </div>
                </div>

                {/* Seat Map */}
                <div className="overflow-auto">
                  <div
                    style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
                    className="transition-transform"
                  >
                    <div className="inline-block">
                      {/* Row by row */}
                      {'ABCDEFGHIJ'.split('').map((row) => (
                        <div key={row} className="flex items-center gap-2 mb-2">
                          {/* Row label */}
                          <div className="w-8 text-center text-sm text-gray-600">{row}</div>

                          {/* Seats */}
                          <div className="flex gap-1">
                            {seats
                              .filter((s) => s.row === row)
                              .map((seat) => (
                                <button
                                  key={`${seat.row}${seat.number}`}
                                  onClick={() => handleSeatClick(seat)}
                                  disabled={seat.status === 'booked'}
                                  className={`w-8 h-8 rounded border-2 flex items-center justify-center text-xs transition-all hover:scale-110 ${getSeatColor(
                                    seat.status
                                  )}`}
                                  title={`${seat.row}${seat.number} - ${seat.type} - ${seat.price.toLocaleString()}₫`}
                                >
                                  {getSeatIcon(seat.status)}
                                </button>
                              ))}
                          </div>

                          {/* Row label (right) */}
                          <div className="w-8 text-center text-sm text-gray-600">{row}</div>
                        </div>
                      ))}

                      {/* Seat numbers */}
                      <div className="flex items-center gap-2 mt-4">
                        <div className="w-8" />
                        <div className="flex gap-1">
                          {Array.from({ length: 20 }, (_, i) => (
                            <div key={i} className="w-8 text-center text-xs text-gray-500">
                              {i + 1}
                            </div>
                          ))}
                        </div>
                        <div className="w-8" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm text-gray-700 mb-3">Legend</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border-2 border-gray-300 bg-white flex items-center justify-center">
                        <Circle size={8} />
                      </div>
                      <span className="text-sm text-gray-600">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border-2 border-purple-600 bg-purple-600 text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                      <span className="text-sm text-gray-600">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border-2 border-red-500 bg-red-500 text-white flex items-center justify-center">
                        <X size={12} />
                      </div>
                      <span className="text-sm text-gray-600">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded border-2 border-yellow-500 bg-yellow-50 flex items-center justify-center">
                        <Star size={12} />
                      </div>
                      <span className="text-sm text-gray-600">VIP</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="w-96 flex-shrink-0">
            <div className="sticky top-8">
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-neutral-900 mb-4">Booking Summary</h3>

                  {/* Ticket Type Selector */}
                  <div className="mb-4">
                    <Label className="text-sm text-gray-600 mb-2 block">Ticket Type</Label>
                    <Select value={ticketType} onValueChange={setTicketType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vip">VIP - 500,000₫</SelectItem>
                        <SelectItem value="standard">Standard - 250,000₫</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Timer */}
                  <div className="mb-4">
                    <Badge className="w-full justify-center bg-orange-500 text-white py-2">
                      <Clock size={14} className="mr-2" />
                      Reserved for {formatTime(timeRemaining)}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  {/* Selected Seats */}
                  <div className="mb-4">
                    <h4 className="text-sm text-gray-700 mb-3">
                      Selected Seats ({selectedSeats.length})
                    </h4>
                    {selectedSeats.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No seats selected</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {selectedSeats.map((seat) => (
                          <div
                            key={`${seat.row}${seat.number}`}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <div>
                              <div className="text-sm">
                                Row {seat.row}, Seat {seat.number}
                              </div>
                              <div className="text-xs text-gray-500">{seat.type}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{seat.price.toLocaleString()}₫</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSeatClick(seat)}
                                className="h-6 w-6 p-0"
                              >
                                <X size={14} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Separator className="my-4" />

                  {/* Price Breakdown */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">{subtotal.toLocaleString()}₫</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Platform Fee (5%)</span>
                      <span className="text-gray-900">{platformFee.toLocaleString()}₫</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-gray-900">Total</span>
                      <span className="text-neutral-900">{total.toLocaleString()}₫</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <Button
                      onClick={() => onNavigate('checkout')}
                      disabled={selectedSeats.length === 0}
                      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Continue to Payment
                    </Button>
                    <Button
                      variant="outline"
                      onClick={clearSelection}
                      disabled={selectedSeats.length === 0}
                      className="w-full"
                    >
                      Clear Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}