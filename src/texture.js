
wok.Texture = function(src, options){
    var texture = this.gl.createTexture();
    wok.instanceGLObj(texture, this);

    texture.lastTimeActive = -1;
    texture.texUnit = -1;

    texture.minFilter = this.gl.NEAREST;
    texture.magFilter = this.gl.NEAREST;

    texture.wrapS = this.gl.REPEAT;
    texture.wrapT = this.gl.REPEAT;

	//What if there is option and no src ?
    if(src) texture.from(src, options);

    return texture;
}

//wok.defaultTextureOptions = {}

wok.Texture.emptyTexture = function(width, height, options){
        return new this.gl.Texture().emptyData(width, height, options);
}

wok.Texture.prototype = {

    //Allows everyone to active a texture without knowing what is the manager
    activate: function(){
        return this.gl.TexUnitManager.activeTexture(this);
    },

    //Binds the current texture
    bind: function(){
        if(this.gl.boundTexture !== this){
			this.gl.TexUnitManager.notifyBeforeBind(this);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this);
            this.gl.boundTexture = this;
        }
        return this;
    },
    
    //Please support hotloading of textures and cubemaps
    from: function(src, options){
        return this.fromElement(src, options);
    },

    fromElement: function(element, options){
        //Make sure the element is fully loaded before we get the texture
        //FIXME: if it's a video what should we do ?
        if(!element.complete){
            var texture = this;
            
            element.onload = function(){texture.fromElement(this);};

            return this;
        }

        //ADDME: texture from video (that updates automatically);        
        this.dataFromElement(element, options);

        this.gl.info("Successfully loaded the texture");
        return this;
    },

    //Please add many many options to control the format
    //FIXME mipmaps ?
    dataFromElement: function(element, optArg){
        var options = this.setupTexOptions(optArg || {});
        this.bind();
        this.setOptions(options);
        
        //FIXME: allow different internal formats ?
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, options["gl_format"], element);        
        return this;
    },
    
    //FIXME mipmaps ?
    dataFromArray: function(array, width, height, optArg){
        var options = this.setupTexOptions(optArg || {});
        this.bind();
        this.setOptions(options);
        
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, options["gl_format"], options["formatArray"](array));
        return this;
    },

    //FIXME mipmaps ?
    emptyData: function(width, height, optArg){
        var options = this.setupTexOptions(optArg || {});
        this.bind();
        this.setOptions(options);
       
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, width, height, 0, this.gl.RGBA, options["gl_format"], null);
        return this;
    },

    setupTexOptions: function(optArg){
        if(optArg["format"] == "float"){
            optArg["magFilter"] = optArg["minFilter"] = "nearest";
        }
        optArg["gl_format"] = this.gl.textureFormat[ ("format" in optArg ? optArg["format"] : "ubyte") ];

        optArg["formatArray"] = this.gl.textureFormatArray[ ("format" in optArg ? optArg["format"] : "ubyte") ];
        return optArg;
    },

    //Sets the filter mode of the texture
    setFilterAndWrap: function(){
        this.bind();
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.minFilter);        

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.wrapS);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.wrapT);
    },

    //Set options using a table
    setOptions: function(options){
        if("magFilter" in options)
            this.magFilter = this.gl.textureFilter[options["magFilter"]];
        if("minFilter" in options)
            this.minFilter = this.gl.textureFilter[options["minFilter"]];
        if("wrap" in options)
            this.wrapS = this.wrapT = this.gl.textureWrapMode[options["wrap"]];
        if("wrapS" in options)
            this.wrapS = this.gl.textureWrapMode[options["wrapS"]];
        if("wrapT" in options)
            this.wrapT = this.gl.textureWrapMode[options["wrapT"]];
        this.setFilterAndWrap();
        return this;
    },
    
/*    renderTo: function(){
        this.fbo = this.fbo || new this.gl.FrameBuffer(128, 128, {color: this});
        this.fbo.renderTo(false);
    },*/
    
    isTexture: function(){
        return true;
    }
}

//FIXME: Battle test it !!!!
wok.TexUnitManager = function(gl){
    this.gl = gl;

    this.unitNumber = this.gl.getParameter(this.gl.MAX_TEXTURE_IMAGE_UNITS);

    this.count = 0;

    //Fill the Texture unit with no texture
    this.units = []
    for(var i=0; i<this.unitNumber; i++){
        this.units.push(null);
    }
};

wok.TexUnitManager.prototype = {
    activeTexture: function(texture){

        this.count ++;

        if(texture.texUnit >=0){
            texture.lastTimeActive = this.count;
            return texture.texUnit;
        }

        var unit = 0;
        for(var i=0; i<this.unitNumber; i++){
            if(!this.units[i]){
                unit = i;
                break;
            }
            if(this.units[i].lastTimeActive < this.units[unit].lastTimeActive)
                unit = i;
        }

        if(this.units[unit])
            this.units[unit].texUnit = -1;
        this.units[unit] = texture;
        texture.lastTimeActive = this.count;
        texture.texUnit = unit;
        this.gl.activeTexture(this.gl.TEXTURE0 + unit);
        texture.bind();
        
        return unit;
    },
	notifyBeforeBind: function(texture){
        if(texture.texUnit >=0){
			this.gl.activeTexture(this.gl.TEXTURE0 + texture.texUnit);
        }else{
			this.activeTexture(texture);
			//Maybe we should make it have a smaller lastTimeActive so that it gets recycled quicker ?
		}
	}
};


