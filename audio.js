import { Visualizer } from './visualizer.js';

// --- DOM Elements ---
const startStopButton = document.getElementById('startStopButton');
const baseFreqSlider = document.getElementById('baseFreqSlider');
const binauralFreqSlider = document.getElementById('binauralFreqSlider');
const volumeSlider = document.getElementById('volumeSlider');
const baseFreqValueSpan = document.getElementById('baseFreqValue');
const binauralFreqValueSpan = document.getElementById('binauralFreqValue');
const volumeValueSpan = document.getElementById('volumeValue');
const statusText = document.getElementById('status-text');
const calibrationStatusDiv = document.getElementById('calibration-status');
const calibrationProgress = document.getElementById('calibration-progress');
const calibrationHint = document.getElementById('calibration-hint');

// --- App State ---
let appState = 'idle'; // idle, calibrating, calibrated, running
let audioEngine = null;
let visualizer = null;
let targetBaseFreq = 0;
let targetBinauralDiff = 0;
let calibrationCheckInterval = null;

const startSound = new Audio('start_sound.mp3');
const stopSound = new Audio('stop_sound.mp3');

// --- Functions ---
function updateUI() {
    baseFreqValueSpan.textContent = baseFreqSlider.value;
    binauralFreqValueSpan.textContent = binauralFreqSlider.value;
    volumeValueSpan.textContent = volumeSlider.value;

    switch (appState) {
        case 'idle':
            startStopButton.textContent = 'Iniciar Calibración';
            startStopButton.className = 'btn btn-primary btn-lg rounded-pill px-5 py-2';
            statusText.textContent = 'EN ESPERA';
            statusText.style.color = 'rgba(255, 255, 255, 0.5)';
            calibrationStatusDiv.classList.add('d-none');
            setSlidersDisabled(false);
            break;
        case 'calibrating':
            startStopButton.textContent = 'Cancelar Calibración';
            startStopButton.className = 'btn btn-warning btn-lg rounded-pill px-5 py-2';
            statusText.textContent = 'CALIBRANDO';
            statusText.style.color = 'rgba(255, 193, 7, 0.8)';
            calibrationStatusDiv.classList.remove('d-none');
            setSlidersDisabled(false);
            break;
        case 'calibrated':
            startStopButton.textContent = 'Iniciar Sesión';
            startStopButton.className = 'btn btn-success btn-lg rounded-pill px-5 py-2';
            statusText.textContent = 'CALIBRADO';
            statusText.style.color = 'rgba(25, 135, 84, 0.8)';
            calibrationHint.textContent = '¡Sincronización completa!';
            calibrationProgress.classList.add('bg-success');
            calibrationProgress.classList.remove('bg-info');
            setSlidersDisabled(true);
            break;
        case 'running':
            startStopButton.textContent = 'Detener Sesión';
            startStopButton.className = 'btn btn-danger btn-lg rounded-pill px-5 py-2';
            statusText.textContent = 'SESIÓN ACTIVA';
            statusText.style.color = 'rgba(88, 166, 255, 0.8)';
            calibrationStatusDiv.classList.add('d-none');
            setSlidersDisabled(true);
            break;
    }
}

function getFrequencies() {
    const baseFreq = parseFloat(baseFreqSlider.value);
    const binauralDiff = parseFloat(binauralFreqSlider.value);
    return {
        left: baseFreq,
        right: baseFreq + binauralDiff
    };
}

function setSlidersDisabled(disabled) {
    baseFreqSlider.disabled = disabled;
    binauralFreqSlider.disabled = disabled;
}

function startCalibration() {
    appState = 'calibrating';
    targetBaseFreq = Math.floor(Math.random() * (80 - 30 + 1) + 30); // Random target between 30-80 Hz
    targetBinauralDiff = Math.floor(Math.random() * (15 - 3 + 1) + 3); // Random target between 3-15 Hz
    
    console.log(`Target: Base=${targetBaseFreq}, Diff=${targetBinauralDiff}`);

    if (!audioEngine) {
        audioEngine = new AudioEngine();
    }
    audioEngine.start();
    handleSliderChange(); // Set initial freq/vol

    if (!visualizer) {
        visualizer = new Visualizer('canvas-container');
    }
    visualizer.start();
    
    calibrationCheckInterval = setInterval(checkCalibration, 100);
    updateUI();
}

function checkCalibration() {
    const baseError = Math.abs(baseFreqSlider.value - targetBaseFreq);
    const diffError = Math.abs(binauralFreqSlider.value - targetBinauralDiff);
    
    // Max error can be ~70 for base and ~19 for diff. Let's normalize.
    const normBaseError = baseError / 70;
    const normDiffError = diffError / 19;
    const totalError = (normBaseError + normDiffError) / 2; // Average error
    
    const progress = Math.max(0, 100 * (1 - totalError * 2)); // Amplify error effect
    calibrationProgress.style.width = `${progress}%`;
    visualizer.updateHarmony(progress / 100);

    if (progress > 95) {
        calibrationHint.textContent = 'Resonancia encontrada. Mantenga...';
        if (progress > 99) {
            appState = 'calibrated';
            clearInterval(calibrationCheckInterval);
            stopSound.play(); // Use a sound to indicate success
            updateUI();
        }
    } else if (progress > 75) {
        calibrationHint.textContent = 'Casi sincronizado...';
    } else if (progress > 50) {
        calibrationHint.textContent = 'Señal moderada...';
    } else {
        calibrationHint.textContent = 'Buscando resonancia...';
    }
}

function stopAll() {
    appState = 'idle';
    if (calibrationCheckInterval) clearInterval(calibrationCheckInterval);

    if (audioEngine) audioEngine.stop();
    if (visualizer) visualizer.stop();

    stopSound.play();
    calibrationProgress.style.width = `0%`;
    calibrationProgress.classList.remove('bg-success');
    calibrationProgress.classList.add('bg-info');
    updateUI();
}

function startSession() {
    appState = 'running';
    startSound.play();
    audioEngine.start(); // Resume audio context
    visualizer.start();
    updateUI();
}

// --- Event Listeners ---
startStopButton.addEventListener('click', () => {
    switch (appState) {
        case 'idle':
            startCalibration();
            break;
        case 'calibrating':
            stopAll();
            break;
        case 'calibrated':
            startSession();
            break;
        case 'running':
            stopAll();
            break;
    }
});

function handleSliderChange() {
    if (appState === 'calibrating' || appState === 'running') {
        if (audioEngine) {
            const freqs = getFrequencies();
            audioEngine.setFrequencies(freqs.left, freqs.right);
            const volume = volumeSlider.value / 100;
            audioEngine.setVolume(volume);
        }
    }
    updateUI(); // Keep text values updated
}

baseFreqSlider.addEventListener('input', handleSliderChange);
binauralFreqSlider.addEventListener('input', handleSliderChange);
volumeSlider.addEventListener('input', handleSliderChange);

// Initialize
updateUI();
visualizer = new Visualizer('canvas-container');


export class AudioEngine {
    constructor() {
        this.audioContext = null;
        this.oscillatorLeft = null;
        this.oscillatorRight = null;
        this.gainNode = null;
        this.pannerNode = null;
    }

    _init() {
        if (this.audioContext) return;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

        this.oscillatorLeft = this.audioContext.createOscillator();
        this.oscillatorRight = this.audioContext.createOscillator();
        
        this.gainNode = this.audioContext.createGain();
        
        const merger = this.audioContext.createChannelMerger(2);

        this.oscillatorLeft.connect(merger, 0, 0);
        this.oscillatorRight.connect(merger, 0, 1);
        
        merger.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);

        this.oscillatorLeft.type = 'sine';
        this.oscillatorRight.type = 'sine';
    }

    start() {
        if (!this.audioContext) {
            this._init();
            this.oscillatorLeft.start();
            this.oscillatorRight.start();
        }
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    stop() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend();
        }
    }

    setFrequencies(freqLeft, freqRight) {
        if (!this.audioContext) return;
        const now = this.audioContext.currentTime;
        this.oscillatorLeft.frequency.setValueAtTime(freqLeft, now);
        this.oscillatorRight.frequency.setValueAtTime(freqRight, now);
    }

    setVolume(volume) {
        if (!this.audioContext) return;
        // Use a logarithmic scale for perceived loudness
        const gainValue = Math.pow(volume, 2);
        this.gainNode.gain.setValueAtTime(gainValue, this.audioContext.currentTime);
    }
}