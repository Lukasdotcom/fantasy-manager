describe("User", () => {
  before(() => {
    cy.exec("export APP_ENV=test; node cypress/e2e/user.js");
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
    cy.get("#usermenu").click();
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
    // Creates a league
    cy.contains("Leagues").click();
    cy.get("#name").type("Sample League");
    cy.get("button").contains("Create League").click();
    // Verifies that the user can not be deleted
    cy.contains("NS").click();
    cy.contains(
      "You can not be in any leagues if you want to delete your user."
    );
    // Leaves the league
    cy.contains("Leagues").click();
    cy.contains("Leave League").click();
    cy.get(".MuiDialogContent-root > .MuiFormControl-root").type(
      "Sample League"
    );
    cy.get(".MuiDialogActions-root > .MuiButton-contained").click();
    // Deletes the User
    cy.contains("NS").click();
    cy.contains("Delete User").click();
    cy.contains("NS").should("not.exist");
  });
});
