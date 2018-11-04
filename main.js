//GLOBAL VARIABLES
const AudioContext = window.AudioContext || window.webkitAudioContext;
const context = new AudioContext();

let trackNum = 0;

//PREVENT DRAG & DROP ON WINDOW
window.addEventListener('dragover', e => {
  e.stopPropagation();
  e.preventDefault();
  e.dataTransfer.dropEffect = "none";
});

//CLASSES
class Track {
  constructor() {
    //ADD TO NUMBER OF TOTAL TRACKS
    trackNum++;
    //CREATE AN HTML CONTAINER
    this.mainContainer = document.getElementById('container');
    this.trackContainer = document.createElement('div');
    this.trackContainer.className = "track-container";
    this.mainContainer.appendChild(this.trackContainer);
    //CREATE 16 SEQUENCER BUTTONS
    this.sequencerBtns = [];
    for (let x = 0; x < 16; x++) {
      this.sequencerBtns = this.sequencerBtns.concat(document.createElement('div'));
      this.sequencerBtns[x].className = "sequencer-btn";
      this.trackContainer.appendChild(this.sequencerBtns[x]);
    }
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