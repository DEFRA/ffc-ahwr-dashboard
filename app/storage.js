const { BlobServiceClient } = require('@azure/storage-blob')
const { DefaultAzureCredential } = require('@azure/identity')
const { storage } = require('./config')
const { streamToBuffer } = require('./lib/streamToBuffer')

const getBlob = async (filename) => {
  const {
    connectionString,
    useConnectionString,
    applicationDocumentsContainer,
    storageAccount
  } = storage

  let blobServiceClient

  if (useConnectionString === true) {
    blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)
  } else {
    const uri = `https://${storageAccount}.blob.core.windows.net`
    blobServiceClient = new BlobServiceClient(uri, new DefaultAzureCredential())
  }

  const container = blobServiceClient.getContainerClient(applicationDocumentsContainer)
  const blobClient = container.getBlobClient(filename)
  const downloadResponse = await blobClient.download()
  const downloaded = await streamToBuffer(downloadResponse.readableStreamBody)
  return downloaded
}

module.exports = {
  getBlob
}
