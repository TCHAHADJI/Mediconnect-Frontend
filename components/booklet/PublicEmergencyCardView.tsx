import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  ShieldAlert,
  Phone,
  AlertTriangle,
  HeartPulse,
  Activity,
  Hospital,
  User,
  FileText,
  Printer,
  Share2,
  ExternalLink,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Sparkles,
  PhoneCall,
  Flame,
  Stethoscope,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface EmergencyData {
  patientName: string;
  bloodGroup?: string;
  genotype?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relation?: string;
  };
  allergies?: Array<{
    name: string;
    category?: string;
    severity?: string;
    reaction?: string;
  }>;
  chronicDiseases?: string[];
  csuIdentifier?: string;
  emergencyNotes?: string;
  attendingHospital?: string;
  attendingPhysician?: string;
  organDonor?: boolean;
  qrToken?: string;
  updatedAt?: string;
}

interface PublicEmergencyCardViewProps {
  token?: string;
  onBack?: () => void;
}

export function PublicEmergencyCardView({ token: propToken, onBack }: PublicEmergencyCardViewProps) {
  // Extract token from URL if not passed as prop
  const token = propToken || (typeof window !== 'undefined' ? window.location.pathname.split('/').pop() : '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<EmergencyData | null>(null);

  const fetchEmergencyInfo = async () => {
    if (!token) {
      setError('Jeton d’urgence manquant dans l’URL.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Endpoints candidates to try in order:
    // 1. Relative /api proxy: works identically from phone, localhost, or any IP
    // 2. Same host port 5000: http://<ip-or-host>:5000/api
    // 3. VITE_API_URL from environment
    const candidates: string[] = [`/api/users/emergency-card/${token}`];

    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol || 'http:';
      const hostname = window.location.hostname;
      if (hostname) {
        candidates.push(`${protocol}//${hostname}:5000/api/users/emergency-card/${token}`);
      }
    }

    const envApi = import.meta.env.VITE_API_URL;
    if (envApi && !candidates.includes(`${envApi.replace(/\/+$/, '')}/users/emergency-card/${token}`)) {
      candidates.push(`${envApi.replace(/\/+$/, '')}/users/emergency-card/${token}`);
    }

    let lastError = '';
    for (const url of candidates) {
      try {
        console.log('Attempting to fetch emergency card from:', url);
        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        if (res.ok) {
          const result = await res.json();
          if (result.success && result.data) {
            setData(result.data);
            setLoading(false);
            return;
          } else if (result.message) {
            lastError = result.message;
          }
        } else {
          try {
            const errJson = await res.json();
            if (errJson.message) lastError = errJson.message;
          } catch (_) {}
        }
      } catch (err: any) {
        console.warn(`Fetch attempt to ${url} failed:`, err?.message);
      }
    }

    setError(lastError || 'Impossible de joindre le serveur MediConnect. Veuillez vérifier la connexion.');
    setLoading(false);
  };

  useEffect(() => {
    fetchEmergencyInfo();
  }, [token]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Fiche Médicale d'Urgence - ${data?.patientName || 'Patient'}`,
        text: `Informations médicales d'urgence pour les premiers secours et le SAMU.`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien d’urgence copié dans le presse-papier !');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center mb-4 animate-pulse">
          <ShieldAlert className="w-8 h-8 text-rose-500" />
        </div>
        <h2 className="text-xl font-bold tracking-tight">Chargement de la Fiche d'Urgence...</h2>
        <p className="text-slate-400 text-sm mt-1">Connexion sécurisée au registre national MINSANTÉ</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/40 rounded-3xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Fiche d'Urgence Non Accessible</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            {error || 'Cette fiche médicale d’urgence n’existe pas ou a été désactivée par le patient.'}
          </p>
          <div className="space-y-2">
            <Button 
              onClick={fetchEmergencyInfo} 
              className="w-full rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Réessayer la connexion
            </Button>
            {onBack ? (
              <Button onClick={onBack} variant="outline" className="w-full rounded-2xl border-slate-700 text-slate-200">
                <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = '/')} variant="outline" className="w-full rounded-2xl border-slate-700 text-slate-200">
                <ArrowLeft className="w-4 h-4 mr-2" /> Accéder au portail MediConnect
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const severeAllergies = (data.allergies || []).filter(
    (a) => a.severity === 'SEVERE_ANAPHYLAXIS' || !a.severity
  );
  const otherAllergies = (data.allergies || []).filter(
    (a) => a.severity && a.severity !== 'SEVERE_ANAPHYLAXIS'
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased selection:bg-rose-500 selection:text-white pb-12">
      {/* Top Emergency Flash Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-rose-500/30 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30 animate-pulse">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 block leading-none">
                SECOURS • SAMU • URGENCE
              </span>
              <h1 className="text-sm font-extrabold text-white leading-tight">
                Fiche Médicale Première Réponse
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-700 hover:bg-slate-800 text-slate-300 text-xs h-8 px-2.5"
            >
              <Share2 className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Partager</span>
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              size="sm"
              className="rounded-xl border-slate-700 hover:bg-slate-800 text-slate-300 text-xs h-8 px-2.5"
            >
              <Printer className="w-3.5 h-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Imprimer</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto px-4 pt-6 space-y-5">
        {/* National Emergency Notification Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-amber-950/80 border-2 border-rose-500/50 p-5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-rose-400 shrink-0">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
                    Carnet Numérique MINSANTÉ
                  </span>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    Vérifié
                  </Badge>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {data.patientName}
                </h2>
              </div>
            </div>

            {/* Quick Emergency Phone Action */}
            {data.emergencyContact?.phone && (
              <a
                href={`tel:${data.emergencyContact.phone}`}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm px-4 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-105 active:scale-95 shrink-0"
              >
                <PhoneCall className="w-4 h-4 animate-bounce" />
                <span>Appeler le Contact d'Urgence</span>
              </a>
            )}
          </div>
        </div>

        {/* PRIMARY BIOMETRICS: Blood Group, Genotype, Organ Donor */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Blood Group */}
          <div className="rounded-3xl bg-slate-900/90 border border-rose-500/40 p-4 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 to-rose-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 mb-1">
              Groupe Sanguin & Rh
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {data.bloodGroup || 'Non renseigné'}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">Facteur Rhésus</span>
          </div>

          {/* Genotype */}
          <div className="rounded-3xl bg-slate-900/90 border border-teal-500/40 p-4 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 to-emerald-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-1">
              Génotype Hémoglobine
            </span>
            <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
              {data.genotype || 'AA'}
            </div>
            <span className="text-[10px] text-slate-400 mt-1">
              {data.genotype === 'SS' ? 'Drépanocytose majeure' : data.genotype === 'AS' ? 'Porteur sain' : 'Profil normal'}
            </span>
          </div>

          {/* CSU Insurance or Organ Donor */}
          <div className="col-span-2 sm:col-span-1 rounded-3xl bg-slate-900/90 border border-blue-500/40 p-4 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1">
              Matricule CSU Cameroun
            </span>
            <div className="text-lg sm:text-xl font-black text-white tracking-tight font-mono">
              {data.csuIdentifier || 'CSU-CM-EN-COURS'}
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-1">
              Couverture Santé Universelle
            </span>
          </div>
        </div>

        {/* ICE EMERGENCY CONTACT BOX */}
        {data.emergencyContact && (
          <Card className="rounded-3xl bg-slate-900/95 border-rose-500/40 shadow-xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">Contact en Cas d'Urgence (ICE)</h3>
                    <p className="text-xs text-slate-400">À contacter immédiatement par les secouristes</p>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-yellow-300 border border-amber-500/40 text-xs">
                  Priorité 1
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block">Nom & Lien de parenté :</span>
                  <div className="font-extrabold text-white text-base sm:text-lg">
                    {data.emergencyContact.name || 'Proche désigné'}
                    {data.emergencyContact.relation && (
                      <span className="text-sm font-normal text-slate-400 ml-2">
                        ({data.emergencyContact.relation})
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-mono text-emerald-400 font-bold">
                    {data.emergencyContact.phone || 'Non renseigné'}
                  </div>
                </div>

                {data.emergencyContact.phone && (
                  <a
                    href={`tel:${data.emergencyContact.phone}`}
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm px-5 py-3 rounded-2xl transition-all shadow-md shrink-0"
                  >
                    <Phone className="w-4 h-4" />
                    Composer l'appel
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CRITICAL ALLERGIES & CONTRAINDICATIONS */}
        <Card className="rounded-3xl bg-slate-900/95 border-rose-500/40 shadow-xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Allergies Majeures & Contre-indications</h3>
                  <p className="text-xs text-slate-400">Substances à proscrire absolument lors des soins d'urgence</p>
                </div>
              </div>
              <Badge className="bg-rose-600 text-white text-xs font-bold">
                Alerte Vitale
              </Badge>
            </div>

            {(!data.allergies || data.allergies.length === 0) ? (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <p className="text-sm font-bold text-white">Aucune allergie documentée</p>
                <p className="text-xs text-slate-400">Aucune hypersensibilité médicamenteuse enregistrée à ce jour.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.allergies.map((allergy, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-base">{allergy.name}</span>
                        <Badge className="bg-rose-600 text-white text-[10px] font-bold">
                          {allergy.severity === 'SEVERE_ANAPHYLAXIS' ? 'Risque Anaphylaxie' : 'Modérée'}
                        </Badge>
                      </div>
                      {allergy.reaction && (
                        <p className="text-xs text-rose-200">
                          <strong className="text-rose-100">Réaction constatée :</strong> {allergy.reaction}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline" className="border-rose-400/40 text-rose-300 text-xs self-start sm:self-auto">
                      {allergy.category || 'MÉDICAMENT'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* CHRONIC DISEASES & PATHOLOGIES */}
        {data.chronicDiseases && data.chronicDiseases.length > 0 && (
          <Card className="rounded-3xl bg-slate-900/95 border-blue-500/40 shadow-xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Pathologies Chroniques Documentées</h3>
                  <p className="text-xs text-slate-400">Antécédents médicaux pertinents pour la réanimation</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {data.chronicDiseases.map((disease, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-500/40 text-blue-200 font-semibold text-xs sm:text-sm"
                  >
                    {disease}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* HOSPITAL & PARAMEDIC INSTRUCTIONS */}
        {(data.emergencyNotes || data.attendingHospital || data.attendingPhysician) && (
          <Card className="rounded-3xl bg-slate-900/95 border-slate-800 shadow-xl overflow-hidden">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
                  <Hospital className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Instructions Secouristes & Établissement de Référence</h3>
                  <p className="text-xs text-slate-400">Coordonnées de l'équipe soignante habituelle</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {data.emergencyNotes && (
                  <div className="p-3.5 rounded-2xl bg-amber-950/30 border border-amber-500/40 text-amber-200">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
                      Consigne Spécifique du Patient / Médecin :
                    </span>
                    <p className="text-sm font-medium leading-relaxed">{data.emergencyNotes}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {data.attendingHospital && (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Hôpital d'affiliation :</span>
                      <span className="font-bold text-white text-sm">{data.attendingHospital}</span>
                    </div>
                  )}

                  {data.attendingPhysician && (
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-[11px] text-slate-400 block">Médecin traitant :</span>
                      <span className="font-bold text-white text-sm">{data.attendingPhysician}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* NATIONAL EMERGENCY HOTLINES FOOTER */}
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 space-y-3 text-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
            Numéros d'Urgence Nationaux Cameroun
          </span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="tel:112"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md"
            >
              <Phone className="w-3.5 h-3.5" /> Urgences Nationales : 112
            </a>
            <a
              href="tel:8022"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md"
            >
              <Phone className="w-3.5 h-3.5" /> SAMU Cameroun : 8022
            </a>
            <a
              href="tel:15"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md"
            >
              <Phone className="w-3.5 h-3.5" /> Urgences Médicales : 15
            </a>
          </div>
          <p className="text-[11px] text-slate-500 pt-2">
            Système d'Information Médicale d'Urgence • MINSANTÉ Cameroun & Plateforme MediConnect
          </p>
        </div>
      </main>
    </div>
  );
}
