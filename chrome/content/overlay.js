var composeExtraFormat = {
	init: function() {
		var commandManager = GetCurrentCommandManager();
		commandManager.addCommandObserver(composeExtraFormat, "obs_documentCreated");
		commandManager.addCommandObserver(composeExtraFormat, "cmd_setDocumentModified");
		commandManager.addCommandObserver(composeExtraFormat, "cmd_bold");
		commandManager.addCommandObserver(composeExtraFormat, "obs_documentLocationChanged");
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
		var subButton = document.getElementById('subscriptButton');
		var superButton = document.getElementById('superscriptButton');
		var strikeButton = document.getElementById('strikethroughButton');
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
			node = editor.contentDocument.body;
		}
		if(node.nodeName == '#text'){
			node = node.parentNode;
		}
		return editor.contentWindow.getComputedStyle(node, '');
	},

	setTextSizeList: function(size){
		sizeBox = document.getElementById('FontSize');
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

	SetTextSize: function(value, nofocus) {
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
	}
}

window.addEventListener("load", composeExtraFormat.init, false);
