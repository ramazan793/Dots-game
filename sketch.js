function matrixArray(rows, columns) {
  var arr = new Array();
  for (var i = 0; i < rows; i++) {
    arr[i] = new Array();
    for (var j = 0; j < columns; j++) {
      arr[i][j] = undefined
    }
  }
  return arr;
}

var WIDTH = screen.width;
var HEIGHT = screen.height;
var Scale = WIDTH / 16;
if (screen.width > 480) {
  WIDTH = screen.width*0.7;
  Scale = WIDTH/30;
  HEIGHT = Math.round(screen.height*0.8/Scale)*Scale;
} else {
  HEIGHT = Math.round(screen.height*0.9/Scale)*Scale;
}

const DOTSIZE = Scale / 2.8;
const LINEWEIGHT = DOTSIZE / 6;
const MAX_X = WIDTH / Scale + 1;
const MAX_Y = HEIGHT / Scale;

var PF;
var counter;
var render = [];
var outlines = [];
var shapes = [];
var reddots = [];
var scoreRed = 0;
var scoreBlue = 0;
var bluedots = [];
var dragging = false;
var capturedEmpty = [];

function setup() {
  createCanvas(WIDTH, HEIGHT);
  if (screen.width > 480) {
    select('canvas').style('display','block');
    select('canvas').style('margin','0 auto');
  } else {
    select('canvas').style('width', '100%', '!important');
    select('canvas').style('height', '100%', '!important')
  }
  RED = color(255, 0, 0);
  BLUE = color(0, 0, 255);
  CYAN = color(0, 191, 255);
  LIGHT_RED = color('#ffd7d7');
  LIGHT_BLUE = color('#d7d7ff');
  // console.log("MAX X: " + MAX_X + " MAX Y: " + MAX_Y + " SCALE " + Scale);

  reddots = matrixArray(MAX_X, MAX_Y);
  bluedots = matrixArray(MAX_X, MAX_Y);
  counter = 0;
}

function draw() {
  background(255);
  myRender();
  for (var d in render) {
    DotDisplay(render[d]);
  }
}

class Dot {
  constructor(type, x, y) {
    this.x = x;
    this.y = y;
    this.isUnit = false;
    this.captured = false;
    this.status = 0;
    if (type == 1) {
      this.type = "red";
      this.c = RED;
    } else {
      this.type = "blue";
      this.c = BLUE;
    }
  }
  neighbors() {
    var n = [];
    for (var i = -1; i <= 1; i++) {
      for (var j = -1; j <= 1; j++) {
        try {
          if (reddots[this.x + i][this.y + j] != undefined) n.push(reddots[this.x + i][this.y + j]);
          if (bluedots[this.x + i][this.y + j] != undefined) n.push(bluedots[this.x + i][this.y + j]);
        } catch (err) {
          // console.log('Missed border dot');
        }
      }
    }
    return n;
  }
}

function DotDisplay(a) {
  stroke(a.c);
  fill(a.c);
  if (a.captured) strokeWeight(LINEWEIGHT*0.01)
    else strokeWeight(LINEWEIGHT);
  ellipse(a.x * Scale, a.y * Scale, DOTSIZE, DOTSIZE);
}

function mouseDragged() {
  if (abs(pmouseX - mouseX) > 10 || abs(pmouseY - mouseY) > 10) {
    dragging = true;
  }
}

function mouseReleased() {
  if (dragging) {
    dragging = false;
    return
  }
  var X = round(mouseX / Scale);
  var Y = round(mouseY / Scale);
  // // console.log('');
  // // console.log("X " + X+ " Y " + Y);

  if (X >= MAX_X || Y > MAX_Y || X < 0 || Y < 0) return;
  if (reddots[X][Y] == undefined && bluedots[X][Y] == undefined && capturedEmpty.indexOf(X+' '+Y) == -1) {
    var type = (counter % 2 == 0) ? 1 : 2;
    var newdot = new Dot(type, X, Y);
    render.push(newdot);
    if (type == 1) reddots[X][Y] = newdot
    else bluedots[X][Y] = newdot;
    counter++;


    var newdotNeighbors = newdot.neighbors();
    var mustSearch = [];
    mustSearch.push(newdot);
    Array.prototype.push.apply(mustSearch, newdotNeighbors);

    for (var i = 0; i < mustSearch.length; i++) {
      // console.log('');
      dot = mustSearch[i];
      if (dot.captured) continue;
      PF = new Pathfinder(dot);
      path = PF.SearchPath();
      if (path) {
        // console.log('Yes');
        for (var i = 0; i < path.length; i++) {
          path[i].status = "Chained";
          path[i].outline = outlines.length;
          // console.log("Path " + i + " (" + path[i].x + "," + path[i].y + ")");
        }
        outlines.push(path);
      }
      // console.log();

    }
    // // console.log('');
    // // console.log('');
    // var PF = new Pathfinder(reddots[3][3]);
    // var path = PF.SearchPath();
    // if (path.length > 0) outlines.push(path);
  }
  document.getElementById("RED").innerHTML = scoreRed;
  document.getElementById("BLUE").innerHTML = scoreBlue;
}

function field() {
  stroke(CYAN);
  strokeWeight(1);
  for (var i = 0; i < WIDTH; i += Scale) {
    line(i, 0, i, HEIGHT);
  }
  for (var i = 0; i < HEIGHT; i += Scale) {
    line(0, i, WIDTH, i);
  }
  line(0, HEIGHT - 1, WIDTH, HEIGHT - 1);
  line(WIDTH - 1, 0, WIDTH - 1, HEIGHT)
}

function myRender() {
  // shapes
  for (var i = 0; i < outlines.length; i++) {
    generateShape(outlines[i]);
  }
  //field
  field();
  // outline
  strokeWeight(LINEWEIGHT);
  for (var i = 0; i < outlines.length; i++) {
    var col = outlines[i][1].c;
    stroke(col);
    for (var j = 0; j < outlines[i].length; j++) { // outline rendering
      var current = outlines[i][j];
      if (j != outlines[i].length - 1) {
        var next = outlines[i][j + 1];
        line(current.x * Scale, current.y * Scale, next.x * Scale, next.y * Scale);
      } else {
        var first = outlines[i][0];
        line(current.x * Scale, current.y * Scale, first.x * Scale, first.y * Scale);
      }
    }
  }

}

function generateShape(path) {
  beginShape();
  fillcolor = (path[1].type == "red") ? LIGHT_RED : LIGHT_BLUE;
  fill(fillcolor);
  noStroke();
  for (var i = 0; i < path.length; i++) {
    vertex(path[i].x * Scale, path[i].y * Scale);
  }
  endShape(CLOSE);
}

function isAppropriate(path) {
  let min = 0;
  let max = 0;
  let Xmin = 0;
  let Xmax = 0;
  let flag = false;
  var xData = {};
  let typedots = (path[0].type != "red") ? reddots : bluedots;
  let reverse_typedots = (path[0].type == "red") ? reddots : bluedots;
  for (dot in path) {

    if (xData[path[dot].x] == undefined) {
      xData[path[dot].x] = [];
      xData[path[dot].x].push(path[dot].y);
    } else {
      xData[path[dot].x].push(path[dot].y);
      xData[path[dot].x].sort(function(a, b) {
        return b - a
      });
    }
    if (path[dot].y > path[max].y) max = dot;
    if (path[dot].y < path[min].y) min = dot;
    if (path[dot].x > path[Xmax].x) Xmax = dot;
    if (path[dot].x < path[Xmin].x) Xmin = dot;
  }

  var temp_captured = [];

  for (var i = path[min].y; i <= path[max].y; i++) {
    let dotsX = [];
    for (var j = 0; j < path.length; j++) {
      if (path[j].y == i) dotsX.push(path[j]);
    }
    dotsX.sort((a, b) => {
      return a.x - b.x
    })
    for (var j = dotsX[0].x; j <= dotsX[dotsX.length - 1].x; j++) {
      // // console.log('X: '+ j + 'Y: ' + i + typedots[j][i]);
      var between_cond = false;
      if (xData[j].length > 1) { // чтобы нормально определял окружённые точки
        between_cond = (xData[j][0] > i && i > xData[j][xData[j].length - 1]);
      }

      if (reddots[j][i] == undefined && bluedots[j][i] == undefined && between_cond)
        temp_captured.push(j + ' ' + i)

      if (reverse_typedots[j][i] != undefined && reverse_typedots[j][i].captured && between_cond) { // нахождение своих точек и обнуление вражеского счёта
        if (reverse_typedots[j][i].type == "red") scoreBlue--
          else scoreRed--;
        reverse_typedots[j][i].captured = false;
      }
      if (typedots[j][i] != undefined && !typedots[j][i].captured && between_cond) { // нахождение вражеских точек и увеличение счёта
        typedots[j][i].captured = true;
        if (typedots[j][i].type == "red") scoreBlue++
          else scoreRed++;
        flag = true;
      }
    }
  }
  // // console.log('Max x ' + path[Xmax].x + ' Min x ' + path[Xmin].x + ' Max y' + path[max].y + 'Min y' + path[min].y);
  // // console.log(debug);
  // console.log(xData);
  if (flag) {
    Array.prototype.push.apply(capturedEmpty,temp_captured);
  }
  return flag;
}

function Pathfinder(start) {

  this.start = start;
  this.came_from = matrixArray(MAX_X, MAX_Y);

  this.neighbors = function(a) {
    var n = [];
    var otherWays = [];
    var typedots = (a.type == "red") ? reddots : bluedots;
    var clock = [
      [1, -1],
      [0, -1],
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, 1],
      [1, 1],
      [1, 0]
    ]; // [8][2]
    for (var i = 0; i <= 7; i++) {
      try {
        var current = typedots[a.x + clock[i][0]][a.y + clock[i][1]];
        if (current != undefined && !current.captured || current == this.start) { // self skipping and checked skipping || adding start
          n.push(current);
          if (this.came_from[current.x][current.y] != undefined) {
            otherWays.push(current);
          }
        }
      } catch (err) {
        // console.log("Missed border dot");
      }
    }
    return [n, otherWays];
  };

  this.SearchPath = function() {
    var frontiers = [];
    frontiers.push(this.start);
    this.came_from[this.start.x][this.start.y] = [];

    while (frontiers.length > 0) {
      var current = frontiers.shift();
      // console.log('');
      // console.log('DOT ' + current.x + ' ' + current.y);
      // for (var j in this.came_from[current.x][current.y])
      //   // console.log(`Came from: (${this.came_from[current.x][current.y][j].x},${this.came_from[current.x][current.y][j].y})`);
      var neighbors = this.neighbors(current);
      if (neighbors.length == 2) {
        var otherWays = neighbors[1];
        // // console.log('Otherways: ');
      }
      neighbors = neighbors[0];

      //Found a way
      if (otherWays.length > 0) {
        for (var i = 0; i < otherWays.length; i++) {
          var dot = otherWays[i];
          if (this.came_from[current.x][current.y].indexOf(dot) != -1)
            continue;
          var path = this.came_from[current.x][current.y].slice(0);
          //creating a path:
          path.push(current);
          path.push(dot);
          var secondPart = this.came_from[dot.x][dot.y].slice(0);
          if (path[1] == secondPart[1])
            continue;
          secondPart.splice(0, 1);
          Array.prototype.push.apply(path, secondPart.reverse());

          if (isAppropriate(path)) {
            // // console.log('May found a way between (' + current.x + ',' + current.y + ') and (' + dot.x + ',' + dot.y + ')');
            // for (var j in path) // console.log(`Path ${j} : (${path[j].x},${path[j].y})`);
            return path;
          }
        }
      }

      for (i in neighbors) {
        var next = neighbors[i];
        if (otherWays.indexOf(next) == -1) {
          this.came_from[next.x][next.y] = [];
          Array.prototype.push.apply(this.came_from[next.x][next.y], this.came_from[current.x][current.y]);
          this.came_from[next.x][next.y].push(current);
          frontiers.push(next);
        }
      }

    }
    return false;
  }
};
