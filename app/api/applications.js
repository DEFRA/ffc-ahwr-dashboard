const Wreck = require('@hapi/wreck')
const { applicationApiUri } = require('../config')
const HttpStatus = require('http-status-codes');

async function getApplication (reference) {
  const url = `${applicationApiUri}/application/get/${reference}`
  try {
    const response = await Wreck.get(url, { json: true })
    if (response.res.statusCode !== HttpStatus.StatusCodes.OK) {
      return null
    }
    return response.payload
  } catch (err) {
    console.log(err)
    return null
  }
}
async function getApplications (searchType, searchText, limit, offset, filterStatus, sort) {
  const url = `${applicationApiUri}/application/search`
  const options = {
    payload: {
      search: { text: searchText, type: searchType },
      limit,
      offset,
      filter: filterStatus,
      sort
    },
    json: true
  }
  try {
    const response = await Wreck.post(url, options)
    if (response.res.statusCode !== HttpStatus.StatusCodes.OK) {
      return { applications: [], total: 0, applicationStatus: [] }
    }
    return response.payload
  } catch (err) {
    console.log(err)
    return { applications: [], total: 0, applicationStatus: [] }
  }
}

async function withdrawApplication (reference, user, status) {
  const url = `${applicationApiUri}/application/${reference}`
  const options = {
    payload: {
      user,
      status
    },
    json: true
  }
  try {
    await Wreck.put(url, options)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

async function processApplicationClaim (reference, user, approved) {
  const url = `${applicationApiUri}/application/claim`
  const options = {
    payload: {
      reference,
      user,
      approved
    },
    json: true
  }
  try {
    await Wreck.post(url, options)
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

async function updateApplicationStatus (reference, user, status) {
  const url = `${applicationApiUri}/application/${reference}`
  const options = {
    payload: {
      user,
      status
    },
    json: true
  }
  try {
    const response = await Wreck.put(url, options)
    if (response.res.statusCode !== HttpStatus.StatusCodes.OK) {
      return null
    }
    return true
  } catch (err) {
    console.log(err)
    return false
  }
}

async function getApplicationHistory (reference) {
  const url = `${applicationApiUri}/application/history/${reference}`
  try {
    const response = await Wreck.get(url, { json: true })
    if (response.res.statusCode !== HttpStatus.StatusCodes.OK) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (err) {
    console.error(`Getting application history for ${reference} failed: ${err.message}`)

    return { historyRecords: [] }
  }
}

async function getApplicationEvents (reference) {
  const url = `${applicationApiUri}/application/events/${reference}`
  try {
    const response = await Wreck.get(url, { json: true })
    if (response.res.statusCode !== HttpStatus.StatusCodes.OK) {
      throw new Error(`HTTP ${response.res.statusCode} (${response.res.statusMessage})`)
    }
    return response.payload
  } catch (err) {
    console.error(`Getting application events for ${reference} failed: ${err.message}`)

    return { eventRecords: [] }
  }
}

module.exports = {
  getApplications,
  getApplication,
  withdrawApplication,
  processApplicationClaim,
  getApplicationHistory,
  getApplicationEvents,
  updateApplicationStatus
}
