# PrePub

PrePub is a Twine 1 and 2 proofing format for converting simple Twine stories to a flat (Pandoc extended) Markdown file, useful for conversion to EPUB format with Pandoc. You will need to install [Pandoc](https://pandoc.org/), preferably version 2.8.0.1 or later, for the EPUB step.

The PrePub web page is [here](http://mcdemarco.net/tools/scree/prepub/).  You can get a demo EPUB [here](http://mcdemarco.net/tools/scree/test-prepub.epub).

## Installation

To add PrePub to Twine 2, use this URL (under Formats > Add a New Format): `https://mcdemarco.net/tools/scree/prepub/format.js`.  Also make PrePub your default proofing format (under Formats > Proofing Formats).

To add PrePub to Twine 1, create a new folder called `prepub` inside your targets folder, then download [this file](https://mcdemarco.net/tools/scree/prepub/header.html):
`https://mcdemarco.net/tools/scree/prepub/header.html`
and place it inside the new `prepub` folder.  See the [Twine cookbook](https://twinery.org/cookbook/twine1/terms/storyformats.html) for more information about installing and using story formats in Twine 1.

You should also download [`prepub.css`](https://mcdemarco.net/tools/scree/prepub/prepub.css), especially if you intend to use paragraph numbering or other options, and optionally [`epub.yaml`](https://mcdemarco.net/tools/scree/prepub/epub.yaml), some convenient defaults for Pandoc.

## Use

PrePub produces a Twine HTML file that, when opened in a browser, shows you the PrePub options and downloads a Markdown file named something like `prepub123456789.md`.

In Twine 2, open your story, then click on the story menu arrow next to your story title (in the lower left hand corner of the UI) and select View Proofing Copy.

In Twine 1, open or create a story (under the File menu).  Then, in the Story menu under Story Formats, select PrePub as the story format.  Choose Test Play.  (You may need to restart Twine 1 if you installed PrePub while it was running.)

You can also use [TweeGo](http://www.motoslave.net/tweego/) with PrePub.  Install the PrePub story format according to [the documenatation](http://www.motoslave.net/tweego/docs/#getting-started-story-formats).  With TweeGo, or if you Publish or Build to a file in Twine 1, you will need to open the resulting HTML file in a browser in order to generate the desired Markdown output.

### Details

PrePub converts wiki-style links in your story to [implicit header references](https://pandoc.org/MANUAL.html#extension-implicit_header_references) (part of Pandoc's Markdown extensions).  It moves your start passage to the start of the file, if it isn't there already, your colophon (*i.e.*, any passage titled StoryColophon) to the end, and removes common special passages.  Otherwise, it leaves the passages of your story in place and in order, unless you choose to shuffle them.

Markdown styling is preserved and understood by Pandoc.  Old-style wiki formatting (which is optional in Harlowe and expected in SugarCube) will be left in place by PrePub so you can alter it in the Markdown file before compiling to EPUB (using a good text editor).  HTML may or may not be preserved.

### Options

After downloading the default Markdown file, the PrePub GUI remains open.  To select a different passage numbering option, choose the appropriate radio button, then click `Regenerate` to get a new Markdown file.

For passage headers, the options include: no passage headers at all, the passage name (the default), sequential numbering, a single character divider, or an image divider.

There is also an option to shuffle passages; otherwise the passages appear in the same order in the text as in the source file.

### What it doesn't do but should (the to-do list)

It does not parse your StoryData for an alternate start passage title.  It does not handle wiki formatting.  It does not rewrite your links to use paragraph numbers (shuffled or not).  It does not handle multiple authors, or other locations for the author besides a StoryAuthor passage.

Other Pandoc output formats such as HTML and PDF may require supporting programs to produce the desired output.

While EPUB nominally supports JavaScript coding, this support is optional and thus not available in all EPUB readers.  For the moment, PrePub ignores any JavaScript.

## Making an EPUB

You should use a post-processor like [Pandoc](http://pandoc.org) to turn PrePub's Markdown output into EPUB, mobi, HTML, PDF, or other formats.  To make an EPUB with Pandoc, type the following at the command line:

	pandoc -o my-story.epub prepub123456789.md --epub-chapter-level=2 --toc-depth=1 --css=prepub.css

You will need the `prepub.css` file mentioned above in order to remove chapter headers or turn them into gamebook-style paragraph numbers.  (You should be able to find it wherever you got PrePub itself.)  Feel free to add additional styles to the file.

Pandoc supports defaults files, and several have been provided (*e.g.*, [`epub.yaml`](https://mcdemarco.net/tools/scree/prepub/epub.yaml)) so you don't need to type out all the Pandoc options.  You can pass a defaults file on the command line like this:

	pandoc -d epub.yaml prepub123456789.md 

(The `yaml` extension is optional.)  The defaults will save the EPUB with the name `result.epub`; you can change the file name inside `epub.yaml`, or you can pass a different output file name on the command line with `-o` (as in the first example).

Note that `--epub-stylesheet` has become `--css` in newer versions of Pandoc, and defaults files are only available in newer versions.  It's also possible to pass Pandoc multiple CSS stylesheets (and defaults files) if you like.

### Tweaking the EPUB

Most changes can be made in the stylesheet; you can make the passage headers/numbers/characters/images bigger or smaller there, as well as centering or coloring them as desired.

If you're going for a continuous paragraph style like in old gamebooks, change `--epub-chapter-level=2` to `--epub-chapter-level=1` (or edit it in `epub.yaml`) and remove the line in `prepub.css` that handles 2-page layouts.  Note that the links may not work well in an ebook reader, though they should work in a PDF set to continuous scroll.

[Kent Bye](https://puppet.com/blog/how-we-automated-our-ebook-builds-pandoc-and-kindlegen) lists more flags to set to spiff up your output:

	pandoc -o my-story.epub title.txt prepub123456789.md --epub-cover-image=cover.jpg --epub-metadata=metadata.xml --toc-depth=1 --css=prepub.css --css=mySpiffyStyles.css

For help adding more arguments to the Pandoc defaults file, see [the Pandoc users guide](https://pandoc.org/MANUAL.html#default-files).  For more about producing EPUBs, see Pandoc's [Making an ebook](https://pandoc.org/epub.html) documentation.

## Making other formats

You can convert your EPUB directly to Kindle using [KindleGen](https://www.amazon.com/gp/feature.html?docId=1000765211) or the [Kindle Previewer](http://www.amazon.com/kindleformat/kindlepreviewer).  (Although Amazon now prefers EPUB to mobi, there is still Amazon-specific formatting to consider; another option for that is [Vellum](https://vellum.pub).)

Defaults files for producing HTML or PDF output with PrePub are also available.  See the comments in [`html.yaml`](https://mcdemarco.net/tools/scree/prepub/html.yaml) and [`pdf.yaml`](https://mcdemarco.net/tools/scree/prepub/pdf.yaml) for the corresponding command line invocation if you need it.

### Examples

The Scree test story is available formatted as markdown using PrePub ([test-prepub.md](//mcdemarco.net/tools/scree/test-prepub.md)), and as transformed by Pandoc:  [test-prepub.epub](//mcdemarco.net/tools/scree/test-prepub.epub).

## Versions

### 1.1.1

Add defaults files and fix minor issues in 1.1.0 for an actual release. [Current version.]

### 1.1.0

Add some passage header options including shuffling, and move the start passage to the beginning of the story.
(Only released [on Github](https://github.com/mcdemarco/prepub/releases).)

### [1.0.1](//mcdemarco.net/tools/scree/prepub/1.0.1/)

Fix line endings in Twine 1 and improve handling of special passages.

### [1.0.0](//mcdemarco.net/tools/scree/prepub/1.0.0/)

Initial version.

## Building From Source

Run `npm install` to install dependencies.  Run `grunt package` to create release versions for Twine 1 and 2 under `dist/`.  Run `grunt --help` to list other grunt targets.

## Sausage

PrePub no longer writes out DOS line endings; you can reintroduce these with Pandoc if you need them.

PrePub was inspired by [enscree](http://www.mcdemarco.net/tools/scree/enscree/), which was based on [entwee](http://www.mcdemarco.net/tools/entwee/), which was based on [entweedle](http://www.maximumverbosity.net/twine/Entweedle/), but now has a UI more like [DotGraph]((http://www.mcdemarco.net/tools/scree/dotgraph/)'s.
