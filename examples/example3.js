var example = {

    init: function(){
        //Get the wok context and give startup options
        gl = wok.initGL($("#canvas")[0], {

            //Basic setup
            clearColor: [0.0, 0.0, 0.0, 1.0],
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
        metaShaderProgram = new gl.ShaderProgram(
            gl.Shader.fromElement($("#metaball-fs")[0]),
            gl.Shader.fromElement($("#generic-vs")[0])
        );

        screenShaderProgram = new gl.ShaderProgram(
            gl.Shader.fromElement($("#screen-fs")[0]),
            gl.Shader.fromElement($("#generic-vs")[0])
        );

        //Creates the arrays used to draw the board
        screenPositions = new gl.ArrayBuffer(gl.STATIC_DRAW, [
            -1.0, -1.0,
             1.0, -1.0,
            -1.0,  1.0,
             1.0,  1.0
        ]);
        
        this.points = [];
        for(var i=0; i<6; i++){
            var speed_angle = Math.random() * 2 * Math.PI;
            this.points.push({
                x: Math.random()*2 -1,
                y: Math.random()*2 -1,
                speed_x: Math.cos(speed_angle),
                speed_y: Math.sin(speed_angle)
            });
        }
/*        screenTexCoord = new gl.ArrayBuffer(gl.STATIC_DRAW, [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            1.0, 1.0
        ]);*/

        metaballTexture = gl.Texture.emptyTexture(512, 512);

        framebuf = new gl.FrameBuffer(512, 512, {
            color: metaballTexture
        });

//        setInterval(function(){example.drawScene();}, 15);
        this.drawScene();
    },

    //Draws each box
    drawScene: function(){

        framebuf.bind();

        gl.clear(gl.COLOR_BUFFER_BIT);

        metaShaderProgram.setAttributes({
            "aPosition": screenPositions,
        }).setUniforms({
            "centers": this.updatedPointPositions(),
            "threshold": 15
        }).use();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.screen.bind();

        gl.clear(gl.COLOR_BUFFER_BIT);

        screenShaderProgram.setAttributes({
            "aPosition": screenPositions
        }).setUniforms({
            "screen": metaballTexture
        }).use();

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        wok.utils.requestAnimFrame(function(){example.drawScene();});        
    },
    
    updatedPointPositions: function(){
        var result = [];
        
        for(var index in this.points){
            var point = this.points[index];
            point.x += point.speed_x * 0.013;
            point.y += point.speed_y * 0.013;
            if(! (-1<point.x && point.x<1)){
                point.speed_x = -point.speed_x;
            }
            if(! (-1<point.y && point.y<1)){
                point.speed_y = -point.speed_y;
            }
            result.push([point.x, point.y]);
        }
        return result;
    }
}
