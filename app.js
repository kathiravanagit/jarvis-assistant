const btn = document.querySelector('.talk');
const content = document.querySelector('.content');
const talkBar = document.querySelector('.talk-bar');

// Training system variables
let customCommands = [];
let userPreferences = {
    name: '',
    voiceRate: 1,
    voicePitch: 1
};

// Load saved data on startup
window.addEventListener('load', () => {
    loadCustomCommands();
    loadUserPreferences();
    speak("Initializing JARVIS...");
    wishMe();
});

// Training system functions
function loadCustomCommands() {
    const saved = localStorage.getItem('jarvis-custom-commands');
    if (saved) {
        customCommands = JSON.parse(saved);
    }
}

function saveCustomCommands() {
    localStorage.setItem('jarvis-custom-commands', JSON.stringify(customCommands));
}

function loadUserPreferences() {
    const saved = localStorage.getItem('jarvis-preferences');
    if (saved) {
        userPreferences = JSON.parse(saved);
        // Update UI elements
        const nameInput = document.getElementById('userName');
        const rateInput = document.getElementById('voiceRate');
        const pitchInput = document.getElementById('voicePitch');
        
        if (nameInput) nameInput.value = userPreferences.name;
        if (rateInput) rateInput.value = userPreferences.voiceRate;
        if (pitchInput) pitchInput.value = userPreferences.voicePitch;
    }
}

function saveUserPreferences() {
    localStorage.setItem('jarvis-preferences', JSON.stringify(userPreferences));
}

function openTrainingPanel() {
    document.getElementById('trainingPanel').style.display = 'flex';
    displayCustomCommands();
}

function closeTrainingPanel() {
    document.getElementById('trainingPanel').style.display = 'none';
}

function switchTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

function addCustomCommand() {
    const trigger = document.getElementById('newTrigger').value.toLowerCase().trim();
    const action = document.getElementById('newAction').value.trim();
    const response = document.getElementById('newResponse').value.trim();
    
    if (!trigger || !action || !response) {
        speak("Please fill in all fields to add a custom command.");
        return;
    }
    
    // Check if command already exists
    const existingCommand = customCommands.find(cmd => cmd.trigger === trigger);
    if (existingCommand) {
        speak("This command already exists. Please use a different trigger phrase.");
        return;
    }
    
    const newCommand = {
        id: Date.now(),
        trigger: trigger,
        action: action,
        response: response
    };
    
    customCommands.push(newCommand);
    saveCustomCommands();
    displayCustomCommands();
    
    // Clear inputs
    document.getElementById('newTrigger').value = '';
    document.getElementById('newAction').value = '';
    document.getElementById('newResponse').value = '';
    
    speak(`Custom command "${trigger}" has been added successfully.`);
}

function deleteCustomCommand(id) {
    customCommands = customCommands.filter(cmd => cmd.id !== id);
    saveCustomCommands();
    displayCustomCommands();
    speak("Custom command deleted.");
}

function displayCustomCommands() {
    const container = document.getElementById('customCommandsList');
    if (!container) return;
    
    if (customCommands.length === 0) {
        container.innerHTML = '<p style="color: #aed0d0; text-align: center;">No custom commands yet. Add some above!</p>';
        return;
    }
    
    container.innerHTML = customCommands.map(cmd => `
        <div class="command-item">
            <div class="command-trigger">"${cmd.trigger}"</div>
            <div class="command-details">
                Action: ${cmd.action}<br>
                Response: ${cmd.response}
            </div>
            <button class="delete-btn" onclick="deleteCustomCommand(${cmd.id})">Delete</button>
        </div>
    `).join('');
}

function savePreferences() {
    const nameInput = document.getElementById('userName');
    const rateInput = document.getElementById('voiceRate');
    const pitchInput = document.getElementById('voicePitch');
    
    userPreferences.name = nameInput.value.trim();
    userPreferences.voiceRate = parseFloat(rateInput.value);
    userPreferences.voicePitch = parseFloat(pitchInput.value);
    
    saveUserPreferences();
    speak("Preferences saved successfully!");
}

function exportCommands() {
    const dataStr = JSON.stringify({
        commands: customCommands,
        preferences: userPreferences,
        exportDate: new Date().toISOString()
    }, null, 2);
    
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'jarvis-training-data.json';
    link.click();
    URL.revokeObjectURL(url);
    
    speak("Training data exported successfully!");
}

function importCommands(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.commands && Array.isArray(data.commands)) {
                customCommands = data.commands;
                saveCustomCommands();
                displayCustomCommands();
            }
            
            if (data.preferences) {
                userPreferences = { ...userPreferences, ...data.preferences };
                saveUserPreferences();
                loadUserPreferences();
            }
            
            speak("Training data imported successfully!");
        } catch (error) {
            speak("Error importing training data. Please check the file format.");
        }
    };
    reader.readAsText(file);
}

function clearAllCommands() {
    if (customCommands.length === 0) {
        speak("No commands to clear.");
        return;
    }
    
    if (confirm("Are you sure you want to delete all custom commands? This cannot be undone.")) {
        customCommands = [];
        saveCustomCommands();
        displayCustomCommands();
        speak("All custom commands have been cleared.");
    }
}

// Speech Recognition Setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.onresult = (event) => {
    const currentIndex = event.resultIndex;
    const transcript = event.results[currentIndex][0].transcript;
    content.textContent = transcript;
    takeCommand(transcript.toLowerCase());
};

// Make the whole bar clickable
talkBar.addEventListener('click', () => {
    content.textContent = "Listening...";
    recognition.start();
});

function speak(text) {
    const text_speak = new SpeechSynthesisUtterance(text);

    text_speak.rate = userPreferences.voiceRate || 1;
    text_speak.volume = 1;
    text_speak.pitch = userPreferences.voicePitch || 1;

    window.speechSynthesis.speak(text_speak);
}

function wishMe() {
    var day = new Date();
    var hour = day.getHours();
    const userName = userPreferences.name || "Boss";

    if (hour >= 0 && hour < 12) {
        speak(`Good Morning ${userName}...`);
    } else if (hour >= 12 && hour < 17) {
        speak(`Good Afternoon ${userName}...`);
    } else {
        speak(`Good Evening ${userName}...`);
    }
}

function takeCommand(message) {
    // First check custom commands
    const customCommand = customCommands.find(cmd => 
        message.includes(cmd.trigger.toLowerCase())
    );
    
    if (customCommand) {
        // Execute custom command
        if (customCommand.action.startsWith('http')) {
            window.open(customCommand.action, "_blank");
        } else {
            // Could be a calculator, application, etc.
            try {
                window.open(customCommand.action);
            } catch (e) {
                console.log("Custom action:", customCommand.action);
            }
        }
        speak(customCommand.response);
        return;
    }
    
    // Default commands
    const userName = userPreferences.name || "Sir";
    
    if (message.includes('hey') || message.includes('hello')) {
        speak(`Hello ${userName}, How May I Help You?`);
    } else if (message.includes("open google")) {
        window.open("https://google.com", "_blank");
        speak("Opening Google...");
    } else if (message.includes("open youtube")) {
        window.open("https://youtube.com", "_blank");
        speak("Opening Youtube...");
    } else if (message.includes("open facebook")) {
        window.open("https://facebook.com", "_blank");
        speak("Opening Facebook...");
    } else if (message.includes('what is') || message.includes('who is') || message.includes('what are')) {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "This is what I found on the internet regarding " + message;
        speak(finalText);
    } else if (message.includes('wikipedia')) {
        window.open(`https://en.wikipedia.org/wiki/${message.replace("wikipedia", "").trim()}`, "_blank");
        const finalText = "This is what I found on Wikipedia regarding " + message;
        speak(finalText);
    } else if (message.includes('time')) {
        const time = new Date().toLocaleString(undefined, { hour: "numeric", minute: "numeric" });
        const finalText = "The current time is " + time;
        speak(finalText);
    } else if (message.includes('date')) {
        const date = new Date().toLocaleString(undefined, { month: "short", day: "numeric" });
        const finalText = "Today's date is " + date;
        speak(finalText);
    } else if (message.includes('calculator')) {
        window.open('Calculator:///');
        const finalText = "Opening Calculator";
        speak(finalText);
    } else if (message.includes('training') || message.includes('settings') || message.includes('learn')) {
        openTrainingPanel();
        speak("Opening training panel. You can teach me new commands here.");
    } else {
        window.open(`https://www.google.com/search?q=${message.replace(" ", "+")}`, "_blank");
        const finalText = "I found some information for " + message + " on Google";
        speak(finalText);
    }
}