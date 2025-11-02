export function getBaseUrl() {
  let envi = Cypress.env("ENV"); //Get the value of evnironment variable i.e ENV
  if (envi == "sandbox")
    //Check the value
    return "https://govgpt.sandbox.dge.gov.ae/"; //return desired url
}

export function generateString() {
  const alphabet = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";

  // Generate a random number between 0 and 25 for the first alphabet

  const randomAlphabetIndex = Math.floor(Math.random() * 26);

  // Generate a random number between 0 and 9 for the number

  const randomNumberIndex = Math.floor(Math.random() * 10);

  // Generate a random number between 0 and 25 for the second alphabet

  let randomAlphabetIndex2;

  do {
    randomAlphabetIndex2 = Math.floor(Math.random() * 26);
  } while (randomAlphabetIndex2 === randomAlphabetIndex);

  // Create the random string

  const randomString =
    alphabet.charAt(randomAlphabetIndex) +
    numbers.charAt(randomNumberIndex) +
    alphabet.charAt(randomAlphabetIndex2);

  return randomString;
}

export function generateRandomString(length) {
  const characters =
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let randomString = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}

export function generateRandomNumber(length) {
  if (length <= 0) return 0;

  // First digit must be between 1 and 9
  let result = Math.floor(Math.random() * 9) + 1 + "";

  // Remaining digits can be 0–9
  for (let i = 1; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }

  return Number(result);
}

export function generateAlphanumericString() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let alphanumericString = "";

  for (let i = 0; i < 10; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    alphanumericString += characters.charAt(randomIndex);
  }

  return alphanumericString;
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

