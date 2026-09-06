/**
 * The swap point. This is the only file that changes when the real backend
 * arrives — every component imports `api` from here and nothing else.
 *
 *   import { api } from '@/services';
 *   const overview = await api.getTeamOverview();
 *
 * To go live:  export const api: SupportDeskApi = new HttpSupportDeskApi(baseUrl);
 */

import type { SupportDeskApi } from './api';

import { MockSupportDeskApi, readScenarioFromLocation, setMockScenario } from './mock/mockApi';

export const api: SupportDeskApi = new MockSupportDeskApi();

/** Call once at startup so `?mock=empty` etc. work without editing code. */
export function initMockScenarioFromUrl(): void {
  if (typeof window !== 'undefined') {
    setMockScenario(readScenarioFromLocation(window.location.search));
  }
}

export type { SupportDeskApi } from './api';
export { ApiError } from '../types/api';
export { setMockScenario, resetMockStore } from './mock/mockApi';
