window.onload = function () {
  var canvas = document.createElement('canvas') // <canvas id="game"></canvas>
  canvas.id = 'game'

  canvas.width = 640
  canvas.height = 640

  var game = new Game(canvas.width, canvas.height)
  game.controller = new Controller()

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
  player.setTilePos(10, 10)
  game.tiles[10][10].isWall = false
  game.tiles[11][10].isWall = false
  game.tiles[12][10].isWall = false
  game.tiles[13 ][10].isWall = false

  preload(startGame)

  function startGame(images) {
    console.log('startGame')
    requestAnimationFrame(draw)
    function draw(timestamp) {
      player.update()
      for(var i = 0; i < game.tilesY; i++) {
        for(var j = 0; j < game.tilesX; j++) {
            var tileSprite =  game.tiles[i][j].isWall ? images.wall : images.floor
            context.drawImage(tileSprite,
              Math.floor(game.offsetX * j),
              Math.floor(game.offsetY * i),
              Math.floor(game.offsetX),
              Math.floor(game.offsetY)
            )
         }
      }
      context.drawImage(images.player,
        player.pos.x, player.pos.y, game.offsetX, game.offsetY
      )
      requestAnimationFrame(draw)
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

//GAME
function Game(width, height) {
  var tiles = []
  var tilesX = 40
  var tilesY = 40
  for(var i = 0; i < tilesY; i++) {
    tiles[i] = []
    for(var j = 0; j < tilesX; j++) {
      tiles[i][j] = new Tile()
    }
  }


  this.width = width
  this.height = height

  this.offsetX = this.width / tiles[0].length
  this.offsetY = this.height / tiles.length

  this.tilesX = tilesX
  this.tilesY = tilesY

  this.tiles = tiles
}

//PLAYER
function Player(game) {
  this.game = game
  this.pos = {
    x: 10,
    y: 10
  }
  this.speed = 1
}

Player.prototype.update = function () {
  this.move()
  if(this.game.controller.keys.space.down) this.destroyTile()
}

Player.prototype.move = function () {
  if(this.game.controller.move) {
    var nextTile = this.nextTile()
    if(!nextTile.isWall) {
      this.pos.x += this.speed * this.game.controller.direction.x
      this.pos.y += this.speed * this.game.controller.direction.y
    }
  }
}

Player.prototype.nextTile = function () {
  var tilePos = this.getTilePos()
  return this.game.tiles[tilePos.y + this.game.controller.direction.y][tilePos.x + this.game.controller.direction.x]
}

Player.prototype.destroyTile = function () {
  this.nextTile().destroy()
}

Player.prototype.setTilePos = function (tileX, tileY) {
  this.pos.x = tileX*this.game.offsetX
  this.pos.y = tileY*this.game.offsetY
}

Player.prototype.getTilePos = function () {
  return {
    x: Math.round(this.pos.x / this.game.offsetX),
    y: Math.round(this.pos.y / this.game.offsetY)
  }
}
  
// TILE
function Tile(game) {
  this.isWall = true
  this.gold = 0
  this.isDestructible = true
}

Tile.prototype.destroy = function () {
  if(this.isDestructible){
    this.isWall = false
    this.isDestructible = false
  }
  return this.isWall
}



//CONTROLLER
function Controller() {
  this.keys = {
    left:  {
      keyCode: 37,
      down: false
    },
    right: {
      keyCode: 39,
      down: false
    },
    up: {
      keyCode: 38,
      down: false
    },
    down: {
      keyCode: 40,
      down: false
    },
    space: {
      keyCode: 32,
      down: false
    }
  }

  this.direction = {x: 0, y: 0}

  var directions = {
    left: {x: -1, y: 0},
    right: {x: 1, y: 0},
    up: {x: 0, y: -1},
    down: {x: 0, y: 1},
  }
  this.move = false

  document.addEventListener('keydown', function (e) {
    for(keyType in this.keys) {
      if(this.keys[keyType].keyCode === e.keyCode) {
        e.preventDefault()
        this.keys[keyType].down = true
        if(directions[keyType]) {
          this.direction = directions[keyType]
          this.move = true
        }
          
      }
    }
  }.bind(this))

  document.addEventListener('keyup', function (e) {
    for(keyType in this.keys) {
      if(this.keys[keyType].keyCode === e.keyCode) {
        e.preventDefault()
        this.keys[keyType].down = false
        if(directions[keyType]) {
          this.direction = directions[keyType]
          this.move = false
        }
      }
    }
  }.bind(this))
}
