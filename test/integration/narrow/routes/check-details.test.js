const cheerio = require('cheerio')
const expectPhaseBanner = require('../../../utils/phase-banner-expect')
const getCrumbs = require('../../../utils/get-crumbs')
const sessionKeys = require('../../../../app/session/keys')
const HttpStatus = require('http-status-codes')

describe('Org review page test', () => {
  let session
  let authMock
  const url = '/check-details'
  const auth = {
    credentials: { reference: '1111', sbi: '111111111' },
    strategy: 'cookie'
  }
  const org = {
    farmerName: 'Dairy Farmer',
    address: ' org-address-here',
    cph: '11/222/3333',
    email: 'org@test.com',
    orgEmail: 'orgEmail@test.com',
    name: 'org-name',
    sbi: '123456789'
  }

  describe(`GET ${url} route when logged in`, () => {
    beforeAll(async () => {
      jest.resetAllMocks()
      jest.resetModules()

      session = require('../../../../app/session')
      jest.mock('../../../../app/session')
      jest.mock('../../../../app/config', () => ({
        ...jest.requireActual('../../../../app/config'),
        authConfig: {
          defraId: {
            hostname: 'https://tenant.b2clogin.com/tenant.onmicrosoft.com',
            oAuthAuthorisePath: '/oauth2/v2.0/authorize',
            policy: 'b2c_1a_signupsigninsfi',
            redirectUri: 'http://localhost:3003/signin-oidc',
            clientId: 'dummy_client_id',
            serviceId: 'dummy_service_id',
            scope: 'openid dummy_client_id offline_access'
          },
          ruralPaymentsAgency: {
            hostname: 'dummy-host-name',
            getPersonSummaryUrl: 'dummy-get-person-summary-url',
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
            getOrganisationUrl: 'dummy-get-organisation-url'
          }
        },
        endemics: {
          enabled: true
        }
      }))
      jest.mock('../../../../app/auth')
      authMock = require('../../../../app/auth')
    })

    test('returns 200', async () => {
      const crn = '123456789'
      session.getEndemicsClaim.mockReturnValue(org)
      session.getCustomer.mockReturnValue({ crn })
      const options = {
        auth,
        method: 'GET',
        url
      }

      authMock.requestAuthorizationCodeUrl.mockReturnValueOnce('https://somedefraidlogin')

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(200)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('Check your details')
      const keys = $('.govuk-summary-list__key')
      const values = $('.govuk-summary-list__value')
      expect(keys.eq(0).text()).toMatch('Farmer name')
      expect(values.eq(0).text()).toMatch(org.farmerName)
      expect(keys.eq(1).text()).toMatch('Business name')
      expect(values.eq(1).text()).toMatch(org.name)
      expect(keys.eq(2).text()).toMatch('CRN number')
      expect(values.eq(2).text()).toMatch(crn)
      expect(keys.eq(3).text()).toMatch('SBI number')
      expect(values.eq(3).text()).toMatch(org.sbi)
      expect(keys.eq(4).text()).toMatch('Organisation email address')
      expect(values.eq(4).text()).toMatch(org.orgEmail)
      expect(keys.eq(5).text()).toMatch('User email address')
      expect(values.eq(5).text()).toMatch(org.email)
      expect(keys.eq(6).text()).toMatch('Address')
      expect(values.eq(6).text()).toMatch(org.address)
      expect($('title').text()).toContain('Check your details - Get funding to improve animal health and welfare')
      expect($('.govuk-back-link').attr('href')).toContain('https://somedefraidlogin')
      expect($('legend').text().trim()).toEqual('Are these details correct?')
      expect($('.govuk-radios__item').length).toEqual(2)
      expect(authMock.requestAuthorizationCodeUrl).toBeCalledTimes(1)
      expectPhaseBanner.ok($)
    })

    test('returns 404 when no orgranisation', async () => {
      session.getEndemicsClaim.mockReturnValue(undefined)
      const options = {
        auth,
        method: 'GET',
        url
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('404 - Not Found')
      expect($('#_404 div p').text()).toEqual('Not Found')
      expectPhaseBanner.ok($)
    })
  })

  describe(`POST ${url} route`, () => {
    let crumb
    const method = 'POST'

    beforeEach(async () => {
      crumb = await getCrumbs(global.__SERVER__)
    })

    beforeAll(async () => {
      jest.mock('../../../../app/auth')
      authMock = require('../../../../app/auth')
      authMock.requestAuthorizationCodeUrl.mockReturnValue('https://somedefraidlogin')
      session = require('../../../../app/session')
      jest.mock('../../../../app/session')
      jest.mock('../../../../app/config', () => ({
        ...jest.requireActual('../../../../app/config'),
        authConfig: {
          defraId: {
            enabled: true
          },
          ruralPaymentsAgency: {
            hostname: 'dummy-host-name',
            getPersonSummaryUrl: 'dummy-get-person-summary-url',
            getOrganisationPermissionsUrl: 'dummy-get-organisation-permissions-url',
            getOrganisationUrl: 'dummy-get-organisation-url'
          }
        }
      }))
    })

    test('returns 302 to welcome page when acceptable answer given', async () => {
      session.getEndemicsClaim.mockImplementationOnce((_req, key) => {
        if (key === sessionKeys.endemicsClaim.organisation) {
          return org
        } else if (key === sessionKeys.endemicsClaim.confirmCheckDetails) {
          return 'yes'
        }
      })

      const options = {
        method: 'POST',
        url,
        payload: { crumb, confirmCheckDetails: 'yes' },
        auth: {
          credentials: { reference: '1111', sbi: '111111111' },
          strategy: 'cookie'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(302)
      expect(res.headers.location).toEqual('/vet-visits')
    })

    test('returns 200 with update your details recognised when no is answered', async () => {
      session.getEndemicsClaim.mockImplementationOnce((_req, key) => {
        if (key === sessionKeys.endemicsClaim.organisation) {
          return org
        } else if (key === sessionKeys.endemicsClaim.confirmCheckDetails) {
          return 'no'
        }
      })

      const options = {
        method,
        url,
        payload: { crumb, confirmCheckDetails: 'no' },
        auth: {
          credentials: { reference: '1111', sbi: '111111111' },
          strategy: 'cookie'
        },
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)
      expect(res.statusCode).toBe(HttpStatus.StatusCodes.OK)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('Update your details')
    })

    test.each([
      { confirmCheckDetails: null },
      { confirmCheckDetails: undefined },
      { confirmCheckDetails: 'wrong' },
      { confirmCheckDetails: '' }
    ])(
      'returns error when unacceptable answer is given',
      async ({ confirmCheckDetails }) => {
        session.getEndemicsClaim.mockImplementationOnce((_req, key) => {
          if (key === sessionKeys.endemicsClaim.organisation) {
            return org
          } else if (key === sessionKeys.endemicsClaim.confirmCheckDetails) {
            return confirmCheckDetails
          }
        })
        const options = {
          method,
          url,
          payload: { crumb, confirmCheckDetails },
          auth,
          headers: { cookie: `crumb=${crumb}` }
        }

        const res = await global.__SERVER__.inject(options)

        expect(res.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST)
        expect(res.request.response.variety).toBe('view')
        expect(res.request.response.source.template).toBe('check-details')
        expect(res.result).toContain(org.sbi)
        expect(res.result).toContain(org.farmerName)
        expect(res.result).toContain(org.address)
        expect(res.result).toContain(org.name)
      }
    )

    test("returns 400 and show error summary if user didn't select answer", async () => {
      session.getEndemicsClaim.mockImplementationOnce((_req, key) => {
        if (key === sessionKeys.endemicsClaim.organisation) {
          return org
        } else if (key === sessionKeys.endemicsClaim.confirmCheckDetails) {
          return ''
        }
      })
      const options = {
        method,
        url,
        payload: { crumb, confirmCheckDetails: '' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(HttpStatus.StatusCodes.BAD_REQUEST)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-error-summary .govuk-list').text().trim()).toEqual('Select if these details are correct')
    })

    test('returns 404 when no orgranisation', async () => {
      session.getEndemicsClaim.mockImplementationOnce((_req, key) => {
        if (key === sessionKeys.endemicsClaim.organisation) {
          return undefined
        } else if (key === sessionKeys.endemicsClaim.confirmCheckDetails) {
          return ''
        }
      })
      const options = {
        method: 'POST',
        url,
        payload: { crumb, confirmCheckDetails: '' },
        auth,
        headers: { cookie: `crumb=${crumb}` }
      }

      const res = await global.__SERVER__.inject(options)

      expect(res.statusCode).toBe(HttpStatus.StatusCodes.NOT_FOUND)
      const $ = cheerio.load(res.payload)
      expect($('.govuk-heading-l').text()).toEqual('404 - Not Found')
      expect($('#_404 div p').text()).toEqual('Not Found')
      expectPhaseBanner.ok($)
    })
  })
})
