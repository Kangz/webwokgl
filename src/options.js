
wok.options = {
    info: function(gl, value){
        gl.info = value;
    },
    warn: function(gl, value){
        gl.warn = value;
    },
    error: function(gl, value){
        gl.error = value;
    },

    clearColor: function(gl, value){
        gl.clearColor.apply(gl, value);
    },
    clearDepth: function(gl, value){
        gl.clearDepth(value);
    },
    depthFunc: function(gl, value){
        if(typeof(value) == "string")//TODO: add an error if it is not a valid depthfunc?
            gl.depthFunc(gl.stringToDepthFunc[value]);
        else
            gl.depthFunc(value);
    },
    depthTest: function(gl, value){
        if(value) gl.enable(gl.DEPTH_TEST);
        else gl.disable(gl.DEPTH_TEST);   
    }
}

