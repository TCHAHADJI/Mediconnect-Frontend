import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { NewMessageData, UserType, Recipient } from './types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Check, ChevronsUpDown, Loader2, Store, User, MapPin, Shield, Send, Phone } from 'lucide-react';

interface NewMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: NewMessageData;
  onDataChange: (data: NewMessageData) => void;
  onSend: () => void;
  currentUserType: UserType | null;
}

export function NewMessageDialog({
  isOpen,
  onClose,
  data,
  onDataChange,
  onSend,
  currentUserType,
}: NewMessageDialogProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const getAuthToken = (): string | null => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsedSession = JSON.parse(session);
        if (parsedSession.token) return parsedSession.token;
      } catch (e) {
        console.error(e);
      }
    }
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsedAdmin = JSON.parse(adminAuth);
        if (parsedAdmin.token) return parsedAdmin.token;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  };

  useEffect(() => {
    if (currentUserType && !data.recipientType) {
      const recipientType = currentUserType === 'PATIENT' ? 'pharmacy' : 'patient';
      onDataChange({ ...data, recipientType });
    }
  }, [currentUserType, isOpen]);

  const handleSearchRecipients = async (searchQuery: string) => {
    if (!data.recipientType) return;
    setIsFetching(true);
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/users/recipients?type=${data.recipientType}&search=${encodeURIComponent(searchQuery)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch recipients');
      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        setRecipients(result.data);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
      setRecipients([]);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      handleSearchRecipients('');
    }
  }, [isOpen, data.recipientType]);

  const selectedRecipient = recipients.find((r) => r.value === data.recipientId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white rounded-3xl sm:max-w-lg p-6 shadow-xl border border-slate-200">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
            Start New Conversation
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm font-medium text-slate-500">
            Select an accredited partner pharmacy or platform support to initiate a direct chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Recipient Category */}
          <div className="space-y-1.5">
            <Label htmlFor="recipientType" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Category
            </Label>
            <Select
              value={data.recipientType}
              onValueChange={(value: 'patient' | 'pharmacy' | 'admin') => {
                onDataChange({ ...data, recipientType: value, recipientId: '' });
              }}
            >
              <SelectTrigger className="bg-slate-50 rounded-xl h-11 border-slate-300 text-slate-900 text-sm font-semibold focus:ring-2 focus:ring-blue-600">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-xl shadow-xl border border-slate-200">
                <SelectItem value="pharmacy" className="cursor-pointer font-medium py-2.5">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span>Pharmacies (Accredited Network)</span>
                  </div>
                </SelectItem>
                <SelectItem value="admin" className="cursor-pointer font-medium py-2.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>Platform Central Support</span>
                  </div>
                </SelectItem>
                {currentUserType === 'PHARMACY' && (
                  <SelectItem value="patient" className="cursor-pointer font-medium py-2.5">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <span>Patients</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Recipient Searchable Picker */}
          <div className="space-y-1.5">
            <Label htmlFor="recipient" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Choose {data.recipientType === 'pharmacy' ? 'Pharmacy' : data.recipientType === 'admin' ? 'Support Representative' : 'Patient'}
            </Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={popoverOpen}
                  className="w-full justify-between bg-slate-50 rounded-xl h-12 border-slate-300 text-slate-900 text-sm font-medium hover:bg-slate-100 transition-colors"
                  disabled={!data.recipientType}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {data.recipientType === 'pharmacy' ? (
                      <Store className="w-4 h-4 text-blue-600 shrink-0" />
                    ) : data.recipientType === 'admin' ? (
                      <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                    ) : (
                      <User className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span className="truncate font-semibold">
                      {selectedRecipient
                        ? selectedRecipient.label
                        : `Select ${data.recipientType === 'pharmacy' ? 'a pharmacy' : 'a contact'}...`}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-white rounded-2xl shadow-xl border border-slate-200" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search by name, address, or city..."
                    onValueChange={(val) => handleSearchRecipients(val)}
                    className="h-10 text-sm text-slate-900 font-medium"
                  />
                  <CommandList className="max-h-60 overflow-y-auto p-1">
                    {isFetching && (
                      <div className="p-4 flex items-center justify-center gap-2 text-slate-500 text-xs font-medium">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <span>Searching registered network...</span>
                      </div>
                    )}
                    <CommandEmpty className="p-4 text-xs text-center text-slate-500 font-medium">
                      No matching {data.recipientType}s found.
                    </CommandEmpty>
                    <CommandGroup>
                      {recipients.map((recipient) => (
                        <CommandItem
                          key={recipient.value}
                          value={recipient.label}
                          onSelect={() => {
                            onDataChange({ ...data, recipientId: recipient.value });
                            setPopoverOpen(false);
                          }}
                          className="cursor-pointer p-3 hover:bg-blue-50/80 rounded-xl flex items-start justify-between gap-2 mb-1"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {recipient.label}
                            </p>
                            {recipient.address && (
                              <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 truncate font-medium">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{recipient.address}</span>
                              </p>
                            )}
                            {recipient.phone && (
                              <p className="text-[11px] text-blue-700 font-semibold flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-blue-500 shrink-0" />
                                <span>{recipient.phone}</span>
                              </p>
                            )}
                          </div>
                          {data.recipientId === recipient.value && (
                            <Check className="w-4 h-4 text-blue-600 shrink-0 mt-1 stroke-[2.5]" />
                          )}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <Label htmlFor="content" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Your Initial Message
            </Label>
            <Textarea
              id="content"
              value={data.content}
              onChange={(e) => onDataChange({ ...data, content: e.target.value })}
              placeholder="E.g., Hello, I would like to check if you have Paracetamol 500mg in stock, or if you deliver to my area..."
              className="min-h-[120px] bg-slate-50 rounded-xl border-2 border-slate-200 text-slate-900 placeholder:text-slate-400 font-medium text-xs sm:text-sm focus-visible:bg-white focus-visible:border-blue-600 focus-visible:ring-0 p-3 leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl font-semibold text-slate-700 hover:bg-slate-100"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSend}
            disabled={!data.recipientId || !data.content.trim()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4 stroke-[2.2]" />
            <span>Send Message</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}