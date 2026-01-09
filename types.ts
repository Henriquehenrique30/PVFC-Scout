
export enum Position {
  GOL = 'GOL',
  ZAG = 'ZAG',
  LTD = 'LTD',
  LTE = 'LTE',
  VOL = 'VOL',
  MEI = 'MEI',
  EXT = 'EXT',
  ATA = 'ATA'
}

export type Recommendation = 'G1 Elite' | 'G2 Titular' | 'G3 Monitoramento' | 'Base';

export interface PlayerStats {
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defending: number;
  physical: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  birthDate: string; 
  position1: Position;
  position2?: Position;
  nationality: string;
  club: string;
  value: number;
  recommendation: Recommendation;
  competition: string;
  scoutYear: number;
  gamesWatched: number;
  photoUrl: string;
  stats: PlayerStats;
  foot: 'Left' | 'Right' | 'Both';
  height: number;
  contractUntil: number;
  aiContextData?: string;
  videoUrl?: string;
  ogolUrl?: string;
  agent?: string;
  contact?: string;
}

export interface ObservedPlayer {
  id: string;
  name: string;
  club: string;
  position: Position;
  createdAt: string;
}

export interface FilterState {
  search: string;
  positions: Position[];
  minAge: number;
  maxAge: number;
  recommendations: Recommendation[];
  competitions: string[];
  scoutYears: number[];
}

export type UserRole = 'admin' | 'scout';
export type UserStatus = 'pending' | 'approved';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  name: string; // Mantido para compatibilidade, será firstName + lastName
  password?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}
