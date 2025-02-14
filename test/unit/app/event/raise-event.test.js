const { raiseEvent } = require('../../../../app/event/raise-event')
const { PublishEvent } = require('ffc-ahwr-event-publisher')

describe('raiseEvent function', () => {
  const testEvent = {
    name: 'Test Event',
    id: '12345',
    sbi: '123456789',
    cph: '12/345/6789',
    type: 'testType',
    message: 'Test message',
    data: { test: 'data' },
    email: 'test@example.com'
  }

  test('should call sendEvent with the correct event message structure', async () => {
    jest.spyOn(PublishEvent.prototype, 'sendEvent')
    await raiseEvent(testEvent)

    const expectedMessage = {
      name: testEvent.name,
      properties: {
        id: testEvent.id,
        sbi: testEvent.sbi,
        cph: testEvent.cph,
        checkpoint: process.env.APPINSIGHTS_CLOUDROLE,
        status: 'success',
        action: {
          type: testEvent.type,
          message: testEvent.message,
          data: testEvent.data,
          raisedBy: testEvent.email
        }
      }
    }

    expect(PublishEvent.prototype.sendEvent.mock.calls).toEqual([
      [expectedMessage]
    ])
  })

  test('should allow status override', async () => {
    jest.spyOn(PublishEvent.prototype, 'sendEvent')
    const customStatus = 'failed'
    await raiseEvent(testEvent, customStatus)

    expect(PublishEvent.prototype.sendEvent.mock.calls[0][0].properties.status)
      .toBe(customStatus)
  })
})
