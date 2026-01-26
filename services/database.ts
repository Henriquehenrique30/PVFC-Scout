
import { createClient } from '@supabase/supabase-js';
import { Player, User, ScoutingGame, ObservedPlayer, ExternalProject, ObservationSchedule } from '../types';

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
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { id, ...playerData } = player;
    const { error } = await supabase.from('players').upsert({ id, ...playerData });
    if (error) throw error;
  },

  async deletePlayer(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('players').delete().eq('id', id);
    if (error) throw error;
  },

  // --- WATCHLIST (CLOUD) ---
  async getWatchlist(): Promise<ObservedPlayer[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('watchlist').select('*').order('created_at', { ascending: false });
    if (error) return [];
    return data || [];
  },

  async saveWatchlistItem(item: ObservedPlayer): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('watchlist').upsert(item);
    if (error) throw error;
  },

  async updateWatchlistStatus(id: string, status: 'pending' | 'viewed' | 'completed'): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('watchlist').update({ status }).eq('id', id);
    if (error) throw error;
  },

  async deleteWatchlistItem(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('watchlist').delete().eq('id', id);
    if (error) throw error;
  },

  // --- AGENDA DE SCOUTING ---
  async getScoutingGames(): Promise<ScoutingGame[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('scouting_games').select('*').order('datetime', { ascending: true });
    return data || [];
  },

  async saveScoutingGame(game: ScoutingGame): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('scouting_games').upsert(game);
    if (error) throw error;
  },

  async deleteScoutingGame(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('scouting_games').delete().eq('id', id);
    if (error) throw error;
  },

  // --- PROJETOS EXTERNOS (TABELA: external_projects) ---
  async getExternalProjects(): Promise<ExternalProject[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('external_projects').select('*').order('name', { ascending: true });
    if (error) console.error("Erro Supabase Projetos:", error);
    return data || [];
  },

  async saveExternalProject(project: ExternalProject): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('external_projects').upsert(project);
    if (error) throw error;
  },

  async deleteExternalProject(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('external_projects').delete().eq('id', id);
    if (error) throw error;
  },

  // --- AGENDA DE OBSERVAÇÃO EXTERNA (TABELA: observation_schedules) ---
  async getObservationSchedules(): Promise<ObservationSchedule[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('observation_schedules').select('*').order('date', { ascending: true });
    if (error) console.error("Erro Supabase Agenda:", error);
    return data || [];
  },

  async saveObservationSchedule(schedule: ObservationSchedule): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('observation_schedules').upsert(schedule);
    if (error) throw error;
  },

  async deleteObservationSchedule(id: string): Promise<void> {
    if (!supabase) throw new Error("Nuvem não configurada.");
    const { error } = await supabase.from('observation_schedules').delete().eq('id', id);
    if (error) throw error;
  },

  // --- USUÁRIOS ---
  async getUsers(): Promise<User[]> {
    if (!supabase) return [];
    const { data, error } = await supabase.from('users').select('*');
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
