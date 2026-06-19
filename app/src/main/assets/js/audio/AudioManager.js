class AudioManager {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.ambientGain = null;
        this.combatGain = null;
        this.isCombat = false;
        this.nextNoteTime = 0;
        this.stepCounter = 0;
        this.timerID = null;
        
        // Simple tense bassline sequence (MIDI notes)
        this.bassSequence = [36, 0, 36, 0, 39, 0, 38, 0, 36, 36, 0, 36, 43, 0, 41, 0];
        // Drum pattern (0 = kick, 1 = hihat)
        this.drumSequence = [0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1];
        
        this.reverbNode = null;
        this.reverbGain = null;
        this.ambientOscs = [];
        this.ambientSynthNodes = [];
        this.heartbeatInterval = null;
    }

    init() {
        if (!this.ctx) {
            try {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) {
                    this.ctx = new AudioContext();
                    
                    // Create main Master Gain control node
                    this.masterGain = this.ctx.createGain();
                    this.updateMasterVolume();
                    this.masterGain.connect(this.ctx.destination);
                    
                    this.startAmbient();
                    
                    this.combatGain = this.ctx.createGain();
                    this.combatGain.gain.value = 0; // Silent initially
                    this.combatGain.connect(this.masterGain);
                    
                    this.initReverb();
                    this.initHeartbeatLoop();
                    
                    this.nextNoteTime = this.ctx.currentTime + 0.1;
                    this.scheduler();
                    console.log("Offline Audio Engine initiated and bound to master slider");
                }
            } catch (e) {
                console.error("AudioContext initialization failed", e);
                this.ctx = null;
            }
        }
        
        if (this.ctx) {
            this.updateMasterVolume();
            if (this.ctx.state === 'suspended') {
                try {
                    this.ctx.resume().then(() => {
                        console.log("AudioContext successfully resumed.");
                    }).catch(e => console.warn("Context resume failed", e));
                } catch (err) {
                    console.warn("Context resume execution failed", err);
                }
            }
        }
    }

    updateMasterVolume() {
        if (this.ctx && this.masterGain) {
            try {
                const volume = (window.globalSettings && window.globalSettings.volume !== undefined) ? parseFloat(window.globalSettings.volume) : 1.0;
                this.masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
                console.log("Audio master volume updated in real-time:", volume);
            } catch (err) {
                console.warn("Failed to set master volume", err);
            }
        }
    }

    speak(text) {
        if (!window.speechSynthesis) return;
        // Check if SFX / Voice is disabled
        if (window.globalSettings && window.globalSettings.vfxEnabled === false) return;
        
        try {
            window.speechSynthesis.cancel(); // Stop playing current spoken task
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ru-RU';
            utterance.rate = 1.05; // military robotic quick tone
            utterance.pitch = 0.8; // deep operator artificial intelligence sound
            utterance.volume = (window.globalSettings && window.globalSettings.volume !== undefined) ? parseFloat(window.globalSettings.volume) : 1.0;
            
            const voices = window.speechSynthesis.getVoices();
            const ruVoice = voices.find(v => v.lang.includes('ru') || v.lang.includes('RU'));
            if (ruVoice) {
                utterance.voice = ruVoice;
            }
            
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn("SpeechSynthesis output failed", e);
        }
    }

    initReverb() {
        if (!this.ctx) return;
        try {
            if (this.reverbNode) {
                this.reverbNode.disconnect();
            }
            if (this.reverbGain) {
                this.reverbGain.disconnect();
            }
            
            this.reverbGain = this.ctx.createGain();
            this.reverbGain.gain.value = 0.28; // Dry/Wet mix balancing
            this.reverbGain.connect(this.masterGain || this.ctx.destination);
            
            this.reverbNode = this.createReverbNode();
            if (this.reverbNode) {
                this.reverbNode.connect(this.reverbGain);
            }
        } catch (e) {
            console.error("Biometric Convolver audio error", e);
        }
    }

    createReverbNode() {
        if (!this.ctx) return null;
        try {
            const rate = this.ctx.sampleRate;
            const length = rate * 2.0; // 2 seconds of acoustics decay mapping
            const impulse = this.ctx.createBuffer(2, length, rate);
            const left = impulse.getChannelData(0);
            const right = impulse.getChannelData(1);
            
            let decay = 1.5; // Default acoustics reverberation delay
            if (window.appState) {
                const mIdx = window.appState.currentMissionIndex;
                if (mIdx === 0) decay = 1.1; // Port
                else if (mIdx === 1) decay = 0.35; // Sand Storm
                else if (mIdx === 2) decay = 2.4; // Skyscraper
            }
            
            for (let i = 0; i < length; i++) {
                const k = i / rate;
                const percent = k / decay;
                if (percent < 1.0) {
                    const envelope = Math.pow(1.0 - percent, 2.5);
                    left[i] = (Math.random() * 2 - 1) * envelope;
                    right[i] = (Math.random() * 2 - 1) * envelope;
                } else {
                    left[i] = 0;
                    right[i] = 0;
                }
            }
            
            const convolver = this.ctx.createConvolver();
            convolver.buffer = impulse;
            return convolver;
        } catch (err) {
            console.warn("Failed to create convolve impulse", err);
            return null;
        }
    }

    initHeartbeatLoop() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        
        this.heartbeatInterval = setInterval(() => {
            if (!this.ctx) return;
            if (window.game && window.game.selectedEntity) {
                const op = window.game.selectedEntity;
                if (op.hp > 0 && op.hp < op.maxHp * 0.35) {
                    const isCritical = op.hp < op.maxHp * 0.18;
                    this.playHeartbeat(this.ctx.currentTime, isCritical);
                }
            }
        }, 1100);
    }

    playHeartbeat(time, isCritical) {
        if (!this.ctx) return;
        const now = time || this.ctx.currentTime;
        const intensity = isCritical ? 1.6 : 1.0;
        
        // Lub sub-bass heartbeat pulse
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.frequency.setValueAtTime(60, now);
        osc1.frequency.exponentialRampToValueAtTime(0.01, now + 0.14);
        gain1.gain.setValueAtTime(0.38 * intensity, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
        osc1.connect(gain1);
        gain1.connect(this.masterGain || this.ctx.destination);
        
        try {
            osc1.start(now);
            osc1.stop(now + 0.15);
        } catch(e) {}
        
        // Dub lower heartbeat pulse
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        const delay = isCritical ? 0.15 : 0.22;
        osc2.frequency.setValueAtTime(48, now + delay);
        osc2.frequency.exponentialRampToValueAtTime(0.01, now + delay + 0.14);
        gain2.gain.setValueAtTime(0.26 * intensity, now + delay);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.14);
        osc2.connect(gain2);
        gain2.connect(this.masterGain || this.ctx.destination);
        
        try {
            osc2.start(now + delay);
            osc2.stop(now + delay + 0.15);
        } catch(e) {}
    }

    setCombatState(inCombat) {
        if (!this.ctx) return;
        this.isCombat = inCombat;
        const now = this.ctx.currentTime;
        if (inCombat) {
            // Fade in combat track, fade out ambient drone
            this.combatGain.gain.linearRampToValueAtTime(0.38, now + 2.0);
            this.ambientGain.gain.linearRampToValueAtTime(0.02, now + 2.0);
        } else {
            // Fade out combat track, fade in ambient drone
            this.combatGain.gain.linearRampToValueAtTime(0.0, now + 5.0);
            this.ambientGain.gain.linearRampToValueAtTime(0.1, now + 5.0);
        }
    }

    scheduler() {
        if (!this.ctx) return;
        try {
            while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
                this.playCombatStep(this.nextNoteTime);
                this.nextStep();
            }
        } catch (e) {
            console.warn("Scheduler cycle error", e);
        }
        this.timerID = setTimeout(() => this.scheduler(), 25);
    }

    nextStep() {
        const tempo = 120; // BPM
        const secondsPerBeat = 60.0 / tempo;
        const stepDuration = secondsPerBeat / 4; // 16th notes
        this.nextNoteTime += stepDuration;
        this.stepCounter = (this.stepCounter + 1) % 16;
    }

    playCombatStep(time) {
        if (!this.isCombat && this.combatGain && this.combatGain.gain.value <= 0.01) return;
        
        const note = this.bassSequence[this.stepCounter];
        const drum = this.drumSequence[this.stepCounter];
        
        // Synth bass
        if (note > 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.combatGain);
            
            osc.type = 'sawtooth';
            // MIDI to Frequency conversion
            osc.frequency.value = 440 * Math.pow(2, (note - 69) / 12);
            
            gain.gain.setValueAtTime(0.3, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15);
            
            // Simple lowpass filter sweep per note (tactical bass sound)
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, time);
            filter.frequency.exponentialRampToValueAtTime(100, time + 0.1);
            filter.Q.value = 5;
            
            osc.disconnect();
            osc.connect(filter);
            filter.connect(gain);
            
            try {
                osc.start(time);
                osc.stop(time + 0.2);
            } catch(e) {}
        }
        
        // Drum
        if (drum === 0) { // Kick
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.combatGain);
            
            osc.frequency.setValueAtTime(150, time);
            osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.1);
            gain.gain.setValueAtTime(0.6, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
            
            try {
                osc.start(time);
                osc.stop(time + 0.1);
            } catch(e) {}
        } else if (drum === 1) { // Hihat
            const bufSize = this.ctx.sampleRate * 0.05; 
            const buffer = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = this.ctx.createBufferSource();
            noise.buffer = buffer;
            
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.value = 7000;
            
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.1, time);
            gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.combatGain);
            
            try {
                noise.start(time);
            } catch(e) {}
        }
    }

    startAmbient() {
        if (!this.ctx) return;
        
        // Very low sub-bass background drone
        const osc = this.ctx.createOscillator();
        this.ambientGain = this.ctx.createGain();
        osc.connect(this.ambientGain);
        this.ambientGain.connect(this.masterGain || this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 45; // Subwoofer rumble
        this.ambientGain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        
        // LF0 modulator for subtle breathing movement in background
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(this.ambientGain.gain);
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // Ultra-slow LFO swing
        lfoGain.gain.value = 0.03;
        
        try {
            osc.start();
            lfo.start();
        } catch(e) {
            console.warn("Error starting base ambient drone oscillators", e);
        }
        
        this.ambientOscs = [];
        this.ambientSynthNodes = [];

        // Procedural sci-fi tension ambient synthesizer pad (perfectly audible but non-intrusive)
        const notes = [110, 165, 220]; // A2 (110Hz), E3 (165Hz), A3 (220Hz)
        try {
            const ctx = this.ctx;
            notes.forEach((freq, idx) => {
                const padOsc = ctx.createOscillator();
                const padGain = ctx.createGain();
                const padLfo = ctx.createOscillator();
                const padLfoGain = ctx.createGain();
                
                padOsc.type = 'triangle';
                padOsc.frequency.setValueAtTime(freq, ctx.currentTime);
                padOsc.detune.setValueAtTime((Math.random() * 10) - 5, ctx.currentTime);
                
                const padFilter = ctx.createBiquadFilter();
                padFilter.type = 'lowpass';
                padFilter.frequency.setValueAtTime(400 + idx * 70, ctx.currentTime);
                padFilter.Q.value = 2.5;
                
                padLfo.frequency.setValueAtTime(0.05 + idx * 0.02, ctx.currentTime);
                padLfoGain.gain.setValueAtTime(100, ctx.currentTime);
                
                padLfo.connect(padLfoGain);
                padLfoGain.connect(padFilter.frequency);
                
                padOsc.connect(padFilter);
                padFilter.connect(padGain);
                padGain.connect(this.ambientGain);
                
                // Slowly swell the master volume up
                padGain.gain.setValueAtTime(0, ctx.currentTime);
                padGain.gain.linearRampToValueAtTime(0.035 / notes.length, ctx.currentTime + 3.0);
                
                padOsc.start();
                padLfo.start();
                
                this.ambientSynthNodes.push(padOsc, padLfo, padGain, padFilter);
            });
        } catch (padErr) {
            console.error("Procedural pad synthesizer generation failed", padErr);
        }
    }

    setMissionAmbient(missionId) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        
        // Clean environment-specific audio nodes
        if (this.ambientOscs) {
            this.ambientOscs.forEach(o => { try { o.stop(); o.disconnect(); } catch(e){} });
        }
        this.ambientOscs = [];
        
        const now = ctx.currentTime;
        
        // Dynamic reverb update based on map
        this.initReverb();
        
        try {
            if (missionId === 1) { // Baltic Port - Ocean Wave rolls & Rain drops
                const pSize = ctx.sampleRate * 2.0;
                const pBuffer = ctx.createBuffer(1, pSize, ctx.sampleRate);
                const pData = pBuffer.getChannelData(0);
                for (let i = 0; i < pSize; i++) pData[i] = Math.random() * 2 - 1;
                
                const pNode = ctx.createBufferSource();
                pNode.buffer = pBuffer;
                pNode.loop = true;
                
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(150, now);
                
                const modOsc = ctx.createOscillator();
                modOsc.type = 'sine';
                modOsc.frequency.value = 0.15;
                const modGain = ctx.createGain();
                modGain.gain.value = 80;
                
                pNode.connect(filter);
                modOsc.connect(modGain);
                modGain.connect(filter.frequency);
                
                const gNode = ctx.createGain();
                gNode.gain.setValueAtTime(0.04, now);
                filter.connect(gNode);
                gNode.connect(this.masterGain || ctx.destination);
                
                pNode.start(now);
                modOsc.start(now);
                
                this.ambientOscs.push(pNode, modOsc, gNode);
                
            } else if (missionId === 2) { // Sand Storm - Whistling heavy sandstorm wind
                const windSize = ctx.sampleRate * 1.5;
                const windBuffer = ctx.createBuffer(1, windSize, ctx.sampleRate);
                const windData = windBuffer.getChannelData(0);
                for (let i = 0; i < windSize; i++) windData[i] = Math.random() * 2 - 1;
                
                const windNode = ctx.createBufferSource();
                windNode.buffer = windBuffer;
                windNode.loop = true;
                
                const windFilter = ctx.createBiquadFilter();
                windFilter.type = 'bandpass';
                windFilter.Q.value = 15.0; // whistling resonance
                windFilter.frequency.setValueAtTime(320, now);
                
                const sweepOsc = ctx.createOscillator();
                sweepOsc.type = 'sine';
                sweepOsc.frequency.value = 0.08;
                const sweepGain = ctx.createGain();
                sweepGain.gain.value = 160;
                
                windNode.connect(windFilter);
                sweepOsc.connect(sweepGain);
                sweepGain.connect(windFilter.frequency);
                
                const windGainNode = ctx.createGain();
                windGainNode.gain.setValueAtTime(0.032, now);
                windFilter.connect(windGainNode);
                windGainNode.connect(this.masterGain || ctx.destination);
                
                windNode.start(now);
                sweepOsc.start(now);
                
                this.ambientOscs.push(windNode, sweepOsc, windGainNode);
                
            } else if (missionId === 3 || missionId === 4) { // Mainframe Server Hum & static sparks
                const osc50 = ctx.createOscillator();
                osc50.type = 'sine';
                osc50.frequency.value = 50; // Mains electric noise hum
                
                const osc120 = ctx.createOscillator();
                osc120.type = 'sine';
                osc120.frequency.value = 120; // Server cooling fans
                
                const humGain = ctx.createGain();
                humGain.gain.setValueAtTime(0.015, now);
                
                osc50.connect(humGain);
                osc120.connect(humGain);
                humGain.connect(this.masterGain || ctx.destination);
                
                osc50.start(now);
                osc120.start(now);
                
                this.ambientOscs.push(osc50, osc120, humGain);
            }
        } catch (ambientErr) {
            console.error("Failed to generate dynamic environmental ambient audio", ambientErr);
        }
    }

    playSound(type, sourceX, sourceY) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        
        let pitchMod = 1.0;
        let volumeMod = 1.0;
        if (['shoot', 'silenced', 'step', 'hit', 'die'].includes(type) && Math.random) {
            pitchMod = 0.92 + Math.random() * 0.16;
            volumeMod = 0.85 + Math.random() * 0.3;
        }

        // Acoustic Obstacle low-pass filter (Audio Occlusion)
        let occludedFilter = null;
        if (sourceX !== undefined && sourceY !== undefined && window.game) {
            const listener = window.game.selectedEntity;
            if (listener) {
                const hasLoS = window.game.checkLoS(listener.x, listener.y, sourceX, sourceY);
                if (!hasLoS) {
                    occludedFilter = ctx.createBiquadFilter();
                    occludedFilter.type = 'lowpass';
                    occludedFilter.frequency.setValueAtTime(380, now); // absorb acoustics
                    occludedFilter.Q.value = 1.2;
                }
            }
        }

        const osc = ctx.createOscillator();
        const mainGain = ctx.createGain();
        
        // Setup direct dry output and convolved reverb wet output
        const dryGain = ctx.createGain();
        dryGain.gain.setValueAtTime(0.8, now);
        
        const wetGain = ctx.createGain();
        wetGain.gain.setValueAtTime(0.25, now);

        if (occludedFilter) {
            osc.connect(occludedFilter);
            occludedFilter.connect(mainGain);
        } else {
            osc.connect(mainGain);
        }
        
        mainGain.connect(dryGain);
        dryGain.connect(this.masterGain || ctx.destination);
        
        if (this.reverbNode) {
            mainGain.connect(wetGain);
            wetGain.connect(this.reverbNode);
        }

        try {
            if (type === 'shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(150 * pitchMod, now);
                osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
                mainGain.gain.setValueAtTime(0.35 * volumeMod, now);
                mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'silenced') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300 * pitchMod, now);
                osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.05);
                mainGain.gain.setValueAtTime(0.18 * volumeMod, now);
                mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'step') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(55 * pitchMod, now);
                osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.05);
                mainGain.gain.setValueAtTime(0.10 * volumeMod, now);
                mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'hit') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(45 * pitchMod, now);
                osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.2);
                mainGain.gain.setValueAtTime(0.45 * volumeMod, now);
                mainGain.gain.linearRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'die') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(80 * pitchMod, now);
                osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
                mainGain.gain.setValueAtTime(0.55 * volumeMod, now);
                mainGain.gain.linearRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'upgrade') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);
                mainGain.gain.setValueAtTime(0.25, now);
                mainGain.gain.linearRampToValueAtTime(0.01, now + 0.35);
                
                const osc2 = ctx.createOscillator();
                const gain2 = ctx.createGain();
                osc2.connect(gain2);
                gain2.connect(this.masterGain || ctx.destination);
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(80, now);
                gain2.gain.setValueAtTime(0.28, now);
                gain2.gain.linearRampToValueAtTime(0.01, now + 0.12);
                osc2.start(now);
                osc2.stop(now + 0.12);
                
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'radio_beep') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.setValueAtTime(1100, now + 0.04);
                mainGain.gain.setValueAtTime(0.12, now);
                mainGain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
                
                const bufSize = ctx.sampleRate * 0.14; 
                const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.035;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const noiseGain = ctx.createGain();
                noiseGain.gain.setValueAtTime(1.0, now);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
                noise.connect(noiseGain);
                noiseGain.connect(this.masterGain || ctx.destination);
                noise.start(now);
            }
        } catch (soundErr) {
            console.error("Oscillator synthesizer trigger failure", soundErr);
        }
    }

    stopAll() {
        try {
            if (this.heartbeatInterval) {
                clearInterval(this.heartbeatInterval);
                this.heartbeatInterval = null;
            }
            if (this.timerID) {
                clearTimeout(this.timerID);
                this.timerID = null;
            }
            if (this.ambientOscs) {
                this.ambientOscs.forEach(o => { try { o.stop(); o.disconnect(); } catch(e){} });
                this.ambientOscs = [];
            }
            if (this.ambientSynthNodes) {
                this.ambientSynthNodes.forEach(o => { try { o.stop(); o.disconnect(); } catch(e){} });
                this.ambientSynthNodes = [];
            }
            if (this.ctx) {
                this.ctx.close().catch(e => console.warn("AudioContext closing failed", e));
                this.ctx = null;
            }
        } catch(e) {
            console.warn("stopAll failed gracefully", e);
        }
    }
}
