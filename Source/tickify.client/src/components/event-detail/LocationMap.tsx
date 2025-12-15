import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface LocationMapProps {
  address: string;
  latitude: number;
  longitude: number;
}

export default function LocationMap({ address, latitude, longitude }: LocationMapProps) {
  const mapUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1841597389194!2d${longitude}!3d${latitude}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM40zMCc1OC40Ik4gNzPCsDU3JzU1LjQiVw!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus`;
  
  const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl text-gray-900">Event Location</h2>
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#00C16A] hover:text-[#00a859] flex items-center gap-2 text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Maps
          </a>
        </div>

        <div className="flex items-start gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
          <MapPin className="w-5 h-5 text-[#00C16A] flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-gray-900 mb-1">Venue Address</div>
            <div className="text-gray-600">{address}</div>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="aspect-video rounded-lg overflow-hidden bg-gray-100">
          <iframe
            src={mapUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Event Location Map"
          />
        </div>

        {/* Transportation Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Navigation className="w-5 h-5 text-[#00C16A]" />
              <span className="text-gray-900">Public Transit</span>
            </div>
            <p className="text-sm text-gray-600">
              Subway: Lines 1, 2, 3 to 59th St-Columbus Circle
              <br />
              Bus: M10, M20, M104
            </p>
          </div>
          <div className="p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-[#00C16A]" />
              <span className="text-gray-900">Parking</span>
            </div>
            <p className="text-sm text-gray-600">
              Limited parking available on-site
              <br />
              Nearby garages: Icon Parking ($25/day)
            </p>
          </div>
        </div>

        {/* Get Directions Button */}
        <Button
          onClick={() => window.open(googleMapsLink, '_blank')}
          className="w-full mt-6 bg-[#00C16A] hover:bg-[#00a859] text-white"
        >
          <Navigation className="w-4 h-4 mr-2" />
          Get Directions
        </Button>
      </div>
    </div>
  );
}
