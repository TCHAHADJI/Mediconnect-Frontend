import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ArrowRight, Search, MapPin, Pill, Users } from 'lucide-react';

interface HeroSectionProps {
  onShowAuth: (type: 'patient' | 'pharmacy' | 'admin' | 'health_authority', mode?: 'login' | 'signup') => void;
}

export function HeroSection({ onShowAuth }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Find Medicines
              <span className="text-primary block">Across Cameroon</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Connect with verified pharmacies, locate essential medicines, and access healthcare 
              services throughout Cameroon. Your health, our priority.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size="lg" 
                className="flex items-center justify-center"
                onClick={() => onShowAuth('patient')}
              >
                Get Started as Patient
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => onShowAuth('pharmacy')}
              >
                Join as Pharmacy
              </Button>
            </div>

            {/* Quick Search Demo */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-center text-sm text-gray-600 mb-2">
                <Search className="w-4 h-4 mr-2" />
                Try searching for a medicine
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g., Paracetamol, Amoxicillin..." 
                  className="flex-1"
                  disabled
                />
                <Button variant="outline" disabled>
                  Search
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Sign in to search across 150+ verified pharmacies
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Pill className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Find Medicines</h3>
                  <p className="text-sm text-gray-600">Search across verified pharmacies</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Locate Pharmacies</h3>
                  <p className="text-sm text-gray-600">Find nearest available stock</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Connect Direct</h3>
                  <p className="text-sm text-gray-600">Talk to pharmacists directly</p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-8 h-8 text-orange-600" />
                  </div>
                  <h3 className="font-semibold mb-1">Real-time Stock</h3>
                  <p className="text-sm text-gray-600">Live inventory updates</p>
                </div>
              </div>
            </div>
            
            {/* Floating elements for visual appeal */}
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-200 rounded-full opacity-20"></div>
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-green-200 rounded-full opacity-20"></div>
          </div>
        </div>
      </div>
    </section>
  );
}