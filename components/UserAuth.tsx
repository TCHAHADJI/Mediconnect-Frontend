import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { ArrowLeft, Eye, EyeOff, User, Building2, Shield, Lock, ShieldCheck, ArrowRight, Store, MapPin } from 'lucide-react';

interface UserAuthProps {
  onLogin: (type: 'patient' | 'pharmacy' | 'admin' | 'health_authority', userData: any) => void;
  defaultUserType?: 'patient' | 'pharmacy' | 'admin' | 'health_authority' | null;
  initialMode?: 'login' | 'signup';
  lockUserType?: boolean;
  onBack: () => void;
}

export function UserAuth({ 
  onLogin, 
  defaultUserType = 'patient', 
  initialMode = 'login',
  lockUserType = true,
  onBack 
}: UserAuthProps) {
  const [activeTab, setActiveTab] = useState<'patient' | 'pharmacy' | 'admin' | 'health_authority'>(defaultUserType || 'patient');
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize activeTab and isLogin if props change
  React.useEffect(() => {
    if (defaultUserType) {
      setActiveTab(defaultUserType);
    }
  }, [defaultUserType]);

  React.useEffect(() => {
    setIsLogin(initialMode !== 'signup');
  }, [initialMode]);

  const initialFormData = {
    // Patient fields
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    address: '',
    
    // Pharmacy fields
    businessName: '',
    licenseNumber: '',
    ownerName: '',
    businessAddress: '',
    latitude: null as number | null,
    longitude: null as number | null,
    operatingHours: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const [isMfaStep, setIsMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaInfo, setMfaInfo] = useState<{ email?: string; institution?: string; department?: string; message?: string } | null>(null);

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          mfaCode: mfaCode.trim()
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Code 2FA invalide.');
        setIsLoading(false);
        return;
      }

      onLogin('health_authority', data);
      toast.success(`Session Régulatrice ${data.data?.user?.organization || 'MINSANTÉ'} validée avec succès !`);
      setIsMfaStep(false);
      setMfaCode('');
      setFormData(initialFormData);
    } catch (error: any) {
      console.error('MFA submit error:', error);
      toast.error('Erreur réseau lors de la validation 2FA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFetchLocation = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Prevent any default form submission behavior
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setIsLoading(true);
    toast.info('Fetching your location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData(prev => ({
          ...prev,
          latitude: latitude,
          longitude: longitude,
          businessAddress: `Lat: ${latitude.toFixed(6)}, Lng: ${longitude.toFixed(6)}`
        }));
        toast.success('Location fetched successfully!');
        setIsLoading(false);
      },
      (error) => {
        toast.error(`Error fetching location: ${error.message}`);
        setIsLoading(false);
      }
    );
  };

  const parseOperatingHours = (hoursString: string) => {
    if (!hoursString.trim()) {
      return {}; // Return empty object if no hours are provided
    }
    const hoursObject: { [key: string]: { open: string; close: string } } = {};
    const dayRanges = hoursString.split(',');

    try {
      dayRanges.forEach(range => {
        const [days, times] = range.trim().split(/\s+/);
        const [open, close] = times.split('-');
        const dayKeys = days.split('-').map(d => d.trim().toLowerCase());
        
        // This is a simplified parser. For production, a more robust one is needed.
        // For now, it assumes a format like "Mon-Fri 9am-6pm, Sat 9am-1pm"
        hoursObject[dayKeys[0]] = { open, close };
      });
      return hoursObject;
    } catch (e) {
      toast.error("Invalid format for operating hours. Please use a format like 'Mon-Fri 9am-6pm, Sat 9am-1pm'.");
      return null; // Indicates a parsing error
    }
  };

  const validateForm = () => {
    const { email, password, confirmPassword, name, businessName, ownerName, licenseNumber } = formData;

    if (!email) {
      toast.error('Email is required.');
      return false;
    }
    if (!password) {
      toast.error('Password is required.');
      return false;
    }

    if (!isLogin) {
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return false;
      }

      if (activeTab === 'patient' && !name) {
        toast.error('Full Name is required.');
        return false;
      }

      if (activeTab === 'pharmacy') {
        if (!businessName) { toast.error('Pharmacy Name is required.'); return false; }
        if (!ownerName) { toast.error('Owner/Pharmacist Name is required.'); return false; }
        if (!licenseNumber) { toast.error('License Number is required.'); return false; }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    let fetchUrl = '';
    let userData: any;

    if (isLogin) {
      // Login
      fetchUrl = `${import.meta.env.VITE_API_URL}/auth/login`;
      userData = {
        email: formData.email,
        password: formData.password,
        expectedUserType: activeTab === 'health_authority' ? 'HEALTH_AUTHORITY' : undefined,
      };
    } else {
      // Registration
      switch (activeTab) {
        case 'patient':
          fetchUrl = `${import.meta.env.VITE_API_URL}/auth/register`;
          userData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            address: formData.address,
            userType: 'PATIENT'
          };
          break;
        case 'pharmacy':
          const parsedHours = parseOperatingHours(formData.operatingHours);
          if (parsedHours === null) {
            setIsLoading(false);
            return; // Stop submission if hours format is invalid
          }

          fetchUrl = `${import.meta.env.VITE_API_URL}/auth/register`;
          userData = {
            name: formData.ownerName, // Assuming ownerName is the 'name' for pharmacy registration
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
            userType: 'PHARMACY',
            // Pharmacy specific fields
            businessName: formData.businessName,
            licenseNumber: formData.licenseNumber,
            businessAddress: formData.businessAddress,
            latitude: formData.latitude ? parseFloat(String(formData.latitude)) : null,
            longitude: formData.longitude ? parseFloat(String(formData.longitude)) : null,
            operatingHours: String(parsedHours),
          };
          break;
        case 'admin':
          toast.error('Admin registration is not available through this form.');
          setIsLoading(false);
          return;
        case 'health_authority':
          toast.error('Health Authority credentials are strictly provisioned by MINSANTÉ.');
          setIsLoading(false);
          return;
        default:
          toast.error('Invalid user type for registration.');
          setIsLoading(false);
          return;
      }
    }

    console.log('Submitting form.. in User Management');
    console.log('URL:', fetchUrl, 'Payload:', userData);

    try {
      const response = await fetch(fetchUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error Response:', errorData);
        toast.error(errorData.message || `An error occurred: ${response.statusText}`);
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      console.log('API Success Response:', data);

      // 2FA Institutional Challenge for Health Authority accounts
      if (data.requiresMfa) {
        setIsMfaStep(true);
        setMfaInfo(data);
        toast.info(data.message || 'Validation à deux facteurs (2FA) requise.');
        setIsLoading(false);
        return;
      }

      // If response.ok is true, it means the HTTP status code was 2xx
      if (activeTab === 'health_authority' && data.data?.user?.userType !== 'HEALTH_AUTHORITY') {
        toast.error("Accès refusé. Ce compte ne possède pas les habilitations Régulateur MINSANTÉ / ONPC.");
        setIsLoading(false);
        return;
      }

      onLogin(activeTab, data);
      if (isLogin) {
        toast.success('Login successful!');
      } else {
        toast.success(activeTab === 'pharmacy' ? 'Account created! It will be reviewed by an admin.' : 'Account created successfully!');
      }
      setFormData(initialFormData); // Clear the form on successful submission
    } catch (error: any) {
      console.error('Network or unexpected error:', error);
      toast.error(`A network error occurred. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTabIcon = (type: string) => {
    switch (type) {
      case 'patient': return <User className="w-4 h-4" />;
      case 'pharmacy': return <Building2 className="w-4 h-4" />;
      case 'admin': return <Shield className="w-4 h-4 text-blue-600" />;
      case 'health_authority': return <ShieldCheck className="w-4 h-4 text-emerald-600" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getTabLabel = (type: string) => {
    switch (type) {
      case 'patient': return 'Patient';
      case 'pharmacy': return 'Pharmacy';
      case 'admin': return 'Admin';
      case 'health_authority': return 'Autorité Sanitaire';
      default: return 'User';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={isMfaStep ? () => setIsMfaStep(false) : onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isMfaStep ? 'Retour aux identifiants' : 'Back to Home'}
          </Button>
        </div>

        {isMfaStep ? (
          <Card className="bg-white rounded-3xl shadow-2xl border border-emerald-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mb-3">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Validation d'Accès Régulateur (2FA)</h2>
              <p className="text-xs text-emerald-200/80 mt-1 max-w-md mx-auto">
                {mfaInfo?.institution === 'ONPC' ? 'Ordre National des Pharmaciens du Cameroun (ONPC)' : 'Ministère de la Santé Publique (MINSANTÉ)'}
              </p>
              {mfaInfo?.department && (
                <div className="mt-2 inline-block bg-emerald-500/10 border border-emerald-400/20 rounded-full px-3 py-1 text-[11px] text-emerald-300 font-medium">
                  {mfaInfo.department}
                </div>
              )}
            </div>

            <CardContent className="p-6">
              <form onSubmit={handleMfaSubmit} className="space-y-5">
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-amber-600" /> Double Authentification Obligatoire
                  </p>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Conformément aux normes nationales d'imputabilité et de sécurité, veuillez saisir le code de sécurité institutionnel à 6 chiffres pour valider la session de <strong>{formData.email}</strong>.
                  </p>
                </div>

                <div>
                  <Label htmlFor="mfa-code" className="text-sm font-semibold text-slate-800">Code de Sécurité (6 chiffres)</Label>
                  <Input
                    id="mfa-code"
                    type="text"
                    maxLength={6}
                    placeholder="••••••"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value)}
                    required
                    autoFocus
                    className="text-center font-mono text-2xl tracking-[0.4em] py-3 h-14 border-2 border-emerald-300 focus:border-emerald-600 rounded-xl mt-1.5"
                  />
                </div>

                <div className="space-y-2 pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-lg shadow-emerald-600/20"
                    disabled={isLoading || mfaCode.length < 6}
                  >
                    {isLoading ? 'Vérification en cours...' : 'Valider & Ouvrir la Session Régulatrice'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => { setIsMfaStep(false); setMfaCode(''); }}
                    className="w-full text-xs text-slate-500 hover:text-slate-800"
                  >
                    Retour aux identifiants
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
        <Card className='bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden'>
          <CardHeader className="text-center pb-4">
            {lockUserType && (
              <div className="flex justify-center mb-3">
                {activeTab === 'patient' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Espace Patient • Patient Portal</span>
                  </div>
                )}
                {activeTab === 'pharmacy' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-semibold shadow-xs">
                    <Store className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Espace Pharmacie • Partner Pharmacy Portal</span>
                  </div>
                )}
                {activeTab === 'health_authority' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Autorité Sanitaire Nationale • MINSANTÉ / ONPC</span>
                  </div>
                )}
                {activeTab === 'admin' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-xs">
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>Administration Centrale • MediConnect</span>
                  </div>
                )}
              </div>
            )}
            <CardTitle className="text-2xl font-bold text-slate-900">
              {lockUserType ? (
                activeTab === 'patient' ? (
                  isLogin ? 'Sign In as Patient' : 'Create Patient Account'
                ) : activeTab === 'pharmacy' ? (
                  isLogin ? 'Pharmacy Sign In' : 'Register Partner Pharmacy'
                ) : activeTab === 'health_authority' ? (
                  'Portail Régulateur MINSANTÉ'
                ) : (
                  'Admin Sign In'
                )
              ) : (
                isLogin ? 'Sign In to MediConnect' : 'Create Account on MediConnect'
              )}
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              {lockUserType ? (
                activeTab === 'patient' ? (
                  isLogin 
                    ? 'Access your prescriptions, orders & find verified medicines' 
                    : 'Join Cameroon’s trusted healthcare network as a patient'
                ) : activeTab === 'pharmacy' ? (
                  isLogin 
                    ? 'Manage your pharmacy inventory and orders' 
                    : 'Register your licensed pharmacy on the national network'
                ) : activeTab === 'health_authority' ? (
                  'Accès sécurisé pour la régulation sanitaire et la surveillance'
                ) : (
                  'Platform administration and supervision'
                )
              ) : (
                isLogin ? 'Access your healthcare portal' : 'Join our healthcare network'
              )}
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
              {/* Only show the multi-role TabsList if lockUserType is explicitly false */}
              {!lockUserType && (
                <TabsList className={`grid w-full ${isLogin ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'} bg-gray-100 rounded-2xl p-1 gap-1 h-auto mb-4`}>
                  <TabsTrigger value="patient" className="flex items-center gap-1.5 data-[state=active]:bg-white rounded-xl text-xs py-2 font-medium">
                    {getTabIcon('patient')}
                    {getTabLabel('patient')}
                  </TabsTrigger>
                  <TabsTrigger value="pharmacy" className="flex items-center gap-1.5 data-[state=active]:bg-white rounded-xl text-xs py-2 font-medium">
                    {getTabIcon('pharmacy')}
                    {getTabLabel('pharmacy')}
                  </TabsTrigger>
                  {isLogin && (
                    <>
                      <TabsTrigger value="health_authority" className="flex items-center gap-1.5 data-[state=active]:bg-white rounded-xl text-xs py-2 font-semibold text-emerald-800">
                        {getTabIcon('health_authority')}
                        MINSANTÉ
                      </TabsTrigger>
                      <TabsTrigger value="admin" className="flex items-center gap-1.5 data-[state=active]:bg-white rounded-xl text-xs py-2 font-medium text-blue-700">
                        {getTabIcon('admin')}
                        {getTabLabel('admin')}
                      </TabsTrigger>
                    </>
                  )}
                </TabsList>
              )}

              <TabsContent value="patient" className="mt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div>
                        <Label htmlFor="patient-name">Full Name</Label>
                        <Input
                          id="patient-name"
                          type="text"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient-phone">Phone Number</Label>
                        <Input
                          id="patient-phone"
                          type="tel"
                          placeholder="+237 XXX XXX XXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label htmlFor="patient-email">Email</Label>
                    <Input
                      id="patient-email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="patient-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="patient-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {!isLogin && (
                    <>
                      <div>
                        <Label htmlFor="patient-confirm">Confirm Password</Label>
                        <Input
                          id="patient-confirm"
                          type="password"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <Label htmlFor="patient-address">Address</Label>
                        <Input
                          id="patient-address"
                          type="text"
                          placeholder="Your location in Cameroon"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                      </div>
                    </>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-500/25 text-base flex items-center justify-center gap-2 cursor-pointer transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>{isLogin ? 'Signing in...' : 'Creating patient account...'}</span>
                      </div>
                    ) : (
                      <>
                        <span>{isLogin ? 'Sign In as Patient' : 'Create Patient Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="pharmacy" className="mt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <>
                      <div>
                        <Label htmlFor="business-name">Pharmacy Name</Label>
                        <Input
                          id="business-name"
                          type="text"
                          placeholder="e.g., Pharmacie Centrale"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <Label htmlFor="owner-name">Owner/Pharmacist Name</Label>
                        <Input
                          id="owner-name"
                          type="text"
                          placeholder="Dr. Full Name"
                          value={formData.ownerName}
                          onChange={(e) => handleInputChange('ownerName', e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <Label htmlFor="license-number">License Number</Label>
                        <Input
                          id="license-number"
                          type="text"
                          placeholder="PH123456"
                          value={formData.licenseNumber}
                          onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                          required={!isLogin}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pharmacy-phone">Phone Number</Label>
                        <Input
                          id="pharmacy-phone"
                          type="tel"
                          placeholder="+237 XXX XXX XXX"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="business-address">Business Address</Label>
                        <Input
                          id="business-address"
                          type="text"
                          placeholder="Your pharmacy's physical address"
                          value={formData.businessAddress}
                          onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="operating-hours">Operating Hours</Label>
                        <Input
                          id="operating-hours"
                          placeholder="e.g., Mon-Fri 9am-6pm, Sat 9am-1pm"
                          value={formData.operatingHours}
                          onChange={(e) => handleInputChange('operatingHours', e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div className="sm:col-span-1">
                          <Label htmlFor="latitude">Latitude</Label>
                          <Input
                            id="latitude"
                            type="number"
                            step="any"
                            placeholder="e.g., 4.0483"
                            value={formData.latitude ?? ''}
                            onChange={(e) => handleInputChange('latitude', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <Label htmlFor="longitude">Longitude</Label>
                          <Input
                            id="longitude"
                            type="number"
                            step="any"
                            placeholder="e.g., 9.7043"
                            value={formData.longitude ?? ''}
                            onChange={(e) => handleInputChange('longitude', e.target.value)}
                          />
                        </div>
                        <div className="sm:col-span-1">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={(e) => handleFetchLocation(e)}
                            title="Fetch current location"
                          ><MapPin className="w-4 h-4 mr-2" /> Fetch Location</Button>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div>
                    <Label htmlFor="pharmacy-email">Email</Label>
                    <Input
                      id="pharmacy-email"
                      type="email"
                      placeholder="contact@yourpharmacy.cm"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pharmacy-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="pharmacy-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div>
                      <Label htmlFor="pharmacy-confirm-password">Confirm Password</Label>
                      <Input
                        id="pharmacy-confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-indigo-500/25 text-base flex items-center justify-center gap-2 cursor-pointer transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>{isLogin ? 'Signing in...' : 'Registering pharmacy...'}</span>
                      </div>
                    ) : (
                      <>
                        <span>{isLogin ? 'Sign In as Pharmacy' : 'Register Partner Pharmacy'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="health_authority" className="mt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="authority-email">Identifiant Institutionnel (Email MINSANTÉ)</Label>
                    <Input
                      id="authority-email"
                      type="email"
                      placeholder="authority@minsante.cm"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="authority-password">Code d'Accès Sécurisé (Mot de passe)</Label>
                    <div className="relative">
                      <Input
                        id="authority-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        className="border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full text-slate-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md shadow-emerald-600/20" 
                    disabled={isLoading}
                  >
                    Accéder au Portail Régulateur MINSANTÉ
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-2">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email">Admin Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@mediconnect.cm"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="admin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full text-slate-500"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold h-12 rounded-xl shadow-lg shadow-blue-600/25 text-base flex items-center justify-center gap-2 cursor-pointer transition-all" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        <span>Connexion en cours...</span>
                      </div>
                    ) : (
                      <>
                        <span>Accéder au Tableau de Bord Admin</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center pt-4 border-t border-slate-100">
              {activeTab === 'patient' && (
                <p className="text-sm text-slate-600">
                  {isLogin ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                      >
                        Register
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              )}
              {activeTab === 'pharmacy' && (
                <p className="text-sm text-slate-600">
                  {isLogin ? (
                    <>
                      New partner pharmacy?{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition-colors"
                      >
                        Register your pharmacy
                      </button>
                    </>
                  ) : (
                    <>
                      Already registered?{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer transition-colors"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              )}
              {!['patient', 'pharmacy'].includes(activeTab) && (
                <p className="text-xs text-slate-400">
                  Accès institutionnel officiel • Régulation et Administration MediConnect
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
}
