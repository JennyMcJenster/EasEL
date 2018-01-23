
var __EASEL_CTEMPLATE = {}; // Stores specific (template) components by name
var __EASEL_NICEBROWSER = (window.addEventListener !== undefined);
var __EASEL_KBFOCUS = null;

var EASEL_OVERRIDE_WINDOW = EASEL_OVERRIDE_WINDOW===undefined ? true : EASEL_OVERRIDE_WINDOW;


if(EASEL_OVERRIDE_WINDOW)
{
	window.addEventListener("load", function (_e) {
		console.log("Ready!");
	});
	window.addEventListener("keypress", function (_e) {
		console.dir(_e);
		_e.preventDefault();
	});
}

/*
	Easel Object

	// Create an Easel
		var easel = new Easel ( <target canvas dom element> );
	// Add components to an Easel
		easel.addComponent ( <component to add> [, <component to add>, ...] );
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
		_canvasDOM.addEventListener("context", (e)=>{this.__hook_DEBUG(e);});
		_canvasDOM.addEventListener("mousedown", (e)=>{this.__hook_DEBUG(e);});
		_canvasDOM.addEventListener("mouseup", (e)=>{this.__hook_DEBUG(e);});
	}
	else
	{
		_canvasDOM.attachEvent("onload", this.__hook_load);
		_canvasDOM.attachEvent("onclick", this.__hook_click);
	}
};

Easel.prototype._canvasUnhook = function (_canvasDOM)
{ // EXPECTS _canvasDOM TO EXIST AND BE A VALID CANVAS
	if(__EASEL_NICEBROWSER)
	{
		_canvasDOM.removeEventListener("load");
		_canvasDOM.removeEventListener("click");
	}
	else
	{
		_canvasDOM.detachEvent("onload");
		_canvasDOM.detachEvent("onclick");
	}
};

Easel.prototype.__hook_DEBUG = function () {
	console.dir(this);
	for(var a in arguments)
		console.log(a, arguments[a]);
};

Easel.prototype.__hook_load = function (_event) {
	console.dir(this);
	console.log(_event);
};

Easel.prototype.__hook_click = function () {
	__EASEL_KBFOCUS = this;
};



/*
	Easel Component Object

	// Create an Easel Component
		var ec = new EaselComponent ( <easel component> [, <easel component>, ...] );
	// Add components to an Easel
		easel.addComponent ( <component to add> [, <component to add>, ...] );
	// Freeze an Easel (halt accepting events/input)
		easel.freeze ( <true/false> );
	// Change Easel properties
		easel.props ( <easel properties as object> );

*/


var EaselComponent = function ()
{
	this.style = {};
}
