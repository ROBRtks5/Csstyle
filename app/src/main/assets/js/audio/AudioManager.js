class AudioManager {
    constructor() {
        this.ctx = null;
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
        this.heartbeatInterval = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
                this.startAmbient();
                
                this.combatGain = this.ctx.createGain();
                this.combatGain.gain.value = 0; // Silent initially
                this.combatGain.connect(this.ctx.destination);
                
                this.initReverb();
                this.initHeartbeatLoop();
                
                this.nextNoteTime = this.ctx.currentTime + 0.1;
                this.scheduler();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(e => console.warn("Context resume failed due to interaction constraints", e));
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
            this.reverbGain.connect(this.ctx.destination);
            
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
        const rate = this.ctx.sampleRate;
        const length = rate * 2.0; // 2 seconds of acoustics decay mapping
        const impulse = this.ctx.createBuffer(2, length, rate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);
        
        let decay = 1.5; // Default acoustics reverberation delay
        if (window.appState) {
            const mIdx = window.appState.currentMissionIndex;
            if (mIdx === 0) decay = 1.1; // Port - High-frequency reflections on wet cold pavement
            else if (mIdx === 1) decay = 0.35; // Sand Storm - Acoustic energy fully absorbed by sandy open dunes
            else if (mIdx === 2) decay = 2.4; // Skyscraper - Cavernous luxury lobby reflections showing volume scale
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
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.15);
        
        // Dub lower heartbeat pulse
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        const delay = isCritical ? 0.15 : 0.22;
        osc2.frequency.setValueAtTime(48, now + delay);
        osc2.frequency.exponentialRampToValueAtTime(0.01, now + delay + 0.14);
        gain2.gain.setValueAtTime(0.26 * intensity, now + delay);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.14);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now + delay);
        osc2.stop(now + delay + 0.15);
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
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playCombatStep(this.nextNoteTime);
            this.nextStep();
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
            
            osc.start(time);
            osc.stop(time + 0.2);
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
            
            osc.start(time);
            osc.stop(time + 0.1);
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
            
            noise.start(time);
        }
    }

    startAmbient() {
        if (!this.ctx) return;
        
        // Very low sub-bass background drone
        const osc = this.ctx.createOscillator();
        this.ambientGain = this.ctx.createGain();
        osc.connect(this.ambientGain);
        this.ambientGain.connect(this.ctx.destination);
        
        osc.type = 'sine';
        osc.frequency.value = 45; // Subwoofer rumble
        this.ambientGain.gain.value = 0.1;
        
        // LF0 modulator for subtle breathing movement in background
        const lfo = this.ctx.createOscillator();
        const lfoGain = this.ctx.createGain();
        lfo.connect(lfoGain);
        lfoGain.connect(this.ambientGain.gain);
        lfo.type = 'sine';
        lfo.frequency.value = 0.1; // Ultra-slow LFO swing
        lfoGain.gain.value = 0.05;
        
        osc.start();
        lfo.start();
        
        this.ambientOscs = [];
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
        
        if (missionId === 1) { // Baltic Port (Operation Dead Water) - Ambient Ocean Wave rolls & Rain drops
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
            gNode.connect(ctx.destination);
            
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
            windGainNode.connect(ctx.destination);
            
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
            humGain.connect(ctx.destination);
            
            osc50.start(now);
            osc120.start(now);
            
            this.ambientOscs.push(osc50, osc120, humGain);
        }
    }

    playSound(type, sourceX, sourceY) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const now = ctx.currentTime;
        
        let pitchMod = 1.0;
        let volumeMod = 1.0;
        if (['shoot', 'silenced', 'step', 'hit', 'die'].includes(type)) {
            pitchMod = 0.92 + Math.random() * 0.16; // Pitch randomized +/- 8%
            volumeMod = 0.85 + Math.random() * 0.3;  // Volume randomized +/- 15%
        }

        // Acoustic Obstacle low-pass filter (Audio Occlusion)
        let occludedFilter = null;
        if (sourceX !== undefined && sourceY !== undefined && window.game) {
            const listener = window.game.selectedEntity;
            if (listener) {
                // If there's no clear Line of Sight, muffle the audio through blocks/walls (low-pass filter)
                const hasLoS = window.game.checkLoS(listener.x, listener.y, sourceX, sourceY);
                if (!hasLoS) {
                    occludedFilter = ctx.createBiquadFilter();
                    occludedFilter.type = 'lowpass';
                    occludedFilter.frequency.setValueAtTime(380, now); // absorptive material feel
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

        // Connections chain: Osc -> [Occlusion Filter] -> mainGain -> dryGain -> Output
        //                                                    -> wetGain -> Reverb convolver Node
        if (occludedFilter) {
            osc.connect(occludedFilter);
            occludedFilter.connect(mainGain);
        } else {
            osc.connect(mainGain);
        }
        
        mainGain.connect(dryGain);
        dryGain.connect(ctx.destination);
        
        if (this.reverbNode) {
            mainGain.connect(wetGain);
            wetGain.connect(this.reverbNode);
        }

        if (type === 'shoot') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(150 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
            mainGain.gain.setValueAtTime(0.3 * volumeMod, now);
            mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
        } else if (type === 'silenced') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.05);
            mainGain.gain.setValueAtTime(0.12 * volumeMod, now);
            mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'step') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(50 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.05);
            mainGain.gain.setValueAtTime(0.06 * volumeMod, now);
            mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        } else if (type === 'hit') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(40 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.2);
            mainGain.gain.setValueAtTime(0.4 * volumeMod, now);
            mainGain.gain.linearRampToValueAtTime(0.01, now + 0.2);
            osc.start(now);
            osc.stop(now + 0.2);
        } else if (type === 'die') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80 * pitchMod, now);
            osc.frequency.exponentialRampToValueAtTime(10, now + 0.5);
            mainGain.gain.setValueAtTime(0.5 * volumeMod, now);
            mainGain.gain.linearRampToValueAtTime(0.01, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'upgrade') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.exponentialRampToValueAtTime(900, now + 0.35);
            mainGain.gain.setValueAtTime(0.2, now);
            mainGain.gain.linearRampToValueAtTime(0.01, now + 0.35);
            
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(80, now);
            gain2.gain.setValueAtTime(0.25, now);
            gain2.gain.linearRampToValueAtTime(0.01, now + 0.12);
            osc2.start(now);
            osc2.stop(now + 0.12);
            
            osc.start(now);
            osc.stop(now + 0.35);
        } else if (type === 'radio_beep') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.setValueAtTime(1100, now + 0.04);
            mainGain.gain.setValueAtTime(0.08, now);
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
            noiseGain.connect(ctx.destination);
            noise.start(now);
        }
    }
}
