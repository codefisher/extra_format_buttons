try {
	var Cc = Components.classes;
	var Ci = Components.interfaces;
} catch(e) {}

var composeExtraFormat = {
	init: function() {
		var commandManager = GetCurrentCommandManager();
		commandManager.addCommandObserver(composeExtraFormat, "obs_documentCreated");
		commandManager.addCommandObserver(composeExtraFormat, "cmd_setDocumentModified");
		commandManager.addCommandObserver(composeExtraFormat, "cmd_bold");
		commandManager.addCommandObserver(composeExtraFormat, "obs_documentLocationChanged");

		/* setup for the extra color buttons */
		var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService)
			.getBranch("extensions.compose-font-size.colors.");
		prefs.QueryInterface(Ci.nsIPrefBranch2);
		var count = {};
		var rows = prefs.getChildList("", count);
		for(var i = 0; i < count.value; i++) {
			var nodeId = rows[i];
			var node = document.getElementById(nodeId);
			if(node) {
				node.style.backgroundColor = prefs.getCharPref(nodeId);
			}
		}
		var colorWatcher = new ExtraFormatSettingWatcher("", function(subject, topic, data) {
			var nodeId = data.replace('extensions.compose-font-size.colors.', '')
			var node = document.getElementById(nodeId);
			if(node) {
				node.style.backgroundColor = prefs.getCharPref(nodeId);
			}
		});
		colorWatcher.startup();

		/* change the HTML cmd_renderedHTMLEnabler to our own */
		/* var commandTable = GetComposerCommandTable();
		if (commandTable) {
			//commandTable.unregisterCommand("cmd_renderedHTMLEnabler", nsDummyHTMLCommand);
			//commandTable.registerCommand("cmd_renderedHTMLEnabler2", composeExtraFormat.nsDummyHTMLCommand);
		}*/
	},

	nsDummyHTMLCommand: {
		isCommandEnabled: function (aCommand, dummy) {
			return (IsDocumentEditable() && IsEditingRenderedHTML());
		},
		getCommandStateParams: function (aCommand, aParams, aRefCon) {},
		doCommandParams: function (aCommand, aParams, aRefCon) {},
		doCommand: function (aCommand) {}
	},

	enablerChange: function() {
		//goUpdateCommand("cmd_renderedHTMLEnabler2");
		var node = document.getElementById('cmd_renderedHTMLEnabler2');
		var enabler = document.getElementById('cmd_renderedHTMLEnabler');
		if(!enabler.getAttribute('disabled') || composeExtraFormat.focusIsToolbar()) {
			node.removeAttribute('disabled');
		} else {
			node.setAttribute('disabled', true);
		}
	},

	focusIsToolbar: function() {
		var node = document.commandDispatcher.focusedElement;
		if(!node){
			return false;
		}
		for(; node; node = node.parentNode) {
			if(node.id && node.id == 'FormatToolbox') {
				return true;
			}
		}
		return false;
	},

	observe: function(aSubject, aTopic, aData) {
		composeExtraFormat.updateTextFormatting();
	},

	updateTextFormatting: function() {
		var style = composeExtraFormat.getSectionStyle();
		if(style == null) {
			return;
		}
		var size = style.fontSize.replace(/([a-zA-Z]+)/,'');
		try {
			composeExtraFormat.setTextSizeList(size);
		} catch(e) {}
		var subButton = document.getElementById('efb-subscriptButton');
		var superButton = document.getElementById('efb-superscriptButton');
		var strikeButton = document.getElementById('efb-strikethroughButton');
		if(style.verticalAlign == 'sub') {
			subButton.setAttribute('state','true');
			subButton.setAttribute('checked','true');
		} else {
			subButton.setAttribute('state','false');
			subButton.removeAttribute('checked');
		}
		if(style.verticalAlign == 'super') {
			superButton.setAttribute('state','true');
			superButton.setAttribute('checked','true');
		} else {
			superButton.setAttribute('state','false');
			superButton.removeAttribute('checked');
		}
		if(style.textDecoration == 'line-through') {
			strikeButton.setAttribute('state','true');
			strikeButton.setAttribute('checked','true');
		} else {
			strikeButton.setAttribute('state','false');
			strikeButton.removeAttribute('checked');
		}
	},

	getSectionStyle: function() {
		var editor = document.getElementById('content-frame');

		var selection = editor.contentWindow.getSelection();
		var node = selection.focusNode;
		if(selection.anchorNode && selection.anchorNode.parentNode == node){
			node = selection.anchorNode;
		}
		if(!node) {
			if(editor.contentDocument.body) {
				node = editor.contentDocument.body;
			} else {
				return null;
			}
		}
		if(node.nodeName == '#text'){
			node = node.parentNode;
		}
		return editor.contentWindow.getComputedStyle(node, '');
	},

	setTextSizeList: function(size){
		var sizeBox = document.getElementById('efb-FontSize');
		if(!sizeBox) {
			return;
		}
		sizeBox.value = size;
		try {
			var current = sizeBox.getElementsByAttribute('label', size);
			if(current) {
				sizeBox.selectedItem = current;
			}
		} catch(e) {}
	},

	SetTextSize: function(event, value, nofocus) {
		if(nofocus == undefined) {
			nofocus = false;
		}
		EditorRemoveTextProperty("font", "size");
		EditorRemoveTextProperty("small", "");
		EditorRemoveTextProperty("big", "");
		try {
			if (!gAtomService) {
				GetAtomService();
			}
			var propAtom = gAtomService.getAtom('font');
			GetCurrentEditor().setInlineProperty(propAtom, 'style', 'font-size:'+value+'px');
			if ("gContentWindow" in window && nofocus != true) {
				window.gContentWindow.focus();
			}
		} catch(e) {}
		composeExtraFormat.setTextSizeList(value);
	},
	
	enableMenuBar: function() {
		var menubar = document.getElementById("mail-menubar");
		for (var i = 0; i < menubar.childNodes.length; ++i)
			menubar.childNodes[i].setAttribute("disabled", false);
	},

	setColorDoubleClick: function(item, event) {
		var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService)
			.getBranch("extensions.compose-font-size.colors.");
		var textColorId = item.getAttribute("textcolor");
		EditorSetTextProperty("font", "color", prefs.getCharPref(textColorId));
		goUpdateCommandState("cmd_fontColor");

		var backgroundColorId = item.getAttribute("backgroundcolor");
		var editor = GetCurrentEditor();
		editor.setBackgroundColor(prefs.getCharPref(backgroundColorId));
		goUpdateCommandState("cmd_backgroundColor");
	},

	setColor: function(item, event, colorType) {
		if (item.hasAttribute('disabled') && item.getAttribute('disabled') == 'true') {
			return;
		}
		var prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService)
			.getBranch("extensions.compose-font-size.colors.");
		var nodeId = item.id;
		if(event.button == 0) {
			if(colorType == 'Text') {
				EditorSetTextProperty("font", "color", prefs.getCharPref(nodeId));
				goUpdateCommandState("cmd_fontColor");
			} else {
				var editor = GetCurrentEditor();
				editor.setBackgroundColor(prefs.getCharPref(nodeId));
				goUpdateCommandState("cmd_backgroundColor");
			}
		} else if(event.button == 2) {
			event.preventDefault();
			event.stopPropagation();

			gColorObj.Type = colorType;
			gColorObj.NoDefault = false;
			if(colorType == 'Text') {
				gColorObj.TextColor = prefs.getCharPref(nodeId);
				gColorObj.LastTextColor = prefs.getCharPref(nodeId);
			} else {
				/* to do, we really need to handel tables here */
				gColorObj.Type = "TableOrCell";
				gColorObj.BackgroundColor = prefs.getCharPref(nodeId);
				gColorObj.LastBackgroundColor = prefs.getCharPref(nodeId);
			}
			window.openDialog("chrome://editor/content/EdColorPicker.xul", "_blank", "chrome,close,titlebar,modal", "", gColorObj);
			if (gColorObj.Cancel) {
				return;
			}
			if(colorType == 'Text') {
				if (gColorObj.TextColor) {
					EditorSetTextProperty("font", "color", gColorObj.TextColor);
					prefs.setCharPref(nodeId, gColorObj.TextColor);
				} else {
					EditorRemoveTextProperty("font", "color");
				}
				goUpdateCommandState("cmd_fontColor");
			} else {
				if(gColorObj.BackgroundColor) {
					var editor = GetCurrentEditor();
					editor.beginTransaction();
					try {
						editor.setBackgroundColor(gColorObj.BackgroundColor);
						prefs.setCharPref(nodeId, gColorObj.BackgroundColor);
						goUpdateCommandState("cmd_backgroundColor");
					} catch(e) {}
					editor.endTransaction();
				}
			}
		}
	},

	highlight: function(event) {
		var color = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch)
			.getCharPref('extensions.compose-font-size.highlight');
		EditorSetTextProperty("font", "bgcolor", color);
	},

	highlightPanelShowing: function(event) {
		/*var color = Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch)
			.getCharPref('extensions.compose-font-size.highlight');
		var colorpicker = document.getElementById('eft-hightlight-picker');
		colorpicker.color = color;*/
	},

	highlightCurrentColor: function(colorpicker, event) {
		var color = colorpicker.color;
		Cc['@mozilla.org/preferences-service;1'].getService(Ci.nsIPrefBranch)
			.setCharPref('extensions.compose-font-size.highlight', color);
		EditorSetTextProperty("font", "bgcolor", color);
		colorpicker.parentNode.parentNode.hidePopup();
	},

	removeHighlight: function(item, event) {
		/*var editor = document.getElementById("content-frame");
		var htmlEditor = editor.getHTMLEditor(editor.contentWindow);
		alert(htmlEditor.getSelectionContainer());
		var mix = {value: false};
		alert(htmlEditor.getHighlightColorState(mix));*/
		EditorSetTextProperty("font", "bgcolor", "transparent");
		EditorRemoveTextProperty('font', 'bgcolor');
	}
};

function ExtraFormatSettingWatcher(pref, func) {
	this.prefs = Cc["@mozilla.org/preferences-service;1"]
		.getService(Ci.nsIPrefService).getBranch(pref);
	this.prefs.QueryInterface(Ci.nsIPrefBranch2);
	this.pref = pref;
	this.func = func;

	this.startup = function() {
		this.prefs.addObserver("", this, false);
	};

	this.shutdown = function() {
		this.prefs.removeObserver("", this);
	};

	this.observe = function(subject, topic, data) {
		if (topic != "nsPref:changed") {
			return;
		}
		try {
			this.func(subject, topic, data);
		} catch(e) {} // button might not exist
	};
}

window.addEventListener("load", composeExtraFormat.init, false);
