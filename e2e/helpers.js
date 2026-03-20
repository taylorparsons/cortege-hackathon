const BASE = 'http://localhost:3001';

/**
 * Create a test household via the API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} name
 * @param {string} location
 * @returns {Promise<{household_id: string, name: string, location: string}>}
 */
export async function createTestHousehold(request, name, location) {
  const res = await request.post(`${BASE}/api/households`, {
    data: { name, location },
  });
  return res.json();
}

/**
 * Delete a test household by ID via the API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} id
 */
export async function deleteTestHousehold(request, id) {
  await request.delete(`${BASE}/api/households/${id}`);
}

/** Map profile type to companion agent name (mirrors MemberManager.jsx). */
const COMPANION_MAP = { child: 'scout', senior: 'anchor', adult: 'sentinel' };

/**
 * Add a member to a household via the API.
 * @param {import('@playwright/test').APIRequestContext} request
 * @param {string} householdId
 * @param {{ name: string, phone?: string, date_of_birth?: string, profile_type?: string }} data
 * @returns {Promise<{id: string, name: string, profile_type: string, companion: string}>}
 */
export async function addTestMember(request, householdId, data) {
  const profileType = data.profile_type ?? 'adult';
  const res = await request.post(`${BASE}/api/households/${householdId}/members`, {
    data: {
      ...data,
      profile_type: profileType,
      companion: COMPANION_MAP[profileType] ?? 'sentinel',
    },
  });
  return res.json();
}

/**
 * Delete all households whose name starts with "E2E Test".
 * Call in beforeEach to ensure a clean slate for each test.
 * @param {import('@playwright/test').APIRequestContext} request
 */
export async function cleanupTestHouseholds(request) {
  const res = await request.get(`${BASE}/api/households`);
  const households = await res.json();
  for (const hh of households) {
    if (hh.name.startsWith('E2E Test')) {
      await request.delete(`${BASE}/api/households/${hh.household_id}`);
    }
  }
}
