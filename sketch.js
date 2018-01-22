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
const MAX_X = WIDTH / Scale+1;
const MAX_Y = HEIGHT / Scale;
var RED;
var BLUE;
var CYAN;
var LIGHT_RED;
var LIGHT_BLUE;
var PF;
var counter;
var render = [];
var outlines = [];
var shapes = [];
var reddots = [];
var bluedots = [];

function setup() {
  createCanvas(WIDTH, HEIGHT);
  if (screen.width > 480) {
    select('canvas').center();
  } else {
    console.log(screen.width);
    select('canvas').style('width', '100%','!important');
    select('canvas').style('height', '100%','!important')
  }
  RED = color(255, 0, 0);
  BLUE = color(0, 0, 255);
  CYAN = color(0, 191, 255);
  LIGHT_RED = color(255, 0, 0, 40);
  LIGHT_BLUE = color(0, 0, 255, 40);
  console.log("MAX X: " + MAX_X + " MAX Y: " + MAX_Y + " SCALE " + Scale);

  reddots = matrixArray(MAX_X, MAX_Y);
  bluedots = matrixArray(MAX_X, MAX_Y);
  counter = 0;
}

function draw() {
  background(255);
  field();
  for (var d in render) {
    DotDisplay(render[d]);
  }
  if (outlines.length > 0) myRender();
}

class Dot {
  // var c;
  // var x, y, outline;
  // var type;
  // var status;
  constructor(type, x, y) {
    this.x = x;
    this.y = y;
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
  ellipse(a.x * Scale, a.y * Scale, DOTSIZE, DOTSIZE);
}

function mousePressed() {
  var X = round(mouseX / Scale);
  var Y = round(mouseY / Scale);
  // console.log('');
  // console.log("X " + X+ " Y " + Y);
  console.log('');
  if (X >= MAX_X || Y > MAX_Y || X < 0 || Y < 0) return;
  if (reddots[X][Y] == undefined && bluedots[X][Y] == undefined) {
    var type = (counter % 2 == 0) ? 1 : 2;
    var newdot = new Dot(type, X, Y);
    render.push(newdot);
    if (type == 1) reddots[X][Y] = newdot
    else bluedots[X][Y] = newdot;
    counter++;
    if (newdot.status != "Chained") {
      PF = new Pathfinder();
      path = PF.SearchPath(newdot);
      if (path != null) {
        for (var i = 0; i < path.length; i++) {
          if (path[0] != 'add') {
            path[i].status = "Chained";
            path[i].outline = outlines.length;
            console.log("Path " + i + " (" + path[i].x + "," + path[i].y + ")");
          } else {
            if (i == 0) i+=1;
            if (i == path.length - 1) break;
            path[i].status = "Chained";
            path[i].outline = path[path.length-1].outline;
            console.log("Path " + i + " (" + path[i].x + "," + path[i].y + ")");
          }
        }
        outlines.push(path);
      }
      console.log();
    }
  }
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
  line(0,HEIGHT-1,WIDTH,HEIGHT-1);
  line(WIDTH-1,0,WIDTH-1,HEIGHT)
}

function myRender() {
  strokeWeight(LINEWEIGHT);
  for (var i = 0; i < outlines.length; i++) {
    var col = outlines[i][1].c;
    stroke(col);
    for (var j = 0; j < outlines[i].length; j++) { // outline rendering
      if (outlines[i][j] == 'add') j+=1;
      if (outlines[i][0] == 'add' && j == outlines[i].length-1) break;
      var current = outlines[i][j];
      if (j != outlines[i].length - 1) {
        var next = outlines[i][j + 1];
        line(current.x * Scale, current.y * Scale, next.x * Scale, next.y * Scale);
      } else {
        var first = outlines[i][0];
        line(current.x * Scale, current.y * Scale, first.x * Scale, first.y * Scale);
      }
    }

    // generateShape(outlines[i])
  }
}

function generateShape(path) {
  beginShape();
  noFill();
  fillcolor = (path[1].type == "red") ? LIGHT_RED : LIGHT_BLUE;
  fill(fillcolor);
  noStroke();
  for (var i = 0; i < path.length; i++) {
    if (path[i] == 'add') i+=1;
    vertex(path[i].x*Scale, path[i].y*Scale);
  }
  endShape(CLOSE);
}

function Pathfinder() {

  this.start = 0;

  this.units = [];
  this.unitPaths = [];
  this.unitCounters = [];

  this.checked = [];
  this.path = [];
  this.counter = 0;
  this.chained = {}; // dictionary
  this.connectors = [];
  this.connectorPairs = {};

  this.restart = function(a) {
    this.start = 0;

    this.units = [];
    this.unitPaths = [];
    this.unitCounters = [];

    this.checked = [];
    this.path = [];
    this.counter = 0;
    this.chained = {}; // dictionary
    this.connectors = [];
    this.connectorPairs = {};
    console.log('');
    console.log('Restarted! Found better starter point');
  }
  this.isOverlap = function(a){
    for (outline in this.chained) {
      if (this.chained[outline].indexOf(a) != -1 && this.chained[outline].indexOf(this.start) != -1) {
        flag = true;
        var key = a.x + ' ' + a.y + ' ' + a.type;
        var startkey = this.start.x + ' ' + this.start.y + ' ' + this.start.type;
        var begin, end;
        for (i in this.connectorPairs[key]) if (this.connectorPairs[key][i].outline == outline) end = this.connectorPairs[key][i];
        for (i in this.connectorPairs[startkey]) if (this.connectorPairs[startkey][i].outline == outline) begin = this.connectorPairs[startkey][i];
        this.path.unshift('add',begin);
        this.path.push(end);
        return true;
      }
    }
    return false;
  }
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
        if (current != undefined && this.checked.indexOf(current) == -1 || current == this.start) { // self skipping and checked skipping || adding start
          if (current.status == "Chained") {
            var key = a.x + ' ' + a.y + ' ' + a.type;
            if (a != this.start && this.connectorPairs[this.start.x + ' ' + this.start.y + ' ' + this.start.type] == undefined) return ['Restart',a]; // restart condition
            console.log("Met chained dot from outline №" + current.outline);

            if (this.chained[current.outline] == undefined) this.chained[current.outline] = [];
            if (this.connectorPairs[key] == undefined) this.connectorPairs[key] = [];
            if (this.chained[current.outline].indexOf(a) == -1) {
              this.chained[current.outline].push(a);
              this.connectorPairs[key].push(current); // save dot from another outline for path chaining in the end
            }
            if (this.connectors.indexOf(a) == -1) this.connectors.push(a);
            console.log(this.chained);
            console.log(this.connectorPairs);
          } else {
            n.push(current);
          }
        }
      } catch (err) {
        console.log("Missed border dot");
      }
    }
    return n;
  };

  this.SearchPath = function(a) {
    this.counter++;
    console.log("");
    console.log("DOT " + this.counter +  " (" + a.x + "," + a.y + ")" );
    this.path.push(a);
    if (this.checked.indexOf(a) == -1) this.checked.push(a);
    if (this.units.indexOf(a) != -1) {
      this.path = this.unitPaths[this.unitPaths.length - 1].slice(0);
      this.counter = this.unitCounters[this.unitCounters.length - 1];
    } // for units
    if (this.counter == 1) this.start = a;
    var neighbors = this.neighbors(a);
    if (neighbors[0] == 'Restart') {
      this.restart();
      return this.SearchPath(neighbors[1]);
    }


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
      if (this.connectors.indexOf(a) != -1 && a != this.start) { // ПРИСТРОЙКА АТТЕНШН ПРИСТРОЙКА !
        if (this.isOverlap(a)) {
          console.log('Succeed');
          console.log(this.path);
          if (this.path.length == 5) { // анти-уродливые фигни
            var d12 = (abs(this.path[1].x - this.path[2].x) == 0) || (abs(this.path[1].y - this.path[2].y) == 0)
            var d23 = (abs(this.path[2].x - this.path[3].x) == 0) || (abs(this.path[2].y - this.path[3].y) == 0)
            var d34 = (abs(this.path[3].x - this.path[4].x) == 0) || (abs(this.path[3].y - this.path[4].y) == 0)
            if (d02 || d12 || d34) {return null}
          }
          return this.path;
        }
      }
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
        console.log("Couldn't find de way");
        return null;
      }
    }

    // Neighbor is appropriate
    if (this.connectors.indexOf(a) != -1 && a != this.start) {
      if (this.isOverlap(a)) {
        console.log('Succeed')
        console.log(this.path);
        if (this.path.length == 5) { // анти-уродливые фигни
          var d12 = (abs(this.path[1].x - this.path[2].x) == 0) || (abs(this.path[1].y - this.path[2].y) == 0)
          var d23 = (abs(this.path[2].x - this.path[3].x) == 0) || (abs(this.path[2].y - this.path[3].y) == 0)
          var d34 = (abs(this.path[3].x - this.path[4].x) == 0) || (abs(this.path[3].y - this.path[4].y) == 0)
          if (d02 || d12 || d34) {return null}
        }
        return this.path;
      }
    } else if (neighbors.indexOf(this.start) != -1 && this.counter > 3) {
      if (this.path.length == 4) { // анти-уродливые фигни
        var d02 = (abs(this.path[0].x - this.path[1].x) == 0) || (abs(this.path[0].y - this.path[1].y) == 0)
        var d12 = (abs(this.path[1].x - this.path[2].x) == 0) || (abs(this.path[1].y - this.path[2].y) == 0)
        var d23 = (abs(this.path[2].x - this.path[3].x) == 0) || (abs(this.path[2].y - this.path[3].y) == 0)
        if (d02 || d12 || d23) {return null}
      }
      console.log("Succeed. Found de way");
      return this.path;
    } else {
      console.log("Go ahead");
      return this.SearchPath(neighbor);
    }
  }
};
