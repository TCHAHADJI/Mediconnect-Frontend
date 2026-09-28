export const mockAuditLogs = [
  {
    id: 1,
    userId: 'admin1',
    userName: 'System Admin',
    action: 'CREATE',
    resource: 'Medicine',
    resourceId: 'med123',
    details: { name: 'New Medicine Added' },
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...',
    timestamp: '2024-12-19 14:30:00'
  },
  {
    id: 2,
    userId: 'pharmacy1',
    userName: 'Dr. Paul Mballa',
    action: 'UPDATE',
    resource: 'Inventory',
    resourceId: 'inv456',
    details: { quantity: 50, price: 25.00 },
    ipAddress: '192.168.1.101',
    userAgent: 'Mozilla/5.0...',
    timestamp: '2024-12-19 13:45:00'
  },
  {
    id: 3,
    userId: 'patient1',
    userName: 'Marie Ngozi',
    action: 'LOGIN',
    resource: 'User',
    resourceId: 'patient1',
    details: { loginMethod: 'email' },
    ipAddress: '192.168.1.102',
    userAgent: 'Mozilla/5.0...',
    timestamp: '2024-12-19 12:15:00'
  },
  {
    id: 4,
    userId: 'pharmacy2',
    userName: 'Dr. Fatima Hassan',
    action: 'DELETE',
    resource: 'Inventory',
    resourceId: 'inv789',
    details: { medicineName: 'Expired Medicine' },
    ipAddress: '192.168.1.103',
    userAgent: 'Mozilla/5.0...',
    timestamp: '2024-12-19 11:20:00'
  }
];

export const actionTypes = ['all', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'] as const;
export const resourceTypes = ['all', 'User', 'Medicine', 'Inventory', 'Pharmacy'] as const;