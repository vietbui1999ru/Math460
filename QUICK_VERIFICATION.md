# Quick Verification: Client-Side Playback Controls

## 30-Second Test

Follow these steps to verify the system works:

### 1. Start Backend
```bash
cd backend
uvicorn app.main:app --reload
```
Wait for: "Application startup complete"

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Wait for: "http://localhost:5173"

### 3. Open Browser
Navigate to: http://localhost:5173

### 4. Test Scenario (2 minutes)

#### Step A: Load Simulation (30 seconds)
1. Click Preset dropdown → Select "Heat: Gaussian Diffusion"
2. Click "Validate" button
3. See: ✅ "CFL: σ = 0.1 < 0.5"
4. Click "Start" button
5. Wait: Loading indicator (~1-2 seconds)
6. See: Plot with gaussian curve appears

**Expected Result**: Solution loaded successfully ✅

---

#### Step B: Test Play/Pause (30 seconds)
1. Click "Play" button
2. Observe: Curve changes smoothly (peak decreases due to diffusion)
3. **Key**: Y-axis numbers stay SAME (no jumping)
4. After ~2 seconds, animation stops
5. Animation is complete ✅

**Expected Result**: Animation plays smoothly with fixed axes ✅

---

#### Step C: Test Reset (20 seconds)
1. Click "Reset" button
2. See: Curve returns to initial gaussian (peak value back to ~1.0)
3. Click "Play" again
4. See: Animation plays from beginning again
5. **Key**: No loading spinner (replay is instant)

**Expected Result**: Reset preserves data for instant replay ✅

---

#### Step D: Test Speed Control (10 seconds)
1. Stop animation (let it finish or click Reset)
2. Find speed selector (dropdown showing "1x")
3. Change to "2x"
4. Click "Play"
5. Animation plays **2x faster** than before

**Expected Result**: Playback speed adjustable ✅

---

#### Step E: Test Seeking (10 seconds)
1. Pause animation (or let it finish)
2. Find timeline slider (0-10 steps)
3. Drag slider to middle
4. See: Plot instantly jumps to middle of diffusion
5. Drag to end
6. See: Plot shows final (smallest) peak

**Expected Result**: Seeking instant (no loading) ✅

---

## Success Criteria

If ALL of these are true, the implementation is working:

✅ Plot appears after solution loads (no error)
✅ Animation plays smoothly (no stuttering)
✅ Y-axis numbers don't change during animation (FIXED AXES)
✅ Reset returns to frame 0 instantly
✅ Reset doesn't re-solve (instant replay)
✅ Speed 2x plays twice as fast
✅ Slider seeking is instant
✅ No errors in browser console (F12)

## What to Look For

### Good Signs
- Smooth animation (no jumps or stutters)
- Y-axis range like "-0.1 to 1.1" stays constant
- Peak gets smaller as animation plays (physics correct)
- Reset button returns to original shape
- Replay is instant (no loading spinner)

### Bad Signs
- Y-axis numbers change during animation ❌
- Animation is choppy or stuttering ❌
- Reset shows loading spinner ❌
- Slider doesn't respond immediately ❌
- Console shows JavaScript errors ❌

## Debugging Tips

### If animation doesn't play:
```bash
# Check backend is running:
curl http://localhost:8000/docs
# Should return HTML (FastAPI docs page)

# Check console (F12 → Console tab):
# Should show no red errors, maybe some warnings
```

### If axes jump:
```javascript
// In DevTools console, check if bounds are set:
// Should see something like:
// globalMin: 0, globalMax: 1, useFixedAxes: true
```

### If reset doesn't work:
```javascript
// In DevTools console, after reset:
// currentTimeIndex should be 0
// completeSolution should still exist (not null)
// Try clicking Play - should start from frame 0
```

### If network issues:
```bash
# In DevTools (F12) → Network tab:
# Should see ONE POST request to /api/simulations/solve
# During playback: should see NO new requests
# During seek: should see NO new requests
```

## Expected Behavior Details

### Animation Timing
- **Default (1x)**: 10 frames in ~2 seconds (~50 fps)
- **2x speed**: 10 frames in ~1 second (~100 fps)
- **0.5x speed**: 10 frames in ~4 seconds (~25 fps)

### Memory Usage
- Small simulation: 1-2 MB (normal)
- Medium simulation: 3-5 MB (normal)
- Large simulation: 10+ MB (might slow browser)

### File Changes
```
Files Modified: 7 total
- Backend: 3 files (schemas, service, routes)
- Frontend: 4 files (types, api, App.tsx, components)
```

## Next Steps If Issues

1. **Check backend logs**: Should show `/api/simulations/solve` request
2. **Check frontend logs** (F12 Console): Look for errors
3. **Verify network tab** (F12 Network): Should see successful response
4. **Compare with TESTING_PLAYBACK_CONTROLS.md**: More detailed tests

## Success Video Script

If everything works, here's what you'll see:

1. **Load**: Page loads, preset selector appears
2. **Select**: Click preset, parameters fill in
3. **Validate**: Click validate, green checkmark appears
4. **Compute**: Click start, loading spinner for ~1 second
5. **Display**: Plot appears with Gaussian curve
6. **Play**: Click play, curve smoothly decays over 2 seconds
7. **Axes Fixed**: Y-axis stays at "-0.1 to 1.1" throughout
8. **Reset**: Click reset, curve returns to original shape
9. **Replay**: Click play again, animation replays instantly
10. **Done**: System working! 🎉

---

## Estimated Time

- Setup: 2 minutes
- Testing: 2-3 minutes
- **Total**: ~5 minutes

If you encounter issues, follow the debugging section or refer to `TESTING_PLAYBACK_CONTROLS.md` for detailed troubleshooting.
