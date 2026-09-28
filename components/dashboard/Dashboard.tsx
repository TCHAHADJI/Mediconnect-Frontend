import React from 'react';
import { PatientDashboard } from './PatientDashboard';
import { PharmacyDashboard } from './PharmacyDashboard';

interface DashboardProps {
  userType: 'patient' | 'pharmacy' | 'admin' | null;
  user: any; // Add user prop
  onNavigateTab?: (tabId: string) => void;
}

export function Dashboard({ userType, user, onNavigateTab }: DashboardProps) {
  switch (userType) {
    case 'patient':
      return <PatientDashboard user={user} onNavigateTab={onNavigateTab} />;
    case 'pharmacy':
      return <PharmacyDashboard user={user} onNavigateTab={onNavigateTab} />;
    default:
      return <PatientDashboard user={user} onNavigateTab={onNavigateTab} />; // Default to patient dashboard
  }
}