window.onload = function() {
	if (typeof(window.PrePub) == "undefined") {

		window.PrePub = {

			convert: function() {
				var output = this.export();

				var blob = new Blob([output], {type: "text/markdown;charset=utf-8"});
				saveAs(blob, "prepub" + Date.now() + ".md");
			},

			
			export: function() {
				var buffer = [];

				//Find the story and infer the Twine version.

				var el, twVersion, selectorAuthor, selectorCSS, selectorScript, 
						selectorSubtitle, selectorPassages, passageTitleAttr;

				if (document.getElementsByTagName('tw-storydata').length > 0) {
					el = document.querySelector('tw-storydata');
					twVersion = 2;
					selectorAuthor = 'tw-passagedata[name=StoryAuthor]';
					selectorCSS = '*[type="text/twine-css"]';
					selectorScript = '*[type="text/twine-javascript"]';
					selectorSubtitle = 'tw-passagedata[name=StorySubtitle]';
					selectorPassages = 'tw-passagedata';
					passageTitleAttr = 'name';
				} else {
					el = document.querySelector('#storeArea');
					twVersion = 1;
					selectorAuthor = 'div[tiddler=StoryAuthor]';
					selectorCSS = '*[tags*="stylesheet"]';
					selectorScript = '*[tags*="script"]';
					selectorSubtitle = 'div[tiddler=StorySubtitle]';
					selectorPassages = '*[tiddler]';
					passageTitleAttr = 'tiddler';
				}

				var title = twVersion == 2 ? el.getAttribute('name') : (el.querySelector("div[tiddler=StoryTitle]") ? el.querySelector("div[tiddler=StoryTitle]").textContent : "Untitled Story");
				var subtitle = el.querySelector(selectorSubtitle) ? el.querySelector(selectorSubtitle).innerHTML : "";
				var author = el.querySelector(selectorAuthor) ? el.querySelector(selectorAuthor).textContent: "";

				var startPassageTitle = twVersion == 2 ? el.querySelector('tw-passagedata[pid="' + el.getAttribute('startnode') + '"]').getAttribute(passageTitleAttr) : 'Start';

				if (el) {
					var titlePage = (subtitle ? "*" + subtitle + "* \n\n" : "") + (author ? "by " + author + "\n\n" : "") + '[' + startPassageTitle + ']';
					buffer.push(this.buildPassage(title,titlePage));
				}

				var passages = document.querySelectorAll(selectorPassages);
				for (var i = 0; i < passages.length; ++i) {
					var name = passages[i].getAttribute(passageTitleAttr);
					if (!name) {
						name = "Untitled Passage";
					}
					var content = passages[i].textContent;

					buffer.push(this.buildPassage(name, content));
				}

				return buffer.join('');
			},

			
			buildPassage: function(title, content) {
				var result = [];
				
				result.push("## ",title);
				result.push("\r\n", this.scrub(content),"\r\n\r\n");
				
				return result.join('');
			},


			markdownLinks: function(content) {
				var result = content.replace(/\[\[(.*?)\]\]/g, function(match, target) {
					var display;
					var barIndex = target.indexOf('|');
					
					if (barIndex != -1) {
						display = target.substr(0, barIndex);
						target = target.substr(barIndex + 1);
					} else {

						var rightArrIndex = target.indexOf('->');
						
						if (rightArrIndex != -1) {
							display = target.substr(0, rightArrIndex);
							target = target.substr(rightArrIndex + 2);
						} else {
							
							var leftArrIndex = target.indexOf('<-');
							
							if (leftArrIndex != -1) {
								display = target.substr(leftArrIndex + 2);
								target = target.substr(0, leftArrIndex);
							}
						}
					}
					if (display)
						return '[' + display + '][' + target + ']';
					else
						return '[' + target + ']';
				});
				return result;
			},

			
			scrub: function(content) {
				if (content) {
					content = content.replace(/^##/gm, " ##");
					content = content.replace(/\\</gm, "&lt;");
					content = content.replace(/\\>/gm, "&gt;");
					content = this.markdownLinks(content);
				}
				return content;
			}

		};			
	}
	
	window.PrePub.convert();
};
