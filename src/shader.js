

//Represents a WebGL Shader program
//The constructor takes two shaders to be attached immediately
//TODO allow the Shaders to be attached later ?
wok.ShaderProgram = function(){
    
    //Create the WebGL Shader program and decorate it
    var program = this.gl.createProgram();
    wok.instance(program, this);

    program.linked = false;    
    program.attributes = {};
    program.uniforms = {};

    //Arguments are shaders to be attached directly
    for(var i=0; i<arguments.length; i++){
        program.attach(arguments[i]);
    }
    
    //Suppose that if there are 2 shaders or more we can link
    //Why does someone need to attach multiple fs or vs ?
    if(this.arguments.length > 1)
        return program.link();     //Returns null if the link fails

    
    return program;    
}

wok.ShaderProgram.prototype = {

    //Attach shader to the program
    attach: function(shader){
        this.gl.attachShader(this, shader);
    },

    //Try to link the shader
    link: function(){
        this.gl.linkProgram(this);

        if (!this.gl.getProgramParameter(this, this.gl.LINK_STATUS)) {
            this.gl.error("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this));
            return null;
        }
        this.computeVariables();

        return this;
    },

    //Creates the table containing the shader's uniforms and attributes
    computeVariables: function(){

        //Get all the attributes in the attribute info table
        var attributeNumber = this.gl.getProgramParameter(this, this.gl.ACTIVE_ATTRIBUTES);
        
        for(var i=0; i<attributeNumber; i++){
            var activeInfo = this.gl.getActiveAttrib(this, i);
            this.attributes[activeInfo.name] = {
                arraySize: activeInfo.size, //A size of 1 probably means it is not an array
                type: activeInfo.type,
                handle: this.gl.getAttribLocation(this, activeInfo.name)
            }
        }
        
        
        //and the uniform info table
        var uniformNumber = this.gl.getProgramParameter(this, this.gl.ACTIVE_UNIFORMS);
        
        for(var i=0; i<uniformNumber; i++){
            var activeInfo = this.gl.getActiveUniform(this, i);
            this.uniforms[activeInfo.name] = {
                arraySize: activeInfo.size, //A size of 1 probably means it is not an array
                type: activeInfo.type,
                handle: this.gl.getUniformLocation(this, activeInfo.name)
            }
        }
    
        return this;    
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
    //FIXME: What to do if it is not linked ?
    setAttributes: function(attributes){
        for(var attr in attributes){
            if( !(attr in this.attributes) ){
                continue;
            }
            attributes[attr].bind();

            var size = this.gl.glType[this.attributes[attr].type].size * this.attributes[attr].arraySize
            this.gl.vertexAttribPointer(this.attributes[attr].handle, size, this.gl.FLOAT, false, 0, 0);    
        }
        
        return this;
    },

    //Given a dict containing values, binds shader uniforms to these values
    //FIXME: What to do if it is not linked ?
    setUniforms: function(uniforms){

        for(var uni in uniforms){

            if( !(uni in this.uniforms) ){
                continue;
            }
            
            var uniInfo = this.uniforms[uni]
            var typeInfo = this.gl.glType[uniInfo.type];
            var toSet = uniforms[uni];
            var isTexture = false;

            //If the uniform is an array value the function takes an array of values
            //Making sure WebGL gets what it wants
            var arrayArg = []
            if(uniInfo.arraySize > 1){
                arrayArg = wok.utils.concatArray(toSet);
            }else{
                if(toSet.length){
                    arrayArg = toSet;
                }else{
                    arrayArg = [toSet];  
                }
            }

            //Textures need to be bound to a texture unit before it can be used
            //And the value passed to the uniform is the n° of that unit
            //Here we find for each texture a unit and replace it directly in arrayArg
            if(typeInfo.type == "texture"){
                for(var i=0; i<arrayArg.length; i++){
                    arrayArg[i] = this.gl.TexUnitManager.activeTexture(arrayArg[i]);
                    isTexture = true;
                }
            }
            
            //Warning !!! GL functions need to be called with this = gl
            //Make the actual call to the GL depending on the uniform type
            //Texture are treated like ints as we are giving a tex unit n°
            if(typeInfo.type == "int" || isTexture){
                typeInfo.setter.call(this.gl, uniInfo.handle, new Int32Array(arrayArg));
            }else if(typeInfo.type == "float"){
                typeInfo.setter.call(this.gl, uniInfo.handle, new Float32Array(arrayArg));
            }else{
                typeInfo.setter.call(this.gl, uniInfo.handle, false, new Float32Array(arrayArg));
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
  
    this.type = type;
    
    //If the compilation fail return nothing
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    
    if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)){
        this.gl.error("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
        return null;
    }

    this.gl.info("Succesfully compiled the shader");
    
    return shader;
}

//Builds a Shader from the given script element. This function will guess the 
//shader type based on the script's mimetype
wok.Shader.fromElement = function(element){
    if(!element){
        this.gl.warn("Trying to create a shader from a inexistant element");
        return null;
    }
    
    //Let's suppose there are no HTML tags inside the script
    var shaderSource = element.textContent;

    if(element.type == "x-shader/x-fragment"){
        return new this.gl.FragmentShader(shaderSource);
    }else if (element.type == "x-shader/x-vertex"){
        return new this.gl.VertexShader(shaderSource);
    }else{
        this.gl.warn("Shader element type must be x-shader/x-[fragment|shader]");
        return null;  // Unknown shader type
    }
}

wok.Shader.prototype = {
    destroy: function(){
        this.gl.deleteShader(this);
    },
    
    getType: function(){
        return this.type;
    },

    isFragment: function(){
        return this.type == this.gl.FRAGMENT_SHADER;
    },
    
    isVertex: function(){
        return this.type == this.gl.VERTEX_SHADER;
    }
};
