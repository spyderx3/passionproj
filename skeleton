// Simple calibration-pose skeleton, drawn as dots (joints) + lines (bones).
// Idle: gentle breathing pulse. Active (processing): lines draw in sequentially.

const JOINTS = {
  head: [90, 24],
  neck: [90, 50],
  lShoulder: [62, 60], rShoulder: [118, 60],
  lElbow: [48, 95], rElbow: [132, 95],
  lWrist: [40, 130], rWrist: [140, 130],
  hip: [90, 120],
  lHip: [72, 124], rHip: [108, 124],
  lKnee: [68, 168], rKnee: [112, 168],
  lAnkle: [64, 206], rAnkle: [116, 206],
};

const BONES = [
  ['head', 'neck'],
  ['neck', 'lShoulder'], ['neck', 'rShoulder'],
  ['lShoulder', 'lElbow'], ['lElbow', 'lWrist'],
  ['rShoulder', 'rElbow'], ['rElbow', 'rWrist'],
  ['neck', 'hip'],
  ['hip', 'lHip'], ['hip', 'rHip'],
  ['lHip', 'lKnee'], ['lKnee', 'lAnkle'],
  ['rHip', 'rKnee'], ['rKnee', 'rAnkle'],
];

function buildSkeletonSVG(active) {
  const lines = BONES.map(([a, b], i) => {
    const [x1, y1] = JOINTS[a];
    const [x2, y2] = JOINTS[b];
    const delay = active ? (i * 0.06).toFixed(2) : 0;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      class="bone${active ? ' bone-draw' : ''}" style="animation-delay:${delay}s" />`;
  }).join('');

  const dots = Object.values(JOINTS).map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="3.2" class="joint" />`
  ).join('');

  return `
  <svg viewBox="0 0 180 220" xmlns="http://www.w3.org/2000/svg" class="${active ? 'skeleton-active' : 'skeleton-idle'}">
    <style>
      .bone { stroke: var(--accent-dim); stroke-width: 1.6; opacity: 0.85; }
      .joint { fill: var(--accent); }
      .skeleton-idle .joint, .skeleton-idle .bone {
        animation: breathe 3.2s ease-in-out infinite;
      }
      @keyframes breathe {
        0%, 100% { opacity: 0.55; }
        50% { opacity: 1; }
      }
      .bone-draw {
        stroke-dasharray: 60;
        stroke-dashoffset: 60;
        animation: drawline 0.5s ease-out forwards;
      }
      @keyframes drawline {
        to { stroke-dashoffset: 0; }
      }
      .skeleton-active .joint {
        animation: pulse 0.8s ease-in-out infinite;
      }
      @keyframes pulse {
        0%, 100% { r: 3.2; }
        50% { r: 4.4; }
      }
    </style>
    ${lines}
    ${dots}
  </svg>`;
}

function setSkeletonState(active) {
  const stage = document.getElementById('skeletonStage');
  if (stage) stage.innerHTML = buildSkeletonSVG(active);
}

// Initial idle render
document.addEventListener('DOMContentLoaded', () => setSkeletonState(false));
