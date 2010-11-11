

//Represents a WebGL Shader program
//The constructor takes two shaders to be attached immediately
//TODO allow the Shaders to be attached later ?
wok.ShaderProgram = function(vertex, fragment){
    
    //Create the WebGL Shader program and decorate it
    var program = this.gl.createProgram();
    wok.instance(program, this);
    
    //Attach the shaders and return nothing if it fails
    this.gl.attachShader(program, vertex);
    this.gl.attachShader(program, fragment);
    this.gl.linkProgram(program);
    
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        alert("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(program));
        return null;
    }
    
    
    //If it successfully linked we can build the attribute info table
    program.attributes = {};
    
    var attributeNumber = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
    
    for(var i=0; i<attributeNumber; i++){
        var activeInfo = this.gl.getActiveAttrib(program, i);
        program.attributes[activeInfo.name] = {
            arraySize: activeInfo.size, //A size of 1 probably means it is not an array
            type: activeInfo.type,
            handle: this.gl.getAttribLocation(program, activeInfo.name)
        }
    }
    
    
    //and the uniform info table
    program.uniforms = {};
    
    var uniformNumber = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
    
    for(var i=0; i<uniformNumber; i++){
        var activeInfo = this.gl.getActiveUniform(program, i);
        program.uniforms[activeInfo.name] = {
            arraySize: activeInfo.size, //A size of 1 probably means it is not an array
            type: activeInfo.type,
            handle: this.gl.getUniformLocation(program, activeInfo.name)
        }
    }
    
    //That's all folks
    return program;
}


wok.ShaderProgram.prototype = {

    //FIXME: nicer way to do this ?
    //Returns the number of elements of the given gl type
    //TODO merge with uniformSetterInfo ? and put it in wok ?
    glTypeSize: function(type){
        switch(type){
            case this.gl.FLOAT: 
                return 1;
                
            case this.gl.FLOAT_VEC2: 
                return 2;
            case this.gl.FLOAT_VEC3: 
                return 3;
            case this.gl.FLOAT_VEC4: 
                return 4;
            case this.gl.FLOAT_MAT2: 
                return 4;
            case this.gl.FLOAT_MAT3: 
                return 9;
            case this.gl.FLOAT_MAT4: 
                return 16;
            default:
                return null;       
        }
    },

    //TODO Allow the program to check if it is in use so as to avoid some unnecessary binds
    //Select this shader for use in the following draw calls
    use: function(){
        this.gl.useProgram(this);
        
        for(var attr in this.attributes){
            this.gl.enableVertexAttribArray(this.attributes[attr].handle);
        }

        return this;
    },

    //Fired when the shader gets unused
    //FIXME no use for it now
    ongetUnused: function(){
        for(var attr in this.attributes){
            this.gl.disableVertexAttribArray(this.attributes[attr].handle);
        }
    },

    //Given a dict containing buffers, binds shader attributes to these buffers
    setAttributes: function(attributes){
        for(var attr in attributes){
            if( !(attr in this.attributes) ){
                continue;    
            }
            attributes[attr].bind();

            var size = this.glTypeSize(this.attributes[attr].type) * this.attributes[attr].arraySize
            this.gl.vertexAttribPointer(this.attributes[attr].handle, size, this.gl.FLOAT, false, 0, 0);    
        }
        
        return this;
    },

    //FIXME: nicer way to do this ?
    //Returns the uniform setter function for the given gl type
    //TODO merge with uniformSetterInfo ? and put it in wok ?
    uniformSetterInfo: function(type){
        switch(type){
            case this.gl.INT:
                return {
                    type: "int",
                    setter: this.gl.uniform1iv
                }
            case this.gl.INT_VEC2:
                return {
                    type: "int",
                    setter: this.gl.uniform2iv
                }
            case this.gl.INT_VEC3:
                return {
                    type: "int",
                    setter: this.gl.uniform3iv
                }
            case this.gl.INT_VEC4:
                return {
                    type: "int",
                    setter: this.gl.uniform4iv
                }
            case this.gl.FLOAT:
                return {
                    type: "float",
                    setter: this.gl.uniform1fv
                }
            case this.gl.FLOAT_VEC2:
                return {
                    type: "float",
                    setter: this.gl.uniform2fv
                }
            case this.gl.FLOAT_VEC3:
                return {
                    type: "float",
                    setter: this.gl.uniform3fv
                }
            case this.gl.FLOAT_VEC4:
                return {
                    type: "float",
                    setter: this.gl.uniform4fv
                }
            case this.gl.FLOAT_MAT2:
                return {
                    type: "matrix",
                    setter: this.gl.uniformMatrix2fv
                }
            case this.gl.FLOAT_MAT3:
                return {
                    type: "matrix",
                    setter: this.gl.uniformMatrix3fv
                }
            case this.gl.FLOAT_MAT4:
                return {
                    type: "matrix",
                    setter: this.gl.uniformMatrix4fv
                }
            default:
                return null;               
        }
    },

    //Given a dict containing values, binds shader uniforms to these values
    setUniforms: function(uniforms){

        for(var uni in uniforms){//TODO check if the uniform exists

            if( !(uni in this.uniforms) ){
                continue;    
            }
            
            var uniInfo = this.uniforms[uni]
            var setterInfo = this.uniformSetterInfo(uniInfo.type);
            var toSet = uniforms[uni];

            //If the uniform is an array value the function takes an array of values
            //Making sure WebGL gets what it wants
            var arrayArg = []
            if(uniInfo.arraySize > 1){
                toSet = wok.utils.concatArray(arrayArg);
            }else{
                if(toSet.length){
                    arrayArg = toSet;
                }else{
                    arrayArg = [toSet];  
                }
            }
            
            //Warning !!! GL functions need to be called with this = gl
            //Make the actual call to the GL depending on the uniform type
            if(setterInfo.type == "int"){
                setterInfo.setter.call(this.gl, uniInfo.handle, new WebGLIntArray(arrayArg));
            }else if(setterInfo.type == "float"){
                setterInfo.setter.call(this.gl, uniInfo.handle, new Float32Array(arrayArg));
            }else{
                setterInfo.setter.call(this.gl, uniInfo.handle, false, new Float32Array(arrayArg));
            }
            
        }

        return this;
    }
};




//Represents a WebGL Fragment Shader
//The constructor takes the shader source as an argument
wok.FragmentShader = function(shaderSource){
    return new this.gl.Shader(shaderSource, this.gl.FRAGMENT_SHADER);
};

//Represents a WebGL Vertex Shader
//The constructor takes the shader source as an argument
wok.VertexShader = function(shaderSource){
    return new this.gl.Shader(shaderSource, this.gl.VERTEX_SHADER);
};

//Represents a WebGL Shader
//The constructor takes the shader source and the shader type as arguments
wok.Shader = function(shaderSource, type){

    //Create the WebGL Shader and decorate it
    var shader = this.gl.createShader(type);
    wok.instance(shader, this);    
    
    //If the compilation fail return nothing
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    
    if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)){
        alert("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
        return null;
    }
    
    return shader;
}

wok.Shader.prototype.destroy = function(){
    this.gl.deleteShader(this);
}

//Builds a Shader from the given script element. This function will guess the 
//shader type based on the script's mimetype
wok.Shader.fromElement = function(element){
    if(!element) return null;

    //Let's suppose there are no HTML tags inside the script
    var shaderSource = element.textContent;

    if(element.type == "x-shader/x-fragment"){
       return new this.gl.FragmentShader(shaderSource);
    }else if (element.type == "x-shader/x-vertex"){
        return new this.gl.VertexShader(shaderSource);
    }else{
       return null;  // Unknown shader type
    }
};
