//Represents a WebGL ArrayBuffer
//The constructor takes a usage and a data array
wok.ArrayBuffer = function(usage){
    var data = [];
    for(var i=1; i<arguments.length; i++){ //Put this in util ?
        data = data.concat(arguments[i]);
    }

    return new this.gl.Buffer(usage, gl.ARRAY_BUFFER, data)
}


//Represents a WebGL ElementBuffer
//The constructor takes a usage and a data array
wok.ElementBuffer = function(usage){
    var data = [];
    for(var i=1; i<arguments.length; i++){ //Put this in util ?
        data = data.concat(arguments[i]);
    }

    return new this.gl.Buffer(usage, gl.ELEMENT_ARRAY_BUFFER, data)
}


//Represents a WebGL buffer
//The constructor takes a usage a buffertype and a data array
wok.Buffer = function(usage, type, data){

    var buffer = this.gl.createBuffer();
    wok.instance(buffer, this);

    if(!usage){
        alert("Buffer needs a usage");
        return null;
    }

    buffer.usage = usage;
    buffer.type = type;

    if(data.length > 0){
        buffer.internalFeed(data);
    }

    return buffer;
};


wok.Buffer.prototype = {

    //Feed data to be put in the buffer
    feed: function(){
        var data = [];
        for(var i=0; i<arguments.length; i++){
            data = data.concat(arguments[i]);
        }
        this.internalFeed(data);
    },

    //returns true if the buffer is a Buffer
    isBuffer: function(){
        return true;
    },

    //returns true if the buffer is an ArrayBuffer
    isArrayBuffer: function(){
        return this.type==gl.ARRAY_BUFFER;
    },    

    //returns true if the buffer is an ElementBuffer
    isElementBuffer: function(){
        return this.type==gl.ELEMENT_ARRAY_BUFFER;
    },

    //Feed the data to the gl BUffer
    internalFeed: function(data){
        this.bind();

        var arrayType = this.type == gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
        this.gl.bufferData(this.type, new arrayType(data), this.usage);
    },

    //TODO Check if it is already bound
    //Choose this buffer to be used for the next operations
    bind: function(){
        this.gl.bindBuffer(this.type, this);
    }
}
