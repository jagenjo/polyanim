let SELECT_TOOL = {
    icon: 1,
    name: "select",

    rectangle: null,

    onDraw(ctx, editor)
    {
        const frame = project.frames[state.frame]
        //const localpos = ds.convertCanvasToOffset(mousePos)
        //const shape = frame.findShapeAtPosition(localpos[0], localpos[1])
        //if(!shape)
        //    return
        if(state.shape === -1)
            return
        const shape = frame.shapes[ state.shape ]
        if(shape)
            editor.renderer.drawShape(ctx,shape.points)
        ctx.lineWidth = 1 / editor.ds.scale
        ctx.strokeStyle = "white"
        for(let k = 0; k < 16; k++) //no antialias
            ctx.stroke()

        if(this.rectangle)
        {
            ctx.strokeStyle = "yellow"
            ctx.strokeRect(...this.rectangle)
        }
    },

    onMouse(e, editor) {
        if(e.type === "wheel")
            return false        
        state.mode = "select"
        const frame = editor.project.frames[state.frame]
        const localpos = editor.ds.convertCanvasToOffset([e.offsetX, e.offsetY])
        const shape = frame.findShapeAtPosition(localpos[0], localpos[1])
        if(e.type === "pointerdown")
        {
            if(e.ctrlKey)
            {
                this.rectangle = [localpos[0],localpos[1],1,1]
                return true
            }
        }
        if(e.type === "pointerup")
        {
            state.shape = shape ? frame.shapes.indexOf(shape) : -1
            state.point = -1
            if(shape)
                paletteButtons[shape.color].click()
            if(this.rectangle)
                this.selectRectangle(this.rectangle)
            this.rectangle = null
        }
        else if(e.type === "pointermove")
        {
            if(this.rectangle)
            {
                this.rectangle[2] = localpos[0] - this.rectangle[0]
                this.rectangle[3] = localpos[1] - this.rectangle[1]
            }
        }
        return !!shape
    },

    onKey(e,editor){
        if(e.type !== "keydown")
            return

        if(e.code === "Delete")
        {
            editor.deleteShape(state.frame, state.shape)
            state.shape = -1
        }
    },

    selectRectangle( rectangle, project )
    {
        const frame = project.frames[state.frame]
        for(let i = 0; i < frame.shapes.length; i++)
        {

        }
    }
}

POLYANIM.Editor.tools.push( SELECT_TOOL )