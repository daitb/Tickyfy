import { Music, Users, Clock, Shield, Gift, Star } from 'lucide-react';

interface EventHighlightsProps {
  highlights: string[];
}

export function EventHighlights({ highlights }: EventHighlightsProps) {
  const icons = [Music, Users, Clock, Shield, Gift, Star];

  return (
    <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-2xl p-6 border border-teal-100">
      <h3 className="mb-4 text-teal-900">Event Highlights</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {highlights.map((highlight, index) => {
          const Icon = icons[index % icons.length];
          return (
            <div 
              key={index}
              className="flex items-start gap-3 bg-white p-4 rounded-xl border border-teal-100"
            >
              <div className="bg-teal-100 p-2 rounded-lg flex-shrink-0">
                <Icon className="text-teal-600" size={20} />
              </div>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {highlight}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
