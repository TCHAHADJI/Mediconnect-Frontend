import React from 'react';
import { Pill, Shield } from 'lucide-react';
import { translations } from './constants';

interface FooterProps {
  language?: 'en' | 'fr';
}

export function Footer({ language = 'en' }: FooterProps) {
  const t = translations[language].footer;

  return (
    <footer className="bg-gray-900 text-white pt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-medium">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Pill className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">MediConnect</h1>
                <p className="text-xs text-gray-400">{language === 'fr' ? 'Cameroun' : 'Cameroon'}</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              {t.tagline}
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t.patientsTitle}</h4>
            <ul className="space-y-3">
              {t.patientsLinks.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t.pharmaciesTitle}</h4>
            <ul className="space-y-3">
              {t.pharmaciesLinks.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-bold text-white">{t.supportTitle}</h4>
            <ul className="space-y-3">
              {t.supportLinks.map((item, index) => (
                <li key={index}>
                  <a href={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
              <li>
                <a 
                  href="/minsante" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Portail Régulateur MINSANTÉ / ONPC
                </a>
              </li>
              <li>
                <a 
                  href="/admin" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1.5 font-medium"
                >
                  <Shield className="w-3.5 h-3.5" />
                  Portail Administration (Admin)
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
          <p>{t.copyright}</p>
        </div>
      </div>
    </footer>
  );
}