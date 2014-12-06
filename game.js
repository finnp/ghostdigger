window.onload = function () {
  var canvas = document.createElement('canvas') // <canvas id="game"></canvas>
  canvas.id = 'game'

  canvas.width = 640
  canvas.height = 640

  var game = new Game(canvas.width, canvas.height)

  document.body.appendChild(canvas)
  if(typeof canvas == 'string') canvas = getElementById(canvas.id) // in case browser returns string
  var context = canvas.getContext('2d')

  // y
  // |
  // |
  // |
  // |
  // V
  //  ----------> x
  
  var player = new Player(game)
  player.setTilePos(3, 3)

  preload(startGame)

  function startGame(images) {
    console.log('startGame')
    requestAnimationFrame(draw)
    function draw(timestamp) {
      console.log('draw')
      for(var i = 0; i < game.tilesY; i++) {
        for(var j = 0; j < game.tilesX; j++) {
            var tileSprite =  game.tiles[i][j] ? images.wall : images.floor
            context.drawImage(tileSprite,
              Math.floor(game.offsetX * j),
              Math.floor(game.offsetY * i),
              Math.floor(game.offsetX),
              Math.floor(game.offsetY)
            )
         }
      }
      console.log(player.pos)
      context.drawImage(images.player,
        player.pos.x, player.pos.y, game.offsetX, game.offsetY
      )
      // requestAnimationFrame(draw)
    }
  }

  function preload(cb) {
    var images =  {
     floor: 'img/floor.png',
     wall: 'img/wall.png',
     player: 'img/player.png'
    }
    var loadedImages = {}
    var n = Object.keys(images).length

    for(imageName in images) {
      var img = new Image()
      img.onload = imageLoaded
      img.src = images[imageName]
      loadedImages[imageName] = img
    }

    function imageLoaded() {
      n--
      if(n === 0) cb(loadedImages)
    }
  }
}

//------CLASSES------//

function Game(width, height) {
  var tiles = []
  var tilesX = 40
  var tilesY = 40
  for(var i = 0; i < tilesY; i++) {
    tiles[i] = []
    for(var j = 0; j < tilesX; j++) {
      tiles[i][j] = 1
    }
  }

  tiles[10][10] = 0
  tiles[11][10] = 0
  tiles[12][10] = 0
  tiles[13][10] = 0
  tiles[14][10] = 0
  tiles[15][10] = 0
  
  this.width = width
  this.height = height

  this.offsetX = this.width / tiles[0].length
  this.offsetY = this.height / tiles.length

  this.tilesX = tilesX
  this.tilesY = tilesY

  this.tiles = tiles
}


function Player(game) {
  this.game = game
  this.pos = {
    x: 10,
    y: 10
  }
  this.speed = 1
}

Player.prototype.up = function () {
  this.pos.y--
}

Player.prototype.setTilePos = function (tileX, tileY) {
  this.pos.x = tileX*this.game.offsetX
  this.pos.y = tileY*this.game.offsetY
}

Player.prototype.getTilePos = function () {
  return {
    x: this.pos.x / this.offsetX,
    y: this.pos.y / this.offsetY
  }
}
