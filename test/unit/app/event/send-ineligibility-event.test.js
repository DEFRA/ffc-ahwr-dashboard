import { raiseIneligibilityEvent } from '../../../../app/event/raise-ineligibility-event'
import { raiseEvent } from '../../../../app/event/raise-event.js'

jest.mock('../../../../app/event/raise-event')

let event
const sessionId = '9e016c50-046b-4597-b79a-ebe4f0bf8505'
const sbi = '123'
const crn = 123
const exception = 'test exception'

describe('Send event on inegibile', () => {
  const MOCK_NOW = new Date()
  jest.useFakeTimers('modern')
  jest.setSystemTime(MOCK_NOW)

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should call raiseEvent when a valid event is received', async () => {
    await raiseIneligibilityEvent(sessionId, sbi, crn, 'random@email.com', exception)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent with event including sessionId', async () => {
    event = {
      id: sessionId,
      sbi,
      cph: 'n/a',
      email: 'random@email.com',
      name: 'send-ineligibility-event',
      type: 'ineligibility-event',
      message: `Apply: ${exception}`,
      data: {
        sbi,
        crn,
        exception,
        raisedAt: MOCK_NOW,
        journey: 'apply'
      },
      status: 'alert'
    }

    await raiseIneligibilityEvent(sessionId, sbi, crn, 'random@email.com', exception)
    expect(raiseEvent).toHaveBeenCalledWith(event, 'alert')
  })

  test('should not call raiseEvent when an event with a null sessionId is received', async () => {
    await raiseIneligibilityEvent(null, sbi, crn, 'random@email.com', exception)
    expect(raiseEvent).not.toHaveBeenCalled()
  })

  test('should not call raiseEvent when an event with a null exception is received', async () => {
    await raiseIneligibilityEvent(sessionId, sbi, crn, 'random@email.com', null)
    expect(raiseEvent).not.toHaveBeenCalled()
  })
})
