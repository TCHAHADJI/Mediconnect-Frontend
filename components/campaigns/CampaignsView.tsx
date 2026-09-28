import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import {
  Megaphone,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
  Store,
  FileText,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

export interface CampaignItem {
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
  participatingPharmaciesCount?: number;
  authorityOrganization?: string;
}

interface CampaignsViewProps {
  userRole?: 'patient' | 'pharmacy' | 'admin' | 'health_authority';
  onNavigateToPharmacies?: () => void;
}

export function CampaignsView({ userRole = 'patient', onNavigateToPharmacies }: CampaignsViewProps) {
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');
  const [themeFilter, setThemeFilter] = useState<string>('ALL');
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignItem | null>(null);

  const fetchCampaigns = async (showToast = false) => {
    if (showToast) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      // Fetch all official campaigns directly from the database
      const res = await fetch(`${apiBase}/authority/campaigns`);
      const data = await res.json();
      
      let allCamps: CampaignItem[] = [];
      if (data.success && data.data?.campaigns) {
        allCamps = data.data.campaigns;
      } else if (data.success && Array.isArray(data.data)) {
        allCamps = data.data;
      } else {
        // Fallback to active campaigns
        const actRes = await fetch(`${apiBase}/authority/campaigns/active`);
        const actData = await actRes.json();
        if (actData.success && Array.isArray(actData.data)) {
          allCamps = actData.data;
        }
      }

      setCampaigns(allCamps);
      if (showToast) toast.success('Campaigns list refreshed from database');
    } catch (err) {
      console.error('Error fetching campaigns:', err);
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

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

  const filteredCampaigns = campaigns.filter((camp) => {
    const matchesSearch = 
      camp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      camp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (camp.targetRegions || []).some(r => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (camp.theme || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      statusFilter === 'ALL' ? true : camp.status === statusFilter;

    const matchesTheme = 
      themeFilter === 'ALL' ? true : camp.theme === themeFilter;

    return matchesSearch && matchesStatus && matchesTheme;
  });

  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length;
  const completedCount = campaigns.filter(c => c.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* National Authority Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs uppercase font-bold tracking-wider px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline" />
                République du Cameroun • MINSANTÉ / ONPC
              </Badge>
              <Badge variant="secondary" className="bg-white/10 text-emerald-200 border-none text-xs">
                {activeCount} Campagne{activeCount > 1 ? 's' : ''} en cours
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              <Megaphone className="h-8 w-8 text-emerald-400 shrink-0" />
              National Public Health Campaigns
            </h1>

            <p className="text-emerald-100/80 text-sm leading-relaxed">
              Consultez en temps réel les directives sanitaires nationales, les campagnes de vaccination, les distributions gratuites de moustiquaires (LLIN) et les alertes épidémiologiques officielles au Cameroun.
            </p>
          </div>

          {/* National Hotline Emergency Callout */}
          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 flex items-center gap-4 shrink-0 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
              <PhoneCall className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs text-emerald-200 font-medium uppercase tracking-wider">Numéro Vert National</p>
              <p className="text-2xl font-black text-amber-300 font-mono tracking-tight">1510</p>
              <p className="text-[11px] text-white/70">Appel gratuit 24h/24 (MINSANTÉ)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950 p-4">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par titre, maladie, région (ex: Paludisme, Choléra, Littoral)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Toutes ({campaigns.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                En cours ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('COMPLETED')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  statusFilter === 'COMPLETED'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Clôturées ({completedCount})
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCampaigns(true)}
              disabled={isRefreshing || isLoading}
              className="rounded-xl text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Campaigns Cards Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-slate-400 bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
          <p className="text-sm font-medium">Chargement des campagnes nationales de santé...</p>
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="p-16 text-center bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
          <Megaphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">Aucune campagne trouvée</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Aucune campagne ne correspond aux critères de recherche actuels. Modifiez vos filtres pour afficher l'ensemble des programmes sanitaires.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCampaigns.map((camp) => {
            const isActive = camp.status === 'ACTIVE';
            const daysRemaining = calculateDaysRemaining(camp.endDate);

            return (
              <Card
                key={camp._id}
                className={`rounded-3xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? 'border-emerald-300 dark:border-emerald-800/60 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 shadow-md hover:shadow-lg'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-80'
                }`}
              >
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {isActive ? (
                            <Badge className="bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping mr-1 inline-block" />
                              En cours
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500 border-slate-300 text-[10px] font-semibold uppercase">
                              Clôturée
                            </Badge>
                          )}

                          {camp.priority === 'URGENT' && isActive && (
                            <Badge className="bg-red-500 text-white text-[10px] font-extrabold uppercase animate-pulse">
                              URGENT
                            </Badge>
                          )}

                          <Badge variant="outline" className="text-[10px] text-emerald-800 dark:text-emerald-300 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-medium">
                            {camp.theme?.replace(/_/g, ' ') || 'PREVENTION'}
                          </Badge>
                        </div>

                        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white pt-1 leading-snug">
                          {camp.title}
                        </CardTitle>
                      </div>

                      {isActive && daysRemaining !== null && (
                        <div className="text-right shrink-0 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 px-3 py-1.5 rounded-2xl">
                          <p className="text-xs font-black text-amber-700 dark:text-amber-300 font-mono">
                            {daysRemaining} j restants
                          </p>
                          <p className="text-[10px] text-amber-800/70 font-medium">Fin: {formatDate(camp.endDate)}</p>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-4 text-xs">
                    {/* Active Time Window Banner */}
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium bg-white/70 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>• Période: <strong>{formatDate(camp.startDate)}</strong> — <strong>{formatDate(camp.endDate)}</strong></span>
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {camp.description}
                    </p>

                    {/* Target Regions & Audience */}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-xl">
                        <span className="text-slate-400 font-medium block">Régions concernées:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          {(camp.targetRegions || ['National']).join(', ')}
                        </span>
                      </div>
                      <div className="bg-slate-100/70 dark:bg-slate-800/50 p-2.5 rounded-xl">
                        <span className="text-slate-400 font-medium block">Bénéficiaires cibles:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-emerald-600 shrink-0" />
                          {camp.targetAudience || 'Population générale'}
                        </span>
                      </div>
                    </div>

                    {/* Directives Checklist */}
                    {camp.keyMessages && camp.keyMessages.length > 0 && (
                      <div className="space-y-2 bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                        <p className="font-bold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          Directives & Consignes de Prévention:
                        </p>
                        <ul className="space-y-1.5">
                          {camp.keyMessages.map((msg, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-slate-700 dark:text-slate-300 text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{msg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Role-Specific Pharmacist / Patient Directives */}
                    {userRole === 'pharmacy' && (
                      <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200">
                        <p className="font-bold flex items-center gap-1.5 mb-1">
                          <Store className="w-3.5 h-3.5 text-blue-600" />
                          Consignes Spécifiques Officine Pharmacie:
                        </p>
                        <p>
                          Assurez la disponibilité des intrants homologués ({camp.theme?.replace(/_/g, ' ')}), sensibilisez chaque patient lors de la délivrance et signalez tout effet indésirable au centre de pharmacovigilance.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </div>

                <div className="p-4 pt-0 mt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <span className="text-[11px] text-slate-400 truncate">
                    Partenaire: <strong className="text-slate-700 dark:text-slate-300">{camp.budgetOrPartner || 'MINSANTÉ Cameroun'}</strong>
                  </span>

                  <Button
                    size="sm"
                    onClick={() => setSelectedCampaign(camp)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl h-8 px-3.5 shadow-sm hover-lift"
                  >
                    Consulter les Directives
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Campaign Detail Modal */}
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
                      URGENT
                    </Badge>
                  )}
                </div>

                <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-start gap-2.5">
                  <Megaphone className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{selectedCampaign.title}</span>
                </DialogTitle>

                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCampaign.authorityOrganization || 'Ministère de la Santé Publique du Cameroun (MINSANTÉ)'}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
                  <div>
                    <span className="text-slate-500 font-medium">Période d'activité:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      {formatDate(selectedCampaign.startDate)} — {formatDate(selectedCampaign.endDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Régions Ciblées:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      {(selectedCampaign.targetRegions || ['Toutes les régions (National)']).join(', ')}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium">Population Cible:</span>
                    <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      {selectedCampaign.targetAudience || 'Population générale'}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    Contexte Sanitaire & Objectifs
                  </h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {selectedCampaign.description}
                  </p>
                  {selectedCampaign.objectives && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                      <strong>Objectifs prioritaires:</strong> {selectedCampaign.objectives}
                    </p>
                  )}
                </div>

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

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="text-slate-500 dark:text-slate-400">
                    <span>Partenaire / Financement:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {selectedCampaign.budgetOrPartner || 'MINSANTÉ Cameroun / Partenaires Internationaux'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-center gap-3">
                    <PhoneCall className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Numéro Vert Gratuit</p>
                      <p className="text-sm font-extrabold text-amber-950 dark:text-amber-100">1510 (MINSANTÉ Cameroun)</p>
                    </div>
                  </div>
                </div>

                {onNavigateToPharmacies && (
                  <div className="pt-2 flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedCampaign(null);
                        onNavigateToPharmacies();
                      }}
                      className="text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50 rounded-xl"
                    >
                      <Store className="w-3.5 h-3.5 mr-1.5" />
                      Trouver une pharmacie partenaire participante
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
