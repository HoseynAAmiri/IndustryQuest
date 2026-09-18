// Errors whose message is safe to show the user. Anything else is a bug and surfaces as a 500.
export class UserError extends Error {}
export class Forbidden extends UserError {
  constructor(message = "You don't have access to this.") { super(message); }
}
