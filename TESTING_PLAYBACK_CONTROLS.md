# Testing Guide: Client-Side Playback Controls

This document provides step-by-step instructions for testing the new client-side playback architecture.

## Architecture Overview

The platform has transitioned from WebSocket streaming to REST + client-side playback:

- **Backend**: Computes complete solution once via `/api/simulations/solve` endpoint
- **Frontend**: Stores solution in memory and controls animation locally using `requestAnimationFrame`
- **Result**: Instant play/pause/seek, fixed axes, instant replay capability

## Prerequisites

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Backend will run on http://localhost:8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
# Frontend will run on http://localhost:5173
```

### Verify Backend is Running
```bash
curl http://localhost:8000/docs
# Should return FastAPI documentation page
```

## Test Scenarios

### Test 1: Load Preset and Compute Solution

**Steps:**
1. Open http://localhost:5173 in browser
2. Select preset: "Heat: Gaussian Diffusion"
3. Observe: Parameters auto-populate
4. Click "Validate" button
5. Expected: ✅ Green success message showing "CFL: σ = 0.1 < 0.5"
6. Click "Start" button
7. Expected: Loading indicator appears while solution computes
8. Expected: After ~1-2 seconds, plot appears with first frame
9. Verify: Plot shows gaussian distribution curve

**What's Working:**
- ✅ Preset loading
- ✅ Validation
- ✅ Complete solution computation (backend)
- ✅ Solution storage (frontend)

---

### Test 2: Play Animation

**Prerequisite:** Complete Test 1

**Steps:**
1. Click "Play" button
2. Expected: Animation starts immediately (no waiting for frames)
3. Observe plot: Curve should evolve smoothly over ~2 seconds
4. Expected: Y-axis range stays CONSTANT (no jumping)
5. Expected: ~50 frames displayed in ~2 seconds (50 fps)

**Verification:**
- Open browser DevTools (F12) → Console
- Look for logs showing frame progression
- Should see smooth continuous update

**What's Working:**
- ✅ Animation loop timing
- ✅ Frame advancement
- ✅ Fixed axis ranges (prevents jumping)
- ✅ Smooth render updates

---

### Test 3: Pause and Resume

**Prerequisite:** Test 2 running

**Steps:**
1. While animation playing, click "Pause" button
2. Expected: Animation freezes at current frame
3. Observe: Frame doesn't advance, plot stays static
4. Click "Play" button again
5. Expected: Animation resumes from same frame (not restarted)
6. Expected: Animation continues smoothly

**What's Working:**
- ✅ Pause stops `requestAnimationFrame` loop
- ✅ Resume continues from exact same state
- ✅ No backend communication (instant)

**Failure Indicators:**
- ❌ Animation doesn't pause (animation loop not stopping)
- ❌ Animation restarts from beginning (state not preserved)
- ❌ Animation stutters (timing calculation wrong)

---

### Test 4: Reset (Key Test for Data Preservation)

**Prerequisite:** Test 3 completed

**Steps:**
1. Animation is playing or paused somewhere in middle
2. Click "Reset" button
3. Expected: Animation returns to frame 0
4. Expected: Plot resets to initial gaussian curve
5. Expected: Status shows "IDLE" and ready to play
6. **CRITICAL**: Click "Play" immediately
7. Expected: Animation plays again from the beginning
8. Expected: No new computation, uses cached data
9. Observe: Animation starts instantly (no loading)

**Verification:**
- Open DevTools → Network tab
- During reset and replay: Should see NO API calls
- Only initial `/api/simulations/solve` should appear
- No new `/api/simulations/solve` on reset or replay

**What's Working:**
- ✅ Reset clears only `currentTimeIndex` (not `completeSolution`)
- ✅ Solution data preserved in memory
- ✅ Instant replay possible
- ✅ No re-computation needed

**This is the critical fix** - Reset should NOT delete the solution!

---

### Test 5: Slider Seeking

**Prerequisite:** Test 4 completed

**Steps:**
1. Animation paused or at any state
2. Locate timeline slider (shows "0 / 10" steps)
3. Click/drag slider to middle position
4. Expected: Plot instantly jumps to that time step
5. Expected: Frame number updates
6. Expected: NO loading indicator
7. Drag slider to end
8. Expected: Plot shows final state instantly
9. Drag slider back to beginning
10. Expected: Back to initial state instantly

**What's Working:**
- ✅ Slider updates `currentTimeIndex`
- ✅ Render updates immediately
- ✅ No network latency (data already loaded)
- ✅ Smooth seeking

**Performance Note:**
- Seeking should be instant (<50ms)
- No noticeable delay
- No loading spinner

---

### Test 6: Playback Speed Control

**Prerequisite:** Animation loaded and ready

**Steps:**
1. Click "Play" button
2. Observe animation speed (baseline: ~50 fps, takes ~2 seconds for 10 steps)
3. Pause animation
4. Find speed selector (dropdown or buttons)
5. Change to "2x" speed
6. Click "Play" again
7. Expected: Animation plays TWICE as fast
8. Expected: Same 10 frames in ~1 second
9. Change to "0.5x" speed
10. Click "Play" again
11. Expected: Animation plays HALF speed
12. Expected: Same 10 frames in ~4 seconds

**What's Working:**
- ✅ Speed multiplier affects `requestAnimationFrame` timing
- ✅ `targetFrameTime = 20ms / playbackSpeed`
- ✅ Smooth animation at all speeds

**Failure Indicators:**
- ❌ Speed change has no effect (multiplier not applied)
- ❌ Animation stutters at different speeds (timing math wrong)

---

### Test 7: Step Forward / Step Backward

**Prerequisite:** Animation ready (can be paused)

**Steps:**
1. Pause animation (or reset to beginning)
2. Click "Step Forward" button
3. Expected: Advances exactly 1 frame
4. Expected: Frame counter increments by 1
5. Click "Step Forward" again
6. Expected: Another single frame advance
7. Repeat until near end
8. Click "Step Forward" at last frame
9. Expected: Stays at last frame (doesn't wrap or error)
10. Click "Step Backward" button
11. Expected: Goes back 1 frame
12. Repeat several times to verify

**What's Working:**
- ✅ Manual frame-by-frame navigation
- ✅ Boundary checking (can't go below 0 or above nt-1)
- ✅ State update on each click

---

### Test 8: Fixed Axes (Gaussian Decay Verification)

**Prerequisite:** Heat equation animation running

**Steps:**
1. Start with Heat equation (Gaussian Diffusion preset)
2. Click Play
3. Watch the gaussian peak as it diffuses
4. **Key observation**: Peak gets lower as time progresses
5. Look at Y-axis scale
6. Expected: Y-axis range is FIXED throughout animation
7. Expected: Peak visibly shrinks within fixed range
8. Expected: No axis re-scaling

**Verification:**
- Compare Y-axis limits at frame 0 vs frame 10
- Should be identical (e.g., both "-0.1 to 1.1")
- Peak should fit entirely within fixed range

**Comparison with Old System:**
- Old system: Y-axis re-scales each frame (axis "jumps")
- New system: Y-axis locked to global min/max (no jumping)

**What's Working:**
- ✅ Global bounds computed upfront
- ✅ Fixed range applied to plot
- ✅ Prevents visual "jumping"

---

### Test 9: Wave Equation Support

**Prerequisite:** Backend running

**Steps:**
1. Open preset selector
2. Select "Wave: Plucked String"
3. Expected: Config updates with wave parameters (c=1.0)
4. Click "Validate"
5. Expected: ✅ Valid message with correct CFL
6. Click "Start"
7. Expected: Plot shows oscillating behavior (not decay)
8. Click "Play"
9. Expected: Animation shows wave traveling and reflecting
10. Expected: Y-axis fixed throughout
11. Reset and replay should work same as heat equation

**What's Working:**
- ✅ Wave equation preset support
- ✅ Correct CFL validation for wave (σ ≤ 1)
- ✅ Oscillatory behavior preserved
- ✅ All playback controls work

---

### Test 10: Multiple Simulations (Sequence Test)

**Prerequisite:** All tests passed

**Steps:**
1. Complete animation of Heat equation
2. Select Wave equation preset
3. Click "Start" button
4. Expected: New solution computed
5. Previous solution data cleared from display
6. New animation shows wave behavior
7. Play/pause/reset/seek all work correctly
8. Select Heat equation preset again
9. Repeat sequence 2-3 more times

**What's Working:**
- ✅ Clean state transition between simulations
- ✅ Old solution garbage collected
- ✅ New solution computed and stored
- ✅ No memory leaks from old solutions

---

## Performance Benchmarks

### Expected Metrics

**Computation Time:**
- Small grid (101×10): <100ms
- Medium grid (101×50): 200-500ms
- Large grid (201×100): 1-2 seconds

**Animation Performance:**
- Baseline: 50 fps (20ms per frame)
- With 2x speed: 100 fps (10ms per frame)
- Should remain smooth with no frame drops

**Seeking Latency:**
- Slider drag → instant display update (<50ms)
- No network requests (data already in memory)

**Memory Usage:**
- Small grid: ~1-2 MB
- Medium grid: ~3-5 MB
- Large grid: ~10-20 MB (acceptable for browser)

---

## Browser DevTools Verification

### Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Load preset and compute solution
4. Expected: Single POST request to `/api/simulations/solve`
5. Play animation
6. Expected: NO additional network requests during playback
7. Seek slider
8. Expected: NO additional network requests
9. Reset and replay
10. Expected: NO additional network requests

**Key Insight**: Entire animation is in-memory. Network is only used for initial computation request.

### Console Tab
1. Open DevTools Console
2. Compute solution
3. Expected: Debug logs showing animation loop running
4. Play/pause/seek
5. Expected: Logs showing state changes
6. Look for errors: Should be NONE related to playback

### Performance Tab
1. Open Performance tab
2. Start recording
3. Play animation for ~5 seconds
4. Stop recording
5. Analyze:
   - Should see smooth frame updates (~50 fps)
   - No long tasks blocking main thread
   - `requestAnimationFrame` callbacks every 20ms (1x speed)

---

## Troubleshooting Guide

### Animation Doesn't Play
**Likely Cause**: Solution not loaded
**Fix**:
1. Check console for errors
2. Verify backend is running
3. Check Network tab for failed `/api/simulations/solve` request

### Axes Jump During Animation
**Likely Cause**: `useFixedAxes` not passed or undefined bounds
**Fix**:
1. Verify App.tsx passes `globalMin`/`globalMax` props
2. Check VisualizationCanvas receives props correctly
3. Verify `useFixedAxes={true}` in component

### Reset Doesn't Preserve Solution
**Likely Cause**: `handleReset()` deletes `completeSolution`
**Fix**:
1. Check App.tsx `handleReset()` implementation
2. Should only set `currentTimeIndex = 0`
3. Should NOT set `completeSolution = null`

### Playback Speed Not Changing
**Likely Cause**: Speed multiplier not applied to frame timing
**Fix**:
1. Verify animation loop uses `20 / playbackSpeed`
2. Check that `playbackSpeed` is in dependency array of useEffect

### Seeking Feels Sluggish
**Likely Cause**: Solution not fully loaded in memory
**Fix**:
1. Check that full solution was returned from backend
2. Verify `u_values` array has all time steps
3. Check browser memory usage (DevTools → Memory tab)

---

## Summary Checklist

- [ ] Test 1: Solution loads and displays
- [ ] Test 2: Animation plays smoothly
- [ ] Test 3: Pause/resume works
- [ ] Test 4: Reset preserves data for replay ⭐ CRITICAL
- [ ] Test 5: Seeking is instant
- [ ] Test 6: Speed control works
- [ ] Test 7: Step controls work
- [ ] Test 8: Axes are fixed (no jumping)
- [ ] Test 9: Wave equation works
- [ ] Test 10: Multiple simulations work
- [ ] Performance: Smooth animation at all speeds
- [ ] Network: Only one API call per solution

## Success Criteria

All of the following must be true:

1. ✅ Animation plays without loading delay
2. ✅ Axes fixed (no jumping during animation)
3. ✅ Reset returns to frame 0 AND preserves solution
4. ✅ Play/pause/seek work without backend communication
5. ✅ Speed control adjusts playback rate
6. ✅ Step controls navigate frame-by-frame
7. ✅ Smooth performance (no stuttering)
8. ✅ No errors in console
9. ✅ Multiple simulations can be loaded in sequence
10. ✅ DevTools shows only ONE initial API call per solution

If all above are true, the client-side playback architecture is working correctly! 🎉
