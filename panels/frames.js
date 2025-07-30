class FramesTimeline extends CUI.Widget {
    selected = 0
    project = null
    frameSize = 20
    buttons = []
    playing = false
    fps = 10

    constructor(o)
    {
        super(o)
        this.fromJSON(o)

        const buttons = [["prev",16],["next",18],["start",72],["play",64],["end",73],["add",94],["delete",38]]
        const onClick = (b,e)=>this.onAction(b.data,e)
        buttons.forEach((item,i)=>{
            this.buttons.push(this.add( new CUI.Button({ icon: item[1], data:item[0], area:[2+32*i,2,30,30], onClick })))  //prev
        })
    }

    onAction(type,e){
        if(!this.project)
            return
        const project = this.project
        const frames = project.frames
        switch (type) {
            case "prev": state.frame = state.frame === 0 ? frames.length - 1 : state.frame - 1; break;
            case "next": state.frame = (state.frame+1) % frames.length; break;
            case "start": state.frame = 0; break;
            case "next": state.frame = frames.length-1; break;
            case "add":
                const current = project.frames[state.frame]
                let f = new POLYANIM.Frame()
                project.add(f);
                state.frame = project.frames.findIndex(v=>v===f)
                state.point = state.shape = -1
                if(e.shiftKey)
                    f.fromJSON( current.toJSON() )
                break;
            case "delete":
                if(frames.length > 1)
                {
                    frames.splice(state.frame,1)
                    state.frame = clamp( state.frame, 0, frames.length)
                    state.point = state.shape = -1
                }
                else
                    frames[0].clear()
                break;
            case "play": 
                this.playing = !this.playing
                this.buttons[3].icon = this.playing ? 65 : 64
                break;
            }
        }

    draw( ctx, style )
    {
        if(!this.project)
            return
        const project = this.project
        const frames = project.frames

        const itemsize = this.frameSize
        const y = 34.5
        ctx.fillStyle = "white"
        ctx.fillRect(0,y,this.width,1)
        for(let i = 0; i < frames.length; i++)
        {
            const f = frames[i];
            if(i === state.frame)
                ctx.fillRect(i*itemsize+2.5,y+2,itemsize-4,this.height-y-4)
            ctx.fillRect((i+1)*itemsize+0.5,y,1,this.height-y)
        }

        this.drawChildren(ctx,style)
        if(this.playing)
            state.frame = Math.floor(performance.now()*0.001*this.fps) % frames.length
    }

    onMouse(e)
    {
        if(!this.project)
            return
        const project = this.project
        const frames = project.frames
        const itemsize = this.frameSize
        const y = 34.5
        if(e.localY < y)
            return
        if(e.buttons && this.active)
        {
            const f = Math.floor(e.localX / itemsize)
            state.frame = clamp( f, 0, frames.length-1)
            return true
        }
    }

    onKey(e)
    {
        if(e.type !== "keydown")
            return
        switch(e.code)
        {
            case "ArrowLeft": this.onAction("prev"); break;
            case "ArrowRight": this.onAction("next"); break;
        }
    }
}

function createFramesPanel( ui, project )
{
    let p = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.BOTTOMCENTER, area: [-200,-200,400,100], style:{}});
    ui.add(p)

    var framesTimeline = new FramesTimeline({area:[0,0,400,100]})
    framesTimeline.project = project
    p.add(framesTimeline)

    return { panel: p, framesTimeline }
}