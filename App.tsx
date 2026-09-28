
// App.tsx
// Main application component with enhanced features and animations
import React, { useState } from 'react';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from './components/ui/sheet';
import { BrowserRouter as Router, useLocation, useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'sonner';
import { Search, MapPin, Pill, Store, Bell, MessageSquare, LogOut, Menu, Heart, BarChart3, Plus, Clock, ShieldCheck, HeartPulse, FileText, Megaphone } from 'lucide-react';

// Import dashboard components with specific paths to avoid conflicts
import { Dashboard } from './components/dashboard/Dashboard';
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { MedicineSearch } from './components/MedicineSearch';
import { PharmacyFinder } from './components/PharmacyFinder';
import { InventoryManagement } from './components/InventoryManagement';
import { UserAuth } from './components/UserAuth';
import { Notifications } from './components/Notifications';
import { CommunicationCenter } from './components/CommunicationCenter';
import { HealthTips } from './components/HealthTips';
import { LandingPage } from './components/LandingPage';
import { HealthAuthorityPortal } from './components/health-authority/HealthAuthorityPortal';
import { PillRemindersView } from './components/reminders/PillRemindersView';
import { PillReminderAlarmListener } from './components/reminders/PillReminderAlarmListener';
import { CsuInsuranceView } from './components/csu/CsuInsuranceView';
import { MedicalBookletView } from './components/booklet/MedicalBookletView';
import { PublicEmergencyCardView } from './components/booklet/PublicEmergencyCardView';
import { PrescriptionsView } from './components/prescriptions/PrescriptionsView';
import { DutyScheduleManager, DrugPackagingVerifier } from './components/pharmacy';
import { ActiveCampaignBanner } from './components/campaigns/ActiveCampaignBanner';
import { CampaignsView } from './components/campaigns/CampaignsView';

// Import the new authentication context
import { AuthProvider, useAuth, withAuth } from './components/admin/context/AuthContext';
import { AuditLogger } from './components/admin/utils/auditUtils';

// Import new animation components
import { AnimatedWrapper, LoadingSpinner } from './components/ui/animations';

// Enhanced Admin Dashboard with authentication
const SecureAdminDashboard = withAuth(AdminDashboard);

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userType, setUserType] = useState<'patient' | 'pharmacy' | 'admin' | 'health_authority' | null>(null);
  const [user, setUser] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authUserType, setAuthUserType] = useState<'patient' | 'pharmacy' | 'admin' | 'health_authority' | null>(null);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'signup'>('login');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [notifications, setNotifications] = useState(3); // Mock notification count

  // Use the auth context for admin users
  const { login: adminLogin, logout: adminLogout, isAuthenticated: isAdminAuthenticated, user: adminUser } = useAuth();

  const handleTabChange = (tabId: string, label: string) => {
    setIsTransitioning(true);
    
    // Add subtle delay for smooth transition
    setTimeout(() => {
      setActiveTab(tabId);
      setIsTransitioning(false);
      setSidebarOpen(false);
      
      // Log feature access
      if (user) {
        AuditLogger.log('FEATURE_USED', user.id, {
          feature: tabId,
          featureLabel: label,
          userType: userType
        });
      }
    }, 150);
  };

  const handleLogin = async (type: 'patient' | 'pharmacy' | 'admin' | 'health_authority', userData: any) => {
    if (!userData.success || !userData.data || !userData.data.user) {
      toast.error(userData.message || 'Login failed. Please check your credentials.');
      return;
    }

    const loggedUser = userData.data.user;
    const token = userData.data.token;

    // 1. Admin login
    if (loggedUser.userType === 'ADMIN') {
      adminLogin(loggedUser, token);
      setIsLoggedIn(true);
      setUserType('admin');
      setUser(loggedUser);
      setShowAuth(false);
      setAuthUserType(null);
      localStorage.setItem('userSession', JSON.stringify({ user: loggedUser, userType: 'admin', token }));
      toast.success(`Welcome Administrator ${loggedUser.name}!`);
      if (!location.pathname.toLowerCase().startsWith('/admin')) {
        navigate('/admin');
      }
      return;
    }

    // 2. Health Authority login (MINSANTÉ / ONPC)
    if (loggedUser.userType === 'HEALTH_AUTHORITY') {
      setIsLoggedIn(true);
      setUserType('health_authority');
      setUser(loggedUser);
      setShowAuth(false);
      setAuthUserType(null);
      localStorage.setItem('userSession', JSON.stringify({ user: loggedUser, userType: 'health_authority', token }));
      AuditLogger.log('LOGIN_SUCCESS', loggedUser.id || loggedUser._id, {
        userEmail: loggedUser.email,
        userType: 'HEALTH_AUTHORITY',
        loginMethod: 'web_interface'
      });
      toast.success(`Session Régulateur MINSANTÉ / ONPC ouverte: ${loggedUser.name}`);
      if (!location.pathname.toLowerCase().startsWith('/minsante') && !location.pathname.toLowerCase().startsWith('/health-authority')) {
        navigate('/minsante');
      }
      return;
    } else if (type === 'health_authority') {
      toast.error("Accès refusé. Ce compte ne possède pas les habilitations Régulateur MINSANTÉ / ONPC.");
      return;
    }

    // 3. Pharmacy and Patient users
    const resolvedType: 'pharmacy' | 'patient' = loggedUser.userType === 'PHARMACY' ? 'pharmacy' : 'patient';
    setIsLoggedIn(true);
    setUserType(resolvedType);
    setUser(loggedUser);
    setShowAuth(false);
    setAuthUserType(null);
    
    localStorage.setItem('userSession', JSON.stringify({ user: loggedUser, userType: resolvedType, token }));
    
    AuditLogger.log('LOGIN_SUCCESS', loggedUser.id || loggedUser._id, {
      userEmail: loggedUser.email,
      userType: resolvedType,
      loginMethod: 'web_interface'
    });
    
    toast.success(`Welcome back, ${loggedUser.name}!`);
  };

  const handleLogout = () => {
    if (userType === 'admin') {
      // Log admin logout before clearing state
      if (user) {
        AuditLogger.log('LOGOUT', user.id, {
          userEmail: user.email,
          userRole: user.role,
          sessionDuration: 'calculated_in_production'
        });
      }
      adminLogout();
      localStorage.removeItem('userSession');
    } else {
      // Log regular user logout
      if (user) {
        AuditLogger.log('LOGOUT', user.id, {
          userEmail: user.email,
          userType: userType
        });
      }
    }

    setIsLoggedIn(false);
    setUserType(null);
    setUser(null);
    setActiveTab('dashboard');
    setShowAuth(false);
    setAuthUserType(null);
    
    toast.success('Logged out successfully');
    localStorage.removeItem('userSession');
  };

  const handleShowAuth = (
    type: 'patient' | 'pharmacy' | 'admin' | 'health_authority' = 'patient',
    mode: 'login' | 'signup' = 'login'
  ) => {
    setAuthUserType(type);
    setAuthInitialMode(mode);
    setShowAuth(true);
  };

  const handleBackToLanding = () => {
    setShowAuth(false);
    setAuthUserType(null);
  };

  // Handle admin authentication state
  React.useEffect(() => {
    if (isAdminAuthenticated && adminUser) {
      if (userType !== 'admin') {
        setIsLoggedIn(true);
        setUserType('admin');
        setUser(adminUser);
        setShowAuth(false);
        setAuthUserType(null);
      }
      const adminAuth = localStorage.getItem('mediconnect_admin_auth');
      if (adminAuth) {
        try {
          const parsed = JSON.parse(adminAuth);
          if (parsed?.token && !localStorage.getItem('userSession')) {
            localStorage.setItem('userSession', JSON.stringify({ user: adminUser, userType: 'admin', token: parsed.token }));
          }
        } catch (e) {}
      }
    }
  }, [isAdminAuthenticated, adminUser, userType]);

  // Handle persistent login for patient/pharmacy users
  React.useEffect(() => {
    const storedSession = localStorage.getItem('userSession');
    if (storedSession) {
      const { user: storedUser, userType: storedUserType } = JSON.parse(storedSession);
      setIsLoggedIn(true);
      setUserType(storedUserType);
      setUser(storedUser);
      setShowAuth(false);
      setAuthUserType(null);
    }
  }, []);

  // Listen for profile changes to keep header and sidebar in sync
  React.useEffect(() => {
    const handleSync = () => {
      const storedSession = localStorage.getItem('userSession');
      if (storedSession) {
        try {
          const { user: storedUser } = JSON.parse(storedSession);
          if (storedUser) setUser(storedUser);
        } catch (e) {}
      }
    };
    window.addEventListener('userSessionUpdated', handleSync);
    return () => window.removeEventListener('userSessionUpdated', handleSync);
  }, []);

  // Synchronize live unread notification count
  React.useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnreadCount = async () => {
      try {
        const session = localStorage.getItem('userSession') || localStorage.getItem('mediconnect_admin_auth');
        let token = null;
        if (session) {
          try { token = JSON.parse(session).token; } catch (e) {}
        }
        if (!token) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/users/notifications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const unread = data.data.filter((n: any) => !n.read && !n.isRead).length;
          setNotifications(unread);
        }
      } catch (err) {}
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 25000);
    return () => clearInterval(interval);
  }, [isLoggedIn, activeTab]);

  // Dedicated /admin route: can be opened directly on a separate page or tab
  const isAdminPath = location.pathname.toLowerCase().startsWith('/admin');
  if (isAdminPath) {
    if (isAdminAuthenticated || userType === 'admin') {
      return (
        <AnimatedWrapper animation="fadeIn" duration={400}>
          <SecureAdminDashboard 
            user={user || adminUser} 
            onLogout={() => {
              handleLogout();
              navigate('/admin');
            }} 
          />
        </AnimatedWrapper>
      );
    }

    return (
      <AnimatedWrapper animation="fadeIn" duration={300}>
        <UserAuth 
          onLogin={handleLogin} 
          defaultUserType="admin" 
          initialMode="login"
          lockUserType={true}
          onBack={() => navigate('/')}
        />
      </AnimatedWrapper>
    );
  }

  // Dedicated /minsante or /health-authority route: can be opened directly on a separate page or tab
  const isHealthAuthorityPath = 
    location.pathname.toLowerCase().startsWith('/minsante') || 
    location.pathname.toLowerCase().startsWith('/health-authority');

  if (isHealthAuthorityPath) {
    if (userType === 'health_authority') {
      return (
        <AnimatedWrapper animation="fadeIn" duration={400}>
          <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
            <HealthAuthorityPortal 
              onLogout={() => {
                handleLogout();
                navigate('/minsante');
              }} 
            />
          </div>
        </AnimatedWrapper>
      );
    }

    return (
      <AnimatedWrapper animation="fadeIn" duration={300}>
        <UserAuth 
          onLogin={handleLogin} 
          defaultUserType="health_authority" 
          initialMode="login"
          lockUserType={true}
          onBack={() => navigate('/')}
        />
      </AnimatedWrapper>
    );
  }

  // Dedicated /emergency/:token Public First-Responder Medical Card Route
  const isEmergencyPath = 
    location.pathname.toLowerCase().startsWith('/emergency/') || 
    location.pathname.toLowerCase().startsWith('/emergency-card/');
  if (isEmergencyPath) {
    const pathParts = location.pathname.split('/');
    const token = pathParts[2] || '';
    return (
      <AnimatedWrapper animation="fadeIn" duration={300}>
        <PublicEmergencyCardView token={token} onBack={() => navigate('/')} />
      </AnimatedWrapper>
    );
  }

  // Handle direct /login URL
  if (location.pathname.toLowerCase() === '/login' && !isLoggedIn) {
    return (
      <AnimatedWrapper animation="fadeIn" duration={300}>
        <UserAuth 
          onLogin={handleLogin} 
          defaultUserType={authUserType || 'patient'} 
          initialMode={authInitialMode}
          lockUserType={true}
          onBack={() => navigate('/')}
        />
      </AnimatedWrapper>
    );
  }

  // Show landing page when not logged in and not showing auth
  if (!isLoggedIn && !showAuth) {
    return <LandingPage onShowAuth={handleShowAuth} />;
  }

  // Show authentication form when showAuth is true
  if (!isLoggedIn && showAuth) {
    return (
      <AnimatedWrapper animation="fadeIn" duration={300}>
        <UserAuth 
          onLogin={handleLogin} 
          defaultUserType={authUserType} 
          initialMode={authInitialMode}
          lockUserType={true}
          onBack={handleBackToLanding}
        />
      </AnimatedWrapper>
    );
  }

  // Admin gets the secure dashboard with role-based access controls
  if (userType === 'admin') {
    return (
      <AnimatedWrapper animation="fadeIn" duration={400}>
        <SecureAdminDashboard user={user} onLogout={handleLogout} />
      </AnimatedWrapper>
    );
  }

  // Health Authority gets the National Regulatory Portal
  if (userType === 'health_authority') {
    return (
      <AnimatedWrapper animation="fadeIn" duration={400}>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
          <HealthAuthorityPortal onLogout={handleLogout} />
        </div>
      </AnimatedWrapper>
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'medicines', label: 'Find Medicines', icon: <Pill className="w-4 h-4" /> },
    { id: 'pharmacies', label: 'Find Pharmacies', icon: <Store className="w-4 h-4" /> },
    ...(userType === 'patient' ? [
      { id: 'booklet', label: 'Medical Booklet', icon: <HeartPulse className="w-4 h-4" /> },
      { id: 'prescriptions', label: 'Prescriptions', icon: <FileText className="w-4 h-4" /> },
      { id: 'reminders', label: 'Pill Reminders', icon: <Clock className="w-4 h-4" /> },
      { id: 'csu', label: 'CSU Insurance', icon: <ShieldCheck className="w-4 h-4" /> },
      { id: 'health-tips', label: 'Health Tips', icon: <Heart className="w-4 h-4" /> },
    ] : []),
    ...(userType === 'pharmacy' ? [
      { id: 'inventory', label: 'Manage Inventory', icon: <Plus className="w-4 h-4" /> },
      { id: 'duty-schedule', label: 'Duty Schedule & Status', icon: <Clock className="w-4 h-4" /> },
      { id: 'verify-packaging', label: 'Verify Packaging Code', icon: <ShieldCheck className="w-4 h-4" /> },
    ] : []),
    { id: 'campaigns', label: 'Campaigns', icon: <Megaphone className="w-4 h-4 text-emerald-500" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Active National Public Health Campaign Banner */}
      <ActiveCampaignBanner onNavigateToCampaigns={() => handleTabChange('campaigns', 'Campaigns')} />

      {/* Enhanced Mobile Header */}
      <AnimatedWrapper animation="slideUp" duration={300}>
        <div className="lg:hidden bg-white/90 backdrop-blur-md border-b border-primary-100 px-4 py-3 flex items-center justify-between shadow-soft">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover-scale click-shrink focus-ring"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0 bg-white/95 backdrop-blur-md">
              <SheetHeader className="p-4 border-b border-primary-100">
                <SheetTitle className="text-left gradient-text">MediConnect Cameroon</SheetTitle>
                <SheetDescription className="text-left text-muted-foreground">
                  Navigate through the app using the menu below
                </SheetDescription>
              </SheetHeader>
              <nav className="p-4 space-y-2">
                {navigationItems.map((item, index) => (
                  <AnimatedWrapper key={item.id} animation="slideRight" delay={index * 50}>
                    <Button
                      variant={activeTab === item.id ? 'default' : 'ghost'}
                      className={`w-full justify-start hover-lift transition-all duration-200 ${
                        activeTab === item.id 
                          ? 'gradient-bg-primary text-white shadow-glow' 
                          : 'hover:bg-primary-50'
                      }`}
                      onClick={() => handleTabChange(item.id, item.label)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                      {item.id === 'campaigns' && (
                        <span className="ml-auto bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          LIVE
                        </span>
                      )}
                    </Button>
                  </AnimatedWrapper>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <AnimatedWrapper hover="scale">
            <h1 className="text-lg font-semibold gradient-text">MediConnect</h1>
          </AnimatedWrapper>
          
          <div className="flex items-center gap-2">
            <AnimatedWrapper hover="bounce">
              <Button 
                variant="ghost" 
                size="icon" 
                className="relative hover-glow"
                onClick={() => handleTabChange('notifications', 'Notifications')}
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-secondary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse-soft">
                    {notifications}
                  </span>
                )}
              </Button>
            </AnimatedWrapper>
            <AnimatedWrapper hover="lift">
              <Avatar className="w-8 h-8 border-2 border-primary-200 shadow-soft">
                <AvatarImage src={user?.profilePicture || user?.profileImage} alt={user?.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                  {user?.name?.[0]}
                </AvatarFallback>
              </Avatar>
            </AnimatedWrapper>
          </div>
        </div>
      </AnimatedWrapper>

      <div className="flex">
        {/* Enhanced Desktop Sidebar */}
        <AnimatedWrapper animation="slideRight" duration={400}>
          <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
            <div className="flex flex-col flex-grow bg-white/90 backdrop-blur-md border-r border-primary-100 shadow-soft">
              <div className="flex items-center px-4 py-6 border-b border-primary-100">
                <AnimatedWrapper hover="scale" className="flex items-center gap-3">
                  <div className="w-8 h-8 gradient-bg-primary rounded-lg flex items-center justify-center shadow-glow animate-pulse-soft">
                    <Pill className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold gradient-text">MediConnect</h1>
                    <p className="text-sm text-muted-foreground">Cameroon</p>
                  </div>
                </AnimatedWrapper>
              </div>
              
              <nav className="flex-1 p-4 space-y-2">
                {navigationItems.map((item, index) => (
                  <AnimatedWrapper key={item.id} animation="slideRight" delay={index * 50}>
                    <Button
                      variant={activeTab === item.id ? 'default' : 'ghost'}
                      className={`w-full justify-start hover-lift transition-all duration-200 ${
                        activeTab === item.id 
                          ? 'gradient-bg-primary text-white shadow-glow' 
                          : 'hover:bg-primary-50 hover:text-primary-700'
                      }`}
                      onClick={() => handleTabChange(item.id, item.label)}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.label}
                      {item.id === 'campaigns' && (
                        <span className="ml-auto bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          LIVE
                        </span>
                      )}
                      {item.id === 'notifications' && notifications > 0 && (
                        <span className="ml-auto bg-secondary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse-soft">
                          {notifications}
                        </span>
                      )}
                    </Button>
                  </AnimatedWrapper>
                ))}
              </nav>
              
              <div className="p-4 border-t border-primary-100">
                <AnimatedWrapper animation="slideUp" className="flex items-center gap-3 mb-4">
                  <Avatar className="border-2 border-primary-200 shadow-soft">
                    <AvatarImage src={user?.profilePicture || user?.profileImage} alt={user?.name} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white">
                      {user?.name?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user?.businessName || user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{userType === 'pharmacy' ? 'Pharmacie' : userType}</p>
                  </div>
                </AnimatedWrapper>
                <AnimatedWrapper hover="lift">
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout} 
                    className="w-full justify-start hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </Button>
                </AnimatedWrapper>
              </div>
            </div>
          </div>
        </AnimatedWrapper>

        {/* Enhanced Main Content */}
        <div className="flex-1 lg:ml-64">
          <div className="p-4 lg:p-6">
            {isTransitioning ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner size="lg" variant="primary" />
              </div>
            ) : (
              <AnimatedWrapper 
                key={activeTab} 
                animation="fadeIn" 
                duration={300}
                className="min-h-[calc(100vh-8rem)]"
              >
                {activeTab === 'dashboard' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <Dashboard 
                      userType={userType} 
                      user={user} 
                      onNavigateTab={(tab) => handleTabChange(tab, tab)} 
                    />
                  </AnimatedWrapper>
                )}
                {activeTab === 'campaigns' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <CampaignsView 
                      userRole={userType || 'patient'} 
                      onNavigateToPharmacies={() => handleTabChange('pharmacies', 'Find Pharmacies')} 
                    />
                  </AnimatedWrapper>
                )}
                {activeTab === 'medicines' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <MedicineSearch />
                  </AnimatedWrapper>
                )}
                {activeTab === 'pharmacies' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <PharmacyFinder />
                  </AnimatedWrapper>
                )}
                {activeTab === 'booklet' && userType === 'patient' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <MedicalBookletView 
                      user={user} 
                      onUserUpdated={(updatedUser) => {
                        setUser(updatedUser);
                        const storedSession = localStorage.getItem('userSession');
                        if (storedSession) {
                          try {
                            const parsed = JSON.parse(storedSession);
                            parsed.user = updatedUser;
                            localStorage.setItem('userSession', JSON.stringify(parsed));
                          } catch (e) {}
                        }
                      }}
                      onNavigateToPrescriptions={() => handleTabChange('prescriptions', 'Prescriptions')}
                    />
                  </AnimatedWrapper>
                )}
                {activeTab === 'prescriptions' && userType === 'patient' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <PrescriptionsView 
                      user={user} 
                      onNavigateToPharmacies={() => handleTabChange('pharmacies', 'Find Pharmacies')}
                    />
                  </AnimatedWrapper>
                )}
                {activeTab === 'reminders' && userType === 'patient' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <PillRemindersView 
                      onNavigateToPharmacies={() => handleTabChange('pharmacies', 'Find Pharmacies')} 
                    />
                  </AnimatedWrapper>
                )}
                {activeTab === 'csu' && userType === 'patient' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <CsuInsuranceView 
                      user={user} 
                      onUserUpdated={(updatedUser) => setUser(updatedUser)} 
                      onNavigateToPharmacies={() => handleTabChange('pharmacies', 'Find Pharmacies')} 
                    />
                  </AnimatedWrapper>
                )}
                {activeTab === 'health-tips' && userType === 'patient' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <HealthTips />
                  </AnimatedWrapper>
                )}
                {activeTab === 'inventory' && userType === 'pharmacy' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <InventoryManagement />
                  </AnimatedWrapper>
                )}
                {activeTab === 'duty-schedule' && userType === 'pharmacy' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <DutyScheduleManager />
                  </AnimatedWrapper>
                )}
                {activeTab === 'verify-packaging' && userType === 'pharmacy' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <DrugPackagingVerifier />
                  </AnimatedWrapper>
                )}
                {activeTab === 'notifications' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <Notifications />
                  </AnimatedWrapper>
                )}
                {activeTab === 'messages' && (
                  <AnimatedWrapper animation="slideUp" delay={100}>
                    <CommunicationCenter userType={userType} />
                  </AnimatedWrapper>
                )}
              </AnimatedWrapper>
            )}
          </div>
        </div>
      </div>

      {/* Global Real-Time Medication Alarm & Notification Listener for Patients */}
      {userType === 'patient' && <PillReminderAlarmListener user={user} />}

      {/* Enhanced floating elements for visual interest */}
      <div className="fixed top-20 right-10 w-4 h-4 bg-primary-200 rounded-full opacity-40 animate-float" />
      <div className="fixed bottom-32 left-10 w-6 h-6 bg-secondary-200 rounded-full opacity-30 animate-float-delayed" />
      <div className="fixed top-1/2 right-20 w-3 h-3 bg-accent-200 rounded-full opacity-40 animate-pulse-soft" />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}