window.onload = function() {
	if (typeof(window.PrePub) == "undefined") {

		window.PrePub = {

			load: function() {
				//Init function.
				//Decide whether to just activate the UI or also parse settings and autorun.

				if (window.location.search && window.location.search.split("?")[1].length > 0) {
					this.useSettings(window.location.search.split("?")[1].split("&"));
				} else
					this.disenable();

			},

			disenable: function() {
				var disable = !(document.getElementById("tw2md")).checked;

				var radios = document.querySelectorAll("[name=source]");
				radios.forEach(function(currentElt) {
					currentElt.disabled = disable;
				});
			},
	
			useSettings: function(settingsArray) {
				//Parse settings and autodownload.
				var setting;
				for (l=0; l<settingsArray.length; l++) {
					setting = settingsArray[l].split("=");
					if (setting.length > 0) {
						switch (setting[0]) {

						case "numbering":
							if (setting.length > 1) {
								document.querySelector("#" + setting[1]).checked = true;
							}
							break;
						case "symbolInput":
							if (setting.length > 1) {
								document.querySelector("#symbolInput").value = decodeURIComponent(setting[1]);
							}
							break;
						case "shuffle":
  						document.querySelector("#shuffle").checked = true;
							break;
						case "source":
				  		if (setting.length > 1) {
								document.querySelector("#tw2md").checked = true;
								document.querySelector("#" + setting[1]).checked = true;
							}
							break;
						}

					}
				}
				//Autodownload.
				this.convert();
			},
	
			convert: function() {
				var output = this.export();

				var blob = new Blob([output], {type: "text/markdown;charset=utf-8"});
				saveAs(blob, "prepub" + Date.now() + ".md");
			},
	
			export: function() {
				var buffer = [];

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
					result.push("\n### ", document.querySelector("#symbolInput").value, " {.dividerCharacter}");
				else if (numbering == "image")
					result.push("\n### ", "![divider image](" + document.querySelector("#symbolInput").value + ") {.dividerImage}");

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
					var twSource;
					if (document.getElementById("tw2md").checked)
						twSource = document.querySelector("input[name=source]:checked") ? document.querySelector("input[name=source]:checked").value : "harlowe";

					//content = content.replace(/^ ##/gm, "##");  //(old code) Was there a concern about existing headers conflicting with generated headers?
					content = content.replace(/\\</gm, "&lt;");
					content = content.replace(/\\>/gm, "&gt;");
					content = content.replace(/\\n\\n/gm, "\n\n");
					content = this.markdownLinks(content);
					if (twSource) {
						content = this.detwiddle(content, twSource);
					}
				}
				return content;
			},

			detwiddle: function(content, twSource) {
				//convert tiddlymiki styles and other abberations to pandoc markdown.
				//there is adequate agreement that --- is a horizontal rule.

				if (twSource != "chapbook") {
					//Simple common tiddlywiki format.
					content = content.replace(/\/\//gm, "*"); //italic
					content = content.replace(/''/gm, "**"); //bold
					content = content.replace(/\^\^/gm, "^"); //superscripts
				} else {
					//chapbook does one weird thing
					content = content.replace(/~~([^~]+?)~~/gm, "<span class=\"smallcaps\">$1</span>"); //small caps to pandoc
				}

				if (twSource == "harlowe") {
					//Harlowe permits, and even encourages, problematic headers.
					content = content.replace(/^(\s)*(#{1,6})([^#].*)$/gm, "\n$2 $3\n\n");
				}

				if (twSource == "sugarcube" || twSource == "twine1") {
					//harlowe and markdown have no official subscripting (and this symbol is for strikethrough)
					content = content.replace(/~~([^~]+?)~~/gm, "~$1~"); //subscript to pandoc

					content = content.replace(/==/gm, "~~"); //strikethrough

					//harlowe and markdown have no official underline, but the output here works in pandoc in restricted situations
				  //note in markdown/harlowe this is alternate emphasis and should be left alone
					content = content.replace(/__([^_]+?)__/gm, "<span class=\"underline\">$1</span>"); //underline to pandoc

					//ordered lists.
					content = content.replace(/^# (\w)/gm, "1. $1");

					//headers
					content = content.replace(/^!!!!!!(\w)/gm, "###### $1");
					content = content.replace(/^!!!!!(\w)/gm, "##### $1");
					content = content.replace(/^!!!!(\w)/gm, "#### $1");
					content = content.replace(/^!!!(\w)/gm, "### $1");
					content = content.replace(/^!!(\w)/gm, "## $1");
					content = content.replace(/^!(\w)/gm, "# $1");

					//Comments to pandoc: 
					content = content.replace(/\/%(.*?)%\//gm, "<!--- $1 -->"); //comment to html comment
					//tw style /% ... %/
					if (twSource == "sugarcube") {
						// c-style /* ... */ 
						content = content.replace(/\/\*(.*?)\*\//gm, "<!--- $1 -->"); //comment to html comment
					}
					// sugarcube and harlowe permit html-style comments, which can just be left in place.  Twine 1 probably didn't?

					//Escaping (mostly TODO, but at least verbatim some of it)
					//sugarcube/twine 1: 
					content = content.replace(/({{{)|(}}})/gm, "```"); //preformatting
					if (twSource == "sugarcube") {
						//sugarcube distinguishes between code block and verbatim mode, though it's not clear how exactly.  Reduce verbatim to code:
						content = content.replace(/\"\"\"/gm, "`"); //verbatim
					}
				}

				//Could convert more complicated stuff that is generally listed as "styling".  E.g.,
				// Sugarcube escaped line breaks, line continuation, and custom styles (styles would require bracketed spans in pandoc)
				// Harlowe and twine 1 are too forgiving about the structure (spacing) of lists, and Harlowe sublists are funky (double-marked).

				//sources: http://twinery.org/cookbook/twine1/terms/formatting.html
				return content;
			}

		};			
	}
	
	window.PrePub.load();
};
