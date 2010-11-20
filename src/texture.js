
wok.Texture = function(){
    var texture = this.gl.createTexture();
    wok.instance(texture, this);

 
    return texture;
}

wok.Texture.prototype = {

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
        }
        return this;
    }
}
