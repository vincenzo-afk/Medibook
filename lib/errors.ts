export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not found') {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class SlotAlreadyBookedError extends Error {
  constructor(message = 'Slot is no longer available') {
    super(message)
    this.name = 'SlotAlreadyBookedError'
  }
}

export class SlotHoldExpiredError extends Error {
  constructor(message = 'Slot hold expired') {
    super(message)
    this.name = 'SlotHoldExpiredError'
  }
}

export function toSafeErrorMessage(err: unknown): string {
  if (
    err instanceof SlotAlreadyBookedError ||
    err instanceof SlotHoldExpiredError ||
    err instanceof NotFoundError
  ) {
    return err.message
  }
  // Never leak internals / PII to the client.
  return 'Something went wrong. Please try again.'
}
