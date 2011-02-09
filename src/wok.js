
var wok = {
    
    GLclasses: [
        "ArrayBuffer", "ElementBuffer", "Buffer",
        "Shader", "FragmentShader", "VertexShader",
        "ShaderProgram",
        "Texture",
        "RenderBuffer", "FrameBuffer"
    ],
    classes: [
    
    ],
    modules: [],

    //Provides callback for logging
    info: function(string){this.onInfo(string);},
    warn: function(string){this.onWarn(string);},
    error: function(string, object){
        if(!this.onError(string)){
            throw {error: string, data: object};
        }
    },
    onInfo: function(){},
    onWarn: function(){},
    onError: function(){},
    
    //Keep track of the bound object so as to avoid unnecessary bind commands
    usedProgram: null,
    boundBuffer: null,
    boundTexture: null,

    //Convenient tables
    stringToDepthFunc: {},
    textureFormat: {},
    textureFormatArray: {},
    textureFilter: {},
    //Store information about each opengl Type (size, uniform setter, type etc ...)
    glType: {},
    renderBufferStorage: {},
    frameBufferAttachment: {},
    defaultRenderBufferStorage: {},


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
            return null;
        }

        gl.canvas = canvas;

        //Decorate the context with wok so as to be able to have multiple contexts    
        wok.extendModule(gl, wok, gl);

        //Create a function that will be used by objects to get their gl
        gl.getGL = function(){return gl;};

        //All the initialisation is done there
        if(arguments.length > 1)
            gl.initSelf(options);
        else
            gl.initSelf({});

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
        
        //Create all the proxy classes for GL objects
        for(var i=0; i<module.GLclasses.length; i++){
            
            //This is a fake constructor that applies the real constructor to the proxy class
            var proxyClass = function(){
                return arguments.callee.wokClass.apply(arguments.callee, arguments);
            }
            
            //Tell the proxyClass about the context and it's base class
            proxyClass.gl = context;
            proxyClass.wokClass = module[module.GLclasses[i]];
            
            //Make the actual proxy
            for(var attr in proxyClass.wokClass)
                proxyClass[attr] = proxyClass.wokClass[attr];
            
            proxyClass.prototype = proxyClass.wokClass.prototype;

            obj[module.GLclasses[i]] = proxyClass;
        }

        //TODO extend modules

/*        for(var i=0; i<module.modules.length; i++){
            obj[module.modules[i]] = {};
            wok.extendModule(obj[module.modules[i]], module[module.modules[i]], webgl);
        }*/ 
    },

    //First function called on a context as many things need to be set up using this context
    initSelf: function(options){

        //The spec requires that call to viewport, otherwise the results are undefined
        this.viewport(0, 0, this.canvas.width, this.canvas.height);

        //Initialise the convenient tables ;)
        //FIXME: share most things between contexts to avoid calculation ?
        this.initConvenientTables();
        
        //These are default options
        this.setOptions({
            webGLFlipY: true
        });
        
        //User-given options
        this.setOptions(options);

        this.TexUnitManager = new wok.TexUnitManager(this);

        wok.input.createCanvasCallbacks(this, this.canvas);

        //Move this somewhere else ?
        this.screen = {
            gl: this,
            bind: function(){
                this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
            }
        }
    },

    //Decorate a WebGL object with a class to have it act like an instance of that class
    instanceGLObj: function(child, supertype){
        for(var property in supertype.prototype){
            //I guess I don't need that check
            if(! (property in child))
                child[property] = supertype.prototype[property];  
        }
        //TODO add the class' attributes ?
        child.gl = supertype.gl;
        return child;
    },
    
    //Set options using a table
    setOptions: function(opt){
        for(var option in opt){
            if(option in wok.options){
                wok.options[option](this, opt[option]);
            }else{
                this.warn("Invalid option name: " + option);
            }
        }
        return this;
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
        this.glType[this.BOOL] = {
            type: "bool",
            setter: this.uniform1iv,
            size: 1
        };
        this.glType[this.BOOL_VEC2] = {
            type: "bool",
            setter: this.uniform2iv,
            size: 2
        };
        this.glType[this.BOOL_VEC3] = {
            type: "bool",
            setter: this.uniform3iv,
            size: 3
        };
        this.glType[this.BOOL_VEC4] = {
            type: "bool",
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
        this.glType[this.SAMPLER_2D] = {
            type: "texture",
            setter: this.uniform1iv,
            size: 1
        }
        
        this.stringToDepthFunc["never"] = this.NEVER;
        this.stringToDepthFunc["always"] = this.ALWAYS;
        this.stringToDepthFunc["<"] = this.LESS;
        this.stringToDepthFunc["<="] = this.LEQUAL;
        this.stringToDepthFunc["=="] = this.stringToDepthFunc["="] = this.EQUAL; //will help some
        this.stringToDepthFunc[">"] = this.GREATER;
        this.stringToDepthFunc[">="] = this.GEQUAL;
        this.stringToDepthFunc["!="] = this.NOTEQUAL;

        this.textureFormat["ubyte"] = this.UNSIGNED_BYTE;
        this.textureFormat["ushort4444"] = this.UNSIGNED_SHORT_4_4_4_4; //are these really needed ?
        this.textureFormat["ushort5551"] = this.UNSIGNED_SHORT_5_5_5_1;
        this.textureFormat["ushort565"] = this.UNSIGNED_SHORT_5_6_5;
        //Todo check for the extension
        this.textureFormat["float"] = this.UNSIGNED_SHORT_5_6_5;

        this.textureFormatArray["ubyte"] = Uint8Array;
        this.textureFormatArray["ushort4444"] = Uint16Array; //are these really needed ?
        this.textureFormatArray["ushort5551"] = Uint16Array;
        this.textureFormatArray["ushort565"] = Uint16Array;
        //Todo check for the extension
        this.textureFormatArray["float"] = Float32Array;     

        this.textureFilter["linear"] = this.gl.LINEAR;
        this.textureFilter["nearest"] = this.gl.NEAREST;

        this.renderBufferStorage["rgba4"] = this.RGBA4;
        this.renderBufferStorage["rgb5a1"] = this.RGB5_A1;
        this.renderBufferStorage["rgb565"] = this.RGB565;
        this.renderBufferStorage["depth"] = this.DEPTH_COMPONENT16;
        this.renderBufferStorage["stencil_index"] = this.STENCIL_INDEX;
        this.renderBufferStorage["stencil_index8"] = this.STENCIL_INDEX8;
        this.renderBufferStorage["depth_stencil"] = this.DEPTH_STENCIL;

        this.frameBufferAttachment["color"] = this.COLOR_ATTACHMENT0;
        this.frameBufferAttachment["depth"] = this.DEPTH_ATTACHMENT;
        this.frameBufferAttachment["stencil"] = this.STENCIL_ATTACHMENT;
        this.frameBufferAttachment["depth_stencil"] = this.DEPTH_STENCIL_ATTACHMENT;

        this.defaultRenderBufferStorage["color"] = "rgba4";
        this.defaultRenderBufferStorage["depth"] = "depth";
        this.defaultRenderBufferStorage["stencil"] = "stencil_index";
        this.defaultRenderBufferStorage["depth_stencil"] = "depth_stencil";
    }
};
