import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Pill, 
  Package, 
  AlertTriangle,
  CheckCircle,
  Eye,
  Link,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data for medicines
const mockMedicines = [
  {
    id: 'med1',
    name: 'Paracetamol',
    genericName: 'Acetaminophen',
    brand: 'Tylenol',
    category: 'Pain Relief',
    form: 'Tablet',
    dosage: '500mg',
    requiresPrescription: false,
    activeIngredient: 'Acetaminophen',
    description: 'Pain reliever and fever reducer',
    sideEffects: 'Nausea, stomach pain',
    instructions: 'Take with food, maximum 4g per day',
    createdAt: '2024-01-15',
    inStock: 5,
    totalPharmacies: 8
  },
  {
    id: 'med2',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    brand: 'Amoxil',
    category: 'Antibiotics',
    form: 'Capsule',
    dosage: '250mg',
    requiresPrescription: true,
    activeIngredient: 'Amoxicillin',
    description: 'Antibiotic for bacterial infections',
    sideEffects: 'Diarrhea, nausea, allergic reactions',
    instructions: 'Complete full course as prescribed',
    createdAt: '2024-01-20',
    inStock: 3,
    totalPharmacies: 5
  },
  {
    id: 'med3',
    name: 'Aspirin',
    genericName: 'Acetylsalicylic Acid',
    brand: 'Bayer',
    category: 'Pain Relief',
    form: 'Tablet',
    dosage: '100mg',
    requiresPrescription: false,
    activeIngredient: 'Acetylsalicylic Acid',
    description: 'Pain reliever and blood thinner',
    sideEffects: 'Stomach irritation, bleeding',
    instructions: 'Take with food to reduce stomach upset',
    createdAt: '2024-02-01',
    inStock: 2,
    totalPharmacies: 4
  }
];

const categories = ['Pain Relief', 'Antibiotics', 'Diabetes', 'Vitamins', 'Cardiovascular', 'Respiratory'];
const forms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops'];

export function MedicineManagement() {
  const [medicines, setMedicines] = useState(mockMedicines);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [showMedicineDialog, setShowMedicineDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         medicine.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || medicine.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleAddMedicine = () => {
    setFormData({
      name: '',
      genericName: '',
      brand: '',
      category: '',
      form: '',
      dosage: '',
      requiresPrescription: false,
      activeIngredient: '',
      description: '',
      sideEffects: '',
      instructions: ''
    });
    setEditMode(true);
    setShowMedicineDialog(true);
  };

  const handleEditMedicine = (medicine: any) => {
    setFormData(medicine);
    setSelectedMedicine(medicine);
    setEditMode(true);
    setShowMedicineDialog(true);
  };

  const handleViewMedicine = (medicine: any) => {
    setSelectedMedicine(medicine);
    setEditMode(false);
    setShowMedicineDialog(true);
  };

  const handleSaveMedicine = () => {
    if (selectedMedicine) {
      // Update existing
      setMedicines(prev => prev.map(m => m.id === selectedMedicine.id ? { ...formData, id: selectedMedicine.id } : m));
      toast.success('Medicine updated successfully');
    } else {
      // Add new
      const newMedicine = { ...formData, id: `med${Date.now()}`, createdAt: new Date().toISOString().split('T')[0], inStock: 0, totalPharmacies: 0 };
      setMedicines(prev => [...prev, newMedicine]);
      toast.success('Medicine added successfully');
    }
    setShowMedicineDialog(false);
    setSelectedMedicine(null);
    setFormData({});
  };

  const handleDeleteMedicine = (medicineId: string) => {
    setMedicines(prev => prev.filter(m => m.id !== medicineId));
    toast.success('Medicine deleted successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80 rounded-2xl"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40 rounded-2xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className='bg-white rounded-2xl W-40'>
              <SelectItem value="all" className="hover:bg-purple-600 hover:text-white rounded-2xl">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category} value={category} className="hover:bg-purple-600 hover:text-white rounded-2xl">{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddMedicine} className='bg-blue-600 text-white rounded-2xl'>
          <Plus className="w-4 h-4 mr-2" />
          Add Medicine
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Pill className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{medicines.length}</p>
                <p className="text-sm text-muted-foreground">Total Medicines</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{medicines.filter(m => m.inStock > 0).length}</p>
                <p className="text-sm text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{medicines.filter(m => m.requiresPrescription).length}</p>
                <p className="text-sm text-muted-foreground">Prescription Only</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{categories.length}</p>
                <p className="text-sm text-muted-foreground">Categories</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Medicines Table */}
      <Card className='rounded-2xl'>
        <CardHeader>
          <CardTitle className='text-bold'>Medicine Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Form & Dosage</TableHead>
                <TableHead>Prescription</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMedicines.map((medicine) => (
                <TableRow key={medicine.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{medicine.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {medicine.genericName} ({medicine.brand})
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{medicine.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{medicine.form}</p>
                      <p className="text-muted-foreground">{medicine.dosage}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {medicine.requiresPrescription ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="default">OTC</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p>{medicine.inStock} pharmacies</p>
                      <p className="text-muted-foreground">of {medicine.totalPharmacies} total</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{medicine.createdAt}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewMedicine(medicine)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditMedicine(medicine)}
                      >
                        <Edit className="w-4 h-4 text-yellow-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteMedicine(medicine.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Medicine Dialog */}
      <Dialog open={showMedicineDialog} onOpenChange={setShowMedicineDialog} >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white ">
          <DialogHeader>
            <DialogTitle>
              {editMode ? (selectedMedicine ? 'Edit Medicine' : 'Add Medicine') : 'Medicine Details'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {editMode ? 'Fill in the details to add or update a medicine in the catalog.' : `Viewing details for ${selectedMedicine?.name}.`}
            </p>
          </DialogHeader>
          
          {editMode ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Medicine Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Paracetamol"
                    className='rounded-2xl'
                  />
                </div>
                <div>
                  <Label htmlFor="genericName">Generic Name</Label>
                  <Input
                    id="genericName"
                    value={formData.genericName || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, genericName: e.target.value }))}
                    placeholder="e.g., Acetaminophen"
                     className='rounded-2xl'
                  />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                    placeholder="e.g., Tylenol"
                     className='rounded-2xl'
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className='rounded-2xl'>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className=' bg-white rounded-2xl '>
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className='rounded-2xl hover:bg-purple-600 hover:text-white '>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="form">Form *</Label>
                  <Select value={formData.form || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, form: value }))}>
                    <SelectTrigger className='rounded-2xl'>
                      <SelectValue placeholder="Select form" />
                    </SelectTrigger>
                    <SelectContent className=' bg-white rounded-2xl '>
                      {forms.map(form => (
                        <SelectItem key={form} value={form}className='rounded-2xl hover:bg-purple-600 hover:text-white '>{form}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dosage">Dosage</Label>
                  <Input
                    id="dosage"
                    value={formData.dosage || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                    className='rounded-2xl'
                  />
                </div>
                <div>
                  <Label htmlFor="activeIngredient">Active Ingredient</Label>
                  <Input
                    id="activeIngredient"
                    value={formData.activeIngredient || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, activeIngredient: e.target.value }))}
                    placeholder="e.g., Acetaminophen"
                    className='rounded-2xl'
                  />
                </div>
                <div>
                  <Label htmlFor="prescription">Prescription Status</Label>
                  <Select
                    value={formData.requiresPrescription ? 'required' : 'otc'}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, requiresPrescription: value === 'required' }))}
                  >
                    <SelectTrigger id="prescription" className="rounded-2xl">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white rounded-2xl">
                      <SelectItem value="required" className="rounded-md hover:bg-purple-600 hover:text-white">Required</SelectItem>
                      <SelectItem value="otc" className="rounded-md hover:bg-purple-600 hover:text-white">
                        OTC (Over-the-Counter)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of the medicine"
                  rows={3}
                  className='rounded-2xl'
                />
              </div>

              <div>
                <Label htmlFor="sideEffects">Side Effects</Label>
                <Textarea
                  id="sideEffects"
                  value={formData.sideEffects || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, sideEffects: e.target.value }))}
                  placeholder="Common side effects"
                  rows={3}
                  className='rounded-2xl'
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Usage instructions"
                  rows={3}
                  className='rounded-2xl'
                />
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSaveMedicine} className='bg-blue-600 text-white rounded-2xl'>
                  {selectedMedicine ? 'Update Medicine' : 'Add Medicine'}
                </Button>
                <Button variant="outline" onClick={() => setShowMedicineDialog(false)} className='bg-red-500 text-white rounded-2xl'>
                  Cancel
                </Button>
              </div>
            </div>
          ) : selectedMedicine && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Medicine Name</Label>
                  <p className="mt-1 font-medium">{selectedMedicine.name}</p>
                </div>
                <div>
                  <Label>Generic Name</Label>
                  <p className="mt-1">{selectedMedicine.genericName}</p>
                </div>
                <div>
                  <Label>Brand</Label>
                  <p className="mt-1">{selectedMedicine.brand}</p>
                </div>
                <div>
                  <Label>Category</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{selectedMedicine.category}</Badge>
                  </div>
                </div>
                <div>
                  <Label>Form & Dosage</Label>
                  <p className="mt-1">{selectedMedicine.form} - {selectedMedicine.dosage}</p>
                </div>
                <div>
                  <Label>Active Ingredient</Label>
                  <p className="mt-1">{selectedMedicine.activeIngredient}</p>
                </div>
                <div>
                  <Label>Prescription Required</Label>
                  <div className="mt-1">
                    {selectedMedicine.requiresPrescription ? (
                      <Badge variant="destructive">Required</Badge>
                    ) : (
                      <Badge variant="default">OTC</Badge>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Availability</Label>
                  <p className="mt-1">{selectedMedicine.inStock} of {selectedMedicine.totalPharmacies} pharmacies</p>
                </div>
              </div>

              {selectedMedicine.description && (
                <div>
                  <Label>Description</Label>
                  <p className="mt-1 text-sm">{selectedMedicine.description}</p>
                </div>
              )}

              {selectedMedicine.sideEffects && (
                <div>
                  <Label>Side Effects</Label>
                  <p className="mt-1 text-sm">{selectedMedicine.sideEffects}</p>
                </div>
              )}

              {selectedMedicine.instructions && (
                <div>
                  <Label>Instructions</Label>
                  <p className="mt-1 text-sm">{selectedMedicine.instructions}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={() => handleEditMedicine(selectedMedicine)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Medicine
                </Button>
                <Button variant="outline" onClick={() => setShowMedicineDialog(false)}>
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