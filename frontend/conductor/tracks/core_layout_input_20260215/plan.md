# Implementation Plan - Track: Terminal_Aviation_Timer

## Phase 1: Full-Stack Foundation (Backend & DB)

- [ ] Task: Set up Sequelize connection in `backend/config/database.ts`.
- [ ] Task: Define `Flight` model in `backend/models/Flight.ts` (UUIDs, Enums).
- [ ] Task: Build Express Router with POST (Create) and PATCH (Land) endpoints.
- [ ] Task: Initialize Server in `backend/index.ts` with CORS and DB sync.

## Phase 2: State Management & Logic (Pinia)

- [ ] Task: Install `@pinia/nuxt` and configure `nuxt.config.ts`.
- [ ] Task: Create `frontend/stores/useFlightStore.ts`.
  - [ ] Sub-task: Implement `startFlight` action (API POST + Interval).
  - [ ] Sub-task: Implement `landFlight` action (API PATCH + Clear Interval).

## Phase 3: The Glassmorphic UI (Terminal Dashboard)

- [ ] Task: Create `components/FlightTicket.vue`.
  - [ ] Sub-task: Apply Tailwind glassmorphism (`backdrop-blur-2xl`, `bg-black/40`).
  - [ ] Sub-task: Implement flight data inputs (BKK -> LHR) and Task Category.
  - [ ] Sub-task: Build the live countdown timer and "Hash-mark" progress bar.

## Phase 4: Integration

- [ ] Task: Mount `FlightTicket.vue` into `frontend/app.vue`.
- [ ] Task: Final end-to-end testing (Start Flight -> Watch Timer -> Verify DB update).
