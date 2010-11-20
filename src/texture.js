
wok.Texture = function(){
    var texture = this.gl.createTexture();
    wok.instance(texture, this);

    this.lastTimeActive = -1;
    this.texUnit = -1;
 
    return texture;
}

wok.Texture.prototype = {

    //Allows everyone to active a texture without knowing what is the manager
    //TESTME
    active: function(){
        return this.gl.TexUnitManager.activeTexture(this);
    },

    //FIXME: avoid unnecessary bind
    bind: function(){
        this.gl.bindTexture(this.gl.TEXTURE_2D, this);
        return this;
    },

    //Please add many many options to control the format
    dataFromElement: function(element){
        if(!element.complete){
            var texture = this;
            element.onload = function(){texture.dataFromElement(this);}
        }else{        
            this.bind();
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, element);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
            
            this.gl.info("Successfully loaded the texture");
        }
        return this;
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
    }
};


