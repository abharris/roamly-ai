import { create } from 'zustand';

interface MapStore {
  selectedPlaceId: string | null;
  setSelectedPlaceId: (id: string | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  selectedPlaceId: null,
  setSelectedPlaceId: (id) => set({ selectedPlaceId: id }),
}));
