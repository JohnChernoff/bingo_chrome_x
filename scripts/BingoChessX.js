'use strict';

class BingoChessX {
  constructor(movesElement) {
    this.movesElement = movesElement;
    this.options = {};
    if (movesElement) {
      this.emitters = {
        moves: new MoveEmitter(this.movesElement, this.movesElement),
        gameStates: new GameStateEmitter(this.movesElement, this.movesElement)
      };
    }
    else {
      console.log('moves element not found');
    }
  }

  handleStart = () => {
    if (this.options.enabled && this.options.twitch_token !== "") {
      let startData = { "gid": "?", "token": this.options.twitch_token }; //TODO: get gid
      console.log('starting new game...');
      fetch('http://localhost:7070/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(startData)
      }); //.then(r => console.log(r));
    }
  }

  handleMove = (notation) => {
    if (this.options.enabled && this.options.twitch_token !== "") {
      let move = {"move": notation.detail.notation, "token": this.options.twitch_token};
      console.log('new_move', move.move);
      fetch('http://localhost:7070/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=utf-8'
        },
        body: JSON.stringify(move)
      }); //.then(r => console.log(r));
    }
  }

  addListeners = (target) => {
    // Moves and game events
    target.addEventListener('move', e => this.handleMove(e));
    target.addEventListener('capture', e => console.log('capture', e));
    target.addEventListener('check', () => console.log('check'));
    target.addEventListener('start', () => this.handleStart());
    target.addEventListener('state', e => {
      if (e.detail.isOver) { this.gameOver(e.detail.state); }
    });

    // Options saved
    browser.storage.onChanged.addListener(async (changes, area) => {
      // Restart when options are saved
      if (area !== 'sync') { return; }
      // Stop to prevent sounds being repeated multiple times
      this.stop();
      // Apply saved options and restart if enabled
      const items = await UserPrefs.getOptions();
      this.options = items;
      this[this.options.enabled ? 'start' : 'stop']();
    });

  }

  init = async () => {
    if (this.movesElement) {
      console.log("Init: Welcome to BingoChessX 0.1!");
      const status = document.querySelector('.status');
      const isGameOver = !!status;
      this.addListeners(this.movesElement);

      this.options = await UserPrefs.getOptions();
      console.log('options:', this.options);
      // Start if the extension is enabled and the game is not over
      this[this.options.enabled && !isGameOver ? 'start' : 'stop']();
    } else {
      this.options.enabled = false;
    }
  }

  gameOver = (state = 'resign') => {
    console.log('gameOver', state);
  }

  start = async () => {
    // Load the sounds for the selected commentator
    this.emitters.moves.init();
    this.emitters.gameStates.init();
    this.options.enabled = true;
  }

  stop = () => {
    this.emitters.moves.disconnect();
    this.emitters.gameStates.disconnect();
    this.options.enabled = false;
  }

}

// Wait for the move list element to be created
// Then initialize the extension
// The move notation should be one of the first element created a lichess page is loaded...
// @TODO figure a more reliable/efficient way to disable the extension on pages without moves notation
const observer = new MutationObserver((mutations, observerInstance) => {
  // Workaround to get $moves-tag set in
  // https://github.com/ornicar/lila/blob/master/ui/round/css/_constants.scss#L10
  // The actual element name is changed often.
  const movesElement = document.querySelector('l4x');
  window.bingX = new BingoChessX(movesElement);
  window.bingX.init().then(() => window.bingX.handleStart());
  observerInstance.disconnect();
});

observer.observe(document, {
  childList: true,
  subtree: true,
  attributes: false,
  characterData: false
});
