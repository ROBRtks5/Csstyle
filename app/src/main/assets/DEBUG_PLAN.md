# Global Debug & Refactoring Plan: Shadow Protocol

## 1. Issue Analysis
1. **Missing UI Overlay**: The user reports that the 3D map is visible, and units can be selected, but the UI (buttons, logs, context menu) is completely missing.
2. **Black Screen (Rendering crash)**: Sometimes the screen goes completely black, with only the 2D weather (rain overlay) remaining visible. This indicates a fatal render crash (often caused by `NaN` values propagating into the Three.js camera position or projection matrix).
3. **Frozen Controls**: "No possibility to interact, game is frozen." This is likely because the UI is not rendering (or is blocked), and the action context menu never appears, or `NaN` camera coordinates make the raycaster fail.

## 2. Root Cause Hypothesis
* **Z-Index & DOM Stacking**: The WebGL `<canvas>` is appended using `appendChild()` to `#game-container`, placing it at the *end* of the DOM. This might cause the browser to render it *over* the `#ui-layer`, especially on mobile WebKit/Blink where compositing can ignore `z-index` if not forced.
* **Camera `NaN` Corruption**: Mobile `pointermove` and `touchmove` events fire concurrently or incorrectly. If a multi-touch gesture results in dividing by zero or reading an undefined `e.clientX`, `camera.position` becomes `NaN`. Once a camera coordinate is `NaN`, Three.js renders nothing (black screen). Weather stays visible because it's on a separate 2D canvas that doesn't use the camera.
* **UI Opacity / Display state**: The `ui-layer` might be unintentionally hidden, or its child panels may have lost their `display: flex/block` properties.

## 3. Action Plan

### Step 1: Fix WebGL Canvas DOM Injection (Solve Missing UI)
* Modify the `Game` engine initialization to use `container.insertBefore(this.renderer.domElement, container.firstChild);` instead of `appendChild`. This guarantees the 3D canvas is at the absolute bottom of the DOM tree physically, ensuring `#ui-layer` always renders on top.
* Force hardware compositing on the UI layer using `transform: translateZ(0);` again to prevent iOS/Android native stacking bugs.

### Step 2: Implement NaN Guards (Solve Black Screen)
* Add a strict cleanup and validation check in the `animate` loop for `this.camera.position` and `this.camera.zoom`. If any value is `NaN`, reset to default safe values instantly to prevent rendering collapse.
* Add specific NaN checks inside the panning (`pointermove`) and zooming (`touchmove`) event listeners to prevent bad mathematical operations when touches are rapidly added/removed.

### Step 3: Fix Input & Touch Gestures (Solve "Frozen" interactions)
* Refactor the pan & zoom logic to cleanly separate mouse and touch. Mobile browsers fire `pointerdown`/`pointermove` for touches. Mixing logic can lead to jumpy inputs or skipped frames.
* Ensure `clientX / clientY` are always sanitized correctly.
* Restore context-menu coordinates logic to ensure it spawns visibly on screen.

### Step 4: UI Resilience
* Add explicit `pointer-events: auto` to all UI panels.
* Clean up unneeded or experimental CSS that might be causing layout shifts.

We will systematically execute these steps now.
