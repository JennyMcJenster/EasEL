
// Set up some utility functions for general use...

var UTIL = {
	__DEBUGLEVEL: 0,
	DEBUGMODE: {WARN:0b1, ERR:0b10, INFO:0b100, PERF:0b1000, DEV:0b10000},
	DEBUG_GET: function (level) { return UTIL.DEF(level) ? (UTIL.__DEBUGLEVEL&level != 0) : UTIL.__DEBUGLEVEL; },
	DEBUG_SET: function (level) { UTIL.__DEBUGLEVEL = level; },
	DEBUG_ON: function (level) { UTIL.__DEBUGLEVEL = UTIL.__DEBUGLEVEL|level; },
	DEBUG_OFF: function (level) { UTIL.__DEBUGLEVEL = (UTIL.__DEBUGLEVEL|level)^level; },
	LOG: function (level, print, spew) { if(((UTIL.__DEBUGLEVEL&level)!=0) && typeof print!=="undefined") for(var l in UTIL.DEBUGMODE) if(UTIL.DEBUGMODE[l]==level) { console.log("["+l+"]", print); var printed=true; break; }; if(UTIL.UNDEF(printed)) console.log(print); return (UTIL.DEF(spew) ? spew : true); },
	LOG_WARN: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.WARN, print, spew); },
	LOG_ERR: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.ERR, print, spew); },
	LOG_INFO: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.INFO, print, spew); },
	LOG_PERF: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.PERF, print, spew); },
	LOG_DEV: function (print, spew) { return UTIL.LOG(UTIL.DEBUGMODE.DEV, print, spew); },
	TYPE: function (param) { return (typeof param); },
	TYPEOF: function (param) { return (typeof param); },
	UNDEF: function (param) { return (typeof param === "undefined"); },
	UNDEFINED: function (param) { return (typeof param === "undefined"); },
	DEF: function (param) { return (typeof param !== "undefined"); },
	DEFINED: function (param) { return (typeof param !== "undefined"); },
	NULL: function (param) { return (param === null); },
	INSTIS: function (param, base) { return (typeof param !== "undefined" && (base===null ? param===null : (param instanceof base))); },
	TYPEIS: function (param, type) { return (typeof param === (typeof type === "string" ? type.toLowerCase() : (typeof type))); },
	ISNUM: function (param) { return (typeof param === "number"); },
	ISNUMBER: function (param) { return (typeof param === "number"); },
	ISSTR: function (param) { return (typeof param === "string"); },
	ISSTRING: function (param) { return (typeof param === "string"); },
	ISOBJ: function (param) { return (typeof param === "object" && param !== null); },
	ISOBJECT: function (param) { return (typeof param === "object" && param !== null); },
	ISDICT: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor!==Array); },
	ISDICTIONARY: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor!==Array); },
	ISARR: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor===Array); },
	ISARRAY: function (param) { return (typeof param === "object" && param !== null && typeof param.constructor !== "undefined" && param.constructor===Array); },
	ISFUNC: function (param) { return (typeof param === "function"); },
	ISFUNCTION: function (param) { return (typeof param === "function"); },
	INARR: function (param, array) { return (array.indexOf(param) >= 0); },
	INOBJ: function (param, object) { return object.hasOwnProperty(param); },
	SIZE: function (object) { return (UTIL.ISDICT(object) ? Object.keys(object).length : UTIL.ISARR(object) ? object.length : -1); },
	STRINGIFY: function (object) { if(!UTIL.ISOBJ(object)) return String(object); let string = "{"; for(var k in object) string += (string.length==1?"":",") + (UTIL.ISOBJ(object[k]) ? UTIL.STRINGIFY(object[k]) : ("\""+ k +"\":"+ (UTIL.ISSTR(object[k])?"\""+object[k]+"\"":String(object[k])))); return string + "}"; }
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
		if(!UTIL.ISARR(detokenised.inserts))
			return interpreted;
		var inputs = [];
		if(UTIL.ISDICT(inputTokens))
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
		if(!UTIL.ISSTR(id))
			return error;
		error += " "+ id +" ##";
		if(UTIL.ISDICT(inputTokens))
			error += " "+ UTIL.STRINGIFY(inputTokens) +" ##";
		return error;
	},
	Dictionary: function () { return Object.keys(LANG.DICTIONARY); },
	Put: function (id, string) {
		if(!UTIL.ISSTR(id))
			return UTIL.LOG_ERR("LANG.Put failed; ID should be a string", false);
		var id = LANG._FormatID(id);
		if(UTIL.INOBJ(id, LANG.DICTIONARY))
			return UTIL.LOG_ERR("LANG.Put failed; Dictionary already contains ID \""+ id +"\"", false);
		if(!UTIL.ISSTR(string))
			return UTIL.LOG_ERR("LANG.Put failed; Passed a non-string as a parameter", false);
		LANG.DICTIONARY[id] = LANG._Detokenise(string);
		var tokenCount = LANG.DICTIONARY[id].tokenCount;
		return UTIL.LOG_INFO("Registered new language string, ID \""+ id +"\" ("+ tokenCount +" tokens"+ (tokenCount>0 ? (": \""+ LANG.DICTIONARY[id].tokens.join("\", \"") +"\"") : "") +")");
	},
	Get: function (id, tokens) {
		if(!UTIL.ISSTR(id))
			return UTIL.LOG_ERR("ID should be a string", LANG._LangError(id));
		var id = LANG._FormatID(id);
		if(!UTIL.INOBJ(id, LANG.DICTIONARY))
			return UTIL.LOG_ERR("Dictionary does not contain ID \""+ id +"\"", LANG._LangError(id, tokens));
		var dictionaryEntry = LANG.DICTIONARY[id];
		if(!UTIL.ISDICT(tokens)) {
			if(LANG.DICTIONARY[id].tokenCount==0) {
				if(UTIL.DEF(tokens))
					UTIL.LOG_WARN("ID \""+ id +"\" expected no tokens");
				return LANG.DICTIONARY[id].parts[0];
			} else
				return UTIL.LOG_ERR("ID \""+ id +"\" expected tokens as dictionary of IDs and values", LANG._Interpret(dictionaryEntry));
		}
		var tokensPassed = UTIL.SIZE(tokens);
		var tokensExpect = dictionaryEntry.tokenCount;
		if(tokensPassed != tokensExpect)
			return UTIL.LOG_ERR("ID \""+ id +"\" expected "+ tokensExpect +" tokens, got "+ tokensPassed, LANG._Interpret(dictionaryEntry, tokens));
		for(var tokenID in tokens)
			if(!UTIL.INARR(LANG._FormatToken(tokenID), dictionaryEntry.tokens))
				return UTIL.LOG_ERR("No such token \""+ LANG._FormatToken(tokenID) +"\" in ID \""+ id +"\"", LANG._Interpret(dictionaryEntry, tokens));
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
				LOG_DEV(_e);
			}
		});
		window.addEventListener("keydown", function (_e) {
			if(__EASEL_KBFOCUS instanceof Easel) {
				__EASEL_KBFOCUS.__hook_keydown(_e);
				_e.preventDefault();
			} else {
				LOG_DEV(_e);
			}
		});
		window.addEventListener("keyup", function (_e) {
			if(__EASEL_KBFOCUS instanceof Easel) {
				__EASEL_KBFOCUS.__hook_keydown(_e);
				_e.preventDefault();
			} else {
				LOG_DEV(_e);
			}
		});
		window.addEventListener("click", function (_e) {
			if(__EASEL_KBFOCUS_CHANGED) {
				__EASEL_KBFOCUS_CHANGED = false;
			} else {
				__EASEL_KBFOCUS = null;
				LOG_DEV("Easel focus null");
			}
			LOG_DEV(_e);
		})
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
	LOG_DEV(this);
	for(var a in arguments) {
		LOG_DEV(arguments[a]);
	}
};

Easel.prototype.__hook_load = function (_event)
{
	LOG_DEV("Easel load");
	this.__hook_DEBUG(_event);
};

Easel.prototype.__hook_click = function (_event)
{
	__EASEL_KBFOCUS = this;
	__EASEL_KBFOCUS_CHANGED = true;
	LOG_DEV("Easel click (kb focus)");
	LOG_DEV(__EASEL_KBFOCUS);
	this.__hook_DEBUG(_event);
};

Easel.prototype.__hook_mousedown = function (_event)
{
	LOG_DEV("Easel mousedown");
	this.__hook_DEBUG(_event);
};

Easel.prototype.__hook_mouseup = function (_event)
{
	LOG_DEV("Easel mouseup");
	this.__hook_DEBUG(_event);
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
			LOG_ERR("Cannot copy non-object properties");
	}
}
