import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Search, Filter, MapPin, Star, Phone, Clock, ShoppingCart, Heart, AlertCircle, CheckCircle, Loader2, Navigation, MessageCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';


interface AlternativeMedicine {
  id: string;
  name: string;
  genericName?: string;
  brand?: string;
}

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  dosage: string;
  form: string;
  category: string;
  description: string;
  price: number;
  alternatives?: AlternativeMedicine[]; // This seems to be from a previous request, I'll keep it.
  sideEffects?: string;
  pharmacies?: {
    name: string;
    location: string;
    distance: string;
    price?: number;
    stock: number;
    rating: number;
    phone: string;
    hours: string;
    latitude?: number;
    longitude?: number;
    distanceInKm?: number;
  }[];
  inventory?: any[];
  closestDistance?: number; // Add this to store the distance to the nearest pharmacy
}

export function MedicineSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Haversine distance formula to calculate distance between two lat/lng points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  };
    const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      // The token is stored at the top level of the session object
      const parsedSession = JSON.parse(session);
      return parsedSession.token;
    }
    return null;
  };

  const fetchMedicines = async (location: { latitude: number; longitude: number } | null) => {
    setIsLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/medicines`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch medicines.');
      }
      const responseData = await response.json();

      // The backend now sends pre-aggregated data. We just need to format it.
      const uniqueMedicines = responseData.data.medicines.map((medicine: any) => {
        const pharmacies = (medicine.inventory || []).map((inv: any) => {
          // The aggregation pipeline already filters for ACTIVE pharmacies.
          // We access pharmacy details from inv.pharmacyDetails now.
          const distance = location && inv.pharmacyDetails.latitude && inv.pharmacyDetails.longitude
            ? calculateDistance(location.latitude, location.longitude, inv.pharmacyDetails.latitude, inv.pharmacyDetails.longitude)
            : Infinity;
      
          const distanceString = distance === Infinity ? 'N/A' : `${distance.toFixed(1)} km`;
          return {
            name: inv.pharmacyDetails.businessName,
            location: inv.pharmacyDetails.businessAddress,
            latitude: inv.pharmacyDetails.latitude,
            longitude: inv.pharmacyDetails.longitude,
            price: inv.price,
            stock: inv.quantity,
            distance: distanceString,
            distanceInKm: distance,
            rating: 4.5, // Mocked for now
            phone: inv.pharmacyDetails.phone || 'N/A',
            hours: inv.pharmacyDetails.operatingHours || 'N/A',
          };
        });

        // Sort pharmacies by distance
        pharmacies.sort((a: any, b: any) => (a.distanceInKm ?? Infinity) - (b.distanceInKm ?? Infinity));

        const prices = (pharmacies || []).map((p: any) => p.price).filter((p: any) => p != null && isFinite(p));
        const lowestPrice = prices.length > 0 ? Math.min(...prices) : medicine.price;
        
        // Find the minimum distance to a pharmacy for this medicine
        const distances = pharmacies.map((p: any) => location && p.latitude && p.longitude ? calculateDistance(location.latitude, location.longitude, p.latitude, p.longitude) : Infinity).filter((d: any) => !isNaN(d));
        const closestDistance = distances.length > 0 ? Math.min(...distances) : Infinity;
        return { ...medicine, id: medicine._id, pharmacies, price: isFinite(lowestPrice) ? lowestPrice : 0, closestDistance };
      });

      setMedicines(uniqueMedicines);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Get user's location first
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          fetchMedicines(location); // Fetch with location
        },
        () => {
          toast.error("Could not get your location. Showing default results.");
          fetchMedicines(null); // Fetch without location
        }
      );
    } else {
      toast.warning("Geolocation is not available. Cannot sort by distance.");
      fetchMedicines(null); // Fetch without location
    }
  }, []);

  const categories = ['all', 'Pain Relief', 'Antibiotics', 'Vitamins', 'Diabetes', 'Heart Disease'];

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Sort by closestDistance, putting medicines with no available pharmacies at the end
    if (a.closestDistance === undefined || isNaN(a.closestDistance)) return 1;
    if (b.closestDistance === undefined || isNaN(b.closestDistance)) return -1;
    return a.closestDistance - b.closestDistance;
  });

  // Effect to save recent searches to localStorage
  useEffect(() => {
    // Only save meaningful searches and when the user stops typing
    const handler = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        const recentSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        
        const newSearch = {
          medicine: searchQuery,
          timestamp: new Date().toISOString(),
          found: filteredMedicines.length > 0
        };

        // Avoid adding duplicate consecutive searches
        if (recentSearches.length === 0 || recentSearches[0].medicine.toLowerCase() !== searchQuery.toLowerCase()) {
          const updatedSearches = [newSearch, ...recentSearches].slice(0, 5); // Keep last 5
          localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
        }
      }
    }, 500); // Debounce to avoid saving on every keystroke

    return () => {
      clearTimeout(handler);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filteredMedicines.length]);

  const handleGetDirections = (latitude?: number, longitude?: number) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    if (!latitude || !longitude) {
      toast.error('Directions are not available for this pharmacy as its location is not set.');
      return;
    }

    const success = (position: GeolocationPosition) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${latitude},${longitude}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    };

    const error = () => toast.error('Unable to retrieve your location. Please ensure location services are enabled.');

    navigator.geolocation.getCurrentPosition(success, error);
  };

  const toggleFavorite = (medicineId: string) => {
    setFavorites(prev => 
      prev.includes(medicineId) 
        ? prev.filter(id => id !== medicineId)
        : [...prev, medicineId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Find Medicines</h1>
        <p className="text-muted-foreground">Search for medications and find the best prices near you</p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 ">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground " />
          <Input
            placeholder="Search medicines by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-3xl"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48 rounded-3xl bg-gray-50">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className='rounded-2xl'>
            {categories.map(category => (
              <SelectItem key={category} value={category} className='hover:bg-purple-500 hover:text-white transition-colors rounded-2xl bg-white'>
                {category === 'all' ? 'All Categories' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results */}
      <div className="space-y-4 ">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading medicines...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load medicines</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : filteredMedicines.length === 0 ? (
          <Card className=''>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No medicines found</h3>
              <p className="text-muted-foreground">Try adjusting your search terms or category filter</p>
            </CardContent>
          </Card>
        ) : (
          filteredMedicines.map((medicine) => (
            <Card key={medicine.id} className="hover:shadow-md transition-shadow rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-start justify-between  ">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{medicine.name}</h3>
                      <Badge variant="secondary" className='bg-green-800 rounded-2xl text-white'>{medicine.category}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(medicine.id)}
                        className="p-1"
                      >
                        <Heart className={`w-4 h-4 ${favorites.includes(medicine.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2 text-gray-500">
                      <span>Generic: {medicine.genericName}</span>
                      <span>•</span>
                      <span>{medicine.dosage}</span>
                      <span>•</span>
                      <span>{medicine.form}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 text-gray-500">{medicine.description}</p>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">From</span>
                        <span className="text-lg font-semibold">{medicine.price} FCFA</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-500">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {medicine.pharmacies?.length || 0} pharmacies nearby
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2  ">
                    <Button variant="outline" onClick={() => {
                      setSelectedMedicine(medicine);
                      setIsModalOpen(true);
                    }}
                      className='rounded-2xl text-black hover:bg-purple-500 hover:text-white transition:colors '
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {selectedMedicine && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen} >
          <DialogContent className="max-w-2xl bg-white  ">
            <DialogHeader>
              <DialogTitle>{selectedMedicine.name} - {selectedMedicine.dosage}</DialogTitle>
              <DialogDescription>
                View details, pharmacy availability, and alternatives for {selectedMedicine.name}.
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 h-auto rounded-lg">
                <TabsTrigger value="info" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-2xl">Information</TabsTrigger>
                <TabsTrigger value="pharmacies" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-2xl">Pharmacies</TabsTrigger>
                <TabsTrigger value="alternatives" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-2xl">Alternatives</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground text-gray-500">{selectedMedicine.description}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Common Side Effects</h4>
                  <div className="flex flex-wrap gap-2 ">
                    {selectedMedicine.sideEffects?.split(',').map((effect, index) => (
                      <Badge key={index} variant="outline" className="rounded-2xl">
                        {effect.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pharmacies" className="max-h-[50vh] overflow-y-auto pr-2">
                <div className="space-y-3">
                {selectedMedicine.pharmacies && selectedMedicine.pharmacies.length > 0 ? ( // This line is correct
                  selectedMedicine.pharmacies.map((pharmacy, index) => (
                    <Card key={index} className="rounded-lg border shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{pharmacy.name}</h4>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              <span>{pharmacy.location}</span> 
                              {pharmacy.distance !== 'N/A' && (
                                <span className="font-semibold text-blue-600">• {pharmacy.distance}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                <span>{pharmacy.rating}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span>{pharmacy.phone}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">{pharmacy.price} FCFA</p>
                            <Badge 
                              variant={pharmacy.stock > 0 ? 'default' : 'destructive'}
                              className={`mt-1 text-xs ${pharmacy.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            >
                              {pharmacy.stock > 0 ? `${pharmacy.stock} in stock` : 'Out of stock'}
                            </Badge>
                            <div className="flex gap-1 mt-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className='rounded-md h-8 w-8 p-0'
                                onClick={() => handleGetDirections(pharmacy.latitude, pharmacy.longitude)}
                                disabled={!pharmacy.latitude || !pharmacy.longitude}
                              >
                                <Navigation className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No pharmacies found for this medicine.</p>
                )}
                </div>
              </TabsContent>

              {/* New TabsContent for Alternatives */}
              <TabsContent value="alternatives" className="space-y-4">
                <h4 className="font-medium mb-2">Alternative Medicines</h4>
                {selectedMedicine.alternatives && selectedMedicine.alternatives.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {selectedMedicine.alternatives.map((alt) => (
                      <Card key={alt.id} className="rounded-xl">
                        <CardContent className="p-4">
                          <h5 className="font-medium">{alt.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            {alt.genericName && `Generic: ${alt.genericName}`}
                            {alt.brand && alt.genericName && ` • `}
                            {alt.brand && `Brand: ${alt.brand}`}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No alternative medicines found for {selectedMedicine.name}.</p>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}