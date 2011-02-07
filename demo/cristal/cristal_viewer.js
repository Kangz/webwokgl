//You can directly set the following members
// yaw, pitch, polygonColors, color
var CristalViewer = function(canvas, polygonArg, options){

        this.gl = wok.initGL(canvas, {

            //Basic setup
            clearColor: [0.08, 0.08, 0.2, 1.0],
            depthTest: true,
            clearDepth: 10000,

            //set up logging
            info: function(msg){
                    $("#logs")[0].innerHTML += "\n\n-----------> INFO <-----------\n" + msg;
                },
            warn: function(msg){
                    $("#logs")[0].innerHTML += "\n\n-----------> WARN <-----------\n" + msg;
                },
            error: function(msg){
                    $("#logs")[0].innerHTML += "\n\n-----------> ERROR <-----------\n" + msg;
                }
        });

        if(!this.gl){
            alert("WTF NO GL!!!!");
            return;
        }

        //retrieve some args
        this.yaw = options["yaw"] ? options["yaw"] : 0.0;
        this.pitch = options["pitch"] ? options["pitch"] : 0.0;
        this.polygonColors = options["polygonColors"] ? options["polygonColors"] : false;
        this.color = options["color"] ? options["color"] : [1.0, 0.5, 0.5];

        this.polygons = polygonArg;

        var planeNumber = 0;
        for(polygon in this.polygons){
            planeNumber += this.polygons[polygon].planeNumber;
        }

        //Build the shader program from the 2 script elements and tell them the number of planes
        this.shaderProgram = new this.gl.ShaderProgram(
            this.gl.Shader.fromElement($("#shader-fs")[0], {n_planes: planeNumber}),  //TODO do not depend on the markup ?
            this.gl.Shader.fromElement($("#shader-vs")[0])
        );
        //Creates the array used to draw one plane
        this.planePositions = new this.gl.ArrayBuffer(this.gl.STATIC_DRAW, [
            -10.0, -10.0,
             10.0, -10.0,
            -10.0,  10.0,
             10.0,  10.0
        ]);

        //Setting up the mouse to control the view
        this.lastMousePos = {x: 0, y:0}

        var mouse = this.gl.mouse

        mouse.onOver = function(){
            var pos = mouse.pos;
            viewer.lastMousePos = {"x": pos.x, "y": pos.y};
        }

        mouse.onMove = function(x, y){
            if(mouse.leftPressed){
                var relx = viewer.lastMousePos.x - x;
                var rely = viewer.lastMousePos.y - y;
                
                viewer.yaw += relx * 0.01;
                viewer.pitch = wok.utils.clamp(rely * 0.01 + viewer.pitch, -Math.PI/2, Math.PI/2);
            }
            viewer.lastMousePos = {"x": x, "y": y};
        }
}

CristalViewer.prototype = {
    update: function(){

        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

        //Gather plane uniforms from all the polygons
        //And the minimum coeff
        var plane_uniforms = [];
        var min_coeff = 10000;
        for(polygon in this.polygons){
            plane_uniforms = plane_uniforms.concat(this.polygons[polygon].uniform);
            if(this.polygons[polygon].coeff < min_coeff){
                min_coeff = this.polygons[polygon].coeff;
            }
        }

        //Builds the view matrix (scale with 1/coeff so that things don't get too small)
        var vpMatrix = mat4.create();
        mat4.identity(vpMatrix);
        mat4.scale(vpMatrix, [0.5,0.5,0.5]);
        mat4.scale(vpMatrix, [1/min_coeff, 1/min_coeff, 1/min_coeff]);
        mat4.rotateX(vpMatrix, this.pitch);
        mat4.rotateY(vpMatrix, this.yaw);


        //Draws one polygon after the other
        for(polygon in this.polygons){
            polygon = this.polygons[polygon];

            //Do this by drawing a plane for each of the polygon's faces
            for(var i=0; i<polygon.directions.length; i++){

                var dir = polygon.directions[i];

                //rotate the plane to the right direction
                var mMatrix = this.dirToTransform(dir);
                mat4.rotateY(mMatrix, Math.PI/2);

                this.shaderProgram.setAttributes({
                    "aPosition": this.planePositions
                }).setUniforms({
                    "mMatrix": mMatrix,
                    "vpMatrix": vpMatrix,
                    "normal": dir,
                    "color": this.polygonColors ? polygon.color : this.color,
                    "planes": plane_uniforms,
                    "planeZ": polygon.coeff
                }).use();

                this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
            }
        }
    },
    
    //Compute a transform that move 1, 0, 0 to dir
    dirToTransform: function(argDir){
        var transform = mat4.create();
        mat4.identity(transform)
        
        var dir = vec3.normalize(argDir);

        //get the spherical coordinates
        var phi = Math.atan2(dir[1], dir[0])
        var theta = Math.acos(dir[2]);

        //Build the transform
        mat4.rotateZ(transform, phi);
        mat4.rotateY(transform, theta - Math.PI/2);

        return transform;
    }
};


//This is a polygon class to manage the planes
//polygon.uniform is the data to be passed to the shader
//polygon.coeff is d(planes, center)
//polygon.directions is the normal of the different planes
var Polygon = function(raw_data, color, coeff){

    //default coeff to 1
    var coeff = coeff ? coeff : 1;

    this.color = color;
    this.raw_data = raw_data;
    this.directions = []

    //Every polygon is symetric by the origin
    //Or is it not ?
    for(var i=0; i<raw_data.length; i++){
        var dir = vec3.normalize(raw_data[i]);
        this.directions.push(dir);
        //vec3.negate(dir) returns dir on this specific function on my comp
        this.directions.push([-dir[0], -dir[1], -dir[2]]);
    }

    this.planeNumber = this.directions.length;

    //Create the uniforms
    this.update(coeff);
};

Polygon.prototype = {

    //Updates the uniform with the distance to the center
    update: function(coeff){
        var uniform = [];

        for(var i=0; i<this.directions.length; i+=2){
            var dir = this.directions[i];
            uniform = uniform.concat([dir[0]/coeff, dir[1]/coeff, dir[2]/coeff]);
        }

        this.uniform = uniform;
        this.coeff = coeff;

        return this;
    }
};


//Some common plane_lists
var planes_list = (function(){
    //Some values for the dodecahedron
    var phi = (1 + Math.sqrt(5)) / 2;
    var dodeAngle = Math.atan(1/(phi - 1));
    var dodeSin = Math.sin(dodeAngle);
    var dodeCos = Math.cos(dodeAngle);

    return {
        octahedron: [
            [1.0, 1.0, 1.0],
            [1.0, 1.0, -1.0],
            [1.0, -1.0, 1.0],
            [1.0, -1.0, -1.0]
        ],
        //Finally I've got the dodecahedron
        dodecahedron: [
            [0.0, dodeSin, dodeCos],
            [0.0, -dodeSin, dodeCos],
            [dodeSin, dodeCos, 0.0],
            [-dodeSin, dodeCos, 0.0],
            [dodeCos, 0.0, dodeSin],
            [dodeCos, 0.0, -dodeSin],
        ],
        rhombic_dodecahedron: [
            [0.0, 1.0, 1.0],
            [0.0, -1.0, 1.0],
            [1.0, 1.0, 0.0],
            [-1.0, 1.0, 0.0],
            [1.0, 0.0, 1.0],
            [1.0, 0.0, -1.0],
        ],
        cube: [
            [1.0, 0.0, 0.0],
            [0.0, 1.0, 0.0],
            [0.0, 0.0, 1.0]
        ]
    };
})();

