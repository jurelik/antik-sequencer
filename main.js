//GLOBAL VARIABLES
const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

let trackArray = [];
const mainContainer = document.getElementById('container');
const trackDiv = document.getElementById('track-div');
const addTrack = document.getElementById('add-track');
const playBtn = document.getElementById('play');
const stopBtn = document.getElementById('stop');
const bpm = document.getElementById('bpm');
const warningArea = document.getElementById('warning-area');

//PREVENT DRAG & DROP ON WINDOW
window.addEventListener('dragover', e => {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = "none";
});

//CLASSES
class Track {
  constructor() {
    this.rhythmArray = [];
    this.gain = context.createGain(); //Create a gain node in the audio context
    this.filter = context.createBiquadFilter(); //Create a filter node in the audio context
    //HTML CONTAINER
    this.trackContainer = document.createElement('div');
    this.trackContainer.className = "track-container";
    trackDiv.appendChild(this.trackContainer);

    //ACTIVE/INACTIVE TOGGLE
    this.toggle = {
      htmlElement: document.createElement('button'),
      state: true
    };
    this.toggle.htmlElement.className = "toggle";
    this.trackContainer.appendChild(this.toggle.htmlElement);

    this.toggle.htmlElement.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();

      if(this.toggle.state === true) {
        this.toggle.state = false;
        this.toggle.htmlElement.className = 'toggle-off';
      }
      else {
        this.toggle.state = true;
        this.toggle.htmlElement.className = 'toggle';
      }
      this.toggle.htmlElement.blur();
    });

    //16 SEQUENCER BUTTONS
    this.sequencerBtns = [];
    for (let x = 0; x < 16; x++) {
      this.sequencerBtns = this.sequencerBtns.concat({htmlElement: document.createElement('button'), state: false});
      this.rhythmArray = this.rhythmArray.concat(this.sequencerBtns[x].state);
      this.sequencerBtns[x].htmlElement.className = "sequencer-btn";
      this.trackContainer.appendChild(this.sequencerBtns[x].htmlElement);
      //ADD EVENT LISTENERS FOR EVERY BUTTON TO CHANGE STATE AND COLOR
      this.sequencerBtns[x].htmlElement.addEventListener('click', e => {
        e.stopPropagation();
        e.preventDefault();
        if (this.sequencerBtns[x].state === false) {
          this.sequencerBtns[x].state = true;
          this.sequencerBtns[x].htmlElement.className = "sequencer-btn-pressed";
        }
        else {
          this.sequencerBtns[x].state = false;
          this.sequencerBtns[x].htmlElement.className = "sequencer-btn";
        } 
        this.rhythmArray[x] = this.sequencerBtns[x].state; //ADJUST RHYTHM ARRAY ACCORDING TO BUTTON STATE
        this.sequencerBtns[x].htmlElement.blur();
      });
    }

    //FILTER
    this.filter.connect(this.gain);
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(22000, context.currentTime);

    this.filterSlider = document.createElement('input'); //Create a DOM slider element
    this.filterSlider.setAttribute('type', 'range');
    this.filterSlider.setAttribute('min', '0');
    this.filterSlider.setAttribute('max', '11000');
    this.filterSlider.setAttribute('step', '1');
    this.filterSlider.setAttribute('value', '11000');
    this.filterSlider.setAttribute('orient', 'vertical');
    this.filterSlider.className = 'filter-slider';
    this.trackContainer.appendChild(this.filterSlider);

    this.filterSlider.addEventListener('input', e => { //Listen for changes on slider
      e.stopPropagation();
      e.preventDefault();
      this.filter.frequency.setValueAtTime(this.logSliderFilter(this.filterSlider.value), context.currentTime);
      // this.filterSlider.blur();
    });
    this.filterSlider.addEventListener('mouseup', e => { //Remove outline when user stops dragging
      this.filterSlider.blur();
    });

    //GAIN
    this.gain.connect(context.destination);
    this.gain.gain.setValueAtTime(1, context.currentTime);

    this.gainSlider = document.createElement('input');
    this.gainSlider.setAttribute('type', 'range');
    this.gainSlider.setAttribute('type', 'range');
    this.gainSlider.setAttribute('min', '0.001');
    this.gainSlider.setAttribute('max', '1');
    this.gainSlider.setAttribute('step', '0.001');
    this.gainSlider.setAttribute('value', '1');
    this.gainSlider.setAttribute('orient', 'vertical');
    this.gainSlider.className = 'gain-slider';
    this.trackContainer.appendChild(this.gainSlider);

    this.gainSlider.addEventListener('input', e => {
      e.stopPropagation();
      e.preventDefault();
      this.gain.gain.exponentialRampToValueAtTime(this.logSliderGain(this.gainSlider.value), context.currentTime + 0.1);
    });
    this.gainSlider.addEventListener('mouseup', e => { //Remove outline when user stops dragging
      this.gainSlider.blur();
    });

    //DROP ZONE
    this.dropZone = document.createElement('div');
    this.dropZone.className = 'drop-zone';
    this.trackContainer.appendChild(this.dropZone);
    this.dropZone.innerHTML = '<p>Load File</p>';

    this.hiddenInput = document.createElement('input'); //Add a hidden file input in case the user clicks on dropZone
    this.hiddenInput.setAttribute('type', 'file');
    this.hiddenInput.className = 'hidden-input';
    this.trackContainer.appendChild(this.hiddenInput);

    this.dropZone.addEventListener('drop', this.dropHandler.bind(this));
    this.dropZone.addEventListener('dragover', this.dragHandler.bind(this));
    this.dropZone.addEventListener('click', e => { //Listen for clicks on dropZone
      e.stopPropagation();
      e.preventDefault();
      
      this.hiddenInput.click();
    });
    this.hiddenInput.addEventListener('change', e => { //Listen for a file drop via the <input> tag
      e.stopPropagation();
      e.preventDefault();

      const reader = new FileReader();
      let file = this.hiddenInput.files[0];
      let self = this;

      reader.onloadstart = () => {
        this.dropZone.innerHTML = '<p>Loading..</p>';
      };

      reader.onload = () => {
        if (file.type === 'audio/wav' || file.type === 'audio/x-wav' || file.type === 'audio/mp3' ||file.type === 'audio/mpeg' ||  file.type === 'audio/ogg') { //Check if the loaded file is an audio file
          context.decodeAudioData(reader.result, decoded => {
            if (decoded.duration < 5.0) { //Check to see if the file is under 2s long to prevent long samples
              self.buffer = decoded;
              this.dropZone.innerHTML = '<p>Sound Loaded</p>';
              warningArea.innerHTML = '';
            }
            else { //Error if sound file is longer than 2s
              this.dropZone.innerHTML = '<p>Load File</p>';
              warningArea.innerHTML = 'Sound file needs to be under 5s long.';
              this.warningAnimation();
            } 
          });
        }
        else { //Error if file type is not supported
          this.dropZone.innerHTML = '<p>Load File</p>';
          warningArea.innerHTML = 'We currently support wav, mp3 and ogg formats.';
          this.warningAnimation();
        }
      };
      reader.readAsArrayBuffer(file);
    });

    //DELETE BUTTON
    this.deleteBtn = document.createElement('button');
    this.deleteBtn.className = "delete-btn";
    this.deleteBtn.innerHTML = '✖';
    this.trackContainer.appendChild(this.deleteBtn);

    this.deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();

      trackArray.splice(trackArray.indexOf(this), 1); //Remove the track from trackArray
      trackDiv.removeChild(this.trackContainer); //Remove DOM Elements
      warningArea.innerHTML = '';
    });
  }
  play(time) { //PLAY SAMPLE
    if (this.buffer) {
      const source = context.createBufferSource();
      source.connect(this.filter);
      source.buffer = this.buffer;
      source.start(time);
    }
    else {
      console.log('sound not loaded');
    }
  }
  dropHandler(e) { //DRAG & DROP AUDIO FILE
    e.stopPropagation();
    e.preventDefault();

    let file = e.dataTransfer.files[0];
    let self = this;
    const reader = new FileReader();

    reader.onloadstart = () => {
      this.dropZone.innerHTML = '<p>Loading..</p>';
    };

    reader.onload = () => {
      if (file.type === 'audio/wav' || file.type === 'audio/x-wav' || file.type === 'audio/mp3' ||file.type === 'audio/mpeg' ||  file.type === 'audio/ogg') { //Check if the loaded file is an audio file
        context.decodeAudioData(reader.result, decoded => {
          if (decoded.duration < 5.0) { //Check to see if the file is under 2s long to prevent long samples
            self.buffer = decoded;
            this.dropZone.innerHTML = '<p>Sound Loaded</p>';
            warningArea.innerHTML = '';
          }
          else { //Error if sound file is longer than 2s
            this.dropZone.innerHTML = '<p>Load File</p>';
            warningArea.innerHTML = 'Sound file needs to be under 5s long.';
            this.warningAnimation();
          } 
        });
      }
      else { //Error if file type is not supported
        this.dropZone.innerHTML = '<p>Load File</p>';
        warningArea.innerHTML = 'We currently support wav, mp3 and ogg formats.';
        this.warningAnimation();
      } 
      };
    reader.readAsArrayBuffer(file);
  }
  dragHandler(e) { //DRAG & DROP MOUSE CONFIG
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
  logSliderFilter(position) {
    var minp = 0;
    var maxp = 11000;
    var minv = Math.log(30);
    var maxv = Math.log(22000);
    var scale = (maxv-minv) / (maxp-minp);
    var value = Math.exp(minv + scale*(position-minp));
    return value;
  }
  logSliderGain(position) {
    var minp = 0.001;
    var maxp = 1;
    var minv = Math.log(0.001);
    var maxv = Math.log(1);
    var scale = (maxv-minv) / (maxp-minp);
    var value = Math.exp(minv + scale*(position-minp));
    return value;
  }
  warningAnimation() { //Fade out animation
    warningArea.classList.add('warning-area-animation');
    this.hiddenInput.value = null; //!This removes the file from the memory
    setTimeout(() => {
      warningArea.innerHTML = '';
      warningArea.classList.remove('warning-area-animation');
    }, 5000);
  }
}

//DRUM SEQUENCER
const drumSequencer = {
  currNote: 0,
  lookahead: 25,
  nextNoteTime: 0.0,
  playing: false,
  scheduleAheadTime: 0.1,
  tempo: 120,

  createTrack() { //Create a new track
    trackArray = trackArray.concat(new Track());
  },
  
  playRhythm() {
    if (trackArray.length > 0 && this.playing === false) { //Check to see if any tracks are created before starting the scheduler
      this.nextNoteTime = context.currentTime + 0.005;
      this.playing = true;
      playBtn.className = 'play-active';
      stopBtn.className = 'stop-inactive';
      this.scheduler();
    }
    else if (this.playing === true){
      console.log('Already playing');
    }
    else {
      console.log('No tracks created');
    }
  },

  stopRhythm() {
    if (this.playing === true) {
      clearTimeout(this.timer);
      this.playing = false;
      playBtn.className = 'play-inactive';
      stopBtn.className = 'stop-active';
    }
  },

  scheduler() {
    if (trackArray.length > 0 && document.hidden === false) { //Check to see if any tracks exist before every loop & tab is in focus
      while(this.nextNoteTime < context.currentTime + this.scheduleAheadTime) {
        for (let i = 0; i < trackArray.length; i++) {
          if (trackArray[i].rhythmArray[this.currNote] && trackArray[i].toggle.state === true) {
            trackArray[i].play(this.nextNoteTime);
            console.log(this.currNote);
          }
        }
        this.nextNote();
      }
      this.timer = setTimeout(this.scheduler.bind(this), this.lookahead);
    }
    else { //Stop the timer in case no tracks are left
      clearTimeout(this.timer);
      this.playing = false;
      playBtn.className = 'play-inactive';
      this.currNote = 0;
    }
  },

  nextNote() {
    this.secondsPerBeat = 60 / this.tempo / 4;
    this.nextNoteTime += this.secondsPerBeat;
    this.currNote++;
    if (this.currNote === 16) {
      this.currNote = 0;
    }
  }
}

//GLOBAL EVENT LISTENERS
addTrack.addEventListener('click', e => {
  drumSequencer.createTrack();
  addTrack.blur();
});

playBtn.addEventListener('click', e => {
  drumSequencer.playRhythm();
  playBtn.blur();
});

stopBtn.addEventListener('click', e => {
  drumSequencer.stopRhythm();
  drumSequencer.currNote = 0;
  stopBtn.blur();
});

bpm.addEventListener('change', e => {
  drumSequencer.tempo = bpm.value;
  console.log(bpm.value);
  bpm.blur();
});