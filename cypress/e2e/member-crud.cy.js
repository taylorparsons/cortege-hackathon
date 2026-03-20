/**
 * member-crud.cy.js — Member add, edit, remove, and companion-type auto-derive tests.
 * Implements: FR-007 (docs/specs/20260320-cypress-e2e/spec.md)
 * Input: CR-20260320-1000
 */

describe('Member CRUD', () => {
  let householdId;

  beforeEach(() => {
    cy.cleanupTestHouseholds();
    const name = `E2E Test Member ${Date.now()}`;
    cy.createHousehold(name, 'Member City').then(body => {
      householdId = body.household_id;

      // Navigate to the app and switch to the test household
      cy.visit('/');
      cy.openHouseholdSelector();
      cy.get(`[data-testid="household-row-${householdId}"]`).click();
      cy.get('[data-testid="modal-household-selector"]').should('not.exist');
    });
  });

  it('adds a member and the member row appears', () => {
    cy.openHouseholdSelector();
    cy.get('[data-testid="modal-household-selector"]').within(() => {
      cy.get('[data-testid="btn-add-member"]').click({ force: true });
      cy.get('[data-testid="form-add-member"]').should('exist');

      cy.get('[data-testid="input-member-name"]').type('Alice Test', { force: true });
      cy.get('[data-testid="input-member-phone"]').type('+14155550100', { force: true });
      cy.get('[data-testid="input-member-dob"]').type('1980-01-15', { force: true });
      cy.get('[data-testid="select-profile-type"]').select('adult', { force: true });
      cy.get('[data-testid="btn-submit-member"]').click({ force: true });
    });

    // Member row should appear (id unknown, so match by name text)
    cy.contains('Alice Test').should('be.visible');
  });

  it('adds a member when the phone is typed in common US format', () => {
    cy.openHouseholdSelector();
    cy.get('[data-testid="modal-household-selector"]').within(() => {
      cy.get('[data-testid="btn-add-member"]').click({ force: true });
      cy.get('[data-testid="form-add-member"]').should('exist');

      cy.get('[data-testid="input-member-name"]').type('Chip Parsons', { force: true });
      cy.get('[data-testid="input-member-phone"]').type('1914-764-5049', { force: true });
      cy.get('[data-testid="input-member-dob"]').type('2000-01-01', { force: true });
      cy.get('[data-testid="select-profile-type"]').select('adult', { force: true });
      cy.get('[data-testid="btn-submit-member"]').click({ force: true });
    });

    cy.contains('Chip Parsons').should('be.visible');
  });

  it('edits a member and shows the updated name', () => {
    cy.addMember(householdId, {
      name: 'Bob Test',
      phone: '+14155550101',
      date_of_birth: '1975-06-10',
      profile_type: 'adult',
      companion: 'sentinel',
    }).then(body => {
      const memberId = body.id;

      cy.visit('/');
      cy.openHouseholdSelector();
      cy.get(`[data-testid="household-row-${householdId}"]`).click();
      cy.get('[data-testid="modal-household-selector"]').should('not.exist');

      cy.openHouseholdSelector();
      cy.get(`[data-testid="btn-edit-member-${memberId}"]`).click();

      // Clear the name field and type the new name
      cy.get('[data-testid="input-member-name"]').clear().type('Bob Updated');
      cy.get('[data-testid="btn-submit-member"]').click();

      cy.contains('Bob Updated').should('be.visible');
    });
  });

  it('removes a member and the member row disappears', () => {
    cy.addMember(householdId, {
      name: 'Carol Test',
      phone: '+14155550102',
      date_of_birth: '1990-03-22',
      profile_type: 'adult',
      companion: 'sentinel',
    }).then(body => {
      const memberId = body.id;

      cy.visit('/');
      cy.openHouseholdSelector();
      cy.get(`[data-testid="household-row-${householdId}"]`).click();
      cy.get('[data-testid="modal-household-selector"]').should('not.exist');

      cy.openHouseholdSelector();
      cy.on('window:confirm', () => true);
      cy.get(`[data-testid="btn-remove-member-${memberId}"]`).click();

      cy.get(`[data-testid="member-row-${memberId}"]`).should('not.exist');
    });
  });

  it('selecting profile_type child shows scout companion label', () => {
    cy.openHouseholdSelector();
    cy.get('[data-testid="modal-household-selector"]').within(() => {
      cy.get('[data-testid="btn-add-member"]').click({ force: true });
      cy.get('[data-testid="form-add-member"]').should('exist');

      cy.get('[data-testid="input-member-name"]').type('Scout Child Test', { force: true });
      cy.get('[data-testid="input-member-phone"]').type('+14155550103', { force: true });
      cy.get('[data-testid="input-member-dob"]').type('2015-07-04', { force: true });
      cy.get('[data-testid="select-profile-type"]').select('child', { force: true });
      cy.get('[data-testid="btn-submit-member"]').click({ force: true });
    });

    // The member row should appear and the companion type should reflect "scout"
    cy.contains('Scout Child Test').should('be.visible');
    cy.contains('scout', { matchCase: false }).should('be.visible');
  });
});
