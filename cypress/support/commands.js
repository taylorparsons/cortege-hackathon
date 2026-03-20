const BASE = 'http://localhost:3001';

Cypress.Commands.add('createHousehold', (name, location) => {
  return cy.request('POST', `${BASE}/api/households`, { name, location }).its('body');
});

Cypress.Commands.add('deleteHousehold', (id) => {
  return cy.request('DELETE', `${BASE}/api/households/${id}`);
});

Cypress.Commands.add('addMember', (householdId, data) => {
  return cy.request('POST', `${BASE}/api/households/${householdId}/members`, data).its('body');
});

Cypress.Commands.add('cleanupTestHouseholds', () => {
  return cy.request('GET', `${BASE}/api/households`).then(res => {
    const households = res.body;
    const toDelete = households.filter(h => h.name.startsWith('E2E Test'));
    toDelete.forEach(h => {
      cy.request('DELETE', `${BASE}/api/households/${h.household_id}`);
    });
  });
});

Cypress.Commands.add('openHouseholdSelector', () => {
  cy.get('[data-testid="btn-switch-household"]').click();
  cy.get('[data-testid="household-selector"]').should('be.visible');
});
