export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  level: number; // Higher number = more permissions
}

// Define all available permissions
export const PERMISSIONS: Record<string, Permission> = {
  // User Management
  'users.view': {
    id: 'users.view',
    name: 'View Users',
    description: 'View user accounts and basic information',
    category: 'User Management'
  },
  'users.create': {
    id: 'users.create',
    name: 'Create Users',
    description: 'Create new user accounts',
    category: 'User Management'
  },
  'users.edit': {
    id: 'users.edit',
    name: 'Edit Users',
    description: 'Modify user account information',
    category: 'User Management'
  },
  'users.delete': {
    id: 'users.delete',
    name: 'Delete Users',
    description: 'Delete user accounts',
    category: 'User Management'
  },
  'users.suspend': {
    id: 'users.suspend',
    name: 'Suspend Users',
    description: 'Suspend or reactivate user accounts',
    category: 'User Management'
  },

  // Pharmacy Management
  'pharmacies.view': {
    id: 'pharmacies.view',
    name: 'View Pharmacies',
    description: 'View pharmacy information and details',
    category: 'Pharmacy Management'
  },
  'pharmacies.verify': {
    id: 'pharmacies.verify',
    name: 'Verify Pharmacies',
    description: 'Approve or reject pharmacy verification requests',
    category: 'Pharmacy Management'
  },
  'pharmacies.edit': {
    id: 'pharmacies.edit',
    name: 'Edit Pharmacies',
    description: 'Modify pharmacy information',
    category: 'Pharmacy Management'
  },
  'pharmacies.suspend': {
    id: 'pharmacies.suspend',
    name: 'Suspend Pharmacies',
    description: 'Suspend or reactivate pharmacy accounts',
    category: 'Pharmacy Management'
  },

  // Medicine Management
  'medicines.view': {
    id: 'medicines.view',
    name: 'View Medicines',
    description: 'View medicine database and information',
    category: 'Medicine Management'
  },
  'medicines.create': {
    id: 'medicines.create',
    name: 'Add Medicines',
    description: 'Add new medicines to the database',
    category: 'Medicine Management'
  },
  'medicines.edit': {
    id: 'medicines.edit',
    name: 'Edit Medicines',
    description: 'Modify medicine information',
    category: 'Medicine Management'
  },
  'medicines.delete': {
    id: 'medicines.delete',
    name: 'Delete Medicines',
    description: 'Remove medicines from the database',
    category: 'Medicine Management'
  },

  // Inventory Management
  'inventory.view': {
    id: 'inventory.view',
    name: 'View Inventory',
    description: 'Monitor pharmacy inventory levels',
    category: 'Inventory Management'
  },
  'inventory.alerts': {
    id: 'inventory.alerts',
    name: 'Manage Alerts',
    description: 'Configure inventory alert settings',
    category: 'Inventory Management'
  },

  // Content Management
  'content.view': {
    id: 'content.view',
    name: 'View Content',
    description: 'View health tips and educational content',
    category: 'Content Management'
  },
  'content.create': {
    id: 'content.create',
    name: 'Create Content',
    description: 'Create health tips and educational content',
    category: 'Content Management'
  },
  'content.edit': {
    id: 'content.edit',
    name: 'Edit Content',
    description: 'Modify existing content',
    category: 'Content Management'
  },
  'content.delete': {
    id: 'content.delete',
    name: 'Delete Content',
    description: 'Remove content from the platform',
    category: 'Content Management'
  },

  // Analytics & Reports
  'analytics.view': {
    id: 'analytics.view',
    name: 'View Analytics',
    description: 'Access system analytics and reports',
    category: 'Analytics & Reports'
  },
  'reports.export': {
    id: 'reports.export',
    name: 'Export Reports',
    description: 'Export reports and data',
    category: 'Analytics & Reports'
  },

  // System Administration
  'system.settings': {
    id: 'system.settings',
    name: 'System Settings',
    description: 'Configure system-wide settings',
    category: 'System Administration'
  },
  'system.backup': {
    id: 'system.backup',
    name: 'System Backup',
    description: 'Create and manage system backups',
    category: 'System Administration'
  },
  'system.maintenance': {
    id: 'system.maintenance',
    name: 'System Maintenance',
    description: 'Perform system maintenance tasks',
    category: 'System Administration'
  },

  // Audit & Security
  'audit.view': {
    id: 'audit.view',
    name: 'View Audit Logs',
    description: 'Access system audit logs and security events',
    category: 'Audit & Security'
  },
  'security.manage': {
    id: 'security.manage',
    name: 'Manage Security',
    description: 'Configure security settings and policies',
    category: 'Audit & Security'
  },

  // Admin Management
  'admins.view': {
    id: 'admins.view',
    name: 'View Admins',
    description: 'View administrator accounts',
    category: 'Admin Management'
  },
  'admins.create': {
    id: 'admins.create',
    name: 'Create Admins',
    description: 'Create new administrator accounts',
    category: 'Admin Management'
  },
  'admins.edit': {
    id: 'admins.edit',
    name: 'Edit Admins',
    description: 'Modify administrator accounts',
    category: 'Admin Management'
  },
  'admins.delete': {
    id: 'admins.delete',
    name: 'Delete Admins',
    description: 'Remove administrator accounts',
    category: 'Admin Management'
  }
};

// Define roles with their permissions
export const ROLES: Record<string, Role> = {
  'content_admin': {
    id: 'content_admin',
    name: 'Content Administrator',
    description: 'Manages health tips, educational content, and basic user support',
    level: 1,
    permissions: [
      'content.view',
      'content.create',
      'content.edit',
      'content.delete',
      'users.view',
      'pharmacies.view',
      'medicines.view',
      'analytics.view'
    ]
  },
  'pharmacy_admin': {
    id: 'pharmacy_admin',
    name: 'Pharmacy Administrator',
    description: 'Manages pharmacy verifications, inventory monitoring, and medicine database',
    level: 2,
    permissions: [
      'pharmacies.view',
      'pharmacies.verify',
      'pharmacies.edit',
      'medicines.view',
      'medicines.create',
      'medicines.edit',
      'inventory.view',
      'inventory.alerts',
      'users.view',
      'content.view',
      'analytics.view',
      'reports.export'
    ]
  },
  'user_admin': {
    id: 'user_admin',
    name: 'User Administrator',
    description: 'Manages user accounts, handles user support, and monitors user activities',
    level: 2,
    permissions: [
      'users.view',
      'users.create',
      'users.edit',
      'users.suspend',
      'pharmacies.view',
      'medicines.view',
      'content.view',
      'analytics.view',
      'audit.view'
    ]
  },
  'system_admin': {
    id: 'system_admin',
    name: 'System Administrator',
    description: 'Full system access with advanced administrative capabilities',
    level: 3,
    permissions: [
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.suspend',
      'pharmacies.view',
      'pharmacies.verify',
      'pharmacies.edit',
      'pharmacies.suspend',
      'medicines.view',
      'medicines.create',
      'medicines.edit',
      'medicines.delete',
      'inventory.view',
      'inventory.alerts',
      'content.view',
      'content.create',
      'content.edit',
      'content.delete',
      'analytics.view',
      'reports.export',
      'system.settings',
      'system.backup',
      'audit.view',
      'security.manage',
      'admins.view',
      'admins.create',
      'admins.edit'
    ]
  },
  'super_admin': {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Ultimate system access with all permissions including admin management',
    level: 4,
    permissions: Object.keys(PERMISSIONS) // All permissions
  }
};

// Permission checking utility
export class PermissionManager {
  static hasPermission(userRole: string, permission: string): boolean {
    const role = ROLES[userRole];
    if (!role) return false;
    return role.permissions.includes(permission);
  }

  static hasAnyPermission(userRole: string, permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission));
  }

  static hasAllPermissions(userRole: string, permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission));
  }

  static canAccessFeature(userRole: string, requiredPermissions: string[]): boolean {
    return this.hasAnyPermission(userRole, requiredPermissions);
  }

  static getUserPermissions(userRole: string): Permission[] {
    const role = ROLES[userRole];
    if (!role) return [];
    
    return role.permissions.map(permId => PERMISSIONS[permId]).filter(Boolean);
  }

  static getAvailableRoles(): Role[] {
    return Object.values(ROLES);
  }

  static getRoleLevel(userRole: string): number {
    const role = ROLES[userRole];
    return role?.level || 0;
  }

  static canManageRole(managerRole: string, targetRole: string): boolean {
    const managerLevel = this.getRoleLevel(managerRole);
    const targetLevel = this.getRoleLevel(targetRole);
    
    // Can only manage roles with lower or equal level, but not super_admin unless you are super_admin
    if (targetRole === 'super_admin' && managerRole !== 'super_admin') {
      return false;
    }
    
    return managerLevel >= targetLevel;
  }
}