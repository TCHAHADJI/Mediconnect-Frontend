import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '../ui/sheet';
import { 
  BarChart3, 
  Users, 
  Pill, 
  Store, 
  Shield, 
  Settings, 
  Bell, 
  FileText, 
  Menu, 
  LogOut,
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  KeyRound
} from 'lucide-react';

import { AdminOverview } from '../admin/AdminOverview';
import { UserManagement } from '../admin/UserManagement';
import { MedicineManagement } from '../admin/MedicineManagement';
import { PharmacyVerification } from '../admin/PharmacyVerification';
import { InventoryMonitoring } from '../admin/InventoryMonitoring';
import { HealthTipsManagement } from '../admin/HealthTipsManagement';
import { SystemAnalytics } from '../admin/SystemAnalytics';
import { AuditLogs } from '../admin/AuditLogs';
import { SystemSettings } from '../admin/SystemSettings';
import { MasterCatalogueManager } from '../catalogue/MasterCatalogueManager';
import { HealthAuthorityPortal } from '../health-authority/HealthAuthorityPortal';
import { HealthAuthorityCredentialManager } from '../admin/HealthAuthorityCredentialManager';
import { ActiveCampaignBanner } from '../campaigns/ActiveCampaignBanner';

interface AdminDashboardProps {
  user: any;
  onLogout: () => void;
}

export function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4 " /> },
    { id: 'authority-credentials', label: 'Health Authority Access', icon: <KeyRound className="w-4 h-4 text-emerald-500" /> },
    { id: 'authority', label: 'Health Authority (MINSANTÉ/ONPC)', icon: <Shield className="w-4 h-4 text-emerald-500" /> },
    { id: 'catalogue', label: 'Master Catalogue (DCI/ATC)', icon: <Pill className="w-4 h-4 text-emerald-500" /> },
    { id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
    { id: 'pharmacies', label: 'Pharmacy Verification', icon: <Store className="w-4 h-4" /> },
    { id: 'inventory', label: 'Inventory Monitor', icon: <Activity className="w-4 h-4" /> },
    { id: 'health-tips', label: 'Health Tips', icon: <FileText className="w-4 h-4" /> },
    { id: 'analytics', label: 'System Analytics', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Logs', icon: <Shield className="w-4 h-4" /> },
    { id: 'settings', label: 'System Settings', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-left">MediConnect Admin</SheetTitle>
              <SheetDescription className="text-left">
                Administrative control panel
              </SheetDescription>
            </SheetHeader>
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => {
                    setActiveTab(item.id);
                    setSidebarOpen(false);
                  }}
                >
                  {item.icon}
                  {item.label}
                </Button>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        
        <h1 className="text-lg font-semibold">Admin Panel</h1>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5" />
          </Button>
          <Avatar className="w-8 h-8">
            <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-white border-r border-blue-300">
            <div className="flex items-center px-4 py-6 border-b bg-blue-50">
              <div className="flex items-center gap-3 ">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-black" />
                </div>
                <div >
                  <h1 className="text-lg font-semibold">MediConnect</h1>
                  <p className="text-sm text-muted-foreground font-bold">Admin Panel</p>
                </div>
              </div>
            </div>
            
            {/* Navigation menu of the admin panel */}

            <nav className="flex-1 p-4 space-y-2">
              {navigationItems.map((item) => (
               <Button
                key={item.id}
                variant={activeTab === item.id ? 'default' : 'ghost'}
                className={`w-full justify-start rounded-2xl transition-all duration-300
                            ${activeTab === item.id ? 'bg-purple-600 text-white' : ''}
                            hover:bg-blue-600 hover:text-white`}
                onClick={() => setActiveTab(item.id)}
              >
                {item.icon}
                {item.label}
              </Button>
              ))}
            </nav>

            {/* System administrator and logout */}

            <div className="p-4 border-t">
              <div className="flex items-center gap-3 mb-4">
                <Avatar>
                  <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">System Administrator</p>
                </div>
              </div>
              <Button variant="ghost" onClick={onLogout} className="w-full justify-start">
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          <ActiveCampaignBanner onNavigateToCampaigns={() => setActiveTab('authority')} />
          <div className="p-4 lg:p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold mb-2">
                {navigationItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
              </h1>
              <p className="text-muted-foreground">
                Manage and monitor the MediConnect platform
              </p>
            </div>

            {/* Content */}
            {activeTab === 'overview' && <AdminOverview onNavigateTab={(tab: string) => setActiveTab(tab)} />}
            {activeTab === 'authority-credentials' && <HealthAuthorityCredentialManager />}
            {activeTab === 'authority' && <HealthAuthorityPortal embedded={true} />}
            {activeTab === 'catalogue' && <MasterCatalogueManager />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'pharmacies' && <PharmacyVerification />}
            {activeTab === 'inventory' && <InventoryMonitoring />}
            {activeTab === 'health-tips' && <HealthTipsManagement />}
            {activeTab === 'analytics' && <SystemAnalytics />}
            {activeTab === 'audit' && <AuditLogs />}
            {activeTab === 'settings' && <SystemSettings />}
          </div>
        </div>
      </div>
    </div>
  );
}