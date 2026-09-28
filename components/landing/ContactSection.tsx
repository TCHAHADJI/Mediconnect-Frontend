import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card } from '../ui/card';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { toast } from 'sonner';
import { translations } from './constants';

interface ContactSectionProps {
  language?: 'en' | 'fr';
}

export function ContactSection({ language = 'en' }: ContactSectionProps) {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const t = translations[language].contact;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t.successToast);
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <section id="contact" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold md:text-4xl mb-6">{t.title}</h2>
          <p className="text-xl text-muted-foreground">
            {t.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-2xl mb-6 font-semibold">{t.infoTitle}</h3>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{t.phoneTitle}</h4>
                  <p className="text-muted-foreground">+237 6XX XXX XXX</p>
                  <p className="text-sm text-muted-foreground">{t.phoneHours}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{t.emailTitle}</h4>
                  <p className="text-muted-foreground">support@mediconnect.cm</p>
                  <p className="text-sm text-muted-foreground">{t.emailSubtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold">{t.officeTitle}</h4>
                  <p className="text-muted-foreground">{t.officeLocations}</p>
                  <p className="text-sm text-muted-foreground">{t.officeSub}</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <h4 className="mb-4 ml-2 font-bold">{t.emergencyTitle}</h4>
              <div className="bg-muted p-4 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 border border-red-100">
                <p className="text-sm text-destructive mb-2 text-red-600 font-semibold">{t.emergencySub}</p>
                <p className="text-sm font-medium">{t.emergencyServices}</p>
                <p className="text-sm font-medium">{t.ambulanceService}</p>
              </div>
            </div>
          </div>

          <Card className="p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-2xl mb-6 font-semibold">{t.formTitle}</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div>
                <label className="block mb-2 text-sm font-medium">{t.nameLabel}</label>
                <Input
                  value={contactForm.name}
                  onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={t.namePlaceholder}
                  className="rounded-2xl"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">{t.emailLabel}</label>
                <Input
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder={t.emailPlaceholder}
                  className="rounded-2xl"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">{t.phoneLabel}</label>
                <Input
                  value={contactForm.phone}
                  onChange={(e) => setContactForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder={t.phonePlaceholder}
                  className="rounded-2xl"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">{t.messageLabel}</label>
                <Textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder={t.messagePlaceholder}
                  rows={4}
                  className="rounded-2xl"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl">
                <Send className="w-4 h-4 mr-2" />
                {t.submitButton}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </section>
  );
}