// ==========================================
// Azure OCR Comparison Dashboard
// ==========================================

console.clear();
console.log("Azure OCR Comparison Loaded");

// ==========================================
// DOM Elements
// ==========================================

const imageInput = document.getElementById("imageInput");

const preview = document.getElementById("preview");

const extractBtn = document.getElementById("extractBtn");

const loading = document.getElementById("loading");

const results = document.getElementById("results");

// ==========================================
// Preview Image
// ==========================================

imageInput.addEventListener("change", () => {

    const file = imageInput.files[0];

    if (!file) return;

    preview.src = URL.createObjectURL(file);

    preview.style.display = "block";

});

// ==========================================
// Compare OCR
// ==========================================

extractBtn.addEventListener("click", compareOCR);

// ==========================================
// Main Function
// ==========================================

async function compareOCR() {

    const file = imageInput.files[0];

    if (!file) {

        alert("Please select an image.");

        return;

    }

    loading.style.display = "block";

    results.style.display = "none";

    const formData = new FormData();

    formData.append("image", file);

    try {

        const response = await fetch("/extract", {

            method: "POST",

            body: formData

        });

        const data = await response.json();

        console.log(data);

        loading.style.display = "none";

        if (!data.success) {

            alert(data.error || "OCR Failed");

            return;

        }

        results.style.display = "block";

        // =====================================
        // Traditional OCR
        // =====================================

        document.getElementById("normalText").textContent =
            data.traditional_ocr.text;

        document.getElementById("normalCharacters").textContent =
            data.traditional_ocr.characters;

        document.getElementById("normalWords").textContent =
            data.traditional_ocr.words;

        document.getElementById("normalTime").textContent =
            data.traditional_ocr.processing_time + " sec";

        // =====================================
        // Azure OCR
        // =====================================

        document.getElementById("azureText").textContent =
            data.azure_ocr.text;

        document.getElementById("azureCharacters").textContent =
            data.azure_ocr.characters;

        document.getElementById("azureWords").textContent =
            data.azure_ocr.words;

        document.getElementById("azureTime").textContent =
            data.azure_ocr.processing_time + " sec";

        // =====================================
        // Comparison Table
        // =====================================

        document.getElementById("tableNormalCharacters").textContent =
            data.traditional_ocr.characters;

        document.getElementById("tableAzureCharacters").textContent =
            data.azure_ocr.characters;

        document.getElementById("tableNormalWords").textContent =
            data.traditional_ocr.words;

        document.getElementById("tableAzureWords").textContent =
            data.azure_ocr.words;

        document.getElementById("tableNormalTime").textContent =
            data.traditional_ocr.processing_time + " sec";

        document.getElementById("tableAzureTime").textContent =
            data.azure_ocr.processing_time + " sec";
                // =====================================
        // Winner
        // =====================================

        document.getElementById("winner").textContent =
            "🏆 " + data.comparison.winner;

        // =====================================
        // Difference Cards
        // =====================================

        document.getElementById("characterDifference").textContent =
            data.comparison.character_difference;

        document.getElementById("wordDifference").textContent =
            data.comparison.word_difference;

        document.getElementById("timeDifference").textContent =
            data.comparison.time_difference + " sec";

    }

    catch(error){

        loading.style.display = "none";

        console.error(error);

        alert("Unable to connect to Flask Backend.");

    }

}

// ==========================================
// Copy Traditional OCR
// ==========================================

document.getElementById("copyTraditional").addEventListener("click", () => {

    const text = document.getElementById("normalText").textContent;

    navigator.clipboard.writeText(text);

    alert("Traditional OCR copied!");

});

// ==========================================
// Copy Azure OCR
// ==========================================

document.getElementById("copyAzure").addEventListener("click", () => {

    const text = document.getElementById("azureText").textContent;

    navigator.clipboard.writeText(text);

    alert("Azure OCR copied!");

});

// ==========================================
// Download Report
// ==========================================

document.getElementById("downloadResult").addEventListener("click", () => {

    const report = `

===============================
AZURE OCR COMPARISON REPORT
===============================

Traditional OCR

Characters : ${document.getElementById("normalCharacters").textContent}
Words      : ${document.getElementById("normalWords").textContent}
Time       : ${document.getElementById("normalTime").textContent}

--------------------------------

${document.getElementById("normalText").textContent}

========================================

Azure AI OCR

Characters : ${document.getElementById("azureCharacters").textContent}
Words      : ${document.getElementById("azureWords").textContent}
Time       : ${document.getElementById("azureTime").textContent}

--------------------------------

${document.getElementById("azureText").textContent}

========================================

Winner

${document.getElementById("winner").textContent}

Character Difference :
${document.getElementById("characterDifference").textContent}

Word Difference :
${document.getElementById("wordDifference").textContent}

Time Difference :
${document.getElementById("timeDifference").textContent}

`;

    const blob = new Blob([report], {

        type: "text/plain"

    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;

    a.download = "OCR_Comparison_Report.txt";

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);

});

// ==========================================
// Console
// ==========================================

console.log("OCR Dashboard Ready");