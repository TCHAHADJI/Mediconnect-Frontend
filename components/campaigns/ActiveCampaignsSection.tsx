import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  Megaphone, 
  Calendar, 
  MapPin, 
  Users, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles,
  PhoneCall,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ActiveCampaign } from './ActiveCampaignBanner';

interface ActiveCampaignsSectionProps {
  userRole?: 'patient' | 'pharmacy' | 'admin' | 'health_authority';
}

export function ActiveCampaignsSection({ userRole = 'patient' }: ActiveCampaignsSectionProps) {
  const [campaigns, setCampaigns] = useState<ActiveCampaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await fetch(`${apiBase}/authority/campaigns/active`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setCampaigns(data.data);
        }
      } catch (err) {
        console.warn('Could not load active campaigns:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  if (isLoading || campaigns.length === 0) {
    return null;
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'En cours';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-4 my-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 flex items-center justify-center text-emerald-600 shadow-sm">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Campagnes Nationales de Santé Publique
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 text-[10px] uppercase font-bold">
                {campaigns.length} Active{campaigns.length > 1 ? 's' : ''}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Directives officielles émises par le Ministère de la Santé Publique (MINSANTÉ) et l'ONPC
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((camp) => (
          <Card 
            key={camp._id} 
            className="rounded-3xl border border-emerald-200/70 dark:border-emerald-900/40 bg-gradient-to-br from-white via-emerald-50/20 to-teal-50/30 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 shadow-sm hover:shadow-md transition-all"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 uppercase font-semibold">
                      MINSANTÉ Homologué
                    </Badge>
                    {camp.priority === 'URGENT' && (
                      <Badge className="bg-red-500 text-white text-[10px] font-bold">
                        URGENT
                      </Badge>
                    )}
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(camp.startDate)} — {formatDate(camp.endDate)}
                    </span>
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white pt-1">
                    {camp.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 pt-0 text-xs">
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                {camp.description}
              </p>

              {camp.keyMessages && camp.keyMessages.length > 0 && (
                <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-900/30 space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500" />
                    Directives Essentielles:
                  </p>
                  <ul className="space-y-1">
                    {camp.keyMessages.slice(0, 2).map((msg, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-slate-700 dark:text-slate-300 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{msg}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {(camp.targetRegions || ['Toutes les régions']).slice(0, 2).join(', ')}
                </span>
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {camp.budgetOrPartner || 'MINSANTÉ Cameroun'}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
