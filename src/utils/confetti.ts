import confetti from 'canvas-confetti';

/**
 * Fires a quick, celebratory confetti burst. Used when a chore gets marked complete.
 * Colors pulled loosely from the app's existing amber/cyan/emerald palette.
 */
export function celebrateChoreComplete() {
  const colors = ['#f59e0b', '#06b6d4', '#10b981', '#a855f7', '#ec4899'];

  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 45,
    origin: { y: 0.7 },
    colors,
    scalar: 0.9,
    ticks: 200,
  });

  // Small second burst slightly delayed for a fuller effect
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 100,
      startVelocity: 30,
      origin: { y: 0.6 },
      colors,
      scalar: 0.7,
      ticks: 180,
    });
  }, 150);
}

/**
 * Bigger celebration for milestones (e.g. all chores done for the week).
 */
export function celebrateBigMilestone() {
  const colors = ['#f59e0b', '#06b6d4', '#10b981', '#a855f7', '#ec4899'];
  const end = Date.now() + 1200;

  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 55, origin: { x: 0 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 55, origin: { x: 1 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}

