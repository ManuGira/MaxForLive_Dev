
function Note(pitch, velocity) {
    this.pitch = pitch;
    this.velocity = velocity;
}

var ctx = {}

// Units:
// - times in ms
// - pitches in MIDI note numbers
// - velocities in the range 0-127

var ramp_desc = {
    pitch0: 0,
    vel0: 0,
    pitch1: 0,
    vel1: 0,
    glide_ms: 1,
    time0: 0,
    time1: 1,
};

var current_state = {
    pitch: 0,
    velocity: 0,
}

var timer = new Task(timerCallback, this);
timer.interval = 20;

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
};


function update_velocity(dt) {
    var vel_per_ms = (ramp_desc.vel1 - ramp_desc.vel0) / ramp_desc.glide_ms;
    current_state.velocity = ramp_desc.vel0 + dt * vel_per_ms;
}

function update_state() {
    var time = Date.now();  // epoch time in milliseconds
    
    if (time>ramp_desc.time1){
        current_state.pitch = ramp_desc.pitch1;
        current_state.velocity = ramp_desc.vel1;
        if (timer.running) {
            timer.cancel(); // Stops timer if it's running
        }
    } else {
        var dt = time - ramp_desc.time0;
        var pitch_per_ms = (ramp_desc.pitch1 - ramp_desc.pitch0) / ramp_desc.glide_ms;
        var vel_per_ms = (ramp_desc.vel1 - ramp_desc.vel0) / ramp_desc.glide_ms;
        current_state.pitch = ramp_desc.pitch0 + dt * pitch_per_ms;
        current_state.velocity = ramp_desc.vel0 + dt * vel_per_ms;
    }
}


function glidetime(time) {
    ramp_desc.glide_ms = clamp(time, 1, 2000); // Clamp between 1 and 2000 ms

}

function list(pitch, velocity) { 
    ramp_desc.pitch0 = current_state.pitch;
    ramp_desc.vel0 = current_state.velocity;
    ramp_desc.pitch1 = pitch;
    ramp_desc.vel1 = velocity;
    ramp_desc.time0 = Date.now();
    ramp_desc.time1 = ramp_desc.time0 + ramp_desc.glide_ms;

    if (!timer.running) {
        timer.repeat(); // Starts timer if it's not running
    }
}

function timerCallback() {
    post("Timer callback triggered + " + timer.delay + "\n");
    update_state();
    
    outlet(0, [current_state.pitch, current_state.velocity]);
}