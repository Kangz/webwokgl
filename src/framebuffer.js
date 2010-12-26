//Represents a framebuffer
//The construct takes the size of the framebuffer
//I think these must be power of two
wok.FrameBuffer = function(width, height){
    
    var frameBuffer = this.gl.createFramebuffer();
    wok.instanceGLObj(frameBuffer, this);

    frameBuffer.width = width;
    frameBuffer.height = height;

    //In most cases we can attach things when we create the framebuffer
    if(arguments.length > 2)
        frameBuffer.attach(arguments[2]);
        
    return frameBuffer;

};

wok.FrameBuffer.prototype = {

    //FIXME: with mipmaps allow the mipmap level we have to draw to
    //FIXME: with cube texture allow to get the target
    //Attach an object to a render target with the specified option
    //Valid object are Textures, Renderbuffers or "auto"
    internalAttach: function(target, object, options){

        this.bind();

        var attachment = this.gl.frameBufferAttachment[target];
        
        //Auto creates a framebuffer for the render target
        if(object == "auto"){
            var storage = ("storage" in options) ? options["storage"] : this.gl.defaultRenderBufferStorage[target];
            object = new this.gl.RenderBuffer(storage, this.width, this.height);
        }

        //Actually attaches the object
        if(object.isRenderBuffer){
            this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.frameBufferAttachment[target], this.gl.RENDERBUFFER, object);
        }else{
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.frameBufferAttachment[target], this.gl.TEXTURE_2D, object, 0);
        }

    },

    //Attaches objects to the framebuffer
    //The argument must be a dictionnary in the form
    // { rendertarget: object, rendertarget_options: options, ...}
    attach: function(attachment){
        for(target in this.gl.frameBufferAttachment){
            if(target in attachment){
                var options = (target + "_options" in attachment) ? attachment[target + "_options"] : {};
                this.internalAttach(target, attachment[target], options);
            }
        }
        return this;
    },

    //FIXME: as usual do not bind twice
    //Binds the framebuffer
    bind: function(){
        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this);
    },

};


//Represents a renderbuffer
//The constructor takes the storage type of the renderbuffer and it's size
wok.RenderBuffer = function(storage, width, height){

    var renderBuffer = this.gl.createRenderbuffer();
    wok.instanceGLObj(renderBuffer, this);

    renderBuffer.bind();
    this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.renderBufferStorage[storage], width, height);

    return renderBuffer;
};

wok.RenderBuffer.prototype = {

    //FIXME: as usual do not bind twice
    //Binds the renderbuffer
    bind: function(){
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, this);
    },
    
    //Used to known this object is a renderbuffer (as opposed to a texture)
    isRenderBuffer: function(){
        return true;
    }

};
