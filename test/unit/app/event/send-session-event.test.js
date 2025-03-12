import { raiseEvent } from '../../../../app/event/raise-event.js'
import { sendSessionEvent } from '../../../../app/event/send-session-event.js'

jest.mock('../../../../app/event/raise-event')

let organisation
let event
const sessionId = '9e016c50-046b-4597-b79a-ebe4f0bf8505'
const entryKey = 'organisation'
const key = 'test'
const value = 'test value'
const ip = '1.1.1.1'

describe('Send event on session set', () => {
  beforeEach(async () => {
    organisation = {
      sbi: '123456789',
      email: 'email@email.com',
      cph: '123/456/789'
    }

    event = {
      name: 'send-session-event',
      type: `${entryKey}-${key}`,
      message: `Session set for ${entryKey} and ${key}.`
    }
  })

  afterEach(async () => {
    jest.resetAllMocks()
  })

  test('should call raiseEvent when a valid event is received', () => {
    sendSessionEvent(organisation, sessionId, entryKey, key, value, ip)
    expect(raiseEvent).toHaveBeenCalled()
  })

  test('should call raiseEvent with event including sessionId', () => {
    event = {
      ...event,
      sbi: organisation.sbi,
      email: organisation.email,
      cph: 'n/a',
      id: sessionId,
      data: { [key]: value },
      ip
    }

    sendSessionEvent(organisation, sessionId, entryKey, key, value, ip)
    expect(raiseEvent).toHaveBeenCalledWith(event)
  })

  test('should not call raiseEvent when an event with a null sessionId is received', () => {
    sendSessionEvent(organisation, null, entryKey, key, value, ip)
    expect(raiseEvent).not.toHaveBeenCalled()
  })

  test('should not call raiseEvent when an event with a null organisation is received', () => {
    sendSessionEvent(null, sessionId, entryKey, key, value, ip)
    expect(raiseEvent).not.toHaveBeenCalled()
  })
})
