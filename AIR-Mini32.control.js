// M-Audio Axiom A.I.R. Mini32 Controller Script for BitWig

// TODO:
// add clip launcher mode: use cursor keys to select clip?
// not tested to support > 8 tracks
// https://www.kvraudio.com/forum/viewtopic.php?f=268&t=481004&p=6727743&hilit=getMacro#p6727743

loadAPI (2);

host.defineController ("MAudio", "Axiom A.I.R. Mini32", "2.1",
                       "b73308a0-0c0e-11e7-9598-0800200c9a66");

host.defineMidiPorts (2, 2); // Mini32 MIDI ports: must use both

host.addDeviceNameBasedDiscoveryPair ([ "Axiom A.I.R. Mini32 MIDI 1",
                                        "Axiom A.I.R. Mini32 MIDI 2" ],
                                      [ "Axiom A.I.R. Mini32 MIDI 1",
                                        "Axiom A.I.R. Mini32 MIDI 2" ]);

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
                 64: "SUSTAIN",
                 },

    KNOB_START_CC: 24,
    KNOB_END_CC: 31,
    LOWEST_CC: 1,
    HIGHEST_CC: 119,

    modeName: [ // Modes and respective subModes
        ARRANGER = ["ARRANGER",
                        "TRACK", "DEVICE"],
        MIXER =    ["MIXER",
                        "VOLUME", "PAN", "DEVICE",
                        "SEND 1", "SEND 2", "SEND 3", "SEND 4",
                        "SEND 5", "SEND 6", "SEND 7", "SEND 8"] ],

    preRollEnum: ["none", "one_bar", "two_bars", "four_bars"],

    trackColorTable: [
        [ 0.3294117748737335 , 0.3294117748737335 , 0.3294117748737335  ],
        [ 0.47843137383461   , 0.47843137383461   , 0.47843137383461    ],
        [ 0.7882353067398071 , 0.7882353067398071 , 0.7882353067398071  ],
        [ 0.5254902243614197 , 0.5372549295425415 , 0.6745098233222961  ],
        [ 0.6392157077789307 , 0.4745098054409027 , 0.26274511218070984 ],
        [ 0.7764706015586853 , 0.6235294342041016 , 0.43921568989753723 ],
        [ 0.34117648005485535, 0.3803921639919281 , 0.7764706015586853  ],
        [ 0.5176470875740051 , 0.5411764979362488 , 0.8784313797950745  ],
        [ 0.5843137502670288 , 0.2862745225429535 , 0.7960784435272217  ],
        [ 0.8509804010391235 , 0.21960784494876862, 0.4431372582912445  ],
        [ 0.8509804010391235 , 0.18039216101169586, 0.1411764770746231  ],
        [ 1                  , 0.34117648005485535, 0.0235294122248888  ],
        [ 0.8509804010391235 , 0.615686297416687  , 0.062745101749897   ],
        [ 0.45098039507865906, 0.5960784554481506 , 0.0784313753247261  ],
        [ 0                  , 0.615686297416687  , 0.27843138575553894 ],
        [ 0                  , 0.6509804129600525 , 0.5803921818733215  ],
        [ 0                  , 0.6000000238418579 , 0.8509804010391235  ],
        [ 0.7372549176216125 , 0.4627451002597809 , 0.9411764740943909  ],
        [ 0.8823529481887817 , 0.4000000059604645 , 0.5686274766921997  ],
        [ 0.9254902005195618 , 0.3803921639919281 , 0.34117648005485535 ],
        [ 1                  , 0.5137255191802979 , 0.24313725531101227 ],
        [ 0.8941176533699036 , 0.7176470756530762 , 0.30588236451148987 ],
        [ 0.6274510025978088 , 0.7529411911964417 , 0.2980392277240753  ],
        [ 0.24313725531101227, 0.7333333492279053 , 0.3843137323856354  ],
        [ 0.26274511218070984, 0.8235294222831726 , 0.7254902124404907  ],
        [ 0.2666666805744171 , 0.7843137383460999 , 1                   ] ],

    isShift: false,
    isMode: 0,
    isSubMode: 1,
    isDebug: 0,
    isPreRoll: "init",
};


var debugLastFuncName = "";

function debugMidi (msg)
    {
    if (M32.isDebug)
        {
        println (msg);
        }
    }

function debugControl (buttonStr, val, action)
    {
    modeName = M32.modeName[ M32.isMode ][ 0 ];
    modeSubMode = M32.modeName[ M32.isMode ][ M32.isSubMode ];
    shift = M32.isShift ? "S+" : "";

    if (M32.isDebug)
        {
        println (debugLastFuncName + ": " +
                 modeName + "(" + modeSubMode + "): " +
                 buttonStr + ": " + action + " (" + val + ")");
        }
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
    M32.cursor       = host.createCursorDeviceSection (0);

    // Set up device remote controls
    M32.remoteControlPage = M32.cursorDevice.createCursorRemoteControlsPage ("CursorPage1", 8, "");
    M32.remoteControlPage.selectedPageIndex().set(0);

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
    }

function exit() {}

function onMidi0 (status, data1, data2) // onMidi0 events
    {
    debugLastFuncName = "onMidi0";
    debugMidi ("Midi 0: " + status + " " + data1 + " " + data2);

    if (!isChannelController (status))
        {
        return; // eg, regular notes
        }

    buttonStr = (M32.isShift ? "S+" : "") + M32.midiMapCC[ data1 ];

    // Shift button pressed status
    if (M32.midiMapCC[ data1 ] == "SUSTAIN")
        {
        if (data2 != 0) // ignore button release
            {
            M32.isDebug ^= 1;
            println ("debug toggled " + (M32.isDebug ? "on" : "off"));
            }
        }
    else if (M32.midiMapCC[ data1 ] == "SHIFT")
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
            case "S+KNOB_1":
                colors = M32.trackColorTable[
                            parseInt (data2/128*M32.trackColorTable.length) ];
                debugControl (buttonStr, data2, "channel color");
                channel = M32.cursorDevice.getChannel();
                channel.color ().set (colors[0], colors[1], colors[2]);
                break;

            case "S+KNOB_2":
                debugControl (buttonStr, data2, "nop");
                break;

            case "S+KNOB_3":
                debugControl (buttonStr, data2, "nop");
                break;

            case "S+KNOB_4":
                debugControl (buttonStr, data2, "nop");
                break;

            case "S+KNOB_5":
                preRollVal = M32.preRollEnum[ parseInt (data2 * 4 / 128) ];
                debugControl (buttonStr, preRollVal, "preRoll");
                if (preRollVal != M32.isPreRoll)
                    {
                    host.showPopupNotification ("Pre-roll: " + preRollVal);
                    M32.transport.preRoll ().set (preRollVal);
                    M32.isPreRoll = preRollVal;
                    }
                break;

            case "S+KNOB_6":
                debugControl (buttonStr, data2, "coarse tempo");
                M32.transport.getTempo ().setRaw (data2 + 20);
                break;

            case "S+KNOB_7":
                debugControl (buttonStr, data2, "click volume");
                M32.transport.metronomeVolume ().set (data2, 128);
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
                debugControl (buttonStr, data2, "transport record toggle");
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
                M32.transport.isArrangerOverdubEnabled ().toggle ();
                M32.transport.isClipLauncherOverdubEnabled ().toggle ();
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
    knobIndex = data1 - M32.KNOB_START_CC;
    channel = M32.trackBank.getChannel (knobIndex);

    debugControl (buttonStr, data2, "");

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
            M32.remoteControlPage.selectedPageIndex().set(0); // "Perform" preset page
            M32.remoteControlPage.getParameter(knobIndex).set(data2, 128);
            break;

        default:
            logError ("handleModalKnobs: unhandled CC " + buttonStr +
                      " in " + modeStr + " mode!");
        } // end switch
    }

// Cursor functions according to controller mode
function cursorAction (cursorButton)
    {
    if ((M32.modeName[ M32.isMode ][ 0 ] == "ARRANGER") ||
        (M32.modeName[ M32.isMode ][ 0 ] == "MIXER"))
        {
        if (cursorButton == "UP")
            {
            debugControl (cursorButton, 0, "cursorTrack.selectPrevious");
            return M32.cursorTrack.selectPrevious ();
            }
        if (cursorButton == "DOWN")
            {
            debugControl (cursorButton, 0, "cursorTrack.selectNext");
            return M32.cursorTrack.selectNext ();
            }
        if (cursorButton == "LEFT")
            {
            debugControl (cursorButton, 0, "cursorDevice.selectPrevious");
            return M32.cursorDevice.selectPrevious ();
            }
        if (cursorButton == "RIGHT")
            {
            debugControl (cursorButton, 0, "cursorDevice.selectNext");
            return M32.cursorDevice.selectNext ();
            }
        }
//    else if (M32.modeName[ M32.isMode ][ 0 ] == "CLIPS")
//        {
//        if (cursorButton == "UP")
//            {
//            debugControl (cursorButton, 0, "focusPanelAbove");
//            return M32.application.focusPanelAbove ();
//            }
//        if (cursorButton == "DOWN")
//            {
//            debugControl (cursorButton, 0, "focusPanelBelow");
//            return M32.application.focusPanelBelow ();
//            }
//        if (cursorButton == "LEFT")
//            {
//            debugControl (cursorButton, 0, "cursor.selectPrevious");
//            return M32.cursor.selectPrevious ();
//            }
//        if (cursorButton == "RIGHT")
//            {
//            debugControl (cursorButton, 0, "cursor.selectNext");
//            return M32.cursor.selectNext ();
//            }
//        }
    }

// Cycle through controller modes and display onscreen
function cycleMode ()
    {
    debugLastFuncName = "cycleMode";

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
    if (M32.modeName[ M32.isMode ][ 0 ] == "MIXER")
        {
        debugControl ("MODE", "MIX", "setPanelLayout");
        M32.application.setPanelLayout ("MIX");
        }
    if (M32.modeName[ M32.isMode ][ 0 ] == "ARRANGER")
        {
        debugControl ("MODE", "ARRANGE", "setPanelLayout");
        M32.application.setPanelLayout ("ARRANGE");
        }

    host.showPopupNotification ("Controller mode: " + M32.modeName[ M32.isMode ][ 0 ]);
}

// Cycle through subModes and display onscreen
function cycleSubMode ()
    {
    debugLastFuncName = "cycleSubMode";

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
