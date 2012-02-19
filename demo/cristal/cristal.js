var viewer;
var polygons
var needUpdate = true;

function init(){
    polygons = {
        octahedron: new Polygon(planes_list.octahedron, [0.6, 0.6, 1.0], 2.0),
        dodecahedron: new Polygon(planes_list.dodecahedron, [1.0, 0.6, 0.6], 2.0),
        r_dodecahedron: new Polygon(planes_list.rhombic_dodecahedron, [0.6, 1.0, 0.6], 2.0),
        tetrahedron: new Polygon(planes_list.tetrahedron, [0.9, 0.8, 0.4], 2.0, false),
        cube: new Polygon(planes_list.cube, [1.0, 1.0, 1.0], 1.0)
    }

    viewer = new CristalViewer($("#canvas")[0], polygons, {
        pitch: -0.2,
        yaw: 2.8,
        polygonColors: true,
        color: [0.2, 0.4, 1.0]
    });

    wok.input.start(); //Why not start it automatically ?

    setInterval(update, 15);
}

function update(){
    function addToCoeff(delta, polygon){
        var coeff = polygons[polygon].coeff + delta;
        var slider = $("#" + polygon + "-slider")[0];
        
        coeff = wok.utils.clamp(coeff, parseFloat(slider.min || 0.5), parseFloat(slider.max || 1.8)); //Hack for browser without sliders
        slider.value = coeff;
        polygons[polygon].update(coeff);

        needUpdate = true;
    }

    //Use keys
    if(wok.input.isPressed("t")){
        addToCoeff(0.01, "octahedron");
    }
    if(wok.input.isPressed("r")){
        addToCoeff(-0.01, "octahedron");
    }
    if(wok.input.isPressed("g")){
        addToCoeff(0.01, "dodecahedron");
    }
    if(wok.input.isPressed("f")){
        addToCoeff(-0.01, "dodecahedron");
    }
    if(wok.input.isPressed("b")){
        addToCoeff(0.01, "r_dodecahedron");
    }
    if(wok.input.isPressed("v")){
        addToCoeff(-0.01, "r_dodecahedron");
    }
    if(wok.input.isPressed("o")){
        addToCoeff(0.01, "tetrahedron");
    }
    if(wok.input.isPressed("i")){
        addToCoeff(-0.01, "tetrahedron");
    }

    if(needUpdate){
        viewer.update();
    }
    needUpdate = false;
}

function toggleColors(){
    viewer.polygonColors = $("#color-checkbox")[0].checked
    needUpdate = true;
}

function changeCoeff(polygon, slider){
    polygons[polygon].update(slider.valueAsNumber);
    needUpdate = true;
}

