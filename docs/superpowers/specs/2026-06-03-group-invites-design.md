# Group invites and join codes — design spec

**Date:** 2026-06-03  
**Status:** approved for implementation  
**Branch:** `splittaa-parannukset`

## Problem

Creating a group immediately adds selected users to `groups.members`. Users cannot accept or decline membership, and there is no shareable join link or QR code.

## Goals

1. On group creation, only the creator is a member; selected users receive **direct invites** (in-app + email).
2. Each new group gets one **open invite** (link + short display code + QR).
3. Invites expire after **7 days**; invitees may **decline** direct invites.
4. **Pending invites** are visible to group admins only, not regular members.
5. Open invites support **sign-up then join** via public `/join/[token]` page.

## Non-goals

- Migrating existing groups to invite model
- Push notifications
- Re-invite after decline (admin can create new group or future feature)

## Data model

Table `groupInvites`:

| Field | Type | Notes |
|-------|------|-------|
| `groupId` | `Id<"groups">` | Target group |
| `invitedBy` | `Id<"users">` | Sender |
| `invitedUserId` | optional `Id<"users">` | Set for `direct`; unset for `open` |
| `token` | string | Opaque URL token (UUID) |
| `displayCode` | optional string | Short code for open invites (e.g. 8 chars) |
| `kind` | `"direct"` \| `"open"` | |
| `status` | `pending` \| `accepted` \| `declined` \| `expired` \| `revoked` | |
| `expiresAt` | number | ms timestamp |
| `createdAt` | number | ms timestamp |

Indexes: `by_token`, `by_group_and_status`, `by_invited_user_and_status`, `by_display_code` (open codes).

`groups.members` contains only **accepted** members (creator always admin).

## API

| Function | Auth | Purpose |
|----------|------|---------|
| `contacts.createGroup` | required | Create group + invites + schedule emails |
| `groupInvites.getInvitePreview` | **public** | Safe preview for join page |
| `groupInvites.listMyPendingInvites` | required | User's pending direct invites |
| `groupInvites.acceptInvite` | required | Join group |
| `groupInvites.declineInvite` | required | Decline direct invite |
| `groupInvites.joinByCode` | required | Accept via display code |
| `groupInvites.listGroupInvites` | admin | Pending/revoked for admin UI |
| `groupInvites.revokeInvite` | admin | Revoke pending invite |
| `groupInvites.getOpenInviteForGroup` | member | Show QR/link on group page |

Email: `internal.email.sendGroupInviteEmail` scheduled from `createGroup` for each direct invite.

## Security

- `getInvitePreview`: no balances, expenses, or PII beyond inviter name and group title.
- Direct accept: `invitedUserId` must match current user.
- Open accept: user must not already be a member.
- Expired invites return Finnish error; lazy status update to `expired` optional.

## UI

- `create-group-modal`: invite copy, success panel with link/code/QR
- `/join/[token]`: public preview, Clerk sign-in/up with redirect, accept/decline
- Dashboard: pending invites list
- Group page (admin): pending invites + revoke + open invite display

## Testing

Convex tests for create, accept, decline, expiry, IDOR, open code, public preview bounds.
