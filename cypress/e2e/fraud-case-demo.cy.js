describe('Fraud Case Demo', () => {
  beforeEach(() => {
    cy.cleanupTestHouseholds();
    cy.visit('/');
  });

  it('creates a household fraud case from a recent Twilio call and one evidence item', () => {
    const name = `E2E Test Fraud Case ${Date.now()}`;
    const twilioNumber = `+1206${String(Date.now()).slice(-7)}`;

    cy.createHousehold(name, 'Seattle').then((household) => {
      cy.request('PUT', `http://localhost:3001/api/households/${household.household_id}`, {
        twilio_number: twilioNumber,
      });

      cy.addMember(household.household_id, {
        name: 'Case Target',
        phone: '+19147634039',
        date_of_birth: '1980-01-01',
        profile_type: 'adult',
        companion: 'sentinel',
        is_primary: true,
      }).then((member) => {
        cy.request('POST', 'http://localhost:3001/api/events', {
          type: 'inbound_call',
          source: 'twilio',
          target_member: member.id,
          timestamp: new Date().toISOString(),
          payload: {
            from: '+12062857717',
            to: twilioNumber,
            twilio_call_sid: 'CA_E2E_FRAUD_001',
            call_status: 'ringing',
            direction: 'inbound',
          },
        }).then((eventResponse) => {
          const eventId = eventResponse.body.event.id;

          cy.openHouseholdSelector();
          cy.get(`[data-testid="household-row-${household.household_id}"]`).click();
          cy.get('[data-testid="modal-household-selector"]').should('not.exist');

          cy.get('[data-testid="tab-livefeed"]').click();
          cy.get('[data-testid="fraud-case-panel"]').should('be.visible');
          cy.get('[data-testid="select-fraud-case-event"]').select(eventId);
          cy.get('[data-testid="select-fraud-case-evidence-type"]').select('suspicious_url');
          cy.get('[data-testid="textarea-fraud-case-evidence"]').type(
            'Urgent. Verify your account now at http://bank-secure-login.net and do not tell anyone.'
          );
          cy.get('[data-testid="btn-create-fraud-case"]').click();

          cy.get('[data-testid="fraud-case-list"]').should('contain', 'high');
          cy.get('[data-testid="fraud-case-list"]').should('contain', 'suspicious_link');
          cy.get('[data-testid="fraud-case-list"]').should('contain', 'Verify through a known-good number');
        });
      });
    });
  });
});
