let EDIT_TOOL = {
    icon: 2,
    name: "edit",
    radius: 20,
    intensity: 0.2,
    smooth: false,
    selected: [],

    mode:"edit",
    downPos: [0,0],

    init(ui)
    {
        this.panel = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.BOTTOMCENTER, area: [-300,-55,600,50], style:{panelBorder:"transparent"}});
        ui.add( this.panel )
        this.panel.enabled = false

        this.panel.add( new CUI.Button({ icon: 103, area:[2,2,30,30], target: EDIT_TOOL, property:"smooth"} ) )
        this.size_widget = this.panel.add( new CUI.Slider({range:[1,100], value:this.radius, binsize:4, display: true, area:[42,2,100,15]}) )
        this.size_widget.onChange = (v)=>{this.radius=v}
        this.intensity_widget = this.panel.add( new CUI.Slider({range:[0,1], value:this.intensity, binsize:4, display: true, area:[42,17,100,16]}) )
        this.intensity_widget.onChange = (v)=>{this.intensity=v}

        const modes = ["edit","relax","optimize"]
        const icons = [3,102,92]
        const mode_buttons = []
        for(let i = 0; i < modes.length; i++)
        {
            const b = this.panel.add( new CUI.Button({ icon: icons[i], data: modes[i], area:[200 + 30 * i,2,30,30]} ) )
            mode_buttons.push(b)
            b.onClick = (b)=>{
                mode_buttons.forEach(b=>b.selected = false)
                b.selected = true
                this.mode = b.data
            }            
        }
        mode_buttons[0].click()

        const x = 220 + 30 * modes.length

        this.panel.add( new CUI.Button({ label:"optimize", icon: 92, area:[x,2,100,30]} ) )
        .onClick = (b)=>{
            const frame = project.frames[state.frame]
            const shape = frame.shapes[ state.shape ]
            if(!shape)
                return
            optimiziceShape(shape)    
        }

        this.panel.add( new CUI.Button({ label:"subdivide", icon: 105, area:[x + 102,2,100,30]} ) )
        .onClick = (b)=>{
            const frame = project.frames[state.frame]
            const shape = frame.shapes[ state.shape ]
            if(!shape)
                return
            subdivideShape(shape)
        }
    },

    onDraw(ctx,editor){
        const frame = project.frames[state.frame]
        const localpos = editor.ds.convertCanvasToOffset(mousePos)
        const shape = frame.shapes[ state.shape ]
        if(!shape)
            return
        editor.renderer.drawShape(ctx,shape.points)
        ctx.lineWidth = 1 / editor.ds.scale
        ctx.strokeStyle = "white"
        ctx.stroke()
        ctx.fillStyle = "white"
        for(let j = 0; j < shape.points.length; j++)
        {
            p = shape.points[j]
            let s = (j === state.point ? 8 : 4) / editor.ds.scale
            ctx.fillRect(Math.floor(p[0])-s/2,Math.floor(p[1])-s/2,s,s)
        }

        //draw radius
        if(this.smooth || this.mode !== "edit")
        {
            ctx.strokeStyle = "white"
            ctx.lineWidth = 1 / editor.ds.scale
            ctx.beginPath()
            ctx.arc(localpos[0],localpos[1],this.radius,0,Math.PI*2)
            ctx.stroke()
        }
        /*
        let nearestEdgeA = findClosestEdge(shape,localpos[0],localpos[1])
        if(nearestEdgeA !== -1)
        {
            let A = shape.points[nearestEdgeA]
            let B = shape.points[(nearestEdgeA+1)%shape.points.length]
            ctx.fillStyle = "cyan"
            let s = 4
            ctx.fillRect(Math.floor((A[0]+B[0])/2)-s/2,Math.floor((A[1]+B[1])/2)-s/2,s,s)
        }
        else
            return false
        */
        return true
    },
    onMouse(e,editor) {
        state.mode = "edit"
        if(e.type === "wheel")
            return false
        const frame = project.frames[state.frame]
        const localpos = editor.ds.convertCanvasToOffset([e.offsetX, e.offsetY])
        const shape = frame.shapes[ state.shape ]
        if(shape && e.type === "pointerdown")
        {
            this.downPos[0] = localpos[0]
            this.downPos[1] = localpos[1]
            if( !this.smooth && this.mode === "edit")
            {
                state.point = findNearestPoint(shape, ...localpos)
                this.selected.length = 0
                if(state.point !== -1)
                    return true
                //check if inside
                if( findPointsInside(shape,localpos[0],localpos[1],this.radius) )
                    return true
            }
            else
                return true
        }
        else if(shape && e.type === "pointermove" && e.buttons)
        {
            if( this.smooth || this.mode !== "edit")
                this.selected = findPointsInside(shape,localpos[0],localpos[1],this.radius)

            if(this.selected.length)
            {
                if(this.mode === "edit")
                {
                    const dx = e.movementX / editor.ds.scale
                    const dy = e.movementY / editor.ds.scale
                    for(let i = 0; i < this.selected.length; i++)
                    {
                        const p = shape.points[ this.selected[i] ]
                        const dist = distance(localpos,p)
                        const f = clamp((1 - dist/this.radius),0,1)
                        p[0] += dx * f
                        p[1] += dy * f
                    }
                }
                else if(this.mode === "relax")
                {
                    relaxShape( shape, this.intensity, this.selected )
                }
                else if(this.mode === "optimize")
                {
                    optimiziceShape( shape, 10, this.selected )
                }
                
            }
            else if(state.point != -1 && this.mode === "edit")
            {
                const p = shape.points[ state.point ]
                p[0] = localpos[0]
                p[1] = localpos[1]
            }
            else if(this.mode === "edit")//move all
            {
                shape.points.forEach(p=>{p[0]+=e.movementX / editor.ds.scale; p[1]+=e.movementY / editor.ds.scale})
            }
            return true
        }
        if(e.type === "pointerup")
        {
            const dx = localpos[0] - this.downPos[0]
            const dy = localpos[1] - this.downPos[1]

            if(dx === 0 && dy === 0)
            {
                //return SELECT_TOOL.onMouse(e, editor)
            }
        }
    },
    onKey(e,editor){
        if(e.type !== "keydown")
            return
        const frame = project.frames[state.frame]
        if(e.code === "Insert")
        {
            const localpos = editor.ds.convertCanvasToOffset([mousePos[0], mousePos[1]])
            const shape = frame.shapes[ state.shape ]
            if(shape)
            {
                shape.points.push([localpos[0],localpos[1]])
                state.point = shape.points.length - 1
            }
        }
        else if(e.code === "KeyO")
        {
            const shape = frame.shapes[ state.shape ]
            if(shape)
            {
                optimiziceShape(shape)
            }
        }
        else if(e.code === "Delete")
        {
            const shape = frame.shapes[ state.shape ]
            if(shape && state.point !== -1)
            {
                shape.points.splice( state.point, 1 )
                state.point = Math.min( state.point, shape.points.length - 1)
            }
        }
        else
            return SELECT_TOOL.onKey(e, editor)
    }
}

POLYANIM.Editor.tools.push( EDIT_TOOL )