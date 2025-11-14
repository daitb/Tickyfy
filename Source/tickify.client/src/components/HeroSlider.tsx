import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  eventId?: string;
}

interface HeroSliderProps {
  onViewDetails?: (eventId: string) => void;
  isPaused?: boolean;
}

const slides: Slide[] = [
  {
    id: '1',
    title: 'Summer Music Festival 2025',
    subtitle: 'Experience the biggest music event of the year',
    image: 'https://images.unsplash.com/photo-1648260029310-5f1da359af9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25jZXJ0JTIwZmVzdGl2YWwlMjBjcm93ZHxlbnwxfHx8fDE3NjEyMTcxOTN8MA&ixlib=rb-4.1.0&q=80&w=1080',
    eventId: 'evt-1',
  },
  {
    id: '2',
    title: 'Live Concert Series',
    subtitle: 'The best artists, live on stage',
    image: 'https://images.unsplash.com/photo-1704253797699-f983e3cd70ff?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZlJTIwbXVzaWMlMjBzdGFnZSUyMHBlcmZvcm1hbmNlfGVufDF8fHx8MTc2MTI3ODAzNXww&ixlib=rb-4.1.0&q=80&w=1080',
    eventId: 'evt-2',
  },
  {
    id: '3',
    title: 'Theater & Arts',
    subtitle: 'Discover amazing performances',
    image: 'https://images.unsplash.com/photo-1760897008023-db0414e0c6f2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aGVhdGVyJTIwcGVyZm9ybWFuY2UlMjBhdWRpZW5jZXxlbnwxfHx8fDE3NjEyNzgwMzV8MA&ixlib=rb-4.1.0&q=80&w=1080',
    eventId: 'evt-3',
  },
];

export function HeroSlider({ onViewDetails, isPaused = false }: HeroSliderProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handleViewDetails = () => {
    const slide = slides[currentSlide];
    if (slide.eventId && onViewDetails) {
      onViewDetails(slide.eventId);
    }
  };

  return (
    <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden bg-neutral-900">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Background Image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
          
          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex items-center">
            <div className="max-w-7xl mx-auto px-4 w-full">
              <div className="max-w-2xl">
                <h1 className="text-white mb-4">
                  {slide.title}
                </h1>
                <p className="text-xl text-neutral-200 mb-8">
                  {slide.subtitle}
                </p>
                <Button
                  size="lg"
                  onClick={handleViewDetails}
                  className="bg-white text-neutral-900 hover:bg-teal-500 hover:text-white transition-colors"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all z-10"
      >
        <ChevronLeft className="text-white" size={24} />
      </button>
      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all z-10"
      >
        <ChevronRight className="text-white" size={24} />
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white w-8' 
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
