describe("history", () => {
  beforeEach(() => {
    cy.visit("/");
    cy.get("canvas.maplibregl-canvas");
    cy.get("#explore-items").children();
    cy.get("#language").should("have.value", "1200");
  });
  it("updates query string when new language is selected", () => {
    cy.get("#language").select("1970");
    cy.location("search").should("not.equal", "");
  });
  it("updates query string when new year is selected", () => {
    cy.get("#year").select("2016");
    cy.location("search").should("not.equal", "");
  });
});
