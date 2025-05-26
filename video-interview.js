// Video Interview State
const state = {
  mediaRecorder: null,
  videoStream: null,
  recordedChunks: [],
  isVideoOn: true,
  isMicOn: true,
  recordingStartTime: null,
  timerInterval: null,
  progressInterval: null,
  maxRecordingTime: 300 // 5 minutes in seconds
};

// DOM Elements
const elements = {
  countdownScreen: document.getElementById('countdownScreen'),
  countdownText: document.getElementById('countdownText'),
  recordingScreen: document.getElementById('recordingScreen'),
  liveVideo: document.getElementById('liveVideo'),
  videoOverlay: document.getElementById('videoOverlay'),
  recordingTimer: document.getElementById('recordingTimer'),
  toggleVideoBtn: document.getElementById('toggleVideoBtn'),
  toggleMicBtn: document.getElementById('toggleMicBtn'),
  stopRecordingBtn: document.getElementById('stopRecordingBtn'),
  progressBar: document.getElementById('progressBar'),
  playbackScreen: document.getElementById('playbackScreen'),
  recordedVideo: document.getElementById('recordedVideo'),
  downloadBtn: document.getElementById('downloadBtn'),
  retakeBtn: document.getElementById('retakeBtn'),
  finishBtn: document.getElementById('finishBtn')
};

// Initialize the video interview
async function initVideoInterview() {
  // Start countdown
  let count = 5;
  elements.countdownText.textContent = count;
  
  const countdownInterval = setInterval(() => {
    count--;
    elements.countdownText.textContent = count;
    
    if (count <= 0) {
      clearInterval(countdownInterval);
      elements.countdownScreen.style.display = 'none';
      startRecording();
    }
  }, 1000);
}

// Start video recording
async function startRecording() {
  try {
    // Reset all states
    state.isVideoOn = true;
    state.isMicOn = true;
    
    // Hide overlay and set correct button states
    elements.videoOverlay.style.display = 'none';
    elements.toggleVideoBtn.textContent = '📷 Turn Video Off';
    elements.toggleMicBtn.textContent = '🎤 Mute Mic';
    
    // Get camera and microphone access
    state.videoStream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    // Set up video element
    elements.liveVideo.srcObject = state.videoStream;
    
    // Set up media recorder
    state.mediaRecorder = new MediaRecorder(state.videoStream, {
      mimeType: 'video/webm;codecs=vp9'
    });
    
    state.recordedChunks = [];
    state.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.recordedChunks.push(event.data);
      }
    };
    
    state.mediaRecorder.onstop = () => {
      const videoBlob = new Blob(state.recordedChunks, { type: 'video/webm' });
      elements.recordedVideo.src = URL.createObjectURL(videoBlob);
      showPlaybackScreen();
      clearTimers();
    };
    
    // Start recording
    state.mediaRecorder.start();
    state.recordingStartTime = Date.now();
    startTimer();
    startProgressBar();
    
    // Show recording screen
    elements.recordingScreen.style.display = 'block';
    
    // Auto-stop after max time
    setTimeout(() => {
      if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
        stopRecording();
      }
    }, state.maxRecordingTime * 1000);
    
  } catch (error) {
    console.error('Error accessing media devices:', error);
    elements.countdownScreen.innerHTML = `
      <h2>Camera Access Error</h2>
      <p>${error.message}</p>
      <button onclick="window.location.reload()" class="retry-btn">Try Again</button>
    `;
  }
}

// Stop recording
function stopRecording() {
  if (state.mediaRecorder && state.mediaRecorder.state !== 'inactive') {
    state.mediaRecorder.stop();
  }
  if (state.videoStream) {
    state.videoStream.getTracks().forEach(track => track.stop());
  }
}

// Show playback screen
function showPlaybackScreen() {
  elements.recordingScreen.style.display = 'none';
  elements.playbackScreen.style.display = 'block';
}

// Retake interview
function retakeInterview() {
  // Clean up existing streams
  if (state.videoStream) {
    state.videoStream.getTracks().forEach(track => track.stop());
  }
  
  // Reset state
  state.recordedChunks = [];
  state.mediaRecorder = null;
  state.videoStream = null;
  
  // Reset UI
  elements.recordedVideo.src = '';
  elements.playbackScreen.style.display = 'none';
  elements.countdownScreen.style.display = 'flex';
  
  // Restart process
  initVideoInterview();
}

// Download recording
function downloadRecording() {
  const blob = new Blob(state.recordedChunks, { type: 'video/webm' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-recording-${new Date().toISOString().slice(0, 10)}.webm`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Timer functions
function startTimer() {
  elements.recordingTimer.textContent = '00:00';
  state.timerInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - state.recordingStartTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    elements.recordingTimer.textContent = 
      `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, 1000);
}

function startProgressBar() {
  elements.progressBar.style.width = '0%';
  state.progressInterval = setInterval(() => {
    const elapsed = (Date.now() - state.recordingStartTime) / 1000;
    const progress = (elapsed / state.maxRecordingTime) * 100;
    elements.progressBar.style.width = `${Math.min(progress, 100)}%`;
  }, 100);
}

function clearTimers() {
  clearInterval(state.timerInterval);
  clearInterval(state.progressInterval);
}

// Toggle video
function toggleVideo() {
  if (!state.videoStream) return;
  
  state.isVideoOn = !state.isVideoOn;
  const videoTrack = state.videoStream.getVideoTracks()[0];
  
  if (videoTrack) {
    videoTrack.enabled = state.isVideoOn;
    elements.videoOverlay.style.display = state.isVideoOn ? 'none' : 'flex';
    elements.toggleVideoBtn.textContent = state.isVideoOn ? '📷 Turn Video Off' : '📷 Turn Video On';
  }
}

// Toggle microphone
function toggleMic() {
  if (!state.videoStream) return;
  
  state.isMicOn = !state.isMicOn;
  const audioTrack = state.videoStream.getAudioTracks()[0];
  
  if (audioTrack) {
    audioTrack.enabled = state.isMicOn;
    elements.toggleMicBtn.textContent = state.isMicOn ? '🎤 Mute Mic' : '🎤 Unmute Mic';
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Set initial display states
  elements.countdownScreen.style.display = 'flex';
  elements.recordingScreen.style.display = 'none';
  elements.playbackScreen.style.display = 'none';
  elements.videoOverlay.style.display = 'none';
  
  // Button event listeners
  elements.stopRecordingBtn.addEventListener('click', stopRecording);
  elements.toggleVideoBtn.addEventListener('click', toggleVideo);
  elements.toggleMicBtn.addEventListener('click', toggleMic);
  elements.downloadBtn.addEventListener('click', downloadRecording);
  elements.retakeBtn.addEventListener('click', retakeInterview);
  elements.finishBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  
  // Start the interview process
  initVideoInterview();
});