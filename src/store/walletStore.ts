import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface WalletState {
  balance: string;
  isLocked: boolean;
  autoLockMinutes: number;
  walletAddress: string;
  transactions: any[];
  isLoading: boolean;
  error: string | null;
  
  initializeWallet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  toggleLock: () => Promise<void>;
  updateAutoLockMinutes: (minutes: number) => Promise<void>;
  sendTransaction: (recipientAddress: string, amount: number) => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  balance: '0',
  isLocked: true,
  autoLockMinutes: 10,
  walletAddress: '',
  transactions: [],
  isLoading: false,
  error: null,

  initializeWallet: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // First check if profile exists
      const { data: profiles, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      if (fetchError) throw fetchError;

      // If no profile exists, create one
      if (!profiles || profiles.length === 0) {
        const walletAddress = `MHC${Math.random().toString(36).substring(2, 15)}`;
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            wallet_address: walletAddress,
            balance: 10,
            is_locked: true,
            auto_lock_minutes: 10
          })
          .select()
          .single();

        if (createError) throw createError;

        set({
          balance: newProfile.balance.toString(),
          isLocked: newProfile.is_locked,
          autoLockMinutes: newProfile.auto_lock_minutes,
          walletAddress: newProfile.wallet_address,
        });
      } else {
        // Profile exists, use the first one
        const profile = profiles[0];
        set({
          balance: profile.balance.toString(),
          isLocked: profile.is_locked,
          autoLockMinutes: profile.auto_lock_minutes,
          walletAddress: profile.wallet_address,
        });
      }

      // Subscribe to real-time changes
      supabase
        .channel('profile_changes')
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          const newProfile = payload.new;
          set({
            balance: newProfile.balance.toString(),
            isLocked: newProfile.is_locked,
            autoLockMinutes: newProfile.auto_lock_minutes,
          });
        })
        .subscribe();

    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  refreshBalance: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', user.id);

      if (error) throw error;
      if (!profiles || profiles.length === 0) throw new Error('Profile not found');

      set({ balance: profiles[0].balance.toString() });
    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  toggleLock: async () => {
    try {
      set({ error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const newLockState = !get().isLocked;

      const { error } = await supabase
        .from('profiles')
        .update({ is_locked: newLockState, last_active: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      set({ isLocked: newLockState });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  updateAutoLockMinutes: async (minutes: number) => {
    try {
      set({ error: null });
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ auto_lock_minutes: minutes })
        .eq('id', user.id);

      if (error) throw error;

      set({ autoLockMinutes: minutes });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  sendTransaction: async (recipientAddress: string, amount: number) => {
    try {
      set({ isLoading: true, error: null });
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('Not authenticated');

      // Get current profile
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('balance, wallet_address')
        .eq('id', user.id);

      if (profileError) throw profileError;
      if (!profiles || profiles.length === 0) throw new Error('Profile not found');

      const profile = profiles[0];
      if (parseFloat(profile.balance) < amount) throw new Error('Insufficient funds');

      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          profile_id: user.id,
          type: 'send',
          amount,
          recipient_address: recipientAddress,
          sender_address: profile.wallet_address,
          status: 'completed'
        });

      if (txError) throw txError;

      // Update balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ balance: parseFloat(profile.balance) - amount })
        .eq('id', user.id);

      if (updateError) throw updateError;

    } catch (error: any) {
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },
}));
