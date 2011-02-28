
wok.utils = {

    clamp: function(x, min, max){
        return x>min ? (x<max ? x : max) : min;
    },

    //Returns the concatenation of all the elements of the argument
    concatArray: function(data, startAt){
        var result = [];
        var i = startAt ? startAt : 0;
        for(; i<data.length; i++){
            result = result.concat(data[i]);
        }
        return result;
    },
    
    //Randomly returns a vector of the unit sphere
    //Are the vectors spread evenly ?
    //It may be better to use trigonometrics functions etc ...
    randomUnitVector: function(){
        while(true){
            var x = Math.random()*2 - 1;
            var y = Math.random()*2 - 1;
            var z = Math.random()*2 - 1;
            var lengthSquared = x*x + y*y + z*z;
            
            if( 0.000001 <= lengthSquared <= 1){
                var length = Math.sqrt(lengthSquared);
                return [x/length, y/length, z/length];
            }
        }
    },
    
    requestAnimFrame: function(callback){
        this.requestAnimationFrame = this.requestAnimationFrame||
                                window.requestAnimationFrame ||
                                window.webkitRequestAnimationFrame ||
                                window.mozRequestAnimationFrame ||
                                window.oRequestAnimationFrame ||
                                window.msRequestAnimationFrame ||
                                function(cb){window.setTimeout(function(){cb(Date.now())}, 1000/60);};
        this.requestAnimationFrame(callback);
    }

};
