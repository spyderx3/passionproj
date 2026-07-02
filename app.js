const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileChosen = document.getElementById('fileChosen');
const fileName = document.getElementById('fileName');
const fileClear = document.getElementById('fileClear');
const submitBtn = document.getElementById('submitBtn');
const progressBlock = document.getElementById('progressBlock');
const progressFill = document.getElementById('progressFill');
const progressPct = document.getElementById('progressPct');
const progressLabel = document.getElementById('progressLabel');
const statusLine = document.getElementById('statusLine');
const resultBlock = document.getElementById('resultBlock');
const resultVideo = document.getElementById('resultVideo');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const errorBlock = document.getElementById('errorBlock');

let selectedFile = null;
let pollTimer = null;
let wakeUpTimer = null;

function showError(message) {
  errorBlock.textContent = message;
  errorBlock.classList.add('show');
  progressBlock.classList.remove('show');
  submitBtn.disabled = false;
  submitBtn.textContent = 'Track this video';
  setSkeletonState(false);
  if (wakeUpTimer) { clearTimeout(wakeUpTimer); wakeUpTimer = null; }
}

function clearError() {
  errorBlock.classList.remove('show');
  errorBlock.textContent = '';
}

function pickFile(file) {
  if (!file) return;
  const allowed = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) {
    showError(`That file type isn't supported. Use one of: ${allowed.join(', ')}`);
    return;
  }
  if (file.size > 100 * 1024 * 1024) {
    showError('That file is over the 100MB limit. Try a shorter clip or compress it first.');
    return;
  }
  clearError();
  selectedFile = file;
  fileName.textContent = file.name;
  fileChosen.classList.add('show');
  submitBtn.disabled = false;
  submitBtn.textContent = 'Track this video';
}

dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

fileInput.addEventListener('change', (e) => pickFile(e.target.files[0]));

['dragenter', 'dragover'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.add('drag');
  });
});
['dragleave', 'drop'].forEach(evt => {
  dropzone.addEventListener(evt, (e) => {
    e.preventDefault();
    dropzone.classList.remove('drag');
  });
});
dropzone.addEventListener('drop', (e) => {
  const file = e.dataTransfer.files[0];
  pickFile(file);
});

fileClear.addEventListener('click', (e) => {
  e.stopPropagation();
  selectedFile = null;
  fileInput.value = '';
  fileChosen.classList.remove('show');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Choose a video to begin';
});

function checkBackendConfigured() {
  if (!BACKEND_URL || BACKEND_URL.includes('https://passionprojbackend-1.onrender.com')) {
    showError('This site is not fully set up yet — the backend URL is missing from config.js.');
    return false;
  }
  return true;
}

// Wakes the backend up with a lightweight ping before uploading.
// If the backend is sleeping, this gives it time to start before the
// actual upload request hits it.
async function wakeBackend() {
  try {
    await fetch(`${BACKEND_URL}/`, { signal: AbortSignal.timeout(60000) });
  } catch (_) {
    // Ignore — we'll let the upload itself surface any real errors.
  }
}

submitBtn.addEventListener('click', async () => {
  if (!selectedFile || !checkBackendConfigured()) return;

  clearError();
  resultBlock.classList.remove('show');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Waking up server…';
  progressBlock.classList.add('show');
  progressFill.style.width = '0%';
  progressPct.textContent = '0';
  progressLabel.textContent = 'Starting up';
  statusLine.textContent = 'The server may be waking from sleep — this can take up to 60 seconds on first use.';
  setSkeletonState(true);

  // Set a timer: if still at 0% after 70 seconds, show a helpful message
  wakeUpTimer = setTimeout(() => {
    statusLine.textContent = 'Still waking up… Render\'s free tier can take a minute. Hang tight.';
  }, 20000);

  // Ping the backend first to wake it up
  await wakeBackend();

  clearTimeout(wakeUpTimer);
  wakeUpTimer = null;

  submitBtn.textContent = 'Uploading…';
  progressLabel.textContent = 'Uploading video';
  statusLine.textContent = 'Sending your file to the server.';

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const res = await fetch(`${BACKEND_URL}/process-video/`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(120000), // 2 min upload timeout
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed (status ${res.status}).`);
    }

    const { job_id } = await res.json();
    progressLabel.textContent = 'Tracking pose';
    statusLine.textContent = 'Mapping joints frame by frame. Larger videos take longer.';
    pollStatus(job_id);

  } catch (err) {
    showError(
      err.name === 'TimeoutError'
        ? 'The server took too long to respond. Try again in a moment — it may still be waking up.'
        : err.message === 'Failed to fetch'
        ? "Couldn't reach the server. Wait 30 seconds and try again."
        : err.message
    );
  }
});

function pollStatus(jobId) {
  pollTimer = setInterval(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/status/${jobId}`);
      if (!res.ok) throw new Error('Lost track of the job. Please try again.');
      const data = await res.json();

      progressFill.style.width = `${data.progress || 0}%`;
      progressPct.textContent = Math.round(data.progress || 0);

      if (data.status === 'done') {
        clearInterval(pollTimer);
        showResult(jobId);
      } else if (data.status === 'failed') {
        clearInterval(pollTimer);
        showError(data.error || 'Processing failed for this video.');
      }
    } catch (err) {
      clearInterval(pollTimer);
      showError(err.message);
    }
  }, 2000);
}

function showResult(jobId) {
  const url = `${BACKEND_URL}/download/${jobId}`;
  progressBlock.classList.remove('show');
  resultVideo.src = url;
  downloadBtn.href = url;
  resultBlock.classList.add('show');
  submitBtn.disabled = false;
  submitBtn.textContent = 'Track this video';
  setSkeletonState(false);
}

resetBtn.addEventListener('click', () => {
  resultBlock.classList.remove('show');
  fileChosen.classList.remove('show');
  fileInput.value = '';
  selectedFile = null;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Choose a video to begin';
  clearError();
});
