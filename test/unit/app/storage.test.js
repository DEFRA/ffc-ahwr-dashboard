import { BlobServiceClient } from '@azure/storage-blob'
import { storageConfig } from '../../../app/config/storage.js'
import { getBlob } from '../../../app/storage.js'

describe('Blob Storage Service', () => {
  it('should initialize client with connection string and return buffer content', async () => {
    jest.spyOn(BlobServiceClient, 'fromConnectionString')

    storageConfig.connectionString = 'fakeConnectionString'
    storageConfig.useConnectionString = true

    const blobContent = await getBlob('fakeFile.txt')

    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith('fakeConnectionString')
    expect(Buffer.from(blobContent).toString()).toEqual('fakeFile.txt')
  })

  it('should initialize client with managed identity', async () => {
    jest.spyOn(BlobServiceClient, 'fromConnectionString')

    storageConfig.useConnectionString = false

    const blobContent = await getBlob('fakeFile.txt')

    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledTimes(0)
    expect(Buffer.from(blobContent).toString()).toEqual('fakeFile.txt')
  })
})
