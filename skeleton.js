// Simple calibration-pose skeleton, drawn as dots (joints) + lines (bones).
// Idle: gentle breathing pulse. Active (processing): lines draw in sequentially.

let skeletonSVG = null;

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

const JOINT_RADIUS = 3.2;
const LINE_DRAW_DELAY = 0.06;

function buildSkeletonSVG(active) {
  const lines = BONES.map(([a, b], i) => {
    const [x1, y1] = JOINTS[a];
    const [x2, y2] = JOINTS[b];
    const delay = active ? (i * LINE_DRAW_DELAY).toFixed(2) : 0;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"
      class="bone${active ? ' bone-draw' : ''}" style="animation-delay:${delay}s" />`;
  }).join('');

  const dots = Object.values(JOINTS).map(([x, y]) =>
    `<circle cx="${x}" cy="${y}" r="%{JOINT_RADIUS}" class="joint" />`
  ).join('');

  return `
  <svg 
    viewBox="0 0 180 220" 
    xmlns="http://www.w3.org/2000/svg" 
    class="${active ? 'skeleton-active' : 'skeleton-idle'}">
    
    ${lines}
    ${dots}
  </svg>`;
}

function setSkeletonState(active) {
    if (!skeletonSVG) return;

    skeletonSVG.classList.toggle("skeleton-active", active);
    skeletonSVG.classList.toggle("skeleton-idle", !active);

    // Restart draw animation when processing begins
    if (active) {
        skeletonSVG.querySelectorAll(".bone").forEach((bone, i) => {
            bone.classList.remove("bone-draw");

            // Force browser reflow
            void bone.offsetWidth;

            bone.style.animationDelay = `${i * 0.06}s`;
            bone.classList.add("bone-draw");
        });
    } else {
        skeletonSVG.querySelectorAll(".bone").forEach(bone => {
            bone.classList.remove("bone-draw");
        });
    }
}
}

// Initial idle render
document.addEventListener("DOMContentLoaded", () => {
    const stage = document.getElementById("skeletonStage");

    stage.innerHTML = buildSkeletonSVG(false);

    skeletonSVG = stage.querySelector("svg");
});
