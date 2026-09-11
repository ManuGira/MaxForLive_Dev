inlets = 3;
outlets = 2;

setinletassist(2, "Glide time in ms")
setinletassist(1, "Note velocity in [0-127]")
setinletassist(0, "Pitch in MIDI note numbers")
setoutletassist(0, "pitch output");
setoutletassist(1, "velocity output");

// Units:
// - times in ms
// - pitches in MIDI note numbers
// - velocities in the range 0-127

var ctx = {
    velocity: 0,
    glide_ms: 1,
    is_active: false
};

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
};


function on_new_glide_ms(glide_ms) {
    ctx.glide_ms = 1.0*clamp(glide_ms, 1, 2000);
}

function on_new_velocity(velocity) {
    ctx.velocity = 1.0*clamp(velocity, 0, 127); // Clamp between 0 and 127
}

function msg_float(value) {
    if (inlet === 2) {
        on_new_glide_ms(value);
    } else if (inlet === 1) {
        on_new_velocity(value);
    } else if (inlet === 0) {
        on_new_pitch(value);
    }
}

function on_new_pitch(pitch) {
    pitch = 1.0*clamp(pitch, 0, 127); // Clamp between 0 and 127

    var is_note_on = !ctx.is_active && ctx.velocity > 0;
    if (is_note_on){
        ctx.is_active = true;

        // no pitch glide, instant 
        outlet(0, pitch);

        // 1ms velocity attack
        outlet(1, [ctx.velocity, 1]);
        return;
    }

    var is_note_off = ctx.velocity < 0.5;
    if (is_note_off) {
        // no pitch glide when note off
        // remember that the note is off
        ctx.is_active = false;
        outlet(0, pitch);
        outlet(1, [ctx.velocity, ctx.glide_ms]);
        return;
    }

    // here we handle the case of note slide
    
    // both pitch and velocity glides
    ctx.is_active = true;
    outlet(1, [ctx.velocity, ctx.glide_ms]);
    outlet(0, [pitch, ctx.glide_ms]);
}
