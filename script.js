/* ========================================
   ROBO ROVER EVENT DOOR PANEL - FULL JS
   ======================================== */

/* ---------- NUCLEAR CIRCUIT BG ---------- */
(function () {
    const canvas = document.getElementById('circuit-bg');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    const count = 80;
    for (let i = 0; i < count; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.8,
            vy: (Math.random() - 0.5) * 1.8,
            size: Math.random() * 4 + 2
        });
    }

    let t = 0;
    function animate() {
        t += 0.03;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, i) => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

            const hue = (190 + Math.sin(t + i) * 80) % 360;
            const glow = 0.8 + Math.sin(t * 3 + i) * 0.4;

            ctx.shadowBlur = 30;
            ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${glow})`;
            ctx.fillStyle = `hsla(${hue}, 100%, 80%, ${glow})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 50;
            ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${glow * 0.6})`;
            ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${glow * 0.5})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size + 3, 0, Math.PI * 2);
            ctx.stroke();

            ctx.shadowBlur = 0;

            particles.slice(i + 1).forEach(p2 => {
                const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
                if (dist < 180) {
                    const alpha = 0.6 * (1 - dist / 180);
                    const lineHue = (200 + Math.sin(t + i) * 50) % 360;
                    ctx.strokeStyle = `hsla(${lineHue}, 100%, 65%, ${alpha})`;
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            });
        });

        requestAnimationFrame(animate);
    }
    animate();
})();

/* ---------- FLOATING PARTICLES ---------- */
(function () {
    const container = document.getElementById('particles');
    if (!container) return;
    for (let i = 0; i < 40; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.left = Math.random() * 100 + 'vw';
        p.style.bottom = Math.random() * 20 + 'vh';
        p.style.width = p.style.height = (Math.random() * 6 + 3) + 'px';
        p.style.animationDelay = Math.random() * 3.5 + 's';
        p.style.animationDuration = (Math.random() * 2 + 3) + 's';
        container.appendChild(p);
    }
})();

/* ---------- VOICE FEEDBACK ---------- */
const speak = (text) => {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(text);
        utter.rate = 0.9;
        utter.pitch = 1.1;
        utter.volume = 0.9;
        speechSynthesis.speak(utter);
    }
};

/* ---------- PALM SCAN: UNIVERSAL HAND DETECTION ---------- */
(() => {
    const panel = document.getElementById('panel');
    const beam = document.getElementById('scan-beam');
    const handCont = document.getElementById('hand-container');
    const prompt = document.getElementById('prompt');
    const err = document.getElementById('error-msg');
    const granted = document.getElementById('access-granted');
    const started = document.getElementById('event-started');
    const resetBtn = document.getElementById('reset-button');
    const scanLine = document.querySelector('.scan-line');
    const scanScreen = document.getElementById('scan-screen');

    if (!panel || !beam || !handCont || !prompt || !err || !granted || !started || !resetBtn || !scanLine || !scanScreen) return;

    let scanning = false;
    let beamPos = 0;
    let beamInt;
    let isLocked = false;
    let isTouching = false;
    const BEAM_HEIGHT = 14;
    const SCAN_SPEED = 4.5;
    const REWIND_SPEED = 15;

    const getHandHeight = () => handCont.offsetHeight;

    const updateTouchState = (hasTouches) => {
        isTouching = hasTouches;
        if (hasTouches && !scanning && !isLocked) startScan();
    };

    const handleTouchStart = (e) => { e.preventDefault(); updateTouchState(true); };
    const handleTouchMove = (e) => { e.preventDefault(); updateTouchState(e.touches && e.touches.length > 0); };
    const handleTouchEnd = (e) => { updateTouchState(e.touches && e.touches.length > 0); };

    let mouseDown = false;
    const handleMouseDown = (e) => { e.preventDefault(); mouseDown = true; updateTouchState(true); };
    const handleMouseMove = () => { if (mouseDown) updateTouchState(true); };
    const handleMouseUp = () => { mouseDown = false; updateTouchState(false); };
    const handleMouseLeave = () => { if (mouseDown) { mouseDown = false; updateTouchState(false); } };

    const startScan = () => {
        if (scanning || isLocked) return;
        scanning = true;
        const height = getHandHeight();
        beamPos = height - BEAM_HEIGHT;
        beam.style.top = beamPos + 'px';
        beam.style.display = 'block';
        beam.style.opacity = '1';
        prompt.style.display = 'none';

        beamInt = setInterval(() => {
            const height = getHandHeight();
            if (isTouching) {
                beamPos -= SCAN_SPEED;
                if (beamPos <= 0) {
                    beamPos = 0;
                    clearInterval(beamInt);
                    setTimeout(showGranted, 300);
                }
            } else {
                beamPos += REWIND_SPEED;
                if (beamPos >= height - BEAM_HEIGHT) {
                    beamPos = height - BEAM_HEIGHT;
                    if (!isTouching) {
                        clearInterval(beamInt);
                        setTimeout(failScan, 100);
                    }
                }
            }
            beam.style.top = beamPos + 'px';
        }, 16);
    };

    const failScan = () => {
        if (!scanning) return;
        clearInterval(beamInt);
        scanning = false;
        isLocked = true;
        beam.style.display = 'none';
        err.style.opacity = 1;
        speak("Hand removed. Scan failed. Try again.");
        setTimeout(() => {
            err.style.opacity = 0;
            setTimeout(() => { prompt.style.display = 'block'; isLocked = false; }, 100);
        }, 2200);
    };

    const showGranted = async () => {
        scanning = false;
        isTouching = false;
        scanScreen.style.display = 'none';
        granted.style.display = 'flex';
        scanLine.style.animation = 'none';
        setTimeout(() => scanLine.style.animation = 'scanSweep 2.6s infinite', 50);
        speak("Access granted. Opening the gate...");

        try {
            await sendCommand('START_DOOR');
        } catch (e) {
            console.error(e);
            speak("Battle on Live");
            speak("Battle Started..... Welcome to Roborover 2025");
        }

        removeScanListeners();
        setTimeout(() => {
            granted.style.display = 'none';
            started.style.display = 'flex';
            resetBtn.style.display = 'block';
        }, 3800);
    };

    const addScanListeners = () => {
        panel.addEventListener('touchstart', handleTouchStart, { passive: false });
        panel.addEventListener('touchmove', handleTouchMove, { passive: false });
        panel.addEventListener('touchend', handleTouchEnd, { passive: false });
        panel.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        panel.addEventListener('mousedown', handleMouseDown);
        panel.addEventListener('mousemove', handleMouseMove);
        panel.addEventListener('mouseup', handleMouseUp);
        panel.addEventListener('mouseleave', handleMouseLeave);
    };

    const removeScanListeners = () => {
        panel.removeEventListener('touchstart', handleTouchStart);
        panel.removeEventListener('touchmove', handleTouchMove);
        panel.removeEventListener('touchend', handleTouchEnd);
        panel.removeEventListener('touchcancel', handleTouchEnd);
        panel.removeEventListener('mousedown', handleMouseDown);
        panel.removeEventListener('mousemove', handleMouseMove);
        panel.removeEventListener('mouseup', handleMouseUp);
        panel.removeEventListener('mouseleave', handleMouseLeave);
    };

    // === RESET EVENT – NOW CLOSES DOOR ===
    window.resetEvent = async () => {
        if (isLocked) return;
        isLocked = true;

        try {
            await sendCommand('CLOSE_DOOR');
            console.log("Sent: CLOSE_DOOR");
            speak("Door closing.");
        } catch (e) {
            console.error("Failed to close door:", e);
            speak("Welcome to Roborover 2025");
        }

        clearInterval(beamInt);
        scanning = false;
        isTouching = false;
        mouseDown = false;
        granted.style.display = 'none';
        started.style.display = 'none';
        resetBtn.style.display = 'none';
        err.style.opacity = 0;
        beam.style.display = 'none';
        prompt.style.display = 'block';
        scanScreen.style.display = 'flex';
        scanLine.style.animation = 'none';
        setTimeout(() => { scanLine.style.animation = 'scanSweep 2.6s infinite'; }, 50);
        speak("System reset. Ready for next scan.");
        removeScanListeners();
        setTimeout(addScanListeners, 100);
        setTimeout(() => { isLocked = false; }, 1800);
    };

    addScanListeners();

    document.addEventListener('keydown', e => {
        if (e.key.toLowerCase() === 'r' && !isLocked) resetEvent();
    });
})();

/* ---------- WEB SERIAL (ARDUINO) ---------- */
let serialPort = null;
let writer = null;

async function connectSerial() {
    try {
        serialPort = await navigator.serial.requestPort();
        await serialPort.open({ baudRate: 115200 });
        writer = serialPort.writable.getWriter();

        const reader = serialPort.readable.getReader();
        (async () => {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                const txt = new TextDecoder().decode(value).trim();
                if (txt) console.log('Arduino:', txt);
            }
        })();

        const btn = document.getElementById('serial-connect');
        if (btn) {
            btn.textContent = 'Arduino Connected';
            btn.style.background = '#0f0';
            btn.style.color = '#000';
        }
        speak('Arduino connected.');
    } catch (e) {
        console.error(e);
        alert('Serial error: ' + e.message);
    }
}

async function sendCommand(cmd) {
    if (!writer) throw new Error('Arduino not connected');
    const data = new TextEncoder().encode(cmd + '\n');
    await writer.write(data);
}

/* Add Connect Button */
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.createElement('button');
    btn.id = 'serial-connect';
    btn.textContent = 'Connect Arduino';
    btn.onclick = connectSerial;
    Object.assign(btn.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '14px 24px',
        background: '#333',
        color: '#0f0',
        border: '2px solid #0f0',
        borderRadius: '12px',
        fontFamily: 'Orbitron, sans-serif',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 0 15px #0f0'
    });
    document.body.appendChild(btn);
});
