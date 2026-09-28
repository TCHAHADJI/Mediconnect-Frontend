import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Key, Copy, Check, Terminal, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';

interface PosIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PosIntegrationModal({ isOpen, onClose }: PosIntegrationModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      return JSON.parse(session).token;
    }
    return null;
  };

  useEffect(() => {
    if (!isOpen) return;

    const fetchApiKey = async () => {
      setIsLoading(true);
      const token = getAuthToken();
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/inventory-sync/api-key`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setApiKey(data.data.apiKey);
          setEndpoint(data.data.syncEndpoint);
        }
      } catch (err) {
        console.error('Error fetching POS API key:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApiKey();
  }, [isOpen]);

  const copyToClipboard = (text: string, type: 'key' | 'curl') => {
    navigator.clipboard.writeText(text);
    if (type === 'key') {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
    toast.success('Copied to clipboard!');
  };

  const sampleCurl = `curl -X POST ${endpoint || 'http://localhost:5000/api/inventory-sync/pos-sync'} \\
  -H "Content-Type: application/json" \\
  -H "x-pharmacy-api-key: ${apiKey || 'YOUR_API_KEY'}" \\
  -d '{
    "updates": [
      { "medicineName": "Coartem 20/120mg", "quantityChange": -1 },
      { "medicineName": "Doliprane 500mg", "absoluteQuantity": 85 }
    ]
  }'`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Key className="h-5 w-5 text-indigo-500" />
            Connect POS / Pharmacy Management Software
          </DialogTitle>
          <DialogDescription>
            Seamlessly synchronize stock adjustments and sales from WinPharma, SmartPharm, or custom software via our secure REST API.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* API Key Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Your Dedicated POS API Key</span>
              <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500">
                Active & Secured
              </Badge>
            </label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={isLoading ? 'Generating key...' : apiKey}
                className="font-mono text-xs bg-slate-50 dark:bg-slate-900"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(apiKey, 'key')}
                className="gap-1.5 text-xs"
              >
                {copiedKey ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                Copy
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Pass this key in the <code className="text-indigo-500">x-pharmacy-api-key</code> HTTP header of all sync requests.
            </p>
          </div>

          {/* Sync Endpoint */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Live Synchronization Endpoint (POST)
            </label>
            <Input
              readOnly
              value={endpoint || 'http://localhost:5000/api/inventory-sync/pos-sync'}
              className="font-mono text-xs bg-slate-50 dark:bg-slate-900"
            />
          </div>

          {/* Integration Sample Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-slate-500" />
                Example Payload (Triggered on sale or stock receipt):
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(sampleCurl, 'curl')}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 h-6"
              >
                {copiedCurl ? 'Copied' : 'Copy cURL'}
              </Button>
            </div>

            <pre className="p-3 rounded-lg bg-slate-950 text-slate-200 text-xs font-mono overflow-x-auto border border-slate-800">
              {sampleCurl}
            </pre>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                Zero Inventory Duplication
              </div>
              <p className="text-slate-500">
                Matches incoming sales directly to certified Master Catalogue items automatically.
              </p>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5 text-indigo-500" />
                Real-Time Patient Visibility
              </div>
              <p className="text-slate-500">
                Stock changes reflect instantaneously on the patient mobile app to prevent fruitless travel.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3 border-t">
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
