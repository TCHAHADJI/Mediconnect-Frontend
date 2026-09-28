import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowRight, Search, MapPin, Pill, Users, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { translations } from './constants';

interface DynamicHeroSectionProps {
  onShowAuth: (type: 'patient' | 'pharmacy' | 'admin' | 'health_authority', mode?: 'login' | 'signup') => void;
  language: 'en' | 'fr';
  stats: {
    pharmacies: string;
    medicines: string;
    patients: string;
  };
  isLoading: boolean;
}

export function DynamicHeroSection({ onShowAuth, language, stats, isLoading }: DynamicHeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [backgroundImages, setBackgroundImages] = useState<string[]>([]);
  const [isImagesLoading, setIsImagesLoading] = useState(true);

  // Load background images on component mount
  useEffect(() => {
    const loadBackgroundImages = async () => {
      try {
        // Updated image list - removed first and fourth images
        const images = [
          'https://media.istockphoto.com/id/2199321843/photo/molecular-structure-with-particles.jpg?s=612x612&w=0&k=20&c=luBW8IwYmX6LX9cEsIA4742Rk419w_Lqbq2rOaV-1zk=',
          'https://media.istockphoto.com/id/1439200422/photo/green-pharmacy-cross-in-town.jpg?s=612x612&w=0&k=20&c=wT7QdX6y7tUPuYH26iw6gzQ5e43Hm8xK9B3rZiMJSOI=',
          'https://media.istockphoto.com/id/928320646/photo/feel-and-live-better-with-the-right-treatment.jpg?s=612x612&w=0&k=20&c=nKW1d6FrXVXfIzemN94CaReKijh_MoQTneqVT0JS6Qc=',
          'https://media.istockphoto.com/id/2204698768/photo/a-lively-street-scene-with-a-visible-pharmacy-sign-and-residential-buildings.jpg?s=612x612&w=0&k=20&c=cVgRe7G0mfXTTEAh9eW8rzHPt11YG46AKe0j5PqZXAo=', 
          'https://media.istockphoto.com/id/1162845770/photo/macro-of-oxycodone-opioid-tablets-with-prescription-bottles-against-dark-background.jpg?s=612x612&w=0&k=20&c=r3DwIv9vtA9z9IzQjjBL67QjiH311_aBrSno_1jrm60=',
          'https://media.istockphoto.com/id/1778918997/photo/background-of-a-large-group-of-assorted-capsules-pills-and-blisters.jpg?s=612x612&w=0&k=20&c=G6aeWKN1kHyaTxiNdToVW8_xGY0hcenWYIjjG_xwF_Q=',
          'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // African healthcare
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80', // Modern pharmacy
          'https://media.istockphoto.com/id/2086161977/photo/pile-of-various-capsules-pills-and-tablets-in-a-blister-pack-on-blue-background-healthcare.jpg?s=612x612&w=0&k=20&c=i-RTsyG-aD6dxF77ZMcXvf0IogCCN1bFqq83fKKla88=',
          'https://media.istockphoto.com/id/1128239143/photo/african-female-chemist-searching-the-medicines.jpg?s=612x612&w=0&k=20&c=uD-vnUuvg_UiaO9MkXUNlLTPC-PJV-0YKhYVvopaQOA=',
          'https://media.istockphoto.com/id/2158313235/photo/pharmacy-logo-sign-on-a-building-facade.jpg?s=612x612&w=0&k=20&c=MMkR9MA8QQ7zC5o3LiStJfWgcXp2ZSLC5rOpUJozkDM=',//pharmacy frontage//
          'https://images.unsplash.com/photo-1582750433449-648ed127bb54?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80' // African community health
          
          


        ];
        
        setBackgroundImages(images);
        setIsImagesLoading(false);
      } catch (error) {
        console.error('Error loading background images:', error);
        setIsImagesLoading(false);
      }
    };

    loadBackgroundImages();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!isAutoPlaying || backgroundImages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, backgroundImages.length]);

  const goToSlide = (index: number) => {
    setCurrentImageIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev - 1 + backgroundImages.length) % backgroundImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev + 1) % backgroundImages.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const t = translations[language];

  if (isImagesLoading) {
    return (
      <section className="relative min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </section>
    );
  }

  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image Carousel */}
      <div className="absolute inset-0">
        {backgroundImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${image})` }}
            />
            {/* Enhanced dark overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/60 via-purple-900/50 to-green-900/60" />
          </div>
        ))}
      </div>

      {/* Slide Controls - positioned below top navbar */}
      <div className="absolute top-24 right-6 lg:right-8 z-20 flex items-center gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={toggleAutoPlay}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30"
        >
          {isAutoPlaying ? (
            <Pause className="w-4 h-4 text-white" />
          ) : (
            <Play className="w-4 h-4 text-white" />
          )}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={goToPrevious}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30"
        >
          <ChevronLeft className="w-4 h-4 text-white" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={goToNext}
          className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border-white/30"
        >
          <ChevronRight className="w-4 h-4 text-white" />
        </Button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
        {backgroundImages.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex
                ? 'bg-white scale-125'
                : 'bg-white/50 hover:bg-white/75'
            }`}
          />
        ))}
      </div>

      {/* Content - with top padding to align cleanly below navbar */}
      <div className="relative z-10 min-h-screen flex items-center pt-24 lg:pt-28 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-14 items-center">
            {/* Left Column: Expanded to 7 of 12 cols for generous text width */}
            <div className="text-white lg:col-span-7 xl:col-span-7">
              <div className="mb-6">
                <span className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600/20 to-green-600/20 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20">
                  {t.hero.badge}
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] xl:text-[3.25rem] 2xl:text-6xl font-extrabold mb-6 leading-[1.15] tracking-tight">
                <span className="block sm:whitespace-nowrap">
                  {t.hero.titlePart1}
                </span>
                <span className="block sm:whitespace-nowrap bg-gradient-to-r from-green-300 via-red-300 to-yellow-300 bg-clip-text text-transparent">
                  {t.hero.titleGradient}
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl mb-8 leading-relaxed opacity-90 max-w-xl font-normal">
                {t.hero.description}
              </p>
              
              {/* Enhanced Call-to-Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-2xl transform hover:scale-105 transition-all duration-200 px-8 py-4 font-semibold cursor-pointer"
                  onClick={() => onShowAuth('patient', 'signup')}
                >
                  {t.hero.ctaPatient}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-2 border-white text-white rounded-2xl hover:bg-white hover:text-gray-900 shadow-lg px-8 py-4 backdrop-blur-sm font-semibold cursor-pointer transition-all"
                  onClick={() => onShowAuth('pharmacy', 'signup')}
                >
                  {t.hero.ctaPharmacy}
                </Button>
              </div>

              {/* Enhanced Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { value: stats.pharmacies, label: t.stats.pharmacies },
                  { value: stats.medicines, label: t.stats.medicines },
                  { value: stats.patients, label: t.stats.patients },
                  { value: '10+', label: t.stats.cities || 'Cities Covered' }
                ].map((stat, index) => (
                  <div key={index} className="text-center bg-white/10 backdrop-blur-sm rounded-2xl p-3 border border-white/20">
                    {isLoading ? (
                      <div className="h-6 w-16 bg-white/20 animate-pulse rounded-md mx-auto mb-1"></div>
                    ) : (
                      <div className="text-2xl font-bold text-white">{stat.value}</div>
                    )}
                    <div className="text-xs sm:text-sm opacity-80 text-white/90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Shifted to the right with 5 of 12 cols and ml-auto */}
            <div className="relative lg:col-span-5 xl:col-span-5 lg:ml-auto w-full max-w-lg lg:max-w-none">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 p-6 xl:p-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-4 xl:gap-6 mb-6 xl:mb-8">
                  <div className="text-center">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 bg-gradient-to-br from-blue-500/20 to-blue-600/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 xl:mb-3">
                      <Pill className="w-7 h-7 xl:w-8 xl:h-8 text-blue-300" />
                    </div>
                    <h3 className="font-semibold text-sm xl:text-base mb-1 text-white">{t.hero.quickCards[0].title}</h3>
                    <p className="text-xs xl:text-sm text-white/80">{t.hero.quickCards[0].desc}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 bg-gradient-to-br from-green-500/20 to-green-600/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 xl:mb-3">
                      <MapPin className="w-7 h-7 xl:w-8 xl:h-8 text-green-300" />
                    </div>
                    <h3 className="font-semibold text-sm xl:text-base mb-1 text-white">{t.hero.quickCards[1].title}</h3>
                    <p className="text-xs xl:text-sm text-white/80">{t.hero.quickCards[1].desc}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 bg-gradient-to-br from-purple-500/20 to-purple-600/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 xl:mb-3">
                      <Users className="w-7 h-7 xl:w-8 xl:h-8 text-purple-300" />
                    </div>
                    <h3 className="font-semibold text-sm xl:text-base mb-1 text-white">{t.hero.quickCards[2].title}</h3>
                    <p className="text-xs xl:text-sm text-white/80">{t.hero.quickCards[2].desc}</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-14 h-14 xl:w-16 xl:h-16 bg-gradient-to-br from-orange-500/20 to-orange-600/30 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-2 xl:mb-3">
                      <Search className="w-7 h-7 xl:w-8 xl:h-8 text-orange-300" />
                    </div>
                    <h3 className="font-semibold text-sm xl:text-base mb-1 text-white">{t.hero.quickCards[3].title}</h3>
                    <p className="text-xs xl:text-sm text-white/80">{t.hero.quickCards[3].desc}</p>
                  </div>
                </div>

                {/* Enhanced Quick Search Demo */}
                <div className="border border-white/20 rounded-xl p-4 bg-white/5">
                  <div className="flex items-center text-xs xl:text-sm text-white/80 mb-2">
                    <Search className="w-4 h-4 mr-2" />
                    {t.hero.demoTitle}
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder={t.hero.demoPlaceholder} 
                      onClick={() => onShowAuth('patient', 'login')}
                      className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/60 text-xs xl:text-sm rounded-xl cursor-pointer"
                      readOnly
                    />
                    <Button 
                      type="button" 
                      onClick={() => onShowAuth('patient', 'login')}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white border border-white/20 text-xs xl:text-sm rounded-xl cursor-pointer shadow-md"
                    >
                      {t.hero.demoButton}
                    </Button>
                  </div>
                  <p 
                    onClick={() => onShowAuth('patient', 'login')}
                    className="text-[11px] xl:text-xs text-white/70 hover:text-white mt-2 cursor-pointer transition-colors"
                  >
                    {t.hero.demoSubtitle}
                  </p>
                </div>
              </div>
              
              {/* Enhanced floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full opacity-60 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full opacity-60 animate-pulse delay-75"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced scroll indicator */}
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
        </div>
      </div>
    </section>
  );
}