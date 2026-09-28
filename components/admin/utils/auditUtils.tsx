import React from 'react';
import { User, Shield, Database, Settings, Eye, Plus, Edit, Trash2, Lock, Unlock, Check, X, Download, Upload, RefreshCw, Bell } from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  timestamp: Date;
  action: string;
  userId: string;
  userEmail?: string;
  userRole?: string;
  targetId?: string;
  targetType?: string;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  success: boolean;
}

// Audit action categories and their configurations
export const AUDIT_ACTIONS = {
  // Authentication & Session
  LOGIN_SUCCESS: { category: 'Authentication', severity: 'low', icon: Lock },
  LOGIN_FAILED: { category: 'Authentication', severity: 'medium', icon: X },
  LOGOUT: { category: 'Authentication', severity: 'low', icon: Unlock },
  SESSION_EXPIRED: { category: 'Authentication', severity: 'low', icon: RefreshCw },
  SESSION_REFRESHED: { category: 'Authentication', severity: 'low', icon: RefreshCw },
  SESSION_RESTORED: { category: 'Authentication', severity: 'low', icon: RefreshCw },
  PASSWORD_CHANGED: { category: 'Authentication', severity: 'medium', icon: Lock },
  ACCOUNT_LOCKED: { category: 'Authentication', severity: 'high', icon: Lock },

  // User Management
  USER_CREATED: { category: 'User Management', severity: 'medium', icon: Plus },
  USER_UPDATED: { category: 'User Management', severity: 'medium', icon: Edit },
  USER_DELETED: { category: 'User Management', severity: 'high', icon: Trash2 },
  USER_SUSPENDED: { category: 'User Management', severity: 'high', icon: Lock },
  USER_REACTIVATED: { category: 'User Management', severity: 'medium', icon: Unlock },
  USER_ROLE_CHANGED: { category: 'User Management', severity: 'high', icon: Shield },

  // Pharmacy Management
  PHARMACY_CREATED: { category: 'Pharmacy Management', severity: 'medium', icon: Plus },
  PHARMACY_UPDATED: { category: 'Pharmacy Management', severity: 'medium', icon: Edit },
  PHARMACY_VERIFIED: { category: 'Pharmacy Management', severity: 'high', icon: Check },
  PHARMACY_REJECTED: { category: 'Pharmacy Management', severity: 'high', icon: X },
  PHARMACY_SUSPENDED: { category: 'Pharmacy Management', severity: 'high', icon: Lock },
  PHARMACY_REACTIVATED: { category: 'Pharmacy Management', severity: 'medium', icon: Unlock },

  // Medicine Management
  MEDICINE_CREATED: { category: 'Medicine Management', severity: 'medium', icon: Plus },
  MEDICINE_UPDATED: { category: 'Medicine Management', severity: 'medium', icon: Edit },
  MEDICINE_DELETED: { category: 'Medicine Management', severity: 'high', icon: Trash2 },
  MEDICINE_APPROVED: { category: 'Medicine Management', severity: 'medium', icon: Check },
  MEDICINE_REJECTED: { category: 'Medicine Management', severity: 'medium', icon: X },

  // Content Management
  CONTENT_CREATED: { category: 'Content Management', severity: 'low', icon: Plus },
  CONTENT_UPDATED: { category: 'Content Management', severity: 'low', icon: Edit },
  CONTENT_DELETED: { category: 'Content Management', severity: 'medium', icon: Trash2 },
  CONTENT_PUBLISHED: { category: 'Content Management', severity: 'low', icon: Check },
  CONTENT_UNPUBLISHED: { category: 'Content Management', severity: 'low', icon: X },

  // System Administration
  SETTINGS_UPDATED: { category: 'System Administration', severity: 'high', icon: Settings },
  BACKUP_CREATED: { category: 'System Administration', severity: 'medium', icon: Database },
  RESTORE_PERFORMED: { category: 'System Administration', severity: 'critical', icon: Database },
  MAINTENANCE_STARTED: { category: 'System Administration', severity: 'high', icon: Settings },
  MAINTENANCE_COMPLETED: { category: 'System Administration', severity: 'medium', icon: Settings },

  // Data Operations
  DATA_EXPORTED: { category: 'Data Operations', severity: 'medium', icon: Download },
  DATA_IMPORTED: { category: 'Data Operations', severity: 'high', icon: Upload },
  BULK_UPDATE: { category: 'Data Operations', severity: 'high', icon: Edit },
  BULK_DELETE: { category: 'Data Operations', severity: 'critical', icon: Trash2 },

  // Security Events
  SECURITY_POLICY_UPDATED: { category: 'Security', severity: 'critical', icon: Shield },
  SUSPICIOUS_ACTIVITY: { category: 'Security', severity: 'critical', icon: Eye },
  ACCESS_DENIED: { category: 'Security', severity: 'medium', icon: X },
  PERMISSION_GRANTED: { category: 'Security', severity: 'medium', icon: Check },
  PERMISSION_REVOKED: { category: 'Security', severity: 'high', icon: X },

  // Notifications
  NOTIFICATION_SENT: { category: 'Notifications', severity: 'low', icon: Bell },
  ALERT_TRIGGERED: { category: 'Notifications', severity: 'medium', icon: Bell },
  CRITICAL_ALERT: { category: 'Notifications', severity: 'critical', icon: Bell },

  // Admin Management
  ADMIN_CREATED: { category: 'Admin Management', severity: 'critical', icon: Shield },
  ADMIN_UPDATED: { category: 'Admin Management', severity: 'high', icon: Edit },
  ADMIN_DELETED: { category: 'Admin Management', severity: 'critical', icon: Trash2 },
  ADMIN_ROLE_CHANGED: { category: 'Admin Management', severity: 'critical', icon: Shield },

  // General
  VIEW_ACCESSED: { category: 'General', severity: 'low', icon: Eye },
  REPORT_GENERATED: { category: 'General', severity: 'low', icon: Download },
  FEATURE_USED: { category: 'General', severity: 'low', icon: Eye }
} as const;

export type AuditActionType = keyof typeof AUDIT_ACTIONS;

class AuditLoggerClass {
  private logs: AuditLogEntry[] = [];
  private maxLogs = 10000; // Keep last 10k logs in memory

  constructor() {
    this.loadLogs();
  }

  private loadLogs(): void {
    try {
      const savedLogs = localStorage.getItem('mediconnect_audit_logs');
      if (savedLogs) {
        const parsedLogs = JSON.parse(savedLogs);
        this.logs = parsedLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      this.logs = [];
    }
  }

  private saveLogs(): void {
    try {
      // Keep only the most recent logs
      const logsToSave = this.logs.slice(-this.maxLogs);
      localStorage.setItem('mediconnect_audit_logs', JSON.stringify(logsToSave));
    } catch (error) {
      console.error('Error saving audit logs:', error);
    }
  }

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(
    action: AuditActionType,
    userId: string,
    details: Record<string, any> = {},
    targetId?: string,
    targetType?: string
  ): void {
    const actionConfig = AUDIT_ACTIONS[action];
    
    const logEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      action,
      userId,
      userEmail: details.userEmail,
      userRole: details.userRole,
      targetId,
      targetType,
      details,
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || navigator.userAgent,
      severity: actionConfig.severity,
      category: actionConfig.category,
      success: details.success !== false // Default to true unless explicitly false
    };

    this.logs.push(logEntry);
    this.saveLogs();

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${action}:`, logEntry);
    }

    // In production, you would also send this to your backend
    this.sendToBackend(logEntry);
  }

  private async sendToBackend(logEntry: AuditLogEntry): Promise<void> {
    try {
      // In production, send to your audit logging service
      // await fetch('/api/audit-logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(logEntry)
      // });
    } catch (error) {
      console.error('Failed to send audit log to backend:', error);
    }
  }

  getLogs(filters?: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    action?: AuditActionType;
    category?: string;
    severity?: string;
    limit?: number;
  }): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filters) {
      const { startDate, endDate, userId, action, category, severity, limit } = filters;

      if (startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= startDate);
      }

      if (endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= endDate);
      }

      if (userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === userId);
      }

      if (action) {
        filteredLogs = filteredLogs.filter(log => log.action === action);
      }

      if (category) {
        filteredLogs = filteredLogs.filter(log => log.category === category);
      }

      if (severity) {
        filteredLogs = filteredLogs.filter(log => log.severity === severity);
      }

      if (limit) {
        filteredLogs = filteredLogs.slice(-limit);
      }
    }

    // Sort by timestamp (newest first)
    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getStats(): {
    totalLogs: number;
    todayLogs: number;
    criticalLogs: number;
    categories: Record<string, number>;
    severities: Record<string, number>;
  } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = this.logs.filter(log => log.timestamp >= today);
    const criticalLogs = this.logs.filter(log => log.severity === 'critical');

    const categories: Record<string, number> = {};
    const severities: Record<string, number> = {};

    this.logs.forEach(log => {
      categories[log.category] = (categories[log.category] || 0) + 1;
      severities[log.severity] = (severities[log.severity] || 0) + 1;
    });

    return {
      totalLogs: this.logs.length,
      todayLogs: todayLogs.length,
      criticalLogs: criticalLogs.length,
      categories,
      severities
    };
  }

  exportLogs(format: 'json' | 'csv' = 'json'): string {
    if (format === 'json') {
      return JSON.stringify(this.logs, null, 2);
    } else if (format === 'csv') {
      const headers = [
        'Timestamp',
        'Action',
        'User ID',
        'User Email',
        'Category',
        'Severity',
        'Success',
        'IP Address',
        'Details'
      ];

      const csvRows = [
        headers.join(','),
        ...this.logs.map(log => [
          log.timestamp.toISOString(),
          log.action,
          log.userId,
          log.userEmail || '',
          log.category,
          log.severity,
          log.success,
          log.ipAddress || '',
          JSON.stringify(log.details).replace(/"/g, '""')
        ].join(','))
      ];

      return csvRows.join('\n');
    }

    return '';
  }

  clearLogs(): void {
    this.logs = [];
    localStorage.removeItem('mediconnect_audit_logs');
  }

  // Security monitoring functions
  detectSuspiciousActivity(userId: string): boolean {
    const recentLogs = this.getLogs({
      startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      userId
    });

    // Check for multiple failed logins
    const failedLogins = recentLogs.filter(log => log.action === 'LOGIN_FAILED').length;
    if (failedLogins >= 3) {
      this.log('SUSPICIOUS_ACTIVITY', userId, {
        reason: 'Multiple failed login attempts',
        count: failedLogins
      });
      return true;
    }

    // Check for rapid consecutive actions
    if (recentLogs.length > 50) {
      this.log('SUSPICIOUS_ACTIVITY', userId, {
        reason: 'Excessive activity',
        count: recentLogs.length
      });
      return true;
    }

    return false;
  }
}

// Singleton instance
export const AuditLogger = new AuditLoggerClass();

// React component for displaying audit action icons
export function AuditActionIcon({ action, className = "w-4 h-4" }: { action: AuditActionType; className?: string }) {
  const actionConfig = AUDIT_ACTIONS[action];
  const IconComponent = actionConfig?.icon || Eye;
  
  return <IconComponent className={className} />;
}

// Helper function to get severity color
export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'low': return 'text-green-600 bg-green-50';
    case 'medium': return 'text-yellow-600 bg-yellow-50';
    case 'high': return 'text-orange-600 bg-orange-50';
    case 'critical': return 'text-red-600 bg-red-50';
    default: return 'text-gray-600 bg-gray-50';
  }
}

// Helper function to format audit details
export function formatAuditDetails(details: Record<string, any>): string {
  const filteredDetails = { ...details };
  
  // Remove sensitive information
  delete filteredDetails.password;
  delete filteredDetails.token;
  delete filteredDetails.sessionId;
  delete filteredDetails.userAgent;
  
  // Format common fields
  const formatted: string[] = [];
  
  if (filteredDetails.reason) {
    formatted.push(`Reason: ${filteredDetails.reason}`);
  }
  
  if (filteredDetails.targetName) {
    formatted.push(`Target: ${filteredDetails.targetName}`);
  }
  
  if (filteredDetails.changes) {
    formatted.push(`Changes: ${JSON.stringify(filteredDetails.changes)}`);
  }
  
  if (filteredDetails.count) {
    formatted.push(`Count: ${filteredDetails.count}`);
  }
  
  return formatted.join(', ') || 'No additional details';
}

// Missing function exports that were causing the build errors

// Get action icon - returns the icon component for an action
export function getActionIcon(action: AuditActionType): React.ComponentType<{ className?: string }> {
  const actionConfig = AUDIT_ACTIONS[action];
  return actionConfig?.icon || Eye;
}

// Get action badge - returns badge styling based on severity
export function getActionBadge(severity: string): { 
  className: string; 
  label: string; 
  color: string 
} {
  switch (severity) {
    case 'low':
      return {
        className: 'bg-green-100 text-green-800 border-green-200',
        label: 'Low',
        color: 'green'
      };
    case 'medium':
      return {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Medium',
        color: 'yellow'
      };
    case 'high':
      return {
        className: 'bg-orange-100 text-orange-800 border-orange-200',
        label: 'High',
        color: 'orange'
      };
    case 'critical':
      return {
        className: 'bg-red-100 text-red-800 border-red-200',
        label: 'Critical',
        color: 'red'
      };
    default:
      return {
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Unknown',
        color: 'gray'
      };
  }
}

// Filter logs utility function
export function filterLogs(
  logs: AuditLogEntry[],
  filters: {
    search?: string;
    category?: string;
    severity?: string;
    dateRange?: {
      from: Date;
      to: Date;
    };
    userId?: string;
    action?: string;
  }
): AuditLogEntry[] {
  let filteredLogs = [...logs];

  // Search filter (searches in action, user email, details)
  if (filters.search && filters.search.trim()) {
    const searchTerm = filters.search.toLowerCase().trim();
    filteredLogs = filteredLogs.filter(log => 
      log.action.toLowerCase().includes(searchTerm) ||
      log.userEmail?.toLowerCase().includes(searchTerm) ||
      log.category.toLowerCase().includes(searchTerm) ||
      JSON.stringify(log.details).toLowerCase().includes(searchTerm)
    );
  }

  // Category filter
  if (filters.category && filters.category !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.category === filters.category);
  }

  // Severity filter
  if (filters.severity && filters.severity !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
  }

  // Date range filter
  if (filters.dateRange) {
    filteredLogs = filteredLogs.filter(log => 
      log.timestamp >= filters.dateRange!.from && 
      log.timestamp <= filters.dateRange!.to
    );
  }

  // User ID filter
  if (filters.userId && filters.userId.trim()) {
    filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
  }

  // Action filter
  if (filters.action && filters.action !== 'all') {
    filteredLogs = filteredLogs.filter(log => log.action === filters.action);
  }

  return filteredLogs;
}

// Get unique categories from logs
export function getUniqueCategories(logs: AuditLogEntry[]): string[] {
  const categories = [...new Set(logs.map(log => log.category))];
  return categories.sort();
}

// Get unique severities from logs  
export function getUniqueSeverities(logs: AuditLogEntry[]): string[] {
  const severities = [...new Set(logs.map(log => log.severity))];
  return severities.sort((a, b) => {
    const order = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return (order[a as keyof typeof order] || 5) - (order[b as keyof typeof order] || 5);
  });
}

// Get unique actions from logs
export function getUniqueActions(logs: AuditLogEntry[]): AuditActionType[] {
  const actions = [...new Set(logs.map(log => log.action as AuditActionType))];
  return actions.sort();
}

// Get logs summary statistics
export function getLogsSummary(logs: AuditLogEntry[]): {
  total: number;
  byCategory: Record<string, number>;
  bySeverity: Record<string, number>;
  recentActivity: AuditLogEntry[];
  criticalAlerts: AuditLogEntry[];
} {
  const byCategory: Record<string, number> = {};
  const bySeverity: Record<string, number> = {};

  logs.forEach(log => {
    byCategory[log.category] = (byCategory[log.category] || 0) + 1;
    bySeverity[log.severity] = (bySeverity[log.severity] || 0) + 1;
  });

  // Get recent activity (last 24 hours)
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentActivity = logs
    .filter(log => log.timestamp >= yesterday)
    .slice(0, 10);

  // Get critical alerts
  const criticalAlerts = logs
    .filter(log => log.severity === 'critical')
    .slice(0, 5);

  return {
    total: logs.length,
    byCategory,
    bySeverity,
    recentActivity,
    criticalAlerts
  };
}