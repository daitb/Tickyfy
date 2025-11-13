import { Music, Users, Utensils, Camera, Sparkles, Shield, Trophy, Star, Video, Heart, Building, Palette, Briefcase, Rocket, Award, Book, Coffee, Map, Leaf, Mic, Image, ShoppingBag, Smartphone, ChefHat, Shirt } from 'lucide-react';
import { EventHighlight } from '../../types';

interface EventHighlightsProps {
  highlights: EventHighlight[];
}

const iconMap: Record<string, any> = {
  music: Music,
  users: Users,
  utensils: Utensils,
  camera: Camera,
  sparkles: Sparkles,
  shield: Shield,
  trophy: Trophy,
  star: Star,
  video: Video,
  heart: Heart,
  building: Building,
  palette: Palette,
  briefcase: Briefcase,
  rocket: Rocket,
  award: Award,
  book: Book,
  coffee: Coffee,
  map: Map,
  leaf: Leaf,
  mic: Mic,
  image: Image,
  'shopping-bag': ShoppingBag,
  smartphone: Smartphone,
  'chef-hat': ChefHat,
  shirt: Shirt,
};

export default function EventHighlights({ highlights }: EventHighlightsProps) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-2xl text-gray-900 mb-6">Event Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {highlights.map((highlight, index) => {
          const Icon = iconMap[highlight.icon] || Star;
          return (
            <div key={index} className="flex gap-4">
              <div className="w-12 h-12 bg-[#00C16A]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-[#00C16A]" />
              </div>
              <div>
                <div className="text-gray-900 mb-1">{highlight.title}</div>
                <p className="text-sm text-gray-600">{highlight.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
