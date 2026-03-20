/**
 * navigation.cy.js — Navigation tab rendering and switching tests.
 * Implements: FR-005 (docs/specs/20260320-cypress-e2e/spec.md)
 * Input: CR-20260320-1000
 */

describe('Navigation', () => {
  beforeEach(() => {
    cy.cleanupTestHouseholds();
    cy.visit('/');
  });

  it('renders all 4 nav tabs', () => {
    cy.get('[data-testid="tab-household"]').should('be.visible');
    cy.get('[data-testid="tab-network"]').should('be.visible');
    cy.get('[data-testid="tab-philosophy"]').should('be.visible');
    cy.get('[data-testid="tab-livefeed"]').should('be.visible');
  });

  it('clicking tabs switches content', () => {
    // Start on household tab — household bar should be present
    cy.get('[data-testid="tab-household"]').click();
    cy.get('[data-testid="household-bar"]').should('be.visible');

    // Switch to Live Feed — event-feed should appear
    cy.get('[data-testid="tab-livefeed"]').click();
    cy.get('[data-testid="event-feed"]').should('be.visible');
    cy.get('[data-testid="household-bar"]').should('not.exist');
  });

  it('household bar shows household name when a household exists', () => {
    const name = `E2E Test Nav ${Date.now()}`;
    cy.createHousehold(name, 'Nav City').then(() => {
      cy.visit('/');
      cy.get('[data-testid="tab-household"]').click();
      cy.get('[data-testid="household-bar"]').should('be.visible');
      cy.get('[data-testid="household-name"]').should('not.be.empty');
    });
  });
});
