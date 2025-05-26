
document.addEventListener('DOMContentLoaded', () => {
  const jobRoleSearch = document.getElementById("jobRoleSearch");
  const jobRoleList = document.getElementById("jobRoleList");
  const loadRoleBtn = document.getElementById("loadRoleQuestions");
  const questionBox = document.getElementById("questionBox");
  let questions = [];
  let currentQuestionIndex = 0;

  jobRoleSearch?.addEventListener("input", async () => {
    const query = jobRoleSearch.value;
    if (!query) return;
    const res = await fetch(`http://localhost:5000/api/job-roles?q=${encodeURIComponent(query)}`);
    const roles = await res.json();
    jobRoleList.innerHTML = "";
    roles.forEach(role => {
      const option = document.createElement("option");
      option.value = role.name;
      jobRoleList.appendChild(option);
    });
  });

  loadRoleBtn?.addEventListener("click", async () => {
    const roleName = jobRoleSearch.value;
    if (!roleName) return alert("Please select a job role");
    const res = await fetch(`http://localhost:5000/api/job-roles/questions?role=${encodeURIComponent(roleName)}`);
    const data = await res.json();
    if (data.questions && data.questions.length > 0) {
      questions = data.questions;
      currentQuestionIndex = 0;
      questionBox.textContent = questions[currentQuestionIndex];
    } else {
      questionBox.textContent = "No questions found for this role.";
    }
  });

  
const elements = {
  entryScreen: document.getElementById('entryScreen'),
  mainLayout: document.querySelector('.main-layout'),
  aiButton: document.getElementById('aiButton'),
  videoButton: document.getElementById('videoButton'),
  roleSelect: document.getElementById('roleSelect'),
  startButton: document.getElementById('startListeningBtn'),
  resetButton: document.getElementById('resetInterviewBtn'),
  summaryButton: document.getElementById('summaryDownloadBtn'),
  questionDisplay: document.getElementById('questionBox'),
  answerInput: document.getElementById('answer'),
  feedbackDisplay: document.getElementById('feedback')
};


  function enterApp() {
    console.log("Launching InterviewMate!");
    if (!elements.entryScreen || !elements.mainLayout) {
      console.warn("⚠️ Required layout elements not found.");
      return;
    }
    elements.entryScreen.style.display = 'none';
    elements.mainLayout.style.display = 'flex';
  }

  const enterBtn = document.getElementById('enterButton');
  if (enterBtn) {
    enterBtn.addEventListener('click', enterApp);
    console.log("✅ Launch button connected");
  } else {
    console.warn("⚠️ enterButton not found");
  }

  // Other listeners go here (voice input, video logic etc.)
});
