
import { createClient } from '@supabase/supabase-js';
import { Player, User, ScoutingGame } from '../types';

const SUPABASE_URL = (import.meta as any).env.VITE_SUPABASE_URL || '';
const SUPABASE_KEY = (import.meta as any).env.VITE_SUPABASE_KEY || '';

export const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

export const isCloudActive = () => !!supabase;

export const dbService = {
  // --- JOGADORES ---
  async getPlayers(): Promise<Player[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async savePlayer(player: Player): Promise<void> {
    if (!supabase) throw new Error("Cloud not configured.");
    const { id, ...playerData } = player;
    const { error } = await supabase.from('players').upsert({ id, ...playerData });
    if (error) throw error;
  },

  async deletePlayer(id: string): Promise<void> {
    if (!supabase) throw new Error("Cloud not configured.");
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  },

  // --- AGENDA DE SCOUTING (NOVO) ---
  async getScoutingGames(): Promise<ScoutingGame[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('scouting_games').select('*').order('dateTime', { ascending: true });
    if (error) return [];
    return data || [];
  },

  async saveScoutingGame(game: ScoutingGame): Promise<void> {
    if (!supabase) throw new Error("Cloud not configured.");
    const { error } = await supabase.from('scouting_games').upsert(game);
    if (error) throw error;
  },

  async deleteScoutingGame(id: string): Promise<void> {
    if (!supabase) throw new Error("Cloud not configured.");
    const { error } = await supabase.from('scouting_games').delete().eq('id', id);
    if (error) throw error;
  },

  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
    return data || [];
  },

  async saveUser(user: User): Promise<void> {
    if (!supabase) throw new Error("Cloud not configured.");
    const { error } = await supabase.from('users').upsert(user);
    if (error) throw error;
  },

  async deleteUser(id: string): Promise<void> {
    if (!supabase) throw new Error("Cloud not configured.");
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }
};
