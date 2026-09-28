import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import {
  HeartPulse,
  Activity,
  AlertTriangle,
  QrCode,
  ShieldAlert,
  Phone,
  User,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Save,
  Printer,
  Share2,
  Copy,
  Info,
  Calendar,
  Building2,
  FileText,
  Flame,
  Check,
  Stethoscope,
  Eye,
  RefreshCw,
  Download,
  ExternalLink,
  Wifi,
  Smartphone,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

export interface DetailedAllergy {
  name: string;
  category: 'DRUG' | 'FOOD' | 'ENVIRONMENTAL' | 'OTHER';
  severity: 'MILD' | 'MODERATE' | 'SEVERE_ANAPHYLAXIS';
  reaction?: string;
  diagnosedYear?: string;
}

export interface EmergencyQrConfig {
  enabled: boolean;
  showBloodGroup: boolean;
  showGenotype: boolean;
  showEmergencyContact: boolean;
  showAllergies: boolean;
  showChronicDiseases: boolean;
  showCsuNumber: boolean;
  emergencyNotes?: string;
  publicQrToken?: string;
}

export interface MedicalBookletData {
  bloodGroup: string;
  genotype: string;
  height?: number;
  weight?: number;
  bmi?: number;
  chronicDiseases: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  attendingPhysician?: string;
  attendingHospital?: string;
  organDonor?: boolean;
  vitalNotes?: string;
  detailedAllergies: DetailedAllergy[];
  emergencyQrConfig: EmergencyQrConfig;
}

interface MedicalBookletViewProps {
  user: any;
  onUserUpdated?: (updatedUser: any) => void;
  onNavigateToPrescriptions?: () => void;
}

const BLOOD_GROUPS = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
const GENOTYPES = [
  { id: 'AA', label: 'AA (Normal / Sans trait drépanocytaire)' },
  { id: 'AS', label: 'AS (Porteur sain du trait drépanocytaire)' },
  { id: 'SS', label: 'SS (Drépanocytose majeure)' },
  { id: 'AC', label: 'AC (Hémoglobine C porteur)' },
  { id: 'SC', label: 'SC (Hémoglobinopathie mixte)' },
];

const COMMON_CHRONIC_DISEASES = [
  'Hypertension Artérielle (HTA)',
  'Diabète de Type 2',
  'Diabète de Type 1',
  'Asthme bronchique',
  'Drépanocytose',
  'Insuffisance Rénale Chronique',
  'Ulcère Gastro-duodénal',
  'Épilepsie',
  'Cardiopathie ischémique',
];

const COMMON_DRUG_ALLERGIES = [
  { name: 'Pénicilline / Bêtalactamines', category: 'DRUG', severity: 'SEVERE_ANAPHYLAXIS', reaction: 'Choc anaphylactique / Œdème de Quincke' },
  { name: 'Aspirine / AINS (Ibuprofène, Diclofénac)', category: 'DRUG', severity: 'SEVERE_ANAPHYLAXIS', reaction: 'Bronchospasme sévère / Crise d’asthme' },
  { name: 'Sulfamides (Bactrim)', category: 'DRUG', severity: 'MODERATE', reaction: 'Érythème pigmenté fixe / Urticaire' },
  { name: 'Quinine', category: 'DRUG', severity: 'MODERATE', reaction: 'Acouphènes / Hypoglycémie / Rash cutané' },
  { name: 'Arachides (Peanuts)', category: 'FOOD', severity: 'SEVERE_ANAPHYLAXIS', reaction: 'Difficulté respiratoire immédiate' },
  { name: 'Lactose & Produits laitiers', category: 'FOOD', severity: 'MILD', reaction: 'Ballonnements / Crampes abdominales' },
];

export function MedicalBookletView({ user: initialUser, onUserUpdated }: MedicalBookletViewProps) {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState<'profile' | 'allergies' | 'emergency'>('profile');

  const existingBooklet = initialUser?.medicalBooklet || {};

  // Health Profile State
  const [bloodGroup, setBloodGroup] = useState(existingBooklet.bloodGroup || initialUser?.bloodGroup || 'O+');
  const [genotype, setGenotype] = useState(existingBooklet.genotype || 'AA');
  const [height, setHeight] = useState<number | string>(existingBooklet.height || 175);
  const [weight, setWeight] = useState<number | string>(existingBooklet.weight || 72);
  const [chronicDiseases, setChronicDiseases] = useState<string[]>(
    existingBooklet.chronicDiseases || initialUser?.chronicDiseases || []
  );
  const [emergencyContactName, setEmergencyContactName] = useState(existingBooklet.emergencyContactName || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    existingBooklet.emergencyContactPhone || initialUser?.emergencyContact || ''
  );
  const [emergencyContactRelation, setEmergencyContactRelation] = useState(
    existingBooklet.emergencyContactRelation || 'Parent / Proche'
  );
  const [attendingPhysician, setAttendingPhysician] = useState(existingBooklet.attendingPhysician || '');
  const [attendingHospital, setAttendingHospital] = useState(
    existingBooklet.attendingHospital || 'Hôpital Central de Yaoundé (HCY)'
  );
  const [organDonor, setOrganDonor] = useState(existingBooklet.organDonor || false);
  const [vitalNotes, setVitalNotes] = useState(existingBooklet.vitalNotes || '');

  // Allergies State
  const [detailedAllergies, setDetailedAllergies] = useState<DetailedAllergy[]>(
    existingBooklet.detailedAllergies && existingBooklet.detailedAllergies.length > 0
      ? existingBooklet.detailedAllergies
      : (initialUser?.allergies || []).map((a: string) => ({
          name: a,
          category: 'DRUG',
          severity: 'SEVERE_ANAPHYLAXIS',
          reaction: 'Réaction allergique documentée',
        }))
  );

  // New Allergy Dialog State
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [newAllergyName, setNewAllergyName] = useState('');
  const [newAllergyCategory, setNewAllergyCategory] = useState<DetailedAllergy['category']>('DRUG');
  const [newAllergySeverity, setNewAllergySeverity] = useState<DetailedAllergy['severity']>('SEVERE_ANAPHYLAXIS');
  const [newAllergyReaction, setNewAllergyReaction] = useState('');

  // Emergency QR Configuration State
  const existingQr = existingBooklet.emergencyQrConfig || {};
  const [qrEnabled, setQrEnabled] = useState(existingQr.enabled !== false);
  const [showBloodGroup, setShowBloodGroup] = useState(existingQr.showBloodGroup !== false);
  const [showGenotype, setShowGenotype] = useState(existingQr.showGenotype !== false);
  const [showEmergencyContact, setShowEmergencyContact] = useState(existingQr.showEmergencyContact !== false);
  const [showAllergies, setShowAllergies] = useState(existingQr.showAllergies !== false);
  const [showChronicDiseases, setShowChronicDiseases] = useState(existingQr.showChronicDiseases !== false);
  const [showCsuNumber, setShowCsuNumber] = useState(existingQr.showCsuNumber !== false);
  const [emergencyNotes, setEmergencyNotes] = useState(existingQr.emergencyNotes || '');
  const [qrToken, setQrToken] = useState(existingQr.publicQrToken || 'emg_' + (initialUser?._id || 'user'));
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrMode, setQrMode] = useState<'url' | 'vcard'>('url');
  const [networkHost, setNetworkHost] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname.length > 0) {
        return window.location.origin;
      }
    }
    return 'http://10.154.77.35:5173';
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  // Calculate BMI
  const numHeight = Number(height) || 0;
  const numWeight = Number(weight) || 0;
  const bmiValue = numHeight > 0 && numWeight > 0 
    ? Number((numWeight / Math.pow(numHeight / 100, 2)).toFixed(1)) 
    : 23.5;

  const getBmiCategory = (bmi: number) => {
    if (bmi < 18.5) return { label: 'Underweight', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    if (bmi < 25) return { label: 'Normal Weight', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (bmi < 30) return { label: 'Overweight', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { label: 'Obese', color: 'text-rose-700 bg-rose-50 border-rose-200' };
  };

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

  const handleSaveBooklet = async () => {
    setIsSaving(true);
    const token = getAuthToken();

    const bookletPayload: MedicalBookletData = {
      bloodGroup,
      genotype,
      height: Number(height) || 0,
      weight: Number(weight) || 0,
      bmi: bmiValue,
      chronicDiseases,
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      emergencyContactRelation: emergencyContactRelation.trim(),
      attendingPhysician: attendingPhysician.trim(),
      attendingHospital: attendingHospital.trim(),
      organDonor,
      vitalNotes: vitalNotes.trim(),
      detailedAllergies,
      emergencyQrConfig: {
        enabled: qrEnabled,
        showBloodGroup,
        showGenotype,
        showEmergencyContact,
        showAllergies,
        showChronicDiseases,
        showCsuNumber,
        emergencyNotes: emergencyNotes.trim(),
        publicQrToken: qrToken,
      },
    };

    try {
      const apiBase = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${apiBase}/users/medical-booklet`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(bookletPayload),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setUser(data.data);
        if (onUserUpdated) onUserUpdated(data.data);

        // Update local session
        const session = localStorage.getItem('userSession');
        if (session) {
          try {
            const parsed = JSON.parse(session);
            parsed.user = data.data;
            localStorage.setItem('userSession', JSON.stringify(parsed));
            window.dispatchEvent(new Event('userSessionUpdated'));
          } catch (e) {}
        }

        toast.success('Digital medical booklet saved to database! 🏥');
      } else {
        throw new Error(data.message || 'Failed to update medical booklet');
      }
    } catch (err: any) {
      // Local fallback
      const updatedUser = {
        ...user,
        bloodGroup,
        chronicDiseases,
        allergies: detailedAllergies.map((a) => a.name),
        emergencyContact: emergencyContactPhone,
        medicalBooklet: bookletPayload,
      };
      setUser(updatedUser);
      if (onUserUpdated) onUserUpdated(updatedUser);
      toast.success('Medical booklet updated successfully');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAllergy = () => {
    if (!newAllergyName.trim()) {
      toast.error('Please enter the allergen name');
      return;
    }

    const newAllergy: DetailedAllergy = {
      name: newAllergyName.trim(),
      category: newAllergyCategory,
      severity: newAllergySeverity,
      reaction: newAllergyReaction.trim() || 'Severe adverse clinical reaction',
      diagnosedYear: new Date().getFullYear().toString(),
    };

    const updated = [...detailedAllergies, newAllergy];
    setDetailedAllergies(updated);
    setNewAllergyName('');
    setNewAllergyReaction('');
    setIsAddAllergyOpen(false);
    toast.success(`Allergy to ${newAllergy.name} added! Don't forget to click Save.`);
  };

  const handleRemoveAllergy = (index: number) => {
    const updated = detailedAllergies.filter((_, i) => i !== index);
    setDetailedAllergies(updated);
    toast.info('Allergy removed from list');
  };

  const toggleChronicDisease = (disease: string) => {
    if (chronicDiseases.includes(disease)) {
      setChronicDiseases(chronicDiseases.filter((d) => d !== disease));
    } else {
      setChronicDiseases([...chronicDiseases, disease]);
    }
  };

  const severeAllergies = detailedAllergies.filter((a) => a.severity === 'SEVERE_ANAPHYLAXIS');

  // Real Emergency QR Code URL & Offline VCard generation
  const effectiveToken = qrToken || (user?._id ? `emg_${user._id}` : 'emg_patient');
  const emergencyQrUrl = `${networkHost.replace(/\/+$/, '')}/emergency/${effectiveToken}`;

  const directEmergencyText = [
    `🚨 FICHE MÉDICALE D'URGENCE • MINSANTÉ`,
    `Patient: ${user?.name || 'Patient'}`,
    showBloodGroup ? `Groupe Sanguin: ${bloodGroup}` : null,
    showGenotype ? `Génotype: ${genotype}` : null,
    showEmergencyContact && (emergencyContactPhone || user?.emergencyContact)
      ? `Contact Urgence ICE: ${emergencyContactPhone || user?.emergencyContact} (${emergencyContactRelation || 'Proche'})`
      : null,
    showAllergies && severeAllergies.length > 0
      ? `Allergies Graves: ${severeAllergies.map((a) => a.name).join(', ')}`
      : null,
    showChronicDiseases && chronicDiseases.length > 0
      ? `Pathologies: ${chronicDiseases.join(', ')}`
      : null,
    showCsuNumber && (user?.csuIdentifier || user?.csuInsurance?.matricule)
      ? `CSU: ${user?.csuIdentifier || user?.csuInsurance?.matricule}`
      : null,
    `Portail Web: ${emergencyQrUrl}`,
  ]
    .filter(Boolean)
    .join('\n');

  useEffect(() => {
    if (!qrEnabled) {
      setQrDataUrl('');
      return;
    }

    const payload = qrMode === 'url' ? emergencyQrUrl : directEmergencyText;
    QRCode.toDataURL(payload, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR Code:', err));
  }, [qrMode, emergencyQrUrl, directEmergencyText, qrEnabled]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_Medical_Urgence_${(user?.name || 'Patient').replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('QR Code médical téléchargé en haute résolution ! 📥');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider text-teal-200 border border-teal-200/30">
              <Stethoscope className="w-3.5 h-3.5" />
              Carnet de Santé Numérique • MINSANTÉ
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Patient Digital Medical Booklet</h1>
            <p className="text-teal-100 text-sm sm:text-base leading-relaxed">
              Maintain your medical history, configure high-priority allergy alerts, manage vital biometrics, and set up your emergency first-responder QR card.
            </p>
          </div>

          <Button
            onClick={handleSaveBooklet}
            disabled={isSaving}
            className="bg-white text-teal-900 hover:bg-teal-50 font-bold shadow-md rounded-2xl px-6 h-12 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4 text-teal-700" />
            {isSaving ? 'Saving Booklet...' : 'Save Health Booklet'}
          </Button>
        </div>
      </div>

      {/* Critical Allergy Emergency Alert Banner if any severe allergy exists */}
      {severeAllergies.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-rose-50 border-2 border-rose-300 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-black text-rose-950 text-sm sm:text-base uppercase tracking-wide">
                Critical Medical Safety Alert
              </span>
              <Badge className="bg-rose-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Strictly Contraindicated
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-rose-800 leading-relaxed">
              Patient exhibits high-risk anaphylactic hypersensitivity to:{' '}
              <strong className="font-bold underline text-rose-950">
                {severeAllergies.map((a) => a.name).join(', ')}
              </strong>
              . Dispensing or administering these substances is life-threatening.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-6">
        <TabsList className="grid grid-cols-3 bg-slate-100 p-1.5 rounded-2xl max-w-lg">
          <TabsTrigger value="profile" className="rounded-xl text-xs sm:text-sm font-bold py-2">
            <Activity className="w-4 h-4 mr-1.5 text-blue-600" />
            Health Vitals
          </TabsTrigger>
          <TabsTrigger value="allergies" className="rounded-xl text-xs sm:text-sm font-bold py-2">
            <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" />
            Allergies ({detailedAllergies.length})
          </TabsTrigger>
          <TabsTrigger value="emergency" className="rounded-xl text-xs sm:text-sm font-bold py-2">
            <QrCode className="w-4 h-4 mr-1.5 text-emerald-600" />
            Emergency QR
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: HEALTH VITALS & MEDICAL PROFILE */}
        <TabsContent value="profile" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 Columns: Biometrics & Affiliations */}
            <div className="lg:col-span-7 space-y-6">
              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 font-bold">
                    <HeartPulse className="w-5 h-5 text-teal-600" />
                    Biometrics & Biological Profile
                  </CardTitle>
                  <CardDescription>
                    Essential biological markers recognized across hospitals in Cameroon
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Blood Group & Genotype */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Blood Group (Groupe Sanguin) *
                      </Label>
                      <div className="grid grid-cols-4 gap-2">
                        {BLOOD_GROUPS.map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => setBloodGroup(bg)}
                            className={`py-2 text-center text-xs font-extrabold rounded-xl border transition-all ${
                              bloodGroup === bg
                                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {bg}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="genotype-select" className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                        Électrophorèse Hémoglobine (Genotype)
                      </Label>
                      <select
                        id="genotype-select"
                        value={genotype}
                        onChange={(e) => setGenotype(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {GENOTYPES.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Critical for sickle-cell disease screening & maternal health.
                      </p>
                    </div>
                  </div>

                  {/* Height, Weight & Calculated BMI */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <Label htmlFor="patient-height" className="text-xs font-bold text-slate-700">
                        Height (cm)
                      </Label>
                      <Input
                        id="patient-height"
                        type="number"
                        value={height}
                        onChange={(e) => setHeight(e.target.value)}
                        placeholder="175"
                        className="h-10 rounded-xl bg-white mt-1 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <Label htmlFor="patient-weight" className="text-xs font-bold text-slate-700">
                        Weight (kg)
                      </Label>
                      <Input
                        id="patient-weight"
                        type="number"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        placeholder="72"
                        className="h-10 rounded-xl bg-white mt-1 text-sm font-semibold"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700">Calculated BMI</Label>
                      <div className="mt-1 flex items-center gap-1.5 h-10">
                        <span className="text-lg font-black text-slate-900">{bmiValue}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getBmiCategory(bmiValue).color}`}>
                          {getBmiCategory(bmiValue).label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Emergency Contact */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <Label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                      Emergency Contact (Personne à contacter en cas d'urgence)
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Input
                          placeholder="Contact Full Name"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          className="h-10 rounded-xl bg-slate-50 text-xs sm:text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="+237 6XX XX XX XX"
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                          className="h-10 rounded-xl bg-slate-50 text-xs sm:text-sm font-semibold"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Relation (e.g. Conjoint)"
                          value={emergencyContactRelation}
                          onChange={(e) => setEmergencyContactRelation(e.target.value)}
                          className="h-10 rounded-xl bg-slate-50 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Physician & Hospital */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <Label htmlFor="attending-doc" className="text-xs font-bold text-slate-700">
                        Attending Physician (Médecin Traitant)
                      </Label>
                      <Input
                        id="attending-doc"
                        placeholder="Dr. Ngozi / Dr. Atangana"
                        value={attendingPhysician}
                        onChange={(e) => setAttendingPhysician(e.target.value)}
                        className="h-10 rounded-xl bg-slate-50 mt-1 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="attending-hosp" className="text-xs font-bold text-slate-700">
                        Designated Health Facility (Hôpital)
                      </Label>
                      <Input
                        id="attending-hosp"
                        placeholder="Hôpital Central de Yaoundé (HCY)"
                        value={attendingHospital}
                        onChange={(e) => setAttendingHospital(e.target.value)}
                        className="h-10 rounded-xl bg-slate-50 mt-1 text-xs sm:text-sm"
                      />
                    </div>
                  </div>

                  {/* Vital Notes */}
                  <div className="pt-2 border-t border-slate-100">
                    <Label htmlFor="vital-notes-input" className="text-xs font-bold text-slate-700">
                      Vital Medical Directives & Directives Anticipées
                    </Label>
                    <Input
                      id="vital-notes-input"
                      placeholder="e.g. Diabétique sous insuline, porteur de pacemaker, asthme à l'effort..."
                      value={vitalNotes}
                      onChange={(e) => setVitalNotes(e.target.value)}
                      className="h-10 rounded-xl bg-slate-50 mt-1 text-xs sm:text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right 5 Columns: Chronic Diseases Checklist */}
            <div className="lg:col-span-5 space-y-6">
              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-slate-900 font-bold">
                    <Activity className="w-5 h-5 text-blue-600" />
                    Chronic Conditions & Pathologies
                  </CardTitle>
                  <CardDescription>
                    Tag pre-existing conditions so doctors can cross-check drug-disease interactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {COMMON_CHRONIC_DISEASES.map((disease) => {
                    const isChecked = chronicDiseases.includes(disease);
                    return (
                      <div
                        key={disease}
                        onClick={() => toggleChronicDisease(disease)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isChecked
                            ? 'bg-blue-50/80 border-blue-400 shadow-2xs'
                            : 'bg-slate-50/60 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        <span className="text-xs font-semibold text-slate-900">{disease}</span>
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                            isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* TAB 2: ALLERGIES & INTOLERANCE ALERTS */}
        <TabsContent value="allergies" className="space-y-6 m-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Documented Allergies & Intolerances</h3>
              <p className="text-xs sm:text-sm text-slate-500">
                Registered alerts will trigger contraindication warnings during pharmacy medication dispensation.
              </p>
            </div>
            <Button
              onClick={() => setIsAddAllergyOpen(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-2xl px-4 h-11 flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Allergy / Intolerance
            </Button>
          </div>

          {detailedAllergies.length === 0 ? (
            <Card className="rounded-3xl border-dashed border-2 p-8 text-center bg-slate-50/60">
              <div className="w-16 h-16 bg-slate-200 text-slate-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h4 className="text-base font-bold text-slate-900">No known allergies registered</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                If you have experienced bad reactions to antibiotics, pain relief tablets, or foods, declare them here.
              </p>
              <Button onClick={() => setIsAddAllergyOpen(true)} variant="outline" className="rounded-2xl text-xs">
                + Register First Allergy
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {detailedAllergies.map((allergy, idx) => {
                const isSevere = allergy.severity === 'SEVERE_ANAPHYLAXIS';
                const isModerate = allergy.severity === 'MODERATE';

                return (
                  <Card
                    key={idx}
                    className={`rounded-3xl border transition-all ${
                      isSevere
                        ? 'border-rose-300 bg-rose-50/40 shadow-xs'
                        : isModerate
                        ? 'border-amber-300 bg-amber-50/30'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                              isSevere
                                ? 'bg-rose-600 text-white'
                                : isModerate
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            <AlertTriangle className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base text-slate-900 leading-tight">
                              {allergy.name}
                            </h4>
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              Category: {allergy.category}
                            </span>
                          </div>
                        </div>

                        <Badge
                          className={`text-xs font-bold rounded-full ${
                            isSevere
                              ? 'bg-rose-600 text-white'
                              : isModerate
                              ? 'bg-amber-600 text-white'
                              : 'bg-blue-600 text-white'
                          }`}
                        >
                          {isSevere ? 'Severe Anaphylaxis' : isModerate ? 'Moderate' : 'Mild'}
                        </Badge>
                      </div>

                      {allergy.reaction && (
                        <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-slate-200/80 my-3 font-medium">
                          <span className="font-bold text-slate-900">Clinical Reaction:</span> {allergy.reaction}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                        <span>Diagnosed: {allergy.diagnosedYear || 'Documented'}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAllergy(idx)}
                          className="h-8 rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* TAB 3: CONFIGURE EMERGENCY QR CODE */}
        <TabsContent value="emergency" className="space-y-6 m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 6 Columns: Emergency QR Badge Preview */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-600" />
                  Emergency Responder Medical ID Card
                </h3>
                <Badge className={qrEnabled ? 'bg-emerald-600 text-white rounded-full' : 'bg-slate-400 text-white rounded-full'}>
                  {qrEnabled ? 'QR Active' : 'QR Disabled'}
                </Badge>
              </div>

              {/* EMERGENCY DIGITAL BADGE */}
              <div className="p-6 sm:p-7 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 text-white border-2 border-rose-500/40 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-black shadow-md">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-rose-300">
                        FIRST RESPONDERS • SECOURS
                      </div>
                      <div className="text-base font-black text-white">EMERGENCY MEDICAL ID</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase block font-mono">ID TOKEN</span>
                    <span className="text-xs font-mono font-bold text-yellow-300">{qrToken.slice(0, 10)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 my-4">
                  {/* Real Scannable QR Code Box */}
                  <div className="bg-white p-3 rounded-2xl shadow-xl flex flex-col items-center shrink-0 border border-slate-200">
                    {qrDataUrl && qrEnabled ? (
                      <img
                        src={qrDataUrl}
                        alt="Emergency Medical QR Code"
                        className="w-32 h-32 sm:w-36 sm:h-36 rounded-xl object-contain"
                      />
                    ) : (
                      <div className="w-32 h-32 sm:w-36 sm:h-36 flex flex-col items-center justify-center bg-slate-100 rounded-xl text-slate-400">
                        <QrCode className="w-12 h-12 mb-1" />
                        <span className="text-[10px] font-bold">QR Code Désactivé</span>
                      </div>
                    )}
                    <span className="text-[9px] font-mono font-black text-slate-900 mt-1.5 uppercase tracking-wider text-center">
                      SCANNEZ AVEC SMARTPHONE
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Patient Name</span>
                      <span className="text-base font-bold text-white">{user?.name}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {showBloodGroup && (
                        <div className="bg-white/10 p-2 rounded-xl">
                          <span className="text-[9px] text-rose-300 uppercase block font-semibold">Blood Type</span>
                          <span className="text-sm font-black text-white">{bloodGroup}</span>
                        </div>
                      )}
                      {showGenotype && (
                        <div className="bg-white/10 p-2 rounded-xl">
                          <span className="text-[9px] text-teal-300 uppercase block font-semibold">Genotype</span>
                          <span className="text-sm font-black text-white">{genotype}</span>
                        </div>
                      )}
                    </div>

                    {showEmergencyContact && (emergencyContactPhone || user?.emergencyContact) && (
                      <div className="bg-rose-900/40 p-2.5 rounded-xl border border-rose-500/30">
                        <span className="text-[9px] text-rose-200 uppercase block font-semibold">
                          ICE Contact ({emergencyContactRelation || 'Emergency'})
                        </span>
                        <div className="flex items-center gap-1.5 font-bold text-yellow-300 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{emergencyContactPhone || user?.emergencyContact}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {showAllergies && severeAllergies.length > 0 && (
                  <div className="mt-3 p-2.5 rounded-xl bg-rose-600/30 border border-rose-500/50 text-xs">
                    <span className="text-[10px] uppercase font-bold text-rose-300 block">Critical Allergies:</span>
                    <span className="font-bold text-white">{severeAllergies.map((a) => a.name).join(', ')}</span>
                  </div>
                )}
              </div>

              {/* QR Scan Mode & Network IP Host Configuration */}
              <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 text-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white">Format d'encodage du QR Code :</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setQrMode('url')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                        qrMode === 'url' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      Page Web d'Urgence
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrMode('vcard')}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                        qrMode === 'vcard' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Texte Secours Direct
                    </button>
                  </div>
                </div>

                {qrMode === 'url' && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="flex items-center gap-1.5">
                        <Wifi className="w-3.5 h-3.5 text-blue-400" />
                        Adresse IP / Hôte pour le scan smartphone :
                      </span>
                      <span className="font-mono text-emerald-400 truncate max-w-[200px]">{networkHost}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        value={networkHost}
                        onChange={(e) => setNetworkHost(e.target.value)}
                        placeholder="Ex: http://10.154.77.35:5173"
                        className="h-8 text-xs font-mono bg-slate-950 border-slate-800 text-slate-200 rounded-xl flex-1 min-w-[180px]"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNetworkHost('http://10.154.77.35:5173')}
                        className="h-8 text-[11px] whitespace-nowrap rounded-xl border-slate-700 hover:bg-slate-800 text-slate-300"
                      >
                        IP Wi-Fi (10.154.77.35)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setNetworkHost('http://localhost:5173')}
                        className="h-8 text-[11px] whitespace-nowrap rounded-xl border-slate-700 hover:bg-slate-800 text-slate-300"
                      >
                        Localhost
                      </Button>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-tight">
                      📱 <strong>Astuce scan mobile :</strong> Votre téléphone et cet ordinateur doivent être sur le même Wi-Fi. Le QR code utilise l'adresse IP de votre PC (<code className="text-emerald-300">10.154.77.35:5173</code>) pour que votre téléphone puisse l'ouvrir directement !
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => window.open(emergencyQrUrl, '_blank')}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs flex items-center gap-1.5 font-bold shadow-md"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Tester / Ouvrir la Fiche
                </Button>
                <Button
                  onClick={handleDownloadQr}
                  variant="outline"
                  className="rounded-2xl text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Télécharger QR (PNG)
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(emergencyQrUrl);
                    toast.success('Lien d’urgence copié dans le presse-papier !');
                  }}
                  variant="outline"
                  className="rounded-2xl text-xs flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copier le Lien
                </Button>
                <Button
                  onClick={() => window.print()}
                  variant="outline"
                  className="rounded-2xl text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer la Carte
                </Button>
              </div>
            </div>

            {/* Right 6 Columns: Privacy & Exposure Switches */}
            <div className="lg:col-span-6 space-y-4">
              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold text-slate-900">
                    Configure Emergency Information Disclosure
                  </CardTitle>
                  <CardDescription>
                    Select which health records are instantly displayed when a first responder scans your QR code
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <h5 className="font-bold text-xs sm:text-sm text-slate-900">Enable Public Emergency QR Code</h5>
                      <p className="text-[11px] text-slate-500">Allow emergency medical services to access your card</p>
                    </div>
                    <Switch checked={qrEnabled} onCheckedChange={setQrEnabled} />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Show Blood Group & Rh Factor</span>
                      <Switch checked={showBloodGroup} onCheckedChange={setShowBloodGroup} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Show Hemoglobin Genotype (AA/AS/SS)</span>
                      <Switch checked={showGenotype} onCheckedChange={setShowGenotype} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Show Emergency Contact Phone (ICE)</span>
                      <Switch checked={showEmergencyContact} onCheckedChange={setShowEmergencyContact} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Show Severe Allergies Alerts</span>
                      <Switch checked={showAllergies} onCheckedChange={setShowAllergies} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Show Pre-existing Chronic Pathologies</span>
                      <Switch checked={showChronicDiseases} onCheckedChange={setShowChronicDiseases} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-800">Show CSU Universal Health Number</span>
                      <Switch checked={showCsuNumber} onCheckedChange={setShowCsuNumber} />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Label htmlFor="emg-notes" className="text-xs font-bold text-slate-800">
                      Paramedic Instructions / First Responder Notes
                    </Label>
                    <Input
                      id="emg-notes"
                      value={emergencyNotes}
                      onChange={(e) => setEmergencyNotes(e.target.value)}
                      placeholder="e.g. Asthmatique avec inhalateur dans le sac, contactez immédiatement l'époux..."
                      className="h-10 rounded-xl bg-slate-50 mt-1 text-xs"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ADD ALLERGY DIALOG */}
      <Dialog open={isAddAllergyOpen} onOpenChange={setIsAddAllergyOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Declare Allergy or Intolerance
            </DialogTitle>
            <DialogDescription>
              Document drug allergies or adverse reactions to protect your safety when receiving medical prescriptions.
            </DialogDescription>
          </DialogHeader>

          {/* Quick preset suggestions */}
          <div className="my-1">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Common Presets (Cameroon)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DRUG_ALLERGIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setNewAllergyName(c.name);
                    setNewAllergyCategory(c.category as any);
                    setNewAllergySeverity(c.severity as any);
                    setNewAllergyReaction(c.reaction);
                  }}
                  className="text-[11px] bg-slate-100 hover:bg-rose-100 hover:text-rose-900 px-2.5 py-1 rounded-xl font-medium border border-slate-200 transition-colors"
                >
                  + {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="allergen-name" className="text-xs font-semibold text-slate-800">
                Allergen Name *
              </Label>
              <Input
                id="allergen-name"
                value={newAllergyName}
                onChange={(e) => setNewAllergyName(e.target.value)}
                placeholder="e.g. Pénicilline, Ibuprofène, Arachides..."
                className="rounded-xl mt-1 text-sm font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="allergy-cat" className="text-xs font-semibold text-slate-800">
                  Category
                </Label>
                <select
                  id="allergy-cat"
                  value={newAllergyCategory}
                  onChange={(e) => setNewAllergyCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white mt-1"
                >
                  <option value="DRUG">Drug / Médicament</option>
                  <option value="FOOD">Food / Alimentaire</option>
                  <option value="ENVIRONMENTAL">Environmental / Environnement</option>
                  <option value="OTHER">Other / Autre</option>
                </select>
              </div>

              <div>
                <Label htmlFor="allergy-sev" className="text-xs font-semibold text-slate-800">
                  Clinical Severity *
                </Label>
                <select
                  id="allergy-sev"
                  value={newAllergySeverity}
                  onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 text-xs sm:text-sm bg-white mt-1 font-bold text-rose-700"
                >
                  <option value="SEVERE_ANAPHYLAXIS">Severe Anaphylaxis (Life-Threatening)</option>
                  <option value="MODERATE">Moderate Reaction</option>
                  <option value="MILD">Mild / Intolerance</option>
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="allergy-reaction" className="text-xs font-semibold text-slate-800">
                Reaction Description
              </Label>
              <Input
                id="allergy-reaction"
                value={newAllergyReaction}
                onChange={(e) => setNewAllergyReaction(e.target.value)}
                placeholder="e.g. Œdème de Quincke, urticaire généralisée, dyspnée..."
                className="rounded-xl mt-1 text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="mt-3 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddAllergyOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddAllergy}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl px-5 font-bold"
            >
              Add to Safety Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
