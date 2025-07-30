
const RULERS = {

    current: null,

    rulers: [],

    onInit(){
    },

    onDraw(ctx,editor){
        if(!settings.show_frame)
            return
        ctx.fillStyle = "white"
        ctx.fillRect(-10,-10,10,10)
        const size = editor.project.size
        
        for(let i = 0; i < this.rulers.length; i++)
        {
            const ruler = this.rulers[i]
            ctx.fillStyle = "#333"
            if(ruler.type == "vertical" && ruler.offset >= 0 && ruler.offset < size[0])
            {
                ctx.fillRect(ruler.offset,0,1,size[1])
                ctx.fillStyle = "white"
                ctx.fillRect(ruler.offset-1,-10,3,10)
            }
            else if(ruler.type == "horizontal" && ruler.offset >= 0 && ruler.offset < size[1])
            {
                ctx.fillRect(0,ruler.offset,size[0],1)
                ctx.fillStyle = "white"
                ctx.fillRect(-10,ruler.offset-1,10,3)
            }
        }
    },

    onMouse(e,editor)
    {
        const size = editor.project.size
        if(!settings.show_frame)
            return

        if(e.type === "pointerdown")
        {
            //corner
            const leftGutter = e.localpos[0] > -10 && e.localpos[0] < 0
            const topGutter = e.localpos[1] > -10  && e.localpos[1] < 0
            if( leftGutter && topGutter )
            {
                this.current = {}
                this.rulers.push( this.current )
                return true
            }
            else if( leftGutter )
            {
                const ruler = this.rulers.find(r=>r.type === "horizontal" && Math.abs(r.offset - e.localpos[1]) < 3 )
                if(ruler)
                {
                    ruler.offset = Math.round(e.localpos[1])
                    this.current = ruler
                    return true
                }
            }
            else if( topGutter )
            {
                const ruler = this.rulers.find(r=>r.type === "vertical" && Math.abs(r.offset - e.localpos[0]) < 3 )
                if(ruler)
                {
                    ruler.offset = Math.round(e.localpos[0])
                    this.current = ruler
                    return true
                }
            }
        }
        else if(e.type === "pointermove" && this.current)
        {
            if(e.localpos[0] > e.localpos[1])
            {
                this.current.type = "vertical"
                this.current.offset = Math.round(e.localpos[0])
            }
            else if(e.localpos[0] < e.localpos[1])
            {
                this.current.type = "horizontal"
                this.current.offset = Math.round(e.localpos[1])
            }
            return true
        }
        else if(e.type === "pointerup")
        {
            if(this.current)
            {
                const index = this.rulers.indexOf(this.current)
                if( this.offset < 0 ||
                    (this.current.type === "vertical" && this.offset > size[0]) || 
                    (this.current.type === "horizontal" && this.offset > size[1]) )
                    this.rulers.splice(index,1)
            }

            this.current = null
        }
    }
}

Editor.modules.push(RULERS)