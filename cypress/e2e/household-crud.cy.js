/**
 * household-crud.cy.js — Household create, switch, and delete via the UI.
 * Implements: FR-006 (docs/specs/20260320-cypress-e2e/spec.md)
 * Input: CR-20260320-1000
 */

describe('Household CRUD', () => {
  beforeEach(() => {
    cy.cleanupTestHouseholds();
    cy.visit('/');
  });

  it('opens the household selector modal via btn-switch-household', () => {
    cy.get('[data-testid="btn-switch-household"]').click();
    cy.get('[data-testid="modal-household-selector"]').should('be.visible');
    cy.get('[data-testid="household-selector"]').should('be.visible');
  });

  it('creates a new household and verifies it appears in the list', () => {
    const name = `E2E Test Create ${Date.now()}`;

    cy.openHouseholdSelector();
    cy.get('[data-testid="btn-new-household"]').click();
    cy.get('[data-testid="form-create-household"]').should('be.visible');

    cy.get('[data-testid="input-household-name"]').type(name);
    cy.get('[data-testid="input-household-location"]').type(`${name} Location`);
    cy.get('[data-testid="input-household-address-line1"]').type('123 Test Lane');
    cy.get('[data-testid="input-household-city"]').type('Austin');
    cy.get('[data-testid="input-household-region"]').type('TX');
    cy.get('[data-testid="input-household-postal-code"]').type('78701');
    cy.get('[data-testid="input-household-country"]').type('US');
    cy.get('[data-testid="btn-create-household"]').click();

    // The new household should now appear as a row in the selector
    cy.contains(name).should('be.visible');
  });

  it('switches to a different household and updates the household bar', () => {
    const name = `E2E Test Switch ${Date.now()}`;

    cy.createHousehold(name, 'Switch City').then(body => {
      const id = body.household_id;

      cy.visit('/');
      cy.openHouseholdSelector();

      cy.get(`[data-testid="household-row-${id}"]`).click();

      // Modal closes and household bar reflects the selected household
      cy.get('[data-testid="modal-household-selector"]').should('not.exist');
      cy.get('[data-testid="household-name"]').should('contain', name);
    });
  });

  it('deletes a household and removes it from the list', () => {
    // Create two households: select one as current, then delete the other.
    // The delete button only renders for non-current households in the selector.
    const keepName = `E2E Test Keep ${Date.now()}`;
    const deleteName = `E2E Test Delete ${Date.now() + 1}`;

    cy.createHousehold(keepName, 'Keep City').then(keepBody => {
      const keepId = keepBody.household_id;
      cy.createHousehold(deleteName, 'Delete City').then(deleteBody => {
        const deleteId = deleteBody.household_id;

        cy.visit('/');
        cy.openHouseholdSelector();

        // Select the keep household so it becomes the current one
        cy.get(`[data-testid="household-row-${keepId}"]`).click();
        cy.get('[data-testid="modal-household-selector"]').should('not.exist');

        // Re-open selector — delete button should now be visible for the non-current household
        cy.openHouseholdSelector();
        cy.on('window:confirm', () => true);
        cy.get(`[data-testid="btn-delete-household-${deleteId}"]`).click();

        // Deleted row should be gone
        cy.get(`[data-testid="household-row-${deleteId}"]`).should('not.exist');
      });
    });
  });

  it('renames the selected household from the selector editor', () => {
    const originalName = `E2E Test Rename ${Date.now()}`;
    const updatedName = `${originalName} Updated`;

    cy.createHousehold(originalName, 'Rename City').then((household) => {
      cy.visit('/');
      cy.openHouseholdSelector();
      cy.get(`[data-testid="household-row-${household.household_id}"]`).click();
      cy.get('[data-testid="modal-household-selector"]').should('not.exist');

      cy.openHouseholdSelector();
      cy.get('[data-testid="household-details-editor"]').scrollIntoView().should('be.visible');
      cy.get('[data-testid="input-edit-household-name"]').clear().type(updatedName);
      cy.get('[data-testid="btn-save-household"]').click();

      cy.get('[data-testid="household-name"]').should('contain', updatedName);
      cy.get(`[data-testid="household-row-${household.household_id}"]`).should('contain', updatedName);
    });
  });

  it('saves Twilio routing numbers and primary member from the household editor', () => {
    const name = `E2E Test Routing ${Date.now()}`;
    const twilioNumber = '+12065550121';
    const passThroughNumber = '+19147634039';

    cy.createHousehold(name, 'Routing City').then((household) => {
      cy.addMember(household.household_id, {
        name: 'Routing Adult A',
        phone: '+19147634039',
        date_of_birth: '1980-01-01',
        profile_type: 'adult',
        companion: 'sentinel',
      }).then((firstMember) => {
        cy.addMember(household.household_id, {
          name: 'Routing Adult B',
          phone: '+19147634753',
          date_of_birth: '1981-01-01',
          profile_type: 'adult',
          companion: 'sentinel',
        }).then((secondMember) => {
          cy.visit('/');
          cy.openHouseholdSelector();
          cy.get(`[data-testid="household-row-${household.household_id}"]`).click();
          cy.get('[data-testid="modal-household-selector"]').should('not.exist');

          cy.openHouseholdSelector();
          cy.get('[data-testid="household-details-editor"]').scrollIntoView().should('be.visible');
          cy.get('[data-testid="input-edit-household-twilio-number"]').clear().type(twilioNumber);
          cy.get('[data-testid="input-edit-household-pass-through-number"]').clear().type(passThroughNumber);
          cy.get('[data-testid="select-household-primary-member"]').select(secondMember.id);
          cy.get('[data-testid="btn-save-household"]').click();

          cy.request('GET', `http://localhost:3001/api/households/${household.household_id}`).then((response) => {
            expect(response.body.twilio_number).to.equal(twilioNumber);
            expect(response.body.pass_through_number).to.equal(passThroughNumber);
            const primaryMember = response.body.members.find((member) => member.is_primary);
            expect(primaryMember.id).to.equal(secondMember.id);
            const firstUpdated = response.body.members.find((member) => member.id === firstMember.id);
            expect(firstUpdated.is_primary).to.equal(false);
          });
        });
      });
    });
  });

  it('blocks deleting a referenced location until the household is reassigned', () => {
    const name = `E2E Test Location Block ${Date.now()}`;

    cy.createHousehold(name, 'Austin').then(household => {
      cy.createLocation(`E2E Test Alt Location ${Date.now()}`, 'Bend').then(alternateLocation => {
        cy.visit('/');
        cy.openHouseholdSelector();
        cy.get(`[data-testid="household-row-${household.household_id}"]`).click();
        cy.get('[data-testid="modal-household-selector"]').should('not.exist');

        cy.openHouseholdSelector();
        cy.on('window:confirm', () => true);
        cy.get(`[data-testid="btn-delete-location-${household.location_id}"]`).click();
        cy.get('[data-testid="location-manager-error"]').should('contain', household.name);

        cy.get('[data-testid="select-household-location"]').select(alternateLocation.location_id);
        cy.get('[data-testid="btn-update-household-location"]').click();
        cy.get(`[data-testid="btn-delete-location-${household.location_id}"]`).click();

        cy.get(`[data-testid="location-row-${household.location_id}"]`).should('not.exist');
      });
    });
  });
});
