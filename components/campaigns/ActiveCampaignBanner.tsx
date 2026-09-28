import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { 
  Megaphone, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  PhoneCall, 
  ShieldCheck, 
  Sparkles,
  Info
} from 'lucide-react';

export interface ActiveCampaign {
  _id: string;
  title: string;
  theme: string;
  description: string;
  objectives?: string;
  targetRegions?: string[];
  targetAudience?: string;
  startDate: string;
  endDate?: string | null;
  budgetOrPartner?: string;
  status: 'ACTIVE' | 'SCHEDULED' | 'COMPLETED' | 'SUSPENDED';
  priority: 'HIGH' | 'URGENT' | 'STANDARD';
  keyMessages?: string[];
  estimatedReach?: number;
  authorityOrganization?: string;
}

export interface ActiveCampaignBannerProps {
  onNavigateToCampaigns?: () => void;
}

export function ActiveCampaignBanner({ onNavigateToCampaigns }: ActiveCampaignBannerProps = {}) {
  const [activeCampaigns, setActiveCampaigns] = useState<ActiveCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<ActiveCampaign | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchActiveCampaigns = async () => {
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/authority/campaigns/active`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setActiveCampaigns(data.data);
      }
    } catch (err) {
      console.warn('Could not load active public health campaigns:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveCampaigns();
    // Poll every 60 seconds to detect newly launched or concluded campaigns
    const interval = setInterval(fetchActiveCampaigns, 60000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading || activeCampaigns.length === 0) {
    return null;
  }

  // Prioritize LLIN (Mosquito Net) or URGENT campaigns as requested
  const sortedCampaigns = [...activeCampaigns].sort((a, b) => {
    const aIsLLIN = a.title.toLowerCase().includes('mosquito') || a.title.toLowerCase().includes('llin');
    const bIsLLIN = b.title.toLowerCase().includes('mosquito') || b.title.toLowerCase().includes('llin');
    if (aIsLLIN && !bIsLLIN) return -1;
    if (bIsLLIN && !aIsLLIN) return 1;
    if (a.priority === 'URGENT' && b.priority !== 'URGENT') return -1;
    if (b.priority === 'URGENT' && a.priority !== 'URGENT') return 1;
    return 0;
  });

  const primaryCampaign = sortedCampaigns[0];

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Jusqu\'à nouvel ordre';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const calculateDaysRemaining = (endDate?: string | null) => {
    if (!endDate) return null;
    const diff = new Date(endDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  const daysRemaining = calculateDaysRemaining(primaryCampaign.endDate);

  // If user dismissed the top banner, show a compact floating alert chip
  if (isDismissed) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-bounce">
        <Button
          onClick={() => {
            if (onNavigateToCampaigns) {
              onNavigateToCampaigns();
            } else {
              setIsDismissed(false);
            }
          }}
          className="bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xl rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-2 border border-emerald-400/40"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
          </span>
          <Megaphone className="w-3.5 h-3.5" />
          <span>Campagne Sanitaire en Cours ({activeCampaigns.length})</span>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* Top National Public Health Announcement Banner */}
      <div className="relative z-40 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white shadow-md border-b border-emerald-500/30">
        <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            
            {/* Left badge & campaign title */}
            <div className="flex items-center gap-3 overflow-hidden text-center md:text-left">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>

              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] uppercase font-bold tracking-wider shrink-0 px-2 py-0.5">
                MINSANTÉ CAMEROUN
              </Badge>

              {primaryCampaign.priority === 'URGENT' && (
                <Badge className="bg-red-500 text-white text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 animate-pulse">
                  URGENT
                </Badge>
              )}

              <div className="flex items-center gap-2 truncate">
                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                  {primaryCampaign.title}
                </p>
                <span className="hidden md:inline text-xs text-emerald-200/90 shrink-0">
                  • Période: {formatDate(primaryCampaign.startDate)} — {formatDate(primaryCampaign.endDate)}
                </span>
                {daysRemaining !== null && (
                  <Badge variant="outline" className="hidden sm:inline-flex text-[10px] text-amber-300 border-amber-400/50 bg-amber-950/40 font-mono shrink-0">
                    {daysRemaining} j restants
                  </Badge>
                )}
              </div>
            </div>

            {/* Right actions */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => setSelectedCampaign(primaryCampaign)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg h-7 px-3 shadow hover-lift gap-1"
              >
                <span>Consulter les Directives</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (onNavigateToCampaigns) {
                    onNavigateToCampaigns();
                  } else if (activeCampaigns.length > 1) {
                    setSelectedCampaign(activeCampaigns[1]);
                  } else {
                    setSelectedCampaign(primaryCampaign);
                  }
                }}
                className="bg-emerald-950/70 hover:bg-emerald-900 border-emerald-400/40 text-emerald-200 hover:text-white text-xs font-semibold h-7 px-2.5 rounded-lg flex items-center gap-1 transition-all"
                title="Consulter toutes les campagnes nationales"
              >
                <span>Autres ({activeCampaigns.length})</span>
                <ChevronRight className="w-3 h-3 text-emerald-400" />
              </Button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="text-emerald-300/70 hover:text-white p-1 rounded-md transition-colors"
                title="Masquer la bannière"
                aria-label="Masquer la bannière"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Comprehensive Official Campaign Directives Modal */}
      <Dialog open={!!selectedCampaign} onOpenChange={(open) => !open && setSelectedCampaign(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6">
          {selectedCampaign && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 text-xs uppercase font-bold tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 inline" />
                    Directive Officielle MINSANTÉ / ONPC
                  </Badge>
                  {selectedCampaign.priority === 'URGENT' && (
                    <Badge variant="destructive" className="text-xs uppercase font-bold">
                      Priorité Sanitaire Renforcée
                    </Badge>
                  )}
                </div>

                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-start gap-2.5">
                  <Megaphone className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{selectedCampaign.title}</span>
                </DialogTitle>

                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  Campagne d'intérêt national sous la tutelle du Ministère de la Santé Publique et de l'Ordre National des Pharmaciens du Cameroun.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                {/* Validity Period & Audience Banner */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Période d'activité:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {formatDate(selectedCampaign.startDate)} — {formatDate(selectedCampaign.endDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Régions Ciblées:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {(selectedCampaign.targetRegions || ['Toutes les régions (National)']).join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Population Cible:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {selectedCampaign.targetAudience || 'Population générale'}
                    </p>
                  </div>
                </div>

                {/* Description & Clinical Context */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    Contexte Sanitaire & Objectifs
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {selectedCampaign.description}
                  </p>
                </div>

                {/* Key Messages & Prevention Directives */}
                {selectedCampaign.keyMessages && selectedCampaign.keyMessages.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Directives & Conseils de Prévention Recommandés
                    </h4>
                    <div className="space-y-2">
                      {selectedCampaign.keyMessages.map((msg, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm text-xs text-slate-800 dark:text-slate-200">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                            {idx + 1}
                          </span>
                          <span className="mt-0.5">{msg}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sponsoring Partners & National Hotline */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="text-slate-500 dark:text-slate-400">
                    <span>Partenaire / Financement:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedCampaign.budgetOrPartner || 'MINSANTÉ Cameroun / Partenaires Techniques'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Numéro Vert National Gratuit</p>
                      <p className="text-sm font-extrabold text-amber-950 dark:text-amber-100">1510 (MINSANTÉ Cameroun)</p>
                    </div>
                  </div>
                </div>

                {/* Navigation between multiple active campaigns */}
                {activeCampaigns.length > 1 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-500 font-medium mb-1.5">Autres campagnes actives en ce moment:</p>
                    <div className="flex gap-2 flex-wrap">
                      {activeCampaigns.map((c) => (
                        <Button
                          key={c._id}
                          variant={c._id === selectedCampaign._id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCampaign(c)}
                          className="text-xs rounded-xl h-7"
                        >
                          {c.title}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                  {onNavigateToCampaigns && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(null);
                        onNavigateToCampaigns();
                      }}
                      className="text-xs text-emerald-700 dark:text-emerald-300 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 rounded-xl"
                    >
                      <Megaphone className="w-3.5 h-3.5 mr-1.5" />
                      Voir toutes les campagnes dans l'onglet dédié
                    </Button>
                  )}
                  <Button
                    onClick={() => setSelectedCampaign(null)}
                    className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs rounded-xl ml-auto"
                  >
                    Fermer
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
