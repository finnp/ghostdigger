window.onload = function () {
  var canvas = document.createElement('canvas') // <canvas id="game"></canvas>
  canvas.id = 'game'

  canvas.width = 800
  canvas.height = 640

  var game = new Game(canvas.width, canvas.height)
  document.body.appendChild(canvas)
  if(typeof canvas == 'string') canvas = getElementById(canvas.id) // in case browser returns string
  game.context = canvas.getContext('2d')


  game.loadImages(function () {
    game.start()
  })
}

//------CLASSES------//

//GAME
function Game(width, height) {
  this.width = width
  this.height = height

  this.tilesX = 50
  this.tilesY = 40

  this.offsetX = this.width / this.tilesX
  this.offsetY = this.height / this.tilesY
}

Game.prototype.loadImages = function (cb) {
  var toLoad =  {
    floor: 'img/floor.png',
    wall: 'img/wall.png',
    player: 'img/player.png',
    fog: 'img/fog.png',
    gold: 'img/gold.png',
    ghost: 'img/ghost.png',
    stone: 'img/stone.png'
  }
  this.images = {}
  var n = Object.keys(toLoad).length
  
  for(imageName in toLoad) {
    var img = new Image()
    img.onload = imageLoaded
    img.src = toLoad[imageName]
    this.images[imageName] = img
  }
  
  function imageLoaded() {
    n--
    if(n === 0) cb()
  }
}

Game.prototype.start = function () {
  //tiles
  this.openTiles = 0  
  this.tiles = []
  for(var i = 0; i < this.tilesY; i++) {
    this.tiles[i] = []
    for(var j = 0; j < this.tilesX; j++) {
      var newTile = new Tile(this, j, i)
      this.tiles[i][j] = newTile
      if(i === 0 || j === 0 || i === (this.tilesY - 1) || j === (this.tilesX - 1))
        newTile.isDestructible = false
    }
  }
  
  this.player = new Player(this)
  this.player.sprite = this.images.player
  
  this.controller = new Controller(this.player)
  this.enemies = []
  
  if(this.req) cancelAnimationFrame(this.req)
  this.req = requestAnimationFrame(this.loop.bind(this))

}

Game.prototype.loop = function (timestamp) {
  // GameLoop
  this.timestamp = timestamp
  
  this.update(timestamp)
  this.draw(timestamp)
  
  // end
  this.req = requestAnimationFrame(this.loop.bind(this))
}

Game.prototype.update = function (timestamp) {
  this.collision(this.player)
  this.controller.update(timestamp)
  this.player.update(timestamp)
  this.enemies.forEach(function (enemy) {
    enemy.update(timestamp)
  })
}

Game.prototype.draw = function(timestamp) {
  var images = this.images
  for(var i = 0; i < this.tilesY; i++) {
    for(var j = 0; j < this.tilesX; j++) {
      var tileSprite
      var tile = this.tiles[i][j]
      if(tile.isWall) {
        if(tile.discovered) {
          if(!tile.isDestructible) {
            tileSprite = images.stone
          } else if(tile.gold > 0) {
            tileSprite = images.gold
          } else {
            tileSprite = images.wall
          }
        } else {
          tileSprite = images.fog
        }
      } else {
        tileSprite = images.floor
      }
      
      this.context.drawImage(tileSprite,
        Math.floor(this.offsetX * j),
        Math.floor(this.offsetY * i),
        Math.floor(this.offsetX),
        Math.floor(this.offsetY)
      )
    }
  }
  
  var context = this.context
  
  // draw player
  this.player.render(context)
  
  this.enemies.forEach(function (enemy) {
    enemy.render(context)
  })
  
  // display
  
  context.fillStyle = 'yellow'
  context.font = 'bold 16px Arial'
  context.fillText(this.player.gold + ' gold', this.width - 70, this.height - 20)
  context.fillText(this.openTiles + ' open', this.width - 70, this.height - 60)
  
  if(this.gameover) {
    context.fillStyle = 'white'
    context.font = 'bold 100px Arial'
    context.fillText('Game Over!', 100, this.height/2)
  }
  
}

Game.prototype.getTile = function(tileX, tileY) {
  return this.tiles[Math.floor(y / this.offsetY)][Math.floor(x / this.offsetX)]
}

Game.prototype.collision = function (player) {
  this.enemies.forEach(function (enemy) {
    if(enemy.pos.x === player.pos.x && enemy.pos.y === player.pos.y) {
      this.gameover = true
    }
  }.bind(this))
}

Game.prototype.spawnEnemy = function(pos){
  var enemy = new Enemy(this)
  enemy.pos = pos
  enemy.sprite = this.images.ghost
  this.enemies.push(enemy)
}

Game.prototype.randomSpawnEnemy = function (pos) {
  var size = this.tilesX * this.tilesY
  var ghostProbability = (this.openTiles / (size*4))
  if(Math.random() < ghostProbability) {
    this.spawnEnemy(pos)
  }
}

// CHARACTER

function Character(game) {
  this.game = game
}

Character.prototype.render = function (context) {
  context.save()
  context.translate(this.pos.x * this.width, this.pos.y * this.height)
  context.translate(this.width / 2, this.height / 2)
  context.rotate(this.angle())
  context.drawImage(this.sprite,
    -this.width / 2, -this.height / 2, this.width, this.height
  )
  context.restore()
}

Character.prototype.angle = function () {
  var angle = 0
  if(this.direction.x === 1) angle = Math.PI / 2
  else if(this.direction.x === -1) angle = 3 * Math.PI / 2
  else if(this.direction.y === 1) angle = 2 * Math.PI / 2
        // else if(this.direction.y === -1) angle = 0
  return angle
}

Character.prototype.getTile = function (offsetX, offsetY) {
  return this.game.tiles[this.pos.y + offsetY][this.pos.x + offsetX]
}

Character.prototype.nextTile = function () {
  return this.getTile(this.direction.x, this.direction.y)
}

Character.prototype.behindTile = function () {
  return this.getTile(-this.direction.x, -this.direction.y)
}

//PLAYER
function Player(game) {
  Character.call(game)
  this.timeout = 0
  this.stepTime = 100 // ms
  this.gold = 0
  this.game = game
  this.pos = {
    x: 1 + Math.floor(Math.random()*(this.game.tilesX-2)),
    y: 1 + Math.floor(Math.random()*(this.game.tilesY-2))
  }
  this.game.tiles[this.pos.y][this.pos.x].destroy()

  this.width = this.game.offsetX
  this.height = this.game.offsetY

  this.direction = {x: 1, y: 0}
}

Player.prototype = Object.create(Character.prototype)

Player.prototype.update = function () {
 // nope
}

Player.prototype.move = function () {
  var isEnemy = this.game.enemies.some(function (enemy) {
    if(enemy.active) return false
    return enemy.pos.x === this.pos.x + this.direction.x &&
      enemy.pos.y === this.pos.y + this.direction.y
  }.bind(this))
  if(!this.nextTile().isWall && !isEnemy) {
    this.pos.x += this.direction.x
    this.pos.y += this.direction.y
  }
}

Player.prototype.mine = function () {
  var next = this.nextTile()
  if (next.isDestructible){
    this.gold += next.gold
    this.game.randomSpawnEnemy(Object.create(next.pos))
    next.destroy()
  }

}

// ENEMY

function Enemy(game) {
  this.game = game
  this.sprite = this.game.images.ghost
  Character.call(game)
  this.pos = {
    x: 10,
    y: 12
  }

  // this should be somewhere else?
  this.directions = [
    {x: -1, y: 0},
    {x: 1, y: 0},
    {x: 0, y: -1},
    {x: 0, y: 1}
  ]

  this.width = game.offsetX
  this.height = game.offsetY

  this.direction = this.directions[0]
  this.timeout = this.game.timestamp + 3000
  this.stepTime = 100
  this.active = false

}

Enemy.prototype = Object.create(Character.prototype)

Enemy.prototype.update = function (timestamp) {
  if(timestamp > this.timeout) {
    if (!this.active) this.active = true
    this.timeout = timestamp + this.stepTime
    var current = this.getTile(0, 0)
    var behind = this.behindTile()
    var possibleTiles = []
    current.getDirectNeighbours().forEach(function (neighbour) {
      if(!neighbour.isWall && (neighbour.x !== behind.x || neighbour.y !== behind.y)) {
        possibleTiles.push(neighbour)
      }
    })
    var nextTile
    if(possibleTiles.length === 0) nextTile = behind
    else nextTile = possibleTiles[Math.floor(Math.random()*possibleTiles.length)]
    this.direction.x = nextTile.x - this.pos.x
    this.direction.y = nextTile.y - this.pos.y

    this.move()
  }

}

Enemy.prototype.move = function () {
  this.pos.x += this.direction.x
  this.pos.y += this.direction.y
}


// TILE
function Tile(game, x, y) {
  this.game = game
  this.tiles = game.tiles
  this.x = x
  this.y = y
  this.pos = {x: x, y: y}
  this.isWall = true
  this.gold = Math.random() < 0.05
  this.isDestructible = Math.random() < 0.95
  this.discovered = false
}

Tile.prototype.destroy = function () {

  this.game.openTiles += 1
  this.isWall = false
  this.isDestructible = false

  this.getNeighbours().forEach(function (neighbour) {
    neighbour.discovered = true
  })
  return this.isWall
}

Tile.prototype.getNeighbours = function () {
  return [
    this.tiles[this.y + 1][this.x],
    this.tiles[this.y + 1][this.x + 1],
    this.tiles[this.y + 1][this.x - 1],
    this.tiles[this.y][this.x + 1],
    this.tiles[this.y][this.x - 1],
    this.tiles[this.y - 1][this.x],
    this.tiles[this.y - 1][this.x + 1],
    this.tiles[this.y - 1][this.x - 1]
  ]
}
Tile.prototype.getDirectNeighbours = function () {
  return [
    this.tiles[this.y + 1][this.x],
    this.tiles[this.y][this.x + 1],
    this.tiles[this.y][this.x - 1],
    this.tiles[this.y - 1][this.x]
  ]
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

  this.keysPressed = {}

  this.doMine = false

  document.addEventListener('keydown', function (e) {
    e.preventDefault()
    this.keysPressed[e.keyCode] = true
    if(e.keyCode in directions) {
      this.player.direction = directions[e.keyCode]
    }
    if(this.isSpace()) this.doMine = true

  }.bind(this))

  document.addEventListener('keyup', function (e) {
    e.preventDefault()
    this.keysPressed[e.keyCode] = false
  }.bind(this))
}

Controller.prototype.update = function (timestamp) {
  if(timestamp > this.player.timeout) {
    if(this.doMine) {
      this.doMine = false
      this.player.mine()
    }
    if(this.areArrowsPressed()) this.player.move()
    this.player.timeout = timestamp + this.player.stepTime
  }
}

Controller.prototype.isSpace = function () {
  return this.keysPressed[32]
}

Controller.prototype.areArrowsPressed = function () {
  return this.keysPressed[37] || this.keysPressed[38] || this.keysPressed[39] || this.keysPressed[40]
}
