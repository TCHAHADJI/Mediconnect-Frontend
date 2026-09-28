import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Camera,
  Trash2,
  KeyRound,
  Store,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Shield,
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  FileCheck2,
  Moon,
  Sun,
  AlertTriangle,
  Building2,
  Radio,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

export interface PharmacyProfileData {
  id?: string;
  _id?: string;
  name: string; // Pharmacist in charge or primary account name
  businessName?: string; // Official Pharmacy Trade Name
  email: string;
  phone?: string;
  address?: string;
  businessAddress?: string;
  city?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  licenseNumber?: string;
  onpcNumber?: string; // Ordre National des Pharmaciens du Cameroun
  profilePicture?: string;
  profileImage?: string;
  userType?: string;
  status?: string;
  verificationStatus?: boolean;
  isOnDuty?: boolean;
  realTimeStatus?: 'OPEN' | 'ON_DUTY' | 'CLOSED';
  dutyRosterZone?: string;
  operatingHours?: {
    openingTime?: string;
    closingTime?: string;
    is24Hours?: boolean;
    text?: string;
  };
  dutySchedule?: {
    nightDuty?: {
      enabled?: boolean;
      startTime?: string;
      endTime?: string;
      onCallPhone?: string;
      dutyPharmacistName?: string;
      emergencyInstructions?: string;
      is24Hours?: boolean;
    };
    rotations?: any[];
  };
  posApiKey?: string;
}

interface PharmacyProfileProps {
  user: PharmacyProfileData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: PharmacyProfileData) => void;
}

const CAMEROON_MAJOR_CITIES = [
  'Yaoundé',
  'Douala',
  'Bafoussam',
  'Garoua',
  'Bamenda',
  'Maroua',
  'Ngaoundéré',
  'Kribi',
  'Buea',
  'Limbe',
  'Bertoua',
  'Ebolowa',
  'Dschang',
  'Edéa',
  'Foumban'
];

export function PharmacyProfile({ user, isOpen, onClose, onUpdate }: PharmacyProfileProps) {
  const [editedUser, setEditedUser] = useState<PharmacyProfileData>(user);
  const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>(
    user.profilePicture || user.profileImage
  );
  const [activeTab, setActiveTab] = useState<'general' | 'location' | 'regulatory' | 'hours' | 'security'>('general');

  // Security / Password fields
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Sync state when user prop changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setEditedUser({
        ...user,
        city: user.city || 'Yaoundé',
        businessName: user.businessName || user.name || '',
        businessAddress: user.businessAddress || user.address || '',
        operatingHours: {
          openingTime: user.operatingHours?.openingTime || '08:00',
          closingTime: user.operatingHours?.closingTime || '21:00',
          is24Hours: !!user.operatingHours?.is24Hours,
          text: user.operatingHours?.text || '08:00 - 21:00'
        },
        dutySchedule: {
          ...user.dutySchedule,
          nightDuty: {
            enabled: user.dutySchedule?.nightDuty?.enabled ?? user.isOnDuty ?? false,
            startTime: user.dutySchedule?.nightDuty?.startTime || '20:00',
            endTime: user.dutySchedule?.nightDuty?.endTime || '08:00',
            onCallPhone: user.dutySchedule?.nightDuty?.onCallPhone || user.phone || '',
            dutyPharmacistName: user.dutySchedule?.nightDuty?.dutyPharmacistName || user.name || '',
            emergencyInstructions: user.dutySchedule?.nightDuty?.emergencyInstructions || "Sonnette de nuit disponible au guichet d'urgence.",
            is24Hours: user.dutySchedule?.nightDuty?.is24Hours ?? false
          }
        }
      });
      setProfilePicPreview(user.profilePicture || user.profileImage);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('general');
    }
  }, [user, isOpen]);

  const handleInputChange = (field: keyof PharmacyProfileData, value: any) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  // Compress image on canvas to keep DB lightweight and performant
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 480;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85));
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleProfilePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG, JPEG)');
        return;
      }
      try {
        const compressedBase64 = await compressImage(file);
        setProfilePicPreview(compressedBase64);
        setEditedUser((prev) => ({
          ...prev,
          profilePicture: compressedBase64,
          profileImage: compressedBase64,
        }));
        toast.success('Pharmacy logo / storefront preview ready. Click "Save Changes" to persist.');
      } catch (err) {
        console.error('Image compression error:', err);
        toast.error('Failed to process image');
      }
    }
  };

  const handleRemovePhoto = () => {
    setProfilePicPreview(undefined);
    setEditedUser((prev) => ({
      ...prev,
      profilePicture: '',
      profileImage: '',
    }));
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setEditedUser((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
        setIsLocating(false);
        toast.success(`Coordinates detected: ${lat}, ${lng}`);
      },
      (err) => {
        setIsLocating(false);
        console.error('Geolocation error:', err);
        toast.error('Could not detect GPS location. You can enter coordinates manually.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const getAuthToken = (): string | null => {
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed?.token || parsed?.data?.token || parsed?.user?.token;
      } catch (e) {}
    }
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsed = JSON.parse(adminAuth);
        return parsed?.token;
      } catch (e) {}
    }
    return null;
  };

  const handleSaveChanges = async () => {
    // Validation
    const phName = editedUser.businessName?.trim() || editedUser.name?.trim();
    if (!phName) {
      toast.error('Pharmacy name is required');
      setActiveTab('general');
      return;
    }
    if (!editedUser.email || !editedUser.email.trim()) {
      toast.error('Email cannot be empty');
      setActiveTab('general');
      return;
    }

    const payload: any = {
      name: editedUser.name ? editedUser.name.trim() : phName,
      businessName: phName,
      email: editedUser.email.trim().toLowerCase(),
      phone: editedUser.phone ? editedUser.phone.trim() : '',
      address: editedUser.businessAddress ? editedUser.businessAddress.trim() : (editedUser.address ? editedUser.address.trim() : ''),
      businessAddress: editedUser.businessAddress ? editedUser.businessAddress.trim() : (editedUser.address ? editedUser.address.trim() : ''),
      city: editedUser.city ? editedUser.city.trim() : 'Yaoundé',
      district: editedUser.district ? editedUser.district.trim() : '',
      latitude: editedUser.latitude !== undefined && editedUser.latitude !== null ? Number(editedUser.latitude) : undefined,
      longitude: editedUser.longitude !== undefined && editedUser.longitude !== null ? Number(editedUser.longitude) : undefined,
      licenseNumber: editedUser.licenseNumber ? editedUser.licenseNumber.trim() : '',
      onpcNumber: editedUser.onpcNumber ? editedUser.onpcNumber.trim() : '',
      dutyRosterZone: editedUser.dutyRosterZone ? editedUser.dutyRosterZone.trim() : '',
      realTimeStatus: editedUser.realTimeStatus || 'OPEN',
      isOnDuty: editedUser.realTimeStatus === 'ON_DUTY',
      operatingHours: {
        openingTime: editedUser.operatingHours?.openingTime || '08:00',
        closingTime: editedUser.operatingHours?.closingTime || '21:00',
        is24Hours: !!editedUser.operatingHours?.is24Hours,
        text: editedUser.operatingHours?.is24Hours 
          ? 'Service 24h/24 Continu' 
          : `${editedUser.operatingHours?.openingTime || '08:00'} - ${editedUser.operatingHours?.closingTime || '21:00'}`
      },
      dutySchedule: editedUser.dutySchedule,
      profilePicture: editedUser.profilePicture || editedUser.profileImage || '',
      profileImage: editedUser.profilePicture || editedUser.profileImage || ''
    };

    // Password validation if requested
    if (isChangingPassword) {
      const trimmedNewPass = newPassword.trim();
      if (!trimmedNewPass) {
        toast.error('Please enter a new password or cancel password change');
        setActiveTab('security');
        return;
      }
      if (trimmedNewPass.length < 6) {
        toast.error('New password must be at least 6 characters long');
        setActiveTab('security');
        return;
      }
      if (trimmedNewPass !== confirmPassword.trim()) {
        toast.error('New passwords do not match');
        setActiveTab('security');
        return;
      }

      payload.newPassword = trimmedNewPass;
      if (currentPassword.trim()) {
        payload.currentPassword = currentPassword.trim();
      }
    }

    setIsSaving(true);
    const token = getAuthToken();
    const userId = editedUser._id || editedUser.id;

    try {
      const url = userId
        ? `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/update/${userId}`
        : `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/profile`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.message || 'Failed to save pharmacy profile');
      }

      const updatedData: PharmacyProfileData = resData.data || {
        ...editedUser,
        ...payload,
      };

      // 2. Update local storage session
      const currentSessionStr = localStorage.getItem('userSession');
      if (currentSessionStr) {
        try {
          const session = JSON.parse(currentSessionStr);
          session.user = {
            ...session.user,
            ...updatedData,
          };
          localStorage.setItem('userSession', JSON.stringify(session));
        } catch (e) {}
      }

      // 3. Dispatch event to update App navigation headers
      window.dispatchEvent(new Event('userSessionUpdated'));

      toast.success('Pharmacy profile successfully updated and saved in the database! ✨');
      onUpdate(updatedData);
      onClose();
    } catch (err: any) {
      console.error('Save pharmacy profile error:', err);
      toast.error(err.message || 'An error occurred while saving your pharmacy profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 sm:p-7">
        <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Gérer le Profil de la Pharmacie
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Mettez à jour les informations officielles enregistrées dans la base de données MediConnect.
                </DialogDescription>
              </div>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs hidden sm:inline-flex">
              Accréditation ONPC & MINSANTÉ
            </Badge>
          </div>
        </DialogHeader>

        {/* Profile Avatar & Header Banner */}
        <div className="pt-4 pb-2">
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <div className="relative group">
              <Avatar className="w-20 h-20 border-3 border-white dark:border-slate-800 shadow-md rounded-2xl overflow-hidden">
                <AvatarImage src={profilePicPreview} alt={editedUser.businessName || editedUser.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-tr from-emerald-600 to-teal-700 text-white font-bold text-2xl rounded-2xl">
                  {(editedUser.businessName || editedUser.name || 'P')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <label
                htmlFor="pharmacy-profile-pic-upload"
                className="absolute -bottom-1 -right-1 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl shadow-lg cursor-pointer transition-all hover:scale-105"
                title="Téléverser le logo ou la devanture"
              >
                <Camera className="w-3.5 h-3.5" />
                <input
                  id="pharmacy-profile-pic-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              </label>
            </div>

            <div className="space-y-1 text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editedUser.businessName || editedUser.name || 'Pharmacie Non Renseignée'}
                </h3>
                {editedUser.verificationStatus && (
                  <Badge className="bg-emerald-500 text-white text-[10px] py-0 px-1.5 flex items-center gap-1 font-semibold">
                    <ShieldCheck className="w-3 h-3" /> Vérifiée
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pharmacien Titulaire: <span className="font-semibold text-slate-700 dark:text-slate-200">{editedUser.name || '—'}</span>
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 pt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  {editedUser.city || 'Yaoundé'} {editedUser.district ? `(${editedUser.district})` : ''}
                </span>
                {editedUser.licenseNumber && (
                  <span className="flex items-center gap-1 font-mono text-[11px] bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    Licence: {editedUser.licenseNumber}
                  </span>
                )}
              </div>
            </div>

            {profilePicPreview && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemovePhoto}
                className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 h-8 self-center"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Supprimer
              </Button>
            )}
          </div>
        </div>

        {/* Tabbed Profile Navigation */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full mt-2">
          <TabsList className="grid grid-cols-5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl h-11 text-xs">
            <TabsTrigger value="general" className="rounded-xl font-medium gap-1 text-[11px] sm:text-xs">
              <Store className="w-3.5 h-3.5 hidden sm:inline" />
              Général
            </TabsTrigger>
            <TabsTrigger value="location" className="rounded-xl font-medium gap-1 text-[11px] sm:text-xs">
              <MapPin className="w-3.5 h-3.5 hidden sm:inline text-rose-500" />
              Adresse
            </TabsTrigger>
            <TabsTrigger value="regulatory" className="rounded-xl font-medium gap-1 text-[11px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5 hidden sm:inline text-emerald-500" />
              ONPC / Licence
            </TabsTrigger>
            <TabsTrigger value="hours" className="rounded-xl font-medium gap-1 text-[11px] sm:text-xs">
              <Clock className="w-3.5 h-3.5 hidden sm:inline text-amber-500" />
              Horaires & Garde
            </TabsTrigger>
            <TabsTrigger value="security" className="rounded-xl font-medium gap-1 text-[11px] sm:text-xs">
              <KeyRound className="w-3.5 h-3.5 hidden sm:inline text-indigo-500" />
              Sécurité
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: General & Identity */}
          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ph-business-name" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Nom Commercial de la Pharmacie *
                </Label>
                <Input
                  id="ph-business-name"
                  placeholder="ex: Grande Pharmacie du Centre"
                  value={editedUser.businessName || ''}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-pharmacist-name" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Pharmacien Titulaire / Responsable *
                </Label>
                <Input
                  id="ph-pharmacist-name"
                  placeholder="ex: Dr. Paul Biwole"
                  value={editedUser.name || ''}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="rounded-xl text-sm"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-email" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Email Professionnel *
                </Label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    id="ph-email"
                    type="email"
                    placeholder="contact@pharmacie.cm"
                    value={editedUser.email || ''}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="pl-9 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-phone" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Téléphone Principal (Officine) *
                </Label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    id="ph-phone"
                    placeholder="+237 6xx xx xx xx / 222 xx xx xx"
                    value={editedUser.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-9 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <div className="text-xs text-emerald-900 dark:text-emerald-200">
                <p className="font-semibold">Visibilité Publique sur MediConnect :</p>
                <p className="text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                  Ces coordonnées sont utilisées par les patients pour contacter votre officine lors des recherches de médicaments et demandes de disponibilité.
                </p>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Location & Address */}
          <TabsContent value="location" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="ph-address" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Adresse Physique Complète / Repère *
                </Label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    id="ph-address"
                    placeholder="ex: Avenue Kennedy, face Immeuble Hajal, Centre-Ville"
                    value={editedUser.businessAddress || editedUser.address || ''}
                    onChange={(e) => {
                      handleInputChange('businessAddress', e.target.value);
                      handleInputChange('address', e.target.value);
                    }}
                    className="pl-9 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-city" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Ville / Région *
                </Label>
                <select
                  id="ph-city"
                  aria-label="Sélectionnez la ville"
                  value={editedUser.city || 'Yaoundé'}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="w-full text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {CAMEROON_MAJOR_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Autre">Autre Localité</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-district" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Quartier / Arrondissement
                </Label>
                <Input
                  id="ph-district"
                  placeholder="ex: Bastos, Akwa, Omnisports, Bonanjo..."
                  value={editedUser.district || ''}
                  onChange={(e) => handleInputChange('district', e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>

              {/* GPS Coordinates */}
              <div className="space-y-1.5">
                <Label htmlFor="ph-lat" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Latitude GPS
                </Label>
                <Input
                  id="ph-lat"
                  type="number"
                  step="any"
                  placeholder="ex: 3.8480"
                  value={editedUser.latitude !== undefined ? editedUser.latitude : ''}
                  onChange={(e) => handleInputChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="rounded-xl text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-lng" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Longitude GPS
                </Label>
                <Input
                  id="ph-lng"
                  type="number"
                  step="any"
                  placeholder="ex: 11.5021"
                  value={editedUser.longitude !== undefined ? editedUser.longitude : ''}
                  onChange={(e) => handleInputChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60">
              <div className="flex items-center gap-2.5">
                <Navigation className="w-4 h-4 text-blue-600" />
                <div className="text-xs text-blue-900 dark:text-blue-200">
                  <p className="font-semibold">Localisation Géographique Instantanée</p>
                  <p className="text-blue-700/80 dark:text-blue-300/80 text-[11px]">
                    Permet aux patients de calculer précisément la distance en kilomètres jusqu'à votre officine.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLocating}
                onClick={handleDetectLocation}
                className="bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700 rounded-xl text-xs h-8"
              >
                {isLocating ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Navigation className="w-3.5 h-3.5 mr-1" />}
                Détecter Ma Position
              </Button>
            </div>
          </TabsContent>

          {/* TAB 3: Regulatory & Licensing */}
          <TabsContent value="regulatory" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ph-license" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Numéro d'Agrément MINSANTÉ *
                </Label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <Input
                    id="ph-license"
                    placeholder="ex: LIC-CM-2024-089"
                    value={editedUser.licenseNumber || ''}
                    onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                    className="pl-9 rounded-xl text-sm font-mono uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Licence officielle d'exploitation délivrée par le Ministère de la Santé Publique.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-onpc" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Numéro d'Inscription ONPC (Ordre des Pharmaciens) *
                </Label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 absolute left-3 top-2.5 text-emerald-500" />
                  <Input
                    id="ph-onpc"
                    placeholder="ex: ONPC-CM-2024-0412"
                    value={editedUser.onpcNumber || ''}
                    onChange={(e) => handleInputChange('onpcNumber', e.target.value)}
                    className="pl-9 rounded-xl text-sm font-mono uppercase"
                  />
                </div>
                <p className="text-[11px] text-slate-400">Matricule à l'Ordre National des Pharmaciens du Cameroun.</p>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="ph-roster-zone" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Zone Roster / Secteur de Garde Sanitaire
                </Label>
                <Input
                  id="ph-roster-zone"
                  placeholder="ex: Secteur Sanitaire Centre 1 - Yaoundé"
                  value={editedUser.dutyRosterZone || ''}
                  onChange={(e) => handleInputChange('dutyRosterZone', e.target.value)}
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Statut de Conformité Réglementaire
                </h4>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Badge className={editedUser.verificationStatus ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}>
                  {editedUser.verificationStatus ? "Officine Enregistrée & Active" : "En cours de validation ONPC"}
                </Badge>
                <span className="text-slate-500">
                  Vérifié automatiquement avec le répertoire national des officines autorisées.
                </span>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: Hours & Duty Service */}
          <TabsContent value="hours" className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ph-open-time" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Heure d'Ouverture Habituelle
                </Label>
                <Input
                  id="ph-open-time"
                  type="time"
                  value={editedUser.operatingHours?.openingTime || '08:00'}
                  onChange={(e) =>
                    setEditedUser((prev) => ({
                      ...prev,
                      operatingHours: {
                        ...prev.operatingHours,
                        openingTime: e.target.value,
                      },
                    }))
                  }
                  className="rounded-xl text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ph-close-time" className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Heure de Fermeture Habituelle
                </Label>
                <Input
                  id="ph-close-time"
                  type="time"
                  value={editedUser.operatingHours?.closingTime || '21:00'}
                  onChange={(e) =>
                    setEditedUser((prev) => ({
                      ...prev,
                      operatingHours: {
                        ...prev.operatingHours,
                        closingTime: e.target.value,
                      },
                    }))
                  }
                  className="rounded-xl text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
              <input
                type="checkbox"
                checked={!!editedUser.operatingHours?.is24Hours}
                onChange={(e) =>
                  setEditedUser((prev) => ({
                    ...prev,
                    operatingHours: {
                      ...prev.operatingHours,
                      is24Hours: e.target.checked,
                    },
                  }))
                }
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Service 24h/24 Continu</p>
                <p className="text-[11px] text-slate-500">L'officine est ouverte sans interruption 7j/7.</p>
              </div>
            </label>

            {/* Night Duty / Garde Emergency Section */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Configuration Service de Garde (Nuit & Week-end)
                  </h4>
                </div>
                <Badge variant="outline" className="text-indigo-700 dark:text-indigo-300 border-indigo-300 text-[10px]">
                  Guichet d'Urgence
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="ph-oncall-phone" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Numéro d'Urgence / Ligne Directe de Nuit
                  </Label>
                  <Input
                    id="ph-oncall-phone"
                    placeholder="Ligne de nuit joignable"
                    value={editedUser.dutySchedule?.nightDuty?.onCallPhone || ''}
                    onChange={(e) =>
                      setEditedUser((prev) => ({
                        ...prev,
                        dutySchedule: {
                          ...prev.dutySchedule,
                          nightDuty: {
                            ...prev.dutySchedule?.nightDuty,
                            onCallPhone: e.target.value,
                          },
                        },
                      }))
                    }
                    className="rounded-xl text-xs bg-white dark:bg-slate-900"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="ph-instructions" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Consignes d'accès nuit
                  </Label>
                  <Input
                    id="ph-instructions"
                    placeholder="ex: Sonnette au guichet de nuit..."
                    value={editedUser.dutySchedule?.nightDuty?.emergencyInstructions || ''}
                    onChange={(e) =>
                      setEditedUser((prev) => ({
                        ...prev,
                        dutySchedule: {
                          ...prev.dutySchedule,
                          nightDuty: {
                            ...prev.dutySchedule?.nightDuty,
                            emergencyInstructions: e.target.value,
                          },
                        },
                      }))
                    }
                    className="rounded-xl text-xs bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: Security */}
          <TabsContent value="security" className="space-y-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Mot de Passe Sécurisé</h4>
                  <p className="text-[11px] text-slate-500">
                    Modifiez le mot de passe de connexion pour sécuriser l'accès à votre tableau de bord.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingPassword(!isChangingPassword)}
                  className="rounded-xl text-xs h-8 border-slate-300 dark:border-slate-600"
                >
                  {isChangingPassword ? 'Annuler' : 'Changer le Mot de Passe'}
                </Button>
              </div>

              {isChangingPassword && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <div className="space-y-1">
                    <Label htmlFor="ph-current-pwd" className="text-xs font-medium">Mot de passe actuel</Label>
                    <div className="relative">
                      <Input
                        id="ph-current-pwd"
                        type={showCurrentPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="rounded-xl text-sm pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="ph-new-pwd" className="text-xs font-medium">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="ph-new-pwd"
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Min. 6 caractères"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="rounded-xl text-sm pr-9"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="ph-confirm-pwd" className="text-xs font-medium">Confirmer le nouveau mot de passe</Label>
                      <Input
                        id="ph-confirm-pwd"
                        type="password"
                        placeholder="Retapez le mot de passe"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl text-xs h-9 px-4"
          >
            Annuler
          </Button>

          <Button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-9 px-5 shadow-sm"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                Enregistrement en base...
              </>
            ) : (
              'Enregistrer les Modifications'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
