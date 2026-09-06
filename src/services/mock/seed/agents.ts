/**
 * Seed: the team. 14 agents + 2 leads = 16 users, matching proposal section 4.
 *
 * Handwritten, not generated. Real example values are the point — a screen full
 * of "Agent 07" teaches you nothing about whether the screen works.
 *
 * `openTarget` is not a domain field. It is the seed's instruction to the ticket
 * generator so the workload table reproduces the specced distribution exactly:
 * Rahul at 38 against a team median of 6 is the demo, and it must survive a reseed.
 */

import type { Agent } from '../../../types/domain';

export interface AgentSeed extends Agent {
  readonly openTarget: number;
  /**
   * Additional untouched-over-24h tickets to GENERATE. Handwritten at-risk
   * tickets that are also stale count toward the visible total, so this is the
   * remainder: Rahul shows 6 (5 here + #BC-4744), Meera 1, Aditi 7.
   */
  readonly untouchedOver24hTarget: number;
  readonly weeklyHandled: number;
  readonly weeklyBreached: number;
  /** Median first response last week, in minutes. */
  readonly weeklyMedianMinutes: number;
}

const initials = (name: string): string =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const agent = (
  id: string,
  name: string,
  openTarget: number,
  weeklyHandled: number,
  weeklyBreached: number,
  weeklyMedianMinutes: number,
  extra: Partial<AgentSeed> = {}
): AgentSeed => ({
  id,
  name,
  email: `${name.toLowerCase().split(' ')[0]}.${name.toLowerCase().split(' ')[1][0]}@brightcart.in`,
  role: 'agent',
  status: 'active',
  leaveFrom: null,
  leaveUntil: null,
  initials: initials(name),
  openTarget,
  untouchedOver24hTarget: 0,
  weeklyHandled,
  weeklyBreached,
  weeklyMedianMinutes,
  ...extra
});

export const LEADS: readonly Agent[] = [
  {
    id: 'u-manoj',
    name: 'Manoj Patil',
    email: 'manoj.p@brightcart.in',
    role: 'lead',
    status: 'active',
    leaveFrom: null,
    leaveUntil: null,
    initials: 'MP'
  },
  {
    id: 'u-shalini',
    name: 'Shalini Rane',
    email: 'shalini.r@brightcart.in',
    role: 'lead',
    status: 'active',
    leaveFrom: null,
    leaveUntil: null,
    initials: 'SR'
  }
];

/** The signed-in user for this build. */
export const CURRENT_USER: Agent = LEADS[0];

export const AGENT_SEEDS: readonly AgentSeed[] = [
  // The drowning one. 38 open against a median of 6 — Manoj's "someone had 60
  // open queries and I found out only when she resigned", caught six weeks earlier.
  agent('u-rahul', 'Rahul Bhosale', 38, 61, 19, 520, { untouchedOver24hTarget: 5 }),
  agent('u-meera', 'Meera Iyer', 24, 54, 8, 295, { untouchedOver24hTarget: 0 }),
  agent('u-arjun', 'Arjun Deshpande', 16, 49, 4, 220),
  agent('u-priya', 'Priya Nair', 12, 44, 2, 185),
  agent('u-sneha', 'Sneha Kulkarni', 10, 41, 2, 200),
  agent('u-vikram', 'Vikram Rao', 8, 38, 3, 235),
  // On leave, still holding 7 tickets, all untouched. "agent goes on leave, her
  // mails just sit there" — visible without anyone remembering to look.
  agent('u-aditi', 'Aditi Joshi', 7, 31, 5, 260, {
    status: 'on_leave',
    leaveFrom: '2026-09-07T00:00:00+05:30',
    leaveUntil: '2026-09-11T23:59:59+05:30',
    untouchedOver24hTarget: 7
  }),
  agent('u-anjali', 'Anjali Menon', 6, 36, 1, 175),
  agent('u-nisha', 'Nisha Pillai', 5, 39, 2, 190),
  agent('u-karan', 'Karan Mehta', 4, 42, 3, 210),
  agent('u-divya', 'Divya Raut', 3, 40, 1, 165),
  agent('u-faisal', 'Faisal Shaikh', 2, 45, 2, 155),
  agent('u-sameer', 'Sameer Qureshi', 2, 37, 1, 180),
  agent('u-tanvi', 'Tanvi Gokhale', 1, 30, 0, 145)
];

export const ALL_USERS: readonly Agent[] = [
  ...AGENT_SEEDS.map(
    ({
      openTarget: _o,
      untouchedOver24hTarget: _u,
      weeklyHandled: _h,
      weeklyBreached: _b,
      weeklyMedianMinutes: _m,
      ...a
    }) => a
  ),
  ...LEADS
];

export const AGENTS: readonly Agent[] = ALL_USERS.filter((u) => u.role === 'agent');

export const agentById = (id: string | null): Agent | null =>
  id === null ? null : (ALL_USERS.find((a) => a.id === id) ?? null);
