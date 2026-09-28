import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical, 
  Shield, 
  User, 
  Store, 
  Mail, 
  Phone,
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Loader2
} from 'lucide-react';

import { useEffect } from 'react';

export function UserManagement() {
  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [users, setUsers] = useState<any>({ patients: [], pharmacies: [], admins: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getAuthToken = () => {
    const session = localStorage.getItem('mediconnect_admin_auth');
    if (session) {
      const parsedSession = JSON.parse(session);
      return parsedSession.token;
    }
    return null;
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      toast.error("Admin authentication token not found.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users.');
      }

      const data = await response.json();
      console.log("Fetched users data:", data);

      if (data.success && Array.isArray(data.data)) {
        const categorizedUsers = { patients: [], pharmacies: [], admins: [] };
        data.data.forEach((user: any) => {
          if (user.userType === 'PATIENT') {
            categorizedUsers.patients.push(user);
          } else if (user.userType === 'PHARMACY') {
            categorizedUsers.pharmacies.push(user);
          } else if (user.userType === 'ADMIN') {
            categorizedUsers.admins.push(user);
          }
        });
        setUsers(categorizedUsers);
      } else {
        // Handle cases where the API response is not as expected
        throw new Error(data.message || 'Invalid data format received from server.');
      }
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const getStatusBadge = (status: string) => {
    const variants = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive',
      PENDING_VERIFICATION: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getStatusIcon = (status: string, verified?: boolean) => {
    if (status === 'ACTIVE') {
      return verified !== false ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    }
    if (status === 'INACTIVE' || status === 'SUSPENDED') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
  };

  const handleUserAction = async (action: string, userId: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Admin authentication token not found.");
      return;
    }

    try {
      let response;
      switch (action) {
        case 'activate':
          response = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'ACTIVE' }),
          });
          if (!response.ok) throw new Error('Failed to activate user.');
          toast.success('User activated successfully');
          break;
        case 'deactivate':
          response = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'INACTIVE' }),
          });
          if (!response.ok) throw new Error('Failed to deactivate user.');
          toast.success('User deactivated successfully');
          break;
        case 'verify':
          response = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'ACTIVE', verificationStatus: true }),
          });
          if (!response.ok) throw new Error('Failed to verify pharmacy.');
          toast.success('Pharmacy verified successfully');
          break;
        case 'suspend':
          response = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'SUSPENDED' }),
          });
          if (!response.ok) throw new Error('Failed to suspend user.');
          toast.success('User suspended successfully');
          break;
        case 'delete':
          response = await fetch(`${import.meta.env.VITE_API_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!response.ok) throw new Error('Failed to delete user.');
          toast.success('User deleted successfully');
          break;
        default:
          break;
      }
      fetchUsers(); // Refresh the user list after action
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const PendingVerificationTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pharmacy</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>License</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
            </TableCell>
          </TableRow>
        ) : (
          users.pharmacies?.filter((pharmacy: any) => pharmacy.status === 'PENDING_VERIFICATION')
            .map((pharmacy: any) => (
              <TableRow key={pharmacy.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{pharmacy.businessName}</p>
                    <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>{pharmacy.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{pharmacy.name}</p>
                      <p className="text-sm text-muted-foreground">{pharmacy.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{pharmacy.licenseNumber}</Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm">
                      <Phone className="w-3 h-3" />
                      {pharmacy.phone}
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Mail className="w-3 h-3" />
                      {pharmacy.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(pharmacy.status, pharmacy.verificationStatus)}
                    {getStatusBadge(pharmacy.status)}
                  </div>
                </TableCell>
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUserAction('verify', pharmacy.id)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify
                  </Button>
                </TableCell>
              </TableRow>
            ))
        )}
      </TableBody>
    </Table>
  );

  const PatientTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Join Date</TableHead>
          <TableHead>Last Login</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.patients?.map((patient) => (
          <TableRow key={patient.id}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{patient.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">{patient.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Phone className="w-3 h-3" />
                  {patient.phone}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="w-3 h-3" />
                  {patient.email}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-sm">
                <MapPin className="w-3 h-3" />
                {patient.address}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(patient.status)}
                {getStatusBadge(patient.status)}
              </div>
            </TableCell>
            <TableCell className="text-sm">{patient.joinDate}</TableCell>
            <TableCell className="text-sm">{patient.lastLogin}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedUser(patient);
                    setShowUserDialog(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUserAction(patient.status === 'ACTIVE' ? 'deactivate' : 'activate', patient.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  const PharmacyTable = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Pharmacy</TableHead>
          <TableHead>Owner</TableHead>
          <TableHead>License</TableHead>
          <TableHead>Contact</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Verification</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.pharmacies?.map((pharmacy) => (
          <TableRow key={pharmacy.id}>
            <TableCell>
              <div>
                <p className="font-medium">{pharmacy.businessName}</p>
                <p className="text-sm text-muted-foreground">{pharmacy.address}</p>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{pharmacy.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{pharmacy.name}</p>
                  <p className="text-sm text-muted-foreground">{pharmacy.email}</p>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{pharmacy.licenseNumber}</Badge>
            </TableCell>
            <TableCell>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-sm">
                  <Phone className="w-3 h-3" />
                  {pharmacy.phone}
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Mail className="w-3 h-3" />
                  {pharmacy.email}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                {getStatusIcon(pharmacy.status, pharmacy.verificationStatus)}
                {getStatusBadge(pharmacy.status)}
              </div>
            </TableCell>
            <TableCell>
              {pharmacy.verificationStatus ? (
                <Badge className="bg-green-100 text-green-800">Verified</Badge>
              ) : (
                <Badge variant="outline" className="text-yellow-700">
                  Pending
                </Badge>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedUser(pharmacy);
                    setShowUserDialog(true);
                  }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
                {!pharmacy.verificationStatus && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleUserAction('verify', pharmacy.id)}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleUserAction(pharmacy.status === 'ACTIVE' ? 'suspend' : 'activate', pharmacy.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4  " />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80 rounded-2xl "
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='rounded-2xl bg-white'>
              <SelectItem value="all" className=' hover:bg-purple-600 hover:text-white rounded-2xl'>All Status</SelectItem>
              <SelectItem value="active" className=' hover:bg-purple-600 hover:text-white rounded-2xl'>Active</SelectItem>
              <SelectItem value="inactive" className=' hover:bg-purple-600 hover:text-white rounded-2xl'>Inactive</SelectItem>
              <SelectItem value="pending" className=' hover:bg-purple-600 hover:text-white rounded-2xl'>Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className='bg-blue-600 text-white rounded-2xl'>
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <User className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{users.patients?.length}</p>
                <p className="text-sm text-muted-foreground">Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Store className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{users.pharmacies?.length}</p>
                <p className="text-sm text-muted-foreground">Pharmacies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{users.admins?.length}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">
                  {users.pharmacies?.filter((p: any) => p.status === 'PENDING_VERIFICATION').length}
                </p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Tables */}
      <Card className='rounded-2xl'>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-100 rounded-2xl p-1">
              <TabsTrigger value="pending" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-2xl">Pending Verifications</TabsTrigger>
              <TabsTrigger value="patients" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-2xl">Patients</TabsTrigger>
              <TabsTrigger value="pharmacies" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-2xl">Pharmacies</TabsTrigger>
              <TabsTrigger value="admins" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-2xl">Administrators</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-6">
              <PendingVerificationTable />
            </TabsContent>
            
            <TabsContent value="patients" className="mt-6">
              <PatientTable />
            </TabsContent>
            
            <TabsContent value="pharmacies" className="mt-6">
              <PharmacyTable />
            </TabsContent>
            
            <TabsContent value="admins" className="mt-6">
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Admin management coming soon</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className="max-w-2xl">
           <DialogHeader>
             <DialogTitle>User Details</DialogTitle>
             <p className="text-sm text-muted-foreground">
               Viewing details for {selectedUser?.name}. You can manage their status from here.
             </p>
           </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16">
                  <AvatarFallback className="text-lg">
                    {selectedUser.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  {selectedUser.businessName && (
                    <p className="text-sm text-blue-600">{selectedUser.businessName}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <p className="mt-1">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label>Join Date</Label>
                  <p className="mt-1">{selectedUser.joinDate}</p>
                </div>
                <div>
                  <Label>Last Login</Label>
                  <p className="mt-1">{selectedUser.lastLogin}</p>
                </div>
                {selectedUser.address && (
                  <div className="col-span-2">
                    <Label>Address</Label>
                    <p className="mt-1">{selectedUser.address}</p>
                  </div>
                )}
                {selectedUser.licenseNumber && (
                  <div>
                    <Label>License Number</Label>
                    <p className="mt-1">{selectedUser.licenseNumber}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  variant={selectedUser.status === 'ACTIVE' ? 'destructive' : 'default'}
                  onClick={() => {
                    handleUserAction(selectedUser.status === 'ACTIVE' ? 'deactivate' : 'activate', selectedUser.id);
                    setShowUserDialog(false);
                  }}
                >
                  {selectedUser.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                </Button>
                {selectedUser.licenseNumber && !selectedUser.verificationStatus && (
                  <Button 
                    onClick={() => {
                      handleUserAction('verify', selectedUser.id);
                      setShowUserDialog(false);
                    }}
                  >
                    Verify Pharmacy
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowUserDialog(false)}>
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