
import { createClient } from '@supabase/supabase-js';
import { Player, User } from '../types';

// Use type assertion to access Vite environment variables without TypeScript errors
const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_KEY || '';

// Inicialização do cliente Supabase
export const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const isCloudActive = () => !!supabase;

export const dbService = {
  // --- JOGADORES (100% NUVEM) ---
  async getPlayers(): Promise<Player[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar jogadores:', err);
      return [];
    }
  },

  async savePlayer(player: Player): Promise<void> {
    if (!supabase) throw new Error("Conexão com a nuvem não configurada.");
    const { error } = await supabase.from('players').upsert({
      ...player,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async deletePlayer(id: string): Promise<void> {
    if (!supabase) throw new Error("Conexão com a nuvem não configurada.");
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  },

  // --- USUÁRIOS (100% NUVEM) ---
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase.from('users').select('*');
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
      return [];
    }
  },

  async saveUser(user: User): Promise<void> {
    if (!supabase) throw new Error("Conexão com a nuvem não configurada.");
    const { error } = await supabase.from('users').upsert(user);
    if (error) throw error;
  },

  async deleteUser(id: string): Promise<void> {
    if (!supabase) throw new Error("Conexão com a nuvem não configurada.");
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }
};
