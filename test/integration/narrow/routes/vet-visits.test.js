const { getEndemicsClaim, getCustomer } = require('../../../../app/session')
const { vetVisits } = require('../../../../app/config/routes')
const {
  getLatestApplicationsBySbi
} = require('../../../../app/api-requests/application-api')
const {
  getClaimsByApplicationReference
} = require('../../../../app/api-requests/claim-api')
const { multiSpecies } = require('../../../../app/config/index')
const cheerio = require('cheerio')
jest.mock('../../../../app/session')
jest.mock('../../../../app/api-requests/application-api')
jest.mock('../../../../app/api-requests/claim-api')
jest.mock('../../../../app/routes/utils/checks')
const HttpStatus = require('http-status-codes')
const { claimType } = require('../../../../app/constants/claim')
const checks = require('../../../../app/routes/utils/checks')

describe('Claim vet-visits', () => {
  beforeAll(async () => {
    checks.checkReviewIsPaidOrReadyToPay.mockReturnValue(false)
    jest.mock('../../../../app/config', () => ({
      ...jest.requireActual('../../../../app/config'),
      endemics: {
        enabled: true
      }
    }))
  })

  const organisation = { sbi: '112670111' }
  const attachedToMultipleBusinesses = true

  const applications = [
    {
      id: 'b13676a0-3a57-428e-a903-9dcf6eca104b',
      reference: 'AHWR-B136-76A0',
      type: 'VV'
    },
    {
      id: 'b13676a0-3a57-428e-a903-9dcf6eca104b',
      reference: 'AHWR-B136-76A0',
      type: 'EE'
    }
  ]

  const url = `/${vetVisits}`
  const claims = [
    {
      id: 'a94e2cce-b774-484f-95c0-94e93c82f311',
      reference: 'AHWR-A94E-2CCE',
      applicationReference: 'AHWR-B136-76A0',
      data: {
        vetsName: 'Afshin',
        dateOfVisit: '2024-02-28T00:00:00.000Z',
        dateOfTesting: '2024-02-28T00:00:00.000Z',
        laboratoryURN: 'URN4567',
        vetRCVSNumber: '1234567',
        speciesNumbers: 'yes',
        typeOfLivestock: 'sheep',
        numberAnimalsTested: '21'
      },
      statusId: 8,
      type: 'R',
      createdAt: '2024-02-26T14:14:43.632Z',
      updatedAt: '2024-02-28T15:09:03.185Z',
      createdBy: 'admin',
      updatedBy: null,
      status: { status: 'ON HOLD' }
    },
    {
      id: 'a94e2cce-b774-484f-95c0-94e93c82f311',
      reference: 'AHWR-A94E-2CCE',
      applicationReference: 'AHWR-B136-76A0',
      data: {
        vetsName: 'Afshin',
        dateOfVisit: '2024-02-28T00:00:00.000Z',
        dateOfTesting: '2024-02-28T00:00:00.000Z',
        laboratoryURN: 'URN4567',
        vetRCVSNumber: '1234567',
        speciesNumbers: 'yes',
        numberAnimalsTested: '21'
      },
      statusId: 18,
      type: 'E',
      createdAt: '2024-02-28T14:14:43.632Z',
      updatedAt: '2024-02-28T15:09:03.185Z',
      createdBy: 'admin',
      updatedBy: null,
      status: { status: 'ON HOLD' }
    },
    {
      id: 'a94e2cce-b774-484f-95c0-94e93c82f311',
      reference: 'AHWR-A94E-2CCE',
      applicationReference: 'AHWR-B136-76A0',
      data: {
        vetsName: 'Afshin',
        dateOfVisit: '2024-02-28T00:00:00.000Z',
        dateOfTesting: '2024-02-28T00:00:00.000Z',
        laboratoryURN: 'URN4567',
        vetRCVSNumber: '1234567',
        speciesNumbers: 'yes',
        numberAnimalsTested: '21'
      },
      statusId: 18,
      type: 'E',
      createdAt: '2024-02-27T14:14:43.632Z',
      updatedAt: '2024-02-28T15:09:03.185Z',
      createdBy: 'admin',
      updatedBy: null,
      status: { status: 'ON HOLD' }
    }
  ]

  test('GET /vet-visits route returns 200', async () => {
    const applications = [
      {
        id: 'b13676a0-3a57-428e-a903-9dcf6eca104b',
        reference: 'AHWR-B136-76A0',
        data: {
          type: 'EE',
          reference: null,
          declaration: true,
          offerStatus: 'accepted',
          organisation: {
            sbi: '112670111',
            farmerName: 'Anjana Donald Jaroslav Daniel Gooder',
            name: 'Kathryn Jeffery',
            email: 'anjanagooderz@redooganajnae.com.test',
            address: '1 Church Hill,WAKEFIELD,ST9 0DG,United Kingdom'
          },
          confirmCheckDetails: 'yes'
        },
        claimed: false,
        createdAt: '2024-02-28T14:45:13.071Z',
        updatedAt: '2024-02-28T14:45:13.112Z',
        createdBy: 'admin',
        updatedBy: null,
        statusId: 1,
        type: 'EE'
      },
      {
        id: 'b13676a0-3a57-428e-a903-9dcf6eca104b',
        reference: 'AHWR-B136-76A0',
        data: {
          type: 'EE',
          reference: null,
          declaration: true,
          offerStatus: 'accepted',
          organisation: {
            sbi: '112670111',
            farmerName: 'Anjana Donald Jaroslav Daniel Gooder',
            name: 'Kathryn Jeffery',
            email: 'anjanagooderz@redooganajnae.com.test',
            address: '1 Church Hill,WAKEFIELD,ST9 0DG,United Kingdom'
          },
          confirmCheckDetails: 'yes'
        },
        claimed: false,
        createdAt: '2024-02-26T14:45:13.071Z',
        updatedAt: '2024-02-28T14:45:13.112Z',
        createdBy: 'admin',
        updatedBy: null,
        statusId: 1,
        type: 'VV'
      }
    ]

    const claims = [
      {
        id: 'a94e2cce-b774-484f-95c0-94e93c82f311',
        reference: 'AHWR-A94E-2CCE',
        applicationReference: 'AHWR-B136-76A0',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-02-28T00:00:00.000Z',
          dateOfTesting: '2024-02-28T00:00:00.000Z',
          laboratoryURN: 'URN4567',
          vetRCVSNumber: '1234567',
          speciesNumbers: 'yes',
          typeOfLivestock: 'sheep',
          numberAnimalsTested: '21'
        },
        statusId: 8,
        type: 'R',
        createdAt: '2024-02-26T14:14:43.632Z',
        updatedAt: '2024-02-28T15:09:03.185Z',
        createdBy: 'admin',
        updatedBy: null,
        status: { status: 'ON HOLD' }
      },
      {
        id: 'a94e2cce-b774-484f-95c0-94e93c82f311',
        reference: 'AHWR-A94E-2CCE',
        applicationReference: 'AHWR-B136-76A0',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-02-28T00:00:00.000Z',
          dateOfTesting: '2024-02-28T00:00:00.000Z',
          laboratoryURN: 'URN4567',
          vetRCVSNumber: '1234567',
          speciesNumbers: 'yes',
          numberAnimalsTested: '21'
        },
        statusId: 18,
        type: 'E',
        createdAt: '2024-02-28T14:14:43.632Z',
        updatedAt: '2024-02-28T15:09:03.185Z',
        createdBy: 'admin',
        updatedBy: null,
        status: { status: 'ON HOLD' }
      },
      {
        id: 'a94e2cce-b774-484f-95c0-94e93c82f311',
        reference: 'AHWR-A94E-2CCE',
        applicationReference: 'AHWR-B136-76A0',
        data: {
          vetsName: 'Afshin',
          dateOfVisit: '2024-02-28T00:00:00.000Z',
          dateOfTesting: '2024-02-28T00:00:00.000Z',
          laboratoryURN: 'URN4567',
          vetRCVSNumber: '1234567',
          speciesNumbers: 'yes',
          numberAnimalsTested: '21'
        },
        statusId: 8,
        type: 'E',
        createdAt: '2024-02-27T14:14:43.632Z',
        updatedAt: '2024-02-28T15:09:03.185Z',
        createdBy: 'admin',
        updatedBy: null,
        status: { status: 'ON HOLD' }
      }
    ]

    const options = {
      method: 'GET',
      url,
      auth: {
        strategy: 'cookie',
        credentials: { reference: 'AHWR-2470-6BA9', sbi: '112670111' }
      }
    }

    getEndemicsClaim.mockReturnValueOnce({
      organisation: applications[0].data.organisation
    })
    getCustomer.mockReturnValueOnce({
      attachedToMultipleBusinesses: true
    })

    getLatestApplicationsBySbi.mockReturnValueOnce(applications)

    getClaimsByApplicationReference.mockReturnValueOnce(claims)

    const response = await global.__SERVER__.inject(options)
    const $ = cheerio.load(response.payload)
    const SBIText = 'Single Business Identifier (SBI): 112670111'

    expect($('#SBI').text()).toEqual(SBIText)
    expect($('#MBILink').text()).toEqual('Claim for a different business')
    expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK)
  })
  test('GET /vet-visits route without any claim returns 200', async () => {
    const applications = [
      {
        id: 'b13676a0-3a57-428e-a903-9dcf6eca104b',
        reference: 'AHWR-B136-76A0',
        data: {
          type: 'EE',
          reference: null,
          declaration: true,
          offerStatus: 'accepted',
          organisation: {
            sbi: '112670111',
            farmerName: 'Anjana Donald Jaroslav Daniel Gooder',
            name: 'Kathryn Jeffery',
            email: 'anjanagooderz@redooganajnae.com.test',
            address: '1 Church Hill,WAKEFIELD,ST9 0DG,United Kingdom'
          },
          confirmCheckDetails: 'yes'
        },
        claimed: false,
        createdAt: '2024-02-28T14:45:13.071Z',
        updatedAt: '2024-02-28T14:45:13.112Z',
        createdBy: 'admin',
        updatedBy: null,
        statusId: 9,
        type: 'EE'
      }
    ]

    const options = {
      method: 'GET',
      url,
      auth: {
        strategy: 'cookie',
        credentials: { reference: 'AHWR-2470-6BA9', sbi: '112670111' }
      }
    }

    getEndemicsClaim.mockReturnValueOnce({
      organisation: applications[0].data.organisation
    })
    getCustomer.mockReturnValueOnce({
      attachedToMultipleBusinesses: true
    })

    getLatestApplicationsBySbi.mockReturnValueOnce(applications)

    getClaimsByApplicationReference.mockReturnValueOnce()

    const response = await global.__SERVER__.inject(options)
    const $ = cheerio.load(response.payload)
    const SBIText = 'Single Business Identifier (SBI): 112670111'

    expect($('#SBI').text()).toEqual(SBIText)
    expect($('#MBILink').text()).toEqual('Claim for a different business')
    const button = $('.govuk-main-wrapper .govuk-button')
    expect(button.text()).toMatch('Start a new claim')
    expect(response.statusCode).toBe(HttpStatus.StatusCodes.OK)
  })

  test('GET /vet-visits route returns 302', async () => {
    const options = {
      method: 'GET',
      url,
      auth: false
    }

    getEndemicsClaim.mockReturnValueOnce({
      organisation: {
        sbi: '112670111',
        farmerName: 'Anjana Donald Jaroslav Daniel Gooder',
        name: 'Kathryn Jeffery'
      }
    })
    getCustomer.mockReturnValueOnce({
      attachedToMultipleBusinesses: false
    })

    getLatestApplicationsBySbi.mockReturnValueOnce([
      {
        reference: 'AHWR-2470-6BA9',
        type: 'EE'
      }
    ])

    const response = await global.__SERVER__.inject(options)
    expect(response.statusCode).toBe(HttpStatus.StatusCodes.MOVED_TEMPORARILY)
  })
  test('getClaimsByApplicationReference is called with the correct argument', async () => {
    const options = {
      method: 'GET',
      url,
      auth: false
    }
    const latestEndemicsApplication = {
      reference: 'AHWR-B136-76A0'
    }
    getClaimsByApplicationReference.mockReturnValueOnce()
    await global.__SERVER__.inject(options)

    expect(getClaimsByApplicationReference)
      .toHaveBeenCalledWith(latestEndemicsApplication.reference, expect.any(Object))
  })
  test('typeOfReviewTitle returns review', () => {
    const typeOfReviewTitle = (typeOfReview) => [claimType.review, 'VV'].includes(typeOfReview) ? 'review' : 'follow-up'
    const typeOfReview = claimType.review
    const result = typeOfReviewTitle(typeOfReview)
    expect(result).toBe('review')
  })

  test('typeOfReviewTitle returns follow-up', () => {
    const typeOfReviewTitle = (typeOfReview) => [claimType.review, 'VV'].includes(typeOfReview) ? 'review' : 'follow-up'
    const typeOfReview = 'claimType.endemics'
    const result = typeOfReviewTitle(typeOfReview)
    expect(result).toBe('follow-up')
  })
  test('statusTag returns status tag', () => {
    claims.statusId = 8

    const statusIdToFrontendStatusMapping = {
      8: 'PAID'
    }
    const statusTag = (claims) => `<strong class="govuk-tag ${'govuk-tag-- app-task-list__tag'}">${statusIdToFrontendStatusMapping[claims.statusId]}</strong>`
    expect(statusTag(claims)).toMatch('<strong class="govuk-tag govuk-tag-- app-task-list__tag">PAID</strong>')
  })
  describe('description', () => {
    const description = (claim) => {
      const { reference, data, type } = claim
      const livestock = data.typeOfLivestock || data.whichReview
      const review = type === 'R' ? 'review' : 'follow-up'
      return `${reference} - ${livestock} ${review} ${type}`
    }

    test('should return the correct description when typeOfLivestock is present', () => {
      const claim = {
        reference: 'AHWR-A94E-2CCE',
        data: {
          typeOfLivestock: 'sheep'
        },
        type: 'R'
      }

      const result = description(claim)

      expect(result).toMatch('AHWR-A94E-2CCE - sheep review')
    })

    test('should return the correct description when typeOfLivestock is not present', () => {
      const claim = {
        reference: 'AHWR-A94E-2CCE',
        data: {
          whichReview: 'cattle'
        },
        type: 'E'
      }

      const result = description(claim)

      expect(result).toMatch('AHWR-A94E-2CCE - cattle follow-up')
    })
  })
  describe('helper methods - vet visits ', () => {
    getEndemicsClaim.mockReturnValueOnce({ organisation })
    const sortByCreatedAt = (claims) => {
      return claims.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    getCustomer.mockReturnValueOnce({ attachedToMultipleBusinesses })
    getLatestApplicationsBySbi.mockReturnValueOnce(applications)
    getClaimsByApplicationReference.mockReturnValueOnce(claims)
    test('sortByCreatedAt should return sorted claims', () => {
      const sortedClaims = sortByCreatedAt(claims)
      expect(sortedClaims).toEqual(claims.sort(claims?.createdAt))
    })
  })

  test('shows notification banner when enabled', async () => {
    jest.resetAllMocks()
    jest.replaceProperty(multiSpecies, 'releaseDate', '2024-12-04')
    jest.replaceProperty(multiSpecies, 'enabled', true)

    const application = {
      type: 'EE',
      createdAt: '2024-12-03'
    }

    const options = {
      method: 'GET',
      url,
      auth: {
        strategy: 'cookie',
        credentials: { reference: 'AHWR-2470-6BA9', sbi: '112670111' }
      }
    }

    getEndemicsClaim.mockReturnValueOnce({ organisation: {} })
    getCustomer.mockReturnValueOnce({ attachedToMultipleBusinesses: false })
    getLatestApplicationsBySbi.mockReturnValueOnce([application])
    getClaimsByApplicationReference.mockReturnValueOnce([])

    const response = await global.__SERVER__.inject(options)
    const $ = cheerio.load(response.payload)

    expect($('.govuk-notification-banner__heading').text().trim())
      .toBe('You can now claim for more than one species.')
  })

  test('hides notification banner for old world applications', async () => {
    jest.resetAllMocks()
    jest.replaceProperty(multiSpecies, 'releaseDate', '2024-12-04')
    jest.replaceProperty(multiSpecies, 'enabled', true)

    const application = {
      type: 'VV',
      createdAt: '2024-12-03'
    }

    const options = {
      method: 'GET',
      url,
      auth: {
        strategy: 'cookie',
        credentials: { reference: 'AHWR-2470-6BA9', sbi: '112670111' }
      }
    }

    getEndemicsClaim.mockReturnValueOnce({ organisation: {} })
    getCustomer.mockReturnValueOnce({ attachedToMultipleBusinesses: false })
    getLatestApplicationsBySbi.mockReturnValueOnce([application])
    getClaimsByApplicationReference.mockReturnValueOnce([])

    const response = await global.__SERVER__.inject(options)
    const $ = cheerio.load(response.payload)

    expect($('.govuk-notification-banner__heading').length)
      .toBe(0)
  })
})
