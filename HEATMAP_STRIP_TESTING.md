# Heatmap Strip Animation - Testing Guide

## Implementation Summary

The HEATMAP_STRIP visualization mode has been successfully implemented. It displays temperature/displacement distribution as an animated colored horizontal strip that updates in real-time as the simulation progresses.

### What's New
- **New Mode**: `VisualizationMode.HEATMAP_STRIP` in the UI
- **Button Label**: "Strip Animation" (4th visualization mode button)
- **Files Modified**:
  - `frontend/src/components/VisualizationCanvas.tsx` (enum + rendering function + useEffect handler)
  - `frontend/src/App.tsx` (mode selector button)

## How It Works

1. **Rendering**: Creates a 5-row heatmap from spatial data at current time step
2. **Animation**: Updates automatically as the animation loop plays
3. **Color Scale**: Fixed to globalMin/globalMax (prevents color shifting during animation)
4. **Integration**: Works seamlessly with existing play/pause/seek controls

## Testing Instructions

### Prerequisites
```bash
cd /Users/vietquocbui/repos/PyCharm/Math460

# Start backend (if not running)
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload &

# Start frontend
cd ../frontend
npm install  # if needed
npm run dev
```

### Test Case 1: Heat Equation - Gaussian Diffusion

**Steps:**
1. Open browser to `http://localhost:5173`
2. In the Parameter Panel (left), select preset "Heat: Gaussian Diffusion"
3. Click the "Start" button
4. Wait for computation to complete (shows "Solution ready!")
5. Look for 4 visualization mode buttons in the top of the main panel
6. Click the "Strip Animation" button (should be the 4th button)

**Expected Behavior:**
- A horizontal colored strip appears below the mode buttons
- The strip is approximately 250px tall and stretches across the width
- Colors show the temperature distribution at the current time
- Center should have bright colors (high temperature)
- Edges should have dark colors (low temperature - boundary conditions)

**Animation Test:**
7. Click the "Play" button (in the controls section)
8. Watch the strip animate

**Expected Animation:**
- Strip colors should smoothly transition over time
- Bright center colors should fade/cool down toward uniform color
- Color scale on the right should remain constant (same color = same temp)
- No sudden "color jumps" between frames (indicates fixed color scale working)
- Animation should be smooth at ~50 fps

### Test Case 2: Wave Equation - Plucked String

**Steps:**
1. Select preset "Wave: Plucked String"
2. Click "Start"
3. When solution is ready, click "Strip Animation" mode button

**Expected Visualization:**
- Initial strip shows triangular shape (peak in center)
- Colors show displacement magnitude

**Animation Test:**
4. Click "Play"

**Expected Animation:**
- Initial peak splits into two traveling waves
- Waves move toward boundaries and reflect
- Pattern oscillates periodically
- Colors show traveling wave patterns with oscillation

### Test Case 3: Mode Switching

**Steps:**
1. Load any preset and solve it
2. Click different visualization mode buttons in sequence:
   - "2D Line Plot" - shows current solution as line graph
   - "3D Surface" - shows full spatiotemporal evolution
   - "Heatmap" - shows full solution as 2D grid
   - "Strip Animation" - shows current spatial distribution as strip

**Expected Behavior:**
- All modes show the same underlying data (just different visualizations)
- Strip animation is most compact and focused on spatial distribution
- Switching between modes while animation plays should work smoothly

### Test Case 4: Playback Controls with Strip Mode

**Steps:**
1. Load "Heat: Gaussian Diffusion" and solve
2. Switch to "Strip Animation" mode
3. Test each control:

**Play/Pause:**
- Click Play → animation should start
- Click Pause → animation should stop
- Strip should show consistent colors when paused

**Seek (Slider):**
- Drag the time slider left/right
- Strip should update instantly to show data at that time step
- Colors should jump as you seek

**Speed Control:**
- Adjust "Playback Speed" slider
- Animation should speed up/slow down accordingly

**Step Forward/Backward:**
- Use ◀ and ▶ buttons to step frame-by-frame
- Strip should update one frame at a time

**Reset:**
- Click "Reset" button → should go back to time=0
- Strip should show initial temperature/displacement distribution

### Test Case 5: Button Disabling Logic

**Steps:**
1. Start the app with no simulation loaded
2. Look at visualization mode buttons

**Expected:**
- "2D Line Plot" - ENABLED (works with single frame)
- "3D Surface" - DISABLED (grayed out)
- "Heatmap" - DISABLED (grayed out)
- "Strip Animation" - DISABLED (grayed out)

3. Load a preset and solve it

**Expected:**
- All buttons become ENABLED
- Can switch to any mode

4. Reset the simulation (click Reset button without running again)

**Expected:**
- "Strip Animation" should still be ENABLED
- Can view the stored solution

### Test Case 6: Color Scale Verification

**Steps:**
1. Load "Heat: Gaussian Diffusion"
2. Solve and switch to "Strip Animation"
3. Start animation
4. Observe the color bar on the right

**Expected:**
- Color bar shows fixed min/max values (e.g., 0.0 to 1.0)
- Color bar scale DOES NOT CHANGE as animation plays
- This confirms fixed color scale is working

**Contrast with bad behavior (if color scale wasn't fixed):**
- Color bar would show different ranges each frame
- Same color would represent different temperatures at different times
- This would be confusing and wrong

## Verification Checklist

- [ ] "Strip Animation" button appears in mode selector
- [ ] Button is disabled when no solution is available
- [ ] Button is enabled after solving
- [ ] Clicking button shows horizontal colored strip
- [ ] Strip updates with animation
- [ ] Colors don't jump during animation (fixed scale)
- [ ] Play/pause work correctly
- [ ] Slider seeking works instantly
- [ ] Speed control affects animation speed
- [ ] Reset goes to frame 0
- [ ] Step forward/backward work
- [ ] All modes show consistent data
- [ ] Color bar remains fixed during animation

## Technical Details

### Data Structure
```
completeSolution = {
  x_values: [0.00, 0.01, ..., 1.00],        // 101 spatial points
  u_values: [[...], [...], [...], ...],     // 101 time steps × 101 spatial points
  metadata: {
    global_min: 0.0,
    global_max: 1.0,
    ...
  }
}

currentData (at frame t) = {
  x_values: [0.00, 0.01, ..., 1.00],
  u_values: [0.8, 0.75, 0.6, ..., 0.01],   // Single row from u_values[t]
  time_value: 0.1234
}

Rendered as:
stripMatrix = [
  [0.8, 0.75, 0.6, ..., 0.01],  // Row 0 (same data)
  [0.8, 0.75, 0.6, ..., 0.01],  // Row 1
  [0.8, 0.75, 0.6, ..., 0.01],  // Row 2
  [0.8, 0.75, 0.6, ..., 0.01],  // Row 3
  [0.8, 0.75, 0.6, ..., 0.01]   // Row 4
]
```

### Why 5 Rows?
- Single row would be too thin to see
- 5 rows provides good visibility
- All rows contain same data (just for visual thickness)
- Heatmap colorbar works correctly

## Troubleshooting

### Issue: "Strip Animation" button doesn't appear
- **Check**: Did you reload the page after npm run dev?
- **Fix**: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Issue: Button appears but is always disabled
- **Check**: Have you solved a simulation?
- **Fix**: Load a preset and click "Start", wait for "Solution ready!"

### Issue: Strip shows but doesn't animate
- **Check**: Did you click "Play"?
- **Fix**: Click the Play button in the controls section

### Issue: Colors jump during animation
- **Problem**: Color scale may not be fixed
- **Check**: Look at the color bar - does it change values each frame?
- **Expected**: Color bar should show constant range (e.g., min=0.0, max=1.0)

### Issue: Strip looks wrong (all same color or no gradients)
- **Check**: Is your globalMin == globalMax?
- **Fix**: This shouldn't happen with valid presets
- **Debug**: Check browser console for errors

## Performance Notes

- Strip rendering is lightweight (single heatmap trace)
- Animation runs at 50 fps baseline
- Memory usage: same as solution data, no additional overhead
- Should work smoothly on modern browsers

## Next Steps

After confirming all tests pass:
1. Create a git commit with changes
2. Document visualization mode differences
3. Consider UI improvements (tooltip, help text)
4. Potential future enhancements:
   - Configurable number of strip rows
   - Selectable color schemes
   - Toggle color bar visibility
