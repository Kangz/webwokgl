
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
        var v=[]
        while(true){
            v[0] = Math.random()*2 - 1;
            v[1] = Math.random()*2 - 1;
            v[2] = Math.random()*2 - 1;
            if( 0.00001 <= vec3.length(v) <= 1){
                return vec3.normalize(v)
            }
        }
    }

};
