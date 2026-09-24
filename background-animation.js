// Clean waves + raining accented vowels animation

function setupCanvas() {
    const canvas = document.getElementById('fondoCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let W = window.innerWidth;
    let H = window.innerHeight;

    // Configuration
    const accentLetters = ['Á','É','Í','Ó','Ú','á','é','í','ó','ú'];
    const LETTER_SCALE = 1.0;
    const MAX_LETTERS = 80;
    const SPAWN_INTERVAL = 240; // ms between new falling letters
    const GRAVITY = 0.018;
    const FLOAT_DRIFT = 0.04;
    // neon hue range (shared between ribbons and letters)
    const HUE_START = 190; // cyan
    const HUE_END = 320;   // magenta

    // Wave layers (amplitude, frequency, speed, phase)
    const waves = [
        {amp: 30, freq: 0.008, speed: 0.9, phase: 0},
        {amp: 14, freq: 0.015, speed: 1.3, phase: Math.PI/2},
        {amp: 8,  freq: 0.03,  speed: 1.9, phase: Math.PI}
    ];

    let letters = [];
    let lastSpawn = performance.now();

    // Slot/grid for spawn positions to prevent stacking
    let SLOT_WIDTH = Math.floor(28 * LETTER_SCALE);
    let slotsCount = Math.max(8, Math.floor(window.innerWidth / Math.max(40, SLOT_WIDTH)));
    let occupiedSlots = new Array(slotsCount).fill(null);

    function resize() {
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W;
        canvas.height = H;
        SLOT_WIDTH = Math.floor(28 * LETTER_SCALE);
        slotsCount = Math.max(6, Math.floor(W / Math.max(40, SLOT_WIDTH)));
        occupiedSlots = new Array(slotsCount).fill(null);
    }

    // Ribbons parameters (shared between drawing and wave sampling)
    const RIBBONS = 5;
    const ribbonsParams = [];
    for (let r = 0; r < RIBBONS; r++) {
        ribbonsParams.push({
            amp: 36 + r * 10,
            freq: 0.0012 + r * 0.0009,
            speed: 0.9 + r * 0.22,
            phase: r * 1.25,
            offset: (r - (RIBBONS - 1) / 2) * 10
        });
    }

    function waveY(x, t) {
        const base = H * 0.55; // move main animation 10% down
        let accum = 0;
        for (let i = 0; i < ribbonsParams.length; i++) {
            const w = ribbonsParams[i];
            const timeFactor = t * 0.00035 * w.speed;
            accum += Math.sin(x * w.freq + w.phase) * Math.cos(timeFactor) * w.amp + w.offset;
        }
        // average to get a smooth surface height
        return base + accum / Math.max(1, ribbonsParams.length);
    }

    function waveSlope(x, t) {
        const dx = 6;
        const y1 = waveY(x - dx, t);
        const y2 = waveY(x + dx, t);
        return (y2 - y1) / (2 * dx);
    }

    function spawn() {
        if (letters.length >= MAX_LETTERS) return;
        const MAX_ATTEMPTS = 12;
        const char = accentLetters[Math.floor(Math.random() * accentLetters.length)];
        const fontSize = Math.floor((12 + Math.random() * 12) * LETTER_SCALE);
        const estWidth = Math.max(14, Math.floor(fontSize * 0.7));
        let attempt = 0;
        let chosenSlot = -1;
        while (attempt < MAX_ATTEMPTS) {
            const slot = Math.floor(Math.random() * slotsCount);
            const occupant = occupiedSlots[slot];
            if (!occupant || occupant.state === 'sinking') { chosenSlot = slot; break; }
            attempt++;
        }
        if (chosenSlot === -1) return; // couldn't find free slot
        const x = chosenSlot * Math.max(40, SLOT_WIDTH) + Math.max(40, SLOT_WIDTH) * 0.5;
        const letter = {
            x, y: -20 - Math.random() * 60,
            vx: (Math.random() - 0.5) * 0.12,
            vy: 0.6 + Math.random() * 0.5,
            fontSize,
            char,
            slot: chosenSlot,
            state: 'falling', // falling, floating, sinking
            sink: 0,
            opacity: 1,
            angle: 0,
            floatTime: 0,
            bobAmtBase: Math.max(6, fontSize * 0.5),
            bobPhase: Math.random() * Math.PI * 2
        };
        // reserve slot immediately to prevent other letters spawning into it
        occupiedSlots[chosenSlot] = letter;
        letters.push(letter);
    }

    function updateLetters(t) {
        for (let i = letters.length - 1; i >= 0; i--) {
            const L = letters[i];
            if (L.state === 'falling') {
                L.vy += GRAVITY;
                L.x += L.vx;
                L.y += L.vy;
                const wy = waveY(L.x, t);
                if (L.y >= wy - L.fontSize * 0.35) {
                    L.state = 'floating';
                    L.y = wy - L.fontSize * 0.35;
                    L.vx = 0; // lock horizontal once landed in slot
                    L.vy = 0;
                    L.sink = 0;
                    L.floatTime = 0;
                    // mark slot as occupied while floating
                    if (typeof L.slot === 'number' && L.slot >= 0) occupiedSlots[L.slot] = L;
                }
            } else if (L.state === 'floating') {
                const wy = waveY(L.x, t);
                // gentle horizontal jitter (very small)
                L.x += (L.vx * 0.02);
                // buoyant bobbing effect: decaying sinusoidal bob when first landing
                L.floatTime += 2;
                const decay = Math.exp(-L.floatTime * 0.002);
                const bob = Math.sin(L.floatTime * 0.05 + L.bobPhase) * (L.bobAmtBase || 6) * decay;
                const targetY = wy - L.fontSize * 0.35 + bob + L.sink * (L.fontSize * 0.6);
                L.y += (targetY - L.y) * 0.22;
                // slowly begin sinking after bobbing dissipates
                if (L.floatTime > 700) L.sink += 0.0009;
                if (L.sink >= 1.0) {
                    L.state = 'sinking';
                    // free slot when sinking begins
                    if (typeof L.slot === 'number' && L.slot >= 0) occupiedSlots[L.slot] = null;
                }

                // ensure x remains at center of its slot (avoid drifting into neighbors)
                if (typeof L.slot === 'number' && L.slot >= 0) {
                    const targetX = L.slot * Math.max(40, SLOT_WIDTH) + Math.max(40, SLOT_WIDTH) * 0.5;
                    L.x += (targetX - L.x) * 0.28;
                }
            } else if (L.state === 'sinking') {
                L.sink += 0.006;
                L.y += 0.4 + L.sink * 0.85;
                L.opacity -= 0.007;
                if (L.opacity <= 0.03) {
                    if (typeof L.slot === 'number' && L.slot >= 0) occupiedSlots[L.slot] = null;
                    letters.splice(i, 1);
                }
            }

            if (L.x < -60) L.x = W + 60;
            if (L.x > W + 60) L.x = -60;

            // update angle smoothly using wave slope
            const slope = waveSlope(L.x, t);
            const target = Math.atan(slope);
            const diff = ((target - L.angle + Math.PI) % (Math.PI*2)) - Math.PI;
            L.angle += diff * 0.12;
        }
    }

    function drawBackground() {
        // deep background gradient
        const g = ctx.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, '#041223');
        g.addColorStop(0.45, '#07182a');
        g.addColorStop(1, '#021220');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
    }
    // Ribbon-based PS-like background
    function drawRibbons(t) {
        const baseY = H * 0.55;
        ctx.save();
        for (let r = 0; r < ribbonsParams.length; r++) {
            const p = ribbonsParams[r];
            const amp = p.amp;
            const freq = p.freq;
            const speed = p.speed;
            const phase = p.phase;
            const offset = p.offset;

            // build path
            ctx.beginPath();
            ctx.moveTo(0, H);
            for (let x = 0; x <= W; x += 18) {
                const y = baseY + Math.sin(x * freq + phase) * Math.cos(t * 0.00035 * speed) * amp + offset;
                ctx.lineTo(x, y);
            }
            ctx.lineTo(W, H);
            ctx.closePath();

            // neon gradient per ribbon (cyan -> magenta blend)
            const gg = ctx.createLinearGradient(0, baseY - amp - 60, 0, baseY + amp + 120);
            const hue = Math.round(HUE_START + (HUE_END - HUE_START) * (r / Math.max(1, ribbonsParams.length - 1)));
            gg.addColorStop(0, `hsla(${hue}, 95%, 60%, ${0.14 + r * 0.02})`);
            gg.addColorStop(0.45, `hsla(${hue}, 95%, 46%, ${0.1 + r * 0.02})`);
            gg.addColorStop(1, `rgba(3,6,12,0.06)`);
            ctx.fillStyle = gg;
            ctx.fill();

            // neon stroke glow
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.strokeStyle = `hsla(${hue}, 95%, 72%, ${0.10 + r * 0.02})`;
            ctx.lineWidth = 20 - r * 2;
            ctx.shadowColor = `hsla(${hue}, 95%, 60%, ${0.10 + r * 0.02})`;
            ctx.shadowBlur = 28 - r * 3;
            ctx.beginPath();
            for (let x = 0; x <= W; x += 20) {
                const y = baseY + Math.sin(x * freq + phase) * Math.cos(t * 0.00035 * speed) * amp + offset;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();
            ctx.restore();
        }
        ctx.restore();
    }

    function drawUnderwater(now) {
        // darken the area below the main waterline for contrast
        const sampleY = waveY(W * 0.5, now);
        const yStart = sampleY + 8;
        const g = ctx.createLinearGradient(0, yStart, 0, H);
        g.addColorStop(0, 'rgba(0,0,0,0.12)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.28)');
        g.addColorStop(1, 'rgba(0,0,0,0.48)');
        ctx.fillStyle = g;
        ctx.fillRect(0, yStart, W, H - yStart);
    }

    function drawLetters() {
        // Render letters more subtle to match PS aesthetic
        for (let i = 0; i < letters.length; i++) {
            const L = letters[i];
            ctx.save();
            ctx.globalAlpha = Math.min(0.9, L.opacity * 0.9);
            ctx.translate(L.x, L.y);
            ctx.rotate(L.angle * 0.8);
            ctx.font = `${Math.max(10, L.fontSize)}px 'Press Start 2P', monospace`;
            // color letters to match ribbons (neon gradient by X)
            const hue = Math.round(HUE_START + (HUE_END - HUE_START) * (Math.max(0, Math.min(1, L.x / W))));
            ctx.fillStyle = `hsla(${hue},95%,82%,${0.92 * Math.min(1, L.opacity)})`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // subtle shadow
            ctx.shadowColor = `hsla(${hue},95%,35%,0.45)`;
            ctx.shadowBlur = 10;
            ctx.fillText(L.char, 0, 0);
            ctx.restore();
        }
    }

    function animate(now) {
        try {
            drawBackground();
            drawRibbons(now);
            drawUnderwater(now);

            if (!lastSpawn) lastSpawn = now;
            if (now - lastSpawn > SPAWN_INTERVAL) {
                spawn();
                lastSpawn = now;
            }

            updateLetters(now);
            drawLetters();
        } catch (err) {
            console.error('Wave animation error:', err);
            ctx.fillStyle = '#2b2b2b';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'white';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Error en la animación de fondo (ver consola)', W/2, H/2);
            return;
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    lastSpawn = performance.now();
    requestAnimationFrame(animate);
}

// Auto-init on DOMContentLoaded if canvas exists
document.addEventListener('DOMContentLoaded', () => {
    try { setupCanvas(); } catch (e) { console.error('Failed to init background:', e); }
});
