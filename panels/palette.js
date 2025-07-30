const paletteButtons = []
function createPaletteBar( ui )
{
    let p = new CUI.Panel({titlebar:false, resizable: false, movable: false, anchor: CUI.CENTERLEFT, area: [50,-250,44,484], style:{apanelBorder:"transparent"}});
    ui.add(p)
    for(let i = 0; i < project.palette.length; i++)
    {
        const button = p.add(new CUI.Button({data: i, area: [2,i*30+2,30,30], style: { buttonBgActive: project.palette[i], buttonBg: project.palette[i]} }))
        button.onClick = (b)=>{
            paletteButtons.forEach(b=>{b.selected = false; b.icon = 0})
            b.selected = true
            b.icon = 66
            currentPaletteIndex = b.data
            const frame = project.frames[state.frame]
            const shape = frame?.shapes[ state.shape ]
            if(shape)
                shape.color = b.data

            const color = hexToRgb( project.palette[currentPaletteIndex] )
            sliders[0].value = color[0]
            sliders[1].value = color[1]
            sliders[2].value = color[2]
        }
        paletteButtons.push( button )
    }

    const sliders = []

    const onChange =(v,s)=>{
        const r = Math.floor(sliders[0].value)
        const g = Math.floor(sliders[1].value)
        const b = Math.floor(sliders[2].value)
        const color = rgbToHex(r,g,b)
        project.palette[currentPaletteIndex] = color
        paletteButtons[currentPaletteIndex].style.buttonBg = color
        paletteButtons[currentPaletteIndex].style.buttonBgActive = color
    }

    for(let i = 0; i < 3; i++)
        sliders.push( p.add( new CUI.Slider({data:i,area:[34,2+(128+4)*i,8,128],binsize:4, range:[0,255], onChange}) ))

    paletteButtons[1].click();
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  
  function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  }