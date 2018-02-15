
// Set up some utility functions for general use...

var UTIL = {
	__DEBUGLEVEL: 0,
	DEBUGMODE_ERR:0b1, DEBUGMODE_INFO:0b10, DEBUGMODE_PERF:0b100, DEBUGMODE_DEV:0b1000,
	DEBUG_GET: function (level) { return (__DEBUGLEVEL&level != 0); },
	DEBUG_SET: function (level) { __DEBUGLEVEL = level; },
	DEBUG_ON: function (level) { __DEBUGLEVEL = __DEBUGLEVEL|level; },
	DEBUG_OFF: function (level) { __DEBUGLEVEL = (__DEBUGLEVEL|level)^level; },
	LOG: function (level, print, spew) { if((__DEBUGLEVEL&level!=0) && typeof print!=="undefined") console.log(print); return (typeof spew==="undefined" ? true : spew); },
	ERR: function (print, spew) { LOG(DBM_ERR, print, spew); },
	TYPE: function (param) { return (typeof param); },
	TYPEOF: function (param) { return (typeof param); },
	UNDEF: function (param) { return (typeof param === "undefined"); },
	UNDEFINED: function (param) { return (typeof param === "undefined"); },
	DEF: function (param) { return (typeof param !== "undefined"); },
	DEFINED: function (param) { return (typeof param !== "undefined"); },
	INSTIS: function (param, base) { return (typeof param !== "undefined" && (base===null ? param===null : (param instanceof base))); },
	TYPEIS: function (param, type) { return (typeof param === (typeof type === "string" ? type.toLowerCase() : (typeof type))); },
	ISNUM: function (param) { return (typeof param === "number"); },
	ISNUMBER: function (param) { return (typeof param === "number"); },
	ISSTR: function (param) { return (typeof param === "string"); },
	ISSTRING: function (param) { return (typeof param === "string"); },
	ISOBJ: function (param) { return (typeof param === "object" && param.constructor!==Array); },
	ISOBJECT: function (param) { return (typeof param === "object" && param.constructor!==Array); },
	ISARR: function (param) { return (param && param.constructor===Array); },
	ISARRAY: function (param) { return (param && param.constructor===Array); },
	ISFUNC: function (param) { return (typeof param === "function"); },
	ISFUNCTION: function (param) { return (typeof param === "function"); },
	INARR: function (param, array) { return (array.indexOf(param) >= 0); },
	INOBJ: function (param, object) { return object.hasOwnProperty(param); },
	SIZE: function (object) { return (UTIL.ISOBJ(object) ? Object.keys(object).length : UTIL.ISARR(object) ? object.length : -1); }
};

UTIL.DEBUG_SET (UTIL.DEBUGMODE_ERR | UTIL.DEBUGMODE_INFO | UTIL.DEBUGMODE_PERF | UTIL.DEBUGMODE_DEV);



// Set up language features

var LANG = {
	// TODO: Rework for same token in multiple places
	TOKENPREFIX: "{{#",
	TOKENSUFFIX: "}}",
	DICTIONARY: {},
	_FormatID: function (id) { return id.toLowerCase(); },
	_FormatToken: function (token) { return token.toUpperCase(); },
	_Interpret: function (detokenised, tokens) {
		var ordered = [];
		for(var tokenID in tokens) {
			var position = detokenised.tokens.indexOf(LANG._FormatToken(tokenID));
			if(position >= 0) ordered[position] = tokens[tokenID];
		}
		var interpreted = detokenised.parts[0];
		for(var t=0; t<detokenised.tokenCount; ++t)
			interpreted += ordered[t] + detokenised.parts[t+1];
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
			detokenised.parts[detokenised.tokenCount] = "";
			UTIL.LOG(UTIL.DEBUGMODE_DEV, "[0] "+remainingString);
			if(tokenSuffixAt >= 0 && tokenSuffixAt < tokenPrefixAt) {
				var append = remainingString.substr(0, tokenSuffixAt + tokenSuffixLen);
				UTIL.LOG(UTIL.DEBUGMODE_DEV, "[A] "+append);
				detokenised.parts[detokenised.tokenCount] += append;
				remainingString = remainingString.substr(tokenSuffixAt + tokenSuffixLen);
				tokenPrefixAt = remainingString.indexOf(TOKENPRE);
				tokenSuffixAt = remainingString.indexOf(TOKENSUF);
				UTIL.LOG(UTIL.DEBUGMODE_DEV, "[L] "+remainingString);
			}
			var tokenStart = tokenPrefixAt + tokenPrefixLen;
			var beforeToken = remainingString.substr(0, tokenPrefixAt);
			var insideToken = remainingString.substr(tokenPrefixAt+tokenPrefixLen, tokenSuffixAt-tokenPrefixAt-tokenPrefixLen);
			UTIL.LOG(UTIL.DEBUGMODE_DEV, "[B] "+beforeToken);
			UTIL.LOG(UTIL.DEBUGMODE_DEV, "[T] "+insideToken);
			if(UTIL.UNDEF(detokenised.tokens)) detokenised.tokens = new Array();
			detokenised.tokens[detokenised.tokenCount] = LANG._FormatToken(insideToken);
			detokenised.parts[detokenised.tokenCount] += beforeToken;
			detokenised.tokenCount += 1;
			remainingString = remainingString.substr(tokenSuffixAt + tokenSuffixLen);
			tokenPrefixAt = remainingString.indexOf(TOKENPRE);
			tokenSuffixAt = remainingString.indexOf(TOKENSUF);
		}
		detokenised.parts[detokenised.tokenCount] = remainingString;
		UTIL.LOG(UTIL.DEBUGMODE_DEV, detokenised);
		return detokenised;
	},
	_LangError: function (id, tokens) {
		if(!UTIL.ISSTR(id)) return "##_LANG_GET_ERROR_##";
		if(!UTIL.ISOBJ(tokens)) return "##_LANG_GET_ERROR_##:{"+id+"}";
		var tokenPrint = "";
		for(var tokenID in tokens)
			if(UTIL.INOBJ(tokenID, tokens)) tokenPrint += "["+LANG._FormatToken(tokenID)+":\""+tokens[tokenID]+"\"]";
		return "##_LANG_GET_ERROR_##:{"+id+"}"+(tokenPrint.length>0?(":"+tokenPrint):"");
	},
	Put: function (id, string) {
		if(!UTIL.ISSTR(id))
			return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Put failed; ID should be a string", false);
		var id = LANG._FormatID(id);
		if(UTIL.INOBJ(id, LANG.DICTIONARY))
			return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Put failed; Dictionary already contains ID \""+ id +"\"", false);
		if(!UTIL.ISSTR(string))
			return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Put failed; Passed a non-string as a parameter", false);
		LANG.DICTIONARY[id] = LANG._Detokenise(string);
		return UTIL.LOG(UTIL.DEBUGMODE_INFO, "Registered new language string, ID \""+ id +"\" ("+ LANG.DICTIONARY[id].tokenCount +" tokens"+ (UTIL.SIZE(LANG.DICTIONARY[id].tokens)>0 ? (": \""+ LANG.DICTIONARY[id].tokens.join("\", \"") +"\"") : "") +")");
	},
	Get: function (id, tokens) {
		if(!UTIL.ISSTR(id))
			return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Get failed; ID should be a string", LANG._LangError());
		var id = LANG._FormatID(id);
		if(!UTIL.ISOBJ(tokens)){
			if(UTIL.DEF(tokens))
				return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Get failed; Expected tokens as dictionary of IDs and values", LANG._LangError(id));
			else if(UTIL.INOBJ(id, LANG.DICTIONARY) && LANG.DICTIONARY[id].tokenCount==0)
				return LANG.DICTIONARY[id].parts[0];
		}
		if(!UTIL.INOBJ(id, LANG.DICTIONARY))
			return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Get failed; Dictionary does not contain ID \""+ id +"\"", LANG._LangError(id, tokens));
		var dictionaryEntry = LANG.DICTIONARY[id];
		var tokensPassed = UTIL.SIZE(tokens);
		var tokensExpect = dictionaryEntry.tokenCount;
		if(tokensPassed != tokensExpect)
			return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Get failed; Mismatched token count for ID \""+ id +"\", expected "+ tokensExpect +" got "+ tokensPassed, LANG._LangError(id, tokens));
		for(var tokenID in tokens)
			if(!UTIL.INARR(LANG._FormatToken(tokenID), dictionaryEntry.tokens))
				return UTIL.LOG(UTIL.DEBUGMODE_ERR, "LANG.Get failed; No such token \""+ LANG._FormatToken(tokenID) +"\" in ID \""+ id +"\"", LANG._LangError(id, tokens));
		return LANG._Interpret(dictionaryEntry, tokens);
	}
};

LANG.Put("teststr", "This string is a test, expecting 2 parameters - 1:{{#param1}} and 2:{{#param2}} - how fancy!");
UTIL.LOG(UTIL.DEBUGMODE_DEV, LANG.Get("teststr", {PARAM2:"second", "pArAm1":"first"}));


// Now, to business... :D


// Shorthand util functions for EasEL
var LOG = UTIL.LOG;
var LOG_ERR = UTIL.DEBUGMODE_ERR;
var LOG_INFO = UTIL.DEBUGMODE_INFO;
var LOG_PERF = UTIL.DEBUGMODE_PERF;
var LOG_DEV = UTIL.DEBUGMODE_DEV;

// Some EasEL variables used for window management and control
const __EASEL_NICEBROWSER = (window.addEventListener !== undefined);
var EASEL_OVERRIDE_WINDOW = EASEL_OVERRIDE_WINDOW===undefined ? true : EASEL_OVERRIDE_WINDOW;
var __EASEL_KBFOCUS = null;

// Perform actions based on window state etc.
if(!__EASEL_NICEBROWSER) alert("Please stop using bad browsers. :(");
if(EASEL_OVERRIDE_WINDOW)
{
	if(__EASEL_NICEBROWSER) {
		window.addEventListener("load", function (_e) {
			LOG(LOG_INFO, "Ready!");
		});
		window.addEventListener("keypress", function (_e) {
			if(__EASEL_KBFOCUS instanceof Easel) {
				__EASEL_KBFOCUS.__hook_keypress(_e);
				_e.preventDefault();
			} else {
				LOG(LOG_DEV, _e);
			}
		});
		window.addEventListener("keydown", function (_e) {
			if(__EASEL_KBFOCUS instanceof Easel) {
				__EASEL_KBFOCUS.__hook_keydown(_e);
				_e.preventDefault();
			} else {
				LOG(LOG_DEV, _e);
			}
		});
		window.addEventListener("keyup", function (_e) {
			if(__EASEL_KBFOCUS instanceof Easel) {
				__EASEL_KBFOCUS.__hook_keydown(_e);
				_e.preventDefault();
			} else {
				LOG(LOG_DEV, _e);
			}
		});
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
	this.__C = null;
	this.__CTX = null;
	this.__C_VALID = false;
	this.__component_store = []; // Stores components particular to this Easel
	this.__component_order = []; // References to used components, used when z-sorting
	this.__FREEZE = false;
	this.__DEBUG = false;

	this._canvasTarget(_canvasDOM);
};

Easel.prototype._canvasTarget = function (_canvasDOM)
{
	if(this.__C_VALID === true)
	{
		this._canvasUnhook(this.__C);
		this.__C = null;
		this.__C_VALID = false;
	}

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
		_canvasDOM.addEventListener("context", (e)=>{this.__hook_context(e);});
		_canvasDOM.addEventListener("mousedown", (e)=>{this.__hook_mousedown(e);});
		_canvasDOM.addEventListener("mouseup", (e)=>{this.__hook_mouseup(e);});
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
		_canvasDOM.removeEventListener("context");
		_canvasDOM.removeEventListener("mousedown");
		_canvasDOM.removeEventListener("mouseup");
	}
	else
	{
		// TODO Add event unhooks for crap browsers
		//_canvasDOM.detachEvent("onload", ...
	}
};

Easel.prototype.__hook_DEBUG = function ()
{
	LOG(LOG_DEV, this);
	for(var a in arguments) {
		LOG(LOG_DEV, arguments[a]);
	}
};

Easel.prototype.__hook_load = function (_event)
{
	this.__hook_DEBUG
};

Easel.prototype.__hook_click = function ()
{
	__EASEL_KBFOCUS = this;
};



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
			LOG(LOG_ERR, "Cannot copy non-object properties");
	}
}
