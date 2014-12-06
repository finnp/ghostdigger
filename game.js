window.onload = function () {
  var canvas = document.createElement('canvas') // <canvas id="game"></canvas>
  canvas.id = 'game'
  var width = canvas.width = 640
  var height = canvas.height = 640
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

  var tiles = []
  var tilesX = 40
  var tilesY = 40
  for(var i = 0; i < tilesY; i++) {
    tiles[i] = []
    for(var j = 0; j < tilesX; j++) {
      tiles[i][j] = 1
    }
  }


  var offsetX = width / tiles[0].length
  var offsetY = height / tiles.length

  tiles[10][10] = 0
  tiles[11][10] = 0
  tiles[12][10] = 0
  tiles[13][10] = 0
  tiles[14][10] = 0
  tiles[15][10] = 0

  preload(startGame)

  function startGame(images) {
    var ticker = requestAnimationFrame(draw)
    function draw() {
      for(var i = 0; i < tilesY; i++)
        for(var j = 0; j < tilesX; j++) {
          var tileSprite =  tiles[i][j] ? images.wall : images.floor
          context.drawImage(tileSprite,
            Math.floor(offsetX * j),
            Math.floor(offsetY * i),
            Math.floor(offsetX),
            Math.floor(offsetY)
          )
       }
     }
  }

  function preload(cb) {
    var images =  {
     floor: 'img/floor.png',
     wall: 'img/wall.png'
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
