
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
    // Nota: 'created_at' em minúsculas é o padrão do Supabase
    const { data, error } = await supabase.from('players').select('*').order('created_at', { ascending: false });
    return data || [];
  },

  async savePlayer(player: Player): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { id, ...playerData } = player;
    const { error } = await supabase.from('players').upsert({ id, ...playerData });
    if (error) {
      console.error("Erro Supabase (Players):", error);
      throw error;
    }
  },

  async deletePlayer(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  },

  // --- AGENDA DE SCOUTING ---
  async getScoutingGames(): Promise<ScoutingGame[]> {
    if (!supabase) return [];
    // Atualizado para 'datetime' em minúsculas
    const { data, error } = await supabase.from('scouting_games').select('*').order('datetime', { ascending: true });
    if (error) {
      console.error("Erro ao buscar jogos:", error);
      return [];
    }
    return data || [];
  },

  async saveScoutingGame(game: ScoutingGame): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    
    console.log("Tentando salvar jogo (Keys minúsculas):", game);
    
    const { error } = await supabase.from('scouting_games').upsert(game);
    
    if (error) {
      console.error("Erro detalhado do Supabase:", error);
      if (error.code === '42P01') {
        throw new Error("Tabela 'scouting_games' não encontrada no banco.");
      }
      throw error;
    }
  },

  async deleteScoutingGame(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('scouting_games').delete().eq('id', id);
    if (error) throw error;
  },

  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*').eq('status', 'approved');
    return data || [];
  },

  async saveUser(user: User): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('users').upsert(user);
    if (error) throw error;
  },

  async deleteUser(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  }
};
