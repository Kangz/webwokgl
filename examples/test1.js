var test = {
    init: function(){

        if(!( gl = wok.initGL($("#glcanvas")[0]) )){
            alert("WTF NO GL!!!!");
            return;
        }

        gl.setOptions({
            clearColor: [0.0, 0.0, 0.5, 1.0],
            clearDepth: 1000.0,
            depthTest: true,
            depthFunc: gl.LEQUAL
        });
        shaderProgram = new gl.ShaderProgram(
            gl.Shader.fromElement($("#shader-fs")[0]),
            gl.Shader.fromElement($("#shader-vs")[0])
        );
        
        boxPositions = new gl.ArrayBuffer(gl.STATIC_DRAW, [
            -0.5, -0.5,  0.5,
             0.5, -0.5,  0.5,
            -0.5,  0.5,  0.5,
             0.5,  0.5,  0.5,
            -0.5, -0.5, -0.5,
             0.5, -0.5, -0.5,
            -0.5,  0.5, -0.5,
             0.5,  0.5, -0.5
        ]);
        
        boxColors = new gl.ArrayBuffer(gl.STATIC_DRAW, [
            0.0, 0.0, 1.0,
            1.0, 0.0, 1.0,
            0.0, 1.0, 1.0,
            1.0, 1.0, 1.0,
            0.0, 0.0, 0.0,
            1.0, 0.0, 0.0,
            0.0, 1.0, 0.0,
            1.0, 1.0, 0.0
        ]);
        
        boxIndices = new gl.ElementBuffer(gl.STATIC_DRAW, [
            0, 1, 2,  2, 1, 3,  // front
            5, 4, 7,  7, 4, 6,  // back
            4, 0, 6,  6, 0, 2,  // left
            1, 5, 3,  3, 5, 7,  // right
            2, 3, 6,  6, 3, 7,  // top
            4, 5, 0,  0, 5, 1   // bottom
        ]);

        framecount = 0;

        setInterval(function(){test.drawScene();}, 15);
    },

    drawScene: function(){

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var persp = mat4.perspective(45, 640.0/480.0, 0.001, 1000.0, persp);

        var modelView = mat4.lookAt([2.5, 1.5, 0], [0, 0, 0], [0, 1, 0]);
        mat4.rotateY(modelView, framecount * 0.05);

        var MVP = mat4.create();
        mat4.multiply(persp, modelView, MVP);
        

        shaderProgram.setAttributes({
            "aVertexPosition": boxPositions,
            "aColor": boxColors
        }).setUniforms({
            "uMVMatrix": modelView,
            "uMVPMatrix": MVP
        }).use();

        boxIndices.bind();
        gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
        
        framecount ++;
    }
}
