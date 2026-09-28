import { MessageSquare, ShieldCheck, Pill, Clock } from 'lucide-react';
import { Button } from '../ui/button';

interface EmptyStateProps {
  onNewChat?: () => void;
}

export function EmptyState({ onNewChat }: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl border border-slate-200/90 shadow-sm">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
          <MessageSquare className="w-8 h-8 stroke-[2]" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 mb-2">
          Direct Pharmacy Messaging
        </h3>
        <p className="text-sm font-medium text-slate-600 leading-relaxed mb-6">
          Connect directly with accredited pharmacies across Cameroon. Check medicine availability, ask dosage questions, and verify prescriptions in real time.
        </p>

        {/* Feature Highlights */}
        <div className="space-y-3 mb-6 text-left">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Pill className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">Check Stock & Pricing</p>
              <p className="text-[11px] font-medium text-slate-500">Ask pharmacies directly if required medicines are currently on shelf.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">Accredited Network</p>
              <p className="text-[11px] font-medium text-slate-500">All partner pharmacies are licensed under Cameroon health regulations.</p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-slate-900">Instant Responses</p>
              <p className="text-[11px] font-medium text-slate-500">Automated acknowledgment and live staff replies as soon as they are available.</p>
            </div>
          </div>
        </div>

        {onNewChat && (
          <Button
            onClick={onNewChat}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm h-11 rounded-xl shadow-sm transition-all"
          >
            Start New Conversation
          </Button>
        )}
      </div>
    </div>
  );
}