/// referencetypes="cypress" />;

let data;
var testDataMap = new Map();
var pageDataMap = new Map();

before(" This block executed before all the tests", function (){

    cy.fixture("PageFactory/NBLoginPage").then(function (pageElements){
        data = pageElements;
        pageDataMap.set(
    "nbLoginPage",
    new Map(Object.entries(data))
);
    });

    cy.fixture("PageFactory/NBChatbotPage").then(function (pageElements){
        data = pageElements;
        pageDataMap.set(
    "nbChatbotPage",
    new Map(Object.entries(data))
);
    });
});

//Export testDataMap and pageDataMap for use in other files
module.exports = {testDataMap, pageDataMap};