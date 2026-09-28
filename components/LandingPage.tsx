import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { 
  ArrowRight, 
  Pill, 
  MapPin, 
  Shield, 
  Users, 
  Star, 
  ChevronRight, 
  Search, 
  Store, 
  Heart,
  Phone,
  Mail,
  Globe,
  ChevronDown,
  Menu,
  X,
  Target,
  Award,
  Zap,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

import { DynamicHeroSection } from './landing/DynamicHeroSection';
import { TestimonialsCarousel } from './landing/TestimonialsCarousel';
import { ContactSection } from './landing/ContactSection';
import { Footer } from './landing/Footer';
import { translations } from './landing/constants';
import { ChatBot } from './landing/ChatBot';

interface LandingPageProps {
  onShowAuth: (type: 'patient' | 'pharmacy' | 'admin' | 'health_authority', mode?: 'login' | 'signup') => void;
}

export function LandingPage({ onShowAuth }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'fr'>('en');
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState(0);
  const [stats, setStats] = useState({
    pharmacies: '150+',
    medicines: '2,500+',
    patients: '10,000+',
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const t = translations[language];

  // Dynamic feature items with icons
  const featureIcons = [
    <Search className="w-8 h-8 text-blue-600" />,
    <MapPin className="w-8 h-8 text-green-600" />,
    <Shield className="w-8 h-8 text-purple-600" />,
    <Users className="w-8 h-8 text-blue-600" />
  ];

  const features = t.features.items.map((item, idx) => ({
    ...item,
    icon: featureIcons[idx] || <CheckCircle className="w-8 h-8 text-blue-600" />
  }));

  // Dynamic benefits with icons
  const benefitIcons = [
    <Heart className="w-8 h-8 text-red-500" />,
    <TrendingUp className="w-8 h-8 text-green-600" />
  ];

  const benefits = t.benefits.items.map((item, idx) => ({
    ...item,
    icon: benefitIcons[idx] || <CheckCircle className="w-8 h-8 text-green-600" />
  }));

  // Dynamic about points with icons
  const aboutIcons = [
    <Target className="w-6 h-6 text-blue-600" />,
    <Award className="w-6 h-6 text-green-600" />,
    <Zap className="w-6 h-6 text-purple-600" />
  ];

  const aboutUsPoints = t.about.points.map((item, idx) => ({
    ...item,
    icon: aboutIcons[idx] || <CheckCircle className="w-6 h-6 text-blue-600" />
  }));

  const faqData = t.faq.items;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/stats/public`);

        if (!response.ok) {
          console.error("Failed to fetch all stats", await response.text());
          return;
        }

        const statsData = await response.json();
        const { pharmacies, medicines, patients } = statsData.data;

        const formatNumber = (num: number | undefined) => {
          if (num === undefined || isNaN(num)) return '0+';
          if (num > 1000) {
            return `${(num / 1000).toFixed(num % 1000 === 0 ? 0 : 1)}k+`;
          }
          return `${num}+`;
        };

        setStats({
          pharmacies: `${pharmacies || 0}+`,
          medicines: formatNumber(medicines),
          patients: formatNumber(patients),
        });

      } catch (error) {
        console.error("Error fetching landing page stats:", error);
      } finally {
        setIsLoadingStats(false);
      }
    };

    fetchStats();
  }, []);

  const statsCards = [
    { number: stats.pharmacies, label: t.stats.pharmacies, subtext: t.stats.pharmaciesSub, icon: <Store className="w-6 h-6" /> },
    { number: stats.medicines, label: t.stats.medicines, subtext: t.stats.medicinesSub, icon: <Pill className="w-6 h-6" /> },
    { number: stats.patients, label: t.stats.patients, subtext: t.stats.patientsSub, icon: <Users className="w-6 h-6" /> },
    { number: '24/7', label: t.stats.service, subtext: t.stats.serviceSub, icon: <Clock className="w-6 h-6" /> }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Enhanced Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-slate-950/40 backdrop-blur-md border-b border-white/20 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Left Group: Brand Logo & Navigation Links */}
            <div className="flex items-center gap-6 xl:gap-8">
              {/* Brand Logo & Country Subtitle */}
              <a href="#" className="flex-shrink-0 flex items-center group focus:outline-none">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-200">
                  <Pill className="w-6 h-6 text-white" />
                </div>
                <div className="ml-3 flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-white leading-tight">MediConnect</span>
                  <span className="text-[11px] font-semibold text-white/80 tracking-wider uppercase">
                    {language === 'fr' ? 'Cameroun' : 'Cameroon'}
                  </span>
                </div>
              </a>
              
              {/* Desktop Navigation Links */}
              <div className="hidden lg:flex items-center space-x-1 xl:space-x-2 text-sm font-medium">
                <a 
                  href="#about" 
                  className="text-white/85 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
                >
                  {t.nav.about}
                </a>
                <a 
                  href="#features" 
                  className="text-white/85 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
                >
                  {t.nav.features}
                </a>
                <a 
                  href="#benefits" 
                  className="text-white/85 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
                >
                  {t.nav.benefits}
                </a>
                <a 
                  href="#testimonials" 
                  className="text-white/85 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
                >
                  {t.nav.testimonials}
                </a>
                <a 
                  href="#faq" 
                  className="text-white/85 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
                >
                  {t.nav.faq}
                </a>
                <a 
                  href="#contact" 
                  className="text-white/85 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/15 transition-all"
                >
                  {t.nav.contact}
                </a>
              </div>
            </div>

            {/* Action Buttons & Language Switcher */}
            <div className="hidden md:flex items-center space-x-2 xl:space-x-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className="text-white hover:bg-white/20 font-semibold rounded-full px-2.5 py-1 text-xs border border-white/25"
                title={language === 'en' ? 'Passer en Français' : 'Switch to English'}
              >
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                {language === 'en' ? 'FR' : 'EN'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => onShowAuth('patient', 'login')}
                className="border border-white/30 text-white hover:bg-white hover:text-gray-900 shadow-sm rounded-full text-xs font-semibold px-3.5 py-1.5 transition-all"
              >
                {t.nav.signIn}
              </Button>
              <Button 
                size="sm"
                onClick={() => onShowAuth('pharmacy', 'signup')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-md rounded-full text-xs font-semibold px-3.5 py-1.5 transition-all"
              >
                <span className="hidden xl:inline">{t.nav.joinAsPharmacy}</span>
                <span className="xl:hidden">{t.nav.joinAsPharmacyShort || 'Pharmacies'}</span>
              </Button>
            </div>

            {/* Mobile / Tablet Menu Button */}
            <div className="lg:hidden flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className="md:hidden text-white hover:bg-white/20 font-semibold rounded-full px-2 py-1 text-xs border border-white/25"
              >
                <Globe className="w-3.5 h-3.5 mr-1" />
                {language === 'en' ? 'FR' : 'EN'}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:bg-white/20 rounded-full"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden">
            <div className="px-4 pt-3 pb-4 space-y-1 bg-slate-950/95 backdrop-blur-xl border-t border-white/15 shadow-2xl">
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {t.nav.about}
              </a>
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {t.nav.features}
              </a>
              <a 
                href="#benefits" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {t.nav.benefits}
              </a>
              <a 
                href="#testimonials" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {t.nav.testimonials}
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {t.nav.faq}
              </a>
              <a 
                href="#contact" 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {t.nav.contact}
              </a>
              
              <div className="pt-3 border-t border-white/15 space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full text-white justify-start rounded-xl"
                  onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                >
                  <Globe className="w-4 h-4 mr-2" /> {t.nav.switchLang}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-white/30 text-white hover:bg-white hover:text-gray-900 rounded-xl" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onShowAuth('patient', 'login');
                  }}
                >
                  {t.nav.signIn}
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl" 
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onShowAuth('pharmacy', 'signup');
                  }}
                >
                  {t.nav.joinAsPharmacy}
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Dynamic Hero Section */}
      <DynamicHeroSection onShowAuth={onShowAuth} language={language} stats={stats} isLoading={isLoadingStats} />

      {/* Enhanced Stats Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              {t.statsSection.title}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mt-2">
              {t.statsSection.subtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {statsCards.map((stat, index) => (
              <div key={index} className="text-center backdrop-blur-2xl rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-3 text-blue-600">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-lg text-green-600 mb-1 font-semibold">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.subtext}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="scroll-mt-24 py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.about.title}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.about.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {aboutUsPoints.map((point, index) => (
              <Card key={index} className="p-6 border border-blue-100 hover:border-blue-200 transition-colors bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {point.icon}
                    <h3 className="text-xl font-semibold ml-3">{point.title}</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{point.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 text-center shadow-xl text-white">
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-3xl sm:text-4xl font-extrabold mb-4 text-white tracking-tight">{t.about.commitmentTitle}</h3>
              <p className="mb-8 text-slate-300 max-w-3xl mx-auto text-lg leading-relaxed font-normal">
                {t.about.commitmentDescription}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <div className="bg-white/10 border border-white/20 px-5 py-2 rounded-full backdrop-blur-sm">
                  <span className="font-semibold text-white text-sm">{t.about.tag1}</span>
                </div>
                <div className="bg-white/10 border border-white/20 px-5 py-2 rounded-full backdrop-blur-sm">
                  <span className="font-semibold text-white text-sm">{t.about.tag2}</span>
                </div>
                <div className="bg-white/10 border border-white/20 px-5 py-2 rounded-full backdrop-blur-sm">
                  <span className="font-semibold text-white text-sm">{t.about.tag3}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section id="features" className="scroll-mt-24 py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.features.title}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t.features.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-12">
            <div>
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className={`p-6 rounded-2xl cursor-pointer transition-all duration-300 mb-4 border-2 ${
                    selectedFeature === index 
                      ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 shadow-md' 
                      : 'hover:bg-gray-50 border-transparent'
                  }`}
                  onClick={() => setSelectedFeature(index)}
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      {feature.icon}
                    </div>
                    <div className="ml-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {feature.description}
                      </p>
                      {selectedFeature === index && (
                        <div className="space-y-2">
                          {feature.benefits.map((benefit, idx) => (
                            <div key={idx} className="flex items-center text-sm text-blue-600 font-medium">
                              <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="lg:sticky lg:top-8">
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 rounded-2xl shadow-xl border border-blue-100">
                <img 
                  src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="MediConnect Features" 
                  className="w-full h-64 object-cover rounded-xl mb-6 shadow-sm"
                />
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  {features[selectedFeature]?.title}
                </h3>
                <p className="text-gray-600 mb-6">
                  {features[selectedFeature]?.description}
                </p>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg rounded-2xl" 
                  onClick={() => onShowAuth('patient', 'signup')}
                >
                  {t.features.getStarted}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Benefits Section */}
      <section id="benefits" className="scroll-mt-24 py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.benefits.title}</h2>
            <p className="text-xl text-gray-600">
              {t.benefits.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {benefits.map((benefit, index) => (
              <Card key={index} className="p-8 border border-green-100 hover:border-green-200 transition-colors bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    {benefit.icon}
                    <CardTitle className="text-2xl font-bold">{benefit.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {benefit.points.map((item, idx) => (
                      <li key={idx} className="flex items-center text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action - High-contrast premium dark card with prominent Partner Pharmacy CTA */}
          <div className="mt-20">
            <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl p-8 sm:p-12 lg:p-16 text-center">
              {/* Subtle ambient lighting glows */}
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/25 text-blue-300 text-xs font-semibold mb-6 backdrop-blur-sm">
                  <Store className="w-3.5 h-3.5 text-blue-400" />
                  <span>{language === 'fr' ? 'Réseau Pharmaceutique National • Cameroun' : 'Official Cameroon Pharmacy Network'}</span>
                </div>

                <h3 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight leading-tight">
                  {t.benefits.ctaTitle}
                </h3>
                
                <p className="text-lg sm:text-xl text-slate-300 mb-10 font-normal leading-relaxed max-w-2xl mx-auto">
                  {t.benefits.ctaDescription}
                </p>

                {/* Prominent Action Buttons with Partner Pharmacy in the spotlight */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button 
                    size="lg"
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-blue-500/25 px-8 py-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transform hover:scale-[1.02] transition-all cursor-pointer border border-blue-400/30"
                    onClick={() => onShowAuth('pharmacy', 'signup')}
                  >
                    <Store className="w-5 h-5 text-white" />
                    <span>{t.benefits.ctaPharmacy}</span>
                    <ArrowRight className="w-5 h-5 ml-1" />
                  </Button>

                  <Button 
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 px-8 py-6 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all cursor-pointer backdrop-blur-sm"
                    onClick={() => onShowAuth('patient', 'signup')}
                  >
                    <Users className="w-5 h-5 text-blue-300" />
                    <span>{t.benefits.ctaPatient}</span>
                  </Button>
                </div>

                {/* Trust Highlights */}
                <div className="mt-10 pt-8 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-xs sm:text-sm text-slate-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{language === 'fr' ? 'Homologation officielle MINSANTÉ / ONPC' : 'Official MINSANTÉ / ONPC Verification'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{language === 'fr' ? 'Gestion des stocks & catalogue 24/7' : 'Real-time Inventory & Catalogue'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>{language === 'fr' ? 'Visibilité auprès de 10 000+ patients' : 'Reach 10,000+ Active Patients'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="scroll-mt-24 py-20 bg-white">
        <TestimonialsCarousel testimonials={t.testimonials} />
      </section>

      {/* Enhanced FAQ Section - Two Columns */}
      <section id="faq" className="scroll-mt-24 py-20 bg-gradient-to-br from-purple-50 to-blue-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t.faq.title}</h2>
            <p className="text-xl text-gray-600">
              {t.faq.description}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {faqData.map((faq) => (
              <div key={faq.question} className="bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-2xl"
                  onClick={() => setOpenFAQ(openFAQ === faq.question ? null : faq.question)}
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-500 transform transition-transform flex-shrink-0 ${openFAQ === faq.question ? 'rotate-180' : ''}`} />
                </button>
                {openFAQ === faq.question && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed text-sm">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">{t.faq.stillHaveQuestions}</p>
            <a href="#contact">
              <Button 
                variant="outline" 
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl px-6"
              >
                {t.faq.contactSupport}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="scroll-mt-24">
        <ContactSection language={language} />
      </section>

      {/* Footer */}
      <Footer language={language} />

      {/* Enhanced ChatBot */}
      <ChatBot language={language} />
    </div>
  );
}