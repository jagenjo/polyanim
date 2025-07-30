let CIRCLE_TOOL = {
    icon: 98,
    name: "circle",
    lastPos: null,
    minDist: 3,
    drawingShape: false,

    drawBehind: false,

    clickTime: 0,

    init(ui){
        this.panel = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.BOTTOMCENTER, area: [-300,-55,600,50], style:{panelBorder:"transparent"}});
        ui.add( this.panel )
        this.panel.enabled = false

        this.size_widget = this.panel.add( new CUI.Slider({range:[1,10], value:this.minDist, binsize:4, display: true, area:[2,2,100,15]}) )
        this.size_widget.onChange = (v)=>{this.minDist=v}

        this.panel.add( new CUI.Checkbox({label:"behind", area:[150,0,80,20], target: this, property:"drawBehind"}) )
    },

    onEnabled()
    {
        state.shape = -1
    },

    onDisabled()
    {
        this.drawingShape = false
    },

    onDraw(ctx, editor){
            const frame = project.frames[state.frame]
            const shape = frame.shapes[ state.shape ]
            ctx.fillStyle = "white"
            if(shape)
                editor.drawPoints( ctx, shape )
        ctx.canvas.style.cursor = "pointer"
    },

    onMouse(e,editor) {
        state.mode = "edit"
        const now = performance.now()
        if(e.type === "wheel")
            return false
        const frame = project.frames[state.frame]
        const localpos = editor.ds.convertCanvasToOffset([e.offsetX, e.offsetY])
        if(e.type === "pointerdown")
        {
            //create shape
            saveUndo()
            if(!this.drawingShape)
            {

                const shape = new POLYANIM.Shape(currentPaletteIndex,[[localpos[0],localpos[1]]])
            }
            this.lastPos = localpos
            this.clickTime = now
            return true
        }
        else if(e.type === "pointermove" && this.lastPos && e.buttons )
        {
            const shape = frame.shapes[ state.shape ]
            if(shape)
            {
                return true
            }
        }
        else if(e.type === "pointerup")
        {
            //fast click
            if( now - this.clickTime < 200 )
            {
                if(this.drawingShape)
                {
                }
                this.drawingShape = true
            }
            else
            {
                if(!this.drawingShape)
                {
                    state.point = -1
                    state.shape = -1
                    this.lastPos = null
                }
            }
            return true
        }
    },
    onKey(e){
        if(e.type !== "keydown")
            return

        if(e.code === "Escape")
        {
            this.drawingShape = false
        }
        else
            return false
        return true
    }
}

POLYANIM.Editor.tools.push( CIRCLE_TOOL )