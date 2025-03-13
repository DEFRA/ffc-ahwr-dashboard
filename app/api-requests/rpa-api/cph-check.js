import { NoEligibleCphError } from "../../exceptions/NoEligibleCphError.js";
import { getCphNumbers } from "./cph-numbers.js";

const between = (x, min, max) => {
  return x >= min && x <= max;
};

const inEngland = (cphNumber) => {
  // CPHs must be in England, therefore start with 01 to 51
  const england = {
    MIN: 1,
    MAX: 51,
  };
  return between(cphNumber.slice(0, 2), england.MIN, england.MAX);
};

const restrictedToCattlePigAndSheepLivestock = (cphNumber) => {
  // Need customers' associated CPH to not include slaughter houses or poultry
  const sliceNo = -4;
  const slaughterHousesOrPoultry = {
    MIN: 8000,
    MAX: 9999,
  };
  return !between(
    cphNumber.slice(sliceNo),
    slaughterHousesOrPoultry.MIN,
    slaughterHousesOrPoultry.MAX,
  );
};

const containAtLeastOneValidCph = (cphNumbers) =>
  cphNumbers.some(
    (cphNumber) =>
      inEngland(cphNumber) && restrictedToCattlePigAndSheepLivestock(cphNumber),
  );

export const customerMustHaveAtLeastOneValidCph = async (
  request,
  apimAccessToken,
) => {
  const cphNumbers = await getCphNumbers(request, apimAccessToken);
  if (!containAtLeastOneValidCph(cphNumbers)) {
    throw new NoEligibleCphError("Customer must have at least one valid CPH");
  }
};
