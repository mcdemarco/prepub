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

				var storyData = window.document.getElementsByTagName("tw-storydata");
				if (storyData) {
					buffer.push(this.buildPassage("StoryTitle","",storyData[0].getAttribute("name")));
				}

				var passages = window.document.getElementsByTagName("tw-passagedata");
				for (var i = 0; i < passages.length; ++i) {
					buffer.push(this.buildPassageFromElement(passages[i]));
				}

				return buffer.join('');
			},

			
			buildPassageFromElement: function(passage) {
				var name = passage.getAttribute("name");
				if (!name) {
					name = "Untitled Passage";
				}
				var content = passage.textContent;
				
				return this.buildPassage(name, content);
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
