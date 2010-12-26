
wok.Texture = function(src){
    var texture = this.gl.createTexture();
    wok.instanceGLObj(texture, this);

    texture.lastTimeActive = -1;
    texture.texUnit = -1;

    texture.minFilter = this.gl.NEAREST;
    texture.magFilter = this.gl.NEAREST;

    if(src) texture.from(src);

    return texture;
}

wok.defaultTextureOptions = {}

wok.Texture.emptyTexture = function(width, height){
        return new this.gl.Texture().emptyData(width, height);
}

wok.Texture.prototype = {

    //Allows everyone to active a texture without knowing what is the manager
    activate: function(){
        return this.gl.TexUnitManager.activeTexture(this);
    },

    //Binds the current texture
    bind: function(){
        if(this.gl.boundTexture !== this){
            this.gl.bindTexture(this.gl.TEXTURE_2D, this);
            this.gl.boundTexture = this;
        }
        return this;
    },
    
    //Please support hotloading of textures
    from: function(src){
        return this.fromElement(src);
    },

    fromElement: function(element){
        //Make sure the element is fully loaded before we get the texture
        //FIXME: if it's a video what should we do ?
        if(!element.complete){
            var texture = this;
            
            element.onload = function(){texture.fromElement(this);};

            return this;
        }

        //ADDME: texture from video (that updates automatically);        
        this.dataFromElement(element);

        this.gl.info("Successfully loaded the texture");
        return this;
    },

    //Please add many many options to control the format
    //FIXME mipmaps ?
    dataFromElement: function(element){
        this.bind();
        
        //FIXME: allow different internal formats ?
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, element);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.minFilter);
        
        return this;
    },
    
    //FIXME mipmaps ?
    dataFromArray: function(array, width, height){
        this.bind();
        
        //FIXME: allow different internal formats ?
        this.gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, Uint8Array(array));
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.minFilter);
        
        return this;
    },

    //FIXME mipmaps ?
    emptyData: function(width, height){
        this.bind();

        //FIXME: allow different internal formats ?
        this.gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.magFilter);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.minFilter);

        return this;
    },

    //Set options using a table
    setOptions: function(options){
        if(options["magFilter"])
            this.magFilter = this.gl.textureFilter[options["magFilter"]];
        if(options["minFilter"])
            this.magFilter = this.gl.textureFilter[options["minFilter"]];
            
        return this;
    },
    
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
//FIXME: what if a i bind a texture while I don't want to activate that texture ?
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
    }
};
