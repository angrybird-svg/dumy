
document.addEventListener('DOMContentLoaded', () => {
    const entryScreen = document.getElementById("entryScreen");
    const mainLayout = document.querySelector(".main-layout");
    const button = document.getElementById("enterButton");

    console.log("✅ DOM loaded");
    console.log("entryScreen:", entryScreen);
    console.log("mainLayout:", mainLayout);
    console.log("button:", button);

    button?.addEventListener("click", () => {
        console.log("🚀 Button clicked");
        if (entryScreen && mainLayout) {
            entryScreen.style.display = "none";
            mainLayout.style.display = "block";
        } else {
            console.error("❌ Missing element");
        }
    });
});
