// --- Configuration ---

// The array of 24 unique passwords, indexed from 0 to 23.
// Day 1 corresponds to index 0 (0000), Day 24 corresponds to index 23 (0023).
const CORRECT_PASSWORDS = [
    "0000", "0001", "0002", "0003", "0004", "0005",
    "0006", "0007", "0008", "0009", "0010", "0011",
    "0012", "0013", "0014", "0015", "0016", "0017",
    "0018", "0019", "0020", "0021", "0022", "0023"
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
// Removed the reference to revealVideo, as it's no longer needed in JS

let activeDay = null; // To store which present/day is currently open (1 to 24)

// Function to open the modal
function openModal(day) {
    activeDay = day;
    currentDaySpan.textContent = day;
    secretCodeInput.value = ''; // Clear previous input
    messageParagraph.textContent = ''; // Clear previous message
    
    // Ensure input field and submit button are visible if they were hidden previously
    document.getElementById('secret-code').style.display = 'block';
    document.getElementById('submit-code').style.display = 'block';
    
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
    // No video pause/rewind necessary
    activeDay = null;
}

// Function to check the password (Simplified Logic)
function checkPassword() {
    const enteredCode = secretCodeInput.value.trim();
    
    const dayNumber = parseInt(activeDay, 10);
    const passwordIndex = dayNumber - 1;
    const correctPassword = CORRECT_PASSWORDS[passwordIndex];

    if (enteredCode === correctPassword) {
        messageParagraph.textContent = MESSAGE_SUCCESS;
        messageParagraph.style.color = '#00FF00'; // Green success color

        // Hide the input field and submit button after success
        document.getElementById('secret-code').style.display = 'none';
        document.getElementById('submit-code').style.display = 'none';

        // Highlight the unlocked present
        document.querySelector(`[data-day="${activeDay}"]`).classList.add('unlocked');
        
    } else {
        messageParagraph.textContent = MESSAGE_FAILURE;
        messageParagraph.style.color = '#FF0000'; // Red failure color
        
        // Ensure input and button remain visible for retry
        document.getElementById('secret-code').style.display = 'block';
        document.getElementById('submit-code').style.display = 'block';
    }
}

// --- Event Listeners (No functional change) ---

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