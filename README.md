# This is my api v1 development branch. Most work will happen on the to-be-created api v2 branch.

## No warranty expressed or implied.
## I'm hacking this up because I enjoy using the Axiom AIR Mini 32 with Bitwig. I also happen to enjoy tearing things apart to see how they work, and then putting them together in a way that makes sense to me. This may not always correspond to the author's original vision. Many thanks to the original author, @lunardigs! : )

## Things that don't work right (BW v2.2.3):
* transport overdub toggling

# bitwig_maudio-air-mini32 - 2.0

## Bitwig 1.x.x & 2.x.x controller script for the M-Audio Axion A.I.R. Mini32

**WARNING:** UPON LOADING THIS SCRIPT, A SYSEX MESSAGE WILL BE SENT WHICH WILL OVERWRITE MEMORY SLOT 0 (ZERO) ON YOUR MINI32. No other memory slots will be affected. The reason for doing this is that the Mini32's default knob-CC assignments (CC 1-8) overlaps standard MIDI funtions that will interfere with recodings.

---

The Mini32 is a simple, light weight, 32 key keyboard controller with 8 drum pads, 8 CC knobs, plus a number a nice features. It's great for travel and it's very playable.

# Functions

### Transport
* stop = stop
* play = play
* rec = rec
* shift + stop = mute selected track
* shift + play = solo selected track
* shift + rec = arm selected track

### Mode-independent functions
* middle cursor button = shift
* sub-mode button = cycle sub-mode of current mode
* shift + sub-mode button = cycle mode
* shift + up = toggle metronome
* shift + down = toggle overdub (OVR)
* shift + left = undo
* shift + right = redo
* shift + knob 8 = Master volume adjust

### ARRANGER mode

##### Cursor buttons:
* up/down cursor = track select
* right/left cursor = device select
* mode button (above cursor buttons, left of knobs) = change sub-mode
  * CURSOR sub-mode = CC control knobs to cursor selected track
    * knob 1 = volume
    * knob 2 = Pan
    * knob 3 = send 1
    * knob 4 = send 2
    * knob 5 = send 3
    * knob 6 = send 4
    * shift + knob 6 = project tempo (fixed range: 20 to 147 BPM)
    * knob 7 = send 5
    * shift + knob 7 = click (metronome) volume
    * knob 8 = send 6
    * shift + knob 8 = Master volume
  * DEVICE sub-mode = CC control knobs to macro 1-8 of cursor selected device

### MIXER mode

##### Cursor buttons:
* up/down = change panel focus to above or below current
* right/left = cursor right/left within the panel focus
* mode button (above cursor buttons, left of knobs) = change sub-mode
  * VOLUME sub-mode = CC control knobs to track 1-8 volume adjust
  * PAN sub-mode = CC control knobs to track 1-8 pan adjust
  * DEVICE sub-mode = CC control knobs to macro 1-8 of cursor selected device
  * SEND 1 sub-mode = CC control knobs to track 1-8 send 1 adjust
  * SEND 2 sub-mode = CC control knobs to track 1-8 send 2 adjust
  * SEND 3 sub-mode = CC control knobs to track 1-8 send 3 adjust
  * SEND 4 sub-mode = CC control knobs to track 1-8 send 4 adjust
  * SEND 5 sub-mode = CC control knobs to track 1-8 send 5 adjust
  * SEND 6 sub-mode = CC control knobs to track 1-8 send 6 adjust
  * SEND 7 sub-mode = CC control knobs to track 1-8 send 7 adjust
  * SEND 8 sub-mode = CC control knobs to track 1-8 send 8 adjust

## Notes
1. **Setup:** It is necessary to set the Mini32's incoming and outgoing MIDI ports, both 1 & 2 for proper operation. The reason for this is that m-audio has made it such that the "sub-mode" button sends data to port 2, while everything else (for purposes of this script) arrive on port 1. Later versions of this script may eliminate this necessity.
2. Knobs in MIXER mode presently are fixed to tracks 1-8. Later versions will utilize Track Banks to enhance this function and remove this limit.
