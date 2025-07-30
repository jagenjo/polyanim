let project_history = []
let project_history_post = []

function createHistoryPanel( ui )
{
    let p = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.TOPLEFT, area: [2,30,66,34]});
    ui.add(p)
    const onClick = (b)=>{
        if(b.data === "undo") doUndo()
        if(b.data === "redo") doRedo()
    }
    p.addButton({icon:16, data:"undo", onClick})
    p.addButton({icon:18, data:"redo", onClick})
}

function saveUndo()
{
    project_history_post = []
    project_history.push( { project: project.toJSON(), state: state } )    
}

function doUndo()
{
    if(project_history_post.length === 0)
        project_history_post.unshift( { project: project.toJSON(), state: state } )

    const step = project_history.pop()
    if(!step)
        return
    state = step.state
    project.fromJSON( step.project )
    project_history_post.unshift(step)
}

function doRedo()
{
    const step = project_history_post.shift()
    if(!step)
        return
    state = step.state
    project.fromJSON( step.project )
    project_history.push( step )
}
