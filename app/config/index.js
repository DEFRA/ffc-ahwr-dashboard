import joi from "joi";
import appInsights from "applicationinsights";
import {
  applicationApiConfig,
  applicationApiConfigSchema,
} from "../api-requests/application-api.config.js";

const threeDaysInMs = 1000 * 3600 * 24 * 3;
const oneYearInMs = 1000 * 60 * 60 * 24 * 365;
const DEFAULT_REDIT_PORT = 6379;

export const getConfig = () => {
  const schema = joi.object({
    appInsights: joi.object(),
    namespace: joi.string().optional(),
    cache: {
      expiresIn: joi.number().required(),
      options: {
        host: joi.string(),
        partition: joi.string(),
        password: joi.string().allow(""),
        port: joi.number().required(),
        tls: joi.object(),
      },
    },
    cookie: {
      cookieNameCookiePolicy: joi.string(),
      cookieNameAuth: joi.string(),
      cookieNameSession: joi.string(),
      isSameSite: [joi.string(), joi.bool()],
      isSecure: joi.boolean(),
      password: joi.string().min(32).required(),
      ttl: joi.number().required(),
    },
    cookiePolicy: {
      clearInvalid: joi.bool(),
      encoding: joi.string().valid("base64json"),
      isSameSite: [joi.string(), joi.bool()],
      isSecure: joi.bool(),
      password: joi.string().min(32).required(),
      path: joi.string().default("/"),
      ttl: joi.number().required(),
    },
    env: joi
      .string()
      .valid("development", "test", "production")
      .default("development"),
    displayPageSize: joi.number().required(),
    googleTagManagerKey: joi.string().allow(null, ""),
    isDev: joi.boolean(),
    applicationApiUri: joi.string().uri(),
    port: joi.number().required(),
    serviceUri: joi.string().uri(),
    claimServiceUri: joi.string().uri(),
    applyServiceUri: joi.string().uri(),
    serviceName: joi.string(),
    useRedis: joi.boolean(),
    customerSurvey: {
      uri: joi.string().uri().optional(),
    },
    applicationApi: applicationApiConfigSchema,
    wreckHttp: {
      timeoutMilliseconds: joi.number().required(),
    },
    multiSpecies: joi.object({
      releaseDate: joi.string().required(),
    }),
    devLogin: {
      enabled: joi.bool().required(),
    },
    latestTermsAndConditionsUri: joi.string().required(),
    reapplyTimeLimitMonths: joi.number(),
    multiHerds: joi.object({
      releaseDate: joi.string().required(),
    }),
    privacyPolicyUri: joi.string().uri(),
    lfsUpdate: {
      enabled: joi.boolean(),
      uri: joi.string().uri().optional(),
    },
  });

  const config = {
    appInsights,
    namespace: process.env.NAMESPACE,
    cache: {
      expiresIn: threeDaysInMs,
      options: {
        host: process.env.REDIS_HOSTNAME ?? "redis-hostname.default",
        partition: "ffc-ahwr-frontend",
        password: process.env.REDIS_PASSWORD,
        port: Number.parseInt(
          process.env.REDIS_PORT ?? DEFAULT_REDIT_PORT.toString(),
          10,
        ),
        tls: process.env.NODE_ENV === "production" ? {} : undefined,
      },
    },
    cookie: {
      cookieNameCookiePolicy: "ffc_ahwr_cookie_policy",
      cookieNameAuth: "ffc_ahwr_auth",
      cookieNameSession: "ffc_ahwr_session",
      isSameSite:
        process.env.DISABLE_COOKIE_SAME_SITE === "true" ? false : "Lax",
      isSecure: process.env.NODE_ENV === "production",
      password: process.env.COOKIE_PASSWORD,
      ttl: threeDaysInMs,
    },
    cookiePolicy: {
      clearInvalid: false,
      encoding: "base64json",
      isSameSite:
        process.env.DISABLE_COOKIE_SAME_SITE === "true" ? false : "Lax",
      isSecure: process.env.NODE_ENV === "production",
      password: process.env.COOKIE_PASSWORD,
      ttl: oneYearInMs,
    },
    env: process.env.NODE_ENV,
    displayPageSize: Number.parseInt(process.env.DISPLAY_PAGE_SIZE ?? "20", 10),
    googleTagManagerKey: process.env.GOOGLE_TAG_MANAGER_KEY,
    isDev: process.env.NODE_ENV === "development",
    applicationApiUri: process.env.APPLICATION_API_URI,
    port: Number.parseInt(process.env.PORT ?? "3000", 10),
    serviceUri: process.env.SERVICE_URI,
    claimServiceUri: process.env.CLAIM_SERVICE_URI,
    applyServiceUri: process.env.APPLY_SERVICE_URI,
    useRedis: process.env.NODE_ENV !== "test",
    serviceName: "Get funding to improve animal health and welfare",
    customerSurvey: {
      uri: process.env.CUSTOMER_SURVEY_CLAIM_URI,
    },
    applicationApi: applicationApiConfig,
    wreckHttp: {
      timeoutMilliseconds: Number.parseInt(
        process.env.WRECK_HTTP_TIMEOUT_MILLISECONDS ?? "10000",
        10,
      ),
    },
    multiSpecies: {
      releaseDate: process.env.MULTI_SPECIES_RELEASE_DATE || "2024-12-06",
    },
    devLogin: {
      enabled: process.env.DEV_LOGIN_ENABLED === "true",
    },
    latestTermsAndConditionsUri: process.env.TERMS_AND_CONDITIONS_URL,
    reapplyTimeLimitMonths: 10,
    multiHerds: {
      releaseDate: process.env.MULTI_HERDS_RELEASE_DATE || "2025-05-01",
    },
    privacyPolicyUri: process.env.PRIVACY_POLICY_URI,
    lfsUpdate: {
      enabled: process.env.LFS_UPDATE_ENABLED === "true",
      uri: process.env.LFS_UPDATE_URI,
    },
  };

  const { error } = schema.validate(config, {
    abortEarly: false,
  });

  if (error) {
    throw new Error(`The server config is invalid. ${error.message}`);
  }

  return config;
};

export const config = getConfig();
