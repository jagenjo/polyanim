class FrameInspector extends CUI.Widget {

    constructor(o)
    {
        super(o)
        this.fromJSON(o)

        const onClick = (b,e)=>this.onAction(b.data,e)
        this.add( new CUI.Button({area:[0,0,20,20],icon:25, data:"up", onClick}) )
        this.add( new CUI.Button({area:[20,0,20,20],icon:27, data:"down", onClick}) )
        this.add( new CUI.Button({area:[40,0,20,20],icon:38, data:"delete", onClick}) )
    }

    onAction(type,e){
        if(!this.project)
            return
        const project = this.project
        const frame = project.frames[state.frame]
        if(!frame || state.shape === -1) return
        if(type === "up")
        {
            if(state.shape > 0)
            {
                const s = frame.shapes.splice(state.shape,1)[0]
                frame.shapes.splice(state.shape-1,0,s)
                state.shape--
            }
        }
        else if(type === "down")
        {
            if(state.shape < frame.shapes.length - 1)
            {
                const s = frame.shapes.splice(state.shape,1)[0]
                frame.shapes.splice(state.shape+1,0,s)
                state.shape++
            }
        }
        else if(type === "delete")
        {
            if(frame.shapes.length)
            {
                const s = frame.shapes.splice(state.shape,1)[0]
                state.shape = Math.min( state.shape, frame.shapes.length - 1 )
            }
        }
    }

    draw( ctx, style )
    {
        if(!this.project)
            return
        const project = this.project
        const frame = project.frames[state.frame]
        if(!frame) return

        const yoffset = 22
        ctx.textAlign = "left"
        for(let i = 0; i < frame.shapes.length; i++)
        {
            const shape = frame.shapes[i]
            ctx.fillStyle = "white"
            const name = "S: " + shape.id
            if(state.shape === i)
            {
                ctx.fillRect(0,i*20 + yoffset,this.area[3],20)
                ctx.fillStyle = "black"
                ctx.fillText(name,10,i*20 + 15 + yoffset)
            }
            else
                ctx.fillText(name,10,i*20 + 15 + yoffset)
        }

        this.drawChildren(ctx,style)
    }

    onMouse(e)
    {
        if(!this.project)
            return
        const project = this.project
        const frame = project.frames[state.frame]
        const yoffset = 22
        if(!frame) return
        if(e.type === "pointerdown")
        {
            const index = Math.floor((e.localY - yoffset) / 20)
            if(index < frame.shapes.length)
                state.shape = index
        }
        return true
    }

    onKey(e)
    {
        if(e.type !== "keydown")
            return
        switch(e.code)
        {

        }
    }
}

function createFrameInspectorPanel( ui, project )
{
    let p = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.TOPRIGHT, area: [-110,200,100,400], style:{}});
    ui.add(p)

    var framesInspector = new FrameInspector({area:[0,0,100,400]})
    framesInspector.project = project
    p.add(framesInspector)

    return { panel: p, framesInspector }
}