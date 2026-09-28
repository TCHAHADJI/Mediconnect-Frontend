import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Search, Heart, Shield, Pill, AlertTriangle, Sun, Activity, Brain, Stethoscope, Phone, Loader2 } from 'lucide-react';

interface HealthTip {
  _id: string;
  title: string;
  content: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  views: number;
}

export function HealthTips() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [healthTips, setHealthTips] = useState<HealthTip[]>([]);
  const [viewingTip, setViewingTip] = useState<HealthTip | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTips = async () => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('userSession') ? JSON.parse(localStorage.getItem('userSession')!).token : null;
      if (!token) {
        setError("You must be logged in to view health tips.");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/health-tips`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch health tips.');
        const result = await response.json();
        if (result.success) {
          setHealthTips(result.data);
        } else {
          throw new Error(result.message);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTips();
  }, []);

  const handleViewTip = async (tip: HealthTip) => {
    setViewingTip(tip);

    // Optimistically update the UI
    setHealthTips(prevTips =>
      prevTips.map(t =>
        t._id === tip._id ? { ...t, views: (t.views || 0) + 1 } : t
      )
    );

    const token = localStorage.getItem('userSession') ? JSON.parse(localStorage.getItem('userSession')!).token : null;
    if (token) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL}/health-tips/${tip._id}/view`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } catch (err) {
        // If the API call fails, we could revert the optimistic update, but for a view count it's low-risk.
        console.error("Failed to increment view count on server:", err);
      }
    }
  };

  // Dynamic categories computed from loaded tips so all tips in DB match their filters
  const categories = React.useMemo(() => {
    const catsSet = new Set<string>();
    healthTips.forEach(tip => {
      if (tip.category) catsSet.add(tip.category.trim());
    });
    
    const dynamicList = Array.from(catsSet).map(cat => ({
      id: cat,
      label: cat,
      icon: <Shield className="w-4 h-4" />
    }));

    return [
      { id: 'all', label: 'All Tips', icon: <Heart className="w-4 h-4" /> },
      ...dynamicList
    ];
  }, [healthTips]);

  const filteredTips = healthTips.filter(tip => {
    const matchesSearch = tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tip.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tip.tags || []).some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || 
                           tip.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const emergencyNumbers = [
    { service: 'Fire Service', number: '18' },
    { service: 'Police', number: '17' },
    { service: 'Medical Emergency', number: '15' },
    { service: 'General Emergency', number: '112' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Health Tips</h1>
        <p className="text-muted-foreground">
          Essential health information to keep you and your family healthy in Cameroon
        </p>
      </div>

      {/* Emergency Alert */}
      <Alert className="border-red-200 bg-red-50 rounded-2xl">
        <AlertTriangle className="w-4 h-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Medical Emergency?</strong> Call 15 for immediate medical assistance or go to the nearest hospital.
        </AlertDescription>
      </Alert>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search health tips..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
      </div>

      <Tabs defaultValue="tips" className="w-full">
       <TabsList className="grid w-full grid-cols-3 bg-gray-50 rounded-2xl">
        <TabsTrigger
          value="tips"
          className="data-[state=active]:bg-white rounded-2xl" // This is the key line
        >
          Health Tips
        </TabsTrigger>
        <TabsTrigger
          value="emergency"
          className="data-[state=active]:bg-white rounded-2xl" // This is the key line
        >
          Emergency Info
        </TabsTrigger>
        <TabsTrigger
          value="resources"
          className="data-[state=active]:bg-white rounded-2xl" // This is the key line
        >
          Resources
        </TabsTrigger>
      </TabsList>

        {/* Health Tips Tab */}
        <TabsContent value="tips" className="space-y-6 rounded-2xl">
          {/* Categories */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="flex items-center gap-2  hover:bg-purple-600 hover:text-white active:bg-blue-600 rounded-2xl"
              >
                {category.icon}
                {category.label}
              </Button>
            ))}
          </div>

          {/* Tips Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoading ? (
              <div className="col-span-full flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : error ? (
              <div className="col-span-full text-center p-8 text-red-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Error loading tips</h3>
                <p>{error}</p>
              </div>
            ) : filteredTips.length === 0 ? (
              <div className="col-span-full">
                <Card className='rounded-2xl'>
                  <CardContent className="p-8 text-center">
                    <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No tips found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || selectedCategory !== 'all' ? 'Try adjusting your search or category filter.' : 'No health tips have been published yet.'}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              filteredTips.map((tip) => (
                <Card 
                  key={tip._id} 
                  className="hover:shadow-md transition-shadow rounded-2xl cursor-pointer"
                  onClick={() => handleViewTip(tip)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base leading-tight">{tip.title}</CardTitle>
                      <Badge variant={getPriorityBadge(tip.priority)} className="ml-2 text-xs bg-red-600 text-white rounded-3xl">
                        {tip.priority}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground mb-3 text-gray-500">{tip.content}</p>
                    <div className="flex flex-wrap gap-1">
                      {(tip.tags || []).slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs rounded">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Emergency Info Tab */}
        <TabsContent value="emergency" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
            {/* Emergency Numbers */}
            <Card className='rounded-2xl'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  Emergency Numbers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {emergencyNumbers.map((emergency, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted bg-blue-50 rounded-2xl">
                    <span className="text-sm font-medium">{emergency.service}</span>
                    <a 
                      href={`tel:${emergency.number}`}
                      className="text-lg font-bold text-primary hover:underline text-blue-600"
                    >
                      {emergency.number}
                    </a>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Warning Signs */}
            <Card className='rounded-2xl'>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  When to Seek Emergency Care
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    'Difficulty breathing or shortness of breath',
                    'Chest pain or pressure',
                    'Severe bleeding that won\'t stop',
                    'Loss of consciousness',
                    'High fever in children (over 39°C)',
                    'Signs of stroke (facial drooping, arm weakness, speech difficulty)',
                    'Severe allergic reactions',
                    'Head injury with confusion or vomiting'
                  ].map((symptom, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{symptom}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* First Aid Basics */}
          <Card className='rounded-2xl'>
            <CardHeader>
              <CardTitle>Basic First Aid</CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="cuts">
                  <AccordionTrigger>Treating Cuts and Wounds</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>1. Clean your hands with soap and water</p>
                      <p>2. Stop the bleeding by applying direct pressure with a clean cloth</p>
                      <p>3. Clean the wound with clean water</p>
                      <p>4. Apply antibiotic ointment if available</p>
                      <p>5. Cover with a sterile bandage</p>
                      <p>6. Seek medical attention for deep cuts or if bleeding doesn't stop</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="fever">
                  <AccordionTrigger>Managing Fever</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>1. Stay hydrated - drink plenty of fluids</p>
                      <p>2. Rest in a cool, comfortable environment</p>
                      <p>3. Use cool compresses on forehead and wrists</p>
                      <p>4. Take paracetamol as directed for comfort</p>
                      <p>5. Seek medical care if fever exceeds 39°C or persists</p>
                      <p>6. For children, seek immediate care for fever over 38°C</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="burns">
                  <AccordionTrigger>Treating Minor Burns</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-2 text-sm">
                      <p>1. Cool the burn with clean, cool water for 10-20 minutes</p>
                      <p>2. Remove jewelry or tight clothing near the burn</p>
                      <p>3. Cover with a sterile, non-stick bandage</p>
                      <p>4. Take pain relievers if needed</p>
                      <p>5. Do NOT use ice, butter, or oil on burns</p>
                      <p>6. Seek medical attention for large or severe burns</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Health Institutions */}
            <Card className='rounded-2xl'>
              <CardHeader>
                <CardTitle>Major Health Institutions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 ">
                {[
                  { name: 'Centre Hospitalier et Universitaire de Yaoundé', location: 'Yaoundé' },
                  { name: 'Hôpital Général de Douala', location: 'Douala' },
                  { name: 'Hôpital Central de Yaoundé', location: 'Yaoundé' },
                  { name: 'Hôpital Laquintinie', location: 'Douala' }
                ].map((hospital, index) => (
                  <div key={index} className="p-3 border rounded-2xl">
                    <p className="font-medium text-sm">{hospital.name}</p>
                    <p className="text-xs text-muted-foreground text-gray-500">{hospital.location}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Health Education */}
            <Card className='rounded-2xl'>
              <CardHeader>
                <CardTitle>Health Education Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  'Malaria prevention and treatment',
                  'Maternal and child health',
                  'HIV/AIDS prevention',
                  'Tuberculosis awareness',
                  'Nutrition and food safety',
                  'Water sanitation and hygiene',
                  'Mental health awareness',
                  'Chronic disease management'
                ].map((topic, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary text-blue-600" />
                    <span className="text-sm">{topic}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Health Calendar */}
          <Card className='rounded-2xl'>
            <CardHeader>
              <CardTitle>Health Awareness Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { month: 'February', event: 'Heart Health Month' },
                  { month: 'April', event: 'World Malaria Day (25th)' },
                  { month: 'May', event: 'World Hypertension Day (17th)' },
                  { month: 'July', event: 'World Hepatitis Day (28th)' },
                  { month: 'October', event: 'Breast Cancer Awareness Month' },
                  { month: 'December', event: 'World AIDS Day (1st)' }
                ].map((event, index) => (
                  <div key={index} className="p-3 bg-muted rounded-2xl bg-blue-50">
                    <p className="font-medium text-sm">{event.month}</p>
                    <p className="text-xs text-muted-foreground text-gray-500">{event.event}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Health Tip Dialog */}
      <Dialog open={!!viewingTip} onOpenChange={(isOpen) => !isOpen && setViewingTip(null)}>
        <DialogContent className="max-w-2xl bg-white">
          {viewingTip && (
            <>
              <DialogHeader>
                <DialogTitle>{viewingTip.title}</DialogTitle>
                <DialogDescription>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <Badge variant="outline">{viewingTip.category.replace('_', ' ')}</Badge>
                    <span>By {viewingTip.author || 'MediConnect Team'}</span>
                    <span>•</span>
                    <span>{viewingTip.views || 0} views</span>
                  </div>
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingTip.content}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}