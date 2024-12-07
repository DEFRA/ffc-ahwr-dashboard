const { multiSpecies } = require('../../config')

const userNeedsNotification = (applications, claims) => {
  const releaseDate = new Date(multiSpecies.releaseDate).getTime()

  const [latestApplication] = applications
  const appliedBeforeMultipleSpecies =
    Boolean(
      latestApplication &&
      new Date(latestApplication.createdAt).getTime() < releaseDate
    )

  const [latestClaim] = claims
  const hasNotClaimedSinceMultipleSpecies =
    Boolean(
      latestClaim === undefined ||
      new Date(latestClaim.createdAt).getTime() < releaseDate
    )

  return appliedBeforeMultipleSpecies && hasNotClaimedSinceMultipleSpecies
}

module.exports = { userNeedsNotification }
