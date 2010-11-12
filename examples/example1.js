var example = {

    //First function called creates the boxes and draxs periodically
    init: function(){
        boxes = [
            new FlyingBox("box1"),
            new FlyingBox("box2"),
            new FlyingBox("box3")        
        ]
        framecount = 0;
        setInterval(function(){example.drawScene();}, 15);
    },

    //Draws each box
    drawScene: function(){
        for(var i=0; i<boxes.length; i++){
            boxes[i].draw(framecount);
        }
        framecount ++;
    },
    
    changeBgColor: function(r, g, b){
        if(arguments.length>0) 
            $("#bg-text")[0].value = "rgb("+r+", "+g+", "+b+")";
            
        //Always get the color from the custom field
        $("div").css("background-color", $("#bg-text")[0].value); 
    },
    
    changeClearColor: function(r, g, b, a){
        if(arguments.length>0) //If some color is passed update the text field
            $("#clear-text")[0].value = "["+r+", "+g+", "+b+", "+a+"]";
         
        //Always get the color from the custom field   
        var color = eval($("#clear-text")[0].value); //eval is evil >:(
        for(var i=0; i<boxes.length; i++){
            boxes[i].changeClearColor(color);
        }
    },
 
    setBorders: function(borders){
        $("canvas").css("border", (borders ?"2px":"0px") + " dashed white")
    }
}



//A simple class that set up a box and renders it
var FlyingBox = function(canvas){

    //use jquery ui to drag canvas around
    this.draggable = $("#"+canvas).draggable({
        containment: 'parent',
        stack: "canvas",
    });

    //Get this canvas' specific wok context
    this.gl = wok.initGL($("#"+canvas)[0]);
    
    if(!this.gl){
        alert("WTF NO GL!!!!");
        return;
    }

    //Some basic setup
    this.gl.setOptions({
        clearColor: [0.0, 0.0, 0.0, 0.0],
        clearDepth: 1000.0,
        depthTest: true,
        depthFunc: this.gl.LEQUAL
    });
    
    //Build the shader program from the 2 script elements
    this.shaderProgram = new this.gl.ShaderProgram(
        this.gl.Shader.fromElement($("#shader-fs")[0]),
        this.gl.Shader.fromElement($("#shader-vs")[0])
    );

    //Creates the arrays used to draw the boxes
    this.boxPositions = new this.gl.ArrayBuffer(this.gl.STATIC_DRAW, [
        -0.5, -0.5,  0.5,
         0.5, -0.5,  0.5,
        -0.5,  0.5,  0.5,
         0.5,  0.5,  0.5,
        -0.5, -0.5, -0.5,
         0.5, -0.5, -0.5,
        -0.5,  0.5, -0.5,
         0.5,  0.5, -0.5
    ]);
    this.boxColors = new this.gl.ArrayBuffer(this.gl.STATIC_DRAW, [
        0.0, 0.0, 1.0,
        1.0, 0.0, 1.0,
        0.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        0.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        1.0, 1.0, 0.0
    ]);
    this.boxIndices = new this.gl.ElementBuffer(this.gl.STATIC_DRAW, [
        0, 1, 2,  2, 1, 3,  // front
        5, 4, 7,  7, 4, 6,  // back
        4, 0, 6,  6, 0, 2,  // left
        1, 5, 3,  3, 5, 7,  // right
        2, 3, 6,  6, 3, 7,  // top
        4, 5, 0,  0, 5, 1   // bottom
    ]);
    
    //Shows the boxes are actually different
    this.angularSpeed = Math.random()*0.2 - 0.1;
}



FlyingBox.prototype = {
    
    //Draws the box each frame
    draw: function(framecount){
    
        //Straightforward
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        //Compute the transformations
        var persp = mat4.perspective(45, 1, 0.001, 1000.0);

        var modelView = mat4.lookAt([2.5, 1.5, 0], [0, 0, 0], [0, 1, 0]);
        mat4.rotateY(modelView, framecount * this.angularSpeed);
        mat4.scale(modelView, [1.3, 1.3, 1.3]);

        var MVP = mat4.create();
        mat4.multiply(persp, modelView, MVP);

        //Bind attributes/uniforms to their values
        //Fluent programming ftw
        this.shaderProgram.setAttributes({
            "aVertexPosition": this.boxPositions,
            "aColor": this.boxColors
        }).setUniforms({
            "uMVMatrix": modelView,
            "uMVPMatrix": MVP
        }).use(); //We are going to draw with this shader

        //Using these indices
        this.boxIndices.bind();
        
        //Cmon gl: DRAW!
        this.gl.drawElements(this.gl.TRIANGLES, 36, this.gl.UNSIGNED_SHORT, 0);
    },
    
    //Easy one
    changeClearColor: function(color){
        this.gl.setOptions({clearColor: color});
    }
}
