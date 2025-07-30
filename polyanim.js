
function toPairs(a) {
    let r = []
    for(let i = 0; i < a.length; i+=2)
        r.push([a[i],a[i+1]])
    return r
}

function addV2(a,b) { return [a[0]+b[0],a[1]+b[1]]}
function subV2(a,b) { return [a[0]-b[0],a[1]-b[1]]}
function lengthV2(a) { return Math.sqrt( Math.pow(a[0],2) + Math.pow(a[1],2))}
function normV2(a) { let l = lengthV2(a); return [a[0]/l,a[1]/l]}
function angleV2(a) { return Math.atan2(a[0],a[1])}
function lerpV2(a,b,f) { return [a[0]*(1-f)+b[0]*f,a[1]*(1-f)+b[1]*f]}

function optimiziceShape( s, minDiff = Infinity, selected )
{
    const l = s.points.length
    const n = selected ? selected.length : l
    let smallest = -1;
    for(let j = 0; j < n; j++)
    {
        const i = selected ? selected[j] : j
        const prevp = s.points[i === 0 ? l-1 : i-1]
        const p = s.points[i]
        const postp = s.points[(i+1)%l]
        if(!prevp || !p || !postp) continue
        const deltaPrev = subV2(p,prevp)
        const deltaPost = subV2(p,postp)
        const diff = lengthV2( addV2(deltaPrev,deltaPost) )
        if(diff > minDiff)
            continue
        minDiff = diff
        smallest = i
    }

    if(smallest !== -1)
    {
        s.points.splice(smallest,1)
        if(selected)
        {
            const index = selected.findIndex(v=>v===smallest)
            if(index !== -1)
            {
                selected.splice(index,1)
                for(let i = 0; i < selected.length; i++)
                    if(selected[i] > smallest)
                        selected[i]--
            }
        }
    }

    return minDiff
}

function relaxShape(s, f, selected = null)
{
    const l = s.points.length
    const n = selected ? selected.length : l
    for(let j = 0; j < n; j++)
    {
        const i = selected ? selected[j] : j
        const prevp = s.points[i === 0 ? l-1 : i-1]
        const p = s.points[i]
        const postp = s.points[(i+1)%l]
        const mid = lerpV2(prevp,postp,0.5)
        const v = lerpV2(p,mid,f)
        p[0] = v[0]
        p[1] = v[1]
    }
}

function subdivideShape(s)
{
    const l = s.points.length
    const out = []
    for(let i = 0; i < l; i++)
    {
        const p = s.points[i]
        const postp = s.points[(i+1)%l]
        const mid = lerpV2(p,postp,0.5)
        out.push(p,mid)
    }
    s.points = out
}

function findNearestPoint(shape, x,y,maxDist=5){
    let nearest = -1
    let nearestDist = Infinity
    for(let i = 0; i < shape.points.length; i++)
    {
        const p = shape.points[i]
        let dist = Math.sqrt( Math.pow(x - p[0],2) + Math.pow(y - p[1],2))
        if(dist < maxDist && dist < nearestDist)
        {
            nearest = i
            nearestDist = dist
        }
    }
    return nearest
}

function findClosestEdge(shape, x,y, maxDist=10)
{
    for(let i = 0, l = shape.points.length; i < l; i++)
    {
        const A = shape.points[i]
        const B = shape.points[(i+1)%l]
        let mx = (A[0]+B[0])/2
        let my = (A[1]+B[1])/2
        let dist = Math.sqrt( Math.pow(x - mx,2) + Math.pow(y - my,2))
        if(dist < maxDist)
            return i;
    }
    return -1
}

function findPointsInside(shape, x,y, radius)
{
    let out = []
    for(let i = 0, l = shape.points.length; i < l; i++)
    {
        const A = shape.points[i]
        let dist = Math.sqrt( Math.pow(x - A[0],2) + Math.pow(y - A[1],2))
        if(dist < radius)
            out.push(i)
    }
    return out
}


class Shape {
    id = -1
    type = 0 //polygon, line, points
    color = 0
    points = []
    constructor(color, points)
    {
        if(color !== undefined)
            this.color = color;
        if(points !== undefined)
            this.points = points;
    }

    toJSON(){ return {id: this.id, type: this.type, color: this.color, points: this.points.flat() } }
    fromJSON(o){ this.id = o.id; this.type = o.type; this.color = o.color; this.points = toPairs(o.points); return this }
}

class Group {
    shapes = []
}

class Frame {
    last_id = -1
    bgcolor = 0
    shapes = []
    add(s){this.shapes.push(s); if(s.id === -1) s.id = ++this.last_id; return s}
    clear(){this.shapes=[]}
    findShapeAtPosition(x,y){ for(let i = this.shapes.length-1; i >= 0; i--) if(isPointInShape(x,y,this.shapes[i].points)) return this.shapes[i]; return null}
    getShape(id){ return this.shapes.find(s=>s.id===id)}
    toJSON(){ return {last_id: this.last_id, bgcolor: this.bgcolor, shapes: this.shapes.map(s=>s.toJSON()) } }
    fromJSON(o){ this.last_id = o.last_id; this.bgcolor = o.bgcolor; this.shapes = o.shapes.map(o=>(new Shape()).fromJSON(o)); return this }
}

class Project {
    size = [320,240]
    items = []
    frames = []
    palette = ["#000000","#1D2B53","#7E2553","#008751","#AB5236","#5F574F","#C2C3C7","#FFF1E8","#FF004D","#FFA300","#FFEC27","#00E436","#29ADFF","#83769C","#FF77A8","#FFCCAA"]
    add(f){this.frames.push(f)}
    clear(){ this.frames.length = 1; this.frames[0].clear() }
    toJSON(){ return { palette: this.palette, frames: this.frames.map(f=>f.toJSON()) } }
    fromJSON(o) { this.palette = o.palette; this.frames = o.frames.map(f=>(new Frame()).fromJSON(f)); return this }
}

Project.prototype.demo = function()
{
    const frame = new Frame();
    frame.add( new Shape(3,[[10,10],[100,10],[10,100]]) )
    frame.add( new Shape(4,[[40,40],[150,40],[150,150]]) )
    this.add(frame)

    const frame2 = new Frame();
    frame2.add( new Shape(3,[[20,10],[110,10],[20,100]]) )
    frame2.add( new Shape(4,[[50,40],[160,40],[160,150]]) )
    this.add(frame2)
}

class Renderer {
    constructor()
    {

    }


    drawShape(ctx, points)
    {
        ctx.beginPath();
        let p = points[0]
        ctx.moveTo(p[0],p[1])
        for(let j = 1; j < points.length; j++)
        {
            p = points[j]
            ctx.lineTo(p[0],p[1])
        }
        ctx.closePath();
    }
    
    drawFrame(ctx, frame, palette, editor)
    {
        if(!frame) return
    
        //ctx.fillStyle = palette[ frame.bgcolor ]
        //ctx.fillRect(0,0, project.size[0], project.size[1] );
    
        //draw shapes
        for(let i = 0; i < frame.shapes.length; i++)
        {
            var shape = frame.shapes[i];
            const color = palette[shape.color]
            if(!color)
                continue
            ctx.fillStyle = color
            this.drawShape(ctx,shape.points)
            //for(let k = 0; k < 16; k++) //no antialias
                ctx.fill();
        }
    }
    
    draw(project, canvas, ctx, frame)
    {
        //PROJECT
        canvas.width = project.size[0];
        canvas.height = project.size[1];
        this.drawFrame(ctx, frame, project.palette)
    }    
}

function isPointInShape(x, y, shape) {
    let inside = false;
    const len = shape.length;
    for (let i = 0, j = len - 1; i < len; j = i++) {
      const xi = shape[i][0], yi = shape[i][1];
      const xj = shape[j][0], yj = shape[j][1];
  
      const intersect = ((yi > y) !== (yj > y)) &&
                        (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

var POLYANIM = {
    Shape, Frame, Project, Renderer
}