// PRD §13. One table per lifecycle. A missing entry means the action is not allowed from that state.
// ponytail: no paused / in_review enrollment states; add them with the pause (WRK-11) and review-claim features.
const enrollment = {
  applied: { withdraw: "withdrawn", reject: "declined", offer: "offered" },
  offered: { acceptOffer: "active", declineOffer: "offer_declined", expireOffer: "offer_expired", withdraw: "withdrawn" },
  active: { submit: "submitted", withdraw: "withdrawn" },
  submitted: { requestRevision: "revision_requested", complete: "completed", closeIncomplete: "closed_incomplete" },
  revision_requested: { submit: "submitted", withdraw: "withdrawn" },
  declined: {},
  withdrawn: {},
  offer_declined: {},
  offer_expired: {},
  completed: {},
  closed_incomplete: {},
} as const;

const listing = {
  draft: { submitForReview: "in_review" },
  in_review: { approve: "published", requestChanges: "changes_requested" },
  changes_requested: { submitForReview: "in_review" },
  published: { pause: "paused", close: "closed" },
  paused: { resume: "published", close: "closed" },
  closed: { archive: "archived" },
  archived: {},
} as const;

export type EnrollmentState = keyof typeof enrollment;
export type ListingState = keyof typeof listing;
export const ENROLLMENT_STATES = Object.keys(enrollment) as [EnrollmentState, ...EnrollmentState[]];
export const LISTING_STATES = Object.keys(listing) as [ListingState, ...ListingState[]];

// States where the student still holds or wants a place. Offers only count while unexpired.
export const LIVE_STATES = ["applied", "offered", "active", "submitted", "revision_requested"] as const;
export const SEAT_STATES = ["active", "submitted", "revision_requested"] as const;

type Actions<M> = { [S in keyof M]: keyof M[S] }[keyof M];

function step<M extends Record<string, Record<string, string>>>(machine: M, name: string) {
  return (from: keyof M, action: Actions<M>): string => {
    const to = (machine[from] as Record<string, string>)[action as string];
    if (!to) throw new TransitionError(`${name}: cannot ${String(action)} from ${String(from)}`);
    return to;
  };
}

export class TransitionError extends Error {}
export const nextEnrollment = step(enrollment, "enrollment") as (from: EnrollmentState, action: Actions<typeof enrollment>) => EnrollmentState;
export const nextListing = step(listing, "listing") as (from: ListingState, action: Actions<typeof listing>) => ListingState;
