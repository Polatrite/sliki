var path = require('path')
    , fs = require('fs')
    , marked = require('marked')
    , findUp = require('./findUp.js')
    , resolvePath = require('object-resolve-path')
    ;


var BASIC_TEMPLATE = '<html><head><title>{{{ title }}}</title></head>' +
    '<body>{{{ markdown }}}</body></html>';

var TAGS = {
  'title': /\{\{\{\ *title\ *\}\}\}/,
  'markdown': /\{\{\{\ *markdown\ *\}\}\}/
};

var renderer = new marked.Renderer();

renderer.strong = function(text) {
  console.log("Renderer: " + text);
  var escapedText = text.toLowerCase().replace(/[^\w]+/g, '-');

  console.log("Trying to render " + text);
  var prop = null;
  try {
    prop = resolvePath(global.database, text);
  }
  catch(e) {
    console.error(e);
    prop = 'null';
  }
  console.log("Found " + prop);
  return '<span class="data">' + prop + '</span>';
}

console.log(renderer);

function findProp(obj, prop, defval){
  if (typeof defval == 'undefined') defval = null;
  prop = prop.split('.');
  for (var i = 0; i < prop.length; i++) {
    if(typeof obj[prop[i]] == 'undefined')
      return defval;
    obj = obj[prop[i]];
  }
  return obj;
}

var FIRST_TAG_CONTENT = /\>\s*(\w[^<]+)<\//;

// Replace special {{{ tags }}} found in the HTML template with the
// corresponding replacement text.

function replaceTags(html, replacements) {
  for (var key in TAGS) {
    if (TAGS.hasOwnProperty(key) && key in replacements) {
      html = html.replace(TAGS[key], replacements[key]);
    }
  }
  return new Buffer(html);
}

// Render the specified target from Markdown to HTML.
//
// target (String) - Path to the Markdown document to be rendered
// baseDir (String) - docs dir (options.dir from the middleware)

function render(target, baseDir, callback) {
  findUp('template.html', path.dirname(target), baseDir, function(err, template)
  {
    if (err) { return callback(err); }

    fs.readFile(target, function(err, data) {
      if (err) { return callback(err); }

      var replacements = {};
      replacements.markdown = marked(data.toString(), { renderer: renderer });

      // for the title, get the contents of the first HTML tag
      replacements.title = 'Untitled';
      var match = replacements.markdown.match(FIRST_TAG_CONTENT);
      if (match) { replacements.title = match[1].trim(); }

      if (template) {
        fs.readFile(template, function(err, data) {
          if (err) { return callback(err); }
          callback(null, replaceTags(data.toString(), replacements));
        });
      } else {
        callback(null, replaceTags(BASIC_TEMPLATE, replacements));
      }
    });
  });
}

module.exports = render;
