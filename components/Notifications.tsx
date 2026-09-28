import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import {
  Bell,
  Package,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Clock,
  Check,
  X,
  Settings,
  Loader2,
  RefreshCw,
  ExternalLink,
  Megaphone,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'stock' | 'price' | 'new_pharmacy' | 'order' | 'system' | 'campaign' | string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  raw?: any;
}

interface NotificationSettings {
  stockAlerts: boolean;
  priceAlerts: boolean;
  newPharmacyAlerts: boolean;
  orderAlerts: boolean;
  systemAlerts: boolean;
  campaignAlerts: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  stockAlerts: true,
  priceAlerts: true,
  newPharmacyAlerts: true,
  orderAlerts: true,
  systemAlerts: true,
  campaignAlerts: true,
};

const READ_STORAGE_KEY = 'mediconnect_read_notifications';
const SETTINGS_STORAGE_KEY = 'mediconnect_notification_settings';

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Load preferences from localStorage or use defaults
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {
      console.error('Error loading notification settings:', e);
    }
    return DEFAULT_SETTINGS;
  });

  const getAuthToken = (): string | null => {
    // 1. Patient / Pharmacy session
    const session = localStorage.getItem('userSession');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.token) return parsed.token;
      } catch (e) {
        console.error('Error parsing userSession token:', e);
      }
    }
    // 2. Admin session
    const adminAuth = localStorage.getItem('mediconnect_admin_auth');
    if (adminAuth) {
      try {
        const parsedAdmin = JSON.parse(adminAuth);
        if (parsedAdmin.token) return parsedAdmin.token;
      } catch (e) {
        console.error('Error parsing mediconnect_admin_auth token:', e);
      }
    }
    return null;
  };

  const getLocallyReadIds = (): Set<string> => {
    try {
      const saved = localStorage.getItem(READ_STORAGE_KEY);
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) {
      console.error('Error reading locally read notifications:', e);
    }
    return new Set<string>();
  };

  const saveLocallyReadId = (id: string) => {
    try {
      const set = getLocallyReadIds();
      set.add(id);
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...set]));
    } catch (e) {
      console.error('Error saving read notification ID:', e);
    }
  };

  const saveAllLocallyReadIds = (ids: string[]) => {
    try {
      const set = getLocallyReadIds();
      ids.forEach(id => set.add(id));
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify([...set]));
    } catch (e) {
      console.error('Error saving read notification IDs:', e);
    }
  };

  const normalizeType = (type?: string): 'stock' | 'price' | 'new_pharmacy' | 'order' | 'system' => {
    if (!type) return 'system';
    const lower = type.toLowerCase();
    if (lower.includes('stock')) return 'stock';
    if (lower.includes('price')) return 'price';
    if (lower.includes('pharmacy')) return 'new_pharmacy';
    if (lower.includes('order')) return 'order';
    return 'system';
  };

  const fetchNotifications = async (showLoadingSpinner = true) => {
    if (showLoadingSpinner) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);

    const token = getAuthToken();
    if (!token) {
      setError("Authentication required to load notifications. Please sign in.");
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch notifications from the server.');
      }

      const result = await response.json();
      if (result.success && Array.isArray(result.data)) {
        const readIds = getLocallyReadIds();

        const formattedNotifications: Notification[] = result.data.map((n: any) => {
          const id = n._id || n.id;
          const isDbRead = Boolean(n.read === true || n.isRead === true);
          const isLocalRead = readIds.has(id);
          const isRead = isDbRead || isLocalRead;

          // If marked read locally but DB still has false, sync in background
          if (isLocalRead && !isDbRead && token) {
            fetch(`${import.meta.env.VITE_API_URL}/users/notifications/${id}/read`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => {});
          }

          return {
            id,
            type: normalizeType(n.type),
            title: n.title || 'MediConnect Notification',
            message: n.message || '',
            timestamp: n.createdAt ? new Date(n.createdAt).toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short'
            }) : new Date().toLocaleString('en-US'),
            read: isRead,
            priority: (n.priority as any) || (n.type?.toLowerCase().includes('stock') ? 'high' : 'medium'),
            actionable: Boolean(n.actionable ?? (n.relatedId || n.type?.toLowerCase().includes('stock') || n.type?.toLowerCase().includes('pharmacy'))),
            raw: n
          };
        });

        setNotifications(formattedNotifications);
      } else {
        throw new Error(result.message || 'An unknown error occurred while retrieving notifications.');
      }
    } catch (err: any) {
      const errMsg = err.message || 'Error loading notifications.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
  }, []);

  const markAsRead = async (notificationId: string) => {
    // 1. Immediately update React state
    setNotifications(prev => prev.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    ));

    // 2. Persist in localStorage so hard refresh never reverts
    saveLocallyReadId(notificationId);

    // 3. Persist to MongoDB database
    const token = getAuthToken();
    if (!token) return;

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/users/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) {
      console.error('Failed to sync markAsRead with database:', e);
    }
  };

  const markAllAsRead = async () => {
    const hasUnread = notifications.some(n => !n.read);
    if (!hasUnread) return;

    // 1. Immediately update React state
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));

    // 2. Persist in localStorage
    saveAllLocallyReadIds(notifications.map(n => n.id));

    // 3. Persist to MongoDB database
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/notifications/read-all`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("All notifications marked as read");
      }
    } catch (e) {
      console.error('Failed to sync markAllAsRead with database:', e);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));

    if (selectedNotification?.id === notificationId) {
      setSelectedNotification(null);
    }

    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/users/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success("Notification deleted");
      }
    } catch (e) {
      console.error('Failed to sync deleteNotification with database:', e);
    }
  };

  const handleCardClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  const handleSaveSettings = () => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
      toast.success("Notification preferences saved successfully!");
    } catch (e) {
      toast.error("Failed to save preferences.");
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'campaign': return <Megaphone className="w-4 h-4" />;
      case 'stock': return <Package className="w-4 h-4" />;
      case 'price': return <TrendingUp className="w-4 h-4" />;
      case 'new_pharmacy': return <Bell className="w-4 h-4" />;
      case 'order': return <MessageSquare className="w-4 h-4" />;
      case 'system': return <Settings className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'campaign': return 'bg-emerald-600';
      case 'stock': return 'bg-emerald-500';
      case 'price': return 'bg-blue-500';
      case 'new_pharmacy': return 'bg-purple-500';
      case 'order': return 'bg-amber-500';
      case 'system': return 'bg-slate-600';
      default: return 'bg-slate-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 border-red-200 bg-red-50';
      case 'medium': return 'text-amber-600 border-amber-200 bg-amber-50';
      case 'low': return 'text-emerald-600 border-emerald-200 bg-emerald-50';
      default: return 'text-slate-600 border-slate-200 bg-slate-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const alertOptions = [
    {
      id: 'stockAlerts' as const,
      title: 'Stock Alerts',
      description: 'Receive instant alerts when tracked essential medicines are back in stock or inventory runs low',
      icon: Package,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'priceAlerts' as const,
      title: 'Price Alerts',
      description: 'Get notified about price reductions and official tariff changes on subsidized medications',
      icon: TrendingUp,
      color: 'bg-blue-50 text-blue-600 border-blue-200',
    },
    {
      id: 'newPharmacyAlerts' as const,
      title: 'New Pharmacy Alerts',
      description: 'Receive notifications when new certified pharmacies in your area join the MediConnect network',
      icon: Bell,
      color: 'bg-purple-50 text-purple-600 border-purple-200',
    },
    {
      id: 'orderAlerts' as const,
      title: 'Order & Prescription Alerts',
      description: 'Track real-time status updates on customer inquiries, medicine orders, and prescription reviews',
      icon: MessageSquare,
      color: 'bg-amber-50 text-amber-600 border-amber-200',
    },
    {
      id: 'campaignAlerts' as const,
      title: 'National Public Health Campaigns',
      description: 'Receive official MINSANTÉ / ONPC national campaigns, vaccination programs, and emergency directives',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    },
    {
      id: 'systemAlerts' as const,
      title: 'System & Maintenance Alerts',
      description: 'Get updates on platform security, health authority circulars, and scheduled system maintenance',
      icon: Settings,
      color: 'bg-slate-50 text-slate-600 border-slate-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time updates on stock alerts, price changes, verified pharmacies, and system notices
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(false)}
            disabled={isRefreshing || isLoading}
            className="rounded-xl flex items-center gap-1.5 text-gray-700 hover:text-blue-600 hover:border-blue-300 transition-colors"
            title="Refresh notifications"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-700 border border-emerald-200 rounded-xl px-3 py-1 font-semibold text-xs">
            {unreadCount} unread
          </Badge>

          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="hover:bg-blue-600 hover:text-white rounded-xl text-xs transition-colors"
              onClick={markAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-100/80 p-1 rounded-2xl">
          <TabsTrigger
            value="all"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl font-medium"
          >
            All ({notifications.length})
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl font-medium"
          >
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-xl font-medium"
          >
            Settings
          </TabsTrigger>
        </TabsList>

        {/* All Notifications Tab */}
        <TabsContent value="all" className="space-y-3 pt-2">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Loader2 className="h-9 w-9 animate-spin text-blue-600 mb-3" />
              <p className="text-sm text-gray-500 font-medium">Loading notifications from database...</p>
            </div>
          ) : error ? (
            <Card className="rounded-2xl border-red-200 bg-red-50/50 shadow-sm">
              <CardContent className="p-8 text-center text-red-600">
                <AlertCircle className="w-12 h-12 mx-auto mb-3 text-red-500" />
                <h3 className="text-lg font-bold mb-1">Unable to load notifications</h3>
                <p className="text-sm text-red-600/90 mb-4 max-w-md mx-auto">{error}</p>
                <Button
                  onClick={() => fetchNotifications(true)}
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-2" />
                  Retry Connection
                </Button>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card className="rounded-2xl border-dashed border-gray-200">
              <CardContent className="p-12 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-700 mb-1">No notifications yet</h3>
                <p className="text-sm text-gray-500">You're all caught up! New alerts will appear here in real time.</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card
                key={notification.id}
                onClick={() => handleCardClick(notification)}
                className={`rounded-2xl transition-all duration-200 cursor-pointer hover:shadow-md select-none ${
                  !notification.read
                    ? 'border-l-4 border-l-blue-600 bg-blue-50/25 shadow-[0_2px_8px_rgba(37,99,235,0.08)] hover:bg-blue-50/40'
                    : 'border-gray-200/80 bg-white hover:bg-gray-50/60'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl ${getTypeColor(notification.type)} text-white shadow-sm shrink-0`}>
                      {getTypeIcon(notification.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 animate-pulse" title="Unread notification" />
                          )}
                        </div>
                        <Badge variant="outline" className={`rounded-full text-[11px] font-medium shrink-0 px-2.5 py-0.5 ${getPriorityColor(notification.priority)}`}>
                          {notification.priority}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                        {notification.message}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-gray-100">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span>{notification.timestamp}</span>
                        </div>

                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCardClick(notification)}
                            className="h-8 px-2.5 text-xs rounded-xl hover:bg-blue-50 hover:text-blue-700 text-gray-600 flex items-center gap-1"
                            title="View notification details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </Button>

                          {!notification.read && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 px-2.5 text-xs rounded-xl hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 flex items-center gap-1"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Mark read</span>
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                            className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-400"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Unread Notifications Tab */}
        <TabsContent value="unread" className="space-y-3 pt-2">
          {notifications.filter(n => !n.read).length === 0 ? (
            <Card className="rounded-2xl border-dashed border-gray-200">
              <CardContent className="p-12 text-center">
                <Check className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-800 mb-1">All caught up!</h3>
                <p className="text-sm text-gray-500">No unread notifications at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            notifications
              .filter(n => !n.read)
              .map((notification) => (
                <Card
                  key={notification.id}
                  onClick={() => handleCardClick(notification)}
                  className="rounded-2xl border-l-4 border-l-blue-600 bg-blue-50/25 shadow-[0_2px_8px_rgba(37,99,235,0.08)] hover:bg-blue-50/40 hover:shadow-md transition-all duration-200 cursor-pointer select-none"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`p-2.5 rounded-xl ${getTypeColor(notification.type)} text-white shadow-sm shrink-0`}>
                        {getTypeIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                              {notification.title}
                            </h3>
                            <span className="w-2.5 h-2.5 bg-blue-600 rounded-full shrink-0 animate-pulse" title="Unread" />
                          </div>
                          <Badge variant="outline" className={`rounded-full text-[11px] font-medium shrink-0 px-2.5 py-0.5 ${getPriorityColor(notification.priority)}`}>
                            {notification.priority}
                          </Badge>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          {notification.message}
                        </p>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-gray-100">
                          <div className="flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{notification.timestamp}</span>
                          </div>

                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCardClick(notification)}
                              className="h-8 px-2.5 text-xs rounded-xl hover:bg-blue-50 hover:text-blue-700 text-gray-600 flex items-center gap-1"
                              title="View details"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Details</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                              className="h-8 px-2.5 text-xs rounded-xl hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 flex items-center gap-1"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4 text-emerald-600" />
                              <span>Mark read</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteNotification(notification.id)}
                              className="h-8 w-8 p-0 rounded-xl hover:bg-red-50 hover:text-red-600 text-gray-400"
                              title="Delete notification"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4 pt-2">
          <Card className="rounded-2xl border border-gray-200/80 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg font-bold text-gray-900">Notification Preferences</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Choose the categories of alerts you want to receive. Delivery options are handled automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Alert Categories</h4>
                <div className="space-y-3">
                  {alertOptions.map((option) => {
                    const isChecked = settings[option.id];
                    return (
                      <div
                        key={option.id}
                        onClick={() => setSettings(s => ({ ...s, [option.id]: !s[option.id] }))}
                        className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none ${
                          isChecked
                            ? 'border-blue-200 bg-blue-50/20 shadow-xs'
                            : 'border-gray-200/80 bg-white hover:bg-gray-50/70'
                        }`}
                      >
                        <div className="flex items-start gap-3.5 pr-4">
                          <div className={`p-2.5 rounded-xl border ${option.color} shrink-0 mt-0.5 shadow-xs`}>
                            <option.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <Label className="text-sm font-semibold text-gray-900 cursor-pointer block">
                              {option.title}
                            </Label>
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                              {option.description}
                            </p>
                          </div>
                        </div>

                        {/* Perfectly aligned accessible toggle switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isChecked}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSettings(s => ({ ...s, [option.id]: !s[option.id] }));
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                            isChecked ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isChecked ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100">
                <Button
                  onClick={handleSaveSettings}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 shadow-sm flex items-center gap-2 transition-all hover:shadow"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Preferences</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notification Detail Dialog */}
      <Dialog open={!!selectedNotification} onOpenChange={(open) => !open && setSelectedNotification(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6 bg-white shadow-xl">
          {selectedNotification && (
            <div className="space-y-4">
              <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                  <span className={`p-2 rounded-xl text-white shadow-xs ${getTypeColor(selectedNotification.type)}`}>
                    {getTypeIcon(selectedNotification.type)}
                  </span>
                  <Badge variant="outline" className={`rounded-full text-xs font-semibold px-2.5 py-0.5 ${getPriorityColor(selectedNotification.priority)}`}>
                    {selectedNotification.priority.toUpperCase()} PRIORITY
                  </Badge>
                  <span className="text-xs text-gray-400 capitalize">• {selectedNotification.type.replace('_', ' ')}</span>
                </div>
                <DialogTitle className="text-lg font-bold text-gray-900 pt-1 leading-snug">
                  {selectedNotification.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{selectedNotification.timestamp}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="py-2">
                <div className="text-sm text-gray-700 leading-relaxed bg-gray-50/80 p-4 rounded-xl border border-gray-100 whitespace-pre-wrap">
                  {selectedNotification.message}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteNotification(selectedNotification.id)}
                  className="rounded-xl text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <X className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>

                <Button
                  size="sm"
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs px-4"
                  onClick={() => setSelectedNotification(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}