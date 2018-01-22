// M-Audio Axiom A.I.R. Mini32 Controller Script for BitWig

loadAPI (1);

host.defineController ("MAudio", "Axiom A.I.R. Mini32", "2.1",
                       "b73308a0-0c0e-11e7-9598-0800200c9a66");

host.defineMidiPorts (2, 2); // Mini32 MIDI ports: must use both

host.addDeviceNameBasedDiscoveryPair (["Axiom A.I.R. Mini32 MIDI 1", "Axiom A.I.R. Mini32 MIDI 2"],
                                      ["Axiom A.I.R. Mini32 MIDI 1", "Axiom A.I.R. Mini32 MIDI 2"]);

var M32 = {
    midiMapCC:  {
                 16: "STOP",
                 17: "PLAY",
                 18: "RECORD",
                 19: "UP",
                 20: "DOWN",
                 21: "RIGHT",
                 22: "LEFT",
                 23: "SHIFT",
                 24: "KNOB_1",
                 25: "KNOB_2",
                 26: "KNOB_3",
                 27: "KNOB_4",
                 28: "KNOB_5",
                 29: "KNOB_6",
                 30: "KNOB_7",
                 31: "KNOB_8",
                 58: "MODE", // Used in Midi1 only
                 },

    KNOB_START_CC: 24,
    KNOB_END_CC: 31,
    LOWEST_CC: 1,
    HIGHEST_CC: 119,

    selectedTrack: 0,
    isShift: false,
    isMode: 0,
    isSubMode: 1,
    isPreroll: 0,

    modeName: [ // Modes and respective subModes nested array
        ARRANGER = ["ARRANGER",
                        "TRACK", "DEVICE"],
        MIXER =    ["MIXER", "VOLUME", "PAN", "DEVICE",
                             "SEND 1", "SEND 2", "SEND 3", "SEND 4",
                             "SEND 5", "SEND 6", "SEND 7", "SEND 8"] ],
};

var debugLastFuncName = "";

function debugMidi (msg)
    {
    //println (msg);
    }

function debugControl (buttonStr, val, action)
    {
    modeName = M32.modeName[ M32.isMode ][ 0 ];
    modeSubMode = M32.modeName[ M32.isMode ][ M32.isSubMode ];
    shift = M32.isShift ? "S+" : "";

    println (debugLastFuncName + ": " + modeName + "(" + modeSubMode + "): " +
             buttonStr + ": " + action + " (" + val + ")");
    }

function logError (msg)
    {
    println ("ERROR: " + msg);
    }

// Initialize
function init ()
    {
    M32.note = host.getMidiInPort (0).createNoteInput ("Keys", "90????",
                                                       "E000??", "B0????");
    M32.note.setShouldConsumeEvents (false);

    host.getMidiInPort (0).setMidiCallback (onMidi0);
    host.getMidiInPort (1).setMidiCallback (onMidi1);

    /*
    Send init SysEx
    WARNING: UPON LOADING THIS SCRIPT, THE FOLLOWING LINE WILL OVERWRITE MEMORY
    SLOT 0 (ZERO) ON YOUR MINI32. No other memory slots will be affected. The
    reason for initalizing slot 0 is because the Mini32's default knob-CC
    assignments (CC 1-8) overlaps standard MIDI funtions that will interfere
    with recodings.
    */
    host.getMidiOutPort(0).sendSysex("f0 00 01 05 20 7f 7f 00 00 00 01 00 10 00 10 00 00 00 00 00 00 00 09 00 00 00 00 00 40 00 00 00 7f 00 00 01 04 00 00 00 7f 00 40 00 01 00 00 00 7f 00 40 00 18 00 00 00 7f 00 19 00 00 00 7f 00 1a 00 00 00 7f 00 1b 00 00 00 7f 00 1c 00 00 00 7f 00 1d 00 00 00 7f 00 1e 00 00 00 7f 00 1f 00 00 00 7f 00 10 00 00 00 7f 00 11 00 00 00 7f 00 12 00 00 00 7f 00 13 00 00 00 7f 00 14 00 00 00 7f 00 15 00 00 00 7f 00 16 00 00 00 7f 00 17 00 00 00 7f 00 24 00 25 00 26 00 27 00 28 00 29 00 2a 00 2b 00 2c 00 2d 00 2e 00 2f 00 30 00 31 00 32 00 33 00 00 00 00 00 00 f7");

    // Create host objects
    M32.application  = host.createApplication ();
    M32.transport    = host.createTransport ();
    M32.cursorTrack  = host.createCursorTrack (8, 8);
    M32.trackBank    = host.createMainTrackBank (8, 8, 8);
    M32.masterTrack0 = host.createMasterTrack (0);
    M32.cursorDevice = host.createCursorDeviceSection (8);

    // Make CCs 1-119 freely mappable for all 16 Channels
    M32.userControls = host.createUserControls ((M32.HIGHEST_CC - M32.LOWEST_CC + 1) * 16);

    for (var i = M32.LOWEST_CC; i <= M32.HIGHEST_CC; i++)
        {
        for (var j = 1; j <= 16; j++)
            {
            var c = i - M32.LOWEST_CC + (j - 1) * (M32.HIGHEST_CC - M32.LOWEST_CC + 1);
            M32.userControls.getControl (c).setLabel ("CC " + i + " - Channel " + j);
            }
        }
    
    for (var p = 0; p < 8; p++)
        {
        macro = M32.cursorDevice.getMacro (p).setIndication (true);
        track = M32.trackBank.getChannel (p);
        }
    }

function exit() {}

function onMidi0 (status, data1, data2) // onMidi0 events
    {
    debugLastFuncName = "onMidi0";
    debugMidi ("Midi 0: " + status + " " + data1 + " " + data2);

    if (!isChannelController (status))
        {
        logError ("Midi0 received message not of type CC: " + status + " " + data1 + " " + data2);
        return;
        }

    buttonStr = (M32.isShift ? "S+" : "") + M32.midiMapCC[ data1 ];

    // Shift button pressed status
    if (M32.midiMapCC[ data1 ] == "SHIFT")
        {
        M32.isShift = !!data2;
        }
    else if (handleGlobal (buttonStr, inKnobRange (data1), data2) == false)
        { // not a global CC/button
        modeStr = M32.modeName[ M32.isMode ][ 0 ] + ":" +
                  M32.modeName[ M32.isMode ][ M32.isSubMode ];

        if (inKnobRange (data1))
            {
            handleModalKnobs (modeStr, buttonStr, data1, data2);
            }
        else if (data2 != 0) // modal buttons, excluding button releases
            {
            cursorAction (buttonStr);
            }
        }
    } // end onMidi0 events

function onMidi1 (status, data1, data2)
    {
    debugLastFuncName = "onMidi1";
    debugMidi ("Midi 1: " + status + " " + data1 + " " + data2);
    
    buttonStr = (M32.isShift ? "S+" : "") + M32.midiMapCC[ data1 ];

    if (data2 != 0) // ignore button release
        {
        switch (buttonStr)
            {
            case "MODE":
                debugControl (buttonStr, data2, "cycle sub mode");
                cycleSubMode ();
                break;

            case "S+MODE":
                debugControl (buttonStr, data2, "cycle mode");
                cycleMode ()
                break;
            }
        }
    } // end onMidi1 events

function handleGlobal (buttonStr, knob, data2)
    {
    debugLastFuncName = "handleGlobal";
    if (knob)
        {
        switch (buttonStr)
            {
            case "S+KNOB_5":
                debugControl (buttonStr, data2, "nop");
                break;
                
            case "S+KNOB_6":
                debugControl (buttonStr, data2, "coarse tempo");
                M32.transport.getTempo ().setRaw (data2 + 20);
                break;
                
            case "S+KNOB_7":
                debugControl (buttonStr, data2, "click volume");
                M32.transport.setMetronomeValue (data2, 128);
                metroVolume = Math.round ((data2 / 127) * 100);
                host.showPopupNotification ("Click Volume: " + metroVolume + " %");
                break;

            case "S+KNOB_8":
                debugControl (buttonStr, data2, "master volume");
                M32.masterTrack0.getVolume ().set (data2, 128);
                break;

            default:
                return false;
            }
        } // knob
    else if (data2 != 0) // ignore button releases
        {
        switch (buttonStr)
            {
            case "PLAY":
                debugControl (buttonStr, data2, "transport play");
                M32.transport.play ();
                break;

            case "STOP":
                debugControl (buttonStr, data2, "transport stop");
                M32.transport.stop ();
                break;

            case "REC":
                debugControl (buttonStr, data2, "mute selected track");
                M32.transport.record ();
                break;

            case "S+PLAY":
                debugControl (buttonStr, data2, "track solo toggle");
                M32.cursorTrack.getSolo ().toggle ()
                break;
                
            case "S+STOP":
                debugControl (buttonStr, data2, "mute selected track");
                M32.cursorTrack.getMute ().toggle ()
                break;

            case "S+REC":
                debugControl (buttonStr, data2, "arm selected track");
                M32.cursorTrack.getArm ().toggle ()
                break;

            case "S+UP":
                debugControl (buttonStr, data2, "transport toggle overdub");
                M32.transport.toggleOverdub ()
                //this apiv1 call does not work in BW v2.2.3
                //M32.transport.isArrangerOverdubEnabled ().toggle ();
                break;

            case "S+DOWN":
                debugControl (buttonStr, data2, "transport toggle metronome");
                M32.transport.toggleClick ()
                break;

            case "S+LEFT":
                debugControl (buttonStr, data2, "application undo");
                M32.application.undo ()
                break;

            case "S+RIGHT":
                debugControl (buttonStr, data2, "application redo");
                M32.application.redo ()
                break;

            default:
                return false;
            }
        } // !knob && data2 != 0

    return true;
    }

function handleArrangerKnobs (buttonStr, data2)
    {
    debugLastFuncName = "handleArrangerKnobs";
    switch (buttonStr)
        {
        case "KNOB_1":
            debugControl (buttonStr, data2, "track volume");
            M32.cursorTrack.getVolume ().set (data2, 128);
            break;

        case "KNOB_2":
            debugControl (buttonStr, data2, "track pan");
            M32.cursorTrack.getPan ().set (data2, 128);
            break;

        case "KNOB_3":
            debugControl (buttonStr, data2, "track send 1");
            M32.cursorTrack.getSend (0).set (data2, 128);
            break;

        case "KNOB_4":
            debugControl (buttonStr, data2, "track send 2");
            M32.cursorTrack.getSend (1).set (data2, 128);
            break;

        case "KNOB_5":
            debugControl (buttonStr, data2, "track send 3");
            M32.cursorTrack.getSend (2).set (data2, 128);
            break;

        case "KNOB_6":
            debugControl (buttonStr, data2, "track send 4");
            M32.cursorTrack.getSend (3).set (data2, 128);
            break;

        case "KNOB_7":
            debugControl (buttonStr, data2, "track send 5");
            M32.cursorTrack.getSend (4).set (data2, 128);
            break;

        case "KNOB_8": 
            debugControl (buttonStr, data2, "track send 6");
            M32.cursorTrack.getSend (5).set (data2, 128);
            break;

        default:
            logError ("handleArrangerKnobs: unhandled CC " + buttonStr + " in arranger(track) mode!");
        }
    }

function handleModalKnobs (modeStr, buttonStr, data1, data2)
    {
    debugLastFuncName = "handleModalKnobs";
    channel = M32.trackBank.getChannel (data1 - M32.KNOB_START_CC);
    macro   = M32.cursorDevice.getMacro (data1 - M32.KNOB_START_CC);

    debugControl (buttonStr, data2, modeStr);

    switch (modeStr)
        {
        case "ARRANGER:TRACK": // arranger mode knobs for selected track
            handleArrangerKnobs (buttonStr, data2);
            break;

        case "MIXER:VOLUME": // volume mode knobs for selected trackBank
            channel.getVolume ().set (data2, 128);
            break;

        case "MIXER:PAN": // pan mode knobs for selected trackBank
            channel.getPan ().set (data2, 128);
            break;

        case "MIXER:SEND 1": // send mode knobs for selected trackBank
            channel.getSend (0).set (data2, 128);
            break;

        case "MIXER:SEND 2":
            channel.getSend (1).set (data2, 128);
            break;

        case "MIXER:SEND 3":
            channel.getSend (2).set (data2, 128);
            break;

        case "MIXER:SEND 4":
            channel.getSend (3).set (data2, 128);
            break;

        case "MIXER:SEND 5":
            channel.getSend (4).set (data2, 128);
            break;

        case "MIXER:SEND 6":
            channel.getSend (5).set (data2, 128);
            break;

        case "MIXER:SEND 7":
            channel.getSend (6).set (data2, 128);
            break;

        case "MIXER:SEND 8":
            channel.getSend (7).set (data2, 128);
            break;

        case "ARRANGER:DEVICE":
        case "MIXER:DEVICE": // device macro knobs for selected device
            macro.getAmount ().set (data2, 128);
            break;

        default:
            logError ("handleModalKnobs: unhandled CC " + buttonStr +
                      " in " + modeStr + " mode!");
        } // end switch
    }

// Cursor functions according to controller mode
function cursorAction (cursorButton)
    {
    debugControl (cursorButton, 0, "cursor movement");

    if (M32.modeName[ M32.isMode ][ 0 ] == ARRANGER) 
        {
        if (cursorButton == "UP")
            {
            return M32.cursorTrack.selectPrevious ();
            }
        if (cursorButton == "DOWN")
            {
            return M32.cursorTrack.selectNext ();
            }
        if (cursorButton == "LEFT")
            {
            return M32.cursorDevice.selectPrevious ();
            }
        if (cursorButton == "RIGHT")
            {
            return M32.cursorDevice.selectNext ();
            }
        }
    else if (M32.modeName[ M32.isMode ][ 0 ] == MIXER) 
        {
        if (cursorButton == "UP")
            {
            return M32.application.focusPanelAbove ();
            }
        if (cursorButton == "DOWN")
            {
            return M32.application.focusPanelBelow ();
            }
        if (cursorButton == "LEFT")
            {
            if (M32.modeName[ M32.isMode ][ M32.isSubMode ] == "DEVICE")
                {
                return M32.cursorDevice.selectPrevious ();
                }
            else
                {
                return M32.cursorTrack.selectPrevious ();
                setTrackSelected (M32.selectedTrack);
                }
            }
        if (cursorButton == "RIGHT")
            {
            if (M32.modeName[ M32.isMode ][ M32.isSubMode ] == "DEVICE")
                {
                return M32.cursorDevice.selectNext ();
                }
            else
                {
                return M32.cursorTrack.selectNext ();
                setTrackSelected (M32.selectedTrack);
                }
            }
        }
    }

// Cycle through controller modes and display onscreen
function cycleMode ()
    {
    if (M32.isMode < (M32.modeName.length - 1))
        {
        M32.isMode++;
        }
    else
        {
            M32.isMode = 0;
        }
    M32.isSubMode = 1; // Reset isSubMode
    // Change panel layout
    if (M32.modeName[ M32.isMode ][ 0 ] == MIXER)
        {
        M32.application.setPanelLayout ("MIX");
        }
    if (M32.modeName[ M32.isMode ][ 0 ] == ARRANGER)
        {
        M32.application.setPanelLayout ("ARRANGE");
        }

    host.showPopupNotification ("Controller mode: " + M32.modeName[ M32.isMode ][ 0 ]);
}

// Cycle through subModes and display onscreen
function cycleSubMode ()
    {
    if (M32.isSubMode < (M32.modeName[ M32.isMode ].length - 1))
        {
        M32.isSubMode++;
        }
    else
        {
    M32.isSubMode = 1;
        }

    host.showPopupNotification (M32.modeName[ M32.isMode ][ 0 ] + " sub-mode: " +
                                M32.modeName[ M32.isMode ][ M32.isSubMode ]);
    }

function inKnobRange (cc)
    {
    return (cc >= M32.KNOB_START_CC && cc <= M32.KNOB_END_CC);
    }
