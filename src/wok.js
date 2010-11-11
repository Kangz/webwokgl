
var wok = {
    
    classes: [
        "ArrayBuffer", "ElementBuffer", "Buffer",
        "Shader", "FragmentShader", "VertexShader",
        "ShaderProgram"
    ],
    modules: [],

    //Create a GL context from a context and encapsulate it within wok
    initGL: function(canvas){
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

        if(gl){ //the spec of Typed Arrays changed recently :
            if(!Float32Array){
                Float32Array = WebGLFloatArray;
            }
            if(!Uint16Array){
                Uint16Array= WebGLUnsignedShortArray;
            }
        }

        wok.extendModule(gl, wok, gl);
        
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

        if(opt["clearColor"] !== undefined)
            gl.clearColor.apply(gl, opt["clearColor"]);
            
        if(opt["clearDepth"] !== undefined)
            gl.clearDepth(opt["clearDepth"]);

        if(opt["depthFunc"] !== undefined)
            gl.depthFunc(opt["depthFunc"]);        
                
        if(opt["depthTest"] !== undefined)
            if(opt["depthTest"]) gl.enable(gl.DEPTH_TEST);
            else gl.disable(gl.DEPTH_TEST);
    }
};
