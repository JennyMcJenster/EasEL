
// Set up some utility functions for general use...

var UTIL = {
	__DEBUGLEVEL: 0,
	DEBUGMODE: {INFO:0b1, WARN:0b10, ERR:0b100, PERF:0b1000, DEV:0b10000},
	DEBUG_GET: function (level) { return UTIL.DEF(level) ? (UTIL.__DEBUGLEVEL&level != 0) : UTIL.__DEBUGLEVEL; },
	DEBUG_SET: function (level) { UTIL.__DEBUGLEVEL = level; },
	DEBUG_ON: function (level) { UTIL.__DEBUGLEVEL = UTIL.__DEBUGLEVEL|level; },
	DEBUG_OFF: function (level) { UTIL.__DEBUGLEVEL = (UTIL.__DEBUGLEVEL|level)^level; },
	LOG: function (level, print, spew) {
		if(UTIL.__DEBUGLEVEL&level != 0)
			for(var l in UTIL.DEBUGMODE)
				if(UTIL.DEBUGMODE[l]==level)
					{ if(UTIL.ARR(print))
							{ print.splice(0, 0, l +" ".repeat(5-l.length) +":"); console.log(...print); }
						else
							console.log(l +" ".repeat(5-l.length) +":", print);
						var printed = true; break; }
		if(UTIL.UNDEF(printed))
			if(UTIL.ARR(print)) console.log(...print); else console.log(print);
		return spew;
	},
	LOG_WARN: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.WARN, print, UTIL.DEF(spew) ? spew : true); },
	LOG_ERR: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.ERR, print, UTIL.DEF(spew) ? spew : false); },
	LOG_INFO: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.INFO, print, UTIL.DEF(spew) ? spew : true); },
	LOG_PERF: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.PERF, print, UTIL.DEF(spew) ? spew : true); },
	LOG_DEV: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.DEV, print, UTIL.DEF(spew) ? spew : true); },
	TYPE: function (param) { return (typeof param); },
	TYPEOF: function (param) { return (typeof param); },
	UNDEF: function (param) { return (typeof param === "undefined"); },
	UNDEFINED: function (param) { return (typeof param === "undefined"); },
	DEF: function (param) { return (typeof param !== "undefined"); },
	DEFINED: function (param) { return (typeof param !== "undefined"); },
	INSTIS: function (param, base) { return (typeof param !== "undefined" && (base===null ? param===null : (param instanceof base))); },
	TYPEIS: function (param, type) { return (typeof param === (typeof type === "string" ? type.toLowerCase() : (typeof type))); },
	NULL: function (param) { return (param === null); },
	NUM: function (param) { return (typeof param === "number"); },
	INT: function (param) { return (typeof param === "number" && Number.isInteger(param)); },
	STR: function (param) { return (typeof param === "string"); },
	FUNC: function (param) { return (typeof param === "function"); },
	OBJ: function (param) { return (typeof param === "object" && param !== null); },
	DICT: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor!==Array); },
	ARR: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor===Array); },
	KEYIN: function (param, object) { return UTIL.DICT(object) ? object.hasOwnProperty(param) : UTIL.ARR(object) ? (param>=0 && param<object.length) : false; },
	VALIN: function (param, object) { return UTIL.DICT(object) ? (Object.values(object).indexOf(param)>=0) : UTIL.ARR(object) ? (object.indexOf(param)>=0) : false; },
	SIZE: function (object) { return UTIL.DICT(object) ? Object.keys(object).length : UTIL.ARR(object) ? object.length : 0; },
	STRINGIFY: function (object, iteration) {
		// TODO Check this, something funky seems to be happening on stringify-ing certain deep objects
		var iteration = UTIL.DEF(iteration) ? (iteration+1) : 0;
		if(iteration>3)
			return "## ITERATION_LIMIT_EXCEEDED ##";
		if(!UTIL.OBJ(object))
			return (UTIL.FUNC(object) ? "<Function>" : "\""+ String(object) +"\"");
		let string = "{";
		for(var k in object)
			string += (string.length==1?"":",") + ("\""+ k +"\":"+ UTIL.STRINGIFY(object[k],iteration));
		return string + "}";
	},
	VALIDCANVAS: function (param) { return UTIL.OBJ(param) && param.nodeName === "CANVAS"; }
};

UTIL.DEBUG_SET (UTIL.DEBUGMODE.WARN | UTIL.DEBUGMODE.ERR | UTIL.DEBUGMODE.INFO | UTIL.DEBUGMODE.PERF | UTIL.DEBUGMODE.DEV);


// Set up language features

var LANG = {
	// TODO: Rework for same token in multiple places
	TOKENPREFIX: "{{",
	TOKENSUFFIX: "}}",
	DICTIONARY: {},
	_FormatID: function (id) { return id.toLowerCase(); },
	_FormatToken: function (token) { return token.toUpperCase(); },
	_Interpret: function (detokenised, inputTokens) {
		var interpreted = detokenised.parts[0];
		if(!UTIL.ARR(detokenised.inserts))
			return interpreted;
		var inputs = [];
		if(UTIL.DICT(inputTokens))
			for(var t in inputTokens)
				inputs[LANG._FormatToken(t)] = inputTokens[t];
		for(var i=0; i<detokenised.inserts.length; ++i) {
			var token = detokenised.tokens[detokenised.inserts[i]];
			var insert = inputs[token];
			var inserting = UTIL.DEF(insert) ? insert : (LANG.TOKENPREFIX+token+LANG.TOKENSUFFIX);
			interpreted += inserting + detokenised.parts[i+1];
		}
		return interpreted;
	},
	_Detokenise: function (string) {
		var detokenised = new Object();
		detokenised.base = string;
		detokenised.parts = new Array();
		detokenised.tokenCount = 0;
		var remainingString = string;
		var TOKENPRE = LANG.TOKENPREFIX;
		var TOKENSUF = LANG.TOKENSUFFIX;
		var tokenPrefixAt = remainingString.indexOf(TOKENPRE); var tokenPrefixLen = TOKENPRE.length;
		var tokenSuffixAt = remainingString.indexOf(TOKENSUF); var tokenSuffixLen = TOKENSUF.length;
		while(tokenPrefixAt >= 0 && tokenSuffixAt >= 0){
			if(UTIL.UNDEF(detokenised.inserts))
				detokenised.inserts = new Array();
			if(detokenised.parts.length-1<detokenised.inserts.length)
				detokenised.parts[detokenised.inserts.length] = "";
			if(tokenSuffixAt >= 0 && tokenSuffixAt < tokenPrefixAt) {
				// Check for token suffix before prefix
				var append = remainingString.substr(0, tokenSuffixAt + tokenSuffixLen);
				detokenised.parts[detokenised.inserts.length] += append;
				remainingString = remainingString.substr(tokenSuffixAt + tokenSuffixLen);
				tokenPrefixAt = remainingString.indexOf(TOKENPRE);
				tokenSuffixAt = remainingString.indexOf(TOKENSUF);
				continue;
			}
			var tokenStart = tokenPrefixAt + tokenPrefixLen;
			var beforeToken = remainingString.substr(0, tokenPrefixAt);
			var insideToken = remainingString.substr(tokenPrefixAt+tokenPrefixLen, tokenSuffixAt-tokenPrefixAt-tokenPrefixLen);
			if(UTIL.UNDEF(detokenised.tokens))
				detokenised.tokens = new Array();
			var tokenName = LANG._FormatToken(insideToken);
			var tokenIndex = detokenised.tokens.indexOf(tokenName);
			if(tokenIndex < 0) {
				tokenIndex = detokenised.tokens.length;
				detokenised.tokens[tokenIndex] = tokenName;
				detokenised.tokenCount = detokenised.tokens.length;
			}
			detokenised.parts[detokenised.inserts.length] += beforeToken;
			detokenised.inserts.push(tokenIndex);
			remainingString = remainingString.substr(tokenSuffixAt + tokenSuffixLen);
			tokenPrefixAt = remainingString.indexOf(TOKENPRE);
			tokenSuffixAt = remainingString.indexOf(TOKENSUF);
		}
		detokenised.parts.push(remainingString);
		return detokenised;
	},
	_LangError: function (id, inputTokens) {
		var error = "## LANG_ERROR ##";
		if(!UTIL.STR(id))
			return error;
		error += " "+ id +" ##";
		if(UTIL.DICT(inputTokens))
			error += " "+ UTIL.STRINGIFY(inputTokens) +" ##";
		return error;
	},
	Dictionary: function () { return Object.keys(LANG.DICTIONARY); },
	Put: function (id, string) {
		if(!UTIL.STR(id))
			return UTIL.LOG_ERR("LANG.Put failed; ID should be a string", false);
		var id = LANG._FormatID(id);
		if(UTIL.KEYIN(id, LANG.DICTIONARY))
			return UTIL.LOG_ERR("LANG.Put failed; Dictionary already contains ID \""+ id +"\"", false);
		if(!UTIL.STR(string))
			return UTIL.LOG_ERR("LANG.Put failed; Passed a non-string as a parameter", false);
		LANG.DICTIONARY[id] = LANG._Detokenise(string);
		var tokenCount = LANG.DICTIONARY[id].tokenCount;
		return UTIL.LOG_INFO("Registered new language string, ID \""+ id +"\" ("+ tokenCount +" tokens"+ (tokenCount>0 ? (": \""+ LANG.DICTIONARY[id].tokens.join("\", \"") +"\"") : "") +")", true);
	},
	Get: function (id, tokens) {
		if(!UTIL.STR(id))
			return UTIL.LOG_ERR(LANG._LangError(id), "ID should be a string");
		var id = LANG._FormatID(id);
		if(!UTIL.KEYIN(id, LANG.DICTIONARY))
			return UTIL.LOG_ERR(LANG._LangError(id, tokens), "Dictionary does not contain ID \""+ id +"\"");
		var dictionaryEntry = LANG.DICTIONARY[id];
		if(!UTIL.DICT(tokens)) {
			if(LANG.DICTIONARY[id].tokenCount==0) {
				if(UTIL.DEF(tokens))
					return UTIL.LOG_WARN("ID \""+ id +"\" expected no tokens", LANG.DICTIONARY[id].parts[0]);
			} else
				return UTIL.LOG_ERR("ID \""+ id +"\" expected tokens as dictionary of IDs and values", LANG._Interpret(dictionaryEntry));
		}
		var tokensPassed = UTIL.SIZE(tokens);
		var tokensExpect = dictionaryEntry.tokenCount;
		if(tokensPassed != tokensExpect)
			return UTIL.LOG_ERR(LANG._Interpret(dictionaryEntry, tokens), "ID \""+ id +"\" expected "+ tokensExpect +" tokens, got "+ tokensPassed);
		for(var tokenID in tokens)
			if(!UTIL.VALIN(LANG._FormatToken(tokenID), dictionaryEntry.tokens))
				return UTIL.LOG_ERR(LANG._Interpret(dictionaryEntry, tokens), "No such token \""+ LANG._FormatToken(tokenID) +"\" in ID \""+ id +"\"");
		return LANG._Interpret(dictionaryEntry, tokens);
	}
};


// LANG testing suite, just in case

if(false && UTIL.DEBUG_GET(UTIL.DEBUGMODE.DEV)) {
	LANG.Put("teststr_0", "Test 0");
	LANG.Put("teststr_1", "Test 1  |  p={{param}}");
	LANG.Put("teststr_2", "Test 2  |  1={{paramA}}  2={{paramB}}");
	LANG.Put("teststr_3", "Test 3  |  p={{param}}  p={{param}}");
	LANG.Put("teststr_4", "Test 4  |  p={{param}}  1={{paramA}}  p={{param}}  2={{paramB}}");
	var dict = LANG.Dictionary();
	dict.push("asdf");
	var tests = [null, {}, {param:null}, {param:"PP"}, {parama:null,param:null}, {ParamA:"AA",param2:null}, {paramA:"AA",Paramb:"BB"}, {param:"PP", pArAmA:"AA",paramB:"BB"}];
	for(var k=0; k<dict.length; ++k)
		for(var t=0; t<tests.length; ++t) {
			var testID = (k+1) +":"+ (t+1);
			var dictID = dict[k];
			var testParams = tests[t];
			UTIL.LOG_DEV("----------");
			UTIL.LOG_DEV("Test "+ testID +"  /  String \""+ dictID +"\"  /  Params "+ UTIL.STRINGIFY(testParams));
			UTIL.LOG_DEV(LANG.Get(dictID, testParams));
		}
}


// Now, to business... :D

// Shorthand util functions for EasEL
var LOG = UTIL.LOG;
var LOG_WARN = UTIL.LOG_WARN;
var LOG_ERR = UTIL.LOG_ERR;
var LOG_INFO = UTIL.LOG_INFO;
var LOG_PERF = UTIL.LOG_PERF;
var LOG_DEV = UTIL.LOG_DEV;

// Let's find out if you're using a bad browser, and call you a heathen if so...
if(!UTIL.DEF(window.addEventListener)) alert("Please stop using bad browsers. :(");
// ...then, just to make life easier, create our own add/removeEventListener
var addEvent = function (el, ev, fn) {
	if(UTIL.DEF(window.addEventListener))
		el.addEventListener(ev, fn, false);
	else if(UTIL.DEF(window.attachEvent))
		el.attachEvent(ev, fn);
	else
		UTIL.LOG_ERR("Sorry, but what in the fresh ass is your browser?");
};
var remEvent = function (el, ev, fn) {
	if(UTIL.DEF(window.removeEventListener))
		el.removeEventListener(ev, fn, false);
	else if(UTIL.DEF(window.detachEvent))
		el.detachEvent(ev, fn);
	else
		UTIL.LOG_ERR("Seriously, what the hell kind of browser is this?");
};


// Some EasEL variables used for window management and control
var __EASEL_FOCUS = null;
var __EASEL_FOCUS_DOM = null;
var __EASEL_MOUSEDOWN_IN = null;
var __EASEL_MOUSEUP_IN = null;
var __EASEL_MOUSEMOVE_NEW = null;
var __EASEL_MOUSEMOVE_IN = null;
var __EASEL_COUNT = 0;

// If this is the first time EasEL has been included, let's do some overriding
var EASEL_OVERRIDE_WINDOW = UTIL.UNDEF(EASEL_OVERRIDE_WINDOW) ? true : EASEL_OVERRIDE_WINDOW;
if(EASEL_OVERRIDE_WINDOW)
{
	var window_load = function (_e) {
		LOG_INFO("Ready!");
	};
	var window_mouseup = function (_e) {
		if(!UTIL.INSTIS(__EASEL_MOUSEDOWN_IN, Easel)
		&& !UTIL.INSTIS(__EASEL_MOUSEUP_IN, Easel)) {
			if(UTIL.INSTIS(__EASEL_FOCUS, Easel))
				__EASEL_FOCUS.takeFocus();
			__EASEL_FOCUS = null;
		}
		__EASEL_MOUSEDOWN_IN = null;
		__EASEL_MOUSEUP_IN = null;
	};
	var window_click = function (_e) {
		/*if(__EASEL_FOCUS_CHANGED > 0) {
			_e.preventDefault();
		} else if(!UTIL.NULL(__EASEL_FOCUS)) {
			if(UTIL.INSTIS(__EASEL_FOCUS, Easel))
				LOG_DEV(["No Easel:", "click", "(Defocussed Easel "+ __EASEL_FOCUS.__ID +")"]);
			else
				LOG_DEV(["No Easel:", "click", "__EASEL_FOCUS was not an Easel"]);
			__EASEL_FOCUS = null;
		} else {
			LOG_DEV(["No Easel:", "click", _e]);
		}*/
	};
	var window_context = function (_e) {
		if(UTIL.INSTIS(__EASEL_MOUSEMOVE_IN, Easel))
			if(__EASEL_MOUSEMOVE_IN.__do_contextoverride) {
				_e.preventDefault();
				LOG_DEV(__EASEL_MOUSEMOVE_IN.ID() +" prevented context");
			}
	};
	var window_mousemove = function (_e) {
		if(UTIL.INSTIS(__EASEL_MOUSEMOVE_NEW, Easel)) {
			if(__EASEL_MOUSEMOVE_IN != __EASEL_MOUSEMOVE_NEW) {
				if(UTIL.INSTIS(__EASEL_MOUSEMOVE_IN, Easel))
					LOG_DEV(["Mouse left ", __EASEL_MOUSEMOVE_IN.ID()]);
				LOG_DEV(["Mouse entered ", __EASEL_MOUSEMOVE_NEW.ID()]);
			}
			__EASEL_MOUSEMOVE_IN = __EASEL_MOUSEMOVE_NEW;
		} else {
			if(UTIL.INSTIS(__EASEL_MOUSEMOVE_IN, Easel))
				LOG_DEV(["Mouse left ", __EASEL_MOUSEMOVE_IN.ID()]);
			__EASEL_MOUSEMOVE_IN = null;
		}
		__EASEL_MOUSEMOVE_NEW = null;
	};
	var window_mousewheel = function (_e) {
		if(UTIL.INSTIS(__EASEL_MOUSEMOVE_IN, Easel))
			if(__EASEL_MOUSEMOVE_IN.__do_wheeloverride) {
				_e.preventDefault();
				LOG_DEV(__EASEL_MOUSEMOVE_IN.ID() +" prevented mousewheel");
			}
	};
	var window_scroll = function (_e) {
		// TODO Remove? Not sure if needed
		if(UTIL.INSTIS(__EASEL_FOCUS, Easel)) {
			__EASEL_FOCUS.__hook_scroll(_e);
			_e.preventDefault();
		} else {
			LOG_DEV(["<Window>:", "scroll", _e]);
		}
	};
	var window_keypress = function (_e) {
		if(__EASEL_FOCUS instanceof Easel) {
			__EASEL_FOCUS.__hook_keypress(_e);
			_e.preventDefault();
		} else {
			LOG_DEV(["<Window>:", "keypress", _e]);
		}
	};
	var window_keydown = function (_e) {
		if(_e.key=="F5" && _e.ctrlKey) {
			window.location.reload(true);
		} else if(__EASEL_FOCUS instanceof Easel) {
			__EASEL_FOCUS.__hook_keydown(_e);
			_e.preventDefault();
		} else {
			//LOG_DEV(["<Window>:", "keydown", _e]);
		}
	};
	var window_keyup = function (_e) {
		if(__EASEL_FOCUS instanceof Easel) {
			__EASEL_FOCUS.__hook_keyup(_e);
			_e.preventDefault();
		} else {
			//LOG_DEV(["<Window>:", "keyup", _e]);
		}
	};

	// TODO Cursor locking capability
	/*  https://www.html5rocks.com/en/tutorials/pointerlock/intro/  */
	/*
		if(UTIL.INSTIS(__EASEL_FOCUS, Easel) && __EASEL_FOCUS.__do_lock_cursor)
			{ lock cursor to given canvas element }
	*/

	addEvent(window, "load", window_load);
	addEvent(window, "mousemove", window_mousemove);
	addEvent(window, "mouseup", window_mouseup);
	addEvent(window, "click", window_click);
	addEvent(window, "contextmenu", window_context);
	addEvent(window, "mousewheel", window_mousewheel);
	//addEvent(window, "scroll", window_scroll);
	addEvent(window, "keypress", window_keypress);
	addEvent(window, "keydown", window_keydown);
	addEvent(window, "keyup", window_keyup);
}



/*
	Easel Object

	// Create an Easel
		var easel = new Easel ( [<target canvas dom element>, ...] );
	// Add/Remove widgets to an Easel
		easel.add ( <widget to add> [, <widget to add>, ...] );
		easel.remove ( <widget to remove> [, <widget to remove>, ...] );
		// Both of these also allow passing of an array of EaselWidget objects
	// Freeze an Easel (halt accepting events/input)
		easel.freeze ( <true/false> );
*/

var Easel = function ()
{
	this.__ID = ++__EASEL_COUNT;
	this.__C = []; // Stores all hooked canvas DOM objects
	this.__CTX = []; // Stores context refs for all hooked canvas DOM objects
	this.__C_MODE = []; // Tracks display modes for each canvas
	this.__C_MEASURE = []; // Tracks the sizes of each canvas
	this.__widgets = []; // Stores widgets particular to this Easel
	this.__layers = []; // Stores index refs to __widgets, in rendering/layer order
	this.__events = {}; // All events specific to the base Easel itself
	this.__KBFOCUS = null;
	this.__do_contextoverride = true;
	this.__do_wheeloverride = true;
	this.__do_cursorlock = false;
	this.__FREEZE = false;
	this.__DEBUG = false;

	// TODO Add own size properties, set by first canvas attached

	for(var i in arguments)
		this.attachCanvas(arguments[i]);
};

Easel.DISPLAY = Object.freeze({ // TODO Implement cloning modes
	COPY: 0b0, // Copies without change, default behaviour
	STRETCH: 0b1, // Stretches to fill entire canvas, with distortion
	FILL: 0b10, // Stretches to fill the available space, does not distort but clips edges
	FIT: 0b100, // Stretches to fit entire contents to canvas, without distortion
	VIEWPORT: 0b1000 // Manual resizing of canvas as
});

Easel.prototype.ID = function ()
{
	return "Easel "+ (this.__ID>9?"":"0") + this.__ID;
}

Easel.prototype._canvasHook = function (_canvasDOM, _displayMode)
{
	if(UTIL.VALIDCANVAS(_canvasDOM))
	{
		this.__C.push(_canvasDOM);
		addEvent(_canvasDOM, "load", (_e)=>{this.__hook_load(_e);});
		addEvent(_canvasDOM, "click", (_e)=>{this.__hook_click(_e);});
		addEvent(_canvasDOM, "contextmenu", (_e)=>{this.__hook_context(_e);});
		addEvent(_canvasDOM, "mousedown", (_e)=>{this.__hook_mousedown(_e);});
		addEvent(_canvasDOM, "mouseup", (_e)=>{this.__hook_mouseup(_e);});
		addEvent(_canvasDOM, "mousemove", (_e)=>{this.__hook_mousemove(_e);});
		addEvent(_canvasDOM, "mousewheel", (_e)=>{this.__hook_mousewheel(_e);});
		var canvasIndex = this.__C.length - 1;
		this._updateCanvasMeasure(canvasIndex);
		this.__C_MODE[canvasIndex] = UTIL.VALIN(_displayMode, Easel.DISPLAY) ? _displayMode : Easel.DISPLAY.COPY;
		return this.__C[canvasIndex];
	}
	return null;
}

Easel.prototype._canvasUnhook = function (_canvasIndexOrDOM)
{
	var unhookTarget = null;
	var unhookIndex = -1;

	if(UTIL.NUM(_canvasIndexOrDOM) && this.__C.length > _canvasIndexOrDOM)
	{
		unhookIndex = _canvasIndexOrDOM;
		unhookTarget = this.__C[_canvasIndexOrDOM];
	}
	else if(UTIL.VALIDCANVAS(_canvasIndexOrDOM))
	{
		for(var i=0; i<this.__C.length; ++i)
			if(this.__C[i] == _canvasIndexOrDOM) {
				unhookIndex = i;
				unhookTarget = _canvasIndexOrDOM
			}
	}

	if(unhookIndex < 0) {
		remEvent(unhookTarget, "load", (_e)=>{this.__hook_load(_e);});
		remEvent(unhookTarget, "click", (_e)=>{this.__hook_click(_e);});
		remEvent(unhookTarget, "contextmenu", (_e)=>{this.__hook_context(_e);});
		remEvent(unhookTarget, "mousedown", (_e)=>{this.__hook_mousedown(_e);});
		remEvent(unhookTarget, "mouseup", (_e)=>{this.__hook_mouseup(_e);});
		remEvent(unhookTarget, "mousemove", (_e)=>{this.__hook_mousemove(_e);});
		remEvent(unhookTarget, "mousewheel", (_e)=>{this.__hook_mousewheel(_e);});
		this.__C.splice(unhookIndex, 1);
		this.__C_MODE.splice(unhookIndex, 1);
		this.__C_MEASURE.splice(unhookIndex, 1);
	}
}

Easel.prototype.attachCanvas = function (_canvasDOM, _displayMode)
{
	this._canvasHook(_canvasDOM, _displayMode);
}

Easel.prototype._updateCanvasMeasure = function ()
{
	this.__C_MEASURE.splice(0,this.__C_MEASURE.length);

	if(this.__C.length > 0)
	{
		for(var c=0; c<this.__C.length; ++c)
		{
			var cRect = this.__C[c].getBoundingClientRect();
			this.__C_MEASURE[c] = {
				x: cRect.left, y: cRect.top, w: cRect.right-cRect.left, h: cRect.bottom-cRect.top
			};
		}
		this.__x = this.__C_MEASURE[0].x;
		this.__y = this.__C_MEASURE[0].y;
		this.__w = this.__C_MEASURE[0].w;
		this.__h = this.__C_MEASURE[0].h;
	}
	else
	{
		this.__x = 0;
		this.__y = 0;
		this.__w = 0;
		this.__h = 0;
	}
};

Easel.prototype.canvasMeasure = function ()
{
	this._updateCanvasMeasure();
	// TODO: Maybe remove for performance, depends how often canvasMeasure is called
	return {x: this.__x, y: this.__y, w: this.__w, h: this.__h};
}

Easel.prototype._eventPos = function (_event)
{
	var cm = this.canvasMeasure();
	var eX = _event.clientX - cm.x;
	var eY = _event.clientY - cm.y;
	return {x: eX, y: eY, rx: (cm.w>0 ? (eX/cm.w) : 0), ry: (cm.h>0 ? (eY/cm.h) : 0)};
};

Easel.prototype._eventMouse = function (_event)
{
	var eventMouse = this._eventPos(_event);
	eventMouse.b = _event.button;
	return eventMouse;
};

Easel.prototype._eventWheel = function (_event)
{
	var eventWheel = this._eventPos(_event);
	eventWheel.h = _event.shiftKey ? _event.deltaY : _event.deltaX;
	eventWheel.v = _event.shiftKey ? _event.deltaX : _event.deltaY;
	eventWheel.d = _event.deltaZ;
	eventWheel.m = _event.deltaMode;
	return eventWheel;
};

Easel.prototype._eventKey = function (_event)
{
	var eventType = _event.type.toLowerCase();
	var eventKey = _event.key;
	var eventLoc = _event.location;
	var stateChange = (eventType=="keyup" ? -1 : (eventType=="keydown" ? 1 : 0));
	return {k: eventKey, c: (eventLoc==1?"L":eventLoc==2?"R":"") + eventKey.toUpperCase(), l: eventLoc, s: stateChange};
};

Easel.prototype._runOnHooked = function (applyFunc)
{
	for(var c=0; c<this.__C.length; ++c)
		applyFunc(this, this.__C[c], __EASEL_FOCUS_DOM);
};

Easel.prototype._toCanvasDOM = function (param)
{
	return UTIL.UNDEF(param) ? null : (
		UTIL.VALIDCANVAS(param) ? (this.__C.indexOf(param)>=0 ? param : null) :
		(UTIL.ISINT(param) && this.__C.length>param) ? this.__C[param] :
		null);
};

Easel.prototype._fireEvent = function (_type, _params, _rawEvent)
{
	var propogateToEasel = true;

	switch(_type)
	{
	if(propogateToEasel && UTIL.KEYIN(_type, this.__events))
	{
		for(var e=0; e<this.__events[_type].length; ++e) {
			try {
				this.__events[_type][e](_params, _rawEvent);
			} catch (ex) {
				LOG_ERR(ex);
			}
		}
	}

	if(this.__layers.length > 0) {
		var matches = [];

		for(var l=0; l<this.__layers.length; ++l)
		{
			var widget = this.__layers[l];
			if(UTIL.INSTIS(widget, EaselWidget))
				if(widget._testEvent(widget, _type, _params))
					matches.push(widget)
			if)
			if(UTIL.INSTIS)
			if(this._testEvent(widget, _type, _params))
				matches.push(widget);
			// TODO Add widget event triggering
		}
	}

	return LOG_DEV([this.ID() +': '+ (success ? 'Successfully executed' : 'Failed to execute') +' '+  +'events of type '+ UTIL.KEYOF(_type, Easel.EVENT) +" - P:", _params, _rawEvent], success);
};

Easel.prototype.hasFocus = function (viaCanvas)
{
	return __EASEL_FOCUS === this &&
		(UTIL.UNDEF(viaCanvas) ? true : __EASEL_FOCUS_DOM === this._toCanvasDOM(viaCanvas));
};

Easel.prototype.giveFocus = function (viaCanvas)
{
	if(!this.hasFocus()) {
		if(UTIL.INSTIS(__EASEL_FOCUS, Easel))
			__EASEL_FOCUS.takeFocus();
		LOG_DEV(this.ID() +" GIVEN FOCUS");
	}
	__EASEL_FOCUS = this;
	__EASEL_FOCUS_DOM = this._toCanvasDOM(viaCanvas);

	this._runOnHooked(function(easel, self, source){
		self.style.borderColor = (self==source ? "#eaa" : "#eda");
	});
};

Easel.prototype.takeFocus = function ()
{
	if(this.hasFocus()) {
		LOG_DEV(this.ID() +" LOSES FOCUS");
		__EASEL_FOCUS = null;
		__EASEL_FOCUS_DOM = null;
	}
	this._runOnHooked(function(easel, self, source){
		self.style.borderColor = "#ccc";
	});
};

Easel.prototype.__hook_default = function ()
{
	var printArgs = [this.ID() +":"];
	for(var a in arguments) printArgs.push(arguments[a]);
	LOG_DEV(printArgs, null);
};

Easel.prototype.__hook_load = function (_event)
{
	this.__hook_default("load", _event);
};

Easel.prototype.__hook_click = function (_event)
{
	var eMouse = this._eventMouse(_event);
	this.__hook_default("click       # "+ eMouse.b +" @ "+ eMouse.x +","+ eMouse.y);
};

Easel.prototype.__hook_context = function (_event)
{
	var eMouse = this._eventMouse(_event);
	this.__hook_default("contextmenu # "+ eMouse.b +" @ "+ eMouse.x +","+ eMouse.y);
};

Easel.prototype.__hook_mousedown = function (_event)
{
	var eMouse = this._eventMouse(_event);
	__EASEL_MOUSEDOWN_IN = this;
	this.__hook_default("mousedown   # "+ eMouse.b +" @ "+ eMouse.x +","+ eMouse.y);
};

Easel.prototype.__hook_mouseup = function (_event)
{
	var eMouse = this._eventMouse(_event);
	__EASEL_MOUSEUP_IN = this;
	if(__EASEL_MOUSEDOWN_IN === this)
		this.giveFocus(_event.target);
	this._fireEvents(Easel.EVENT.MOUSEUP, eMouse, _event);
};

Easel.prototype.__hook_mousemove = function (_event)
{
	__EASEL_MOUSEMOVE_NEW = this;
	var ePos = this._eventPos(_event);
	//this.__hook_default("mousemove   @ "+ ePos.x +","+ ePos.y);
};

Easel.prototype.__hook_mousewheel = function (_event)
{
	var eWheel = this._eventWheel(_event);
	this.__hook_default("mousewheel  @ "+ eWheel.x +","+ eWheel.y +" H:"+ eWheel.h +" V:"+ eWheel.v +" D:"+ eWheel.d +" (m "+ eWheel.m +")");
};

Easel.prototype.__hook_scroll = function (_event)
{
	this.__hook_default("scroll      @ ", _event);
};

Easel.prototype.__hook_keypress = function (_event)
{
	var eKey = this._eventKey(_event);
	this.__hook_default("keypress    # "+ eKey.k +" ("+ eKey.c +") @ L:"+ eKey.l +" S:"+ eKey.s);
};

Easel.prototype.__hook_keydown = function (_event)
{
	var eKey = this._eventKey(_event);
	this.__hook_default("keydown     # "+ eKey.k +" ("+ eKey.c +") @ L:"+ eKey.l +" S:"+ eKey.s);
};

Easel.prototype.__hook_keyup = function (_event)
{
	var eKey = this._eventKey(_event);
	this.__hook_default("keyup       # "+ eKey.k +" ("+ eKey.c +") @ L:"+ eKey.l +" S:"+ eKey.s);
};

Easel.prototype.clear = function ()
{
	this.clearChildren();
	this.redraw();
};



/*
	Easel Event Object


*/

var EaselEvent = function (_type, _function, _propogate, _reqFocus, _reqHover)
{
	// TODO EaselEvent object
	this.type = UTIL.DEF(_type) ? _type : EaselEvent.TYPE.NULL;
	this.func = UTIL.FUNC(_function) ? _function : ()=>{};
	this.prop = UTIL.DEF(_propogate) ? _propogate==true : true;
	this.reqF = UTIL.DEV(_reqFocus) ? _reqFocus==true : false;
	this.reqC = UTIL.DEV(_reqHover) ? _reqHover==true : false;
}

EaselEvent.TYPE = Object.freeze({
	// No event
	NULL: 0x0,
	// DOM events
	LOAD: 0x1, UNLOAD: 0x2,
	// Object events
	CREATE: 0x3, DESTROY: 0x4, SHOW: 0x5, HIDE: 0x6,
	// Mouse events
	MOUSEMOVE: 0x10, MOUSEDOWN: 0x11, MOUSEUP: 0x12, MOUSEWHEEL: 0x13,
	// Specialised Mouse events
	CLICK: 0x1a, CONTEXT: 0x1b,
	// Key events
	KEYDOWN: 0x20, KEYUP: 0x21,
	// Specialised Key events
	KEYPRESS: 0x2a,
	// Render / Paint events
	PREPAINT: 0x30, PAINT: 0x31, AFTERPAINT: 0x32,
	// Custom events after this point
	CUSTOM: 0x40
});


/*
	Easel Widget Object

	// Create an Easel Widget
		var ec = new EaselWidget ( [<widget to inherit from>|<object of component properties to set>, ...] );
	// Add/Remove a child component to an Easel Component
		ec.attach ( <component to attach> [, <component to attach>, ...] );
		ec.detach ( <component to detach> [, <component to detach>, ...] );

*/

var EaselWidget = function ()
{
	this.__x = 0;
	this.__y = 0;
	this.__w = 0;
	this.__h = 0;
	this.__l = 0;
	this.__t = 0;
	this.__r = 0;
	this.__b = 0;
	this.__data = {};

	this.__paint = [];
	this.__paintHooks = [];

	this.__event = {};
	this.__eventHooks = [];

	this.__children = [];

	for(var a=0; a<arguments.length; ++a)
	{
		var _arg = arguments[a];
		if(UTIL.OBJ(_arg))
			this._copyFrom(_arg);
		else
			LOG_ERR("Cannot copy non-object properties");
	}
}

EaselWidget.prototype._copyFrom = function () {
	for(var a=0; a<arguments.length; ++a)
	{
		var _arg = arguments[a];
		argKeys = Object.keys(_arg);
		for(var k in argKeys)
		{
			if(UTIL.KEYIN(k, this))
				this[k] = _arg[k];
			// TODO: Improve this to clone object-type properties
		}
	}
};

EaselWidget.prototype.addEventHook = function () {

}
