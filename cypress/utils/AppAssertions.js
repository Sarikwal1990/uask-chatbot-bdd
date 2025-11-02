///<reference types="cypress" />
class AppAssertions {
  validateElementVisibility(element, status) {
    if (status.toUpperCase() == "DISPLAYED") {
      element.should("be.visible");
    } else if (status.toUpperCase() == "NOT DISPLAYED") {
      element.should("not.be.visible");
    }
  }

  validateElementEnability(element, status) {
    if (
      status.toUpperCase() == "DISABLED" ||
      status.toUpperCase() == "NOT ENABLED"
    ) {
      element.should("be.disabled");
    } else if (status.toUpperCase() == "ENABLED") {
      element.should("not.be.disabled");
    }
  }

  validateElementChecked(element, status) {
    if (
      status.toUpperCase() == "CHECKED" ||
      status.toUpperCase() == "ON" ||
      status.toUpperCase() == "SELECTED"
    ) {
      element.should("be.checked");
    } else if (
      status.toUpperCase() == "UNCHECKED" ||
      status.toUpperCase() == "OFF" ||
      status.toUpperCase() == "UNSELECTED" ||
      status.toUpperCase() == "NOT SELECTED"
    ) {
      element.should("not.be.checked");
    } else {
      expect(true).to.equal(false);
    }
  }

  validateElementExistence(element, status) {
    if (status.toUpperCase() == "EXIST") {
      element.should("exist");
    } else if (status.toUpperCase() == "NOT EXIST") {
      element.should("not.exist");
    }
  }

  validateElementVisibleWithText(element, expectedText) {
    element
      .should("be.visible")
      .invoke("text")
      .then((actualText) => {
        expect(actualText.trim()).to.equal(expectedText.trim());
      });
  }

  validateElementColor(element, expectedColor) {
    element
      .should("be.visible")
      .and('have.css', 'color', expectedColor);
  }

  validateElementLength(element, expectedLength) {
    element.should("have.length", parseInt(expectedLength));
  }

  validateElementLengthGreaterThan(element, expectedLength) {
    element.its("length").should("be.gt", parseInt(expectedLength));
  }

  validateElementLengthLessThan(element, expectedLength) {
    element.its("length").should("be.lt", parseInt(expectedLength));
  }

  validateElementLengthGreaterThanOrEqual(element, referenceLength) {
    element.then(($el) => {
      expect($el.length).to.be.at.least(Number(referenceLength));
    });
  }

  validateElementLengthLessThanOrEqual(element, referenceLength) {
    element.then(($el) => {
      expect($el.length).to.be.at.most(Number(referenceLength));
    });
  }

  validateElementSelectibility(element, status) {
    if (status.toUpperCase() == "SELECTED") {
      element.should('not.have.attr', 'aria-selected', 'false');
    } else if (status.toUpperCase() == "NOT SELECTED") {
      element.should('not.have.attr', 'aria-selected', 'true');
    }
  }
}

export default AppAssertions;