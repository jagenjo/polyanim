
var project = new POLYANIM.Project();
project.demo();

var canvas = document.querySelector("canvas")
var EDITOR = new POLYANIM.Editor(canvas, project)

function init()
{
    EDITOR.init()
    loop()
}

function loop()
{
    requestAnimationFrame(loop);
    canvas.width = document.body.offsetWidth;
    canvas.height = document.body.offsetHeight;
    EDITOR.draw();
}

