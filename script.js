// --- Configuration ---

// The array of 24 unique passwords. Each entry is now an array of possible correct codes.
// Day 1 corresponds to index 0, Day 24 corresponds to index 23.
const CORRECT_PASSWORDS = [
    ["CLARA"], // Day 1
    ["CHILLI", "CHILLI PEPPER", "PEPPER", "HOT CHILLI", "HOT CHILLI PEPPER"], // Day 2 (Example of multiple answers)
    ["KISS"], // Day 3
    ["9876"], // Day 4
    ["VILLAELF"], // Day 5
    ["MEDAL", "LOCKET", "STAR", "MEDALLION"], // Day 6
    ["GALAHAD"], // Day 7
    ["ROSE"], // Day 8
    ["2518"], // Day 9
    ["MARKET"], // Day 10
    ["GRINCH"], // Day 11
    ["GATO"], // Day 12
    ["11128"], // Day 13
    ["BERRIES", "PLANT"], // Day 14
    ["HEART"], // Day 15
    ["HIDE"], // Day 16
    ["51181"], // Day 17
    ["3716"], // Day 18
    ["SPIDER"], // Day 19
    ["9591"], // Day 20
    ["159.69.92.34"], // Day 21
    ["BUSTED"], // Day 22
    ["1526"], // Day 23
    ["FIRE"] // Day 24
];


// NEW SUCCESS MESSAGE
const MESSAGE_SUCCESS = "ACCESS GRANTED! The Elves' Secret Police successfully prevented the Grinch's plan for the day! Report filed.";
const MESSAGE_FAILURE = "ACCESS DENIED. Incorrect Elves' Secret Code. Try again, agent.";
// ---------------------

const presents = document.querySelectorAll('.present');
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close-button');
const submitCodeButton = document.getElementById('submit-code');
const secretCodeInput = document.getElementById('secret-code');
const currentDaySpan = document.getElementById('current-day');
const messageParagraph = document.getElementById('message');

let activeDay = null; // To store which present/day is currently open (1 to 24)

// --- Persistence Functions ---

// 1. Function to retrieve the list of unlocked days from local storage
function getUnlockedDays() {
    const unlockedDaysString = localStorage.getItem('unlockedDays');
    return unlockedDaysString ? JSON.parse(unlockedDaysString) : [];
}

// 2. Function to add a day to the unlocked list and save it
function setDayAsUnlocked(day) {
    const unlockedDays = getUnlockedDays();
    const dayString = String(day);
    if (!unlockedDays.includes(dayString)) {
        unlockedDays.push(dayString);
        localStorage.setItem('unlockedDays', JSON.stringify(unlockedDays));
    }
}

// 3. Function run on page load to apply saved states
function initializeCalendarState() {
    const unlockedDays = getUnlockedDays();
    presents.forEach(present => {
        const day = present.getAttribute('data-day');
        if (unlockedDays.includes(day)) {
            present.classList.add('unlocked');
        }
    });
}


// Function to open the modal (Added logic to check if already unlocked)
function openModal(day) {
    activeDay = day;
    currentDaySpan.textContent = day;
    secretCodeInput.value = ''; // Clear previous input
    messageParagraph.textContent = ''; // Clear previous message
    
    const presentElement = document.querySelector(`[data-day="${day}"]`);

    // Check if the present is ALREADY unlocked
    if (presentElement.classList.contains('unlocked')) {
        messageParagraph.textContent = MESSAGE_SUCCESS; // Show success message
        messageParagraph.style.color = '#00FF00';
        document.getElementById('secret-code').style.display = 'none';
        document.getElementById('submit-code').style.display = 'none';
    } else {
        // If not unlocked, show input and button
        document.getElementById('secret-code').style.display = 'block';
        document.getElementById('submit-code').style.display = 'block';
    }

    // Hide the video element's container if it was showing a video (optional cleanup)
    const videoElement = document.getElementById('reveal-video');
    if (videoElement) {
        videoElement.style.display = 'none';
        videoElement.pause();
        videoElement.currentTime = 0;
    }
    
    modal.style.display = 'block';
}

// Function to close the modal
function closeModal() {
    modal.style.display = 'none';
    activeDay = null;
}

// Function to check the password (Combined with persistence logic)
function checkPassword() {
    const enteredCode = secretCodeInput.value.trim().toUpperCase();
    
    const dayNumber = parseInt(activeDay, 10);
    const passwordIndex = dayNumber - 1;
    const correctPasswordsArray = CORRECT_PASSWORDS[passwordIndex]; // This is now an array

    if (correctPasswordsArray.includes(enteredCode)) { // Checking against the array
        messageParagraph.textContent = MESSAGE_SUCCESS;
        messageParagraph.style.color = '#00FF00'; // Green success color

        // --- NEW PERSISTENCE CODE ---
        // 1. Add the unlocked class to the present element
        const presentElement = document.querySelector(`[data-day="${activeDay}"]`);
        presentElement.classList.add('unlocked');
        
        // 2. Save the unlocked state to local storage
        setDayAsUnlocked(activeDay);
        // -----------------------------

        // Hide the input field and submit button after success
        document.getElementById('secret-code').style.display = 'none';
        document.getElementById('submit-code').style.display = 'none';
        
    } else {
        messageParagraph.textContent = MESSAGE_FAILURE;
        messageParagraph.style.color = '#FF0000'; // Red failure color
        
        // Ensure input and button remain visible for retry
        document.getElementById('secret-code').style.display = 'block';
        document.getElementById('submit-code').style.display = 'block';
    }
}

// --- Event Listeners and Initialization ---

presents.forEach(present => {
    present.addEventListener('click', () => {
        const day = present.getAttribute('data-day');
        openModal(day);
    });
});

closeButton.addEventListener('click', closeModal);
submitCodeButton.addEventListener('click', checkPassword);
secretCodeInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        checkPassword();
    }
});
window.addEventListener('click', (event) => {
    if (event.target === modal) {
        closeModal();
    }
});

// RUN ON PAGE LOAD: Check local storage and apply unlocked classes
initializeCalendarState();