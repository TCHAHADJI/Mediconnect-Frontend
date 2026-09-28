import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Pill, Menu, X, Shield } from 'lucide-react';

interface NavigationProps {
  onShowAuth: (userType: 'patient' | 'pharmacy' | 'admin' | 'health_authority', mode?: 'login' | 'signup') => void;
}

export function Navigation({ onShowAuth }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Pill className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl">MediConnect</h1>
              <p className="text-xs text-muted-foreground">Cameroon</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#about" className="text-foreground hover:text-primary transition-colors ">About</a>
            <a href="#services" className="text-foreground hover:text-primary transition-colors">Services</a>
            <a href="#testimonials" className="text-foreground hover:text-primary transition-colors">Testimonials</a>
            <a href="#faq" className="text-foreground hover:text-primary transition-colors">FAQ</a>
            <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact</a>
          </div>

          <div className="hidden md:flex items-center space-x-4 ">
            <Button variant="ghost" onClick={() => onShowAuth('patient')}>
              Patient Login
            </Button>
            <Button onClick={() => onShowAuth('pharmacy')}>
              Pharmacy Login
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4">
            <div className="flex flex-col space-y-4">
              <a href="#about" className="text-foreground hover:text-primary transition-colors">About</a>
              <a href="#services" className="text-foreground hover:text-primary transition-colors">Services</a>
              <a href="#testimonials" className="text-foreground hover:text-primary transition-colors">Testimonials</a>
              <a href="#faq" className="text-foreground hover:text-primary transition-colors">FAQ</a>
              <a href="#contact" className="text-foreground hover:text-primary transition-colors">Contact</a>
              <div className="flex flex-col space-y-2 pt-4 border-t border-border">
                <Button variant="ghost" onClick={() => onShowAuth('patient')} className="justify-start">
                  Patient Login
                </Button>
                <Button onClick={() => onShowAuth('pharmacy')} className="justify-start">
                  Pharmacy Login
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}