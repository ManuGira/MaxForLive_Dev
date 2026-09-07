/*

a non interactive piano keyboard

*/

sketch.default2d();

var ctx = {}

var state = {
    notes: [], // list of Note, made of pitch and velocity
};

function Note(pitch, velocity) {
    this.pitch = pitch;
    this.velocity = velocity;
}

function update_ctx()
{
    var box_width = box.rect[2] - box.rect[0];     
    var box_height = box.rect[3] - box.rect[1]; 
    ctx.width = box_width / box_height;
    ctx.height = 1;
    ctx.N = 4*7;
    ctx.colors = [
        [1.000, 0.490, 0.176],
        [0.980, 0.784, 0.275],
        [0.627, 0.765, 0.510],
        [0.373, 0.608, 0.549]
    ];
}


// convert MIDI pitch to x position 
function mtox(pitch)
{
    var octave = Math.floor(pitch / 12);
    var note = pitch % 12;
    var cents = pitch % 1;
    var note1 = Math.floor(note);
    var note2 = note1 + 1;
    var note_dist = [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7];
    var dist = note_dist[note1] + (note_dist[note2] - note_dist[note1]) * cents;
    var dist_oct = dist/7;  // normalise in octave [0, 1]
    var keyboard = ((octave + dist_oct) - 5)*7;  // relative to middle C (MIDI 60)

    return 2 * ctx.width * ((keyboard+0.5) / ctx.N);
}


function draw()
{
    var box_width = box.rect[2] - box.rect[0];     
    var box_height = box.rect[3] - box.rect[1]; 
    var height = 1;
    var width = box_width / box_height;

    sketch.glcolor(0,0,0);
    for (var i = 0; i < ctx.N; i++) {
        var x = 2* width * ((i- ctx.N/2) / ctx.N);
        sketch.moveto(x, -height);
        sketch.lineto(x, height);
    }

    var rect_list = [1,2,4,5,6];
    sketch.glcolor(0,0,0);
    var rect_width = width/(ctx.N*2/3);
    var rect_half_width = rect_width/2; 
    for (var i = 0; i < ctx.N; i++) { 
        // draw a small rectangle
        if (rect_list.indexOf(i % 7) === -1) continue;

        var x = 2* width * ((i- ctx.N/2) / ctx.N);
        sketch.glrect(x - rect_half_width, 0, x + rect_half_width, height);
    }
    
    // draw colored circles for each pitch
    for (var i = 0; i < state.notes.length; i++) {
        sketch.glcolor(ctx.colors[i % ctx.colors.length]);
        var pitch = state.notes[i].pitch;
        var velocity = state.notes[i].velocity;
        var radius = rect_width * Math.sqrt(velocity/127);
        var x = mtox(pitch);
        sketch.moveto(x, 0);
        sketch.ellipse(radius, rect_width);
    }
}

// function list(pitch1, pitch2, pitch3, pitch4)
// {
//     state.pitches = [pitch1, pitch2, pitch3, pitch4];
//     bang();
// }

function anything(){
	var msg = arrayfromargs(messagename, arguments);
    post("Received message: ", msg, "\n");
    var n = msg.length/2;

    state.notes = [];
    for (var i = 0; i < n; i++) {
        var pitch = msg[2*i];
        var velocity = msg[2*i+1];
        state.notes.push(new Note(pitch, velocity));
    }

    bang();
}


function bang()
{
    sketch.glclearcolor(1, 1, 1, 1);
    sketch.glclear();
	update_ctx();
	draw();
	refresh();
}

bang();