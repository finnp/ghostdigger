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
  var controller = new Controller(player)

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

      // draw player
      context.save()
      context.translate(player.pos.x, player.pos.y)
      context.translate(game.offsetX / 2, game.offsetY / 2)
      context.rotate(player.angle())
      context.drawImage(images.player,
        -game.offsetX / 2, -game.offsetY / 2, game.offsetX, game.offsetY
      )
      context.restore()
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

Game.prototype.getTile = function(x, y) {
  return this.tiles[Math.floor(y / this.offsetY)][Math.floor(x / this.offsetX)]
}

//PLAYER
function Player(game) {
  this.game = game
  this.pos = {
    x: 10,
    y: 10
  }

  this.moving = false

  this.width = this.game.offsetX
  this.height = this.game.offsetY

  this.direction = {x: 1, y: 0}
}

Player.prototype.update = function () {
  if(this.moving) this.move()
  if(this.mine) this.destroyTile()
}

Player.prototype.move = function () {
  var corners = this.getCorners()
  var leftShoulder, rightShoulder
  if(this.direction.x === 1){ // if right
    leftShoulder = corners.topRight
    rightShoulder = corners.bottomRight
  }
  else if(this.direction.x === -1){ // if left
    leftShoulder = corners.bottomLeft
    rightShoulder = corners.topLeft
  }
  else if(this.direction.y === 1){ // if down
    leftShoulder = corners.bottomRight
    rightShoulder = corners.bottomLeft
  }
  else if(this.direction.y === -1){ // if up
    leftShoulder = corners.topLeft
    rightShoulder = corners.topRight
  }

  var leftTile = this.game.getTile(
    leftShoulder.x + this.direction.x,
    leftShoulder.y + this.direction.y
  )
  var rightTile = this.game.getTile(
    rightShoulder.x + this.direction.x,
    rightShoulder.y + this.direction.y
  )


  if(!(leftTile.isWall || rightTile.isWall)) {
    this.pos.x += this.direction.x
    this.pos.y += this.direction.y
  }
}

Player.prototype.getCorners = function () {
  return {
    topLeft: {x: this.pos.x, y: this.pos.y},
    topRight: {x: this.pos.x + this.game.offsetX -1, y: this.pos.y},
    bottomLeft: {x: this.pos.x, y: this.pos.y + this.game.offsetY-1},
    bottomRight: {x: this.pos.x + this.game.offsetX-1, y: this.pos.y + this.game.offsetY-1}
  }
}


Player.prototype.getCenter = function () {
  return {
    x: this.pos.x + this.width / 2,
    y: this.pos.y + this.height / 2
  }
}

Player.prototype.angle = function () {
  var angle = 0
  if(this.direction.x === 1) angle = Math.PI / 2
  else if(this.direction.x === -1) angle = 3 * Math.PI / 2
  else if(this.direction.y === 1) angle = 2 * Math.PI / 2
  // else if(this.direction.y === -1) angle = 0
  return angle
}

Player.prototype.nextTile = function () {
  var tilePos = this.getTilePos()
  return this.game.tiles[tilePos.y + this.direction.y][tilePos.x + this.direction.x]
}

Player.prototype.destroyTile = function () {
  this.nextTile().destroy()
}

Player.prototype.setTilePos = function (tileX, tileY) {
  this.pos.x = tileX*this.game.offsetX
  this.pos.y = tileY*this.game.offsetY
}

Player.prototype.getTilePos = function () {
  var center = this.getCenter()
  return {
    x: Math.floor(center.x / this.game.offsetX),
    y: Math.floor(center.y / this.game.offsetY)
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
function Controller(player) {
  var directions = {
    37: {x: -1, y: 0},
    39: {x: 1, y: 0},
    38: {x: 0, y: -1},
    40: {x: 0, y: 1},
  }
  this. player = player
  this.player.moving = false

  document.addEventListener('keydown', function (e) {
    e.preventDefault()
    if(e.keyCode in directions) {
      this.player.direction = directions[e.keyCode]
      this.player.moving = true
    }
    else if(e.keyCode == 32) {
      this.player.mine = true
    }
  }.bind(this))

  document.addEventListener('keyup', function (e) {
    e.preventDefault()
    if(e.keyCode in directions) {
      this.player.moving = false
    }
    else if(e.keyCode == 32) {
      this.player.mine = false
    }
  }.bind(this))
}
