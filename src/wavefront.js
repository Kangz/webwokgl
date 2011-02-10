
//Move this somwhere else ?
wok.Wavefront = {

    //Very simple .obj loading    
    fromSource: function(source){
        var raw_positions = [];
        var raw_normals = [];
        var raw_texcoords = [];
        var faces = [];
    
        var lines = source.split("\n");
        for(var i in lines){
        
            //Ignore empty lines and comments
            if(lines[i][0] == "#"){
                continue;
            }
            
            var words = lines[i].split(" ");
            if(words.length == 0){
                continue
            }

            switch(words[0]){
                case "v":
                    raw_positions.push([parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])]);
                    break;

                case "vt":
                    raw_texcoords.push([parseFloat(words[1]), parseFloat(words[2])]);
                    break;

                case "vn":
                    raw_normals.push([parseFloat(words[1]), parseFloat(words[2]), parseFloat(words[3])]);
                    break;

                case "f":
                    var temp_face = {
                        "positions": [],
                        "texcoords": [],
                        "normals": []
                    }

                    for(var j=1; j<4; j++){
                        var vert_data = words[j].split("/");

                        temp_face.positions.push(parseInt(vert_data[0]));
                        if(vert_data.length >= 2 && vert_data[1] != ""){
                            temp_face.texcoords.push(parseInt(vert_data[1]));
                        }
                        if(vert_data.length >= 3){
                            temp_face.normals.push(parseInt(vert_data[2]));
                        }
                    }

                    faces.push(temp_face);
                    break;

                default:
                    break;
            }
        }

        //Now we will create the actual arrays
        var positions = [];
        var texcoords = [];      
        var normals = [];

        for(var i=0; i<faces.length; i++){
            var face = faces[i];

            for(var j=0; j<face.positions.length; j++){
                positions = positions.concat(raw_positions[face.positions[j] - 1]);
            }
            for(var j=0; j<face.normals.length; j++){
                normals = normals.concat(raw_normals[face.normals[j] - 1]);
            }
            for(var j=0; j<face.texcoords.length; j++){
                texcoords = texcoords.concat(raw_texcoords[face.texcoords[j] - 1]);
            }
        }

        return {
            "positions": positions,
            "texcoords": texcoords,
            "normals": normals
        };
    }
}
