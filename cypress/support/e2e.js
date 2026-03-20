import './commands';

afterEach(function () {
  const test = this.currentTest;
  if (!test || test.state === 'pending') return;

  const title = typeof test.titlePath === 'function'
    ? test.titlePath().join(' -- ')
    : test.fullTitle();

  cy.screenshot(title, { capture: 'viewport', overwrite: true });
});
