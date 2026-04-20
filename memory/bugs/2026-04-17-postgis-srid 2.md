# Bug: PostGIS ST_MakePoint without SRID breaks distance calculation

**Date:** 2026-04-17
**Area:** BE-003 / Supabase / PostGIS

## Symptom
`ST_Distance` / `ST_DWithin` returned `null` for all district comparisons, even though coordinates appeared correct in the database.

## Root Cause
`ST_MakePoint(lng, lat)` creates geometry with SRID 0 (undefined coordinate system). PostGIS cannot compute distances between geometries with undefined or mismatched SRIDs.

## Fix
Wrap every `ST_MakePoint` with `ST_SetSRID(..., 4326)` when inserting into a `geography` column:
```sql
ST_SetSRID(ST_MakePoint(44.7833, 41.6941), 4326)::geography
```

## Skill Updated
`skills/supabase.md` — "PostGIS district coordinates — always seed with ST_SetSRID or distance returns null"
