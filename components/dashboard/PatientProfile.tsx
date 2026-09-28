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
  DialogClose,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Camera,
  Trash2,
  KeyRound,
  User as UserIcon,
  HeartPulse,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  ShieldCheck,
  Shield,
  MapPin,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';

export interface UserProfileData {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  profilePicture?: string;
  profileImage?: string;
  dateOfBirth?: string;
  emergencyContact?: string;
  bloodGroup?: string;
  allergies?: string[] | string;
  chronicDiseases?: string[] | string;
  userType?: string;
  csuIdentifier?: string;
  csuInsurance?: {
    matricule?: string;
    beneficiaryCategory?: string;
    coverageRate?: number;
    affiliatedFacility?: string;
    status?: string;
  };
}

interface PatientProfileProps {
  user: UserProfileData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedUser: UserProfileData) => void;
}

export function PatientProfile({ user, isOpen, onClose, onUpdate }: PatientProfileProps) {
  const [editedUser, setEditedUser] = useState<UserProfileData>(user);
  const [profilePicPreview, setProfilePicPreview] = useState<string | undefined>(
    user.profilePicture || user.profileImage
  );
  const [activeTab, setActiveTab] = useState<'general' | 'health' | 'csu' | 'security'>('general');

  // Security / Password fields
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [isSaving, setIsSaving] = useState(false);

  // Sync state when user prop changes or dialog opens
  useEffect(() => {
    if (isOpen) {
      setEditedUser(user);
      setProfilePicPreview(user.profilePicture || user.profileImage);
      setIsChangingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setActiveTab('general');
    }
  }, [user, isOpen]);

  const handleInputChange = (field: keyof UserProfileData, value: any) => {
    setEditedUser((prev) => ({ ...prev, [field]: value }));
  };

  // Compress image on canvas to max 400x400 to keep DB lightweight and performant
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
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
            resolve(canvas.toDataURL('image/jpeg', 0.82));
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
        toast.success('Photo preview ready. Click "Save Changes" to save to database.');
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
    // Basic validation
    if (!editedUser.name || !editedUser.name.trim()) {
      toast.error('Name cannot be empty');
      setActiveTab('general');
      return;
    }
    if (!editedUser.email || !editedUser.email.trim()) {
      toast.error('Email cannot be empty');
      setActiveTab('general');
      return;
    }

    const payload: any = {
      name: editedUser.name.trim(),
      email: editedUser.email.trim().toLowerCase(),
      phone: editedUser.phone ? editedUser.phone.trim() : '',
      address: editedUser.address ? editedUser.address.trim() : '',
      profilePicture: editedUser.profilePicture || editedUser.profileImage || '',
      dateOfBirth: editedUser.dateOfBirth || null,
      emergencyContact: editedUser.emergencyContact ? editedUser.emergencyContact.trim() : '',
      bloodGroup: editedUser.bloodGroup || '',
      allergies: editedUser.allergies || [],
      chronicDiseases: editedUser.chronicDiseases || [],
      csuIdentifier: editedUser.csuIdentifier || (editedUser.csuInsurance?.matricule || ''),
      csuInsurance: editedUser.csuInsurance || (editedUser.csuIdentifier ? {
        matricule: editedUser.csuIdentifier,
        beneficiaryCategory: 'Régime Général (Assurés & Familles)',
        coverageRate: 70,
        affiliatedFacility: 'Hôpital Central de Yaoundé (HCY)',
        status: 'ACTIVE',
      } : undefined),
    };

    // Password validation ONLY if the user explicitly opted to change their password
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
      // 1. Send update to database
      const url = userId
        ? `${import.meta.env.VITE_API_URL}/users/update/${userId}`
        : `${import.meta.env.VITE_API_URL}/users/profile`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to update profile in database');
      }

      const updatedData: UserProfileData = {
        ...editedUser,
        ...(result.data || {}),
        id: result.data?._id || userId,
      };

      // 2. Synchronize localStorage session so navigation bar, avatar, and sidebar update instantly
      const session = localStorage.getItem('userSession');
      if (session) {
        try {
          const parsed = JSON.parse(session);
          parsed.user = {
            ...parsed.user,
            ...updatedData,
          };
          localStorage.setItem('userSession', JSON.stringify(parsed));
          window.dispatchEvent(new Event('userSessionUpdated'));
        } catch (e) {
          console.error('Session sync error:', e);
        }
      }

      // 3. Notify parent dashboard
      onUpdate(updatedData);
      toast.success('Profile and database updated successfully!');
      onClose();
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <UserIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle className="text-xl font-extrabold text-slate-900 tracking-tight">
                Manage Your Profile
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm font-medium text-slate-500">
                Update your personal information, photo, and security settings.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Profile Picture Header Section */}
        <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-blue-50/70 via-slate-50 to-indigo-50/70 border border-slate-200/80 my-2">
          <div className="relative group shrink-0">
            <Avatar className="w-20 h-20 border-4 border-white shadow-md">
              <AvatarImage src={profilePicPreview} alt={editedUser.name} className="object-cover" />
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-bold text-2xl">
                {editedUser.name?.[0]?.toUpperCase() || 'P'}
              </AvatarFallback>
            </Avatar>
            <label
              htmlFor="profile-pic-upload"
              className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full cursor-pointer shadow-md transition-transform hover:scale-110 active:scale-95"
              title="Change profile picture"
            >
              <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
              <input
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleProfilePicChange}
              />
            </label>
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            <h4 className="font-bold text-slate-900 text-base leading-tight truncate">
              {editedUser.name || 'User'}
            </h4>
            <p className="text-xs font-medium text-slate-500 truncate mt-0.5">
              {editedUser.email || 'No email set'}
            </p>
            <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
              <label
                htmlFor="profile-pic-upload"
                className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50/80 border border-blue-200 px-3 py-1 rounded-xl cursor-pointer shadow-2xs transition-all"
              >
                Change Photo
              </label>
              {profilePicPreview && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl shadow-2xs transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
          <TabsList className="grid grid-cols-4 bg-slate-100/80 p-1 rounded-2xl mb-4">
            <TabsTrigger
              value="general"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs py-2"
            >
              <UserIcon className="w-3.5 h-3.5 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs py-2"
            >
              <HeartPulse className="w-3.5 h-3.5 mr-1" />
              Health
            </TabsTrigger>
            <TabsTrigger
              value="csu"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-xs py-2"
            >
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              CSU Card
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-xs py-2"
            >
              <KeyRound className="w-3.5 h-3.5 mr-1" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: General Info */}
          <TabsContent value="general" className="space-y-3.5 focus-visible:outline-hidden mt-0">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-blue-600" />
                Full Name
              </Label>
              <Input
                id="name"
                value={editedUser.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={editedUser.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="patient@gmail.com"
                className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="phone" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                Phone Number
              </Label>
              <Input
                id="phone"
                type="tel"
                value={editedUser.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+237 6XX XX XX XX"
                className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                Residential Address / City
              </Label>
              <Input
                id="address"
                value={editedUser.address || ''}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Bastos, Yaoundé, Cameroon"
                className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-600"
              />
            </div>
          </TabsContent>

          {/* TAB 2: Health Info */}
          <TabsContent value="health" className="space-y-3.5 focus-visible:outline-hidden mt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="bloodGroup" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Blood Group
                </Label>
                <select
                  id="bloodGroup"
                  value={editedUser.bloodGroup || ''}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-medium text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                >
                  <option value="">Select Blood Group</option>
                  <option value="O+">O+ (Universal Donor Rh+)</option>
                  <option value="O-">O- (Universal Donor Rh-)</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+ (Universal Recipient)</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="dateOfBirth" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  Date of Birth
                </Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={
                    editedUser.dateOfBirth
                      ? new Date(editedUser.dateOfBirth).toISOString().split('T')[0]
                      : ''
                  }
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="emergencyContact" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Emergency Contact (Name & Phone)
              </Label>
              <Input
                id="emergencyContact"
                value={editedUser.emergencyContact || ''}
                onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                placeholder="Parent/Spouse: +237 6XX XX XX XX"
                className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="allergies" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Known Drug Allergies (Comma separated)
              </Label>
              <Input
                id="allergies"
                value={
                  Array.isArray(editedUser.allergies)
                    ? editedUser.allergies.join(', ')
                    : editedUser.allergies || ''
                }
                onChange={(e) =>
                  handleInputChange(
                    'allergies',
                    e.target.value.split(',').map((s) => s.trim())
                  )
                }
                placeholder="E.g., Penicillin, Aspirin, Sulfa drugs"
                className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white"
              />
            </div>
          </TabsContent>

          {/* TAB: Couverture Santé Universelle (CSU-CM) */}
          <TabsContent value="csu" className="space-y-4 focus-visible:outline-hidden mt-0">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900 to-teal-900 text-white shadow-md relative overflow-hidden border border-emerald-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-yellow-300" />
                  <span className="font-bold text-sm tracking-wide">CSU-CM • MINSANTÉ</span>
                </div>
                <Badge className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  {editedUser.csuIdentifier || editedUser.csuInsurance?.matricule ? 'Card Linked' : 'Not Linked'}
                </Badge>
              </div>
              <p className="text-xs text-emerald-100 leading-relaxed">
                Your Universal Health Coverage card gives you direct third-party payment discounts at all accredited pharmacies in Cameroon.
              </p>
              {editedUser.csuIdentifier || editedUser.csuInsurance?.matricule ? (
                <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-emerald-300 uppercase block">Matricule CSU</span>
                    <span className="font-mono font-bold text-yellow-300 tracking-wider">
                      {editedUser.csuIdentifier || editedUser.csuInsurance?.matricule}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-emerald-300 uppercase block">Prise en charge</span>
                    <span className="font-bold text-white">
                      {editedUser.csuInsurance?.coverageRate || 70}%
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-1">
              <Label htmlFor="csu-matricule-input" className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" />
                CSU Matricule (Registration Number)
              </Label>
              <Input
                id="csu-matricule-input"
                value={editedUser.csuIdentifier || editedUser.csuInsurance?.matricule || ''}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setEditedUser((prev) => ({
                    ...prev,
                    csuIdentifier: val,
                    csuInsurance: {
                      ...prev.csuInsurance,
                      matricule: val,
                      beneficiaryCategory: prev.csuInsurance?.beneficiaryCategory || 'Régime Général (Assurés & Familles)',
                      coverageRate: prev.csuInsurance?.coverageRate || 70,
                      affiliatedFacility: prev.csuInsurance?.affiliatedFacility || 'Hôpital Central de Yaoundé (HCY)',
                      status: 'ACTIVE',
                    },
                  }));
                }}
                placeholder="E.g., CM-CSU-2026-98421"
                className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-mono font-bold text-sm focus-visible:bg-white"
              />
              <p className="text-[11px] text-slate-500 mt-0.5">
                Leave empty if you do not have a CSU-CM registration number yet.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="csu-cat-select" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Beneficiary Category (Catégorie Prise en Charge)
              </Label>
              <select
                id="csu-cat-select"
                value={editedUser.csuInsurance?.beneficiaryCategory || 'Régime Général (Assurés & Familles)'}
                onChange={(e) => {
                  const val = e.target.value;
                  const rate = val.includes('Femmes') || val.includes('Enfants') || val.includes('Indigents') ? 100 : val.includes('Hémodialyse') ? 95 : 70;
                  setEditedUser((prev) => ({
                    ...prev,
                    csuInsurance: {
                      ...prev.csuInsurance,
                      matricule: prev.csuIdentifier || prev.csuInsurance?.matricule || '',
                      beneficiaryCategory: val,
                      coverageRate: rate,
                      affiliatedFacility: prev.csuInsurance?.affiliatedFacility || 'Hôpital Central de Yaoundé (HCY)',
                      status: 'ACTIVE',
                    },
                  }));
                }}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Régime Général (Assurés & Familles)">Régime Général - Travailleurs & Familles (70%)</option>
                <option value="Femmes Enceintes (Consultations & Accouchement)">Femmes Enceintes - Consultations & Accouchement (100% Gratuit)</option>
                <option value="Enfants de 0 à 5 ans (Pédiatrie & Paludisme)">Enfants de 0 à 5 ans - Soins pédiatriques (100% Gratuit)</option>
                <option value="Hémodialyse & Maladies Chroniques">Hémodialyse & Maladies Chroniques (95% Subventionné)</option>
                <option value="Indigents & Personnes Vulnérables">Indigents & Personnes Vulnérables (100% Prise en charge)</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="csu-facility-select" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Affiliated Health Facility (Formation Sanitaire)
              </Label>
              <select
                id="csu-facility-select"
                value={editedUser.csuInsurance?.affiliatedFacility || 'Hôpital Central de Yaoundé (HCY)'}
                onChange={(e) => {
                  const val = e.target.value;
                  setEditedUser((prev) => ({
                    ...prev,
                    csuInsurance: {
                      ...prev.csuInsurance,
                      matricule: prev.csuIdentifier || prev.csuInsurance?.matricule || '',
                      affiliatedFacility: val,
                    },
                  }));
                }}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm bg-slate-50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Hôpital Central de Yaoundé (HCY)">Hôpital Central de Yaoundé (HCY)</option>
                <option value="Hôpital Général de Yaoundé (HGY)">Hôpital Général de Yaoundé (HGY)</option>
                <option value="Hôpital Laquintinie de Douala (HLD)">Hôpital Laquintinie de Douala (HLD)</option>
                <option value="Centre Médical d’Arrondissement (CMA) d’Ekounou - Yaoundé IV">CMA d’Ekounou - Yaoundé IV</option>
                <option value="CMA de Nkoldongo - Yaoundé IV">CMA de Nkoldongo - Yaoundé IV</option>
                <option value="Hôpital de District de Biyem-Assi - Yaoundé VI">Hôpital de District de Biyem-Assi</option>
                <option value="Hôpital de District de Nylon - Douala">Hôpital de District de Nylon - Douala</option>
              </select>
            </div>
          </TabsContent>

          {/* TAB 3: Security & Password */}
          <TabsContent value="security" className="space-y-4 focus-visible:outline-hidden mt-0">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Account Password</h4>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {isChangingPassword
                      ? 'Password change is active. Enter your new password below.'
                      : 'Password modification is optional. Your password will stay the same unless changed.'}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant={isChangingPassword ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  if (isChangingPassword) {
                    setNewPassword('');
                    setConfirmPassword('');
                    setCurrentPassword('');
                  }
                }}
                className={`rounded-xl text-xs font-bold shrink-0 transition-all ${
                  isChangingPassword
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
              </Button>
            </div>

            {isChangingPassword ? (
              <div className="space-y-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                <div className="space-y-1">
                  <Label htmlFor="currentPassword" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Current Password (Optional verification)
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm pr-10 focus-visible:bg-white"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="newPassword" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    New Password (Min. 6 characters)
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm pr-10 focus-visible:bg-white"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Confirm New Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type new password"
                    className="h-11 rounded-xl bg-slate-50 border-slate-300 text-slate-900 font-medium text-sm focus-visible:bg-white"
                    autoComplete="new-password"
                  />
                  {newPassword && confirmPassword && (
                    <p className={`text-xs font-bold mt-1 ${newPassword === confirmPassword ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-900 text-xs font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Password change is not enabled. Your current password remains active and untouched.</span>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="mt-5 gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              className="rounded-xl font-bold text-slate-700 hover:bg-slate-100"
              disabled={isSaving}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-md transition-all flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                <span>Save Changes</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}