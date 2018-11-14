//GLOBAL VARIABLES
const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

let trackArray = [];

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
    //HTML CONTAINER
    this.mainContainer = document.getElementById('container');
    this.trackContainer = document.createElement('div');
    this.trackContainer.className = "track-container";
    this.mainContainer.appendChild(this.trackContainer);

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

    //DROP ZONE
    this.dropZone = document.createElement('div');
    this.dropZone.className = "drop-zone";
    this.trackContainer.appendChild(this.dropZone);
    this.dropZone.innerHTML = "<p>Drop File</p>"

    this.dropZone.addEventListener('drop', this.dropHandler.bind(this));
    this.dropZone.addEventListener('dragover', this.dragHandler.bind(this));

    //DELETE BUTTON
    this.deleteBtn = document.createElement('button');
    this.deleteBtn.className = "delete-btn";
    this.deleteBtn.innerHTML = 'X';
    this.trackContainer.appendChild(this.deleteBtn);

    this.deleteBtn.addEventListener('click', e => {
      e.stopPropagation();
      e.preventDefault();

      trackArray.splice(trackArray.indexOf(this), 1); //Remove the track from trackArray
      this.mainContainer.removeChild(this.trackContainer); //Remove DOM Elements
    });

  }
  play(time) { //PLAY SAMPLE
    if (this.buffer) {
      const source = context.createBufferSource();
      source.connect(context.destination);
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

    let file = e.dataTransfer.files;
    let self = this;

    const reader = new FileReader();
    reader.onload = () => {
      context.decodeAudioData(reader.result, decoded => {
        self.buffer = decoded;
      });
      };
    reader.readAsArrayBuffer(file[0]);
  }
  dragHandler(e) { //DRAG & DROP MOUSE CONFIG
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
}

//OBJECT CONTAINING GLOBAL METHODS
const global = {
  createTrack() { //Create a new track
    trackArray = trackArray.concat(new Track());
  }
}

//DRUM SEQUENCER
const drumSequencer = {
  currNote: 0,
  lookahead: 25,
  nextNoteTime: 0.0,
  scheduleAheadTime: 0.1,
  tempo: 120,
  
  playRhythm() {
    if (trackArray.length > 0) { //Check to see if any tracks are created before starting the scheduler
      this.secondsPerBeat = 60 / this.tempo / 4;
      this.nextNoteTime = context.currentTime + 0.005;
      this.scheduler();
    }
    else {
      console.log('No tracks created');
    }
  },

  scheduler() {
    if (trackArray.length > 0) { //Check to see if any tracks exist before every loop
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
    }
  },

  nextNote() {
    this.nextNoteTime += this.secondsPerBeat;
    this.currNote++;
    if (this.currNote === 16) {
      this.currNote = 0;
    }
  }
}