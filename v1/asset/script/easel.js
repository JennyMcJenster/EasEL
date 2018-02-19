
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
	NUMBER: function (param) { return (typeof param === "number"); },
	STR: function (param) { return (typeof param === "string"); },
	STRING: function (param) { return (typeof param === "string"); },
	OBJ: function (param) { return (typeof param === "object" && param !== null); },
	OBJECT: function (param) { return (typeof param === "object" && param !== null); },
	DICT: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor!==Array); },
	DICTIONARY: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor!==Array); },
	ARR: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor===Array); },
	ARRAY: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor===Array); },
	FUNC: function (param) { return (typeof param === "function"); },
	FUNCTION: function (param) { return (typeof param === "function"); },
	INARR: function (param, array) { return (array.indexOf(param) >= 0); },
	INOBJ: function (param, object) { return object.hasOwnProperty(param); },
	SIZE: function (object) { return (UTIL.DICT(object) ? Object.keys(object).length : UTIL.ARR(object) ? object.length : -1); },
	STRINGIFY: function (object, iteration) { var iteration=UTIL.DEF(iteration)?iteration+1:0;if(iteration>1) return "## ITERATION_LIMIT_EXCEEDED ##"; if(!UTIL.OBJ(object)) return (UTIL.FUNC(object) ? "## FUNCTION ##" : String(object)); let string = "{"; for(var k in object) string += (string.length==1?"":",") + (UTIL.OBJ(object[k]) ? UTIL.STRINGIFY(object[k],iteration) : ("\""+ k +"\":"+ (UTIL.STR(object[k])?"\""+object[k]+"\"":String(object[k])))); return string + "}"; }
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
		if(UTIL.INOBJ(id, LANG.DICTIONARY))
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
		if(!UTIL.INOBJ(id, LANG.DICTIONARY))
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
			if(!UTIL.INARR(LANG._FormatToken(tokenID), dictionaryEntry.tokens))
				return UTIL.LOG_ERR(LANG._Interpret(dictionaryEntry, tokens), "No such token \""+ LANG._FormatToken(tokenID) +"\" in ID \""+ id +"\"");
		return LANG._Interpret(dictionaryEntry, tokens);
	}
};

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

// Some EasEL variables used for window management and control
const __EASEL_NICEBROWSER = (window.addEventListener !== undefined);
var EASEL_OVERRIDE_WINDOW = EASEL_OVERRIDE_WINDOW===undefined ? true : EASEL_OVERRIDE_WINDOW;
var __EASEL_KBFOCUS = null;
var __EASEL_KBFOCUS_CHANGED = false;
var __EASEL_COUNT = 0;

// Perform actions based on window state etc.
if(!__EASEL_NICEBROWSER) alert("Please stop using bad browsers. :(");
if(EASEL_OVERRIDE_WINDOW)
{
	var window_load = function (_e) {
		LOG_INFO("Ready!");
	};
	var window_keypress = function (_e) {
		if(__EASEL_KBFOCUS instanceof Easel) {
			__EASEL_KBFOCUS.__hook_keypress(_e);
			_e.preventDefault();
		} else {
			LOG_DEV(["No Easel:", "keypress", _e]);
		}
	};
	var window_keydown = function (_e) {
		if(_e.key=="F5" && _e.ctrlKey) {
			window.location.reload(true);
		} else if(__EASEL_KBFOCUS instanceof Easel) {
			__EASEL_KBFOCUS.__hook_keydown(_e);
			_e.preventDefault();
		} else {
			LOG_DEV(["No Easel:", "keydown", _e]);
		}
	};
	var window_keyup = function (_e) {
		if(__EASEL_KBFOCUS instanceof Easel) {
			__EASEL_KBFOCUS.__hook_keyup(_e);
			_e.preventDefault();
		} else {
			LOG_DEV(["No Easel:", "keyup", _e]);
		}
	};
	var window_click = function (_e) {
		if(__EASEL_KBFOCUS_CHANGED > 0) {
			// TODO Fix bug with click-and-drag off canvas removing focus
			//  Maybe try using mousedown/up events to manage this feature instead of click/context?
			--__EASEL_KBFOCUS_CHANGED;
			_e.preventDefault();
		} else if(!UTIL.NULL(__EASEL_KBFOCUS)) {
			if(UTIL.INSTIS(__EASEL_KBFOCUS, Easel))
				LOG_DEV(["No Easel:", "click", "(Defocussed Easel "+ __EASEL_KBFOCUS.__ID +")"]);
			else
				LOG_DEV(["No Easel:", "click", "__EASEL_KBFOCUS was not an Easel"]);
			__EASEL_KBFOCUS = null;
		} else {
			LOG_DEV(["No Easel:", "click", _e]);
		}
	};
	var window_context = function (_e) {
		if(__EASEL_KBFOCUS_CHANGED > 0) {
			// TODO Fix bug with click-and-drag off canvas removing focus
			//  Maybe try using mousedown/up events to manage this feature instead of click/context?
			--__EASEL_KBFOCUS_CHANGED;
			if(UTIL.INSTIS(__EASEL_KBFOCUS, Easel) && __EASEL_KBFOCUS.__do_override_context)
				_e.preventDefault();
		} else if(!UTIL.NULL(__EASEL_KBFOCUS)) {
			if(UTIL.INSTIS(__EASEL_KBFOCUS, Easel))
				LOG_DEV(["No Easel:", "context", "(Defocussed Easel "+ __EASEL_KBFOCUS.__ID +")"]);
			else
				LOG_DEV(["No Easel:", "context", "__EASEL_KBFOCUS was not an Easel"]);
			__EASEL_KBFOCUS = null;
		} else {
			LOG_DEV(["No Easel:", "context", _e]);
		}
	};
	var window_scroll = function (_e) {
		if(__EASEL_KBFOCUS instanceof Easel) {
			__EASEL_KBFOCUS.__hook_scroll(_e);
			_e.preventDefault();
		} else {
			LOG_DEV(["No Easel:", "scroll", _e]);
		}
	};

	// TODO Cursor locking capability
	/*  https://www.html5rocks.com/en/tutorials/pointerlock/intro/  */
	/*
		if(UTIL.INSTIS(__EASEL_KBFOCUS, Easel) && __EASEL_KBFOCUS.__do_lock_cursor)
			{ lock cursor to given canvas element }
	*/

	if(__EASEL_NICEBROWSER) {
		window.addEventListener("load", window_load);
		window.addEventListener("keypress", window_keypress);
		window.addEventListener("keydown", window_keydown);
		window.addEventListener("keyup", window_keyup);
		window.addEventListener("click", window_click);
		window.addEventListener("contextmenu", window_context);
		//window.addEventListener("scroll", window_scroll);
	} else {
		// TODO Add window hooks for crap browsers
	}
}

/*
	Easel Object

	// Create an Easel
		var easel = new Easel ( <target canvas dom element> );
	// Add/Remove components to an Easel
		easel.add ( <component to add> [, <component to add>, ...] );
		easel.remove ( <component to remove> [, <component to remove>, ...] );
		// Both of these also allow passing of an array of EaselComponent objects
	// Freeze an Easel (halt accepting events/input)
		easel.freeze ( <true/false> );
*/


var Easel = function (_canvasDOM)
{
	this.__ID = ++__EASEL_COUNT;
	this.__C = null;
	this.__CTX = null;
	this.__C_VALID = false;
	this.__component_store = []; // Stores components particular to this Easel
	this.__component_order = []; // References to used components, used when z-sorting
	this.__do_override_context = false;
	this.__do_lock_cursor = false;
	this.__FREEZE = false;
	this.__DEBUG = false;

	this._canvasTarget(_canvasDOM);
};

Easel.prototype._canvasTarget = function (_canvasDOM)
{
	if(this.__C_VALID === true)
		this._canvasUnhook(this.__C);
	this.__C = null;
	this.__C_VALID = false;

	if(typeof _canvasDOM === "object")
		if(_canvasDOM.nodeName === "CANVAS")
		{
			this.__C = _canvasDOM;
			this._canvasHook(this.__C);
			this.__C_VALID = true;
			return this.__C;
		}
	return false;
};

Easel.prototype._canvasHook = function (_canvasDOM)
{ // EXPECTS _canvasDOM TO EXIST AND BE A VALID CANVAS
	if(__EASEL_NICEBROWSER)
	{
		_canvasDOM.addEventListener("load", (e)=>{this.__hook_load(e);});
		_canvasDOM.addEventListener("click", (e)=>{this.__hook_click(e);});
		_canvasDOM.addEventListener("contextmenu", (e)=>{this.__hook_context(e);});
		_canvasDOM.addEventListener("mousedown", (e)=>{this.__hook_mousedown(e);});
		_canvasDOM.addEventListener("mouseup", (e)=>{this.__hook_mouseup(e);});
		_canvasDOM.addEventListener("mousemove", (e)=>{this.__hook_mousemove(e);});
		_canvasDOM.addEventListener("mousewheel", (e)=>{this.__hook_mousewheel(e);});
	}
	else
	{
		// TODO Add event hooks for crap browsers
		//_canvasDOM.attachEvent("onload", ...
	}
};

Easel.prototype._canvasUnhook = function (_canvasDOM)
{ // EXPECTS _canvasDOM TO EXIST AND BE A VALID CANVAS
	if(__EASEL_NICEBROWSER)
	{
		_canvasDOM.removeEventListener("load");
		_canvasDOM.removeEventListener("click");
		_canvasDOM.removeEventListener("contextmenu");
		_canvasDOM.removeEventListener("mousedown");
		_canvasDOM.removeEventListener("mouseup");
		_canvasDOM.removeEventListener("mousemove");
		_canvasDOM.removeEventListener("mousewheel");
	}
	else
	{
		// TODO Add event unhooks for crap browsers
		//_canvasDOM.detachEvent("onload", ...
	}
};

Easel.prototype._canvasPos = function ()
{
	var pos = this.__C.getBoundingClientRect();
	return {x: pos.left, y: pos.top};
};

Easel.prototype._eventPos = function (_event)
{
	var canvasPos = this._canvasPos();
	return {x: _event.clientX - canvasPos.x, y: _event.clientY - canvasPos.y};
};

Easel.prototype._eventKey = function (_event)
{
	var eventType = _event.type.toLowerCase();
	var eventKey = _event.key;
	var eventLoc = _event.location;
	var stateChange = (eventType=="keyup" ? -1 : (eventType=="keydown" ? 1 : 0));
	return {k: eventKey, c: (eventLoc==1?"L":eventLoc==2?"R":"") + eventKey.toUpperCase(), l: eventLoc, s: stateChange};
};

Easel.prototype.hasFocus = function ()
{
	return (__EASEL_KBFOCUS === this);
};

Easel.prototype.setAsFocus = function ()
{
	if(!this.hasFocus())
		LOG_DEV("Easel focus changed to Easel "+ this.__ID);
	__EASEL_KBFOCUS = this;
	++__EASEL_KBFOCUS_CHANGED;
};

Easel.prototype.__hook_default = function ()
{
	var printArgs = ["Easel "+ (this.__ID>9?"":"0") + this.__ID +":"];
	for(var a in arguments) printArgs.push(arguments[a]);
	LOG_DEV(printArgs, null);
};

Easel.prototype.__hook_load = function (_event)
{
	this.__hook_default("load", _event);
};

Easel.prototype.__hook_click = function (_event)
{
	this.setAsFocus();
	var ePos = this._eventPos(_event);
	var eButton = _event.button;
	this.__hook_default("click       @ "+ ePos.x +","+ ePos.y +" (button "+ eButton +")");
};

Easel.prototype.__hook_context = function (_event)
{
	this.setAsFocus();
	var ePos = this._eventPos(_event);
	var eButton = _event.button;
	this.__hook_default("contextmenu @ "+ ePos.x +","+ ePos.y);
};

Easel.prototype.__hook_mousedown = function (_event)
{
	var ePos = this._eventPos(_event);
	var eButton = _event.button;
	this.__hook_default("mousedown   @ "+ ePos.x +","+ ePos.y +" using button "+ eButton);
};

Easel.prototype.__hook_mouseup = function (_event)
{
	var ePos = this._eventPos(_event);
	var eButton = _event.button;
	this.__hook_default("mouseup     @ "+ ePos.x +","+ ePos.y +" using button "+ eButton);
};

Easel.prototype.__hook_mousemove = function (_event)
{
	/*var ePos = this._eventPos(_event);
	LOG_DEV("Moved over Easel "+ this.__ID +" at "+ ePos.x +","+ ePos.y);*/
};

Easel.prototype.__hook_mousewheel = function (_event)
{
	this.__hook_default("mousewheel  @ ", _event);
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
}



/*
	Easel Component Object

	// Create an Easel Component
		var ec = new EaselComponent ( [<component to inherit from>|<object of component properties to set>, ...] );
	// Add/Remove a child component to an Easel Component
		ec.attach ( <component to attach> [, <component to attach>, ...] );
		ec.detach ( <component to detach> [, <component to detach>, ...] );

*/


var EaselComponent = function ()
{
	this.events = {};
	this.style = {};

	for(var a=0; a<arguments.length; ++a)
	{
		var argument = arguments[0];
		var argumentType = (typeof argument);
		if(argumentType == "object")
			this.__copyFrom(argument);
		else
			LOG_ERR("Cannot copy non-object properties");
	}
}
