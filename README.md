# SynapsePlay (FocusEngine 5+)

**Evidence-Aware Executive Function & Self-Regulation Platform for Children (5+)**

> **CRITICAL DISCLAIMER:**  
> SynapsePlay is a skill-building and educational support environment. It is **NOT** a medical device, diagnostic test, or clinical treatment, and makes no claims of ADHD cure or clinical symptom remediation.

---

## Architectural Highlights & Guardrails

- **Calming Sensory Palette (WCAG 2.2 AA Verified):**
  - Soft Sage (`#7A9A7B`), Warm Sand (`#EFE8D8`), Slate Blue (`#4A6B82`), Muted Charcoal (`#2C3539`), Accent Terracotta (`#D97757`).
  - Zero neon colors, zero chaotic confetti, zero rapid screen flashes.
- **Anti-Frustration Input (`400ms` Debounce):**
  - Rapid double-taps are gently absorbed without locking or freezing the screen punitively.
- **Speech Synthesis Independence:**
  - Every Greek voice prompt (`el-GR`) is paired with immediate visual pictograms (`100%` playable without audio).
- **100% Client-Side Privacy-by-Design:**
  - Local persistence via IndexedDB (`Dexie.js`) with a One-Click Data Wipe inside the arithmetic-gated Parent Dashboard.
- **12 Playable Executive Function Activities + Module 13 Smooth Landing:**
  - **Group A (Detective Eyes):** 01 Visual Search, 02 Spot the Difference, 03 Visual Memory.
  - **Group B (Think & Plan):** 04 Sequence Memory, 05 Order the Steps, 06 Switch the Rule.
  - **Group C (Pause & Choose):** 07 Move & Freeze, 08 Listen & Do, 09 Wait for the Signal.
  - **Group D (Move & Build):** 10 Copy the Animal, 11 Real-World Mission, 12 Build the Pattern.
  - **Module 13 (Smooth Landing):** Color-depleting session ring (no stressful digits), 2-minute advance calm banner, and resting avatar screen with real-world offline transition prompts.

---

## Commands

```bash
# Install dependencies
npm.cmd install

# Run unit & integration tests (Vitest + React Testing Library)
npm.cmd test

# Production typecheck & bundle build
npm.cmd run build

# Start local development server
npm.cmd run dev
```
