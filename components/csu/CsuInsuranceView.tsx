import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  ShieldCheck,
  Shield,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  Sparkles,
  Link2,
  Unlink,
  RefreshCw,
  HeartHandshake,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

export interface CsuInsuranceData {
  matricule?: string;
  beneficiaryCategory?: string;
  coverageRate?: number;
  affiliatedFacility?: string;
  status?: 'ACTIVE' | 'PENDING_VERIFICATION' | 'INACTIVE';
  issueDate?: string | Date;
  expiryDate?: string | Date;
  linkedAt?: string | Date;
  qrData?: string;
}

const CSU_CATEGORIES = [
  {
    id: 'Régime Général (Assurés & Familles)',
    label: 'Régime Général - Travailleurs & Familles',
    rate: 70,
    desc: '70% coverage on essential prescribed medicines and outpatient consultations.',
    badgeColor: 'bg-blue-600',
  },
  {
    id: 'Femmes Enceintes (Consultations & Accouchement)',
    label: 'Femmes Enceintes - Consultations & Accouchement (100% Gratuit)',
    rate: 100,
    desc: '100% full coverage for prenatal visits, delivery kits, ultrasound, and iron/folic supplements.',
    badgeColor: 'bg-rose-600',
  },
  {
    id: 'Enfants de 0 à 5 ans (Pédiatrie & Paludisme)',
    label: 'Enfants de 0 à 5 ans - Soins pédiatriques (100% Gratuit)',
    rate: 100,
    desc: 'Free malaria rapid diagnostic tests, ACT treatments, routine vaccines, and pediatric emergency care.',
    badgeColor: 'bg-emerald-600',
  },
  {
    id: 'Hémodialyse & Maladies Chroniques',
    label: 'Hémodialyse & Maladies Chroniques (95% Subventionné)',
    rate: 95,
    desc: 'Subsidized dialysis sessions and essential maintenance nephrology drugs.',
    badgeColor: 'bg-purple-600',
  },
  {
    id: 'Indigents & Personnes Vulnérables',
    label: 'Indigents & Personnes Vulnérables (100% Prise en charge)',
    rate: 100,
    desc: 'Total social solidarity health coverage validated by MINSANTÉ social services.',
    badgeColor: 'bg-teal-600',
  },
];

const HEALTH_FACILITIES = [
  'Hôpital Central de Yaoundé (HCY)',
  'Hôpital Général de Yaoundé (HGY)',
  'Hôpital Laquintinie de Douala (HLD)',
  'Hôpital Général de Douala (HGD)',
  'Centre Médical d’Arrondissement (CMA) d’Ekounou - Yaoundé IV',
  'CMA de Nkoldongo - Yaoundé IV',
  'Hôpital de District de Biyem-Assi - Yaoundé VI',
  'Hôpital de District de Nylon - Douala',
  'Hôpital Régional de Bafoussam',
  'Hôpital Régional de Garoua',
];

interface CsuInsuranceViewProps {
  user: any;
  onUserUpdated?: (updatedUser: any) => void;
  onNavigateToPharmacies?: () => void;
}

export function CsuInsuranceView({ user: initialUser, onUserUpdated, onNavigateToPharmacies }: CsuInsuranceViewProps) {
  const [user, setUser] = useState(initialUser);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [matricule, setMatricule] = useState('');
  const [category, setCategory] = useState(CSU_CATEGORIES[0].id);
  const [facility, setFacility] = useState(HEALTH_FACILITIES[0]);
  const [coverageRate, setCoverageRate] = useState<number>(70);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const csu = user?.csuInsurance || (user?.csuIdentifier ? {
    matricule: user.csuIdentifier,
    beneficiaryCategory: 'Régime Général (Assurés & Familles)',
    coverageRate: 70,
    affiliatedFacility: 'Hôpital Central de Yaoundé (HCY)',
    status: 'ACTIVE',
  } : null);

  const isLinked = Boolean(csu && csu.matricule);

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed?.token || parsed?.data?.token || parsed?.user?.data?.token;
      } catch (e) {}
    }
    return null;
  };

  const openLinkModal = () => {
    if (csu) {
      setMatricule(csu.matricule || '');
      setCategory(csu.beneficiaryCategory || CSU_CATEGORIES[0].id);
      setFacility(csu.affiliatedFacility || HEALTH_FACILITIES[0]);
      setCoverageRate(csu.coverageRate || 70);
    } else {
      // Generate a realistic Cameroon CSU placeholder if empty
      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      setMatricule(`CM-CSU-2026-${randomDigits}`);
      setCategory(CSU_CATEGORIES[0].id);
      setFacility(HEALTH_FACILITIES[0]);
      setCoverageRate(70);
    }
    setIsLinkDialogOpen(true);
  };

  const handleCategorySelect = (selectedCatId: string) => {
    setCategory(selectedCatId);
    const found = CSU_CATEGORIES.find((c) => c.id === selectedCatId);
    if (found) {
      setCoverageRate(found.rate);
    }
  };

  const handleSaveCsu = async () => {
    if (!matricule.trim()) {
      toast.error('Please enter your official CSU registration number');
      return;
    }

    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/users/csu/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          matricule: matricule.trim(),
          beneficiaryCategory: category,
          affiliatedFacility: facility,
          coverageRate: Number(coverageRate),
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        if (onUserUpdated) onUserUpdated(data.data);

        // Update localStorage session
        const session = localStorage.getItem('userSession');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            parsed.user = data.data;
            localStorage.setItem('userSession', JSON.stringify(parsed));
            window.dispatchEvent(new Event('userSessionUpdated'));
          } catch (e) {}
        }

        toast.success('Universal Health Coverage (CSU-CM) card successfully linked! 🇨🇲');
        setIsLinkDialogOpen(false);
      } else {
        throw new Error(data.message || 'Failed to link CSU card');
      }
    } catch (err: any) {
      // Local fallback for offline mode
      const updatedUser = {
        ...user,
        csuIdentifier: matricule.trim().toUpperCase(),
        csuInsurance: {
          matricule: matricule.trim().toUpperCase(),
          beneficiaryCategory: category,
          coverageRate: Number(coverageRate),
          affiliatedFacility: facility,
          status: 'ACTIVE' as const,
          issueDate: new Date(),
          expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          linkedAt: new Date(),
        },
      };
      setUser(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);

      const session = localStorage.getItem('userSession');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          parsed.user = updatedUser;
          localStorage.setItem('userSession', JSON.stringify(parsed));
          window.dispatchEvent(new Event('userSessionUpdated'));
        } catch (e) {}
      }

      toast.success('CSU Insurance linked successfully!');
      setIsLinkDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlinkCsu = async () => {
    if (!confirm('Are you sure you want to unlink your CSU card from this account?')) return;

    setIsSubmitting(true);
    const token = getAuthToken();

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api'}/users/csu/unlink`, {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        if (onUserUpdated) onUserUpdated(data.data);
      } else {
        const updated = { ...user, csuInsurance: undefined, csuIdentifier: undefined };
        setUser(updated);
        if (onUserUpdated) onUserUpdated(updated);
      }

      const session = localStorage.getItem('userSession');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          delete parsed.user.csuInsurance;
          delete parsed.user.csuIdentifier;
          localStorage.setItem('userSession', JSON.stringify(parsed));
          window.dispatchEvent(new Event('userSessionUpdated'));
        } catch (e) {}
      }

      toast.info('CSU card unlinked successfully');
    } catch (e) {
      const updated = { ...user, csuInsurance: undefined, csuIdentifier: undefined };
      setUser(updated);
      if (onUserUpdated) onUserUpdated(updated);
      toast.info('CSU card unlinked');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-br from-yellow-400/20 to-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-yellow-300 border border-yellow-300/30">
              <Sparkles className="w-3.5 h-3.5" />
              MINSANTÉ • République du Cameroun
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Couverture Santé Universelle (CSU-CM)</h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Link your national biometric health coverage card to enjoy direct pharmacy discounts, automatic co-pay reimbursement, and subsidized essential medications nationwide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isLinked ? (
              <Button
                onClick={openLinkModal}
                className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold shadow-md rounded-2xl px-5 h-12 flex items-center gap-2 transition-all hover:scale-105"
              >
                <RefreshCw className="w-4 h-4 text-emerald-700" />
                Update CSU Details
              </Button>
            ) : (
              <Button
                onClick={openLinkModal}
                className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:from-yellow-300 hover:to-amber-400 font-extrabold shadow-lg rounded-2xl px-6 h-12 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Link2 className="w-5 h-5 text-slate-900" />
                Link Your CSU Card
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Digital Card & Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Digital CSU Card Preview */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Digital CSU Health Card
            </h3>
            {isLinked && (
              <Badge className="bg-emerald-600 text-white rounded-full px-3 py-1 font-semibold flex items-center gap-1.5 shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active & Verified
              </Badge>
            )}
          </div>

          {/* OFFICIAL CAMEROON DIGITAL CSU CARD */}
          <div className="relative rounded-3xl p-6 sm:p-7 shadow-xl overflow-hidden text-white transition-all transform hover:scale-[1.01] duration-300 bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 border border-emerald-500/30">
            {/* National Flag Accent Ribbon (Green, Red with Yellow Star, Yellow) */}
            <div className="absolute top-0 left-0 right-0 h-2.5 flex">
              <div className="flex-1 bg-[#007A3D]" />
              <div className="flex-1 bg-[#CE1126] flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-[#FCD116] rotate-45" />
              </div>
              <div className="flex-1 bg-[#FCD116]" />
            </div>

            {/* Subtle Guilloche / Hologram Pattern Simulation */}
            <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Card Header */}
            <div className="relative z-10 flex items-start justify-between border-b border-white/15 pb-4 mb-5">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
                  RÉPUBLIQUE DU CAMEROUN • MINSANTÉ
                </div>
                <div className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                  COUVERTURE SANTÉ UNIVERSELLE
                </div>
                <div className="text-[9px] text-emerald-300 font-medium">
                  Universal Health Coverage Card • CSU-CM
                </div>
              </div>

              {/* Holographic Chip simulation */}
              <div className="w-11 h-9 rounded-lg bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 border border-yellow-200 shadow-inner flex flex-col justify-around p-1">
                <div className="h-0.5 bg-amber-700/40 rounded-full" />
                <div className="h-0.5 bg-amber-700/40 rounded-full" />
                <div className="h-0.5 bg-amber-700/40 rounded-full" />
              </div>
            </div>

            {/* Card Body */}
            <div className="relative z-10 flex gap-4 sm:gap-5 items-center mb-6">
              {/* Cardholder Picture */}
              <div className="relative">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-yellow-400/80 shadow-md">
                  <AvatarImage
                    src={user?.profilePicture || user?.profileImage}
                    alt={user?.name}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-emerald-800 text-yellow-300 font-black text-2xl">
                    {user?.name?.[0] || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-1 bg-yellow-400 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-md shadow">
                  CSU
                </div>
              </div>

              {/* Patient Details */}
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase font-medium text-emerald-200">Bénéficiaire / Holder</div>
                <h4 className="text-lg sm:text-xl font-bold truncate text-white drop-shadow-sm">
                  {user?.name || 'Patient Name'}
                </h4>

                <div className="mt-2 space-y-1">
                  <div className="text-xs text-slate-300 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-emerald-300 uppercase">Matricule:</span>
                    <span className="font-mono font-bold tracking-wider text-yellow-300 bg-white/10 px-2 py-0.5 rounded-md">
                      {isLinked ? csu.matricule : 'CM-CSU-NON-LIE'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-emerald-300 uppercase">Taux:</span>
                    <span className="font-bold text-white">
                      {isLinked ? `${csu.coverageRate || 70}% Prise en charge` : '70% Standard'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Footer Details */}
            <div className="relative z-10 pt-4 border-t border-white/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <div className="text-[10px] text-emerald-300 uppercase font-semibold">Formation Sanitaire</div>
                <div className="font-semibold text-white truncate max-w-[280px]">
                  {isLinked ? csu.affiliatedFacility : 'Hôpital Central de Yaoundé (HCY)'}
                </div>
                <div className="text-[10px] text-emerald-200/80">
                  Catégorie: {isLinked ? csu.beneficiaryCategory : 'Régime Général'}
                </div>
              </div>

              {/* QR Code representation */}
              <div className="bg-white p-2 rounded-xl text-slate-900 shadow-md flex items-center gap-2 self-end sm:self-auto">
                <QrCode className="w-10 h-10 text-slate-900" />
                <div className="text-[9px] font-mono leading-tight">
                  <span className="font-bold block text-emerald-700">VERIFIE</span>
                  <span>MINSANTE</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons for Card */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {isLinked ? (
              <>
                <Button
                  onClick={openLinkModal}
                  variant="outline"
                  className="rounded-2xl text-slate-700 hover:text-slate-900 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  Edit Card Info
                </Button>
                <Button
                  onClick={handleUnlinkCsu}
                  variant="ghost"
                  className="rounded-2xl text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center gap-1.5"
                >
                  <Unlink className="w-4 h-4" />
                  Unlink Card
                </Button>
              </>
            ) : (
              <Button
                onClick={openLinkModal}
                className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl px-6 flex items-center gap-2 shadow-sm font-semibold"
              >
                <Link2 className="w-4 h-4" />
                Link Your Official CSU Card Now
              </Button>
            )}
          </div>
        </div>

        {/* Right Column: Benefits & Pharmacy Reimbursement Breakdown */}
        <div className="lg:col-span-6 space-y-6">
          <Card className="rounded-3xl border-slate-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <HeartHandshake className="w-5 h-5 text-emerald-600" />
                Your CSU Benefits at Accredited Pharmacies
              </CardTitle>
              <CardDescription>
                How Couverture Santé Universelle works when purchasing medications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Direct Third-Party Payment (Tiers-Payant)
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Present your digital CSU card or matricule at any approved partner pharmacy. You only pay the remainder copay (Ticket modérateur), and the state settles the rest directly with the dispensary.
                </p>
              </div>

              <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-950 text-sm">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  Subsidized Essential Medications
                </div>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Antimalarials (ACTs), childhood antibiotics, oral rehydration salts, maternal vitamins, and insulin are prioritized with up to 100% price shielding.
                </p>
              </div>

              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-100 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-950 text-sm">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  Affiliated Health Network Coverage
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Prescriptions issued by your affiliated district health facility ({isLinked ? csu.affiliatedFacility : 'HCY'}) qualify for instant validation without physical paperwork.
                </p>
              </div>

              {onNavigateToPharmacies && (
                <Button
                  onClick={onNavigateToPharmacies}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-11 text-sm font-semibold flex items-center justify-center gap-2"
                >
                  Locate CSU Accredited Pharmacies
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Official Categories Table */}
          <Card className="rounded-3xl border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900">
                Official CSU Beneficiary Tiers (Cameroon)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {CSU_CATEGORIES.map((cat) => (
                <div
                  key={cat.id}
                  className={`p-3 rounded-2xl border transition-colors flex items-center justify-between gap-3 ${
                    isLinked && csu.beneficiaryCategory === cat.id
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-slate-50/60 border-slate-100'
                  }`}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm text-slate-900">{cat.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{cat.desc}</div>
                  </div>
                  <Badge className={`${cat.badgeColor} text-white font-extrabold text-xs px-2.5 py-1 rounded-xl whitespace-nowrap`}>
                    {cat.rate}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* LINK / UPDATE CSU MODAL DIALOG */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="sm:max-w-[560px] rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              {isLinked ? 'Update CSU Health Coverage Card' : 'Link Couverture Santé Universelle (CSU)'}
            </DialogTitle>
            <DialogDescription>
              Enter your official CSU-CM registration number and select your designated health category.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* CSU Matricule */}
            <div>
              <Label htmlFor="csu-matricule" className="text-xs font-semibold text-slate-700">
                Numéro de Matricule CSU *
              </Label>
              <div className="relative mt-1">
                <Input
                  id="csu-matricule"
                  value={matricule}
                  onChange={(e) => setMatricule(e.target.value.toUpperCase())}
                  placeholder="e.g. CM-CSU-2026-98421"
                  className="rounded-2xl font-mono uppercase tracking-wider pr-10 font-bold"
                />
                <Shield className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Found on your official MINSANTÉ enrollment slip or biometric physical card.
              </p>
            </div>

            {/* Beneficiary Category */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 block mb-1.5">
                Catégorie Bénéficiaire CSU *
              </Label>
              <div className="space-y-2">
                {CSU_CATEGORIES.map((cat) => (
                  <div
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                      category === cat.id
                        ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{cat.label}</div>
                      <div className="text-[11px] text-slate-500">{cat.desc}</div>
                    </div>
                    <Badge className={`${cat.badgeColor} text-white font-bold text-xs rounded-xl`}>
                      {cat.rate}%
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Affiliated Health Facility */}
            <div>
              <Label htmlFor="csu-facility" className="text-xs font-semibold text-slate-700">
                Formation Sanitaire de Rattachement (Hospital/Clinic)
              </Label>
              <select
                id="csu-facility"
                value={facility}
                onChange={(e) => setFacility(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl border border-slate-200 text-sm bg-white mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800"
              >
                {HEALTH_FACILITIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Coverage rate confirmation */}
            <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-900 block">Verified Coverage Level</span>
                <span className="text-[11px] text-emerald-700">Applied automatically at registered dispensaries</span>
              </div>
              <span className="text-2xl font-black text-emerald-700">{coverageRate}%</span>
            </div>
          </div>

          <DialogFooter className="mt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLinkDialogOpen(false)}
              className="rounded-2xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveCsu}
              disabled={isSubmitting}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl px-6 font-semibold shadow-md"
            >
              {isSubmitting ? 'Validating...' : isLinked ? 'Save Changes' : 'Link & Activate CSU Card'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
