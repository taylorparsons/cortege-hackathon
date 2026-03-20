const BASE = 'http://localhost:3001';

Cypress.Commands.add('createLocation', (name, city = 'Austin') => {
  return cy.request('POST', `${BASE}/api/locations`, {
    name,
    address: {
      line1: '123 Test Lane',
      line2: null,
      city,
      region: 'TX',
      postal_code: '78701',
      country: 'US',
    },
  }).its('body');
});

Cypress.Commands.add('createHousehold', (name, city) => {
  return cy.createLocation(`${name} Location`, city).then(location => (
    cy.request('POST', `${BASE}/api/households`, {
      name,
      location_id: location.location_id,
    }).its('body')
  ));
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
  }).then(() => cy.request('GET', `${BASE}/api/locations`)).then(res => {
    const locations = res.body;
    locations
      .filter(location => location.name.startsWith('E2E Test'))
      .forEach(location => {
        cy.request({
          method: 'DELETE',
          url: `${BASE}/api/locations/${location.location_id}`,
          failOnStatusCode: false,
        });
      });
  });
});

Cypress.Commands.add('openHouseholdSelector', () => {
  cy.get('[data-testid="btn-switch-household"]').click();
  cy.get('[data-testid="household-selector"]').should('be.visible');
});
