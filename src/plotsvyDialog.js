require('./styles/plotsvyDialog.css');
var Plotsvy = require('plotsvy');
var BroadcastChannel = require('broadcast-channel');
var physiomeportal = require("physiomeportal");

var PlotsvyModule = function() {
	  (physiomeportal.BaseModule).call(this);
	  this.typeName = "Data Viewer";
	  var bc = undefined;
	  this.plotManager = undefined;
	  this.url = undefined
	  var state = undefined;
	  var _this = this;
	  
	  var onMessage = function(message) {
		  _this.settingsChanged();
	  }
	  
	  this.initialise = function(parent, url) {
		  _this.plotManager = new Plotsvy(parent, url);
		  _this.loadFromState(state);
		  this.plotManager.openBroadcastChannel("dataviewer");
		  bc = new BroadcastChannel.default('dataviewer');
		  bc.addEventListener('message', onMessage);
	  }
	  
	  this.loadFromState = function(stateIn) {
		  if (stateIn) {
			  if (_this.plotManager) {
				  var string = JSON.stringify(stateIn);
				  _this.plotManager.loadState(string);
				  state = undefined;
			  } else {
				  state = stateIn;
			  }
		  }
	  }
	  
	  this.loadFromString = function(string) {
		  if (string) {
			  if (_this.plotManager) {
				  _this.plotManager.loadState(string);
				  state = undefined;
			  }
		  }
	  }
	  
	  this.openCSV = function(url) {
		  _this.plotManager.openCSV(url).then(() => {
			  _this.settingsChanged();
		  });
	  }
	  
	  this.exportSettings = function() {
		  if (_this.plotManager === undefined){
			  return
		  }
		  var settingsString = _this.plotManager.exportStateAsString();
		  if (typeof settingsString === 'string' || settingsString instanceof String) {
			  var json = JSON.parse(settingsString);
			  json.dialog = _this.typeName;
			  json.name = _this.instanceName;
			  return json;
		  }
		  return {dialog: _this.typeName, name: _this.instanceName};
	  }
	  
	  this.importSettings = function(settings) {
		  _this.setName(settings.name);
		  _this.loadFromState(settings);
	  }

	  this.destroy = function() {
		  if (bc)
			  bc.close();
		  _this.plotManager = undefined;
		  physiomeportal.BaseModule.prototype.destroy.call( _this );
	  }
}

PlotsvyModule.prototype = Object.create(physiomeportal.BaseModule.prototype);
exports.PlotsvyModule = PlotsvyModule;

var PlotsvyDialog = function(moduleIn, parentIn, options) {
  (physiomeportal.BaseDialog).call(this, parentIn, options);
  this.module = moduleIn;
  var eventNotifiers = [];
  var _myInstance = this;
  
  this.addNotifier = function(eventNotifier) {
    eventNotifiers.push(eventNotifier);
  }
  
  var resizeCallback = function() {
	  return function() {
		  _myInstance.module.plotManager.updateSize();
	  }
  }  
  
  var initialiseBlackfynnCSVExporterDialog = function() {
	  var target = _myInstance.container[0].querySelector(".plotsvyClass");
	  if (target.parentElement)
		  target.parentElement.style.padding = "0";
	  _myInstance.module.initialise(target, options.url);
	  _myInstance.resizeStopCallbacks.push(resizeCallback());
  }

  var plotsvyChangedCallback = function() {
    return function(module, change) {
      if (change === physiomeportal.MODULE_CHANGE.NAME_CHANGED) {
        _myInstance.setTitle(module.getName());
      }
    }
  }

  var initialise = function() {
    _myInstance.create(require("./snippets/plotsvy.html"));
    _myInstance.module.addChangedCallback(plotsvyChangedCallback());
    initialiseBlackfynnCSVExporterDialog();
  }
  
  initialise();
}

PlotsvyDialog.prototype = Object.create(physiomeportal.BaseDialog.prototype);
exports.PlotsvyDialog = PlotsvyDialog;
