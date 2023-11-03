var filesaver = require("file-saver");
var prePub = {};

(function(context) {

	var css = "<style>\n" + window.PrePubCSS + "\n</style>";

	var config = {
		numbering: "names",
		symbol: "",
		path: "",
		order: "original",
		rewrite: false,
		rewriteExpression: "",
		source: "markdown",
		gordianbook: false,
		autodownload: false,
		showSettings: true
	};

	var specialPassageList = ["StoryTitle", "StoryIncludes", "StoryColophon", "StoryData",
														"StoryAuthor", "StorySubtitle", "StoryMenu", "StorySettings",
														"StoryBanner", "StoryCaption", "StoryInit", "StoryShare", 
														"PassageDone", "PassageFooter", "PassageHeader", "PassageReady",
														"MenuOptions", "MenuShare", "DotGraphSettings", "PrePubSettings"];

	//control
	//init
  //pandoc
	//settings
	//story

	context.control = (function() {

		return {
			convert: convert,
			downloadMarkdown: downloadMarkdown,
			downloader: downloader
		};

		function convert(toType, download, init) {
			if (!init) {
				context.settings.parseForm();
			}

			//Convert story to pandoc-flavored markdown.
			var output = context.story.convert();
			
			//Postprocess.
			if (toType == 'markdown') {
				if (download) {
					downloader('markdown', output);
				} 
				//We attempt to fill in the preview, and will handle the error if there's no server available.
				context.pandoc.markdown2('html', output);
			} else {
				//Do secondary conversion with server.
				context.pandoc.markdown2(toType, output, download);
			}
		};
	
		function downloadMarkdown() {
				convert('markdown', true);
		};

		function downloader(downloadType, output) {
				var mimeType;
				var extension = "." + downloadType;
				var decode = false;
				switch (downloadType) {
				case 'markdown':
					mimeType = "text/markdown;charset=utf-8";
					extension = ".md";
					break;

				case 'html':
					mimeType = "text/html;charset=utf-8";
					break;

				case 'epub':
					mimeType = "application/epub+zip";
					decode = true;
					break;
				}

				if (decode) {
					//Trick to convert base64 from the server to a binary blob.
					//https://stackoverflow.com/a/36183085

					var url = "data:" + mimeType + ";base64," + output;
					
					fetch(url)
						.then(res => res.blob())
						.then(blob => filesaver.saveAs(blob, "prepub" + Date.now() + extension));

				} else {

					var blob = new Blob([output], {type: mimeType});
					filesaver.saveAs(blob, "prepub" + Date.now() + extension);

				}
		};

	})();

	context.init = (function() {

		return {
			load: load
		};

		function load() {
			//Init function.

			//Load settings.
			context.settings.load();

			//Some form adjustments.
			context.settings.disenable();
			activateForm();

			//Initial conversion of story.
			context.control.convert('markdown', config.autodownload, true);
		};

		//private

		function activateForm() {
			document.getElementById("tw2md").addEventListener('click', context.settings.disenable, false);
			document.getElementById("rewrite").addEventListener('change', context.settings.checkRewrite, false);

			//Not actually part of the settings form.
			document.getElementById("downloadMarkdownButton").addEventListener('click', context.control.downloadMarkdown, false);
			document.getElementById("downloadHtmlButton").addEventListener('click', context.pandoc.downloadHTML, false);
			document.getElementById("downloadEpubButton").addEventListener('click', context.pandoc.downloadEPUB, false);
			document.getElementById("refreshButton").addEventListener('click', context.pandoc.refresh, false);
		};

	})();

	context.pandoc = (function() {

		return {
			downloadHTML: downloadHTML,
			downloadEPUB: downloadEPUB,
			markdown2: markdown2,
			process: process,
			refresh: refresh
		};

			function downloadHTML() {
				context.control.convert('html', true);
			};

			function downloadEPUB() {
				context.control.convert('epub', true);
			};

			function markdown2(toType, mdn, download) {

				const headers = {
					Accept: 'text/plain',
					"Content-Type": 'application/json'
				};
				const params = {
					text: mdn,
					from: "markdown",
					to: toType,
					standalone: true,
					"table-of-contents": false,
					"toc-depth": 1,
					"epub-chapter-level": 2,
					"section-divs": true,
					"variables": {
						"header-includes": css
					}
				};
				const options = {
					headers: headers,
					method: 'POST',
					body: JSON.stringify( params )
				};
				//fetch( './pandoc-server.cgi', options ) //cgi version requires local webserver setup

				//for freestanding server just type ./pandoc-server in the terminal.
				//cors issues fixed in nightly 11/10/22; run 3.0 or higher
				fetch( 'http://localhost:3030/', options )
					.then( response => { 
						if (response.ok) {
							return response.text();
						}
						return Promise.reject(response); 
					})
					.then( text => context.pandoc.process(toType, text, download) )
					.catch( response  => { 
						console.log(response);
					} )
			};

			function process(toType, output, download) {
				//Opened the page with the preview functionality hidden; 
				//here we unhide because we got a response.
				//(Errors will go to the console regardless.)

				//Unhide preview.
				document.querySelectorAll(".prepub-preview-mode").forEach(function(currentElt) {
					currentElt.style.display = "block";
				});

				//Write the html to the frame.
				if (toType == 'html') {
					var ifrm = document.getElementById("theFrame");
					var doc = ifrm.contentWindow || ifrm.contentDocument.document || ifrm.contentDocument;

					//Passing the css to the server isn't working, so write it to the page manually.
					//Does not fix the corresponding epub issue.
					//output = output.replace("</head>", css + "\n" + "</head>");

					doc.document.open();
					doc.document.write(output);
					doc.document.close();
				}

				if (download) {
					context.control.downloader(toType, output);
				}
				return true;
			}

			function refresh() {
				context.control.convert('markdown');
			};

	})();

	context.settings = (function() {

		return {
			checkRewrite: checkRewrite,
			disenable: disenable,
			load: load,
			parseForm: parseForm
		};

		function checkRewrite() {
			if (document.querySelector('#rewrite').checked)
				document.querySelector('#numbers').checked = true;
		};

		function disenable() {
			var disable = !(document.getElementById("tw2md").checked);

			var radios = document.querySelectorAll("[name=source]");
			radios.forEach(function(currentElt) {
				currentElt.disabled = disable;
			});
		};

		function load() {
			read();
			apply();
			show();
		};

		function parseForm(ev) {
			//On conversion events, check for settings form changes and parse into the config.
			config.numbering = document.querySelector("input[name='numbering']:checked") ? document.querySelector("input[name='numbering']:checked").value : "names";
			config.symbol =  document.getElementById("symbol") && document.getElementById("symbol").checked && document.getElementById("symbolInput") ? document.getElementById("symbolInput").value.trim() : "";
			config.path =  document.getElementById("path") && document.getElementById("path").checked && document.getElementById("symbolInput") ? document.getElementById("symbolInput").value.trim() : "";
			config.order = document.querySelector("input[name='passages']:checked") ? document.querySelector("input[name='passages']:checked").value : "original";
			config.rewrite = document.getElementById("rewrite") ? document.getElementById("rewrite").checked : false;
			config.rewriteExpression = document.getElementById("rewriteExpression") ? document.getElementById("rewriteExpression").value : "";
			config.source = document.getElementById("tw2md").checked && document.querySelector("input[name='source']:checked") ? document.querySelector("input[name='source']:checked").value : "markdown";
			config.gordianbook = document.getElementById("gordianbook") ? document.getElementById("gordianbook").checked : false;

			//Also show changes.
			show();
			//Also save changes.
			save();
		}


		//private

		function apply() {
			var key, val;
			//Apply the possibly changed settings from config to the form.
			Object.entries(config).forEach(function(arry, index) {
				key = arry[0];
				val = arry[1];
				
				switch (key) {

				case "numbering":
				case "order":
					document.querySelector("#" + val).checked = true;
					break;

				case "symbol":
				case "path":
					document.querySelector("#symbolInput").value = val;
					break;
					
				case "rewrite":
				case "gordianBook":
				  document.querySelector("#" + key).checked = val;
					break;

				case "rewriteExpression":
					document.querySelector("#" + key).value = val;
					break;

				case "source":
				  if (val == "markdown") {
						document.querySelector("#tw2md").checked = false;
						document.querySelectorAll("[name=source]").checked = false;
					} else {
						document.querySelector("#tw2md").checked = true;
						if (val)
							document.querySelector("#" + val).checked = true;
					}
					break;

				}

			});
		};

		function ifid() {
			return window.document.querySelector('tw-storydata') ? window.document.querySelector('tw-storydata').getAttribute('ifid').toUpperCase() : "";
		};

		function loadFromStorage() {
			//Check local storage for settings.
			var ppSettings;
			try {
				ppSettings = localStorage.getItem("prepub-settings" + (ifid() ? "-" + ifid() : ""));
				if (ppSettings)
					merge(JSON.parse(ppSettings));
					return; 
			} catch(e) {
				console.log("Error checking local storage for previous PrePub settings for this story: " + e.description);
			}
			return;
		};

		function merge(ppSettings) {
			//Incorporate pre-parsed settings object into config object.
			Object.entries(ppSettings).forEach(function(arry, index) {
				config[arry[0]] = arry[1];
			});
		}

		function mergeFromURL(settingsArray) {
			var setting;
			for (var l=0; l<settingsArray.length; l++) {
				setting = settingsArray[l].split("=");
				if (setting.length > 0) {
					config[setting[0]] = setting.length > 1 ? decodeURIComponent(setting[1]) : true;
				}
			}
		};

		function read() {

			var prePubSettings, storySettings, ppSettings;

			//Check story for settings.
			if (window.document.getElementById("storeArea"))
				prePubSettings = window.document.getElementById("storeArea").querySelector('div[tiddler="PrePubSettings"]');
			else 
				prePubSettings = window.document.querySelector('tw-passagedata[name="PrePubSettings"]');
			
			if (prePubSettings) {
				//Doesn't require prepub: label or single-line layout but must still parse as a JSON object.
				ppSettings = prePubSettings.innerText;
			} else {
				//Parse the StorySettings for prepub presets.  Must be a single line.  May fail mysteriously under Tweego 1.3.
				if (window.document.getElementById("storeArea"))
					storySettings = window.document.getElementById("storeArea").querySelector('div[tiddler="StorySettings"]');
				else 
					storySettings = window.document.querySelector('tw-passagedata[name="StorySettings"]');
				
				if (storySettings && storySettings.innerText && storySettings.innerText.indexOf("prepub:") > -1) {
					ppSettings = (storySettings.innerText.split("prepub:")[1]).split("\n")[0];
				}
			}
	
			if (ppSettings) {
				try {
					ppSettings = JSON.parse(ppSettings);
					//Also write to the appropriate textarea.
					document.getElementById("storySettingsTextarea").value = ":: PrePubSettings\r\n\r\n" + JSON.stringify(ppSettings, null, '\t') + "\r\n";
					merge(ppSettings);
				} catch(e) {
					console.log("Found but couldn't parse prepub settings from story: " + ppSettings);
				}
			}

			//Check URL for settings and override.
			if (window.location.search && window.location.search.split("?")[1].length > 0) {
				mergeFromURL(window.location.search.split("?")[1].split("&"));
				return;
			} 


			if (!ppSettings) {
				//If we found no settings, try local storage.
				loadFromStorage();
			}
		};

		function save() {
			//Save settings to local storage. 
			try {
				localStorage.setItem("prepub-settings" + (ifid() ? "-" + ifid() : ""), JSON.stringify(config));
			} catch(e) {
				console.log("Failed to save settings to local storage.");
			}
		};

		function show() {
			//Presence of setting determines presence of element.
			if (config.showSettings) {
				document.getElementById("settingsDisplayDiv").style.display = "block";
				document.getElementById("settingsTextarea").value = ":: PrePubSettings\r\n\r\n" + JSON.stringify(config, null, '\t') + "\r\n";
			}
		};

	})();

	context.story = (function() {

		return {
			convert: convert
		};

		function convert() {
				var buffer = [];

				//Find the story and infer the Twine version.

				var el, twVersion, selectorAuthor, selectorCSS, selectorScript, selectorSubtitle, selectorPassages, 
						selectorColophon, passageTitleAttr, passageIdAttr, startPassageId;

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
					buffer.push(buildTitlePage(twVersion, el, startPassageTitle));
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

				if (config.order === "shuffle") {
					//Shuffle the others.
					var r, s, temp;
					for (s = reorderedPassages.length - 1; s > 0; s--) {
						r = Math.floor(Math.random() * (s + 1));
						temp = reorderedPassages[s];
						reorderedPassages[s] = reorderedPassages[r];
						reorderedPassages[r] = temp;
					}
				} else if (config.order === "alphanum") {
					//Sort the others.
					reorderedPassages = reorderedPassages.sort(
						function(a,b) {
							return a.name.localeCompare(b.name,undefined,{sensitivity:"base",numeric:true});
						})
					;
				}

				//Reinsert start at beginning.
				reorderedPassages = start.concat(reorderedPassages);

				//Check numbering scheme.
				var numbering = config.numbering;
				var rewriteLinks = config.rewrite;
				var rewriteHash, j;

				if (rewriteLinks) {
					rewriteHash = {};
					for (j = 0; j < reorderedPassages.length; j++) {
						rewriteHash[(reorderedPassages[j]).name] = j+1; 
					}
				}

				for (j = 0; j < reorderedPassages.length; j++) {
					buffer.push(buildPassage(reorderedPassages[j], numbering, j+1, rewriteHash));
				}

				if (el.querySelector(selectorColophon)) {
					var coloContent = el.querySelector(selectorColophon).textContent + "\n\n[Restart][" + startPassageTitle + "]\n\n";
					buffer.push(buildPassage({name: "Colophon", content: coloContent},numbering, "Colophon"));
				}

				return buffer.join('');
		};

		//private
			
			function buildTitlePage(twVersion, el, startPassageTitle) {
				var selector = twVersion == 2 ? 'tw-passagedata[name=Story' : 'div[tiddler=Story';

				var title = twVersion == 2 ? el.getAttribute('name') : (el.querySelector(selector + "Title]") ? el.querySelector(selector + "Title]").textContent : "Untitled Story");
				var subtitle = el.querySelector(selector + "Subtitle]") ? el.querySelector(selector + "Subtitle]").innerHTML : "";
				var author = el.querySelector(selector + "Author]") ? el.querySelector(selector + "Author]").textContent: "";
				//Should replace this with a configurable preface section.
				var colophonLink = ""; //el.querySelector(selector + "Colophon]") ? '[Colophon]\n\n' : "";
				
				var yaml = buildYaml(title,subtitle,author);

				return yaml + scrub(colophonLink) + "\n\n";
			};

			function buildPassage(passageObj, numbering, number, rewriteHash) {
				var result = [];

				result.push("## ", passageObj.name);
				if (numbering != "names")
					 result.push(" {.prepub_hidden}");
	
				if (numbering == "numbers")
					result.push("\n### ", number);
				else if (numbering == "symbol")
					result.push("\n### ", config.symbol, " {.dividerCharacter}");
				else if (numbering == "image")
					result.push("\n### ", "![divider image](" + config.path + ") {.dividerImage}");

				result.push("\n\n", scrub(passageObj.content, rewriteHash), "\n\n");
				
				return result.join('');
			};

			function buildYaml(title, subtitle, author) {
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
			};

			function markdownLinks(content, rewriteHash) {
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

					if (rewriteHash) 
						return rewriter(rewriteHash, display, target);
					else if (display)
						return '[' + display + '][' + target + ']';
					else
						return '[' + target + ']';
				});
				return result;
			};

		function rewriter(rewriteHash, display, target) {
			return config.rewriteExpression.replace("@@@", display ? display : target).replace("###", rewriteHash[target]).replace("]", "][" + target + "]");
		}

			function scrub(content, rewriteHash) {
				if (content) {
					var twSource, gordianbook;
					if (config.source != "markdown") {
						if (!config.source) {
							twSource = config.source ? config.source : "harlowe";
						}
						gordianbook = config.gordianbook;
					}

					if (twSource == "chapbook") {
						//handle chapbook forks here
						content = content.replace(/((^>\s?\[\[[^\]]+\]\]\s*$\n)*(^>\s?\[\[[^\]]+\]\]\s*$))/gm, "\n::::{.fork}\n$1\n::::\n\n"); //fenced div for styling
						content = content.replace(/^>\s?\[\[([^\]]+)\]\]\s*$/gm, "* [[$1]]"); //fork links to ul
					}

					content = content.replace(/\\</gm, "&lt;");
					content = content.replace(/\\>/gm, "&gt;");
					content = content.replace(/\\n\\n/gm, "\n\n");
					content = markdownLinks(content, rewriteHash);
					if (twSource && twSource != "markdown") {
						content = detwiddle(content, twSource, gordianbook);
					}
				}
				return content;
			};

			function detwiddle(content, twSource, gordianbook) {
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

				if (twSource == "harlowe" || twSource == "writingfantasy") {
					//Harlowe permits, and even encourages, problematic headers.
					content = content.replace(/^(\s)*(#{1,6})([^#].*)$/gm, "\n$2 $3\n\n");
				}

				if (twSource == "sugarcube" || twSource == "twine1" || gordianbook || twSource == "writingfantasy") {
					//harlowe and markdown have no official underline, but the output here works in pandoc in restricted situations
				  //note in markdown/harlowe this is alternate emphasis and should be left alone
					//in WritingFantasy, this is a single exception to Harlowe markup.
					content = content.replace(/__([^_]+?)__/gm, "<span class=\"underline\">$1</span>"); //underline to pandoc
				}

				if (twSource == "sugarcube" || twSource == "twine1" || gordianbook) {
					//harlowe and markdown have no official subscripting (and this symbol is for strikethrough)
					content = content.replace(/~~([^~]+?)~~/gm, "~$1~"); //subscript to pandoc

					//ordered lists.
					content = content.replace(/^# (\w)/gm, "1. $1");
					//Gordianbook has nested sublists double-marked like harlowe's,
					//although with a second option for #(#)'s for ordered lists like sugarcube's.
				}

				//Strikethroughs
				if (twSource == "sugarcube" || twSource == "twine1") {
					content = content.replace(/==/gm, "~~");
				} else if (twSource == "gordianbook") {
					//Has its own unique strikethrough; real strikethrough is used for subscripts as in sugarcube.
					content = content.replace(/\-\-([^\-]+?)\-\-/gm, "~~$1~~"); 
				}

				if (twSource == "sugarcube" || twSource == "twine1") {
					//headers
					content = content.replace(/^!!!!!!(\w)/gm, "###### $1");
					content = content.replace(/^!!!!!(\w)/gm, "##### $1");
					content = content.replace(/^!!!!(\w)/gm, "#### $1");
					content = content.replace(/^!!!(\w)/gm, "### $1");
					content = content.replace(/^!!(\w)/gm, "## $1");
					content = content.replace(/^!(\w)/gm, "# $1");
				} else if (twSource == "gordianbook") {
					//Gordonbook downgrades the existing header levels, regardless of header type.
					//Name the markdown ones away so they don't get munged in the reduction.
					content = content.replace(/^####(\w)/gm, "!!!!$1");
					content = content.replace(/^###(\w)/gm, "!!!$1");
					//These two conflict with lists, so skip them for now:
					//content = content.replace(/^##(\w)/gm, "!!$1");
					//content = content.replace(/^#(\w)/gm, "!$1");
					//Reduce all.
					content = content.replace(/^!!!!(\w)/gm, "###### $1"); //h4 -> h6
					content = content.replace(/^!!!(\w)/gm, "##### $1"); //h3 -> h5
					content = content.replace(/^!!(\w)/gm, "#### $1"); //h2 -> h4
					content = content.replace(/^!(\w)/gm, "### $1"); //h1 -> h3
				}

				if (twSource == "sugarcube" || twSource == "twine1" || twSource == "gordianbook") {
					//Comments to pandoc: 
					content = content.replace(/\/%(.*?)%\//gm, "<!--- $1 -->"); //comment to html comment
					//tw style /% ... %/
					if (twSource == "sugarcube" || twSource == "gordianbook") {
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
				// Harlowe and twine 1 are too forgiving about the structure (spacing) of lists.
				// Harlowe and Gordian Book sublists are funky (double-marked).
				// WritingFantasy describes a less functional use of backticks than in harlowe or markdown; not clear how to deal with that.

				//sources: http://twinery.org/cookbook/twine1/terms/formatting.html
				return content;
			};

		})();
	
})(prePub);

prePub.init.load();
