/**
 * HOLOGRAPHIC NEURAL INTERFACE // V-FINAL
 * Architecture: Multi-Pass Canvas Rendering
 * Features: Dual-Hand Fusion, Particle Pooling, Volumetric Beams
 */

// --- 1. CONFIGURATION CORE ---
const CONFIG = {
    colors: {
        primary: { r: 0, g: 255, b: 213 },     // Cyan
        warning: { r: 255, g: 0, b: 60 },      // Red/Magenta
        core:    { r: 255, g: 255, b: 255 }    // White
    },
    physics: {
        drag: 0.92,
        turbulence: 0.08,
        fusionThreshold: 0.15, // Distance between index fingers to trigger fusion
        webDensity: 0.18       // Max distance for node connections
    },
    render: {
        glowStrength: 25,
        trailPersistence: 0.18, // Lower = longer trails
        particleCount: 250
    }
};

// --- 2. STATE MANAGEMENT ---
const STATE = {
    mode: 'IDLE', // IDLE, ACTIVE, FUSION
    width: 0,
    height: 0,
    frameCount: 0,
    fusionIntensity: 0, // 0.0 to 1.0
    hands: [],
    lastTime: 0
};

// --- 3. DOM ELEMENTS ---
const videoElement = document.querySelector('.input_video');
const canvasElement = document.querySelector('.output_canvas');
const ctx = canvasElement.getContext('2d', { alpha: false }); // Optimize
const uiSystem = document.getElementById('system-state');
const uiFlux = document.getElementById('flux-metric');
const uiNodes = document.getElementById('node-count');
const uiFps = document.getElementById('fps-count');
const uiLog = document.getElementById('console-log');
const uiPanel = document.body; // Using body class for global state styling

// --- 4. PARTICLE ENGINE (Object Pooling) ---
class ParticleSystem {
    constructor(limit) {
        this.limit = limit;
        this.pool = new Float32Array(limit * 6); // x, y, vx, vy, life, type
        this.activeCount = 0;
        // Indices map: 0:x, 1:y, 2:vx, 3:vy, 4:life, 5:type
    }

    emit(x, y, type = 0, speed = 1) {
        if (this.activeCount >= this.limit) return;
        
        const i = this.activeCount * 6;
        const angle = Math.random() * Math.PI * 2;
        const v = (Math.random() * 3 + 1) * speed;

        this.pool[i] = x;
        this.pool[i+1] = y;
        this.pool[i+2] = Math.cos(angle) * v;
        this.pool[i+3] = Math.sin(angle) * v;
        this.pool[i+4] = 1.0; // Life
        this.pool[i+5] = type; // 0: Normal, 1: Fusion Spark

        this.activeCount++;
    }

    update() {
        for (let i = 0; i < this.activeCount * 6; i += 6) {
            // Physics
            this.pool[i] += this.pool[i+2];   // x += vx
            this.pool[i+1] += this.pool[i+3]; // y += vy
            
            // Turbulence
            this.pool[i+2] += (Math.random() - 0.5) * CONFIG.physics.turbulence;
            this.pool[i+3] += (Math.random() - 0.5) * CONFIG.physics.turbulence;
            
            // Drag
            this.pool[i+2] *= CONFIG.physics.drag;
            this.pool[i+3] *= CONFIG.physics.drag;
            
            // Decay
            this.pool[i+4] -= 0.02;

            // Kill check
            if (this.pool[i+4] <= 0) {
                // Swap with last active
                const last = (this.activeCount - 1) * 6;
                if (i !== last) {
                    this.pool[i] = this.pool[last];
                    this.pool[i+1] = this.pool[last+1];
                    this.pool[i+2] = this.pool[last+2];
                    this.pool[i+3] = this.pool[last+3];
                    this.pool[i+4] = this.pool[last+4];
                    this.pool[i+5] = this.pool[last+5];
                }
                this.activeCount--;
                i -= 6; // Re-process this index
            }
        }
    }

    draw(ctx) {
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < this.activeCount * 6; i += 6) {
            const life = this.pool[i+4];
            const type = this.pool[i+5];
            
            ctx.beginPath();
            ctx.arc(this.pool[i], this.pool[i+1], type === 1 ? 3 * life : 1.5 * life, 0, Math.PI * 2);
            
            if (type === 1) { // Fusion Spark
                ctx.fillStyle = `rgba(255, 0, 60, ${life})`;
            } else { // Standard Spark
                ctx.fillStyle = `rgba(0, 255, 213, ${life * 0.8})`;
            }
            ctx.fill();
        }
    }
}

const particles = new ParticleSystem(CONFIG.render.particleCount);

// --- 5. LOGIC ENGINE ---
function processGestures(results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        STATE.mode = 'IDLE';
        STATE.hands = [];
        STATE.fusionIntensity *= 0.9;
        return;
    }

    // Map landmarks to screen space
    const currentHands = results.multiHandLandmarks.map(landmarks => {
        return landmarks.map(l => ({
            x: l.x * STATE.width,
            y: l.y * STATE.height,
            z: l.z // Depth
        }));
    });

    STATE.hands = currentHands;

    // Dual Hand Logic
    if (currentHands.length === 2) {
        // Get Index Fingertips
        const h1 = currentHands[0][8];
        const h2 = currentHands[1][8];
        
        // Calculate Distance (Normalized)
        const dx = (h1.x - h2.x) / STATE.width;
        const dy = (h1.y - h2.y) / STATE.height;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < CONFIG.physics.fusionThreshold) {
            STATE.mode = 'FUSION';
            STATE.fusionIntensity = Math.min(STATE.fusionIntensity + 0.05, 1.0);
            
            // Spawn Fusion Particles at midpoint
            const midX = (h1.x + h2.x) / 2;
            const midY = (h1.y + h2.y) / 2;
            particles.emit(midX, midY, 1, 3);
            particles.emit(midX, midY, 1, 3);
        } else {
            STATE.mode = 'ACTIVE';
            STATE.fusionIntensity *= 0.9;
        }
    } else {
        STATE.mode = 'ACTIVE';
        STATE.fusionIntensity *= 0.9;
    }

    updateUI();
}

function updateUI() {
    // Styling Body based on Mode
    if (STATE.mode === 'FUSION') {
        uiPanel.className = 'state-fusion';
        uiSystem.innerText = 'CRITICAL FUSION';
    } else if (STATE.mode === 'ACTIVE') {
        uiPanel.className = 'state-active';
        uiSystem.innerText = 'SYSTEM ENGAGED';
    } else {
        uiPanel.className = '';
        uiSystem.innerText = 'SCANNING...';
    }

    uiNodes.innerText = STATE.hands.length * 21;
    uiFlux.innerText = (STATE.fusionIntensity * 100).toFixed(2) + ' TEU';
}

// --- 6. RENDER ENGINE (The Visual Core) ---
function drawFrame() {
    const w = STATE.width;
    const h = STATE.height;
    
    // 1. Trail Effect (Fade previous frame)
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgba(0, 0, 0, ${CONFIG.render.trailPersistence})`;
    ctx.fillRect(0, 0, w, h);

    // 2. Set Context for Additive Light
    ctx.globalCompositeOperation = 'lighter';

    if (STATE.hands.length > 0) {
        drawVolumetricWeb();
        
        // Draw Nodes & Coordinates
        STATE.hands.forEach(hand => {
            hand.forEach((p, index) => {
                // Coordinate Text (Tech HUD Style)
                if (index % 4 === 0) { // Only specific keypoints
                    ctx.fillStyle = `rgba(255, 255, 255, 0.4)`;
                    ctx.font = '10px "Share Tech Mono"';
                    ctx.fillText(`x:${(p.x/w).toFixed(2)} y:${(p.y/h).toFixed(2)}`, p.x + 10, p.y);
                }
            });
        });

        // 3. Fusion Beam Render
        if (STATE.fusionIntensity > 0.1 && STATE.hands.length === 2) {
            const p1 = STATE.hands[0][8];
            const p2 = STATE.hands[1][8];
            drawFusionBeam(p1, p2);
        }
    }

    // 4. Render Particles
    particles.update();
    particles.draw(ctx);
}

function drawVolumetricWeb() {
    const allPoints = STATE.hands.flat();
    const color = STATE.mode === 'FUSION' ? CONFIG.colors.warning : CONFIG.colors.primary;
    const maxDist = CONFIG.physics.webDensity * STATE.width;
    const time = performance.now() * 0.002;

    ctx.lineCap = 'round';

    // Optimization: Spatial Hashing or simplified N^2 for low N (42 points is fine)
    for (let i = 0; i < allPoints.length; i++) {
        const p1 = allPoints[i];
        
        // Draw Node Point
        const depth = Math.max(0, 1 + p1.z); // Simple depth scale
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 2 * depth, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * depth})`;
        ctx.fill();

        // Emit trail particles from fingertips
        if ([4, 8, 12, 16, 20].includes(i % 21) && Math.random() > 0.8) {
            particles.emit(p1.x, p1.y, 0, 0.5);
        }

        // Connections
        for (let j = i + 1; j < allPoints.length; j++) {
            const p2 = allPoints[j];
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

            if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * STATE.fusionIntensity > 0 ? 1 : 0.4;
                
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                
                // Jitter effect for "Electric" feel
                if (STATE.fusionIntensity > 0.5) {
                    const midX = (p1.x + p2.x) / 2 + (Math.random() - 0.5) * 10;
                    const midY = (p1.y + p2.y) / 2 + (Math.random() - 0.5) * 10;
                    ctx.lineTo(midX, midY);
                }
                
                ctx.lineTo(p2.x, p2.y);
                
                // Dynamic Color
                ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
                ctx.lineWidth = 1 * depth;
                
                // Glow Pass (Simulated via Shadow)
                if (dist < maxDist * 0.5) {
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, 1)`;
                } else {
                    ctx.shadowBlur = 0;
                }
                
                ctx.stroke();
                ctx.shadowBlur = 0; // Reset
            }
        }
    }
}

function drawFusionBeam(p1, p2) {
    const time = performance.now() * 0.01;
    const intensity = STATE.fusionIntensity;
    const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
    const steps = 15;

    ctx.save();
    
    // 1. Outer Glow (Volumetric)
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = p1.x + (p2.x - p1.x) * t;
        const y = p1.y + (p2.y - p1.y) * t;
        
        // Sine Wave Distortion
        const perpX = -(p2.y - p1.y) / dist;
        const perpY = (p2.x - p1.x) / dist;
        const wave = Math.sin(t * 10 + time) * 15 * intensity;
        
        ctx.lineTo(x + perpX * wave, y + perpY * wave);
    }
    
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = `rgba(255, 0, 60, ${0.4 * intensity})`;
    ctx.lineWidth = 30 * intensity;
    ctx.filter = 'blur(8px)';
    ctx.stroke();
    ctx.filter = 'none';

    // 2. Inner Core (Bright)
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4 + Math.sin(time * 2) * 2;
    ctx.shadowColor = '#FF003C';
    ctx.shadowBlur = 20 * intensity;
    ctx.stroke();

    ctx.restore();
}

// --- 7. MAIN LOOP ---
function onResults(results) {
    // Calculations
    processGestures(results);
    
    // FPS Calc
    const now = performance.now();
    const dt = now - STATE.lastTime;
    STATE.lastTime = now;
    if (STATE.frameCount % 10 === 0) {
        uiFps.innerText = Math.round(1000 / dt);
    }
    STATE.frameCount++;

    // Drawing
    drawFrame();
}

// --- 8. INITIALIZATION ---
function init() {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    STATE.width = canvasElement.width;
    STATE.height = canvasElement.height;

    const hands = new Hands({locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
    }});

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await hands.send({image: videoElement});
        },
        width: 1280,
        height: 720
    });

    camera.start();
    
    uiLog.innerText += "\n> NEURAL LINK: ESTABLISHED";
}

window.addEventListener('resize', () => {
    canvasElement.width = window.innerWidth;
    canvasElement.height = window.innerHeight;
    STATE.width = canvasElement.width;
    STATE.height = canvasElement.height;
});

init();