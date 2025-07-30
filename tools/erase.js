let ERASER_TOOL = {
    icon: 5,
    name: "eraser",
    radius: 20,
    init(ui,editor)
    {
        this.panel = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.BOTTOMCENTER, area: [-250,-50,500,40], style:{panelBorder:"transparent"}});
        ui.add( this.panel )
        this.panel.enabled = false
        this.size_widget = this.panel.add( new CUI.Slider({range:[1,100], binsize:4, display: true, area:[2,2,100,20]}) )
        this.size_widget.onChange = (v)=>{this.radius=v}
    },

    onDraw(ctx,editor){
        const localpos = ds.convertCanvasToOffset([mousePos[0], mousePos[1]])
        const frame = editor.project.frames[state.frame]
        ctx.fillStyle = "white"
        const shape = frame.shapes[ state.shape ]
        if(shape)
            editor.drawPoints(ctx,shape)
        ctx.strokeStyle = "white"
        ctx.lineWidth = 1 / ds.scale
        ctx.beginPath()
        ctx.arc(localpos[0],localpos[1],this.radius,0,Math.PI*2)
        ctx.stroke()
    },
    onMouse(e,editor) {
        state.mode = "eraser"
        if(e.type === "wheel")
            return false
        const frame = editor.project.frames[state.frame]
        const shape = frame.shapes[ state.shape ]
        const localpos = editor.ds.convertCanvasToOffset([e.offsetX, e.offsetY])
        if(e.type === "pointerdown" || (e.type === "pointermove" && e.buttons) )
        {
            if(shape)
            {
                let valid = []
                for(let i = 0; i < shape.points.length; i++)
                {
                    const p = shape.points[i]
                    if( distance(localpos, p) > this.radius )
                        valid.push(p)
                }
                shape.points = valid
                if(shape.points.length < 2)
                {
                    deleteShape(state.frame, state.shape)
                    state.shape = -1
                }
            }
            return true
        }
        else if(e.type === "pointerup")
        {
        }
    }
}

POLYANIM.Editor.tools.push( ERASER_TOOL )