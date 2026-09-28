import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Search, MapPin, Phone, Clock, Star, Filter, Navigation, Heart, MessageCircle, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';


interface Pharmacy {
  id: string;
  name: string;
  location: string; // This is the address
  address: string;
  distance?: string;
  rating: number;
  reviews: number;
  phone: string;
  hours: string;
  status: 'open' | 'closed' | 'closing_soon' | 'on_duty';
  isOnDuty?: boolean;
  realTimeStatus?: 'OPEN' | 'ON_DUTY' | 'CLOSED';
  dutySchedule?: any;
  services: string[];
  specialties: string[];
  latitude?: number;
  longitude?: number;
  distanceInKm?: number; // Add this for sorting
  medicines: {
    name: string;
    price: number;
    stock: number;
  }[];
}

interface FetchedPharmacy {
  _id: string;
  businessName: string;
  businessAddress: string;
  phone: string;
  operatingHours: any;
  latitude?: number;
  longitude?: number;
  name: string; // This is the owner's name
  isOnDuty?: boolean;
  realTimeStatus?: 'OPEN' | 'ON_DUTY' | 'CLOSED';
  dutySchedule?: any;
}

export function PharmacyFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [sortBy, setSortBy] = useState('distance');
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedPharmacy, setSelectedPharmacy] = useState<Pharmacy | null>(null);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

    const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      // The token is stored at the top level of the session object
      const parsedSession = JSON.parse(session);
      return parsedSession.token;
    }
    return null;
  };
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

  useEffect(() => {
    const fetchAndProcessPharmacies = async (location: { latitude: number; longitude: number } | null) => {
      setIsLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        toast.error("Authentication token not found. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/pharmacies/approved`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch pharmacies.');
        }
        const responseData = await response.json();
        if (!responseData.success || !Array.isArray(responseData.data)) {
          throw new Error(responseData.message || 'Invalid data format received from server.');
        }

        const formattedPharmacies = responseData.data.map((p: FetchedPharmacy) => {
          const distanceInKm = location && p.latitude && p.longitude
            ? calculateDistance(location.latitude, location.longitude, p.latitude, p.longitude)
            : Infinity;

          return {
            id: p._id,
            name: p.businessName,
            location: p.businessAddress,
            address: p.businessAddress,
            phone: p.phone,
            hours: typeof p.operatingHours === 'string' ? p.operatingHours : (p.dutySchedule?.nightDuty?.is24Hours ? '24h/24 Continu' : '08:00 - 20:00 (Garde 20h-08h)'),
            latitude: p.latitude,
            longitude: p.longitude,
            distance: distanceInKm === Infinity ? 'N/A' : `${distanceInKm.toFixed(1)} km`,
            distanceInKm: distanceInKm,
            rating: 4.8,
            reviews: 12,
            status: p.realTimeStatus === 'ON_DUTY' || p.isOnDuty ? 'on_duty' : (p.realTimeStatus === 'CLOSED' ? 'closed' : 'open'),
            isOnDuty: p.realTimeStatus === 'ON_DUTY' || p.isOnDuty,
            realTimeStatus: p.realTimeStatus || (p.isOnDuty ? 'ON_DUTY' : 'OPEN'),
            dutySchedule: p.dutySchedule,
            services: ['Prescription', 'Consultation', 'Garde de Nuit'],
            specialties: ['Générale', 'Pédiatrie', 'Urgence'],
            medicines: [],
          };
        });
        setPharmacies(formattedPharmacies);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Get user's location first
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setUserLocation(location);
          fetchAndProcessPharmacies(location);
        },
        (error) => {
          let message = "Could not get your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message += "Please allow location access in your browser.";
              break;
            case error.POSITION_UNAVAILABLE:
              message += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              message += "The request to get your location timed out.";
              break;
          }
          toast.error(message);
          fetchAndProcessPharmacies(null);
        }
      );
    } else {
      toast.warning("Geolocation is not available. Cannot sort by distance.");
      fetchAndProcessPharmacies(null);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !map || pharmacies.length === 0 || pharmacies.some(p => p.reviews > 0)) {
      // Don't run if map isn't loaded, no pharmacies, or if ratings have already been fetched
      return;
    }

    const placesService = new window.google.maps.places.PlacesService(map);

    const pharmaciesWithRatings = pharmacies.map(pharmacy => {
      return new Promise<Pharmacy>(resolve => {
        const request = {
          query: `${pharmacy.name}, ${pharmacy.address}`,
          fields: ['name', 'rating', 'user_ratings_total'],
        };

        placesService.findPlaceFromQuery(request, (results, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
            const place = results[0];
            resolve({
              ...pharmacy,
              rating: place.rating || pharmacy.rating,
              reviews: place.user_ratings_total || pharmacy.reviews,
            });
          } else {
            // If not found, resolve with the original pharmacy data
            resolve(pharmacy);
          }
        });
      });
    });

    Promise.all(pharmaciesWithRatings).then(updatedPharmacies => {
      setPharmacies(updatedPharmacies);
    });

  }, [isLoaded, map, pharmacies]);

  const mapContainerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '1rem',
  };
  const center = { lat: 4.0483, lng: 9.7043 }; // Default center to Douala

  const cities = ['all', 'Douala', 'Yaoundé', 'Bamenda', 'Bafoussam', 'Garoua'];

  const filteredPharmacies = (pharmacies || []).filter(pharmacy => {
    const matchesSearch = pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         pharmacy.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || pharmacy.location.includes(selectedCity);
    return matchesSearch && matchesCity;
  });

  const sortedPharmacies = [...filteredPharmacies].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'distance':
        if (a.distanceInKm === undefined || isNaN(a.distanceInKm)) return 1;
        if (b.distanceInKm === undefined || isNaN(b.distanceInKm)) return -1;
        return a.distanceInKm - b.distanceInKm;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const toggleFavorite = (pharmacyId: string) => {
    setFavorites(prev => 
      prev.includes(pharmacyId) 
        ? prev.filter(id => id !== pharmacyId)
        : [...prev, pharmacyId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on_duty': return 'bg-emerald-500 animate-pulse';
      case 'open': return 'bg-green-500';
      case 'closed': return 'bg-red-500';
      case 'closing_soon': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'on_duty': return 'DE GARDE (24h/24 & Nuit)';
      case 'open': return 'Ouvert';
      case 'closed': return 'Fermé';
      case 'closing_soon': return 'Fermeture Proche';
      default: return 'Information';
    }
  };

  const handleGetDirections = (pharmacy: Pharmacy) => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    if (!pharmacy.latitude || !pharmacy.longitude) {
      toast.error('Directions are not available for this pharmacy as its location is not set.');
      return;
    }

    const success = (position: GeolocationPosition) => {
      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const pharmacyLat = pharmacy.latitude!;
      const pharmacyLng = pharmacy.longitude!;
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${pharmacyLat},${pharmacyLng}&travelmode=driving`;
      window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let message = 'Unable to retrieve your location. ';
      switch (error.code) {
        case error.PERMISSION_DENIED:
          message += 'You denied the request for Geolocation. Please enable it in your browser settings.';
          break;
        case error.POSITION_UNAVAILABLE:
          message += 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          message += 'The request to get your location timed out.';
          break;
      }
      toast.error(message);
    };

    navigator.geolocation.getCurrentPosition(success, errorCallback);
  };

  const handleSendMessage = async () => {
    if (!selectedPharmacy || !messageContent.trim()) {
      toast.error("Message content cannot be empty.");
      return;
    }

    setIsSendingMessage(true);
    const token = getAuthToken();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          recipientId: selectedPharmacy.id,
          content: messageContent,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to send message.');
      }

      toast.success('Message sent successfully!');
      setIsMessageDialogOpen(false);
      setMessageContent('');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <div className="space-y-6  ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Find Pharmacies</h1>
          <p className="text-muted-foreground">Locate nearby pharmacies and check their services</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            onClick={() => setViewMode('list')}
            className='rounded-2xl hover:bg-blue-600 hover:text-white transition-colors'
          >
            List View
          </Button>
          <Button
            variant={viewMode === 'map' ? 'default' : 'outline'}
            onClick={() => setViewMode('map')}
            className='rounded-2xl hover:bg-blue-600 hover:text-white transition-colors'
          >
            Map View
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search pharmacies by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-3xl"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-32  bg-gray-50 rounded-2xl">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent className='rounded-2xl '>
              {cities.map(city => (
                <SelectItem key={city} value={city} className=' rounded-2xl hover:bg-purple-500 hover:text-white transition-colors'>
                  {city === 'all' ? 'All Cities' : city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32 bg-gray-50 rounded-2xl">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className='rounded-2xl bg-white text-black' >
              <SelectItem value="distance" className=' hover:bg-purple-500 hover:text-white transition-colors rounded-2xl'>Distance</SelectItem>
              <SelectItem value="rating" className=' hover:bg-purple-500 hover:text-white transition-colors rounded-2xl'>Rating</SelectItem>
              <SelectItem value="name" className=' hover:bg-purple-500 hover:text-white transition-colors rounded-2xl'>Name</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>


      {viewMode === 'list' ? (
        isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-muted-foreground">Loading pharmacies...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-500">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Failed to load pharmacies</h3>
              <p className="text-muted-foreground">{error}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedPharmacies.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No pharmacies found</h3>
                <p className="text-muted-foreground">Try adjusting your search terms or city filter</p>
              </CardContent>
            </Card>) 
            : (sortedPharmacies.map((pharmacy) => (
              <Card key={pharmacy.id} className="hover:shadow-md transition-shadow rounded-2xl">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{pharmacy.name[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-semibold">{pharmacy.name}</h3>
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(pharmacy.status)}`} />
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{getStatusText(pharmacy.status)}</span>
                          </div>
                          {(pharmacy.status === 'on_duty' || pharmacy.isOnDuty) && (
                            <Badge className="bg-emerald-600 text-white font-bold text-xs animate-pulse flex items-center gap-1 shadow-sm">
                              🌙 PHARMACIE DE GARDE
                            </Badge>
                          )}
                        </div>

                        {pharmacy.isOnDuty && pharmacy.dutySchedule?.nightDuty?.emergencyInstructions && (
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 p-2 rounded-xl border border-emerald-200 dark:border-emerald-800 mb-2 font-medium">
                            🔔 {pharmacy.dutySchedule.nightDuty.emergencyInstructions}
                            {pharmacy.dutySchedule?.nightDuty?.onCallPhone && (
                              <span className="ml-2 font-mono font-bold underline">
                                Urgence: {pharmacy.dutySchedule.nightDuty.onCallPhone}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{pharmacy.location}</span>
                          {pharmacy.distance && <span>• {pharmacy.distance}</span>}
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm">{pharmacy.rating}</span>
                            <span className="text-sm text-muted-foreground text-gray-500">({pharmacy.reviews})</span>
                          </div>
                          <span className="text-sm text-muted-foreground text-gray-500">•</span>
                          <Clock className="w-4 h-4 text-muted-foreground  text-gray-500" />
                          <span className="text-sm text-muted-foreground  text-gray-500">{pharmacy.hours}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {pharmacy.services.slice(0, 3).map((service, index) => (
                            <Badge key={index} variant="secondary" className="text-xs bg-green-700 rounded-3xl text-white">
                              {service}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span>{pharmacy.medicines.length} medicines available</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(pharmacy.id)}
                          className='rounded-2xl hover:bg-purple-500 hover:text-white transition-colors'
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(pharmacy.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </Button>
                        <Button variant="outline" size="sm" className='rounded-2xl hover:bg-purple-500 hover:text-white transition-colors'>
                          <Phone className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className='rounded-2xl hover:bg-purple-500 hover:text-white transition-colors'
                          onClick={() => handleGetDirections(pharmacy)}
                          disabled={!pharmacy.latitude || !pharmacy.longitude}>
                          <Navigation className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <Button size="sm" className='bg-blue-500 text-white rounded-2xl' onClick={() => setSelectedPharmacy(pharmacy)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )))}
          
        </div>
      )) : viewMode === 'map' ? (
        <Card>
          <CardContent className="p-4">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={center}
                zoom={12}
                onLoad={(mapInstance) => setMap(mapInstance)}
              >
                {sortedPharmacies.map(pharmacy => (
                  (pharmacy.latitude && pharmacy.longitude) && (
                    <Marker
                      key={pharmacy.id}
                      position={{ lat: pharmacy.latitude, lng: pharmacy.longitude }}
                      title={pharmacy.name}
                      onClick={() => setSelectedPharmacy(pharmacy)}
                    >
                      {selectedPharmacy?.id === pharmacy.id && (
                        <InfoWindow onCloseClick={() => setSelectedPharmacy(null)}>
                          <div><h4>{pharmacy.name}</h4><p>{pharmacy.address}</p></div>
                        </InfoWindow>
                      )}
                    </Marker>
                  )
                ))}
              </GoogleMap>
            ) : (
              <div className="h-[500px] flex items-center justify-center bg-gray-200 rounded-2xl">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {selectedPharmacy && (
        <Dialog open={!!selectedPharmacy} onOpenChange={(isOpen) => !isOpen && setSelectedPharmacy(null)}>
          <DialogContent className="max-w-2xl bg-white rounded-3xl">
            <DialogHeader>
              <DialogTitle>{selectedPharmacy.name}</DialogTitle>
              <DialogDescription>
                Detailed information for {selectedPharmacy.name}, including contact details, services, and available medicines.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground text-gray-500" />
                    <span>{selectedPharmacy.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground  text-gray-500" />
                    <span>{selectedPharmacy.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground  text-gray-500" />
                    <span>{selectedPharmacy.hours}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Services</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPharmacy.services.map((service, index) => (
                    <Badge key={index} variant="outline" className='rounded-2xl'>{service}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPharmacy.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary" className='bg-green-700 text-white rounded-3xl'>{specialty}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Available Medicines</h4>
                {/* This part can be implemented when medicine data is available per pharmacy */}
                <p className="text-sm text-muted-foreground">Medicine availability details coming soon.</p>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1 bg-blue-500 text-white rounded-2xl">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Now
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1 text-black hover:bg-purple-500 hover:text-white rounded-2xl"
                  onClick={() => setIsMessageDialogOpen(true)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-black hover:bg-purple-500 hover:text-white rounded-2xl"
                  onClick={() => handleGetDirections(selectedPharmacy)}
                  disabled={!selectedPharmacy.latitude || !selectedPharmacy.longitude}
                >
                  <Navigation className="w-4 h-4 mr-2" />
                  Directions
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedPharmacy && (
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="max-w-lg bg-white rounded-3xl">
            <DialogHeader>
              <DialogTitle>Send a message to {selectedPharmacy.name}</DialogTitle>
              <DialogDescription>
                Your message will be sent directly to the pharmacy. They will be notified and can respond to you.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Textarea
                placeholder="Type your message here..."
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className="min-h-[120px] rounded-2xl"
              />
              <Button onClick={handleSendMessage} disabled={isSendingMessage} className="w-full bg-blue-500 text-white rounded-2xl">
                {isSendingMessage ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageCircle className="w-4 h-4 mr-2" />}
                {isSendingMessage ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}