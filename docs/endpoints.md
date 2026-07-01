# Walk Buddy Server Actions and Routes

Auth:

- `signUp(formData)`, `signIn(formData)` in `app/(app)/actions/auth.ts`
- `POST /logout`

Profiles and pets:

- `saveWalkerProfile`, `uploadWalkerPhoto`, `addAvailability`, `removeAvailability`
- `createPet`, `updatePet`, `deletePet`

Walks:

- `createWalkRequest`
- `chooseWalker`
- `acceptWalk`, `rejectWalk`, `startWalk`, `completeWalk`, `cancelWalk`

Recommender:

- `recommendForRequest(requestId)` computes ranked walkers and writes `recommendation_logs`.
- `markChosen(requestId, walkerId)` marks a recommendation as selected.

Social:

- `submitReview`
- `submitReport`
- `markRead`

Admin:

- `requireAdmin`
- `setReportStatus`

Main routes include `/walkers`, `/walks`, `/walks/new`, `/walks/[id]`, `/walker/requests`, `/walker/earnings`, `/notifications`, and `/admin/*`.
