document.addEventListener("DOMContentLoaded", function () {
    // Audio Setup
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let oscillator = null;
    let gainNode = audioContext.createGain();
    let isSweeping = false;
    let sweepTimeout = null;

    // UI Elements
    const frequencySlider = document.getElementById("frequencySlider");
    const frequencyInput = document.getElementById("frequencyInput");
    const volumeSlider = document.getElementById("volume");
    const playButton = document.getElementById("playButton");
    const stopButton = document.getElementById("stopButton");
    const lockCheckbox = document.getElementById("lockSlider");
    const sweepSelect = document.getElementById("sweepSelect");
    const freqDisplay = document.getElementById("freqDisplay");
    const freqUp = document.getElementById("freqUp");
    const freqDown = document.getElementById("freqDown");

    // Contatore visite
    const visitCounter = document.getElementById("visitCounter");

    // Funzione per aggiornare il contatore
    function updateVisitCounter() {
        let visits = localStorage.getItem('pageVisits') || 0;
        visits = parseInt(visits) + 1;
        localStorage.setItem('pageVisits', visits);
        visitCounter.textContent = `${visits} visite`;
    }

    // Inizializza il contatore
    updateVisitCounter();

    // Translation Elements
    const languageSelect = document.getElementById("languageSelect");
    const languageLabel = document.getElementById("languageLabel");
    const mainHeading = document.getElementById("mainHeading");
    const subtitle = document.getElementById("subtitle");
    const frequencyInputLabel = document.getElementById("frequencyInputLabel");
    const lockSliderLabel = document.getElementById("lockSliderLabel");
    const sweepLabel = document.getElementById("sweepLabel");
    const volumeLabel = document.getElementById("volumeLabel");

    // Theme Toggle Element
    const themeToggle = document.getElementById("themeToggle");

    if (!freqDisplay) {
        console.error("Errore: L'elemento freqDisplay non è stato trovato nel DOM!");
        return;
    }

    // Translation dictionary
    const translations = {
        en: {
            languageLabel: "Language:",
            mainHeading: "Frequency Player",
            subtitle: "by",
            frequencyInputLabel: "Frequency (Hz):",
            lockSliderLabel: "Lock slider during playback",
            sweepLabel: "Automatic Sweep:",
            playButton: "Play",
            stopButton: "Stop",
            volumeLabel: "Volume:"
        },
        it: {
            languageLabel: "Lingua:",
            mainHeading: "Riproduttore di Frequenze",
            subtitle: "di",
            frequencyInputLabel: "Frequenza (Hz):",
            lockSliderLabel: "Blocca lo slider durante la riproduzione",
            sweepLabel: "Sweep automatico:",
            playButton: "Riproduci",
            stopButton: "Ferma",
            volumeLabel: "Volume:"
        }
    };

    // Function to update language
    function updateLanguage(lang) {
        const t = translations[lang];
        languageLabel.textContent = t.languageLabel;
        mainHeading.textContent = t.mainHeading;
        subtitle.textContent = t.subtitle;
        frequencyInputLabel.textContent = t.frequencyInputLabel;
        lockSliderLabel.textContent = t.lockSliderLabel;
        sweepLabel.textContent = t.sweepLabel;
        playButton.textContent = t.playButton;
        stopButton.textContent = t.stopButton;
        volumeLabel.textContent = t.volumeLabel;
    }
    languageSelect.addEventListener("change", (e) => {
        updateLanguage(e.target.value);
    });
    updateLanguage(languageSelect.value);

    // Theme toggle
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-theme");
        themeToggle.textContent = document.body.classList.contains("dark-theme") ? "🌙" : "☀️";
    });

    // Function to create an oscillator
    function createOscillator(frequency) {
        oscillator = audioContext.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
    }

    // Start playback
    async function startPlayback() {
        if (oscillator || isSweeping) return;
        await audioContext.resume();
        createOscillator(parseFloat(frequencyInput.value));
        oscillator.start();
        playButton.disabled = true;
        stopButton.disabled = false;
        if (lockCheckbox.checked) frequencySlider.disabled = true;
    }

    // Stop playback
    function stopPlayback() {
        if (oscillator) {
            try {
                oscillator.stop();
            } catch (e) {
                console.error("Errore fermando l'oscillatore:", e);
            }
            oscillator.disconnect();
            oscillator = null;
        }
        stopSweep();
        playButton.disabled = false;
        stopButton.disabled = true;
        frequencySlider.disabled = false;
    }

    playButton.addEventListener("click", startPlayback);
    stopButton.addEventListener("click", stopPlayback);

    // Update frequency display and oscillator frequency
    function updateFrequency(value) {
        frequencyInput.value = value;
        frequencySlider.value = value;
        freqDisplay.textContent = `${value} Hz`;
        if (oscillator) {
            oscillator.frequency.setValueAtTime(parseFloat(value), audioContext.currentTime);
        }
    }
    frequencyInput.addEventListener("input", () => updateFrequency(frequencyInput.value));
    frequencySlider.addEventListener("input", () => updateFrequency(frequencySlider.value));
    volumeSlider.addEventListener("input", () => gainNode.gain.setValueAtTime(parseFloat(volumeSlider.value), audioContext.currentTime));

    // Spinner events for the number input
    if (freqUp && freqDown) {
        freqUp.addEventListener("click", () => {
            updateFrequency(Number(frequencyInput.value) + 1);
        });
        freqDown.addEventListener("click", () => {
            updateFrequency(Number(frequencyInput.value) - 1);
        });
    }

    // Sweep functions
    function startSweep(preset) {
        let minFreq, maxFreq;
        if (preset === "20-50") {
            minFreq = 20;
            maxFreq = 50;
        } else if (preset === "50-100") {
            minFreq = 50;
            maxFreq = 100;
        } else if (preset === "100-250") {
            minFreq = 100;
            maxFreq = 250;
        } else {
            stopSweep();
            return;
        }
        stopSweep();
        isSweeping = true;
        let currentFreq = minFreq;
        updateFrequency(currentFreq);
        createOscillator(currentFreq);
        oscillator.start();
        function sweepStep() {
            if (currentFreq < maxFreq && isSweeping) {
                currentFreq += 1;
                updateFrequency(currentFreq);
                oscillator.frequency.setValueAtTime(currentFreq, audioContext.currentTime);
                sweepTimeout = setTimeout(sweepStep, 100);
            } else {
                stopSweep();
            }
        }
        sweepStep();
    }

    function stopSweep() {
        isSweeping = false;
        if (sweepTimeout) {
            clearTimeout(sweepTimeout);
            sweepTimeout = null;
        }
        if (oscillator) {
            try {
                oscillator.stop();
            } catch (e) {
                console.error("Errore fermando l'oscillatore durante lo sweep:", e);
            }
            oscillator.disconnect();
            oscillator = null;
        }
    }

    sweepSelect.addEventListener("change", (event) => {
        stopSweep();
        if (event.target.value !== "none") {
            startSweep(event.target.value);
        }
    });
});
