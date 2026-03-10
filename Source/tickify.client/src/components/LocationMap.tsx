import { MapPin, Navigation, Phone, Globe } from 'lucide-react';
import { Button } from './ui/button';

interface LocationMapProps {
  venue: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
}

export function LocationMap({ venue, address, city, phone, website }: LocationMapProps) {
  const fullAddress = `${address}, ${city}`;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-neutral-200">
      {/* Map Placeholder */}
      <div className="relative h-64 bg-gradient-to-br from-teal-100 to-blue-100">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <MapPin className="text-teal-600 mx-auto mb-2" size={48} />
            <p className="text-neutral-600">
              Interactive map view
            </p>
          </div>
        </div>
      </div>

      {/* Venue Details */}
      <div className="p-6 space-y-4">
        <div>
          <h4 className="mb-1">{venue}</h4>
          <p className="text-neutral-600">{fullAddress}</p>
        </div>

        {(phone || website) && (
          <div className="space-y-2 pt-2 border-t border-neutral-100">
            {phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={16} className="text-teal-600" />
                <span className="text-neutral-600">{phone}</span>
              </div>
            )}
            {website && (
              <div className="flex items-center gap-3 text-sm">
                <Globe size={16} className="text-teal-600" />
                <a 
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-700 hover:underline"
                >
                  Visit venue website
                </a>
              </div>
            )}
          </div>
        )}

        <Button 
          className="w-full bg-teal-600 hover:bg-teal-700"
          onClick={() => window.open(mapUrl, '_blank')}
        >
          <Navigation size={18} className="mr-2" />
          Get Directions
        </Button>
      </div>
    </div>
  );
}
