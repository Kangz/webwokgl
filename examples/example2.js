
var example = {

    init: function(){
        //Get the wok context and give startup options
        gl = wok.initGL($("#canvas")[0], {

            //Basic setup
            clearColor: [0.0, 0.0, 0.5, 1.0],
            texture: true,

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
        
        if(!gl){
            alert("WTF NO GL!!!!");
            return;
        }
        
        //Build the shader program from the 2 script elements
        shaderProgram = new gl.ShaderProgram(
            gl.Shader.fromElement($("#shader-fs")[0]),
            gl.Shader.fromElement($("#shader-vs")[0])
        );

        //Creates the arrays used to draw the board
        boardPositions = new gl.ArrayBuffer(gl.STATIC_DRAW, [
            -0.5, -0.5,
             0.5, -0.5,
            -0.5,  0.5,
             0.5,  0.5
        ]);
        boardTexCoord = new gl.ArrayBuffer(gl.STATIC_DRAW, [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ]);

        //Create the wall texture from the hidden img element
        boardTexture = new gl.Texture($("#brick-texture")[0]);

        setInterval(function(){example.drawScene();}, 15);
    },

    //Draws each box
    drawScene: function(){
    
        //Straightforward
        gl.clear(gl.COLOR_BUFFER_BIT);

        //Compute the transformations
        var persp = mat4.perspective(45, 800/600, 0.001, 1000.0);

        var modelView = mat4.lookAt([0, 0, 2.5], [0, 0, 0], [0, 1, 0]);
        mat4.rotateY(modelView, /*look at mouse*/0);

        var MVP = mat4.create();
        mat4.multiply(persp, modelView, MVP);

        //Bind attributes/uniforms to their values
        shaderProgram.setAttributes({
            "aPosition": boardPositions,
            "aTexCoord": boardTexCoord
        }).setUniforms({
            "uMVMatrix": modelView,
            "uMVPMatrix": MVP,
            "uSampler": boardTexture //Use the texture in the shaders
        }).use();
        
        //Cmon gl: DRAW!
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
}
