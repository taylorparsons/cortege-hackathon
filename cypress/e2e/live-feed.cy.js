/**
 * live-feed.cy.js — Live Feed tab presence and event injector tests.
 * Implements: FR-009 (docs/specs/20260320-cypress-e2e/spec.md)
 * Input: CR-20260320-1000
 */

describe('Live Feed', () => {
  beforeEach(() => {
    cy.cleanupTestHouseholds();
  });

  it('Live Feed tab shows event-feed and agent-status components', () => {
    cy.visit('/');
    cy.get('[data-testid="tab-livefeed"]').click();
    cy.get('[data-testid="event-feed"]').should('be.visible');
    cy.get('[data-testid="agent-status"]').should('be.visible');
  });

  it('event injector form is visible and has a submit button', () => {
    cy.visit('/');
    cy.get('[data-testid="tab-livefeed"]').click();
    cy.get('[data-testid="form-event-injector"]').should('be.visible');
    cy.get('[data-testid="btn-inject-event"]').should('be.visible');
  });

  it('event injector target list uses the selected household members', () => {
    cy.createHousehold('E2E Test Live Feed Household', 'Seattle').then((household) => {
      cy.addMember(household.household_id, {
        name: 'Sam Dodge',
        phone: '+19147634039',
        date_of_birth: '2000-01-01',
        profile_type: 'adult',
        companion: 'sentinel',
      });

      cy.addMember(household.household_id, {
        name: 'Chip Parsons',
        phone: '+19147634753',
        date_of_birth: '1998-01-01',
        profile_type: 'adult',
        companion: 'anchor',
      });

      cy.visit('/', {
        onBeforeLoad(win) {
          win.localStorage.setItem('cortege_current_household', household.household_id);
        },
      });
      cy.get('[data-testid="tab-livefeed"]').click();
      cy.get('[data-testid="form-event-injector"] select').eq(1)
        .find('option')
        .then(($options) => {
          const labels = [...$options].map((option) => option.textContent.trim());
          expect(labels.some((label) => label.includes('Sam Dodge'))).to.equal(true);
          expect(labels.some((label) => label.includes('Chip Parsons'))).to.equal(true);
          expect(labels.some((label) => label.includes('Alex'))).to.equal(false);
          expect(labels.some((label) => label.includes('Mom'))).to.equal(false);
          expect(labels.some((label) => label.includes('Taylor'))).to.equal(false);
        });
    });
  });

  it('newly created companions start with an empty activity API response', () => {
    cy.createHousehold('E2E Test Empty Activity Household', 'Denver').then((household) => {
      cy.addMember(household.household_id, {
        name: 'Sam Dodge',
        phone: '+19147634039',
        date_of_birth: '2000-01-01',
        profile_type: 'adult',
        companion: 'sentinel',
      });

      cy.request(`http://localhost:3001/api/companions?household_id=${household.household_id}`)
        .its('body')
        .then((companions) => {
          const companion = companions.find((entry) => entry.memberName === 'Sam Dodge');
          expect(companion, 'Sam companion').to.exist;
          return cy
            .request(`http://localhost:3001/api/companions/${encodeURIComponent(companion.id)}/activity?limit=20&household_id=${household.household_id}`)
            .its('body')
            .should('deep.equal', []);
        });
    });
  });

});
