import { create } from 'zustand';

export type StoreAvailability = 'unknown' | 'available' | 'unavailable';

interface ProState {
	isPro: boolean;
	store: StoreAvailability;
	setPro(isPro: boolean): void;
	setStore(store: StoreAvailability): void;
}

export const useProStore = create<ProState>((set) => ({
	isPro: false,
	store: 'unknown',
	setPro: (isPro) => set({ isPro }),
	setStore: (store) => set({ store }),
}));

export function useIsPro(): boolean {
	return useProStore((state) => state.isPro);
}
