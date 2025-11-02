class PageHelper {
    getPageMap(dataMap, page){
        let map;
        switch (page){

            case "NB Login Page":
                map = dataMap.get("nbLoginPage");
                break;

            case "NB Chatbot Page":
                map = dataMap.get("nbChatbotPage");
                break;
            
            default:
                text = "Incorrect Page Name"; 
        }
        return map;
    }

    getElement(cssSelector, timeout = 60000){
        return cy.get(cssSelector,{ timeout: timeout});
    }
}

export default PageHelper;