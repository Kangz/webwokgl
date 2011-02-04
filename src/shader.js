

//Represents a WebGL Shader program
//The constructor takes shaders to be attached immediately
//If there are more than 2 it likes automatically
wok.ShaderProgram = function(){
    
    //Create the WebGL Shader program and decorate it
    var program = this.gl.createProgram();
    wok.instanceGLObj(program, this);

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
        return this;
    },

    //Try to link the shader
    link: function(){
        this.gl.linkProgram(this);

        if (!this.gl.getProgramParameter(this, this.gl.LINK_STATUS)) {
            this.gl.error("Unable to initialize the shader program: " + this.gl.getProgramInfoLog(this));
        }
        this.computeVariables();

        this.linked = true;
        this.gl.info("Successfully linked the shaderprogram");

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
            //Fix a bug in some webgl implementations ...
            //An array's name is supposed to be <name>[0] but some impl give <name>[[0]
            //But still expect us to use <name>[0] to retrieve the handle
            var name = activeInfo.name;
            var index = name.indexOf("[");
            if(index >= 0){
                name = name.slice(0, index) + "[0]";
            }

            this.uniforms[name] = {
                arraySize: activeInfo.size, //A size of 1 probably means it is not an array
                type: activeInfo.type,
                handle: this.gl.getUniformLocation(this, name)
            }
        }
    },
    
    isLinked: function(){
        return this.linked;
    },

    //Select this shader for use in the following draw calls
    use: function(){
        if(!this.linked){
            this.gl.error("You need to link a shader before you use it");
        }
    
        //Do not re-use a program that is allready used (it is a really expensive operation)
        if(this.gl.usedProgram === this){
            return this;
        }
        if(this.gl.usedProgram){
            this.gl.usedProgram.onGetUnused();
        }
        this.gl.usedProgram = this;
        
        this.gl.useProgram(this);
        for(var attr in this.attributes){
            this.gl.enableVertexAttribArray(this.attributes[attr].handle);
        }

        return this;
    },

    //Fired when the shader gets unused
    onGetUnused: function(){
        for(var attr in this.attributes){
            this.gl.disableVertexAttribArray(this.attributes[attr].handle);
        }
    },

    //Given a dict containing buffers, binds shader attributes to these buffers
    //FIXME: What to do if it is not linked ?
    setAttributes: function(attributes){
        for(var attr in attributes){
        
            if( !(attr in this.attributes) ){
                continue; //ignore it as the link phase may remove some Attributes
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

        //Some WebGL implementation require this <-- WTF
        //They do not pass the uniform unless we are using the shader
        //Or maybe it is in the specification ...
        this.use();

        for(var uniArg in uniforms){

            var uni
            
            if( !(uniArg in this.uniforms) ){
                //Check if this uniform is an array (it has a trailing [0])
                if(uniArg+"[0]" in this.uniforms){
                    uni = uniArg + "[0]";
                }else{
                    continue; //ignore it as the link phase may remove some uniforms
                }
            }else{
                uni = uniArg;
            }

            var uniInfo = this.uniforms[uni]
            var typeInfo = this.gl.glType[uniInfo.type];
            var toSet = uniforms[uniArg];
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
                    arrayArg[i] = arrayArg[i].activate();
                    isTexture = true;
                }
            }
            
            //Warning !!! GL functions need to be called with this = gl
            //Make the actual call to the GL depending on the uniform type
            //Texture are treated like ints as we are giving a tex unit n°
            if(typeInfo.type == "int" || isTexture || typeInfo.type == "bool"){
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
//and an optional macro dictionnary
wok.FragmentShader = function(shaderSource, macros){
    return new this.gl.Shader(shaderSource, this.gl.FRAGMENT_SHADER, macros);
};

//Represents a WebGL Vertex Shader
//The constructor takes the shader source as an argument
//and an optional macro dictionnary
wok.VertexShader = function(shaderSource, macros){
    return new this.gl.Shader(shaderSource, this.gl.VERTEX_SHADER, macros);
};

//Represents a WebGL Shader
//The constructor takes the shader source and the shader type as arguments
wok.Shader = function(shaderSource, type, macros){

    //Create the WebGL Shader and decorate it
    var shader = this.gl.createShader(type);
    wok.instanceGLObj(shader, this);
  
    this.type = type;
    
    if(macros){
        shaderSource = wok.Shader.createMacros(macros) + shaderSource;
    }
    
    //If the compilation fail return nothing
    this.gl.shaderSource(shader, shaderSource);
    this.gl.compileShader(shader);
    
    if(!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)){
        this.gl.error("An error occurred compiling the shaders: " + this.gl.getShaderInfoLog(shader));
    }

    this.gl.info("Succesfully compiled the shader");
    
    return shader;
}

//Builds a Shader from the given script element. This function will guess the 
//shader type based on the script's mimetype
wok.Shader.fromElement = function(element, macros){
    if(!element){
        this.gl.error("Trying to create a shader from a inexistant element");
    }
    
    //Let's suppose there are no HTML tags inside the script
    var shaderSource = element.textContent;

    if(element.type == "x-shader/x-fragment"){
        return new this.gl.FragmentShader(shaderSource, macros);
    }else if (element.type == "x-shader/x-vertex"){
        return new this.gl.VertexShader(shaderSource, macros);
    }else{
        this.gl.error("Shader element type must be x-shader/x-[fragment|shader]");
    }
}

wok.Shader.createMacros = function(dict){
    var result = [];
    for(var i in dict){
        result.push("#define " + i.toUpperCase() + " " + dict[i].toString());
    }
    return result.join("\n") + "\n";
};

wok.Shader.prototype = {
	//keep this ?
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
