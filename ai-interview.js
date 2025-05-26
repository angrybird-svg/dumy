document.addEventListener("DOMContentLoaded", () => {
  const loadBtn = document.getElementById("load-questions-btn");
  const analyzeBtn = document.getElementById("analyze-answer-btn");
  const nextBtn = document.getElementById("next-question-btn");
  const voiceBtn = document.getElementById("start-voice-btn");

  console.log({ loadBtn, analyzeBtn, nextBtn, voiceBtn });

  if (!loadBtn || !analyzeBtn || !nextBtn || !voiceBtn) {
    console.error("❌ One or more buttons not found. Check HTML IDs.");
    return;
  }

  let currentQuestion = "";
  const questionBox = document.getElementById("question-box");
  const answerInput = document.getElementById("answer-input");
  const feedbackCard = document.getElementById("feedback-card");

  async function loadFirstQuestion() {
    const role = document.getElementById("job-role-input").value;
    if (!role) return alert("Please enter a job role");

    const res = await fetch("http://localhost:5000/api/job-roles/ai-question", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role })
    });

    const data = await res.json();
    currentQuestion = data.question;
    questionBox.textContent = currentQuestion;
    answerInput.value = "";
    feedbackCard.innerHTML = "";
  }

  async function submitAIAnswer() {
    const answer = answerInput.value.trim();
    if (!currentQuestion || !answer) return alert("Answer the question first!");

    const res = await fetch("http://localhost:5000/api/test-ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: currentQuestion, answer })
    });

    const data = await res.json();

    feedbackCard.innerHTML = `
      <div style="border: 1px solid #ccc; padding: 10px; margin-top: 10px">
        <strong>Clarity:</strong> ${data.clarity} / 10<br />
        <strong>Relevance:</strong> ${data.relevance} / 10<br />
        <strong>Suggestions:</strong>
        <ul>${data.suggestions.map(s => `<li>${s}</li>`).join("")}</ul>
      </div>
    `;
  }

  async function loadNextQuestion() {
    await loadFirstQuestion();
  }

  function recordAnswer() {
    if (!('webkitSpeechRecognition' in window)) {
      alert("Speech recognition not supported");
      return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onresult = function(event) {
      const transcript = event.results[0][0].transcript;
      answerInput.value = transcript;
    };

    recognition.onerror = function(err) {
      console.error("🎤 Voice input error:", err);
    };

    recognition.start();
  }

  loadBtn.addEventListener("click", loadFirstQuestion);
  analyzeBtn.addEventListener("click", submitAIAnswer);
  nextBtn.addEventListener("click", loadNextQuestion);
  voiceBtn.addEventListener("click", recordAnswer);
});
