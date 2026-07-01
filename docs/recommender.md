# Recommender

The recommender is deterministic and explainable. It has no ML dependency.

## Hard Filters

Candidates are rejected before scoring when:

- profile is inactive;
- service region differs from request region;
- no availability slot covers the requested weekday/time;
- walker does not accept the pet size.

## Criteria

Default weights before normalization:

- region: 3
- availability: 3
- size: 2
- behavior: 1
- experience: 1
- price: 1.5
- rating: 2

Scores are normalized to `[0, 1]`. Rating uses a neutral prior of `0.6` when no review exists. The top three weighted contributions are shown as pt-BR reasons.

## Integration

`recommendForRequest(requestId)` loads the request, pet, candidates, availability, and walker ratings, ranks candidates, replaces previous recommendation logs for that request, and returns the ranked list. The walk detail page recomputes on load for open requests without a walker.
