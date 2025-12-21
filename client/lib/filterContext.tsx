import React, { createContext, useContext, useState, ReactNode } from "react";

export interface FilterState {
  city: string | null;
  region: string | null;
  state: string | null;
  proximityMiles: number | null;
}

interface FilterContextType {
  filters: FilterState;
  updateFilters: (newFilters: FilterState) => void;
  clearFilter: (key: keyof FilterState) => void;
  clearAllFilters: () => void;
}

const defaultFilters: FilterState = {
  city: null,
  region: null,
  state: null,
  proximityMiles: null,
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const updateFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const clearFilter = (key: keyof FilterState) => {
    setFilters((prev) => ({ ...prev, [key]: null }));
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
  };

  return (
    <FilterContext.Provider
      value={{ filters, updateFilters, clearFilter, clearAllFilters }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters(): FilterContextType {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilters must be used within a FilterProvider");
  }
  return context;
}
