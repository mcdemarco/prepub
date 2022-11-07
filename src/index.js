var filesaver = require("file-saver");
var prePub = {};

(function(context) {

	var css = "<style>\nbody { margin: 5%; text-align: justify; font-size: medium; }\ncode { font-family: monospace; }\nh1 { text-align: left; }\nh2 { text-align: left; }\nh3 { text-align: center; }\nh3.dividerCharacter { font-size: larger; }\nh3.dividerImage img { width: 66%; }\nh4 { text-align: left; }\nh5 { text-align: left; }\nh6 { text-align: left; }\nh1.title { }\nh2.author { }\nh3.date { }\nol.toc { padding: 0; margin-left: 1em; }\nol.toc li { list-style-type: none; margin: 0; padding: 0; }\na.footnoteRef { vertical-align: super; }\nem, em em em, em em em em em { font-style: italic;}\nem em, em em em em { font-style: normal; }\n.prepub_hidden h2, h2.prepub_hidden { position: absolute; visibility: hidden; }\ndiv.fork ul { list-style-type: none; margin: 0; padding: 0; }\ndiv.fork ul li { text-align:center; padding: 0.5em; }\nh1, h2, h3 { page-break-after: avoid; break-after: avoid-page; }\nul { page-break-inside: avoid; break-inside: avoid-page; }\np { widows: 2; orphans: 2; }\n.level2 { break-before: left; }\n.level2, header { padding-bottom: 3em; } \nbody { padding-bottom: 80%; }\n</style>";

	//init
	//settings
	//story

	context.init = (function() {

		return {
			load: load
		};

		function load() {
			//Init function.
			//Decide whether to just activate the UI or also parse settings and autorun.

			if (window.location.search && window.location.search.split("?")[1].length > 0) {
				context.settings.useSettings(window.location.search.split("?")[1].split("&"));
			} else {
				context.settings.disenable();
				context.story.convert('markdown');
			}
			
			activateForm();
		};

	
		//private

		function activateForm() {
			document.getElementById("tw2md").addEventListener('click', context.settings.disenable, false);
			document.getElementById("rewrite").addEventListener('change', context.settings.checkRewrite, false);

			//Not actually part of the settings form.
			document.getElementById("downloadMarkdownButton").addEventListener('click', context.story.downloadMarkdown, false);
			document.getElementById("downloadHtmlButton").addEventListener('click', context.story.downloadHTML, false);
			document.getElementById("downloadEpubButton").addEventListener('click', context.story.downloadEPUB, false);
			document.getElementById("refreshButton").addEventListener('click', context.story.refresh, false);
		};

	})();

	context.settings = (function() {

		return {
			checkRewrite: checkRewrite,
			disenable: disenable,
			useSettings: useSettings
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

			function useSettings(settingsArray) {
				//Parse settings and autodownload.
				var setting;
				for (var l=0; l<settingsArray.length; l++) {
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
							if (document.querySelector("#shuffle"))
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
				context.story.download('markdown');
			};

	})();

	context.story = (function() {

		return {
			convert: convert,
			download: download,
			downloadMarkdown: downloadMarkdown,
			downloadHTML: downloadHTML,
			downloadEPUB: downloadEPUB,
			downloader: downloader,
			exporter: exporter,
			buildTitlePage: buildTitlePage,
			buildPassage: buildPassage,
			buildYaml: buildYaml,
			markdownLinks: markdownLinks,
			refresh: refresh,
			scrub: scrub,
			detwiddle: detwiddle,
			markdown2: markdown2,
			process: process
		};

			function convert(toType, download) {

				var output = exporter();

				if (toType == 'markdown') {
					markdown2('html', output);
					if (download) {
						context.story.downloader('markdown', output);
					} 
				} else
					context.story.markdown2(toType, output, download);
			};
	
			function download(downloadType) {
				context.story.convert(downloadType, true);
			};
			function downloadMarkdown() {
				context.story.download('markdown');
			};
			function downloadHTML() {
				context.story.download('html');
			};
			function downloadEPUB() {
				context.story.download('epub');
			};

			function refresh() {
				context.story.convert('markdown');
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

			function exporter() {
				var buffer = [];

				//Find the story and infer the Twine version.

				var el, twVersion, selectorAuthor, selectorCSS, selectorScript, selectorSubtitle, selectorPassages, 
						selectorColophon, passageTitleAttr, passageIdAttr, startPassageId;

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
					buffer.push(context.story.buildTitlePage(twVersion, el, startPassageTitle));
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
				var rewriteLinks = document.getElementById("rewrite").checked;
				var rewriteHash, j;

				if (rewriteLinks) {
					rewriteHash = {};
					for (j = 0; j < reorderedPassages.length; j++) {
						rewriteHash[(reorderedPassages[j]).name] = j+1; 
					}
				}

				for (j = 0; j < reorderedPassages.length; j++) {
					buffer.push(context.story.buildPassage(reorderedPassages[j], numbering, j+1, rewriteHash));
				}

				if (el.querySelector(selectorColophon)) {
					var coloContent = el.querySelector(selectorColophon).textContent + "\n\n[Restart][" + startPassageTitle + "]\n\n";
					buffer.push(context.story.buildPassage({name: "Colophon", content: coloContent},numbering, "Colophon"));
				}

				return buffer.join('');
			};
			
			function buildTitlePage(twVersion, el, startPassageTitle) {
				var selector = twVersion == 2 ? 'tw-passagedata[name=Story' : 'div[tiddler=Story';

				var title = twVersion == 2 ? el.getAttribute('name') : (el.querySelector(selector + "Title]") ? el.querySelector(selector + "Title]").textContent : "Untitled Story");
				var subtitle = el.querySelector(selector + "Subtitle]") ? el.querySelector(selector + "Subtitle]").innerHTML : "";
				var author = el.querySelector(selector + "Author]") ? el.querySelector(selector + "Author]").textContent: "";
				//Should replace this with a configurable preface section.
				var colophonLink = ""; //el.querySelector(selector + "Colophon]") ? '[Colophon]\n\n' : "";
				
				var yaml = context.story.buildYaml(title,subtitle,author);

				return yaml + context.story.scrub(colophonLink) + "\n\n";
			};

			function buildPassage(passageObj, numbering, number, rewriteHash) {
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

				result.push("\n\n", context.story.scrub(passageObj.content, rewriteHash), "\n\n");
				
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
						return rewritePrefix.value + (display ? display : target) + rewritePostfix.value + ' [' + rewriteHash[target] + '][' + target + ']' + ".";
					else if (display)
						return '[' + display + '][' + target + ']';
					else
						return '[' + target + ']';
				});
				return result;
			};

			function scrub(content, rewriteHash) {
				if (content) {
					var twSource, gordianbook;
					if (document.getElementById("tw2md").checked) {
						twSource = document.querySelector("input[name=source]:checked") ? document.querySelector("input[name=source]:checked").value : "harlowe";
						gordianbook = document.querySelector("#gordianbook").checked;
					}

					if (twSource == "chapbook") {
						//handle chapbook forks here
						content = content.replace(/((^>\s?\[\[[^\]]+\]\]\s*$\n)*(^>\s?\[\[[^\]]+\]\]\s*$))/gm, "\n::::{.fork}\n$1\n::::\n\n"); //fenced div for styling
						content = content.replace(/^>\s?\[\[([^\]]+)\]\]\s*$/gm, "* [[$1]]"); //fork links to ul
					}

					content = content.replace(/\\</gm, "&lt;");
					content = content.replace(/\\>/gm, "&gt;");
					content = content.replace(/\\n\\n/gm, "\n\n");
					content = context.story.markdownLinks(content, rewriteHash);
					if (twSource) {
						content = context.story.detwiddle(content, twSource, gordianbook);
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
					"section-divs": true
				};
				/* It seems that file inclusion should work for css but only works with images.
					 Also tried the older flag "stylesheet".
				*/
				const options = {
					headers: headers,
					method: 'POST',
					body: JSON.stringify( params )
				};
				//fetch( 'http://localhost:3030/', options ) //cors issues up the wazoo
				fetch( './pandoc-server.cgi', options )
					.then( response => { 
						if (response.ok) {
							return response.text();
						}
						return Promise.reject(response); 
					})
					.then( text => context.story.process(toType, text, download) )
					.catch( response  => { 
						console.log(response);
					} )
			};

			function process(toType, output, download) {
				//Open the page with the preview functionality hidden, then unhide if we got a response.
				//(Errors will go to the console regardless.)

				document.querySelectorAll(".prepub-preview-mode").forEach(function(currentElt) {
					currentElt.style.display = "block";
				});

				//Write the html to the frame.
				if (toType == 'html') {
					var ifrm = document.getElementById("theFrame");
					var doc = ifrm.contentWindow || ifrm.contentDocument.document || ifrm.contentDocument;

					//Passing the css to the server isn't working, so write it to the page manually.
					//Does not fix the corresponding epub issue.
					output = output.replace("</head>", css + "\n" + "</head>");

					doc.document.open();
					doc.document.write(output);
					doc.document.close();
				}

				if (download) {
					downloader(toType, output);
				}
				return true;
			}

		})();
	
})(prePub);

prePub.init.load();
