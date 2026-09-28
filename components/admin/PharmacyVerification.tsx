import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Download,
  Eye,
  Loader2
} from 'lucide-react';

export function PharmacyVerification() {
  const [pharmacies, setPharmacies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<any>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_VERIFICATION');
  const [statusCounts, setStatusCounts] = useState({
    ACTIVE: 0,
    INACTIVE: 0,
    SUSPENDED: 0,
    PENDING_VERIFICATION: 0,
    total: 0,
  });

  useEffect(() => {
    const counts = {
      ACTIVE: 0,
      INACTIVE: 0,
      SUSPENDED: 0,
      PENDING_VERIFICATION: 0,
      total: pharmacies.length,
    };

    pharmacies.forEach((pharmacy) => {
      if (counts.hasOwnProperty(pharmacy.status)) {
        counts[pharmacy.status]++;
      }
    });
    setStatusCounts(counts);
  }, [pharmacies]);

  const getAuthToken = () => {
    const session = localStorage.getItem('mediconnect_admin_auth');
    if (session) {
      const parsedSession = JSON.parse(session);
      return parsedSession.token;
    }
    return null;
  };

  const fetchPharmacies = async () => {
    setIsLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      toast.error("Admin authentication token not found.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/pharmacies`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Backend error:", errorData);
        throw new Error(errorData.message || 'Failed to fetch pharmacies.');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setPharmacies(data.data);
      } else {
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
    fetchPharmacies();
  }, [statusFilter]);

  const handleVerify = async (pharmacyId: string, approved: boolean) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Admin authentication token not found.");
      return;
    }

    const status = approved ? 'ACTIVE' : 'INACTIVE';
    const action = approved ? 'approved' : 'rejected';

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/pharmacies/${pharmacyId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status, verificationNotes }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} pharmacy.`);
      }

      toast.success(`Pharmacy ${action} successfully`);
      setShowDetails(false);
      setSelectedPharmacy(null);
      setVerificationNotes('');
      // Refresh the list
      fetchPharmacies();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const formatOperatingHours = (hours: any) => {
    if (!hours) return null;
    return Object.entries(hours).map(([day, time]: [string, any]) => (
      <div key={day} className="flex justify-between text-sm">
        <span className="capitalize">{day}:</span>
        <span>
          {time.open === 'closed' ? 'Closed' : `${time.open} - ${time.close}`}
        </span>
      </div>
    ));
  };

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

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card >
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.total}</p>
                <p className="text-sm text-muted-foreground">Total Pharmacies</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.ACTIVE}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.PENDING_VERIFICATION}</p>
                <p className="text-sm text-muted-foreground">Pending Verification</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.SUSPENDED}</p>
                <p className="text-sm text-muted-foreground">Suspended</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{statusCounts.INACTIVE}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Other stats can be fetched from an aggregate endpoint if needed */}
      </div>

      {/* Pending Verifications */}
      <Card className='rounded-2xl'>
        <CardHeader>
          <CardTitle>Pharmacy Verifications</CardTitle>
        </CardHeader>
        <CardContent >
          <div className="flex justify-end mb-4 ">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48 rounded-2xl bg-gray-50">
                <SelectValue placeholder="Filter by Status" />
              </SelectTrigger>
              <SelectContent className='rounded-2xl bg-white'>
                <SelectItem value="all" className='hover:bg-purple-600 hover:text-white rounded-2xl'>All Status</SelectItem>
                <SelectItem value="PENDING_VERIFICATION" className='hover:bg-purple-600 hover:text-white rounded-2xl'>Pending Verification</SelectItem>
                <SelectItem value="ACTIVE" className='hover:bg-purple-600 hover:text-white rounded-2xl'>Active</SelectItem>
                <SelectItem value="REJECTED" className='hover:bg-purple-600 hover:text-white rounded-2xl'>Rejected</SelectItem>
                <SelectItem value="SUSPENDED" className='hover:bg-purple-600 hover:text-white rounded-2xl'>Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-muted-foreground">Loading pharmacies...</span>
            </div>
          ) : error ? (
            <div className="text-center p-8 text-red-500">
              <p>Failed to load data.</p>
              <p>{error}</p>
            </div>
          ) : (
            <div className="space-y-4 ">
              {pharmacies.filter(p => statusFilter === 'all' || p.status === statusFilter).map((pharmacy) => (
                <div key={pharmacy._id} className="border rounded-2xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{pharmacy.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <div>
                          <h3 className="font-semibold">{pharmacy.businessName}</h3>
                          <p className="text-sm text-muted-foreground">Owner: {pharmacy.name}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {pharmacy.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {pharmacy.phone}
                          </div>
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            License: {pharmacy.licenseNumber}
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            {pharmacy.businessAddress}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            Submitted: {new Date(pharmacy.createdAt).toLocaleDateString()}
                          </Badge>
                          <div className="flex items-center gap-2">
                          {getStatusIcon(pharmacy.status, pharmacy.verificationStatus)}
                          {getStatusBadge(pharmacy.status)}
                        </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPharmacy(pharmacy);
                          setShowDetails(true);
                        }}
                        className='rounded-2xl bg-blue-600 text-white hover:bg-blue-700'
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {pharmacies.filter(p => statusFilter === 'all' || p.status === statusFilter).length === 0 && (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pharmacies found with the selected status.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle>Pharmacy Verification Review</DialogTitle>
          </DialogHeader>
          
          {selectedPharmacy && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Business Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>Business Name:</strong> {selectedPharmacy.businessName}</p>
                      <p><strong>Address:</strong> {selectedPharmacy.businessAddress}</p>
                      <p><strong>License Number:</strong> {selectedPharmacy.licenseNumber}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Owner Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p><strong>Name:</strong> {selectedPharmacy.name}</p>
                      <p><strong>Email:</strong> {selectedPharmacy.email}</p>
                      <p><strong>Phone:</strong> {selectedPharmacy.phone}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Operating Hours</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {formatOperatingHours(selectedPharmacy.operatingHours)}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Verification Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" asChild>
                        <a href={selectedPharmacy.verificationDocument} target="_blank" rel="noopener noreferrer">
                          <Download className="w-4 h-4 mr-2" />
                          Download Document
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div>
                <Label htmlFor="verificationNotes">Verification Notes</Label>
                <Textarea
                  id="verificationNotes"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add notes for approval or rejection..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleVerify(selectedPharmacy._id, true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                  Approve & Verify
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleVerify(selectedPharmacy._id, false)}
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                  Reject Application
                </Button>
                <Button variant="outline" onClick={() => setShowDetails(false)} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
