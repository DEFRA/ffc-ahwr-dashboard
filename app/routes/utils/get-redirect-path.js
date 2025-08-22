import { config } from "../../config/index.js";
import {
  applicationType,
  closedViewStatuses,
  loginSources,
  viewStatus,
} from "../../constants/constants.js";
import { NoEndemicsAgreementError } from "../../exceptions/NoEndemicsAgreementError.js";
import { OutstandingAgreementError } from "../../exceptions/OutstandingAgreementError.js";
import { ClaimHasExpiredError } from "../../exceptions/ClaimHasExpired.js";

export function getRedirectPath(latestApplicationsForSbi, loginSource, sbi) {
  const endemicsApplyJourney = `${config.applyServiceUri}/endemics/check-details`;
  const dashboardEntry = `/check-details`;

  if (latestApplicationsForSbi.length === 0) {
    if (loginSource === loginSources.apply) {
      // send to endemics apply journey
      return endemicsApplyJourney;
    } else {
      // show the 'You need to complete an endemics application' error page
      throw new NoEndemicsAgreementError(
        `Business with SBI ${sbi} must complete an endemics agreement`,  //maybe one to talk about. User has no application in DB at all, we're showing an error here if they came in viaq dashboard or claim journey. Why don;t we just forward to apply journey?
      );
    }
  }

  //if they have an application,and it's new world...
  const latestApplication = latestApplicationsForSbi[0];
  if (latestApplication.type === applicationType.ENDEMICS) {
    if (latestApplication.statusId === viewStatus.AGREED) {
      return dashboardEntry;
    } else {
      return endemicsApplyJourney;
    }
  }

  //otherwise if it's old world the rest of these checks apply
  if (closedViewStatuses.includes(latestApplication.statusId)) {
    if (loginSource === loginSources.apply) {
      // send to endemics apply journey
      return endemicsApplyJourney;
    } else {
      // show the 'You need to complete an endemics application' error page
      throw new NoEndemicsAgreementError(
        `Business with SBI ${sbi} must complete an endemics agreement`,
      );
    }
  }

  if (loginSource === loginSources.apply) {
    throw new OutstandingAgreementError(
      `Business with SBI ${sbi} must claim or withdraw agreement before creating another`,
    );
  } else {
    // let's handle this here now, because nobody can go back and claim in this circumstance
    // trying to claim for an old world claim, which is in AGREED, or other non-final state

    const { startDate, endDate } = claimTimeLimitDates(latestApplication);
    throw new ClaimHasExpiredError(
      `Claim has expired for reference - ${latestApplication.reference}`,
      startDate,
      endDate,
    );
  }
}

function claimTimeLimitDates(latestApplication) {
  const start = new Date(latestApplication.createdAt);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 6);
  return {
    startDate: start.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    endDate: end.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
}
