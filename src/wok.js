
var wok = {
    
    classes: [
        "ArrayBuffer", "ElementBuffer", "Buffer",
        "Shader", "FragmentShader", "VertexShader",
        "ShaderProgram"
    ],
    modules: [],

    //Provides callback for logging
    info: function(){},
    warn: function(){},
    error: function(){},

    //Convenient tables
    stringToDepthFunc: {},
    //Store information about each opengl Type (size, uniform setter, type etc ...)
    glType: {},


    //Create a GL context from a context and encapsulate it within wok
    initGL: function(canvas, options){
        var gl = null;
        
        try{
            gl = canvas.getContext("webgl");
        }catch(e){
        }

        if(!gl){
            try{
                gl = canvas.getContext("experimental-webgl");
            }catch(e){
            }
        }

        if(!gl){
            return null
        }

        //the spec of Typed Arrays changed recently :
        if(!Float32Array){
            Float32Array = WebGLFloatArray;
        }
        if(!Uint16Array){
            Uint16Array= WebGLUnsignedShortArray;
        }

        wok.extendModule(gl, wok, gl);

        //Initialise the convenient tables ;)
        //FIXME: share most things between contexts to avoid calculation ?
        gl.initConvenientTables();
        
        if(arguments.length > 1)
            gl.setOptions(options);

        gl.info("Created a new context")
        
        return gl;
    },

    /*
    We need wok to encapsulate every gl context. However we can't just copy every wok attribute
    in the gl as many classes need to use context specific commands (in facts every context command
    is context-specific). 
    Wok's attribute are simply referenced, class are encapsulated in a special proxyClass so that
    this.gl points to the right context.  Modules are treated recursively.
    */    
    extendModule: function(obj, module, context){

        //some modules will need the gl context
        obj.gl = context;
        
        //We're done with attributes
        //FIXME most of them are not needed on the gl object
        for(attr in module)
            obj[attr] = module[attr];
        
        //Create all the proxy classes
        for(var i=0; i<module.classes.length; i++){
            
            //This is a fake constructor that applies the real constructor to the proxy class
            var proxyClass = function(){
                return arguments.callee.wokClass.apply(arguments.callee, arguments);
            }
            
            //Tell the proxyClass about the context and it's base class
            proxyClass.gl = context;
            proxyClass.wokClass = module[module.classes[i]];
            
            //Make the actual proxy
            for(var attr in proxyClass.wokClass)
                proxyClass[attr] = proxyClass.wokClass[attr];
            
            proxyClass.prototype = proxyClass.wokClass.prototype;
            obj[module.classes[i]] = proxyClass;
        }

        //TODO extend modules

/*        for(var i=0; i<module.modules.length; i++){
            obj[module.modules[i]] = {};
            wok.extendModule(obj[module.modules[i]], module[module.modules[i]], webgl);
        }*/ 
    },

    //Decorate a WebGL object with a class to have it act like an instance of that class
    instance: function(child, supertype){
        for(var property in supertype.prototype){
            if(typeof child[property] == "undefined")
                child[property] = supertype.prototype[property];  
        }
        //TODO add the class' attributes ?
        child.gl = supertype.gl;
        return child;
    },
    
    setOptions: function(opt){
        var gl = this.gl; 

        for(option in opt){
            if(option in wok.options){
                wok.options[option](gl, opt[option]);
            }else{
                gl.warn("Invalid option name: " + option);
            }
        }
    },
    
    //Build up some table so as to conveniently us opengl constants/types
    initConvenientTables: function(){
        this.glType[this.INT] = {
            type: "int",
            setter: this.uniform1iv,
            size: 1
        };
        this.glType[this.INT_VEC2] = {
            type: "int",
            setter: this.uniform2iv,
            size: 2
        };
        this.glType[this.INT_VEC3] = {
            type: "int",
            setter: this.uniform3iv,
            size: 3
        };
        this.glType[this.INT_VEC4] = {
            type: "int",
            setter: this.uniform4iv,
            size: 4
        };
        this.glType[this.FLOAT] = {
            type: "float",
            setter: this.uniform1fv,
            size: 1
        };
        this.glType[this.FLOAT_VEC2] = {
            type: "float",
            setter: this.uniform2fv,
            size: 2
        };
        this.glType[this.FLOAT_VEC3] = {
            type: "float",
            setter: this.uniform3fv,
            size: 3
        };
        this.glType[this.FLOAT_VEC4] = {
            type: "float",
            setter: this.uniform4fv,
            size: 4
        };
        this.glType[this.FLOAT_MAT2] = {
            type: "matrix",
            setter: this.uniformMatrix2fv,
            size: 4
        };
        this.glType[this.FLOAT_MAT3] = {
            type: "matrix",
            setter: this.uniformMatrix3fv,
            size: 9
        };
        this.glType[this.FLOAT_MAT4] = {
            type: "matrix",
            setter: this.uniformMatrix4fv,
            size: 16
        };
        
        this.stringToDepthFunc["never"] = this.NEVER;
        this.stringToDepthFunc["always"] = this.always;
        this.stringToDepthFunc["<"] = this.LESS;
        this.stringToDepthFunc["<="] = this.LEQUAL;
        this.stringToDepthFunc["=="] = this.stringToDepthFunc["="] = this.EQUAL; //will help some
        this.stringToDepthFunc[">"] = this.GREATER;
        this.stringToDepthFunc[">="] = this.GEQUAL;
        this.stringToDepthFunc["!="] = this.NOTEQUAL;
        
    }
};
