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

				var specialPassageList = ["StoryTitle", "StoryIncludes", "StoryColophon",
																	"StoryAuthor", "StorySubtitle", "StoryMenu", "StorySettings",
																	"StoryBanner", "StoryCaption", "StoryInit", "StoryShare", 
																	"PassageDone", "PassageFooter", "PassageHeader", "PassageReady",
																	"MenuOptions", "MenuShare"];

				if (document.getElementsByTagName('tw-storydata').length > 0) {
					el = document.querySelector('tw-storydata');
					twVersion = 2;
					selectorPassages = 'tw-passagedata';
					passageTitleAttr = 'name';
					selectorColophon = 'tw-passagedata[name=StoryColophon]';
				} else {
					el = document.querySelector('#storeArea');
					twVersion = 1;
					selectorPassages = '*[tiddler]';
					passageTitleAttr = 'tiddler';
					selectorColophon = 'div[tiddler=StoryColophon]';
				}

				var startPassageTitle = twVersion == 2 ? el.querySelector('tw-passagedata[pid="' + el.getAttribute('startnode') + '"]').getAttribute(passageTitleAttr) : 'Start';

				if (el) {
					buffer.push(this.buildTitlePage(twVersion, el, startPassageTitle));
				}

				var passages = document.querySelectorAll(selectorPassages);
				for (var i = 0; i < passages.length; ++i) {
					var name = passages[i].getAttribute(passageTitleAttr);
					if (!name)
						name = "Untitled Passage";

					if (specialPassageList.indexOf(name) > -1)
						continue;

					var content = passages[i].textContent;

					buffer.push(this.buildPassage(name, content));
				}
				
				if (el.querySelector(selectorColophon)) {
					var coloContent = el.querySelector(selectorColophon).textContent + "\r\n\r\n[Restart][" + startPassageTitle + "]\r\n\r\n";
					buffer.push(this.buildPassage("Colophon", coloContent));
				}

				return buffer.join('');
			},

			
			buildTitlePage: function(twVersion, el, startPassageTitle) {
				var selector = twVersion == 2 ? 'tw-passagedata[name=Story' : 'div[tiddler=Story';

				var title = twVersion == 2 ? el.getAttribute('name') : (el.querySelector(selector + "Title]") ? el.querySelector(selector + "Title]").textContent : "Untitled Story");

				var subtitle = el.querySelector(selector + "Subtitle]") ? el.querySelector(selector + "Subtitle]").innerHTML : "";
				var author = el.querySelector(selector + "Author]") ? el.querySelector(selector + "Author]").textContent: "";

				var colophonLink = el.querySelector(selector + "Colophon]") ? '[Colophon]\r\n\r\n' : "";
				
				var titlePage = (subtitle ? "*" + subtitle + "* \r\n\r\n" : "") + '[' + startPassageTitle + ']\r\n\r\n' + colophonLink;

				return this.buildTitle(title,author,titlePage);
			},


			buildPassage: function(title, content) {
				var result = [];
				
				result.push("## ",title);
				result.push("\r\n\r\n", this.scrub(content),"\r\n\r\n");
				
				return result.join('');
			},


			buildTitle: function(title, author, content) {
				var result = [];
				
				result.push("% ", title, "\r\n\r\n");
				if (author)
					result.push("% ", author, "\r\n\r\n");
				result.push("\r\n\r\n", this.scrub(content),"\r\n\r\n");
				
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
					content = content.replace(/\\n\\n/gm, "\r\n\r\n");
					content = this.markdownLinks(content);
				}
				return content;
			}

		};			
	}
	
	window.PrePub.convert();
};
