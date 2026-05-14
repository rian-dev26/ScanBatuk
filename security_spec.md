# Firebase Security Specification

## Data Invariants
- `User` documents require matching `request.auth.uid`.
- Screenings (`/screenings`) require `userId == request.auth.uid`.
- Chat Sessions (`/chat_sessions`) require `userId == request.auth.uid`.
- Chat Messages (`/chat_sessions/{sessionId}/messages`) require parent session `userId == request.auth.uid`.
- `EducationalArticle` can be read by anyone, but created/updated/deleted ONLY by admins.
- Admin status is verified via `exists` query on `/users/$(request.auth.uid)` with `role == 'admin'`. (Role cannot be set to admin by a user on create/update).

## The "Dirty Dozen" Payloads

1. **User Role Spoofing (Create)**
   Payload: `{ "email": "hacker@hacker.com", "name": "Hacker", "role": "admin", "createdAt": <now>, "updatedAt": <now> }`
   Expected: REJECT. `role` must be 'user' upon creation.

2. **User Role Spoofing (Update)**
   Payload: Update `role` from 'user' to 'admin'.
   Expected: REJECT. Only admins can assign roles.

3. **User Shadow Field**
   Payload: Valid user payload + `"isVerified": true`.
   Expected: REJECT. `affectedKeys().hasOnly()` or schema check will fail.

4. **Screening ID Poisoning**
   Payload: Target ID `some_very_long_string_123456789...`.
   Expected: REJECT. ID must be valid.

5. **Screening Orphan / Identity Spoofing**
   Payload: valid screening but `userId` is target victim's UID.
   Expected: REJECT. `userId == request.auth.uid` is required.

6. **Screening Size Exhaustion**
   Payload: `aiInsight` contains a 5MB string.
   Expected: REJECT. `.size() <= 2000` limit on strings.

7. **ChatSession Orphan**
   Payload: valid chat session, `userId` is victim's.
   Expected: REJECT. `userId == request.auth.uid`.

8. **ChatMessage on Others Session**
   Payload: Valid chat message added to a session owned by another user.
   Expected: REJECT. Must verify `get(/databases/$(database)/documents/chat_sessions/$(sessionId)).data.userId == request.auth.uid`.

9. **Article Spoofing**
   Payload: Create article as standard user.
   Expected: REJECT. Requires `isAdmin()`.

10. **Article Shadow Update**
    Payload: Attempt to update article with extra `malicious_field`.
    Expected: REJECT. Fails schema valid keys.

11. **Type Spoofing (Screening)**
    Payload: `riskScore` as string `"90"` instead of number.
    Expected: REJECT. Fails `is number` check.

12. **Timestamp spoofing**
    Payload: `createdAt` set to yesterday.
    Expected: REJECT. `createdAt == request.time`.
