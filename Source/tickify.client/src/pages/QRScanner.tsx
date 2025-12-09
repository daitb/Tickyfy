import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Info,
  Camera,
  Zap,
  ZoomIn,
  Check,
  X,
  AlertTriangle,
  Clock,
  User,
  Ticket,
  ChevronUp,
  ChevronDown,
  Download,
  Settings,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { mockEvents } from '../mockData';

interface QRScannerProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

interface ScanResult {
  id: string;
  attendeeName: string;
  ticketCode: string;
  ticketType: string;
  seat?: string;
  timestamp: string;
  status: 'success' | 'error' | 'duplicate';
  photo?: string;
}

const mockScans: ScanResult[] = [
  {
    id: '1',
    attendeeName: 'John Doe',
    ticketCode: 'TIX-001',
    ticketType: 'VIP',
    seat: 'A12',
    timestamp: '2 mins ago',
    status: 'success',
  },
  {
    id: '2',
    attendeeName: 'Jane Smith',
    ticketCode: 'TIX-002',
    ticketType: 'Standard',
    timestamp: '5 mins ago',
    status: 'success',
  },
  {
    id: '3',
    attendeeName: 'Bob Johnson',
    ticketCode: 'TIX-003',
    ticketType: 'VIP',
    timestamp: '8 mins ago',
    status: 'duplicate',
  },
];

export function QRScanner({ eventId, onNavigate }: QRScannerProps) {
  const { t } = useTranslation();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTicketId, setManualTicketId] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSyncs, setPendingSyncs] = useState(5);
  const [checkedIn, setCheckedIn] = useState(123);
  const [totalCapacity] = useState(500);

  const event = mockEvents.find((e) => e.id === eventId) || mockEvents[0];

  const handleEnableCamera = () => {
    setCameraEnabled(true);
  };

  const simulateScan = (type: 'success' | 'error' | 'duplicate') => {
    const results = {
      success: {
        id: Date.now().toString(),
        attendeeName: 'Alice Williams',
        ticketCode: 'TIX-' + Math.floor(Math.random() * 1000),
        ticketType: 'Standard',
        seat: 'B15',
        timestamp: 'Just now',
        status: 'success' as const,
        photo: '/api/placeholder/80/80',
      },
      error: {
        id: Date.now().toString(),
        attendeeName: 'Invalid Ticket',
        ticketCode: 'TIX-INVALID',
        ticketType: '',
        timestamp: 'Just now',
        status: 'error' as const,
      },
      duplicate: {
        id: Date.now().toString(),
        attendeeName: 'Charlie Brown',
        ticketCode: 'TIX-789',
        ticketType: 'VIP',
        timestamp: 'Just now',
        status: 'duplicate' as const,
      },
    };

    setScanResult(results[type]);
    if (type === 'success') {
      setCheckedIn(checkedIn + 1);
    }

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setScanResult(null);
    }, 3000);
  };

  const handleManualVerify = () => {
    if (!manualTicketId.trim()) return;
    simulateScan('success');
    setManualTicketId('');
    setShowManualEntry(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('event-management')}
            className="text-white"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="flex-1 mx-4 text-center">
            <h2 className="text-white truncate text-sm">{event.title}</h2>
            <div className="text-xs text-gray-400 mt-1">
              {checkedIn}/{totalCapacity} checked in
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('event-detail', event.id)}
            className="text-white"
          >
            <Info size={20} />
          </Button>
        </div>

        {/* Online Status */}
        <div className="flex items-center justify-center gap-2 mt-2">
          <div
            className={`w-2 h-2 rounded-full ${isOffline ? 'bg-yellow-500' : 'bg-green-500'}`}
          />
          <span className="text-xs text-gray-400">
            {isOffline ? 'Offline Mode' : 'Live Syncing'}
          </span>
        </div>
      </div>

      {/* Offline Banner */}
      {isOffline && (
        <Alert className="bg-yellow-900 border-yellow-700 mx-4 mt-4">
          <WifiOff className="text-yellow-500" size={16} />
          <AlertDescription className="text-yellow-200">
            Offline Mode - {pendingSyncs} scans pending sync
            <Button size="sm" variant="link" className="text-yellow-200 underline ml-2">
              Sync Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Camera Viewfinder */}
      <div className="relative h-[500px] bg-black mx-4 mt-4 rounded-lg overflow-hidden">
        {!cameraEnabled ? (
          // Permission State
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Camera className="text-gray-500 mb-4" size={64} />
            <p className="text-gray-400 mb-6">Camera access required</p>
            <Button onClick={handleEnableCamera} className="bg-purple-600 hover:bg-purple-700">
              <Camera size={18} className="mr-2" />
              Enable Camera
            </Button>
          </div>
        ) : (
          <>
            {/* Simulated Camera Feed */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-6xl opacity-20">📷</div>
              </div>
            </div>

            {/* Scanning Frame */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64">
                {/* Corner Brackets */}
                <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-white rounded-tl-lg animate-pulse" />
                <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-white rounded-tr-lg animate-pulse" />
                <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-white rounded-bl-lg animate-pulse" />
                <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-white rounded-br-lg animate-pulse" />

                {/* Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/50" />
                    <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50" />
                  </div>
                </div>

                {/* Scanning Line */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent animate-scan" />
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="absolute top-4 left-0 right-0 text-center">
              <div className="inline-block bg-black/70 px-4 py-2 rounded-full text-sm">
                Position QR code within the frame
              </div>
            </div>

            {/* Camera Controls */}
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFlashEnabled(!flashEnabled)}
                  className={`${flashEnabled ? 'bg-yellow-500 text-black' : 'bg-black/70 text-white'}`}
                >
                  <Zap size={18} />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="bg-black/70 text-white"
                >
                  <Camera size={18} />
                </Button>

                <div className="flex items-center gap-2 bg-black/70 px-3 rounded">
                  <ZoomIn size={16} />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-xs">{zoom.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            {/* Test Buttons (for demo) */}
            <div className="absolute top-4 right-4 space-y-2">
              <Button
                size="sm"
                onClick={() => simulateScan('success')}
                className="bg-green-600 hover:bg-green-700"
              >
                Test Success
              </Button>
              <Button
                size="sm"
                onClick={() => simulateScan('error')}
                className="bg-red-600 hover:bg-red-700"
              >
                Test Error
              </Button>
              <Button
                size="sm"
                onClick={() => simulateScan('duplicate')}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Test Duplicate
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Manual Entry Button */}
      <div className="px-4 mt-4">
        <Button
          variant="outline"
          onClick={() => setShowManualEntry(!showManualEntry)}
          className="w-full bg-gray-800 text-white border-gray-700"
        >
          Enter Ticket ID Manually
          {showManualEntry ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
        </Button>

        {showManualEntry && (
          <Card className="mt-2 bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <Input
                value={manualTicketId}
                onChange={(e) => setManualTicketId(e.target.value)}
                placeholder="Enter ticket ID..."
                className="mb-3 bg-gray-900 text-white border-gray-700"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleManualVerify}
                  disabled={!manualTicketId.trim()}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  Verify
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setManualTicketId('');
                    setShowManualEntry(false);
                  }}
                  className="flex-1 bg-gray-900 text-white border-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Scan History */}
      <div className="px-4 mt-4">
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
          className="w-full bg-gray-800 text-white border-gray-700"
        >
          Recent Scans ({mockScans.length})
          {showHistory ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
        </Button>

        {showHistory && (
          <Card className="mt-2 bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mockScans.map((scan) => (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-3 bg-gray-900 rounded"
                  >
                    <div className="flex-1">
                      <div className="text-white text-sm">{scan.attendeeName}</div>
                      <div className="text-gray-400 text-xs">
                        {scan.ticketType} • {scan.timestamp}
                      </div>
                    </div>
                    {scan.status === 'success' && (
                      <Check className="text-green-500" size={20} />
                    )}
                    {scan.status === 'error' && (
                      <X className="text-red-500" size={20} />
                    )}
                    {scan.status === 'duplicate' && (
                      <AlertTriangle className="text-yellow-500" size={20} />
                    )}
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-3 bg-gray-900 text-white border-gray-700">
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-4 mt-4 pb-4 flex gap-2">
        <Button
          variant="outline"
          onClick={() => onNavigate('scan-history', event.id)}
          className="flex-1 bg-gray-800 text-white border-gray-700"
        >
          View Full History
        </Button>
        <Button
          variant="outline"
          onClick={() => setShowSettings(true)}
          className="bg-gray-800 text-white border-gray-700"
        >
          <Settings size={18} />
        </Button>
      </div>

      {/* Scan Result Modal */}
      {scanResult && (
        <Dialog open={!!scanResult} onOpenChange={() => setScanResult(null)}>
          <DialogContent className={scanResult.status === 'success' ? 'border-green-500' : scanResult.status === 'duplicate' ? 'border-yellow-500' : 'border-red-500'}>
            <DialogHeader>
              <div className="flex justify-center mb-4">
                {scanResult.status === 'success' && (
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="text-green-600" size={40} />
                  </div>
                )}
                {scanResult.status === 'error' && (
                  <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                    <X className="text-red-600" size={40} />
                  </div>
                )}
                {scanResult.status === 'duplicate' && (
                  <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="text-yellow-600" size={40} />
                  </div>
                )}
              </div>

              <DialogTitle className="text-center text-2xl">
                {scanResult.status === 'success' && 'Successfully Checked In'}
                {scanResult.status === 'error' && 'Invalid Ticket'}
                {scanResult.status === 'duplicate' && 'Already Checked In'}
              </DialogTitle>

              {scanResult.status === 'success' && (
                <DialogDescription className="text-center space-y-3">
                  <div className="text-lg text-gray-900">{scanResult.attendeeName}</div>
                  <Badge>{scanResult.ticketType}</Badge>
                  {scanResult.seat && (
                    <div className="text-sm text-gray-600">Seat: {scanResult.seat}</div>
                  )}
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Clock size={12} />
                    {scanResult.timestamp}
                  </div>
                </DialogDescription>
              )}

              {scanResult.status === 'duplicate' && (
                <DialogDescription className="text-center">
                  <p className="text-gray-600 mb-2">This ticket was already scanned</p>
                  <p className="text-sm text-gray-500">Original check-in: 10:30 AM by Staff 1</p>
                </DialogDescription>
              )}

              {scanResult.status === 'error' && (
                <DialogDescription className="text-center">
                  <p className="text-gray-600">This ticket is not valid for this event</p>
                </DialogDescription>
              )}
            </DialogHeader>

            <DialogFooter>
              {scanResult.status === 'duplicate' && (
                <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                  Allow Re-entry
                </Button>
              )}
              <Button
                onClick={() => setScanResult(null)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {scanResult.status === 'success' ? 'Next Scan' : 'Scan Again'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Settings Modal */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scanner Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable sound on scan</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable vibration</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto-advance after scan</Label>
              <Switch />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowSettings(false)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(256px); }
        }
        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
