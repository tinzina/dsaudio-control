/* Based off of 
* Before Semicolon Projects 
* Audio Player with Web Component & Web Audio API: https://github.com/beforesemicolon/BFS-Projects 
*/

class DSAudioControl extends HTMLElement {
    constructor() {
        super();
        this.nonAudioAttributes = new Set([]);
        this._defaultVolume = 0.4;
        this.initialized = false;
        this.audio = undefined;
        this.attachShadow({ mode: 'open' });
        this.volumneBar = undefined;
        this.progressBar = undefined;
    }

    static get observedAttributes() {
        // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/audio
        return [
            'src', 'muted', 'crossorigin', 'loop', 'preload', 'autoplay'
        ];

    }

    async attributeChangedCallback(name, oldValue, newValue) {
        switch (name) {
            case 'src':
                this.initialized = false;
                this.render();
                this.initializeAudio();
                break;
            case 'muted':
                this.toggleMute(Boolean(this.audio?.getAttribute('muted')));
                break;
            default:
        }

        this.updateAudioAttributes(name, newValue);
    }

    get html() {
        return `<audio></audio>`;
    }

    async render() {
        this.shadowRoot.innerHTML = this.html;
        this.audio = this.shadowRoot.querySelector('audio');
        this.audio.addEventListener('timeupdate', () => {
            this.syncProgessBar();
        });
          
        // if rendering or re-rendering all audio attributes need to be reset
        for (let i = 0; i < this.attributes.length; i++) {
            const attr = this.attributes[i];
            this.updateAudioAttributes(attr.name, attr.value);
        }

        this.loadData();
    }

    updateAudioAttributes(name, value) {
        if (!this.audio || this.nonAudioAttributes.has(name)) return;

        // if the attribute was explicitly set on the audio-player tag
        // set it otherwise remove it
        if (this.attributes.getNamedItem(name)) {
            this.audio.setAttribute(name, value ?? '')
        } else {
            this.audio.removeAttribute(name);
        }
    }

    bindPlayPauseButton(selector) {
        document.querySelector(selector).onclick = _ => this.togglePlay();
    }

    bindVolumneBar(selector) {
        this.volumneBar = document.querySelector(selector);
        this.volumneBar.min = 0;
        this.volumneBar.max = 2;
        this.volumneBar.step = 0.01;
        this.volumneBar.value = this.volumne;
        this.volumneBar.onchange = _ => this.volumne = +this.volumneBar.value;
    }

    bindProgressBar(selector) {
        this.progressBar = document.querySelector(selector);
        this.syncProgessBar();
        this.progressBar.onchange = _ => this.seekTo(this.progressBar.value);
    }

    syncProgessBar() {
        if(!this.progressBar) return;
        this.progressBar.min = 0;
        this.progressBar.max = this.audio.duration;
        this.progressBar.value = this.audio.currentTime;
    }

    initializeAudio() {
        if (this.initialized) return;
        this.initialized = true;

        this.audioCtx = new AudioContext();
        this.gainNode = this.audioCtx.createGain();
        this.analyserNode = this.audioCtx.createAnalyser();
        this.track = this.audioCtx.createMediaElementSource(this.audio);

        this.analyserNode.fftSize = 2048;
        this.bufferLength = this.analyserNode.frequencyBinCount;
        this.dataArray = new Uint8Array(this.bufferLength);
        this.analyserNode.getByteFrequencyData(this.dataArray);

        this.track
            .connect(this.gainNode)
            .connect(this.analyserNode)
            .connect(this.audioCtx.destination);

        this.volumne = this.defaultVolumne;
        this.syncProgessBar();
    }

    get currentTime() {
        return this.audio.currentTime;
    }

    set currentTime(value) {
        this.audio.currentTime = value;
    }

    get duration() {
        return this.audio.duration;
    }

    get paused() {
        return this.audio.paused;
    }

    get isPlaying() {
        return !this.paused;
    }

    get src() {
        return this.getAttribute("src");
    }

    set src(value) {
        this.setAttribute("src", value);
    }

    get defaultVolumne() {
        const value = this.getAttribute("defaultVolumne");
        return value ? +value : this._defaultVolume;
    }

    set defaultVolumne(value) {
        this.setAttribute("defaultVolumne", value);
    }

    get volumne() {
        return this.gainNode.gain.value;
    }

    set volumne(value) {
        if (this.volumneBar)
        this.gainNode.gain.value = this.volumneBar.value;
        else
            this.gainNode.gain.value = value;
    }

    pause() {
        this.audio.pause();
    }

    play() {
        this.audio.play();
    }

    seekTo(value) {
        this.audio.currentTime = value;
    }

    toggleMute(muted = null) {
        this.gainNode.gain.value = muted ? 0 : this.defaultVolumne;
    }

    togglePlay() {
        if (this.paused)
            this.play();
        else
            this.pause();
    }

    async loadData() {
        const src = this.getAttribute('src');
        if (!src) return;
        const srcDataUrl = src.substring(0, src.length - 4) + ".json";
        const baseName = src.substring(0, src.length - 4).split(src.indexOf("/") > 0 ? '/' : '\\').pop();
        this.data = await fetch(srcDataUrl).then(result => result.json());
        if (!this.data) {
            console.warn("401 File not found", srcDataUrl);
            return;
        }

        this._initCues();
    }

    _initCues() {
        this.textTrack = this.audio.addTextTrack("metadata", "English", "en");
        this.textTrack.mode = "showing";

        const _dispatchEvent = (eventName, options) => {
            this.dispatchEvent(new CustomEvent(eventName, {
                detail: { eventName, ...options }
            }));
        };

        const addCue = (startTime, endTime, text, eventType, options) => {
            let cue = new VTTCue(startTime, endTime, text);
            cue.onenter = () => _dispatchEvent(`on${eventType}Enter`, options);
            cue.onexit = () => _dispatchEvent(`on${eventType}Exit`, options);
            this.textTrack.addCue(cue);
        };

        this.data.bubbles.forEach((bubble, b) => {
            bubble.index = b;
            let bubbleWordIndex = 0;
            addCue(bubble.startTime, bubble.endTime, bubble.Native, "Bubble", { bubble });
            bubble.speech.forEach((speak) => {
                addCue(speak.startTime, speak.endTime, speak.text, "Speak", { bubble, speak });
                speak.wordBoundaries.forEach(word => {
                    word.bubbleWordIndex = bubbleWordIndex++;
                    addCue(word.startTime, word.endTime, word.text, "Word", { bubble, speak, word });
                    if (speak.syllables)
                        addCue(word.startTime, word.endTime, word.text, "Syllable", { bubble, speak, word });
                });
            });
        });
    }

}

customElements.define('dsaudio-control', DSAudioControl);
