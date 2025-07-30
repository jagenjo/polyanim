class Editor {
    project
    canvas
    ctx
    projcanvas
    projctx
    ds
    ui
    renderer

    static tools = []
    static modules = []
    currentTool = null

    keys = {}

    constructor( canvas, project )
    {
        this.canvas = canvas
        this.project = project
        this.ctx = canvas.getContext("2d")

        this.projcanvas = document.createElement("canvas")
        this.projctx = this.projcanvas.getContext("2d")

        this.ds = new DragAndScale(canvas,true)
        this.ds.offset = [document.body.offsetWidth/2-project.size[0]/2, document.body.offsetHeight/2-project.size[1]/2]

        this.ui = new CUI.UI({icons:"icons-1bit.png"})
        this.renderer = new POLYANIM.Renderer()

        this.bindEvents()
    }
}

POLYANIM.Editor = Editor

let mousePos = [0,0]
let clickOutside = false

let currentPaletteIndex = 1;
let numOnionLayers = 3
let debugStr = ""

function distance(a,b) { return Math.sqrt( Math.pow(a[0]-b[0],2) + Math.pow(a[1]-b[1],2) ) }
function clamp(a,min,max) { return a < min ? min : (a > max ? max : a) }

Editor.prototype.deleteShape = function(frame_index, shape_index )
{
    const frame = this.project.frames[ frame_index ]
    const shape = frame.shapes[ shape_index ]
    if(!shape) return
    frame.shapes.splice(shape_index,1)
}

Editor.prototype.drawPoints = function(ctx,shape)
{
    for(let j = 0; j < shape.points.length; j++)
    {
        const p = shape.points[j]
        let s = 4 / this.ds.scale
        ctx.fillRect(p[0]-s/2,p[1]-s/2,s,s)
    }
}

let state = {
    mode: "select",
    frame: 0,
    shape: 0,
    multiShape: null,
    point: -1,
    multiPoint: null,
}

let settings = {
    show_tool_gizmos: true,
    show_frame: true,
    show_onion_layers: false,
    guides: []
}

Editor.topbar_options = [
    {
        label:"File",
        values:["New","Load","Save","Download"]
    },{
        label:"Edit", values: ["Copy","Paste","Delete"] 
    },{
        label:"Actions",values:["Quantize"]
    },{
        label:"Help",values:[]
    }
]

Editor.topbar_callbacks = {}
Editor.registerTopbarOption = function(section,name,callback)
{
    const index = Editor.topbar_options.findIndex(i=>i.label === section)
    if(!index)
        index = Editor.topbar_options.push({ label:section, values: []})
    Editor.topbar_options[index].values.push(name)
    Editor.topbar_callbacks[name] = callback
}

Editor.prototype.init = function()
{
    const ui = this.ui
    var topbar = ui.add( new CUI.Topbar({values:Editor.topbar_options}) )
    topbar.onSelect = (v)=>{
        switch(v)
        {
            case "New": project.clear(); state.frame = 0; state.shape = -1; break;
            case "Load": this.loadProject(); break;
            case "Save": this.saveProject(); break;
            case "Download": this.downloadProject(); break;
            default:
                Editor.topbar_callbacks[v]?.()
        }
    }

    Editor.registerTopbarOption("Help","Icons",()=>ui.demo())

    //TOOLSBAR
    var p = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.CENTERLEFT, area: [10,-250,34,500], style:{apanelBorder:"transparent"}});
    ui.add(p)

    for(let i = 0; i < Editor.tools.length; i++)
    {
        const tool = Editor.tools[i]
        tool.button = p.add(new CUI.Button({icon: tool.icon, data: tool, area: [2,i*30+2,30,30]}))
        tool.button.onClick = (b)=>{
            if(this.currentTool === b.data)
                return
                this.currentTool?.onDisabled?.()
                this.currentTool = b.data;
                this.currentTool?.onEnabled?.()
            Editor.tools.forEach(t=>{t.button.selected = false; if(t.panel) t.panel.enabled = false})
            this.currentTool.button.selected = true
            if(this.currentTool.panel)
                this.currentTool.panel.enabled = true
        }
    }

    //COLORBAR
    createPaletteBar(ui)

    //settings bar
    p = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.TOPCENTER, area: [-100,2,200,34], style:{}});
    ui.add(p)
    p.addButton({ icon: 30, target: settings, property: "show_tool_gizmos" })
    p.addButton({ icon: 37, target: settings, property: "show_frame" })
    p.addButton({ icon: 95, target: settings, property: "show_onion_layers" })

    //frames bar
    this.framesTimeline = createFramesPanel(ui, project).framesTimeline

    //for undo
    createHistoryPanel(ui)

    //for frame inspector
    createFrameInspectorPanel(ui, project)

    //zoom
    const zoom = new CUI.Slider({ range:[1,8], area:[140,30,200,30],display:true, target: this.ds, property: "scale"})
    ui.add(zoom)

    Editor.tools.forEach(t=>t.init?.(ui,this))
    this.changeTool( Editor.tools[0] )

    Editor.modules.forEach(t=>t.init?.(this))
}

Editor.prototype.changeTool = function(tool)
{
    if(this.currentTool === tool || !tool)
        return
    this.currentTool?.onDisabled?.()
    this.currentTool = tool;
    this.currentTool?.onEnabled?.()
    Editor.tools.forEach(t=>{t.button.selected = false; if(t.panel) t.panel.enabled = false})
    this.currentTool.button.selected = true
    if(this.currentTool.panel)
        this.currentTool.panel.enabled = true
}

Editor.prototype.draw = function()
{
    //PROJECT
    this.projcanvas.width = project.size[0];
    this.projcanvas.height = project.size[1];

    const numlayers = settings.show_onion_layers ? numOnionLayers+1 : 1
    for(let i = numlayers-1; i >= 0; i--)
    {
        this.projctx.globalAlpha = 1-i/numlayers
        this.renderer.drawFrame(this.projctx, project.frames[state.frame-i], project.palette, state)
    }

    //CANVAS
    const ctx = this.ctx
    ctx.fillRect(0,0, canvas.width, canvas.height);
    ctx.save();
    this.ds.toCanvasContext(ctx);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage( this.projcanvas, 0,0 )
    if(settings.show_tool_gizmos)
        this.currentTool?.onDraw?.(ctx, this)

    if(settings.show_frame)
    {
        this.ctx.strokeStyle = "white"
        this.ctx.strokeRect(0,0, project.size[0], project.size[1] );
    }

    Editor.modules.forEach(m=>m.onDraw?.(ctx,this))

    this.ctx.restore();

    //debug
    ctx.textAlign = "right"
    ctx.fillStyle = "white"
    var str = []
    str.push("Frame:"+state.frame)
    str.push("Shape:"+state.shape)
    str.push("Point:"+state.point)
    str.push("Shapes:" + this.project.frames[state.frame].shapes.length)
    str.forEach((s,i)=>ctx.fillText(String(s),ctx.canvas.width - 10,40 + 20 * i))

    this.ui.draw(this.ctx)
}

const evCache = []
let fingersDist = -1;

Editor.prototype.processGesture = function(e)
{
    function computeFingersDist()
    {
        if (evCache.length === 2) {
            const currentDist = distance(evCache[0],evCache[1])
            return currentDist / fingersDist
        }
        return -1
    }

    if(e.type === "pointerdown")
    {
        evCache.push([e.offsetX,e.offsetY,e.pointerId])
        fingersDist = computeFingersDist()
    }
    else if(e.type === "pointerup")
    {
        const index = evCache.findIndex((c)=>c[2] === e.pointerId)
        evCache.splice(index, 1)
    }
    else if(e.type === "pointermove")
    {
        const index = evCache.findIndex((c)=>c[2] === e.pointerId)
        evCache[index] = e
        const currentDist = computeFingersDist()
        if(currentDist !== -1)
        {
            const f = currentDist / fingersDist
            this.ds.changeScale(this.ds._scale * f)
            fingersDist = currentDist
        }
    }
    
    if(e.type === "gesturechange")
    {
        const f = e.scale
        this.ds.changeScale(this.ds._scale * f)
    }

    debugStr = "fingers " + evCache.length + " " + fingersDist + " " + e.type
}

Editor.prototype.onMouse = function(e)
{
    e.preventDefault()
    e.stopPropagation()

    if(e.offsetX !== undefined)
    {
        mousePos[0] = e.offsetX
        mousePos[1] = e.offsetY
    }

    this.processGesture(e)

    if(this.ui.onMouse(e))
        return

    if(this.keys["Space"] && e.type === "pointermove")
    {
        this.ds.mouseDrag( e.movementX, e.movementY );
        return
    }
    const localpos = this.ds.convertCanvasToOffset([e.offsetX, e.offsetY])
    e.localpos = localpos

    if(!clickOutside)
    {
        if(this.currentTool?.onMouse?.(e,this))
            return
        if(e.type === "pointerdown")
            clickOutside = true
    }
    else if(e.type === "pointerup")
    {
        clickOutside = false
        this.currentTool?.onMouse?.(e,this) //ups are always sent
    }

    if(Editor.modules.reverse().some(m=>m.onMouse?.(e,this)))
        return

    this.ds.onMouse(e)
}

Editor.prototype.onKey = function(e)
{
    this.keys[e.code] = e.type === "keydown"
    if(this.ui.onKey(e))
        return
    if(this.currentTool?.onKey?.(e,this))
        return
    if(e.type !== "keydown")
        return
    switch(e.code)
    {
        case "ArrowLeft": this.framesTimeline.onAction("prev"); break;
        case "ArrowRight": this.framesTimeline.onAction("next"); break;
        case "KeyZ": if(e.ctrlKey) doUndo(); break;
        case "KeyY": if(e.ctrlKey) doRedo(); break;
        case "KeyC": if(e.ctrlKey) this.copySelection(); break;
        case "KeyS": if(e.ctrlKey) this.saveProject(); break;
        case "KeyL": if(e.ctrlKey) this.loadProject(); break;
        case "KeyV": if(e.ctrlKey) this.pasteSelection(); break;
        case "Digit1": this.changeTool(Editor.tools[0]); break;
        case "Digit2": this.changeTool(Editor.tools[1]); break;
        case "Digit3": this.changeTool(Editor.tools[2]); break;
        case "Digit4": this.changeTool(Editor.tools[3]); break;
        case "Digit5": this.changeTool(Editor.tools[4]); break;
    }
}

let data_clipboard = null

Editor.prototype.copySelection = function()
{
    if(state.shape !== -1)
    {
        const shape =  project.frames[ state.frame ]?.shapes[state.shape]
        if(!shape) return
        data_clipboard = { type: "shape", shape: shape.toJSON() }
    }
    else {
        data_clipboard = { type: "frame", frame: project.frames[ state.frame ].toJSON() }
    }
}

Editor.prototype.pasteSelection = function()
{
    if(!data_clipboard) return
    const frame =  this.project.frames[ state.frame ]
    if(!frame) return
    if( data_clipboard.type === "shape" )
    {
        const shape = new Shape()
        shape.fromJSON(data_clipboard.shape)
        shape.id = -1
        frame.add(shape)
    }
    else if( data_clipboard.type === "frame" )
    {
        frame.fromJSON( data_clipboard.frame )
    }
}

Editor.prototype.bindEvents = function()
{
    ["pointerdown","pointermove","pointerup","wheel","gesturestart","gesturechange","gestureend"].forEach(e=>canvas.addEventListener(e,(e)=>this.onMouse(e)));
    ["touchstart","touchend","contextmenu"].forEach(e=>canvas.addEventListener(e,(e)=>{ e.preventDefault(); return false; }));
    ["keydown","keyup"].forEach(e=>document.body.addEventListener(e,(e)=>this.onKey(e)))
}

Editor.prototype.loadProject = function( name = "default" )
{
    const data = localStorage.getItem("POLYANIM_" + name)
    if(!data)
        return
    const json = JSON.parse(data)
    state = json.state
    this.project.fromJSON(json.project)
}

Editor.prototype.downloadProject = function()
{
    const json = {
        state,
        project: this.project.toJSON()
    }
    const blob = new Blob([JSON.stringify(json)], {type: "application/json"});
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.download = "polyanim.json"
    a.href = url
    a.click()    
}

Editor.prototype.saveProject = function( name = "default" )
{
    const json = {
        state,
        project: this.project.toJSON()
    }
    localStorage.setItem("POLYANIM_" + name, JSON.stringify(json) )
}

