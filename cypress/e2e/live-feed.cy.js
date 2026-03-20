/**
 * live-feed.cy.js — Live Feed tab presence and event injector tests.
 * Implements: FR-009 (docs/specs/20260320-cypress-e2e/spec.md)
 * Input: CR-20260320-1000
 */

describe('Live Feed', () => {
  beforeEach(() => {
    cy.cleanupTestHouseholds();
    cy.visit('/');
    cy.get('[data-testid="tab-livefeed"]').click();
  });

  it('Live Feed tab shows event-feed and agent-status components', () => {
    cy.get('[data-testid="event-feed"]').should('be.visible');
    cy.get('[data-testid="agent-status"]').should('be.visible');
  });

  it('event injector form is visible and has a submit button', () => {
    cy.get('[data-testid="form-event-injector"]').should('be.visible');
    cy.get('[data-testid="btn-inject-event"]').should('be.visible');
  });
});
