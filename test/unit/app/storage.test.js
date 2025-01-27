import { BlobServiceClient } from '@azure/storage-blob'
import { storageConfig } from '../../../app/config/storage.js'
import { getBlob } from '../../../app/storage.js'

describe('Blob Storage Service', () => {
  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should initialize client with connection string and return buffer content', async () => {
    storageConfig.connectionString = 'fakeConnectionString'
    storageConfig.useConnectionString = true

    const blobContent = await getBlob('fakeFile.txt')

    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledWith('fakeConnectionString')
    expect(Buffer.from(blobContent).toString()).toEqual('fakeFile.txt')
  })

  it('should initialize client with managed identity', async () => {
    storageConfig.useConnectionString = false
    const blobContent = await getBlob('fakeFile.txt')

    expect(BlobServiceClient.fromConnectionString).toHaveBeenCalledTimes(0)
    expect(Buffer.from(blobContent).toString()).toEqual('fakeFile.txt')
  })
})
