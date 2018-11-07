//GLOBAL VARIABLES
const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

let trackNum = 0;
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
    //CREATE AN HTML CONTAINER
    this.mainContainer = document.getElementById('container');
    this.trackContainer = document.createElement('div');
    this.trackContainer.className = "track-container";
    this.mainContainer.appendChild(this.trackContainer);

    //CREATE ACTIVE/INACTIVE TOGGLE
    this.toggle = document.createElement('button');
    this.toggle.className = "toggle";
    this.trackContainer.appendChild(this.toggle);

    //CREATE 16 SEQUENCER BUTTONS
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
        if (this.sequencerBtns[x].state == false) {
          this.sequencerBtns[x].state = true;
          this.sequencerBtns[x].htmlElement.style.backgroundColor = 'red';
        }
        else {
          this.sequencerBtns[x].state = false;
          this.sequencerBtns[x].htmlElement.style.backgroundColor = 'white';
        } 
        this.rhythmArray[x] = this.sequencerBtns[x].state; //ADJUST RHYTHM ARRAY ACCORDING TO BUTTON STATE
      });
    }

    //CREATE DROP ZONE
    this.dropZone = document.createElement('div');
    this.dropZone.className = "drop-zone";
    this.trackContainer.appendChild(this.dropZone);

    //DRAG & DROP EVENT LISTENERS
    this.dropZone.addEventListener('drop', this.dropHandler.bind(this));
    this.dropZone.addEventListener('dragover', this.dragHandler.bind(this));
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
  createTrack() {
    trackArray = trackArray.concat({trackReference: new Track(), trackID: trackNum});
    trackNum++;
  }
}

//DRUM SEQUENCER
const ds = {
  currNote: 0,
  lookahead: 25,
  nextNoteTime: 0.0,
  scheduleAheadTime: 0.1,
  tempo: 120,
  
  playRhythm() {
    this.secondsPerBeat = 60 / this.tempo / 4;
    this.nextNoteTime = context.currentTime + 0.005;
    this.scheduler();
  },

  scheduler() {
    while(this.nextNoteTime < context.currentTime + this.scheduleAheadTime) {
      for (let i = 0; i < trackArray.length; i++) {
        if (trackArray[i].trackReference.rhythmArray[this.currNote]) {
          trackArray[i].trackReference.play(this.nextNoteTime);
          console.log(this.currNote);
        }
      }
      // console.log('sup');
      this.nextNote();
    }
    this.timer = setTimeout(this.scheduler.bind(this), this.lookahead);
  },

  nextNote() {
    this.nextNoteTime += this.secondsPerBeat;
    this.currNote++;
    if (this.currNote == 16) {
      this.currNote = 0;
    }
  }
}

// let currNote = 0;
// let lookahead = 25;
// let nextNoteTime = 0.0;
// let scheduleAheadTime = 0.1;
// let tempo = 120;
// let secondsPerBeat = 60 / tempo / 4;
// let timer;

// let playRhythm = function() {
//   nextNoteTime = context.currentTime + 0.005;
//   scheduler();
// }

// let scheduler = function() {
//   while(nextNoteTime < context.currentTime + scheduleAheadTime) {
//     for (let i = 0; i < trackArray.length; i++) {
//       if (trackArray[i].trackReference.rhythmArray[currNote]) {
//         trackArray[i].trackReference.play(nextNoteTime);
//         console.log(currNote);
//       }
//     }
//     console.log('ayy');
//     nextNote();
//   }
//   timer = setTimeout(scheduler, lookahead);
// }

// let nextNote = function() {
//   nextNoteTime += secondsPerBeat;
//   currNote++;
//   if (currNote === 16) {
//     currNote = 0;
//   }
// }