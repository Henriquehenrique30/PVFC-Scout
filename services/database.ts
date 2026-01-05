
import { createClient } from '@supabase/supabase-js';
import { Player, User } from '../types';

// As chaves devem ser configuradas nas Environment Variables da Vercel
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

// Inicialização do cliente Supabase
export const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const isCloudActive = () => !!supabase;

export const dbService = {
  // --- JOGADORES (NUVEM APENAS) ---
  async getPlayers(): Promise<Player[]> {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Erro ao buscar jogadores:', error.message);
      return [];
    }
    return data || [];
  },

  async savePlayer(player: Player): Promise<void> {
    if (!supabase) throw new Error("Conexão com a nuvem não configurada.");
    const { error } = await supabase.from('players').upsert(player);
    if (error) throw error;
  },

  async deletePlayer(id: string): Promise<void> {
    if (!supabase) throw new Error("Conexão com a nuvem não configurada.");
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  },

  // --- USUÁRIOS (NUVEM APENAS) ---
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Erro ao buscar usuários:', error.message);
      return [];
    }
    return data || [];
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
