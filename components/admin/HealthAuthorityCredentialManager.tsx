import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { toast } from 'sonner';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  Building2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Save,
  RotateCcw,
  Sparkles,
  Phone,
  ShieldAlert,
  Fingerprint
} from 'lucide-react';

export function HealthAuthorityCredentialManager() {
  const [authorityUser, setAuthorityUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organization: 'MINSANTE',
    department: '',
    phone: '',
    isMfaRequired: false,
    mfaCode: '237237'
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const getAdminToken = (): string | null => {
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsed = JSON.parse(adminAuth);
        if (parsed.token) return parsed.token;
      } catch (e) {}
    }
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.token) return parsed.token;
      } catch (e) {}
    }
    return null;
  };

  const fetchCredentials = async (showToast = false) => {
    setIsLoading(true);
    try {
      const token = getAdminToken();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/users/authority/credentials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Impossible de récupérer les identifiants');
      }

      setAuthorityUser(data.data);
      setFormData({
        name: data.data.name || '',
        email: data.data.email || '',
        password: '',
        confirmPassword: '',
        organization: data.data.organization || 'MINSANTE',
        department: data.data.institutionDepartment || '',
        phone: data.data.phone || '',
        isMfaRequired: Boolean(data.data.isMfaRequired),
        mfaCode: data.data.mfaCode || '237237'
      });

      if (showToast) {
        toast.success('Identifiants actualisés depuis la base de données');
      }
    } catch (err: any) {
      console.error('Error fetching authority credentials:', err);
      toast.error(err.message || 'Erreur lors du chargement des identifiants');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email.trim()) {
      toast.error('L\'adresse email est obligatoire.');
      return;
    }

    if (formData.password) {
      if (formData.password.length < 6) {
        toast.error('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        toast.error('Les deux mots de passe ne correspondent pas.');
        return;
      }
    }

    setIsSaving(true);
    try {
      const token = getAdminToken();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/users/authority/credentials`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          name: formData.name.trim(),
          password: formData.password ? formData.password.trim() : undefined,
          organization: formData.organization,
          department: formData.department.trim(),
          phone: formData.phone.trim(),
          isMfaRequired: formData.isMfaRequired,
          mfaCode: formData.mfaCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la mise à jour des identifiants');
      }

      toast.success('Identifiants Régulateur enregistrés avec succès dans MongoDB !');
      setAuthorityUser(data.data);
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err: any) {
      console.error('Save authority credentials error:', err);
      toast.error(err.message || 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    setIsResetting(true);
    try {
      const token = getAdminToken();
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const res = await fetch(`${apiBase}/users/authority/credentials/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Erreur lors de la réinitialisation');
      }

      toast.success(data.message || 'Identifiants réinitialisés (authority@minsante.cm / Minsante2026!)');
      setAuthorityUser(data.data);
      setFormData({
        name: data.data.name || '',
        email: data.data.email || '',
        password: '',
        confirmPassword: '',
        organization: data.data.organization || 'MINSANTE',
        department: data.data.institutionDepartment || '',
        phone: data.data.phone || '',
        isMfaRequired: Boolean(data.data.isMfaRequired),
        mfaCode: data.data.mfaCode || '237237'
      });
      setShowResetConfirm(false);
    } catch (err: any) {
      toast.error(err.message || 'Échec de la réinitialisation');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs uppercase font-bold tracking-wider px-3 py-1">
                <ShieldCheck className="w-3.5 h-3.5 mr-1.5 inline" />
                Sécurité & Habilitations Institutionnelles
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-semibold">
                Portail MINSANTÉ / ONPC
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Gestion des Identifiants Autorité Sanitaire
            </h2>
            <p className="text-sm text-emerald-100/80 mt-1 max-w-2xl">
              Configurez et gérez l'identifiant unique officiel permettant d'accéder au Portail Régulateur National MINSANTÉ. Toutes les modifications d'email et de mot de passe sont enregistrées directement dans la base de données.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCredentials(true)}
              disabled={isLoading}
              className="bg-emerald-950/60 border-emerald-400/40 text-emerald-200 hover:text-white hover:bg-emerald-900 rounded-xl text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Actualiser</span>
            </Button>
            <Button
              size="sm"
              onClick={() => window.open('/minsante', '_blank')}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md gap-1.5"
            >
              <span>Tester Accès Portail</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Security Rule Alert */}
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
          <p className="font-semibold text-sm mb-1">Verrouillage de Sécurité Régulateur</p>
          Seul le compte défini ci-dessous avec le rôle institutionnel <code className="bg-blue-100 dark:bg-blue-900/60 px-1 py-0.5 rounded font-mono font-bold text-blue-950 dark:text-blue-100">HEALTH_AUTHORITY</code> peut déverrouiller le Portail Régulateur MINSANTÉ. Les comptes patients et pharmaciens standards ne peuvent plus y accéder.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Credentials Snapshot */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-emerald-600" />
                  Identifiant Actuel en Base
                </CardTitle>
                <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 text-[10px] font-bold">
                  {authorityUser?.status || 'ACTIF'}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Informations enregistrées dans MongoDB
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-5 space-y-4">
              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Email de Connexion Officiel
                </Label>
                <div className="mt-1 flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 select-all">
                  <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{authorityUser?.email || 'Chargement...'}</span>
                </div>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Nom du Représentant
                </Label>
                <div className="mt-1 flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
                  <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{authorityUser?.name || 'MINSANTÉ Régulateur'}</span>
                </div>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Institution & Département
                </Label>
                <div className="mt-1 flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{authorityUser?.institutionDepartment || authorityUser?.organization || 'MINSANTÉ Cameroun'}</span>
                </div>
              </div>

              <div>
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Authentification à Deux Facteurs (2FA)
                </Label>
                <div className="mt-1 flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="flex items-center gap-2">
                    <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
                    <span>Exigence 2FA:</span>
                  </span>
                  <Badge variant={authorityUser?.isMfaRequired ? 'default' : 'secondary'} className="text-[10px]">
                    {authorityUser?.isMfaRequired ? 'Activée (OTP: 237237)' : 'Désactivée (Mot de passe direct)'}
                  </Badge>
                </div>
              </div>

              {authorityUser?.lastLogin && (
                <div className="pt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>Dernière connexion:</span>
                  <span className="font-mono">{new Date(authorityUser.lastLogin).toLocaleString('fr-FR')}</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 p-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResetConfirm(true)}
                className="w-full text-xs text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Réinitialiser aux Identifiants par Défaut
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Column: Edit & Update Form */}
        <div className="lg:col-span-2">
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-600" />
                Modifier l'Email et le Mot de Passe de l'Autorité
              </CardTitle>
              <CardDescription className="text-xs">
                Modifiez les accès du régulateur ci-dessous. Dès l'enregistrement, ces nouveaux identifiants seront requis pour déverrouiller le portail.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleUpdate}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <Label htmlFor="auth-email" className="text-xs font-semibold">
                      Adresse Email Régulateur <span className="text-rose-500">*</span>
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="auth-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="authority@minsante.cm"
                        required
                        className="rounded-xl pl-9 text-xs"
                      />
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <Label htmlFor="auth-name" className="text-xs font-semibold">
                      Nom / Titre du Responsable
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="auth-name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Dr. Inspecteur Général (MINSANTÉ/ONPC)"
                        className="rounded-xl pl-9 text-xs"
                      />
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Organization */}
                  <div>
                    <Label className="text-xs font-semibold">Organisation Officielle</Label>
                    <Select
                      value={formData.organization}
                      onValueChange={(val) => setFormData({ ...formData, organization: val })}
                    >
                      <SelectTrigger className="rounded-xl text-xs mt-1">
                        <SelectValue placeholder="Sélectionner l'organisation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MINSANTE">MINSANTÉ Cameroun</SelectItem>
                        <SelectItem value="ONPC">Ordre National des Pharmaciens (ONPC)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="auth-phone" className="text-xs font-semibold">
                      Numéro de Téléphone Institutionnel
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="auth-phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+237 222 22 22 22"
                        className="rounded-xl pl-9 text-xs"
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                </div>

                {/* Department */}
                <div>
                  <Label htmlFor="auth-dept" className="text-xs font-semibold">
                    Direction / Service Ministériel
                  </Label>
                  <Input
                    id="auth-dept"
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="Coordination Nationale Conjointe MINSANTÉ / ONPC"
                    className="rounded-xl text-xs mt-1"
                  />
                </div>

                {/* Password Fields */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Changement du Mot de Passe Sécurisé
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">
                      (Laisser vide pour conserver le mot de passe actuel)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="new-password" className="text-xs font-semibold">
                        Nouveau Mot de Passe
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••••••"
                          className="rounded-xl pr-9 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="confirm-password" className="text-xs font-semibold">
                        Confirmer le Nouveau Mot de Passe
                      </Label>
                      <div className="relative mt-1">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                          placeholder="••••••••••••"
                          className="rounded-xl pr-9 text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {formData.password && (
                    <div className="flex items-center gap-2 text-xs">
                      {formData.password === formData.confirmPassword ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Les mots de passe correspondent
                        </span>
                      ) : (
                        <span className="text-rose-500 flex items-center gap-1 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Les mots de passe ne correspondent pas encore
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 2FA Option */}
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="mfa-toggle" className="text-xs font-semibold cursor-pointer">
                      Activer le Code de Validation 2FA (Double Facteur)
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Si désactivé, le régulateur se connecte directement avec Email et Mot de passe sans étape OTP.
                    </p>
                  </div>
                  <Switch
                    id="mfa-toggle"
                    checked={formData.isMfaRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isMfaRequired: checked })}
                  />
                </div>
              </CardContent>

              <CardFooter className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchCredentials()}
                  className="text-xs text-muted-foreground"
                >
                  Annuler les modifications
                </Button>

                <Button
                  type="submit"
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md gap-2"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer dans la Base de Données</span>
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog for Reset */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent className="max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
              <RotateCcw className="w-5 h-5" />
              Réinitialiser les Identifiants ?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 dark:text-slate-300 mt-2">
              Cette action restaurera l'adresse email officielle à <strong>authority@minsante.cm</strong> et le mot de passe standard à <strong>Minsante2026!</strong>.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowResetConfirm(false)}
              className="text-xs rounded-xl"
            >
              Annuler
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isResetting}
              onClick={handleResetToDefault}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
            >
              {isResetting ? 'Réinitialisation...' : 'Confirmer la Réinitialisation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
