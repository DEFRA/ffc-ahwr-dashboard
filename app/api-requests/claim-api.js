const Wreck = require('@hapi/wreck')
const config = require('../config')

async function getClaimsByApplicationReference (applicationReference) {
  try {
    const response = await Wreck.get(
      `${config.applicationApiUri}/claim/get-by-application-reference/${applicationReference}`,
      { json: true }
    )
    if (response.res.statusCode !== 200) {
      throw new Error(
        `HTTP ${response.res.statusCode} (${response.res.statusMessage})`
      )
    }
    return response.payload
  } catch (error) {
    console.error(
      `${new Date().toISOString()} Getting claims for application with reference ${applicationReference} failed`
    )
    return null
  }
}

function isWithinLastTenMonths (date) {
  if (!date) {
    return false // Date of visit was introduced more than 10 months ago
  }

  const start = new Date(date)
  const end = new Date(start)

  end.setMonth(end.getMonth() + 10)
  end.setHours(23, 59, 59, 999) // set to midnight of the agreement end day

  return Date.now() <= end
}

module.exports = {
  isWithinLastTenMonths,
  getClaimsByApplicationReference
}
