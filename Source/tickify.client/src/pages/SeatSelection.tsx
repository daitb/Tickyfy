import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ZoomIn, ZoomOut, Maximize2, Search, Info, Star, Clock, Check, X, ChevronDown, MapPin, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Alert, AlertDescription } from '../components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

interface SeatSelectionProps {
  onNavigate: (page: string) => void;
}

type SeatStatus = 'available' | 'selected' | 'sold' | 'reserved' | 'vip' | 'wheelchair';

interface Seat {
  id: string;
  row: string;
  number: number;
  zone: string;
  price: number;
  status: SeatStatus;
  viewQuality: number;
  isWheelchairAccessible?: boolean;
}

interface Zone {
  id: string;
  name: string;
  color: string;
  price: number;
  available: number;
  total: number;
}

const zones: Zone[] = [
  { id: 'vip', name: 'VIP Section', color: '#FFD700', price: 150, available: 12, total: 20 },
  { id: 'orchestra', name: 'Orchestra', color: '#00C16A', price: 120, available: 45, total: 100 },
  { id: 'mezzanine', name: 'Mezzanine', color: '#4F46E5', price: 80, available: 78, total: 150 },
  { id: 'balcony', name: 'Balcony', color: '#7C3AED', price: 50, available: 125, total: 200 },
];

// Generate sample seats
const generateSeats = (): Seat[] => {
  const seats: Seat[] = [];
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
  
  rows.forEach((row, rowIndex) => {
    const seatsInRow = rowIndex < 4 ? 20 : rowIndex < 8 ? 24 : 28;
    const zone = rowIndex < 4 ? 'orchestra' : rowIndex < 8 ? 'mezzanine' : 'balcony';
    const price = rowIndex < 4 ? 120 : rowIndex < 8 ? 80 : 50;
    
    for (let i = 1; i <= seatsInRow; i++) {
      const random = Math.random();
      let status: SeatStatus = 'available';
      
      if (random < 0.15) status = 'sold';
      else if (random < 0.18) status = 'reserved';
      
      // Add some wheelchair accessible seats
      const isWheelchair = row === 'H' && (i === 1 || i === seatsInRow);
      
      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
        zone,
        price,
        status: isWheelchair ? 'wheelchair' : status,
        viewQuality: Math.max(1, 5 - Math.floor(rowIndex / 3)),
        isWheelchairAccessible: isWheelchair,
      });
    }
  });
  
  // Add VIP section
  ['AA', 'BB'].forEach((row) => {
    for (let i = 1; i <= 10; i++) {
      const random = Math.random();
      seats.push({
        id: `${row}${i}`,
        row,
        number: i,
        zone: 'vip',
        price: 150,
        status: random < 0.4 ? 'sold' : 'vip',
        viewQuality: 5,
      });
    }
  });
  
  return seats;
};

export function SeatSelection({ onNavigate }: SeatSelectionProps) {
  const { t } = useTranslation();
  const [seats, setSeats] = useState<Seat[]>(generateSeats());
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [hoveredSeat, setHoveredSeat] = useState<Seat | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [zoom, setZoom] = useState(1);
  const [showLegend, setShowLegend] = useState(true);
  const [searchSeat, setSearchSeat] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes
  const [showTimerWarning, setShowTimerWarning] = useState(false);
  const [keepTogether, setKeepTogether] = useState(true);

  // Countdown timer
  useEffect(() => {
    if (selectedSeats.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Release seats
          setSelectedSeats([]);
          setSeats((seats) =>
            seats.map((s) => (s.status === 'selected' ? { ...s, status: 'available' } : s))
          );
          return 600;
        }
        
        if (prev === 120 && !showTimerWarning) {
          setShowTimerWarning(true);
        }
        
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [selectedSeats.length, showTimerWarning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'sold' || seat.status === 'reserved') {
      // Shake animation handled by CSS
      return;
    }

    const isSelected = selectedSeats.some((s) => s.id === seat.id);

    if (isSelected) {
      // Deselect
      setSelectedSeats(selectedSeats.filter((s) => s.id !== seat.id));
      setSeats(
        seats.map((s) => (s.id === seat.id ? { ...s, status: s.zone === 'vip' ? 'vip' : 'available' } : s))
      );
    } else {
      // Select
      setSelectedSeats([...selectedSeats, seat]);
      setSeats(seats.map((s) => (s.id === seat.id ? { ...s, status: 'selected' } : s)));
    }
  };

  const handleAutoSelect = () => {
    // Simple auto-select: find best available seats
    const availableSeats = seats.filter(
      (s) => s.status === 'available' && s.viewQuality >= 4
    );
    
    if (availableSeats.length >= 2) {
      const bestSeats = availableSeats.slice(0, 2);
      setSelectedSeats(bestSeats);
      setSeats(
        seats.map((s) =>
          bestSeats.some((bs) => bs.id === s.id) ? { ...s, status: 'selected' } : s
        )
      );
    }
  };

  const getSeatColor = (status: SeatStatus, isHovered: boolean) => {
    if (isHovered && status !== 'sold' && status !== 'reserved') {
      return 'scale-110 shadow-lg';
    }
    
    switch (status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 cursor-pointer';
      case 'selected':
        return 'bg-teal-500 text-white cursor-pointer';
      case 'sold':
        return 'bg-gray-300 cursor-not-allowed';
      case 'reserved':
        return 'bg-orange-300 cursor-not-allowed';
      case 'vip':
        return 'bg-yellow-400 hover:bg-yellow-500 cursor-pointer';
      case 'wheelchair':
        return 'bg-blue-100 hover:bg-blue-200 cursor-pointer';
      default:
        return 'bg-gray-200';
    }
  };

  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const serviceFee = subtotal * 0.1;
  const total = subtotal + serviceFee;

  const filteredSeats = selectedZone === 'all' 
    ? seats 
    : seats.filter((s) => s.zone === selectedZone);

  const availableCount = seats.filter((s) => s.status === 'available' || s.status === 'vip' || s.status === 'wheelchair').length;
  const soldCount = seats.filter((s) => s.status === 'sold').length;
  const selectedCount = selectedSeats.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="relative h-48 bg-gradient-to-r from-purple-600 to-pink-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative h-full max-w-7xl mx-auto px-4 py-6 flex flex-col justify-between">
          <Button
            variant="ghost"
            className="self-start text-white hover:bg-white/20"
            onClick={() => onNavigate('event-detail')}
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Event
          </Button>
          
          <div className="text-white">
            <h1 className="mb-2">Summer Music Festival 2024</h1>
            <div className="flex items-center gap-4 text-sm">
              <span>📅 July 20, 2024 • 7:00 PM</span>
              <span>📍 Madison Square Garden, New York</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timer Bar */}
      {selectedSeats.length > 0 && (
        <div className={`sticky top-0 z-40 ${timeRemaining < 300 ? 'bg-orange-500' : 'bg-purple-600'} text-white py-3 shadow-lg transition-colors`}>
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3">
            <Clock size={20} />
            <span className="text-sm">
              Time remaining to complete booking: <strong className="text-lg">{formatTime(timeRemaining)}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column - Ticket Types */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Select Ticket Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {zones.map((zone) => (
                  <button
                    key={zone.id}
                    onClick={() => setSelectedZone(zone.id)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      selectedZone === zone.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: zone.color }}
                        />
                        <span className="text-sm text-neutral-900">{zone.name}</span>
                      </div>
                    </div>
                    <div className="text-2xl text-neutral-900 mb-1">${zone.price}</div>
                    <div className="text-xs text-neutral-500">
                      {zone.available} of {zone.total} available
                    </div>
                  </button>
                ))}
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setSelectedZone('all')}
                >
                  View All Sections
                </Button>
              </CardContent>
            </Card>

            {/* Selected Seats Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Selected Seats</span>
                  <Badge>{selectedSeats.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedSeats.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    No seats selected yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedSeats.map((seat) => (
                      <div
                        key={seat.id}
                        className="flex items-center justify-between p-2 bg-neutral-50 rounded"
                      >
                        <div>
                          <div className="text-sm text-neutral-900">
                            Seat {seat.id}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {zones.find((z) => z.id === seat.zone)?.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-neutral-900">${seat.price}</span>
                          <button
                            onClick={() => handleSeatClick(seat)}
                            className="text-neutral-400 hover:text-red-500"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t pt-3 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Subtotal</span>
                        <span className="text-neutral-900">${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Service Fee</span>
                        <span className="text-neutral-900">${serviceFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg pt-2 border-t">
                        <span className="text-neutral-900">Total</span>
                        <span className="text-neutral-900">${total.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <Button
                      className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                      onClick={() => onNavigate('checkout')}
                    >
                      Continue to Checkout
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Seat Map */}
          <div className="lg:col-span-6 space-y-4">
            {/* Controls */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Search size={16} className="text-neutral-400" />
                    <Input
                      placeholder="Find seat (e.g., A12)"
                      value={searchSeat}
                      onChange={(e) => setSearchSeat(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                    >
                      <ZoomOut size={16} />
                    </Button>
                    <span className="text-sm text-neutral-600">{Math.round(zoom * 100)}%</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                    >
                      <ZoomIn size={16} />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setZoom(1)}
                    >
                      <Maximize2 size={16} />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seat Map */}
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                {/* Stage */}
                <div className="mb-8 text-center">
                  <div className="inline-block bg-gray-200 px-8 py-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">🎭</div>
                    <div className="text-sm text-gray-700">STAGE</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">↑ Stage View ↑</div>
                </div>

                {/* Seat Grid */}
                <div
                  className="overflow-auto"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s',
                  }}
                >
                  <div className="inline-block min-w-full">
                    {/* VIP Section */}
                    <div className="mb-6">
                      <div className="text-xs text-gray-500 mb-2 text-center">VIP Section</div>
                      {['AA', 'BB'].map((row) => (
                        <div key={row} className="flex items-center justify-center gap-1 mb-1">
                          <div className="w-6 text-xs text-gray-500 text-right">{row}</div>
                          {filteredSeats
                            .filter((s) => s.row === row)
                            .map((seat) => (
                              <div key={seat.id} className="relative group">
                                <button
                                  onClick={() => handleSeatClick(seat)}
                                  onMouseEnter={() => setHoveredSeat(seat)}
                                  onMouseLeave={() => setHoveredSeat(null)}
                                  className={`
                                    w-8 h-8 rounded text-xs flex items-center justify-center
                                    transition-all duration-200
                                    ${getSeatColor(seat.status, hoveredSeat?.id === seat.id)}
                                  `}
                                >
                                  {seat.status === 'selected' && <Check size={14} />}
                                  {seat.isWheelchairAccessible && '♿'}
                                </button>
                                
                                {/* Tooltip */}
                                {hoveredSeat?.id === seat.id && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                                    <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap">
                                      <div className="font-semibold mb-1">Seat {seat.id}</div>
                                      <div className="text-gray-300">
                                        {zones.find((z) => z.id === seat.zone)?.name}
                                      </div>
                                      <div className="text-teal-400 mt-1">${seat.price}</div>
                                      <div className="flex items-center gap-1 mt-1">
                                        {[...Array(seat.viewQuality)].map((_, i) => (
                                          <Star key={i} size={10} fill="gold" stroke="gold" />
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>

                    {/* Main Seating */}
                    {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map((row) => (
                      <div key={row} className="flex items-center justify-center gap-1 mb-1">
                        <div className="w-6 text-xs text-gray-500 text-right">{row}</div>
                        {filteredSeats
                          .filter((s) => s.row === row)
                          .map((seat, idx) => (
                            <div key={seat.id} className="relative group">
                              {/* Add aisle spacing */}
                              {idx === Math.floor(filteredSeats.filter((s) => s.row === row).length / 2) && (
                                <div className="w-4" />
                              )}
                              
                              <button
                                onClick={() => handleSeatClick(seat)}
                                onMouseEnter={() => setHoveredSeat(seat)}
                                onMouseLeave={() => setHoveredSeat(null)}
                                className={`
                                  w-8 h-8 rounded text-xs flex items-center justify-center
                                  transition-all duration-200
                                  ${getSeatColor(seat.status, hoveredSeat?.id === seat.id)}
                                `}
                              >
                                {seat.status === 'selected' && <Check size={14} />}
                                {seat.isWheelchairAccessible && '♿'}
                              </button>
                              
                              {/* Tooltip */}
                              {hoveredSeat?.id === seat.id && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50">
                                  <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl whitespace-nowrap">
                                    <div className="font-semibold mb-1">Seat {seat.id}</div>
                                    <div className="text-gray-300">
                                      {zones.find((z) => z.id === seat.zone)?.name}
                                    </div>
                                    <div className="text-teal-400 mt-1">${seat.price}</div>
                                    <div className="flex items-center gap-1 mt-1">
                                      {[...Array(seat.viewQuality)].map((_, i) => (
                                        <Star key={i} size={10} fill="gold" stroke="gold" />
                                      ))}
                                    </div>
                                    {seat.isWheelchairAccessible && (
                                      <div className="text-blue-400 mt-1">♿ Accessible</div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Legend & Info */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Legend</span>
                  <button onClick={() => setShowLegend(!showLegend)}>
                    <ChevronDown
                      size={20}
                      className={`transition-transform ${showLegend ? 'rotate-180' : ''}`}
                    />
                  </button>
                </CardTitle>
              </CardHeader>
              {showLegend && (
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-green-100 rounded" />
                      <span className="text-sm">Available</span>
                    </div>
                    <span className="text-xs text-neutral-500">{availableCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-teal-500 rounded" />
                      <span className="text-sm">Selected</span>
                    </div>
                    <span className="text-xs text-neutral-500">{selectedCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-300 rounded" />
                      <span className="text-sm">Sold</span>
                    </div>
                    <span className="text-xs text-neutral-500">{soldCount}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-yellow-400 rounded" />
                      <span className="text-sm">VIP</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs">
                        ♿
                      </div>
                      <span className="text-sm">Wheelchair</span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleAutoSelect}
                >
                  <Star size={16} className="mr-2" />
                  Auto-Select Best Seats
                </Button>
                
                <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
                  <span className="text-sm">Keep seats together</span>
                  <button
                    onClick={() => setKeepTogether(!keepTogether)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      keepTogether ? 'bg-teal-500' : 'bg-gray-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                        keepTogether ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm">
                  <div className="font-semibold mb-2">Tips</div>
                  <ul className="space-y-1 text-xs text-neutral-600">
                    <li>• Click seats to select/deselect</li>
                    <li>• Use zoom controls for better view</li>
                    <li>• Center seats offer best views</li>
                    <li>• Complete booking within timer</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>

      {/* Timer Warning Modal */}
      <Dialog open={showTimerWarning} onOpenChange={setShowTimerWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="text-orange-500" />
              Time Running Out
            </DialogTitle>
            <DialogDescription>
              You have less than 2 minutes to complete your booking. Your selected seats will be released if you don't proceed soon.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimerWarning(false)}>
              Continue Selecting
            </Button>
            <Button
              className="bg-gradient-to-r from-teal-500 to-teal-600"
              onClick={() => {
                setShowTimerWarning(false);
                onNavigate('checkout');
              }}
            >
              Proceed to Checkout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
