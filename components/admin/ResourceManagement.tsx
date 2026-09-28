import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Loader2, AlertCircle, Search } from 'lucide-react';

import { toast } from 'sonner';
import { ResourceManagementProps, FilterOption } from './types';

export function ResourceManagement<T extends { id: string | number }>({
  resourceName,
  apiEndpoint,
  columns,
  renderItem,
  filterOptions,
  searchPlaceholder,
}: ResourceManagementProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const getAuthToken = () => {
    const session = localStorage.getItem('userSession');
    if (session) {
      // The token is stored at the top level of the session object
      const parsedSession = JSON.parse(session);
      return parsedSession.token;
    }
    return null;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      const token = getAuthToken();
      if (!token) {
        toast.error('Authentication required.');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}${apiEndpoint}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`Failed to fetch ${resourceName}.`);
        const result = await response.json();
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error(result.message);
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [apiEndpoint, resourceName]);

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const filteredData = data.filter(item => {
    // Implement search and filter logic based on your needs
    // This is a simple example; you might need a more complex filtering logic
    const searchMatch = Object.values(item).some(val =>
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Add filter logic here if needed
    return searchMatch;
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{resourceName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 rounded-3xl"
            />
          </div>
          {/* Render filters here if any */}
        </div>

        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
        ) : error ? (
          <div className="text-center p-8 text-red-500">
            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-lg font-semibold">Failed to load data</h3>
            <p>{error}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => <TableHead key={col.key}>{col.header}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map(item => renderItem(item))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}