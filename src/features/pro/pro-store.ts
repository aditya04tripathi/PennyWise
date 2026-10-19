import { create } from 'zustand';

export type StoreAvailability = 'unknown' | 'available' | 'unavailable';

interface ProState {
	isPro: boolean;
	cachedGrant: boolean;
	store: StoreAvailability;
	setPro(isPro: boolean): void;
	setCachedGrant(cachedGrant: boolean): void;
	setStore(store: StoreAvailability): void;
}

export const useProStore = create<ProState>((set) => ({
	isPro: false,
	cachedGrant: false,
	store: 'unknown',
	setPro: (isPro) => set({ isPro }),
	setCachedGrant: (cachedGrant) => set({ cachedGrant }),
	setStore: (store) => set({ store }),
}));

export function useIsPro(): boolean {
	return useProStore((state) => state.isPro);
}
