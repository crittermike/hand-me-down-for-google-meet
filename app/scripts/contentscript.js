let audioContext = null;
let mediaStreamSource = null;
let watcher = null;
let handButton = null;
let processor = null;
let handIsRaised = false;

// Set up an interval that checks every half a second to see if the user has
// joined the meeting or if they're still waiting to click the join button.
const waitForVideoCall = setInterval(() => {
    if ((document.documentElement.textContent || document.documentElement.innerText).indexOf('Raise hand') > -1) {
        clearInterval(waitForVideoCall)
        
        // Find the raise/lower hand button and add a listener to it.
        handButton = document.querySelector('[aria-label="Raise hand"]');
        handButton.addEventListener("click", function() {
            if (handButton.getAttribute("aria-label") === "Raise hand") {
                handIsRaised = true;
                startListening();
            } else {;
                handIsRaised = false;
                stopListening();
            }
        })
    }
}, 500)

// Wire up the mic listener. This is the only reliable way to tell if the user
// has started talking, in which case we should lower their hand.
const startListening = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            watcher = createVolumeWatcher(audioContext);
            mediaStreamSource.connect(watcher);
        });
    }
}

// The user's hand has been lowered, so we don't need to keep listening.
const stopListening = () => {
    processor.disconnect();
    processor.onaudioprocess = null;
    processor = null;
}

// Start watching the volume of the mic input stream to see when the user starts speaking.
const createVolumeWatcher = (audioContext) => {
    // 16384 is the highest possible rate, which means it checks infrequently
    // to not stress the system. We don't need frequent checking since we're
    // not actually using the audio, just checking the volume of it.
    processor = audioContext.createScriptProcessor(16384);
    processor.onaudioprocess = volumeAudioProcess;
    processor.average = 0.0;
    processor.clip = 0.0;
    processor.connect(audioContext.destination);
    return processor;
}

// Process the stream and do some math to find the average volume of the user's
// microphone input. This lets us make sure the user is actually saying something
// substantial, meaning we should lower their hand, instead of just a 1-word repsonse
// which probably doesn't need hand lowering.
const volumeAudioProcess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    let i;
    let sum = 0.0;
    let clipcount = 0;

    // Some tricky math here, mostly taken from this webrtc example:
    // https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/volume/js/soundmeter.js
    for (i = 0; i < input.length; ++i) {
      sum += input[i] * input[i];
      if (Math.abs(input[i]) > 0.99) {
        clipcount += 1;
      }
    }
    this.instant = Math.sqrt(sum / input.length);

    // If the user stops talking completely, reset the average down to zero.
    // This is so that the average resets when the user starts talking again.
    // Otherwise you run into a situation where they say 1 word and then are
    // silent for a long time, and no amount of talking after that brings the
    // average back up above the threshold.
    if (this.instant < 0.01) {
        this.average = 0.0;
    } else {
        this.average = (0.90 * this.average) + (0.10 * this.instant);
    }
    this.clip = clipcount / input.length;

    if (this.average > 0.03 && handIsRaised) {
        handIsRaised = false;
        handButton.click();
    }
}
