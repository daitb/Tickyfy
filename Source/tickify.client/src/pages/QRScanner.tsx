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
  ChevronUp,
  ChevronDown,
  Download,
  Settings,
  WifiOff,
  Loader2,
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
import { ticketService, type TicketScanDto, type TicketDto } from '../services/ticketService';
import { toast } from 'sonner';

interface QRScannerProps {
  eventId?: string;
  onNavigate: (page: string, eventId?: string) => void;
}

interface ScanResult {
  ticket: TicketDto;
  status: 'success' | 'error' | 'duplicate';
  errorMessage?: string;
  timestamp: Date;
}

interface ScanHistory {
  id: number;
  ticketNumber: string;
  ticketType: string;
  seatNumber?: string;
  timestamp: Date;
  status: 'success' | 'error' | 'duplicate';
}

interface Event {
  id: string;
  title: string;
}

export function QRScanner({ eventId, onNavigate }: QRScannerProps) {
  const { t } = useTranslation();
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTicketCode, setManualTicketCode] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [eventTitle, setEventTitle] = useState('Event Scanner');
  const [event, setEvent] = useState<Event | null>(null);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleEnableCamera = () => {
    setCameraEnabled(true);
    // In real implementation, request camera permissions here
  };

  const playSound = (type: 'success' | 'error') => {
    if (!soundEnabled) return;
    // Play sound based on type
    const audio = new Audio(type === 'success' ? '/sounds/success.mp3' : '/sounds/error.mp3');
    audio.play().catch(() => {
      // Ignore sound errors
    });
  };

  const vibrate = (pattern: number | number[]) => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    navigator.vibrate(pattern);
  };

  const handleScanTicket = async (ticketCode: string) => {
    if (!eventId || !ticketCode || isScanning) return;

    try {
      setIsScanning(true);

      const scanData: TicketScanDto = {
        ticketNumber: ticketCode,
        eventId: parseInt(eventId),
        scanLocation: 'Main Entrance',
        scanType: 'Entry',
        deviceId: navigator.userAgent,
      };

      const scannedTicket = await ticketService.scanTicket(scanData);

      // Success
      const result: ScanResult = {
        ticket: scannedTicket,
        status: 'success',
        timestamp: new Date(),
      };

      setScanResult(result);
      
      // Add to history
      setScanHistory(prev => [{
        id: scannedTicket.ticketId,
        ticketNumber: scannedTicket.ticketNumber,
        ticketType: scannedTicket.ticketTypeName,
        seatNumber: scannedTicket.seatNumber,
        timestamp: new Date(),
        status: 'success' as const,
      }, ...prev].slice(0, 50)); // Keep last 50 scans

      playSound('success');
      vibrate(200);
      toast.success('Ticket checked in successfully!');

      // Auto-dismiss if enabled
      if (autoAdvance) {
        setTimeout(() => {
          setScanResult(null);
        }, 2000);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to scan ticket';
      
      // Check if it's a duplicate scan (already used)
      const isDuplicate = errorMessage.toLowerCase().includes('already') || 
                          errorMessage.toLowerCase().includes('used');

      const result: ScanResult = {
        ticket: {} as TicketDto, // Empty ticket for error case
        status: isDuplicate ? 'duplicate' : 'error',
        errorMessage,
        timestamp: new Date(),
      };

      setScanResult(result);
      
      // Add to history
      const historyStatus: 'duplicate' | 'error' = isDuplicate ? 'duplicate' : 'error';
      setScanHistory(prev => [{
        id: Date.now(),
        ticketNumber: ticketCode,
        ticketType: 'Unknown',
        timestamp: new Date(),
        status: historyStatus,
      }, ...prev].slice(0, 50));

      playSound('error');
      vibrate([100, 50, 100]);
      toast.error(errorMessage);
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualVerify = async () => {
    if (!manualTicketCode.trim()) return;
    
    await handleScanTicket(manualTicketCode.trim());
    setManualTicketCode('');
    setShowManualEntry(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    
    return timestamp.toLocaleDateString();
  };

  const exportHistory = () => {
    if (scanHistory.length === 0) {
      toast.error('No scan history to export');
      return;
    }

    const csv = [
      ['Ticket Number', 'Ticket Type', 'Seat', 'Status', 'Timestamp'].join(','),
      ...scanHistory.map(scan => [
        scan.ticketNumber,
        scan.ticketType,
        scan.seatNumber || 'N/A',
        scan.status,
        scan.timestamp.toISOString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `scan-history-${eventId}-${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('History exported successfully');
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
            <h2 className="text-white truncate text-sm">{eventTitle}</h2>
            <div className="text-xs text-gray-400 mt-1">
              {scanHistory.filter(s => s.status === 'success').length} checked in
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => event && onNavigate('event-detail', event.id)}
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
            Offline Mode - Cannot scan tickets without internet connection
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

            {/* Scanning Indicator */}
            {isScanning && (
              <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-black/80 px-4 py-2 rounded-full flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Scanning...</span>
                </div>
              </div>
            )}
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
                value={manualTicketCode}
                onChange={(e) => setManualTicketCode(e.target.value)}
                placeholder="Enter ticket code..."
                className="mb-3 bg-gray-900 text-white border-gray-700"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && manualTicketCode.trim()) {
                    handleManualVerify();
                  }
                }}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleManualVerify}
                  disabled={!manualTicketCode.trim() || isScanning}
                  className="flex-1 bg-purple-600 hover:bg-purple-700"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="mr-2 animate-spin" size={16} />
                      Verifying...
                    </>
                  ) : (
                    'Verify'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setManualTicketCode('');
                    setShowManualEntry(false);
                  }}
                  className="flex-1 bg-gray-900 text-white border-gray-700"
                  disabled={isScanning}
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
          Recent Scans ({scanHistory.length})
          {showHistory ? <ChevronUp size={16} className="ml-2" /> : <ChevronDown size={16} className="ml-2" />}
        </Button>

        {showHistory && (
          <Card className="mt-2 bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              {scanHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No scan history yet
                </div>
              ) : (
                <>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {scanHistory.map((scan) => (
                      <div
                        key={`${scan.id}-${scan.timestamp.getTime()}`}
                        className="flex items-center justify-between p-3 bg-gray-900 rounded"
                      >
                        <div className="flex-1">
                          <div className="text-white text-sm font-mono">
                            {scan.ticketNumber}
                          </div>
                          <div className="text-gray-400 text-xs">
                            {scan.ticketType}
                            {scan.seatNumber && ` • ${scan.seatNumber}`}
                            {' • '}
                            {formatTimestamp(scan.timestamp)}
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
                  <Button 
                    variant="outline" 
                    className="w-full mt-3 bg-gray-900 text-white border-gray-700"
                    onClick={exportHistory}
                  >
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="px-4 mt-4 pb-4 flex gap-2">
        <Button
          variant="outline"
          onClick={() => event && onNavigate('scan-history', event.id)}
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

              {scanResult.status === 'success' && scanResult.ticket && (
                <DialogDescription className="text-center space-y-3">
                  <div className="text-lg text-gray-900 font-mono">
                    {scanResult.ticket.ticketNumber}
                  </div>
                  <Badge>{scanResult.ticket.ticketTypeName}</Badge>
                  {scanResult.ticket.seatNumber && (
                    <div className="text-sm text-gray-600">
                      Seat: {scanResult.ticket.seatNumber}
                    </div>
                  )}
                  <div className="text-xs text-gray-500 flex items-center justify-center gap-2">
                    <Clock size={12} />
                    {scanResult.timestamp.toLocaleTimeString()}
                  </div>
                </DialogDescription>
              )}

              {scanResult.status === 'duplicate' && (
                <DialogDescription className="text-center">
                  <p className="text-gray-600 mb-2">
                    {scanResult.errorMessage || 'This ticket was already scanned'}
                  </p>
                </DialogDescription>
              )}

              {scanResult.status === 'error' && (
                <DialogDescription className="text-center">
                  <p className="text-gray-600">
                    {scanResult.errorMessage || 'This ticket is not valid for this event'}
                  </p>
                </DialogDescription>
              )}
            </DialogHeader>

            <DialogFooter className="flex-col gap-2">
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
              <Switch 
                checked={soundEnabled} 
                onCheckedChange={setSoundEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable vibration</Label>
              <Switch 
                checked={vibrationEnabled} 
                onCheckedChange={setVibrationEnabled}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Auto-advance after scan</Label>
              <Switch 
                checked={autoAdvance} 
                onCheckedChange={setAutoAdvance}
              />
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
