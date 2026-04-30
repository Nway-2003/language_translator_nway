const inputText = document.getElementById("inputText");
const resultText = document.getElementById("resultText");
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");
const autoDetectOption = document.getElementById("autoDetectOption"); // New reference
const copyBtn = document.getElementById("copyBtn");
const clearBtn = document.getElementById("clearBtn");
const swapBtn = document.getElementById("swapBtn");
const speakBtn = document.getElementById("speakBtn");
const speakInputBtn = document.getElementById("speakInputBtn");
const statusMsg = document.getElementById("statusMsg");
const charCount = document.getElementById("charCount");
const fileInput = document.getElementById("fileInput");
const fileTranslateBtn = document.getElementById("fileTranslateBtn");
const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
// Add this reference at the top of your script
const langRow = document.querySelector(".lang-row");

// --- New References ---
const favoriteBtn = document.getElementById("favoriteBtn");
const historyBtn = document.getElementById("historyBtn");
const historyContent = document.getElementById("history-content");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistoryBtn");

// --- Speech to Text Functionality ---
const voiceTypingBtn = document.getElementById('voiceTypingBtn');
const micIcon = document.getElementById('micIcon');
const inputTextArea = document.getElementById('inputText');
const sourceLanguageSelect = document.getElementById('sourceLang');

const API_URL = "http://localhost:5001/translate";
const FILE_API_URL = "http://localhost:5001/translate_file";

const MAX_CHARS = 2000;

let currentTranslationId = 0; // ADD THIS to track the latest request
let lastDetectedCode = null;

const langMap = { 
    sq: "sq-AL", ar: "ar-SA", az: "az-AZ", bn: "bn-BD", 
    bg: "bg-BG", zh: "zh-CN", cs: "cs-CZ", da: "da-DK", 
    nl: "nl-NL", en: "en-US", eo: "eo",    et: "et-EE", 
    fi: "fi-FI", fr: "fr-FR", de: "de-DE", el: "el-GR", 
    he: "he-IL", hi: "hi-IN", hu: "hu-HU", id: "id-ID", 
    ga: "ga-IE", it: "it-IT", ja: "ja-JP", ko: "ko-KR", 
    ky: "ky-KG", lv: "lv-LV", lt: "lt-LT", ms: "ms-MY", 
    fa: "fa-IR", pl: "pl-PL", pt: "pt-PT", ro: "ro-RO", 
    ru: "ru-RU", sk: "sk-SK", es: "es-ES", sv: "sv-SE", 
    tl: "tl-PH", th: "th-TH", tr: "tr-TR", uk: "uk-UA", 
    ur: "ur-PK", vi: "vi-VN"
};

const textTabBtn = document.getElementById("textTabBtn");
const fileTabBtn = document.getElementById("fileTabBtn");
const textContent = document.getElementById("text-content");
const fileContent = document.getElementById("file-content");

// --- Tab Switching Logic ---
// --- Updated Tab Switching Logic ---
// --- Updated Tab Switching Logic ---
function switchTab(toFile) {
    // 1. Show the language row again
    langRow.style.display = "flex"; 
    historyContent.classList.remove("active");
    
    // 2. Remove "active" from History and Favorite icons
    historyBtn.classList.remove("active");
    favoriteBtn.classList.remove("active");
    
    // 3. Toggle main buttons
    textTabBtn.classList.toggle("active", !toFile);
    fileTabBtn.classList.toggle("active", toFile);
    
    // 4. Toggle content areas
    textContent.classList.toggle("active", !toFile);
    fileContent.classList.toggle("active", toFile);
    
    statusMsg.textContent = "";
}

textTabBtn.addEventListener("click", () => switchTab(false));
fileTabBtn.addEventListener("click", () => switchTab(true));

// --- Helper: Update the Select Label inside the box ---
function updateAutoDetectLabel(langName = null) {
    if (langName) {
        // This makes it show "English - Detected"
        autoDetectOption.textContent = `${langName} - Detected`;
    } else {
        autoDetectOption.textContent = "Auto Detect";
    }
}

// --- Translation Logic ---
let typingTimer;
inputText.addEventListener("input", () => {
    updateCharCount();
    clearTimeout(typingTimer);
    if (inputText.value.trim()) {
        typingTimer = setTimeout(translateText, 500);
    } else {
        resultText.value = "";
        lastDetectedCode = null;
        updateAutoDetectLabel(); // Reset to default when empty
    }
});

[sourceLang, targetLang].forEach(el => {
    el.addEventListener("change", () => {
        if (inputText.value.trim()) translateText();
        // If user manually picks a language, reset the "Auto Detect" text
        if (sourceLang.value !== "auto") {
            updateAutoDetectLabel();
        }
    });
});

async function translateText() {
    if (!inputText.value.trim()) return;
    
    // 1. INCREMENT THE ID: Every time we start a new translation
    const requestId = ++currentTranslationId; 
    
    // Only show "Translating..." if we are on the text tab
    if (textContent.classList.contains("active")) {
        statusMsg.textContent = "Translating...";
    }
    
    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                q: inputText.value, 
                source: sourceLang.value, 
                target: targetLang.value, 
                format: "text" 
            })
        });
        const data = await response.json();

        // 2. CHECK THE ID: Only update the UI if this is still the LATEST request
        if (requestId === currentTranslationId) {
            resultText.value = data.translatedText;

            // --- ADD THIS LINE TO SAVE TO HISTORY ---
            saveToHistory(sourceLang.value, targetLang.value, inputText.value, data.translatedText);
            
            if (sourceLang.value === "auto" && data.detectedLanguage) {
                lastDetectedCode = data.detectedLanguage.language;
                const langOption = Array.from(sourceLang.options).find(opt => opt.value === lastDetectedCode);
                const langName = langOption ? langOption.textContent : lastDetectedCode.toUpperCase();
                updateAutoDetectLabel(langName);
            }
            // --- VISIBILITY CHECK ---
            // Only show "Translated" if the user is still looking at the text tab
            if (textContent.classList.contains("active")) {
                statusMsg.textContent = "Translated.";
                setTimeout(() => {
                    if (statusMsg.textContent === "Translated.") statusMsg.textContent = "";
                }, 2000);
            } else {
                statusMsg.textContent = ""; // Silently clear it if user switched tabs
            }
        }
    } catch (e) { 
        if (requestId === currentTranslationId && textContent.classList.contains("active")) {
            statusMsg.textContent = "Error: Translator offline."; 
            setTimeout(() => {
                if (statusMsg.textContent === "Error: Translator offline.") statusMsg.textContent = "";
            }, 2000);
        }
    }
}

// --- Audio/Speech Logic ---
function speak(text, langCode, btn) {
    const isTextTabActive = textContent.classList.contains("active");
    const icon = btn ? btn.querySelector('.material-icons') : null;

    // --- TOGGLE LOGIC: STOP IF ALREADY SPEAKING ---
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        document.querySelectorAll('.material-icons').forEach(el => el.classList.remove('active-speaker'));
        
        if (isTextTabActive) {
            statusMsg.textContent = "Speech stopped.";
            setTimeout(() => {
                if (statusMsg.textContent === "Speech stopped.") statusMsg.textContent = "";
            }, 2000);
        }
        return;
    }

    if (!text.trim()) {
        if (isTextTabActive) {
            statusMsg.textContent = "Nothing to speak.";
            setTimeout(() => {
                if (statusMsg.textContent === "Nothing to speak.") statusMsg.textContent = "";
            }, 2000);
        }
        return;
    }

    // Determine the correct language code (handling 'auto' mode)
    const activeLang = langCode === 'auto' ? lastDetectedCode : langCode;
    const targetBCP47 = langMap[activeLang];
    console.log("Available voices:", window.speechSynthesis.getVoices().map(v => v.lang));

    const speech = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Voice Matching Logic
    let matchedVoice = null;
    if (targetBCP47) {
        speech.lang = targetBCP47;
        const shortLang = targetBCP47.split('-')[0].toLowerCase();
        
        // Find a voice that matches the language prefix (e.g., 'th', 'en', 'my')
        matchedVoice = voices.find(voice => 
            voice.lang.toLowerCase().startsWith(shortLang)
        );
    }

    if (matchedVoice) {
        speech.voice = matchedVoice;

        speech.onstart = () => {
            if (icon) icon.classList.add('active-speaker');
            if (isTextTabActive) statusMsg.textContent = "Speaking...";
        };

        speech.onend = () => {
            if (icon) icon.classList.remove('active-speaker');
            if (statusMsg.textContent === "Speaking..." && isTextTabActive) {
                statusMsg.textContent = "";
            }
        };


        window.speechSynthesis.speak(speech);
    } else {
        // --- NO VOICE FALLBACK ---
        if (isTextTabActive) {
            statusMsg.textContent = `No voice available for this language.`;
            setTimeout(() => {
                if (statusMsg.textContent.includes("No voice available for this language.")) statusMsg.textContent = "";
            }, 3000);
        }
    }
}

// Ensure the buttons call the updated function
// Ensure the buttons pass "this" as the third argument
speakInputBtn.addEventListener("click", function() { // Changed to function()
    const lang = (sourceLang.value === "auto" && lastDetectedCode) 
                 ? lastDetectedCode 
                 : (sourceLang.value === "auto" ? "en" : sourceLang.value);
    speak(inputText.value, lang, this); // Added "this"
});

speakBtn.addEventListener("click", function() { // Changed to function()
    speak(resultText.value, targetLang.value, this); // Added "this"
});

/** * IMPORTANT: Browsers like Chrome load voices asynchronously. 
 * This event ensures the voices are populated before the first use.
 */
window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
};

// --- Utility Functions ---
function updateCharCount() { 
    const currentLength = inputText.value.length;
    charCount.textContent = `${currentLength} / ${MAX_CHARS}`; 

    // Visual feedback: Turn text red only when 100% full (2000/2000)
    if (currentLength >= MAX_CHARS) {
        charCount.style.color = "#ef4444"; // Red color
    } else {
        charCount.style.color = ""; // Reset to default (usually white or gray)
    }
}

clearBtn.addEventListener("click", () => {
    window.speechSynthesis.cancel(); 
    currentTranslationId++;

    if (inputText.value.length === 0 && resultText.value.length === 0) {
        // Only show message if we are on the text tab
        if (textContent.classList.contains("active")) {
            statusMsg.textContent = "Nothing to clear.";
            setTimeout(() => {
                if (statusMsg.textContent === "Nothing to clear.") statusMsg.textContent = "";
            }, 2000);
        }
        return; 
    }

    inputText.value = ""; 
    resultText.value = ""; 
    lastDetectedCode = null;
    updateAutoDetectLabel(); 
    updateCharCount();
    
    if (textContent.classList.contains("active")) {
        statusMsg.textContent = "Cleared.";
        setTimeout(() => {
            if (statusMsg.textContent === "Cleared.") statusMsg.textContent = "";
        }, 2000);
    }
});

copyBtn.addEventListener("click", () => {
    if (!resultText.value.trim()) {
        if (textContent.classList.contains("active")) {
            statusMsg.textContent = "Nothing to copy.";
            setTimeout(() => {
                if (statusMsg.textContent === "Nothing to copy.") statusMsg.textContent = "";
            }, 2000);
        }
        return;
    }

    navigator.clipboard.writeText(resultText.value);
    
    if (textContent.classList.contains("active")) {
        statusMsg.textContent = "Copied!";
        setTimeout(() => {
            if (statusMsg.textContent === "Copied!") statusMsg.textContent = "";
        }, 2000);
    }
});

swapBtn.addEventListener("click", () => {
    let currentSource = sourceLang.value;
    let currentTarget = targetLang.value;
    
    if (currentSource === "auto") {
        if (!lastDetectedCode) return;
        currentSource = lastDetectedCode;
    }

    sourceLang.value = currentTarget;
    targetLang.value = currentSource;
    
    const tempText = inputText.value;
    inputText.value = resultText.value;
    resultText.value = tempText;
    
    updateAutoDetectLabel(); 
    updateCharCount();
    if (inputText.value.trim()) translateText();
});

// --- Theme Toggle ---
themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-theme");
    themeIcon.textContent = document.body.classList.contains("dark-theme") ? "lightbulb" : "lightbulb_outline";
});

// --- File Translation Logic ---
fileInput.addEventListener("change", () => {
    const fileNameDisplay = document.getElementById("fileNameDisplay");
    
    if (fileInput.files.length > 0) {
        fileNameDisplay.textContent = fileInput.files[0].name;
        fileTranslateBtn.style.display = "block";
        
        // Only clear/update status if we are on the file tab
        if (fileContent.classList.contains("active")) {
            statusMsg.textContent = ""; 
        }
    } else {
        fileNameDisplay.textContent = "No file chosen";
        fileTranslateBtn.style.display = "none";
    }
});

async function translateFile() {
    const file = fileInput.files[0];
    if (!file) return;
    
    // 1. Only show "Processing..." if we are currently looking at the Files tab
    if (fileContent.classList.contains("active")) {
        statusMsg.textContent = "Processing...";
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("source", sourceLang.value);
    formData.append("target", targetLang.value);

    try {
        const response = await fetch(FILE_API_URL, { method: "POST", body: formData });
        const data = await response.json();

        if (data.translatedFileUrl) {
            const a = document.createElement("a");
            a.href = data.translatedFileUrl;
            a.download = `translated_${file.name}`;
            a.click();

            if (fileContent.classList.contains("active")) {
                statusMsg.textContent = "Downloaded!";
                setTimeout(() => {
                    if (statusMsg.textContent === "Downloaded!") {
                        statusMsg.textContent = "";
                    }
                }, 3000);
            } else {
                statusMsg.textContent = ""; // Silently finish
            }

            // --- ADD THESE 3 LINES TO RESET THE UI ---
            fileInput.value = ""; // 1. Clears the actual file from the input
            document.getElementById("fileNameDisplay").textContent = "No file chosen"; // 2. Resets the label
            fileTranslateBtn.style.display = "none"; // 3. Hides the button again
            // -----------------------------------------
        }
    } catch (e) { 
        if (fileContent.classList.contains("active")) {
            statusMsg.textContent = "Error translating document."; 
            setTimeout(() => {
                if (statusMsg.textContent === "Error translating document.") {
                    statusMsg.textContent = "";
                }
            }, 4000);
        }
    }
}

fileTranslateBtn.addEventListener("click", translateFile);

updateCharCount();

// --- Storage Logic ---
function getStorage(key) {
    return JSON.parse(localStorage.getItem(key) || "[]");
}

function saveToHistory(source, target, sourceText, targetText) {
    let history = getStorage("translate_history");
    const newItem = { source, target, sourceText, targetText, id: Date.now(), favorite: false };
    // Keep only last 20 items
    history.unshift(newItem);
    localStorage.setItem("translate_history", JSON.stringify(history.slice(0, 20)));
}

// Add this line inside your translateText() function, 
// right after 'resultText.value = data.translatedText;'
// saveToHistory(sourceLang.value, targetLang.value, inputText.value, data.translatedText);

// --- Favorites Toggle ---
favoriteBtn.addEventListener("click", () => {
    showHistoryView("favorites");
    // Message removed as requested
});

function getFullLangName(code) {
    if (code === "auto") return "Auto Detect";
    
    // Look for the option in either source or target dropdown
    const option = Array.from(sourceLang.options).find(opt => opt.value === code);
    return option ? option.textContent : code.toUpperCase();
}

// --- History/Favorites View Logic ---
function renderHistory(type = "history") {
    const key = type === "history" ? "translate_history" : "translate_favorites";
    const data = getStorage(key);
    const favorites = getStorage("translate_favorites");
    
    let headerHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 0 5px;">
            <h3 style="margin: 0; font-size: 1.2rem; font-weight: 500; color: var(--text-main);">
                ${type === 'history' ? 'History' : 'Favorites'}
            </h3>
            ${data.length > 0 ? `
                <button onclick="clearAllHistory('${type}')" style="background: none; border: none; color: var(--nav-bg); cursor: pointer; font-size: 0.9rem; font-weight: 500;">
                    Clear all ${type}
                </button>
            ` : ''}
        </div>
    `;

    if (data.length === 0) {
        historyList.innerHTML = headerHtml + `
            <div class="history-item" style="background-color: var(--box-bg); border: 1px solid var(--border-color); border-radius: 8px; padding: 40px; text-align: center;">
                <span class="material-icons" style="font-size: 3rem; color: var(--border-color); margin-bottom: 10px;">
                    ${type === 'history' ? 'history' : 'star_outline'}
                </span>
                <p style="color: var(--text-main); opacity: 0.6; margin: 0;">Your ${type} is empty.</p>
            </div>
        `;
        clearHistoryBtn.style.display = "none";
        return;
    }

    historyList.innerHTML = headerHtml;
    clearHistoryBtn.style.display = "none";

    data.forEach((item, index) => {
        // UPDATED: Now checks text AND language codes to determine if it is favorited
        const isFavorited = favorites.some(fav => 
            fav.sourceText.trim() === item.sourceText.trim() && 
            fav.targetText.trim() === item.targetText.trim() &&
            fav.source === item.source &&
            fav.target === item.target
        );
        
        const sourceFull = getFullLangName(item.source);
        const targetFull = getFullLangName(item.target);
        
        const div = document.createElement("div");
        div.className = "history-item";
        div.style.marginBottom = "10px";
        div.style.backgroundColor = "var(--box-bg)"; 
        div.style.border = "1px solid var(--border-color)"; 
        
        div.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; padding: 15px;">
                <div style="flex-grow: 1; text-align: left;">
                    <small style="color: var(--text-main); opacity: 0.5; text-transform: capitalize; font-size: 0.75rem; font-weight: 600;">
                        ${sourceFull} &rarr; ${targetFull}
                    </small>
                    <p style="margin: 8px 0 5px 0; font-weight: 500; color: var(--text-main);">${item.sourceText}</p>
                    <p style="color: var(--nav-bg); margin: 0; font-weight: 500;">${item.targetText}</p>
                </div>
                <div style="display: flex; gap: 10px; margin-left: 15px;">
                    <button class="icon-btn" onclick="toggleFavoriteFromHistory(${index}, '${type}')">
                        <span class="material-icons" style="font-size: 1.2rem; color: ${isFavorited ? 'var(--nav-bg)' : '#9ca3af'}">
                            ${isFavorited ? 'star' : 'star_border'}
                        </span>
                    </button>
                    ${type === 'history' ? `
                        <button class="icon-btn" onclick="deleteHistoryItem(${index}, '${type}')">
                            <span class="material-icons" style="font-size: 1.2rem; color: #9ca3af;">delete_outline</span>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        historyList.appendChild(div);
    });
}


function clearAllHistory(type) {
    const key = type === "history" ? "translate_history" : "translate_favorites";
    
    // Immediately clear the data in localStorage
    localStorage.setItem(key, JSON.stringify([]));
    
    // Instantly refresh the UI
    renderHistory(type);
    
   // --- VISIBILITY CHECK ---
    if (historyContent.classList.contains("active")) {
        statusMsg.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} cleared.`;
        setTimeout(() => {
            if (statusMsg.textContent.includes("cleared")) statusMsg.textContent = "";
        }, 2000);
    }
}

// Toggle favorite status from inside the history list
function toggleFavoriteFromHistory(index, type) {
    const sourceKey = type === "history" ? "translate_history" : "translate_favorites";
    let sourceData = getStorage(sourceKey);
    let favorites = getStorage("translate_favorites");
    const item = sourceData[index];

    // UPDATED: Now checks source and target language codes to find the correct match
    const favIndex = favorites.findIndex(fav => 
        fav.sourceText.trim() === item.sourceText.trim() && 
        fav.targetText.trim() === item.targetText.trim() &&
        fav.source === item.source &&
        fav.target === item.target
    );

    if (favIndex > -1) {
        favorites.splice(favIndex, 1);
    } else {
        favorites.unshift(item);
    }

    localStorage.setItem("translate_favorites", JSON.stringify(favorites));
    
    renderHistory(type); 
}

// Delete a single item
function deleteHistoryItem(index, type) {
    const key = type === "history" ? "translate_history" : "translate_favorites";
    let data = getStorage(key);
    data.splice(index, 1); // Remove the specific item
    localStorage.setItem(key, JSON.stringify(data));
    renderHistory(type); // Refresh view
    // --- VISIBILITY CHECK ---
    if (historyContent.classList.contains("active")) {
        statusMsg.textContent = "Item deleted.";
        setTimeout(() => {
            if (statusMsg.textContent === "Item deleted.") statusMsg.textContent = "";
        }, 2000);
    }
}
// Modify your existing switchTab to handle History
function showHistoryView(type = "history") {
    // 1. Hide the language dropdowns row
    langRow.style.display = "none";
    
    // 2. Hide other content areas
    textContent.classList.remove("active");
    fileContent.classList.remove("active");
    
    // 3. Remove active state from all main tabs and icons
    textTabBtn.classList.remove("active");
    fileTabBtn.classList.remove("active");
    favoriteBtn.classList.remove("active");
    historyBtn.classList.remove("active");
    
    // 4. Add active state to the specific icon clicked
    if (type === "history") {
        historyBtn.classList.add("active");
    } else if (type === "favorites") {
        favoriteBtn.classList.add("active");
    }

    // 5. Show history and render
    historyContent.classList.add("active");
    renderHistory(type);
}

historyBtn.addEventListener("click", () => showHistoryView("history"));

// Clear logic
clearHistoryBtn.addEventListener("click", () => {
    localStorage.removeItem("translate_history");
    renderHistory("history");
    statusMsg.textContent = "History Cleared.";
});

// Check browser compatibility
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false; 
    recognition.interimResults = false;

    voiceTypingBtn.addEventListener('click', () => {
        const selectedLang = sourceLanguageSelect.value;
        // Default to English if 'auto' is selected, otherwise use the dropdown value
        recognition.lang = selectedLang === 'auto' ? 'en-US' : selectedLang;

        if (micIcon.classList.contains('mic-active')) {
            recognition.stop();
        } else {
            // --- CLEAR BOX ON START ---
            inputTextArea.value = ''; 
            // Trigger input event to reset character count to 0 immediately
            inputTextArea.dispatchEvent(new Event('input'));
            
            recognition.start();
        }
    });

    recognition.onstart = () => {
        micIcon.classList.add('mic-active');
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Put the new text into the cleared box
        inputTextArea.value = transcript; 
        inputTextArea.dispatchEvent(new Event('input'));
    };

    recognition.onerror = (event) => {
        console.error("Speech Recognition Error: ", event.error);
        micIcon.classList.remove('mic-active');
    };

    recognition.onend = () => {
        micIcon.classList.remove('mic-active');
    };

} else {
    voiceTypingBtn.style.display = 'none';
}