describe("history", () => {
  beforeEach(() => {
    cy.intercept({ method: "GET", url: "/test/tiles/**/*" }).as("getTiles");
    cy.visit("/");
    // Wait until at least one tile has been requested so we know the map is ready
    cy.wait("@getTiles");
  });
  it("updates query string when new language is selected", () => {
    const languageSelect = cy.get("#language");
    languageSelect.should("have.value", "1200");
    cy.location("search").should("not.contain", "1970");
    languageSelect.select("1970");
    cy.location("search").should("contain", "languageCode=1970");
  });
  it("updates query string when new year is selected", () => {
    const yearSelect = cy.get("#year");
    cy.location("search").should("not.contain", "2016");
    yearSelect.select("2016");
    cy.location("search").should("contain", "year=2016");
  });
});

describe("year range", () => {
  it("does not throw when language code and year are in conflict", () => {
    cy.visit("/?languageCode=694&year=2019");
  });
  it("handles valid years correctly for old languages", () => {
    // Old year + old language
    cy.visit("/?languageCode=635&year=2012%2C2013");
    const yearStartSelect = cy.get("#year-start");
    yearStartSelect.should("have.value", "2012");
    yearStartSelect.get('[value="2016"]').should("be.disabled");
    const yearEndSelect = cy.get("#year-end");
    yearEndSelect.should("have.value", "2013");
    yearEndSelect.get('[value="2016"]').should("be.disabled");
  });
  it("handles valid years correctly for new languages", () => {
    // New year + new language
    cy.visit("/?languageCode=1125&year=2016%2C2019");
    const yearStartSelect = cy.get("#year-start");
    yearStartSelect.should("have.value", "2016");
    yearStartSelect.get('[value="2016"]').should("not.be.disabled");
    const yearEndSelect = cy.get("#year-end");
    yearEndSelect.should("have.value", "2019");
    yearEndSelect.get('[value="2016"]').should("not.be.disabled");
  });
});
