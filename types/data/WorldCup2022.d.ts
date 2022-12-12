// Generated by https://jsonformatter.org/json-to-typescript for WorldCup2022 apis
export type WorldCup2022Players = WorldCup2022Player[];

export interface Player {
  id: number;
  feedId: number | null;
  firstName: string;
  name: string;
  preferredName: string;
  squadId: number;
  cost: number;
  stats: Stats;
  status: Status;
  position: number;
  locked: number;
  matchDayPoints: { [key: string]: number | null };
}

export interface Stats {
  totalPoints: number;
  avgPoints: number;
  gamesPlayed: number;
  roundScores: { [key: string]: number | null } | null;
  tournamentScores: { [key: string]: number | null } | null;
  pickedBy: number;
  goals: number;
  assists: number;
  redCard: number;
  yellowCard: number;
  ownGoals: number;
  penaltySave: number;
  penaltyMissed: number;
  starting11: number;
  substitutions: number;
  cleanSheets: number;
  goalsConceded: number;
}

export enum Status {
  Available = "available",
  Eliminated = "eliminated",
  Unavailable = "unavailable",
}

export type WorldCup2022Squads = Squad[];

export interface Squad {
  id: number;
  name: string;
  abbr: string;
  seed: number;
  squadLink: null;
  isActive: boolean;
  group: string;
  groupPosition: null;
}

export type WorldCup2022Rounds = Round[];

export interface Round {
  id: number;
  stage: string;
  status: Status;
  startDate: Date;
  endDate: Date;
  tournaments: Tournament[];
}

export enum Status {
  Complete = "complete",
  Scheduled = "scheduled",
}

export interface Tournament {
  id: number;
  venueName: string;
  venueId: number;
  date: Date;
  homeSquadId: number;
  awaySquadId: number;
  homeSquadName: string;
  awaySquadName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: Status;
  bracketId: number;
  matchcentreUrl: string;
}
