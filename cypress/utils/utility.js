export function getBaseUrl() {
  let envi = Cypress.env("ENV"); //Get the value of evnironment variable i.e ENV
  if (envi == "sandbox")
    //Check the value
    return "https://govgpt.sandbox.dge.gov.ae/"; //return desired url
}

export function parseVariableValue(value, dataMap) {
  if (value.startsWith("context_")) {
    return getContextData(value);
  } else if (value.startsWith("data_")) {
    let data = value.split("_")[1];
    let moduleName = data.split(".")[0];
    let tempMap;
    tempMap = testDataHelper.getTesDataMap(dataMap, moduleName);
    if (data.split(".").length === 2) {
      return tempMap.get(data.split(".")[1]);
    } else if (data.split(".").length === 3) {
      return new Map(
        Object.entries(
          JSON.parse(JSON.stringify(tempMap.get(data.split(".")[1])))
        )
      ).get(data.split(".")[2]);
    }
  } else {
    return value;
  }
}

