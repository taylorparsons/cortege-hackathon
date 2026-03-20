/**
 * companion-cards.cy.js — Companion grid display and detail panel toggle tests.
 * Implements: FR-008 (docs/specs/20260320-cypress-e2e/spec.md)
 * Input: CR-20260320-1000
 *
 * NOTE: Companions are powered by the orchestrator's live agent instances.
 * These tests are resilient: they validate the grid container is always
 * present, and only assert on card/detail-panel behaviour when companion
 * cards are actually rendered by the backend.
 */

describe('Companion Cards', () => {
  let householdId;

  beforeEach(() => {
    cy.cleanupTestHouseholds();
    const name = `E2E Test Companion ${Date.now()}`;
    cy.createHousehold(name, 'Companion City').then(body => {
      householdId = body.household_id;

      cy.visit('/');
      cy.openHouseholdSelector();
      cy.get(`[data-testid="household-row-${householdId}"]`).click();
      cy.get('[data-testid="modal-household-selector"]').should('not.exist');
      cy.get('[data-testid="tab-household"]').click();
    });
  });

  it('companion grid container is visible on the household tab', () => {
    cy.get('[data-testid="companion-grid"]').should('be.visible');
  });

  it('clicking a companion card opens the detail panel', () => {
    // If companions are loaded, click the first one and assert the detail panel appears.
    // If none exist (backend has no agents running), this test is skipped gracefully.
    cy.get('[data-testid="companion-grid"]').then($grid => {
      const cards = $grid.children();
      if (cards.length === 0) {
        cy.log('No companion cards rendered — backend agents not running. Skipping assertion.');
        return;
      }
      cy.wrap(cards.first()).click();
      cy.get('[data-testid="detail-panel"]').should('be.visible');
    });
  });

  it('clicking the same companion card again closes the detail panel', () => {
    cy.get('[data-testid="companion-grid"]').then($grid => {
      const cards = $grid.children();
      if (cards.length === 0) {
        cy.log('No companion cards rendered — backend agents not running. Skipping assertion.');
        return;
      }
      // First click — opens detail panel
      cy.wrap(cards.first()).click();
      cy.get('[data-testid="detail-panel"]').should('be.visible');

      // Second click on same card — closes detail panel (toggles selectedId to null)
      cy.wrap(cards.first()).click();
      cy.get('[data-testid="detail-panel"]').should('not.exist');
    });
  });
});
