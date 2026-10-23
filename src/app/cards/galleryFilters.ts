export type GalleryFilters = {
  legion: string[];
  type: string[];
  rarity: string[];
  set: string[];
  srlStatus: string[];
};

export const emptyGalleryFilters = (): GalleryFilters => ({
  legion: [],
  type: [],
  rarity: [],
  set: [],
  srlStatus: [],
});

export const copyGalleryFilters = (filters: GalleryFilters): GalleryFilters => ({
  legion: [...filters.legion],
  type: [...filters.type],
  rarity: [...filters.rarity],
  set: [...filters.set],
  srlStatus: [...filters.srlStatus],
});

export const countGalleryFilters = (filters: GalleryFilters) =>
  filters.legion.length + filters.type.length + filters.rarity.length + filters.set.length + filters.srlStatus.length;
