wok.input = {

    //Easy to remember key names
    keyNameToCode: {
        space: 32,
        a: 65, b: 66, c: 67, d: 68, e: 69,
        f: 70, g: 71, h: 72, i: 73, j: 74,
        k: 75, l: 76, m: 77, n: 78, o: 79,
        p: 80, q: 81, r: 82, s: 83, t: 84,
        u: 85, v: 86, w: 87, x: 88, y: 89,
        z: 90,
    },

    keyCodeToName: {},

    anyKeyState: {},

    states: {},

    //This must be called before you bind keys
    start: function(){

        //When started look for any key event and process them,
        //firing bound callbacks and updating the pressed status
        document.addEventListener("keydown", function(e){
            var keystate = wok.input.states[e.keyCode];
            if(!keystate) return;
            keystate.pressed = true;
            if(wok.input.anyKeyState.keydown){
                wok.input.anyKeyState.keydown(wok.input.keyCodeToName[e.keyCode], e);
            }

            if(keystate.keydown)keystate.keydown(e);
        }, false);

        document.addEventListener("keyup", function(e){
            var keystate = wok.input.states[e.keyCode];
            if(!keystate) return;
            keystate.pressed = false;

            if(wok.input.anyKeyState.keyup){
                wok.input.anyKeyState.keyup(wok.input.keyCodeToName[e.keyCode], e);
            }

            if(keystate.keyup)keystate.keyup(e);
        }, false);

        //Build the maps for callbacks
        for(var i in this.keyNameToCode){
            this.states[this.keyNameToCode[i]] = {pressed: false};
            this.keyCodeToName[this.keyNameToCode[i]] = i;
        }

        return this;
    },

    //Bind function to keys, takes as an argument a map of the keys to bind
    // +key or key callbacks are fired on the key press
    // -key callbacks are fired on the key release
    // +-any acts the same for any key (the callback's first arg will be the key name)
    bindKey: function(keyCallbacks){
        for(var key in keyCallbacks){
            var onKeyDown = true;
            var callback = keyCallbacks[key];

            //get the actual key name and the wanted state
            if(key[0] == "+"){
                key = key.slice(1);
            }else if(key[0] == "-"){
                key = key.slice(1);
                onKeyDown = false;
            }

            //Retrieve the state for the asked key
            var state = null;
            if(key == "any"){
                state = this.anyKeyState;
            }else{
                var code = this.keyNameToCode[key]
                if(!code){
                    continue; // warn ?
                }
                state = this.states[code];                
            }

            if(onKeyDown){
                state.keydown = callback;
            }else{
                state.keyup = callback;
            }
        }
        return this;
    },
    
    //Returns true if the given key is pressed, false otherwise
    isPressed: function(key){
        var state = this.states[this.keyNameToCode[key]]
        if(!state){
            return false //warn ?
        }
        return state.pressed;
    },

    //test it a bit ?    
    //add callbacks for each canvas to track the mouse
    createCanvasCallbacks: function(gl, canvas){
        gl.mouse = {
            leftPressed: false,
            rightPressed: false,
            pos: {x: 0, y: 0},
            over: false
        };

        var m = gl.mouse;

        //This is for mouse buttons
        canvas.addEventListener("mousedown", function(e){
            if(e.which == 1){ //left button
                m.leftPressed = true;
                if(m.onLeftDown) m.onLeftDown(e);
            }else if(e.which == 2){ //right button
                m.rightPressed = true;
                if(m.onRightDown) m.onRightDown(e);
            }
        }, false);

        canvas.addEventListener("mouseup", function(e){
            if(e.which == 1){ //left button
                m.leftPressed = false;
                if(m.onLeftUp) m.onLeftUp(e);
            }else if(e.which == 2){ //right button
                m.rightPressed = false;
                if(m.onRightUp) m.onRightUp(e);
            }
        }, false);

        //This is for the movement
        canvas.addEventListener("mousemove", function(e){
            var x = e.clientX - canvas.offsetLeft;
            var y = e.clientY - canvas.offsetTop;
            m.pos = {"x": x, "y": y};
            if(m.onMove)m.onMove(x, y, e);
        }, false);

        //And this is to check if the mouse is still in the canvas
        canvas.addEventListener("mouseover", function(e){
            //actualise the pos as soon as the mouse enter the canvas
            var x = e.clientX - canvas.offsetLeft;
            var y = e.clientY - canvas.offsetTop;
            m.pos = {"x": x, "y": y};
            console.log(e);
            //this is for the actual mouseover
            m.over = true;
            if(m.onOver)m.onOver();
        }, false);
        canvas.addEventListener("mouseout", function(e){
            m.over = false;
            if(m.onOut)m.onOut();
        }, false);

        //TODO: add scroll with DOMMouseScroll
    }
}


