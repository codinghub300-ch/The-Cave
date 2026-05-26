// game.js
document.addEventListener('DOMContentLoaded', () => {

    // ---------------- MODAL ----------------
    const modalHTML = `
        <div id="success-modal" style="
            display:none; 
            position:fixed; 
            top:0; left:0; width:100%; height:100%; 
            background: rgba(0,0,0,0.9); 
            color:#0f0; 
            justify-content:center; 
            align-items:center; 
            flex-direction:column; 
            z-index:9999;">
            
            <div class="treasure-icon" style="font-size:5rem;">🏆</div>
            <h2 class="glow" id="modal-title">ROOM CLEARED</h2>
            <div class="flag-text" id="modal-points" style="font-size:1.5rem; margin:10px 0;"></div>
            <button class="continue-btn" onclick="closeModal()" style="
                padding:10px 20px;
                font-size:1rem;
                cursor:pointer;
                border:none;
                border-radius:5px;
                background:#0f0;
                color:#000;
            ">Continue Deeper</button>

            <!-- Audio Elements -->
            <audio id="cave-ambient" src="/static/sounds/cave_ambient.mp3" loop></audio>
            <audio id="success-audio" src="/static/sounds/success.mp3"></audio>
            <audio id="fail-audio" src="/static/sounds/fail.mp3"></audio>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // ---------------- SOUNDS ----------------
    const ambient = document.getElementById('cave-ambient');
    ambient.volume = 0.3;

    const keySound = new Audio("/static/sounds/key.mp3");
    keySound.volume = 0.4;

    // Start ambient only after first click
    document.body.addEventListener('click', () => {
        ambient.play().catch(() => console.log("Ambient blocked until user interacts"));
    }, { once: true });

    // Optional: Play key sound when typing
    document.addEventListener('keydown', e => {
        if (e.key.length === 1 || e.key === "Backspace") {
            keySound.currentTime = 0;
            keySound.play().catch(() => {});
        }
    });
});

// ---------------- FLAG SUBMISSION ----------------
function submitFlag(roomId) {
    const flagInput = document.getElementById('flag-input');
    if (!flagInput) return alert("Flag input not found!");
    const flag = flagInput.value.trim();
    if (!flag) return alert("Enter a flag first!");

    const successSound = document.getElementById('success-audio');
    const failSound = document.getElementById('fail-audio');
    const ambient = document.getElementById('cave-ambient');

    fetch('/api/submit_flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_id: roomId, flag: flag })
    })
    .then(res => res.json())
    .then(data => {
        if(data.status === 'success') {
            triggerSuccess(data.points);
            successSound.currentTime = 0;
            successSound.play().catch(() => {});
        } else if (data.status === 'already_solved') {
            alert("You have already solved this room.");
        } else {
            failSound.currentTime = 0;
            failSound.play().catch(() => {});
            alert("Access Denied. Incorrect Flag.");
        }
    })
    .catch(err => console.error(err));
}

// ---------------- MODAL CONTROL ----------------
function triggerSuccess(points) {
    const modal = document.getElementById('success-modal');
    document.getElementById('modal-points').innerText = `+${points} POINTS SECURED`;
    modal.style.display = 'flex';
}

function closeModal() {
    const modal = document.getElementById('success-modal');
    modal.style.display = 'none';

    const ambient = document.getElementById('cave-ambient');
    ambient.pause();
    ambient.currentTime = 0;

    window.location.href = '/rooms';
}