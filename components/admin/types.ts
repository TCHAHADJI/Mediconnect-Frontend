import React from 'react';

export interface ColumnDefinition<T> {
  key: keyof T | 'actions';
  header: string;
}

export interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

export interface ResourceManagementProps<T> {
  resourceName: string;
  apiEndpoint: string;
  columns: ColumnDefinition<T>[];
  renderItem: (item: T) => React.ReactNode;
  filterOptions?: FilterOption[];
  searchPlaceholder?: string;
}