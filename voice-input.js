// Voice Input Functionality
const voiceInputBtn = document.getElementById('voiceInputBtn');
const transcriptDisplay = document.getElementById('transcriptDisplay');
const voiceStatus = document.getElementById('voiceStatus');
const languageSelect = document.getElementById('languageSelect');
const copyTextBtn = document.getElementById('copyTextBtn');
const clearTextBtn = document.getElementById('clearTextBtn');
const saveTextBtn = document.getElementById('saveTextBtn');

let recognition;
let isListening = false;

function initializeVoiceRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  
  if (!SpeechRecognition) {
    voiceStatus.textContent = "Voice input not supported in your browser. Try Chrome or Edge.";
    voiceInputBtn.disabled = true;
    return null;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = languageSelect.value;

  recognition.onstart = () => {
    isListening = true;
    voiceInputBtn.textContent = "🛑 Stop Listening";
    voiceInputBtn.classList.add("listening");
    voiceStatus.textContent = "Listening... Speak now!";
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    transcriptDisplay.innerHTML = finalTranscript + interimTranscript;
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    voiceStatus.textContent = `Error: ${event.error}`;
    stopListening();
  };

  recognition.onend = () => {
    if (isListening) {
      recognition.start(); // Restart listening if not manually stopped
    }
  };

  return recognition;
}

function startListening() {
  recognition = initializeVoiceRecognition();
  if (recognition) {
    try {
      recognition.start();
    } catch (error) {
      voiceStatus.textContent = "Error accessing microphone. Please check permissions.";
      console.error(error);
    }
  }
}

function stopListening() {
  if (recognition) {
    isListening = false;
    recognition.stop();
    voiceInputBtn.textContent = "🎤 Start Voice Input";
    voiceInputBtn.classList.remove("listening");
    voiceStatus.textContent = "Ready to start again";
  }
}

// Event Listeners
voiceInputBtn.addEventListener('click', () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

languageSelect.addEventListener('change', () => {
  if (recognition) {
    recognition.lang = languageSelect.value;
    voiceStatus.textContent = `Language set to ${languageSelect.options[languageSelect.selectedIndex].text}`;
  }
});

copyTextBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(transcriptDisplay.textContent)
    .then(() => {
      voiceStatus.textContent = "Text copied to clipboard!";
      setTimeout(() => {
        if (!isListening) voiceStatus.textContent = "Ready to start again";
      }, 2000);
    });
});

clearTextBtn.addEventListener('click', () => {
  transcriptDisplay.textContent = "";
  voiceStatus.textContent = "Text cleared. Ready to start again.";
});

saveTextBtn.addEventListener('click', () => {
  // Save to localStorage or send to main app
  localStorage.setItem('voiceTranscript', transcriptDisplay.textContent);
  voiceStatus.textContent = "Text saved! You can now return to your interview.";
});

// Check for saved transcript when returning to interview page
window.addEventListener('beforeunload', () => {
  if (transcriptDisplay.textContent.trim() !== "") {
    localStorage.setItem('voiceTranscript', transcriptDisplay.textContent);
  }
});