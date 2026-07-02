# Recommender

The recommender uses local deterministic filters first, then can ask an OpenRouter
LLM to choose the best walker among the eligible candidates. If the LLM is not
configured, fails, returns invalid JSON, or chooses an unknown walker, the app
keeps the local deterministic ranking.

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

## OpenRouter LLM

Set these server-side env vars to enable the LLM choice:

- `OPENROUTER_API_KEY`: OpenRouter API key.
- `OPENROUTER_MODEL`: model name, default `cohere/north-mini-code:free`.
- `OPENROUTER_BASE_URL`: default `https://openrouter.ai/api/v1`.
- `OPENROUTER_TIMEOUT_MS`: request timeout before local fallback, default `8000`.

The prompt asks for JSON only:

```json
{"walkerId":"<id>","reason":"<pt-BR reason>","confidence":0.88}
```

Only walker IDs already present in the local eligible ranking are accepted.
