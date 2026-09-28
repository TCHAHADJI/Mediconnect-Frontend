import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { 
  Settings, 
  Mail, 
  Shield, 
  Database, 
  Bell, 
  Users,
  Save,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

export function SystemSettings() {
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'noreply@mediconnect.cm',
    smtpPassword: '',
    enableNotifications: true
  });

  const [securitySettings, setSecuritySettings] = useState({
    maxLoginAttempts: 5,
    sessionTimeout: 60,
    requireEmailVerification: true,
    enableTwoFactor: false,
    passwordMinLength: 8
  });

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    allowRegistrations: true,
    requirePharmacyVerification: true,
    maxFileUploadSize: 5,
    systemTimezone: 'Africa/Douala'
  });

  const handleSaveSettings = (category: string) => {
    toast.success(`${category} settings saved successfully`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">System Settings</h2>
          <p className="text-muted-foreground">Configure system-wide settings and preferences</p>
        </div>
        <Button variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset to Defaults
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                General Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">System Timezone</Label>
                  <Select value={systemSettings.systemTimezone} onValueChange={(value) => 
                    setSystemSettings(prev => ({ ...prev, systemTimezone: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Africa/Douala">Africa/Douala</SelectItem>
                      <SelectItem value="Africa/Yaounde">Africa/Yaounde</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="uploadSize">Max File Upload (MB)</Label>
                  <Input
                    id="uploadSize"
                    type="number"
                    value={systemSettings.maxFileUploadSize}
                    onChange={(e) => setSystemSettings(prev => ({ 
                      ...prev, 
                      maxFileUploadSize: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow New Registrations</Label>
                    <p className="text-sm text-muted-foreground">Enable new user registrations</p>
                  </div>
                  <Switch
                    checked={systemSettings.allowRegistrations}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                      ...prev, 
                      allowRegistrations: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Pharmacy Verification</Label>
                    <p className="text-sm text-muted-foreground">All pharmacies must be verified before access</p>
                  </div>
                  <Switch
                    checked={systemSettings.requirePharmacyVerification}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                      ...prev, 
                      requirePharmacyVerification: checked 
                    }))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('General')}>
                <Save className="w-4 h-4 mr-2" />
                Save General Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtpHost">SMTP Host</Label>
                  <Input
                    id="smtpHost"
                    value={emailSettings.smtpHost}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpHost: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="smtpPort">SMTP Port</Label>
                  <Input
                    id="smtpPort"
                    value={emailSettings.smtpPort}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPort: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="smtpUser">SMTP Username</Label>
                  <Input
                    id="smtpUser"
                    value={emailSettings.smtpUser}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpUser: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="smtpPassword">SMTP Password</Label>
                  <Input
                    id="smtpPassword"
                    type="password"
                    value={emailSettings.smtpPassword}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, smtpPassword: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Send system notifications via email</p>
                </div>
                <Switch
                  checked={emailSettings.enableNotifications}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ 
                    ...prev, 
                    enableNotifications: checked 
                  }))}
                />
              </div>

              <Button onClick={() => handleSaveSettings('Email')}>
                <Save className="w-4 h-4 mr-2" />
                Save Email Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxAttempts">Max Login Attempts</Label>
                  <Input
                    id="maxAttempts"
                    type="number"
                    value={securitySettings.maxLoginAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ 
                      ...prev, 
                      maxLoginAttempts: parseInt(e.target.value) 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings(prev => ({ 
                      ...prev, 
                      sessionTimeout: parseInt(e.target.value) 
                    }))}
                  />
                </div>

                <div>
                  <Label htmlFor="passwordLength">Minimum Password Length</Label>
                  <Input
                    id="passwordLength"
                    type="number"
                    value={securitySettings.passwordMinLength}
                    onChange={(e) => setSecuritySettings(prev => ({ 
                      ...prev, 
                      passwordMinLength: parseInt(e.target.value) 
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">Users must verify email before access</p>
                  </div>
                  <Switch
                    checked={securitySettings.requireEmailVerification}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ 
                      ...prev, 
                      requireEmailVerification: checked 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                  </div>
                  <Switch
                    checked={securitySettings.enableTwoFactor}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ 
                      ...prev, 
                      enableTwoFactor: checked 
                    }))}
                  />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Security')}>
                <Save className="w-4 h-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Low Stock Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify when medicines are low in stock</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>New User Registrations</Label>
                    <p className="text-sm text-muted-foreground">Notify when new users register</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>System Errors</Label>
                    <p className="text-sm text-muted-foreground">Notify on system errors and failures</p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">Notify on security-related events</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Notifications')}>
                <Save className="w-4 h-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Maintenance & Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <Label>Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">Temporarily disable user access</p>
                  </div>
                </div>
                <Switch
                  checked={systemSettings.maintenanceMode}
                  onCheckedChange={(checked) => setSystemSettings(prev => ({ 
                    ...prev, 
                    maintenanceMode: checked 
                  }))}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Maintenance Message</Label>
                  <Textarea
                    placeholder="Message to display during maintenance..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline">
                    <Database className="w-4 h-4 mr-2" />
                    Backup Database
                  </Button>
                  <Button variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>
              </div>

              <Button onClick={() => handleSaveSettings('Maintenance')}>
                <Save className="w-4 h-4 mr-2" />
                Save Maintenance Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}