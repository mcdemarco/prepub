# PrePub

PrePub is a Twine 1 and 2 story format to convert Twine stories to a flat (pandoc extended) Markdown file, for further processing with pandoc into an ePub file.  You will need to install [pandoc](https://pandoc.org/), preferably version 2.2.2 or later, for the ePub step.

The PrePub web page is [here](http://mcdemarco.net/tools/scree/prepub/).  You can view a demo ePub [here](http://mcdemarco.net/tools/scree/test-prepub.epub).

## Install

To add PrePub to Twine 2, use this URL (under Formats > Add a New Format): [https://mcdemarco.net/tools/scree/prepub/format.js](https://mcdemarco.net/tools/scree/prepub/format.js).

To add PrePub to Twine 1, create a new folder called `prepub` inside your targets folder, then download this file: [https://mcdemarco.net/tools/scree/prepub/header.html](https://mcdemarco.net/tools/scree/prepub/header.html) and place it inside the `prepub` folder.   (See the [Twine wiki](http://twinery.org/wiki/twine1:story_format#adding_formats) for more information about installing and using story formats in Twine 1.)

You should also download [prepub.css](https://mcdemarco.net/tools/scree/prepub/prepub.css) if you intend to use a numbering option besides the default.

## What it does

PrePub converts wiki-style links in your story to [implicit header references](https://pandoc.org/MANUAL.html#extension-implicit_header_references) (part of Pandoc's Markdown extensions).  It moves your start passage to the start of the file, if it isn't there already, and removes all special passages.  Otherwise, it leaves the text of your story in place and in order.

While some ePub formats may support some JavaScript coding, PrePub ignores any JavaScript.  Styling should be done in Markdown, not in old-style wiki formatting (which is optional in Harlowe and expected in SugarCube), which will be left in place.  (You can alter it in the Markdown file before compiling to ePub using a good text editor.)  HTML may or may not be preserved.

PrePub will attempt to automatically save your story to a Markdown file named something like `prepub123456789.md`; if downloading fails, you may instead see the markdown in the browser.  You should cut and paste it into a new file in that case.  If you want to select a different passage numbering option, choose the appropriate radio button and click `Regenerate` to get a second Markdown file.  The options include no passage header at all, the passage name (the default), sequential numbering, a single character divider, or an image divider.

## Making the ePub

You should use a post-processor like [pandoc](http://pandoc.org) to turn it into HTML, ePub, or mobi format; *e.g.*:

	pandoc -o my-ebook.epub my-ebook.md --epub-chapter-level=2 --toc-depth=1 --css=prepub.css

You will need the `prepub.css` file mentioned above in order to remove chapter headers or turn them into gamebook-style paragraph numbers.  Feel free to add additional styles to the file as well.

[Kent Bye's advice](https://puppet.com/blog/how-we-automated-our-ebook-builds-pandoc-and-kindlegen) includes more flags to set to spiff up your output (I've updated some of them for Twine purposes):

	pandoc -o my-ebook.epub title.txt my-ebook.md --epub-cover-image=cover.jpg --epub-metadata=metadata.xml --toc-depth=1 --css=prepub.css --css=mySpiffyStyles.css

Note that `--epub-stylesheet` has become `--css` in newer versions of pandoc, with which you can also incorporate multiple stylesheets.

### Tweaking the ePub

Most changes can be made in the stylesheet; you can make the passage headers/numbers/characters/images bigger or smaller there, as well as centering or coloring them as desired.

If you're going for a continuous paragraph style like in old gamebooks, you can change `--epub-chapter-level=2` to `--epub-chapter-level=1` and remove the line in the stylesheet that handles 2-page layouts, but this is in no way a recommendation.

### Making Kindle books

You can convert your ePub directly to Kindle using [KindleGen](https://www.amazon.com/gp/feature.html?docId=1000765211) or the [Kindle Previewer](http://www.amazon.com/kindleformat/kindlepreviewer).

## Versions

### 1.1.0

Add some passage header options and move the start passage to the beginning of the story.

### 1.0.1

Fix line endings in Twine 1 and improve handling of special passages.

### 1.0.0

Initial version.

## Building From Source

Run `npm install` to install dependencies.  Run `grunt package` to create release versions for Twine 1 and 2 under `dist/`.  Run `grunt --help` to list other grunt targets.

## Sausage

PrePub no longer writes out DOS line endings; you can reintroduce these with Pandoc if you need them.

PrePub was inspired by [enscree](http://www.mcdemarco.net/tools/scree/enscree/), which was based on [entwee](http://www.mcdemarco.net/tools/entwee/), which was based on [entweedle](http://www.maximumverbosity.net/twine/Entweedle/).
