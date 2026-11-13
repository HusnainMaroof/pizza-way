import { create } from "zustand";

/** UI state shared between the checkout form (left) and the Place Order button (summary card, right). */
type CheckoutUiState = {
  submitting: boolean;
  setSubmitting: (v: boolean) => void;
};

export const useCheckoutStore = create<CheckoutUiState>()((set) => ({
  submitting: false,
  setSubmitting: (submitting) => set({ submitting }),
}));
