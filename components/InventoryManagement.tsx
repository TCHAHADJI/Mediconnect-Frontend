import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { Search, Plus, Edit, Trash2, Package, AlertCircle, TrendingUp, TrendingDown, Eye, BarChart3, Loader2, Database, FileSpreadsheet, Key, ShieldCheck } from 'lucide-react';
import { Switch } from './ui/switch';
import { AddFromCatalogueModal } from './inventory/AddFromCatalogueModal';
import { BulkCsvImportModal } from './inventory/BulkCsvImportModal';
import { PosIntegrationModal } from './inventory/PosIntegrationModal';

interface Medicine {
  id: string;
  name: string;
  genericName: string;
  brand: string;
  description: string;
  dosage: string;
  form: string;
  category: string;
  activeIngredient: string;
  sideEffects: string;
  contraindications: string;
  instructions: string;
  requiresPrescription: boolean;
  barcode: string;
  image: string;
  stock: number;
  minStock: number;
  price: number;
  costPrice: number;
  expiryDate: string;
  batchNumber: string;
  supplier: string;
  lastUpdated: string;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'expired';
}

export function InventoryManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCatalogueModalOpen, setIsCatalogueModalOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [medicineToDelete, setMedicineToDelete] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newMedicine, setNewMedicine] = useState({
    name: '',
    genericName: '',
    dosage: '',
    form: '',
    description: '',
    sideEffects: '',
    requiresPrescription: false,
    category: '',
    stock: 0,
    minStock: 0,
    price: 0,
    costPrice: 0,
    expiryDate: '',
    batchNumber: '',
    supplier: ''
  });

  const categories = ['all', 'Pain Relief', 'Antibiotics', 'Vitamins', 'Diabetes', 'Heart Disease', 'Respiratory'];
  const statuses = ['all', 'in_stock', 'low_stock', 'out_of_stock', 'expired'];
  const forms = ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Drops', 'Cream', 'Inhaler'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_stock': return 'bg-green-500';
      case 'low_stock': return 'bg-yellow-500';
      case 'out_of_stock': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const updateMedicineStatus = (medicine: Medicine) => {
    const today = new Date();
    const expiry = new Date(medicine.expiryDate);

    if (expiry < today) {
      return 'expired';
    } else if (medicine.stock === 0) {
      return 'out_of_stock';
    } else if (medicine.stock <= medicine.minStock) {
      return 'low_stock';
    } else {
      return 'in_stock';
    }
  };

  // --- API CALLS (CRUD) ---

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      // The token is stored at the top level of the session object
      const parsedSession = JSON.parse(session);
      return parsedSession.token;
    }
    return null;
  };

  // READ: Fetch all medicines on component mount
  const fetchMedicines = async () => {
    setIsLoading(true);
    setError(null);
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch inventory.');
      }
      const responseData = await response.json();
      // The backend now sends computed status fields, so we can use the data directly
      console.log("Fetched inventory data:", responseData);
      const medicinesWithStatus = responseData.data.inventory.map((invItem: any) => ({
        ...invItem.medicineId, // Unpack medicine details (name, genericName, etc.)
        id: invItem._id, // Use the inventory ID for keys and actions
        medicineId: invItem.medicineId._id, // Store the actual medicine ID
        stock: invItem.quantity,
        minStock: invItem.lowStockThreshold,
        price: invItem.price,
        expiryDate: invItem.expiryDate,
        status: updateMedicineStatus(invItem) // Calculate status based on inventory data
      }));
      setMedicines(medicinesWithStatus);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  // CREATE: Add a new medicine via API
  const handleAddMedicine = async () => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    // 1. Separate medicine data from inventory data
    const medicineData = {
      name: newMedicine.name,
      genericName: newMedicine.genericName,
      dosage: newMedicine.dosage,
      form: newMedicine.form,
      description: newMedicine.description,
      sideEffects: newMedicine.sideEffects,
      requiresPrescription: newMedicine.requiresPrescription,
      category: newMedicine.category,
    };

    const inventoryData = {
      quantity: newMedicine.stock,
      price: newMedicine.price,
      expiryDate: newMedicine.expiryDate,
      batchNumber: newMedicine.batchNumber,
      lowStockThreshold: newMedicine.minStock,
    };

    try {
      // 2. Create the medicine first
      const medResponse = await fetch(`${import.meta.env.VITE_API_URL}/medicines/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(medicineData),
      });

      if (!medResponse.ok) {
        const errorData = await medResponse.json();
        throw new Error(errorData.message || 'Failed to create medicine.');
      }

      const createdMedicine = await medResponse.json();
      const newMedicineId = createdMedicine.data._id;

      // 3. Add the medicine to the inventory
      const invResponse = await fetch(`${import.meta.env.VITE_API_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...inventoryData,
          medicineId: newMedicineId,
        }),
      });

      if (!invResponse.ok) {
        const errorData = await invResponse.json();
        // TODO: In a real app, you might want to delete the medicine that was just created if the inventory step fails.
        throw new Error(errorData.message || 'Failed to add medicine to inventory.');
      }

      // 4. Update the UI
      fetchMedicines(); // Refetch the inventory list to show the new item
      setIsAddDialogOpen(false);
      toast.success('Medicine added to inventory successfully!');
      setNewMedicine({
        name: '', genericName: '', dosage: '', form: '', category: '', stock: 0,
        description: '', sideEffects: '', requiresPrescription: false,
        minStock: 0, price: 0, costPrice: 0, expiryDate: '', batchNumber: '', supplier: ''
      });

    } catch (err: any) {
      console.error('API Error:', err);
      toast.error(`Error: ${err.message}`);
    }
  };

  // UPDATE: Edit an existing medicine via API
  const handleUpdateMedicine = async () => {
    if (!editingMedicine) return;

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/medicines/${editingMedicine.medicineId}`, {
        method: 'PATCH', // or 'PUT'
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingMedicine),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update medicine');
      }

      const updatedMedicines = medicines.map(medicine =>
        medicine.id === editingMedicine.id
          ? { ...editingMedicine, status: updateMedicineStatus(editingMedicine) }
          : medicine
      );

      setMedicines(updatedMedicines);
      setEditingMedicine(null);
      setIsEditDialogOpen(false);
      toast.success('Medicine updated successfully!');

    } catch (err: any) {
      console.error('API Error:', err);
      toast.error(`Error updating medicine: ${err.message}`);
    }
  };

  // DELETE: Delete a medicine via API
  const handleDeleteMedicine = (id: string) => {
    setMedicineToDelete(id);
    setShowDeleteConfirmation(true);
  };

  const confirmDelete = async () => {
    if (!medicineToDelete) return;

    const token = getAuthToken();
    if (!token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/inventory/${medicineToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete medicine from inventory');
      }

      setMedicines(medicines.filter(medicine => medicine.id !== medicineToDelete));
      toast.success('Medicine deleted successfully!');

    } catch (err: any) {
      console.error('API Error:', err);
      toast.error(`Error deleting medicine from inventory: ${err.message}`);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
      setMedicineToDelete(null);
    }
  };

  // --- UI Logic ---

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || medicine.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || medicine.status === selectedStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: medicines.length,
    inStock: medicines.filter(m => m.status === 'in_stock').length,
    lowStock: medicines.filter(m => m.status === 'low_stock').length,
    outOfStock: medicines.filter(m => m.status === 'out_of_stock').length,
    expired: medicines.filter(m => m.status === 'expired').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-600" />
            Inventory & Stock Management
          </h1>
          <p className="text-sm text-slate-500">Live pharmacy stock linked directly to the Central Master Catalogue</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            onClick={() => setIsCatalogueModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 text-xs font-semibold gap-1.5 h-9"
          >
            <Database className="w-4 h-4" />
            + Add from Master Catalogue
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsBulkImportOpen(true)}
            className="border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-900 rounded-xl text-xs gap-1.5 h-9 font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
            Import CSV / Excel
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsPosModalOpen(true)}
            className="border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl text-xs gap-1.5 h-9 font-medium"
          >
            <Key className="w-4 h-4 text-slate-500" />
            Connect POS / ERP
          </Button>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="rounded-xl text-slate-400 hover:text-slate-600 text-xs h-9">
                + Custom Manual
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Custom Unlisted Medicine</DialogTitle>
                <DialogDescription>
                  For unlisted or custom pharmaceutical preparations.
                </DialogDescription>
              </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Medicine Name</Label>
                <Input
                  id="name"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Enter medicine name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={newMedicine.genericName}
                  onChange={(e) => setNewMedicine({ ...newMedicine, genericName: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Enter generic name"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newMedicine.description}
                  onChange={(e) => setNewMedicine({ ...newMedicine, description: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Brief description of the medicine"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="sideEffects">Side Effects</Label>
                <Textarea
                  id="sideEffects"
                  value={newMedicine.sideEffects}
                  onChange={(e) => setNewMedicine({ ...newMedicine, sideEffects: e.target.value })}
                  className="rounded-2xl"
                  placeholder="e.g., Nausea, Dizziness, Headache"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={newMedicine.dosage}
                  onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                  className="rounded-2xl"
                  placeholder="e.g., 500mg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form">Form</Label>
                <Select value={newMedicine.form} onValueChange={(value) => setNewMedicine({ ...newMedicine, form: value })}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl bg-white">
                    {forms.map(form => (
                      <SelectItem key={form} value={form} className='hover:bg-purple-600 hover:text-white transition-colors rounded-2xl'>{form}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="category">Category</Label>
                <Select value={newMedicine.category} onValueChange={(value) => setNewMedicine({ ...newMedicine, category: value })}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl bg-white">
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <SelectItem key={category} value={category} className='hover:bg-purple-600 hover:text-white transition-colors rounded-2xl'>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="prescription">Prescription Status</Label>
                <Select value={newMedicine.requiresPrescription ? 'required' : 'otc'} onValueChange={(value) => setNewMedicine({ ...newMedicine, requiresPrescription: value === 'required' })}>
                  <SelectTrigger id="prescription" className="rounded-2xl">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl bg-white">
                    <SelectItem value="required">Prescription Required</SelectItem>
                    <SelectItem value="otc" className='hover:bg-purple-600 hover:text-white transition-colors rounded-2xl'>OTC (Over-the-Counter)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Current Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={newMedicine.stock}
                  className="rounded-2xl"
                  onChange={(e) => setNewMedicine({ ...newMedicine, stock: parseInt(e.target.value) || 0 })}
                  placeholder="Enter stock quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={newMedicine.minStock}
                  className="rounded-2xl"
                  onChange={(e) => setNewMedicine({ ...newMedicine, minStock: parseInt(e.target.value) || 0 })}
                  placeholder="Enter minimum stock level"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Selling Price (FCFA)</Label>
                <Input
                  id="price"
                  type="number"
                  value={newMedicine.price}
                  className="rounded-2xl"
                  onChange={(e) => setNewMedicine({ ...newMedicine, price: parseInt(e.target.value) || 0 })}
                  placeholder="Enter selling price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (FCFA)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  value={newMedicine.costPrice}
                  className="rounded-2xl"
                  onChange={(e) => setNewMedicine({ ...newMedicine, costPrice: parseInt(e.target.value) || 0 })}
                  placeholder="Enter cost price"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newMedicine.expiryDate}
                  className="rounded-2xl"
                  onChange={(e) => setNewMedicine({ ...newMedicine, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="batchNumber">Batch Number</Label>
                <Input
                  id="batchNumber"
                  value={newMedicine.batchNumber}
                  onChange={(e) => setNewMedicine({ ...newMedicine, batchNumber: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Enter batch number"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={newMedicine.supplier}
                  onChange={(e) => setNewMedicine({ ...newMedicine, supplier: e.target.value })}
                  className="rounded-2xl"
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddMedicine}>
                Add Medicine
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className='rounded-2xl'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Medicines</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card className='rounded-2xl'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Stock</p>
                <p className="text-2xl font-semibold text-green-600">{stats.inStock}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className='rounded-2xl'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock</p>
                <p className="text-2xl font-semibold text-yellow-600">{stats.lowStock}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card className='rounded-2xl'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Out of Stock</p>
                <p className="text-2xl font-semibold text-red-600">{stats.outOfStock}</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className='rounded-2xl'>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expired</p>
                <p className="text-2xl font-semibold text-gray-600">{stats.expired}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search medicines..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-2xl"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 bg-gray-50 rounded-2xl">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className='rounded-2xl bg-white'>
              {categories.map(category => (
                <SelectItem key={category} value={category} className='hover:bg-purple-500 hover:text-white transition-colors rounded-2xl'>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-32 bg-gray-50 rounded-2xl">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className='rounded-2xl bg-white'>
              {statuses.map(status => (
                <SelectItem key={status} value={status} className='hover:bg-purple-500 hover:text-white transition-colors rounded-2xl'>
                  {status === 'all' ? 'All Status' : getStatusText(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medicine Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2 text-muted-foreground">Loading inventory...</span>
            </div>
          ) : error ? (
            <div className="text-center p-8 text-red-500">
              <p>Failed to load data.</p>
              <p>{error}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medicine</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{medicine.name}</p>
                        <p className="text-sm text-muted-foreground">{medicine.genericName} • {medicine.dosage}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className='rounded-2xl'>{medicine.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{medicine.stock}</p>
                        <p className="text-sm text-muted-foreground">Min: {medicine.minStock}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`${getStatusColor(medicine.status)} text-white`}>
                        {getStatusText(medicine.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{medicine.price} FCFA</p>
                        <p className="text-sm text-muted-foreground">Cost: {medicine.costPrice} FCFA</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{medicine.expiryDate}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingMedicine(medicine);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteMedicine(medicine.id)}
                          className="text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Medicine</DialogTitle>
            <DialogDescription>
              Update the details of the selected medicine.
            </DialogDescription>
          </DialogHeader>
          {editingMedicine && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editName">Medicine Name</Label>
                <Input
                  id="editName"
                  value={editingMedicine.name}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGenericName">Generic Name</Label>
                <Input
                  id="editGenericName"
                  value={editingMedicine.genericName}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, genericName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBrand">Brand</Label>
                <Input
                  id="editBrand"
                  value={editingMedicine.brand || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, brand: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editDosage">Dosage</Label>
                <Input
                  id="editDosage"
                  value={editingMedicine.dosage}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, dosage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editForm">Form</Label>
                <Select value={editingMedicine.form} onValueChange={(value) => setEditingMedicine({ ...editingMedicine, form: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select form" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map(form => (
                      <SelectItem key={form} value={form}>{form}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCategory">Category</Label>
                <Select value={editingMedicine.category} onValueChange={(value) => setEditingMedicine({ ...editingMedicine, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingMedicine.description || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editActiveIngredient">Active Ingredient</Label>
                <Input
                  id="editActiveIngredient"
                  value={editingMedicine.activeIngredient || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, activeIngredient: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBarcode">Barcode</Label>
                <Input
                  id="editBarcode"
                  value={editingMedicine.barcode || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, barcode: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editSideEffects">Side Effects</Label>
                <Textarea
                  id="editSideEffects"
                  value={editingMedicine.sideEffects || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, sideEffects: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editContraindications">Contraindications</Label>
                <Textarea
                  id="editContraindications"
                  value={editingMedicine.contraindications || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, contraindications: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editInstructions">Instructions</Label>
                <Textarea
                  id="editInstructions"
                  value={editingMedicine.instructions || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, instructions: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editImage">Image URL</Label>
                <Input
                  id="editImage"
                  value={editingMedicine.image || ''}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, image: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editRequiresPrescription"
                  checked={editingMedicine.requiresPrescription}
                  onCheckedChange={(checked) => setEditingMedicine({ ...editingMedicine, requiresPrescription: checked })}
                />
                <Label htmlFor="editRequiresPrescription">Requires Prescription</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStock">Current Stock</Label>
                <Input
                  id="editStock"
                  type="number"
                  value={editingMedicine.stock}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, stock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMinStock">Minimum Stock</Label>
                <Input
                  id="editMinStock"
                  type="number"
                  value={editingMedicine.minStock}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, minStock: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPrice">Selling Price (FCFA)</Label>
                <Input
                  id="editPrice"
                  type="number"
                  value={editingMedicine.price}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, price: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editCostPrice">Cost Price (FCFA)</Label>
                <Input
                  id="editCostPrice"
                  type="number"
                  value={editingMedicine.costPrice || 0}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, costPrice: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editExpiryDate">Expiry Date</Label>
                <Input
                  id="editExpiryDate"
                  type="date"
                  value={editingMedicine.expiryDate}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, expiryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editBatchNumber">Batch Number</Label>
                <Input
                  id="editBatchNumber"
                  value={editingMedicine.batchNumber}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, batchNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="editSupplier">Supplier</Label>
                <Input
                  id="editSupplier"
                  value={editingMedicine.supplier}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, supplier: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateMedicine} className="bg-blue-600 text-white">
              Update Medicine
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-[425px] bg-white">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this medicine? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirmation(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>              ) : (
                'Delete'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Enhanced Modals */}
      <AddFromCatalogueModal
        isOpen={isCatalogueModalOpen}
        onClose={() => setIsCatalogueModalOpen(false)}
        onSuccess={fetchMedicines}
      />

      <BulkCsvImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={fetchMedicines}
      />

      <PosIntegrationModal
        isOpen={isPosModalOpen}
        onClose={() => setIsPosModalOpen(false)}
      />
    </div>
  );
}