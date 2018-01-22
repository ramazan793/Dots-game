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
if (screen.width > 480) {
  WIDTH = 900;
  HEIGHT = 586;
}

const Scale = WIDTH / 20;
const DOTSIZE = Scale / 3;
const LINEWEIGHT = DOTSIZE / 3;
const MAX_X = WIDTH / Scale + 1;
const MAX_Y = HEIGHT / Scale;

var PF;
var counter;
var render = [];
var outlines = [];
var shapes = [];
var reddots = [];
var scoreRed = 0;
var scoreBlue =0;
var bluedots = [];

function setup() {
  createCanvas(WIDTH, HEIGHT);
  if (screen.width > 480) {
    select('canvas').center();
  } else {
    console.log(screen.width);
    select('canvas').style('width', '100%', '!important');
    select('canvas').style('height', '100%', '!important')
  }
  RED = color(255, 0, 0);
  BLUE = color(0, 0, 255);
  CYAN = color(0, 191, 255);
  LIGHT_RED = color('#ffd7d7');
  LIGHT_BLUE = color('#d7d7ff');
  console.log("MAX X: " + MAX_X + " MAX Y: " + MAX_Y + " SCALE " + Scale);

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
    this.captured = false;
    // this.status = 0;
    if (type == 1) {
      this.type = "red";
      this.c = RED;
    } else {
      this.type = "blue";
      this.c = BLUE;
    }
  }
}

function DotDisplay(a) {
  stroke(a.c);
  fill(a.c);
  if (a.captured) strokeWeight(1)
  else strokeWeight(LINEWEIGHT);
  ellipse(a.x * Scale, a.y * Scale, DOTSIZE, DOTSIZE);
}

function mousePressed() {
  var X = round(mouseX / Scale);
  var Y = round(mouseY / Scale);
  // console.log('');
  // console.log("X " + X+ " Y " + Y);

  if (X >= MAX_X || Y > MAX_Y || X < 0 || Y < 0) return;
  if (reddots[X][Y] == undefined && bluedots[X][Y] == undefined) {
    var type = (counter % 2 == 0) ? 1 : 2;
    var newdot = new Dot(type, X, Y);
    render.push(newdot);
    if (type == 1) reddots[X][Y] = newdot
    else bluedots[X][Y] = newdot;
    counter++;
  }

  for (i in render) {
    console.log('');
    dot = render[i];
    if (dot.status != "Chained" && !dot.captured) {
      PF = new Pathfinder();
      path = PF.SearchPath(dot);
      if (path) {
        for (var i = 0; i < path.length; i++) {
          path[i].status = "Chained";
          path[i].outline = outlines.length;
          console.log("Path " + i + " (" + path[i].x + "," + path[i].y + ")");
        }
        outlines.push(path);
      }
      console.log();
    }
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

function isAppropriate(path){
  let min = 0;
  let max = 0;
  let flag = false;
  let typedots = (path[0].type != "red") ? reddots : bluedots;
  for (dot in path) {
    if (path[dot].y > path[max].y) max = dot;
    if (path[dot].y < path[min].y) min = dot;
  }

  for (var i = path[min].y; i <= path[max].y; i++){
    let dotsX = [];
    for (var j = 0; j < path.length; j++) {
      if (path[j].y == i) dotsX.push(path[j]);
    }
    dotsX.sort((a,b) => { return a.x - b.x})
    for (var j = dotsX[0].x; j <= dotsX[dotsX.length-1].x; j++)
    if (typedots[j][i] != undefined && !typedots[j][i].captured) {
      typedots[j][i].captured = true;
      if (typedots[j][i].type == "red") scoreBlue++
      else scoreRed++;
      flag = true;
    }
  }
  return flag;
}

function Pathfinder() {

  this.start = 0;

  this.units = [];
  this.unitPaths = [];
  this.unitCounters = [];

  this.checked = [];
  this.path = [];
  this.counter = 0;

  this.neighbors = function(a) {
    var n = [];
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
        if (current != undefined  && !current.captured && this.checked.indexOf(current) == -1 || current == this.start) // self skipping and checked skipping || adding start
          n.push(current);
      } catch (err) {
        console.log("Missed border dot");
      }
    }
    return n;
  };

  this.SearchPath = function(a) {
    this.counter++;
    console.log("");
    console.log("DOT " + this.counter + " (" + a.x + "," + a.y + ")");
    this.path.push(a);
    if (this.checked.indexOf(a) == -1) this.checked.push(a);
    if (this.units.indexOf(a) != -1) {
      this.path = this.unitPaths[this.unitPaths.length - 1].slice(0);
      this.counter = this.unitCounters[this.unitCounters.length - 1];
    } // for units
    if (this.counter == 1) this.start = a;
    var neighbors = this.neighbors(a);

    if (neighbors.length >= 2 && this.units.indexOf(a) == -1) { // unit checking
      if (neighbors.indexOf(this.start) != -1) {
        if (neighbors.length >= 3) {
          console.log("Added unit (" + a.x + "," + a.y + ")");
          this.units.push(a);
          this.unitPaths.push(this.path.slice(0));
          this.unitCounters.push(this.counter);
        }
      } else {
        console.log("Added unit (" + a.x + "," + a.y + ")");
        this.units.push(a);
        this.unitPaths.push(this.path.slice(0));
        this.unitCounters.push(this.counter);
      }
    }
    var neighbor = (neighbors.length > 0) ? neighbors[0] : null;

    if (this.units.indexOf(a) != -1) {
      console.log("Current dot is a unit (" + a.x + "," + a.y + ")");
      var i = 0;
      while (this.checked.indexOf(neighbor) != -1 && i + 1 != neighbors.length) { // select appropriate dot
        i++;
        neighbor = neighbors[i];
      }
    }
    if (neighbor == this.start && neighbors.length > 1 && this.units.indexOf(a) == -1) neighbor = neighbors[1]; // if not unit and neighbor is a start dot

    // Didn't find
    if (this.checked.indexOf(neighbor) != -1 && (neighbor != this.start && this.counter > 3) || neighbor == null || (neighbor == this.start && this.counter < 4)) { // if dot is inappropriate go ahead (or if unit completed)
      if (this.units.indexOf(a) != -1) { // if unit has been completed delete it
        console.log("Unit completed");
        this.units.pop();
        this.unitPaths.pop();
        this.unitCounters.pop();
      }
      if (this.units.length > 0) { // Try unit
        console.log("Back to the unit (" + this.units[this.units.length - 1].x + "," + this.units[this.units.length - 1].y + ")");
        return this.SearchPath(this.units[this.units.length - 1]);
      } else { // Give up
        console.log("Couldn't find de wey");
        return false
      }
    }

    // Neighbor is appropriate
    if (neighbors.indexOf(this.start) != -1 && this.counter > 3) {
      // if (this.path.length == 4) { // анти-уродливые фигни
      //   var d02 = (abs(this.path[0].x - this.path[1].x) == 0) || (abs(this.path[0].y - this.path[1].y) == 0)
      //   var d12 = (abs(this.path[1].x - this.path[2].x) == 0) || (abs(this.path[1].y - this.path[2].y) == 0)
      //   var d23 = (abs(this.path[2].x - this.path[3].x) == 0) || (abs(this.path[2].y - this.path[3].y) == 0)
      //   if (d02 || d12 || d23) {
      //     return false
      //   }
      // }
      console.log("Succeed. Found de wey");
      console.log("Appropriate? ");
      if (isAppropriate(this.path)) return this.path
      else return false
    } else {
      console.log("Go ahead");
      return this.SearchPath(neighbor);
    }
  }
};
