# API behavior notes

## Claim link lifecycle

1. Owner calls `POST /api/transfers`.
2. Server creates a cryptographically random 256-bit token, stores only its SHA-256 hash, and returns the raw token once in the URL.
3. Recipient signs in, opens the claim page, and calls the read-only preview endpoint. Opening the page does not mutate ownership.
4. After the recipient clicks Claim Box, the frontend sends `POST /api/transfers/claim`.
5. A serializable transaction changes the transfer from PENDING to CLAIMED only if it remains pending and unexpired; changes the box owner only if the sender is still its current owner; and appends the journey event. Any failed ownership condition rolls the transaction back.

## Important statuses

- `PENDING`: invitation exists; box remains owned by sender.
- `CLAIMED`: one recipient won; the box owner and permanent journey have been updated.
- `EXPIRED`: token expired when an explicit claim was attempted.

A different pending invitation for the same box may become unusable after another invitation transfers the box. Its preview/claim will return a conflict because the original sender no longer owns the box. This is intentional: ownership is authoritative, not the number of invitations.
