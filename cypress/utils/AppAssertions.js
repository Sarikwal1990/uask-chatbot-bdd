///<reference types="cypress" />
class AppAssertions {

  validateElementVisibleWithText(element, expectedText) {
    element
      .should("be.visible")
      .invoke("text")
      .then((actualText) => {
        expect(actualText.trim()).to.equal(expectedText.trim());
      });
  }
}

export default AppAssertions;