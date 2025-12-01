// --- CONFIGURATION ---
const CORRECT_PASSWORDS = [
    ["CLARA"], ["CHILLI", "CHILLI PEPPER", "PEPPER", "HOT CHILLI"], ["KISS"], ["9876"],
    ["VILLAELF"], ["MEDAL", "LOCKET", "STAR"], ["GALAHAD"], ["ROSE"],
    ["2518"], ["MARKET"], ["GRINCH"], ["GATO"],
    ["11128"], ["BERRIES", "PLANT"], ["HEART"], ["HIDE"],
    ["51181"], ["3716"], ["SPIDER"], ["9591"],
    ["159.69.92.34"], ["BUSTED"], ["1526"], ["FIRE"]
];

const PUZZLE_IMAGE_SRC = 'final_puzzle.png'; 
const ROWS = 4;
const COLS = 6;
const SNAP_TOLERANCE = 50; 

// --- DOM ELEMENTS ---
const presents = document.querySelectorAll('.present');
const modal = document.getElementById('modal');
const closeButton = document.querySelector('.close-button');
const submitCodeButton = document.getElementById('submit-code');
const secretCodeInput = document.getElementById('secret-code');
const currentDaySpan = document.getElementById('current-day');
const messageParagraph = document.getElementById('message');

// Tabs
const tabCalendar = document.getElementById('tab-calendar');
const tabPuzzle = document.getElementById('tab-puzzle');
const viewCalendar = document.getElementById('view-calendar');
const viewPuzzle = document.getElementById('view-puzzle');
const puzzleContainer = document.getElementById('puzzle-container');
const piecesCountSpan = document.getElementById('pieces-count');

let activeDay = null;

// --- PUZZLE MANAGER CLASS ---
class PuzzleManager {
    constructor() {
        this.pieces = [];
        this.boardWidth = 800;
        this.boardHeight = 600;
        this.dayToPieceMap = this.loadOrGenerateMap();
        this.victoryShown = false; // Prevents spamming the victory message
        this.seed = 1; 

        this.init();
    }

    random() {
        var x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    loadOrGenerateMap() {
        let storedMap = localStorage.getItem('puzzleMap');
        if (storedMap) return JSON.parse(storedMap);
        let indices = Array.from({length: 24}, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        localStorage.setItem('puzzleMap', JSON.stringify(indices));
        return indices;
    }

    init() {
        this.gridW = this.boardWidth / COLS;
        this.gridH = this.boardHeight / ROWS;
        this.tabSize = Math.min(this.gridW, this.gridH) * 0.25;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                this.createPiece(r, c);
            }
        }
        
        this.renderCollectedPieces();
    }

    createPiece(row, col) {
        const index = row * COLS + col;
        
        // Shape Logic
        const shape = {
            top: row === 0 ? 0 : -this.getSideShape(row - 1, col, 'v'),
            right: col === COLS - 1 ? 0 : this.getSideShape(row, col, 'h'),
            bottom: row === ROWS - 1 ? 0 : this.getSideShape(row, col, 'v'),
            left: col === 0 ? 0 : -this.getSideShape(row, col - 1, 'h')
        };

        const maskUrl = this.createMask(this.gridW, this.gridH, shape);

        const div = document.createElement('div');
        div.className = 'puzzle-piece';
        div.id = `piece-${index}`;
        
        const totalW = this.gridW + (this.tabSize * 2);
        const totalH = this.gridH + (this.tabSize * 2);
        
        div.style.width = `${totalW}px`;
        div.style.height = `${totalH}px`;
        div.style.position = 'absolute';
        div.style.display = 'none';
        
        div.style.backgroundImage = `url('${PUZZLE_IMAGE_SRC}')`;
        div.style.backgroundSize = `${this.boardWidth}px ${this.boardHeight}px`;
        
        const bgX = -(col * this.gridW) + this.tabSize;
        const bgY = -(row * this.gridH) + this.tabSize;
        div.style.backgroundPosition = `${bgX}px ${bgY}px`;

        div.style.webkitMaskImage = `url(${maskUrl})`;
        div.style.maskImage = `url(${maskUrl})`;
        div.style.backgroundColor = 'rgba(255, 0, 0, 0.5)'; 

        const correctX = (col * this.gridW) - this.tabSize;
        const correctY = (row * this.gridH) - this.tabSize;

        const pieceObj = {
            id: index,
            element: div,
            // STORE ROW/COL for Adjacency Checks
            row: row, 
            col: col,
            correctX: correctX, 
            correctY: correctY,
            currentX: 0, currentY: 0, group: index
        };

        this.pieces.push(pieceObj);
        this.addDragLogic(div, pieceObj);
        puzzleContainer.appendChild(div);
    }

    getSideShape(r, c, type) {
        const val = Math.sin((r * 50) + (c * 30) + (type === 'h' ? 0 : 100));
        return val > 0 ? 1 : -1;
    }

    createMask(w, h, shape) {
        const canvas = document.createElement('canvas');
        const ts = this.tabSize;
        canvas.width = w + (ts * 2);
        canvas.height = h + (ts * 2);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.translate(ts, ts); 
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        this.drawSide(ctx, w, shape.top, ts);
        ctx.rotate(Math.PI / 2);
        this.drawSide(ctx, h, shape.right, ts);
        ctx.rotate(Math.PI / 2);
        this.drawSide(ctx, w, shape.bottom, ts);
        ctx.rotate(Math.PI / 2);
        this.drawSide(ctx, h, shape.left, ts);
        ctx.closePath();
        ctx.fill();
        return canvas.toDataURL();
    }

    drawSide(ctx, length, shape, tabSize) {
        const l3 = length / 3;
        if (shape === 0) {
            ctx.lineTo(length, 0);
        } else {
            const h = shape * tabSize;
            const curveW = l3 / 2;
            ctx.lineTo(l3, 0);
            ctx.bezierCurveTo(l3 - curveW, h, l3 + l3 + curveW, h, l3 + l3, 0);
            ctx.lineTo(length, 0);
        }
        ctx.translate(length, 0);
    }

    addDragLogic(element, pieceObj) {
        let isDragging = false;
        let startX, startY;

        const startDrag = (e) => {
            if(e.type === 'mousedown' && e.button !== 0) return;
            isDragging = true;
            startX = e.clientX || e.touches[0].clientX;
            startY = e.clientY || e.touches[0].clientY;
            element.style.zIndex = 1000;
        };

        const moveDrag = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const cx = e.clientX || e.touches[0].clientX;
            const cy = e.clientY || e.touches[0].clientY;
            const dx = cx - startX;
            const dy = cy - startY;

            this.pieces.filter(p => p.group === pieceObj.group).forEach(p => {
                p.currentX += dx;
                p.currentY += dy;
                p.element.style.left = `${p.currentX}px`;
                p.element.style.top = `${p.currentY}px`;
            });

            startX = cx;
            startY = cy;
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            element.style.zIndex = "";
            this.checkSnapping(pieceObj);
            this.savePuzzleState();
        };

        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag);
        window.addEventListener('mousemove', moveDrag);
        window.addEventListener('touchmove', moveDrag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
    }

    checkSnapping(movedPiece) {
        this.pieces.forEach(target => {
            if (movedPiece.group === target.group) return; 
            if (target.element.style.display === 'none') return;

            // Strict Adjacency Check ---
            // Calculate "Manhattan Distance" in grid coordinates.
            // Neighbors have a distance of exactly 1. Diagonals have 2.
            const gridDistance = Math.abs(movedPiece.row - target.row) + Math.abs(movedPiece.col - target.col);
            
            // If they are not direct neighbors (Left/Right/Top/Bottom), STOP.
            if (gridDistance !== 1) return; 
            // --------------------------------------

            // 2. Physical Distance Check
            const dist = Math.hypot(
                (movedPiece.currentX - target.currentX) - (movedPiece.correctX - target.correctX),
                (movedPiece.currentY - target.currentY) - (movedPiece.correctY - target.correctY)
            );

            if (dist < SNAP_TOLERANCE) {
                const oldGroup = movedPiece.group;
                const newGroup = target.group;
                
                this.pieces.filter(p => p.group === oldGroup).forEach(p => {
                    p.group = newGroup;
                    p.currentX = target.currentX + (p.correctX - target.correctX);
                    p.currentY = target.currentY + (p.correctY - target.correctY);
                    p.element.style.left = `${p.currentX}px`;
                    p.element.style.top = `${p.currentY}px`;
                    
                    p.element.style.filter = "brightness(1.5)";
                    setTimeout(() => p.element.style.filter = "none", 300);
                });
                
                // Check for Victory after every successful snap
                this.checkVictory();
            }
        });
    }

    // Victory Condition ---
    checkVictory() {
        if (this.victoryShown) return;

        // 1. Are all pieces unlocked/visible?
        const unlockedCount = this.pieces.filter(p => p.element.style.display !== 'none').length;
        if (unlockedCount < 24) return;

        // 2. Are all pieces in the same group?
        const mainGroup = this.pieces[0].group;
        const allConnected = this.pieces.every(p => p.group === mainGroup);

        if (allConnected) {
            this.victoryShown = true;
            setTimeout(() => {
                showVictoryModal();
            }, 500); // Slight delay for effect
        }
    }

    renderCollectedPieces() {
        const unlockedDays = getUnlockedDays();
        let savedState = [];
        try { savedState = JSON.parse(localStorage.getItem('puzzleState_v5')) || []; } catch (e) {}

        unlockedDays.forEach(day => {
            const pieceIndex = this.dayToPieceMap[day - 1];
            if (this.pieces[pieceIndex]) {
                const piece = this.pieces[pieceIndex];
                if (piece.element.style.display === 'none') {
                    piece.element.style.display = 'block';
                    
                    const saved = savedState.find(s => s.id === piece.id);
                    if (saved) {
                        piece.currentX = saved.x;
                        piece.currentY = saved.y;
                        piece.group = saved.group;
                    } else {
                        piece.currentX = 20 + Math.random() * 400;
                        piece.currentY = 20 + Math.random() * 200;
                    }
                    piece.element.style.left = `${piece.currentX}px`;
                    piece.element.style.top = `${piece.currentY}px`;
                }
            }
        });
        
        // Also check victory on load, in case they refresh the page after winning
        this.checkVictory();
        this.updateCount();
    }

    updateCount() {
        const count = this.pieces.filter(p => p.element.style.display === 'block').length;
        if(piecesCountSpan) piecesCountSpan.textContent = count;
    }

    savePuzzleState() {
        const state = this.pieces.map(p => ({
            id: p.id,
            x: p.currentX,
            y: p.currentY,
            group: p.group
        }));
        localStorage.setItem('puzzleState_v5', JSON.stringify(state));
    }
}

const puzzleManager = new PuzzleManager();

// --- CALENDAR LOGIC ---

function getUnlockedDays() {
    const data = localStorage.getItem('unlockedDays');
    return data ? JSON.parse(data) : [];
}

function setDayAsUnlocked(day) {
    const unlockedDays = getUnlockedDays();
    const dayString = String(day);
    if (!unlockedDays.includes(dayString)) {
        unlockedDays.push(dayString);
        localStorage.setItem('unlockedDays', JSON.stringify(unlockedDays));
        puzzleManager.renderCollectedPieces();
    }
}

function initializeCalendarState() {
    const unlockedDays = getUnlockedDays();
    presents.forEach(present => {
        const day = present.getAttribute('data-day');
        if (unlockedDays.includes(day)) {
            present.classList.add('unlocked');
        }
    });
    puzzleManager.renderCollectedPieces();
}

// Tabs
if (tabCalendar && tabPuzzle) {
    tabCalendar.addEventListener('click', () => {
        viewCalendar.style.display = 'block';
        viewPuzzle.style.display = 'none';
        tabCalendar.classList.add('active');
        tabPuzzle.classList.remove('active');
    });

    tabPuzzle.addEventListener('click', () => {
        viewCalendar.style.display = 'none';
        viewPuzzle.style.display = 'block';
        tabCalendar.classList.remove('active');
        tabPuzzle.classList.add('active');
    });
}

// --- MODAL LOGIC (Now handles Victory too) ---
function openModal(day) {
    activeDay = day;
    currentDaySpan.textContent = day;
    secretCodeInput.value = '';
    messageParagraph.textContent = '';
    const presentElement = document.querySelector(`[data-day="${day}"]`);

    if (presentElement.classList.contains('unlocked')) {
        messageParagraph.textContent = "ALREADY SOLVED! Check the Evidence Board.";
        messageParagraph.style.color = '#FFD700';
        document.getElementById('secret-code').style.display = 'none';
        document.getElementById('submit-code').style.display = 'none';
    } else {
        document.getElementById('secret-code').style.display = 'block';
        document.getElementById('submit-code').style.display = 'block';
    }
    
    // Reset modal content in case victory message overwrote it
    document.getElementById('modal-body').querySelector('h3').style.display = 'block';
    modal.style.display = 'block';
}

// Victory Modal Function ---
function showVictoryModal() {
    // We reuse the existing modal but replace content temporarily
    const modalBody = document.getElementById('modal-body');
    
    modalBody.innerHTML = `
        <h2 style="color: #FFD700; font-size: 2.5em; text-shadow: 2px 2px #ff0000;">🎄 MISSION ACCOMPLISHED! 🎄</h2>
        <p style="font-size: 1.3em; margin: 20px 0;">
            Congratulations, Agent! You have successfully completed the mission.
        </p>
        <p style="font-size: 1.3em; color: #00FF00; font-weight: bold;">
            You saved Christmas! You even got the Grinch to feel the Christmas spirit and celebrate it!
        </p>
        <img src="final_puzzle.png" style="width: 100%; max-width: 400px; border: 4px solid #FFD700; border-radius: 10px; margin-top: 20px;">
        <br><br>
        <button onclick="closeModal()" style="padding: 10px 20px; font-size: 1.2em; cursor: pointer;">Case Closed</button>
    `;
    
    modal.style.display = 'block';
    
    // Create simple confetti effect (Optional visual flair)
    startConfetti();
}

function startConfetti() {
    // Simple emoji confetti
    const colors = ['❄️', '🎁', '🎄', '⭐', '🍪'];
    for(let i=0; i<50; i++) {
        const el = document.createElement('div');
        el.innerText = colors[Math.floor(Math.random() * colors.length)];
        el.style.position = 'fixed';
        el.style.left = Math.random() * 100 + 'vw';
        el.style.top = '-10vh';
        el.style.fontSize = (Math.random() * 20 + 20) + 'px';
        el.style.zIndex = '9999';
        el.style.transition = `top ${Math.random() * 2 + 3}s linear`;
        document.body.appendChild(el);
        
        setTimeout(() => {
            el.style.top = '110vh';
        }, 100);
        
        setTimeout(() => el.remove(), 5000);
    }
}

function closeModal() { modal.style.display = 'none'; activeDay = null; }

function checkPassword() {
    const enteredCode = secretCodeInput.value.trim().toUpperCase();
    const dayNumber = parseInt(activeDay, 10);
    const correctPasswordsArray = CORRECT_PASSWORDS[dayNumber - 1];

    if (correctPasswordsArray.includes(enteredCode)) {
        messageParagraph.textContent = "ACCESS GRANTED! Piece Unlocked!";
        messageParagraph.style.color = '#00FF00';
        document.querySelector(`[data-day="${activeDay}"]`).classList.add('unlocked');
        setDayAsUnlocked(activeDay);
        document.getElementById('secret-code').style.display = 'none';
        document.getElementById('submit-code').style.display = 'none';
    } else {
        messageParagraph.textContent = "ACCESS DENIED.";
        messageParagraph.style.color = '#FF0000';
    }
}

presents.forEach(present => present.addEventListener('click', () => openModal(present.getAttribute('data-day'))));
closeButton.addEventListener('click', closeModal);
submitCodeButton.addEventListener('click', checkPassword);
secretCodeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') checkPassword(); });
window.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });

initializeCalendarState();
