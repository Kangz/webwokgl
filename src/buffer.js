//Represents a WebGL ArrayBuffer
//The constructor takes a usage and a data array
wok.ArrayBuffer = function(usage){
    return new this.gl.Buffer(usage, this.gl.ARRAY_BUFFER, wok.utils.concatArray(arguments, 1));
}


//Represents a WebGL ElementBuffer
//The constructor takes a usage and a data array
wok.ElementBuffer = function(usage){
    return new this.gl.Buffer(usage, this.gl.ELEMENT_ARRAY_BUFFER, wok.utils.concatArray(arguments, 1))
}


//Represents a WebGL buffer
//The constructor takes a usage a buffertype and a data array
wok.Buffer = function(usage, type, data){

    if(!usage){
        this.gl.error("A Buffer need a usage")
        return null;
    }

    var buffer = this.gl.createBuffer();
    wok.instance(buffer, this);

    buffer.usage = usage;
    buffer.type = type;

    if(data){
        buffer.internalFeed(data);
    }

    return buffer;
};


wok.Buffer.prototype = {

    //Feed data to be put in the buffer
    feed: function(){
        this.internalFeed(wok.utils.concatArray(arguments));
    },

    //returns true if the buffer is a Buffer
    isBuffer: function(){
        return true;
    },

    //returns true if the buffer is an ArrayBuffer
    isArrayBuffer: function(){
        return this.type==this.gl.ARRAY_BUFFER;
    },    

    //returns true if the buffer is an ElementBuffer
    isElementBuffer: function(){
        return this.type==this.gl.ELEMENT_ARRAY_BUFFER;
    },

    //Feed the data to the gl BUffer
    internalFeed: function(data){
        this.gl.info("Uploading " + data.length + " elements of data to a buffer")
        this.bind();

        var arrayType = this.type == this.gl.ARRAY_BUFFER ? Float32Array : Uint16Array;
        this.gl.bufferData(this.type, new arrayType(data), this.usage);
    },

    //TODO Check if it is already bound
    //Choose this buffer to be used for the next operations
    bind: function(){
        this.gl.bindBuffer(this.type, this);
    }
}
