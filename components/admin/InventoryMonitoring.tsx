import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AlertTriangle, Package, TrendingDown, Store } from 'lucide-react';

const inventoryAlerts = [
  {
    id: 1,
    medicine: 'Paracetamol 500mg',
    pharmacy: 'Pharmacie Centrale',
    currentStock: 5,
    threshold: 10,
    status: 'low',
    lastUpdated: '2 hours ago'
  },
  {
    id: 2,
    medicine: 'Amoxicillin 250mg',
    pharmacy: 'Pharmacie du Nord',
    currentStock: 0,
    threshold: 15,
    status: 'out',
    lastUpdated: '1 day ago'
  },
  {
    id: 3,
    medicine: 'Aspirin 100mg',
    pharmacy: 'Pharmacie de la Paix',
    currentStock: 8,
    threshold: 20,
    status: 'low',
    lastUpdated: '3 hours ago'
  }
];

export function InventoryMonitoring() {
  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className='rounded-2xl'> 
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">47</p>
                <p className="text-sm text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">2,840</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='rounded-2xl'>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Store className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Active Pharmacies</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Alerts */}
      <Card className='rounded-2xl'>
        <CardHeader>
          <CardTitle>Inventory Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Medicine</TableHead>
                <TableHead>Pharmacy</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryAlerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.medicine}</TableCell>
                  <TableCell>{alert.pharmacy}</TableCell>
                  <TableCell>
                    <span className={alert.currentStock === 0 ? 'text-red-600' : 'text-orange-600'}>
                      {alert.currentStock} / {alert.threshold}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'out' ? 'destructive' : 'outline'}>
                      {alert.status === 'out' ? 'Out of Stock' : 'Low Stock'}
                    </Badge>
                  </TableCell>
                  <TableCell>{alert.lastUpdated}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" className='bg-blue-600 text-white rounded-2xl'>Contact Pharmacy</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}