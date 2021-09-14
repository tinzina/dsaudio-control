# DSAudioControl Demo

Each audio file will have a json file containing an object defining the project data, timestamps, and events. The purpose of the DSAudioControl is to simplify loading the audio and json files and create timestamp events.

Audio File:  We are currently only using the WAV format but may add MP# as a failback.

Json file structure:

- header information
  - name: Name of the Exercise and the audio and json files' base name
  - course: Source workbook name
  - lesson: Dialog group and worksheet name
  - lastUpdated: Date updated (currently Excel date time but will be chaned to UTC)
  - timestampAddress: Starting range address of Dialog group
  - title: Same as name
  - transition: Named event associated with the loading of the files
  - type: Type of Dialog
  - version:  The version of the code which created the files
  - bubbles:   Array of definitions for the Dialog Bubbles
    - category: Type of Bubble
    - duration: Length of time that the Bubble will be active
    - endTime: Indicates the time that the Bubble should be deactivated
    - startTime: Start time the Bubble becomes active
    - type: Kind of Bubble
    - transition: Named event associated with the showing of a Bubble
    - Native: Native text to be displayed in the Bubble
    - Foreign: Foreign text and Comments to be displayed in the Bubble
    - speech:  Array of speech definitions
      - duration: Length of time that it takes to speak the text
      - endTime: Length of time that it takes to speak the speech definition
      - startTime: The time the speech is spoken
      - id:  Cell address for the speech
      - prosodyRate:  Speech rate
      - text:  The text that is spoken
      - valid: Indicates that the speech definition contains text
      - voice: The voice of the speaker
      - wordBoundaries:  Array of word definitions
       - audioOffset:  Starttime of the word in nanoseconds
       - index:  Index of the word in the parent speech definition
       - duration: Length of time that it takes to speak the word
       - endTime: Indicates the end of the word definition text being spoken
       - startTime: The time the word is spoken
       - text:  The word that is spoken

Json file example:
```
{
    "name": "Basic",
    "course": "Spanish A1 - master RC.xlsx",
    "duration": 68.21308333333333,
    "fileName": "Basic",
    "lastUpdated": 44452.5970641667,
    "lesson": "Basic",
    "timestampAddress": "Basic!C3",
    "title": "Basic",
    "transition": "Slide Right",
    "type": "Exercise",
    "version": "1.0.0.3",
    "bubbles": [
        {
            "category": "Q&A",
            "duration": 23.498166666666666,
            "endTime": 23.548166666666667,
            "startTime": 0.05,
            "type": "Bubble",
            "transition": "Slide Up",
            "Native": "disculpe",
            "Foreign": {
                "comments": "disculpe",
                "text": ""
            }
            "speech": [
                {
                    "duration": 8.143749999999999,
                    "endTime": 8.19375,
                    "startTime": 0.05,
                    "id": "Basic!D5",
                    "prosodyRate": 1,
                    "text": "Imagine an American woman sitting next to a Spanish speaking man. She wants to politely get his attention and says: \"excuse me\".",
                    "voice": "en-US-GuyNeural",
                    "wordBoundaries": [
                        {
                            "audioOffset": 500000,
                            "index": 0,
                            "duration": 0.5125,
                            "endTime": 0.5625,
                            "startTime": 0.05,
                            "text": "Imagine",
                            "textOffset": 112
                        }
            ]
        }
    ]
}

```

# class DSAudioControl 

- DSAudioControl: extends HTMLElement (note: tag name 'dsaudio-control')
    - static get observedAttributes():
    - async attributeChangedCallback(name, oldValue, newValue):
    - get html(): Internal use
    - async render(): Internal use
    - updateAudioAttributes(name, value): Internal use
    - bindPlayPauseButton(selector): Optionally binds an external element to togglePlay()
    - bindVolumneBar(selector): Optionally binds an external range element to volumns
    - bindProgressBar(selector): Optionally binds an external range element to the audio's current time
    - syncProgessBar(): Internal use
    - initializeAudio(): Internal use
    - get currentTime():  Returns the audio tags current time
    - set currentTime(value): Sets the audio tags current time
    - get duration(): Returns the audio files duration
    - get paused(): Indicates whether the audio is paused or not
    - get isPlaying(): Indicates whether the audio being played or not
    - get src(): Returns the audio file's source url
    - set src(value): Sets the audio files source and initiates loading the data and general setup
    - get defaultVolumne(): Returns the optional attribute that determines the starting value for the volumne or the default _defaultVolume
    - set defaultVolumne(value): Sets the default volumne
    - get volumne(): Gets the volumne
    - set volumne(value): Sets the volumne
    - pause(): Pauses the audio
    - play(): Plays the audio
    - seekTo(value): Sets the audio's current time
    - toggleMute(muted = null): Mutes/unmutes the audio
    - togglePlay(): Plays/paues the audio
    - async loadData(): Internal use - loads the json file
    - _initCues(): Creates the [VTTCue events](https://developer.mozilla.org/en-US/docs/Web/API/VTTCue)

## DSAudioControl VTTCue Events

The DSAudioControl creates [VTTCue events](https://developer.mozilla.org/en-US/docs/Web/API/VTTCue) for all timestamped definitions.  Both onenter and onexit events are dispatched by the control.

Definition events with the values return:
 - onBubbleEnter: Bubble, activeCues
 - onSpeakEnter: Bubble, Speak, activeCues
 - onWordEnter: Bubble, Speak, Word, activeCues
 - onSyllableEnter: Bubble, Speak, Word, activeCues
 - onBubbleExit: Bubble, activeCues
 - onSpeakExit: Bubble, Speak, activeCues
 - onWordExit: Bubble, Speak, Word, activeCues
 - onSyllableExit: Bubble, Speak, Word, activeCues

Listener example:

```
const player = document.querySelector("dsaudio-control");

player.addEventListener("onBubbleEnter", function (event) {
    const { bubble } = event.detail;
    console.log(event.type, bubble.Native, bubble);
});
```
Active cues example:
