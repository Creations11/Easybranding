// src/hooks/useSearchFilter.js
import { useState, useMemo } from 'react';

export function useSearchFilter(items = [], options = {}) {
  const {
    searchFields = ['name', 'email', 'phone', 'businessName'],
    caseSensitive = false
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});

  const filtered = useMemo(() => {
    let result = [...items];

    // Apply search
    if (searchTerm.trim()) {
      const term = caseSensitive ? searchTerm.trim() : searchTerm.trim().toLowerCase();
      result = result.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          if (!value) return false;
          const str = caseSensitive ? String(value) : String(value).toLowerCase();
          return str.includes(term);
        })
      );
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        result = result.filter(item => {
          return item[key] === value;
        });
      }
    });

    return result;
  }, [items, searchTerm, filters, searchFields, caseSensitive]);

  const setFilter = (key, value) => {
    setFilters(prev => {
      const next = { ...prev };
      if (value === null || value === undefined || value === 'all') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  };

  const clearAll = () => {
    setSearchTerm('');
    setFilters({});
  };

  return {
    filtered,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    setFilters,
    clearAll,
    totalCount: items.length,
    filteredCount: filtered.length,
  };
}