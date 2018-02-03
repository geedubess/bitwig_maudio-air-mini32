# This is my api v4 development branch.

## No warranty expressed or implied.
## I'm hacking this up because I enjoy using the Axiom AIR Mini 32 with Bitwig. I also happen to enjoy tearing things apart to see how they work, and then putting them together in a way that makes sense to me. This may not always correspond to the author's original vision. Many thanks to the original author, @lunardigs! : )

# bitwig-maudio-air-mini32 - 2.0

## 2.x.x controller script for the M-Audio Axion A.I.R. Mini32

**WARNING:** UPON LOADING THIS SCRIPT, A SYSEX MESSAGE WILL BE SENT WHICH WILL OVERWRITE MEMORY SLOT 0 (ZERO) ON YOUR MINI32. No other memory slots will be affected. The reason for doing this is that the Mini32's default knob-CC assignments (CC 1-8) overlaps standard MIDI funtions that will interfere with recodings.

---

The Mini32 is a simple, light weight, 32 key keyboard controller with 8 drum pads, 8 CC knobs, plus a number a nice features. It's great for travel and it's very playable.


# Global Functions

### Note on/off midi: passthrough to current instrument track.

### Global Buttons
* shift + mode  = change mode (including UI) {Arranger, Mixer}
* stop          = transport stop
* play          = transport play
* rec           = transport rec
* up/down       = select previous/next track
* left/right    = select previous/next device on current track
* shift + stop  = mute selected track
* shift + play  = solo selected track
* shift + rec   = arm selected track
* shift + up    = transport toggle overdub
* shift + down  = transport toggle metronome
* shift + left  = undo
* shift + right = redo

### Global Knobs
* shift + knob 1     = set color of selected track
* shift + knob {2-4} = nothing yet!
* shift + knob 5     = pre-roll amount
* shift + knob 6     = coarse tempo
* shift + knob 7     = click volume
* shift + knob 8     = master volume

### Arranger Mode
* mode = toggle submode {Track, Device}
* knob function
  - Device submode   = knob {1-8} control current device remote controls
  - Track  submode
    - Knob 1 controls selected track volume
    - Knob 2 controls selected track pan
    - Knob 3 controls selected track volume to send 1 bus
    - Knob 4 controls selected track volume to send 2 bus
    - Knob 5 controls selected track volume to send 3 bus
    - Knob 6 controls selected track volume to send 4 bus
    - Knob 7 controls selected track volume to send 5 bus
    - Knob 8 controls selected track volume to send 6 bus

### Mixer Mode
* mode = toggle submode {Volume, Pan, DeviceRemote, Send{1-8}}
* knob function
  - Device submode   = knob {1-8} control current device remote controls
  - Volume submode   = knob {1-8} control track {1-8} volume
  - Pan    submode   = knob {1-8} control track {1-8} pan
  - Send {N} submode = knob {1-8} control track {1-8} volume to send bus {N}

## Notes
1. **Setup:** It is necessary to set the Mini32's incoming and outgoing MIDI ports, both 1 & 2 for proper operation. The reason for this is that m-audio has made it such that the "sub-mode" button sends data to port 2, while everything else (for purposes of this script) arrive on port 1. Later versions of this script may eliminate this necessity.
2. Knobs in MIXER mode presently are fixed to tracks 1-8. Later versions will utilize Track Banks to enhance this function and remove this limit.
