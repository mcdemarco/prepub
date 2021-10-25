window.onload = function() {
	if (typeof(window.PrePub) == "undefined") {

		window.PrePub = {

			convert: function() {
				var output = this.export();

				var blob = new Blob([output], {type: "text/markdown;charset=utf-8"});
				saveAs(blob, "prepub" + Date.now() + ".md");
			},
	
			detwiddle: function() {
				var disable = !(document.getElementById("tw2md")).checked;

				var radios = document.querySelectorAll("[name=source]");
				radios.forEach(function(currentElt) {
					currentElt.disabled = disable;
				});
			},
	
			export: function() {
				var buffer = [];
				var tw2md = document.getElementById("tw2md").checked;

				//Find the story and infer the Twine version.

				var el, twVersion, selectorAuthor, selectorCSS, selectorScript, 
						selectorSubtitle, selectorPassages, passageTitleAttr, passageIdAttr, startPassageId;

				var specialPassageList = ["StoryTitle", "StoryIncludes", "StoryColophon", "StoryData",
																	"StoryAuthor", "StorySubtitle", "StoryMenu", "StorySettings",
																	"StoryBanner", "StoryCaption", "StoryInit", "StoryShare", 
																	"PassageDone", "PassageFooter", "PassageHeader", "PassageReady",
																	"MenuOptions", "MenuShare", "DotGraphSettings"];

				if (document.getElementsByTagName('tw-storydata').length > 0) {
					el = document.querySelector('tw-storydata');
					twVersion = 2;
					selectorPassages = 'tw-passagedata';
					passageTitleAttr = 'name';
					passageIdAttr = 'pid';
					startPassageId = el.getAttribute('startnode');
					selectorColophon = 'tw-passagedata[name=StoryColophon]';
				} else {
					el = document.querySelector('#storeArea');
					twVersion = 1;
					selectorPassages = '*[tiddler]';
					passageTitleAttr = 'tiddler';
					selectorColophon = 'div[tiddler=StoryColophon]';
				}

				var startPassageTitle = twVersion == 2 ? el.querySelector('tw-passagedata[pid="' + startPassageId + '"]').getAttribute(passageTitleAttr) : 'Start';

				if (el) {
					buffer.push(this.buildTitlePage(twVersion, el, startPassageTitle));
				}

				var passages = document.querySelectorAll(selectorPassages);
				var startIdx = 0;

				//create reordering array
				var reorderedPassages = [];

				for (var i = 0; i < passages.length; ++i) {
					var name = passages[i].getAttribute(passageTitleAttr) ? passages[i].getAttribute(passageTitleAttr) : "Untitled Passage";

					if (specialPassageList.indexOf(name) > -1) {
						continue;
					}

					if ((twVersion == 1 && name == "Start") || (twVersion == 2 && passages[i].getAttribute(passageIdAttr) == startPassageId))
						startIdx = reorderedPassages.length;

					var content = passages[i].textContent;

					reorderedPassages.push({name: name, content: content});
				}

				//Remove start passage from list.
				var start = reorderedPassages.splice(startIdx,1);

				if (document.getElementById("shuffle").checked) {
					//Shuffle the others.
					var r, s, temp;
					for (s = reorderedPassages.length - 1; s > 0; s--) {
						r = Math.floor(Math.random() * (s + 1));
						temp = reorderedPassages[s];
						reorderedPassages[s] = reorderedPassages[r];
						reorderedPassages[r] = temp;
					}
				}

				//Reinsert start at beginning.
				reorderedPassages = start.concat(reorderedPassages);

				//Check numbering scheme.
				var numbering = document.querySelector("input[name=numbering]:checked").value;
				
				for (var j = 0; j < reorderedPassages.length; j++) {
					buffer.push(this.buildPassage(reorderedPassages[j], numbering, j+1));
				}
				
				if (el.querySelector(selectorColophon)) {
					var coloContent = el.querySelector(selectorColophon).textContent + "\n\n[Restart][" + startPassageTitle + "]\n\n";
					buffer.push(this.buildPassage({name: "Colophon", content: coloContent},numbering, "Colophon"));
				}

				return buffer.join('');
			},

			
			buildTitlePage: function(twVersion, el, startPassageTitle) {
				var selector = twVersion == 2 ? 'tw-passagedata[name=Story' : 'div[tiddler=Story';

				var title = twVersion == 2 ? el.getAttribute('name') : (el.querySelector(selector + "Title]") ? el.querySelector(selector + "Title]").textContent : "Untitled Story");
				var subtitle = el.querySelector(selector + "Subtitle]") ? el.querySelector(selector + "Subtitle]").innerHTML : "";
				var author = el.querySelector(selector + "Author]") ? el.querySelector(selector + "Author]").textContent: "";
				//Should replace this with a configurable preface section.
				var colophonLink = ""; //el.querySelector(selector + "Colophon]") ? '[Colophon]\n\n' : "";
				
				var yaml = this.buildYaml(title,subtitle,author);

				return yaml + this.scrub(colophonLink) + "\n\n";
			},


			buildPassage: function(passageObj, numbering, number) {
				var result = [];

				result.push("## ", passageObj.name);
				if (numbering != "names")
					 result.push(" {.prepub_hidden}"); 
	
				if (numbering == "numbers")
					result.push("\n### ", number);
				else if (numbering == "symbol")
					result.push("\n### ", document.querySelector("#symbolInput").value);
				else if (numbering == "image")
					result.push("\n### ", "![divider image](" + document.querySelector("#symbolInput").value + ")");

				result.push("\n\n", this.scrub(passageObj.content), "\n\n");
				
				return result.join('');
			},


			buildYaml: function(title, subtitle, author) {
				var result = [];

				//yaml header
				result.push("---","\n");
				result.push("title: ", title, "\n");

				if (subtitle) {
					result.push("subtitle: ", subtitle, "\n");
				}
				if (author) {
					result.push("author: ", author, "\n");
				}

				result.push("---\n\n");
				
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
					content = content.replace(/\\n\\n/gm, "\n\n");
					content = this.markdownLinks(content);
/*
					if (tw2md) {
						//tiddlymiki styles to pandoc markdown.  
						//Simple common ones:
						content = content.replace(/\/\//gm, "*"); //italic
						content = content.replace(/''/gm, "**"); //bold
						content = content.replace(/\^\^/gm, "^"); //superscripts
						//Simple sugarcube and twine 1 conversions:
						content = content.replace(/({{{)|(}}})/gm, "`"); //preformatting (sugarcube & Twine 1)
						//Complicated conversions:
						content = content.replace(/~~(\S*)~~/gm, "~$1~"); //subscript (harlowe and markdown have no official subscripting but this works in pandoc in restricted situations
						content = content.replace(/==/gm, "~~"); //strikethrough (in sugarcube; harlome is correct)
						content = content.replace(/__(\S*)__/gm, "<span class=\"underline\">$1</span>"); //underline to pandoc (in sugarcube and Twine 1; elsewhere this is alternate emphasis and should be left alone)
					}
*/
				}
				return content;
			}

		};			
	}
	
	window.PrePub.detwiddle();
};
