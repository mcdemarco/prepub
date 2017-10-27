# PrePub

PrePub is a Markdown story format for Twine 1 and 2 based on [enscree](http://www.mcdemarco.net/tools/scree/enscree/) (which was based on entwee, which was based on entweedle).

The PrePub web page is [here](http://mcdemarco.net/tools/scree/prepub/).  You can view a demo ePub [here](http://mcdemarco.net/tools/scree/test-prepub.epub).

## Install

To add PrePub to Twine 2, use this URL (under Formats > Add a New Format): [https://mcdemarco.net/tools/scree/prepub/format.js](https://mcdemarco.net/tools/scree/prepub/format.js).

To add PrePub to Twine 1, create a new folder called `prepub` inside your targets folder, then download this file: [https://mcdemarco.net/tools/scree/prepub/header.html](https://mcdemarco.net/tools/scree/prepub/header.html) and place it inside the `prepub` folder.   (See the [Twine wiki](http://twinery.org/wiki/twine1:story_format#adding_formats) for more information about installing and using story formats in Twine 1.)

## What it does

PrePub converts wiki-style links in your story to [implicit header references](https://pandoc.org/MANUAL.html#extension-implicit_header_references) (part of Pandoc's Markdown extensions).  Otherwise, it leaves the text of your story in place (and in order).   While some ePub formats may support some JavaScript coding, PrePub ignores any JavaScript.  Styling should be done in Markdown, not in old-style wiki formatting.  HTML may or may not be preserved.  

PrePub will attempt to automatically save your story to a file named something like `prepub123456789.md`; if it fails, you may instead see the markdown in the browser.  You can cut and paste it into a file in that case.

PrePub leaves your Markdown formatting in place; you should use a post-processor like Pandoc to turn it into HTML, ePub, or mobi format.  To process with [pandoc](http://pandoc.org), try:

	pandoc -o my-ebook.epub my-ebook.md --epub-chapter-level=2

[Kent Bye's advice](https://puppet.com/blog/how-we-automated-our-ebook-builds-pandoc-and-kindlegen) includes more flags to set to spiff up your output:

	pandoc -o my-ebook.epub title.txt my-ebook.md --epub-cover-image=cover.jpg --epub-metadata=metadata.xml --toc --toc-depth=2 --epub-stylesheet=stylesheet.css

## Versions

### 1.0.0

Initial version.

## Building From Source

Run `npm install` to install dependencies.  Run `grunt package` to create a release version for Twine under `dist/`.  Run `grunt --help` to list other grunt targets.

