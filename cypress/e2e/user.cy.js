describe("User", () => {
  before(() => {
    cy.exec("export NODE_ENV=test; node cypress/e2e/user.mjs");
  });
  // Used to signup change username and password and login again
  it("signup", () => {
    // Signs in
    cy.visit("http://localhost:3000");
    cy.get("#login").click();
    cy.get("#input-username-for-Sign\\ Up-provider").type("Sample User");
    cy.get("#input-password-for-Sign\\ Up-provider").type("Sample Password");
    cy.contains("Sign in with Sign Up").click();
    // Edits the user
    cy.contains("SU").click();
    cy.get("#username").should("value", "Sample User");
    cy.get("#username").clear();
    cy.get("#username").type("New Sample Username");
    cy.contains("Change Username").click();
    cy.get('[href="/usermenu"]').click();
    cy.get("#username").should("value", "New Sample Username");
    cy.get("#password").type("New Password");
    cy.contains("Update Password").click();
    // Signs out
    cy.get("#logout").click();
    // Trys to sign in with the wrong password and username
    cy.visit("http://localhost:3000").then(() => {
      cy.get("#login").click();
    });
    cy.get("#input-username-for-Sign\\ In-provider").type("Sample User");
    cy.get("#input-password-for-Sign\\ In-provider").type("Sample Password");
    cy.contains("Sign in with Sign In").click();
    cy.contains("Sign in failed. Check the details you provided are correct.");
    // Trys to sign in with the wrong password and correct username
    cy.get("#input-username-for-Sign\\ In-provider").type(
      "New Sample Username"
    );
    cy.get("#input-password-for-Sign\\ In-provider").type("Sample Password");
    cy.contains("Sign in with Sign In").click();
    cy.contains("Sign in failed. Check the details you provided are correct.");
    // Trys to sign in with the correct password and correct username
    cy.get("#input-username-for-Sign\\ In-provider").type(
      "New Sample Username"
    );
    cy.get("#input-password-for-Sign\\ In-provider").type("New Password");
    cy.contains("Sign in with Sign In").click();
    cy.contains("NS");
  });
});
