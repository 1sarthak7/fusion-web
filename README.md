<div align="center">

  <a href="(https://github.com/1sarthak7/fusion-web.git)">
    <img src="https://readme-typing-svg.herokuapp.com?font=Rajdhani&weight=600&size=40&duration=3000&pause=1000&color=00FFD5&center=true&vCenter=true&width=600&lines=HOLOGRAPHIC+NEURAL+INTERFACE;RESEARCH+GRADE+AR+SYSTEM;DUAL-HAND+FUSION+ENGINE" alt="Typing SVG" />
  </a>

  <br>
  <img src="https://img.shields.io/badge/BUILD-PASSING-00FFD5?style=for-the-badge&logo=github&logoColor=000000" alt="Build Status">
  <img src="https://img.shields.io/badge/VERSION-5.0.0-FF003C?style=for-the-badge&logo=verizon&logoColor=white" alt="Version">
  <img src="https://img.shields.io/badge/LICENSE-Sarthak-ffffff?style=for-the-badge&logo=open-source-initiative&logoColor=000000" alt="License">
  <br>
  <br>
</div>

---

<div align="center">
  <h3>GPU-accelerated Augmented Reality interface running entirely in the browser.</h3>
</div>

---

## ⫸ SYSTEM ARCHITECTURE

The **Holographic Neural Interface** is a research-grade web experiment that simulates a high-fidelity sci-fi Heads-Up Display (HUD). It utilizes the MediaPipe Hands model for skeletal tracking but discards the standard rendering pipeline in favor of a custom-built, multi-pass canvas engine.

This system is designed to simulate volumetric lighting, energy instability, and physical interactions between digital filaments and biological input.

| COMPONENT | SPECIFICATION |
| :--- | :--- |
| **Core** | MediaPipe Hands (Simultaneous Dual-Hand Tracking) |
| **Renderer** | Custom HTML5 Canvas Multi-Buffer Engine |
| **Physics** | Verlet Integration with Elastic constraints |
| **VFX** | Additive Blending, Bloom Simulation, Chromatic Aberration |
| **Performance** | 60 FPS on Standard Hardware (Object Pooling Implemented) |

---

## ⫸ VISUAL CAPABILITIES

### 01. Volumetric Energy Graph
Unlike standard visualizers that draw simple lines between joints, this engine generates a **dynamic proximity graph**. Nodes connect not just to their skeletal neighbors, but to any energy point within a spatial threshold, creating a dense, living web that reacts to hand tension.

### 02. Dual-Hand Fusion Engine
The system detects complex bimanual gestures. When index fingers from opposing hands approach the **Fusion Threshold (0.15)**, the system enters `CRITICAL STATE`:
* **Beam Rendering:** A high-intensity photon beam creates a bridge between hands.
* **Core Instability:** Particle emission rates double.
* **HUD Reaction:** The interface shifts from **Cyan (Stable)** to **Crimson (Critical)**.

### 03. Particle Physics System
Sparks and energy residue are managed via a high-performance **Object Pool**, ensuring zero garbage collection pauses during intense visual sequences. Particles inherit velocity from hand movement, simulating air resistance and turbulence.

---

## ⫸ INSTALLATION & DEPLOYMENT

This project requires no build steps, bundlers, or Node.js backends. It is designed as a "Drop-in" architecture.

### Option A: Local Execution (Python)
Due to browser security policies regarding Webcam access (`getUserMedia`) and CORS, this project must run on a local server.

```bash
# 1. Clone the repository
git clone https://github.com/1sarthak7/fusion-web.git

# 2. Navigate to the directory
cd holographic-neural-interface

# 3. Start a simple HTTP server
python -m http.server 8000

# 4. Open your browser
# Visit http://localhost:8000
```
## author
** Sarthak Bhopale
