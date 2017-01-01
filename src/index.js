const through = require('through2');
const { Minimatch } = require('minimatch');
const path = require('path');
const sort = require('stable');

module.exports = function(patterns, options) {
  if (patterns == null) { patterns = []; }
  if (options == null) { options = {}; }
  const files = [];

  const matchers = patterns.map(function(pattern) {
    if (pattern.indexOf('./') === 0) {
      throw new Error('Do not start patterns with `./` - they will never match. Just leave out `./`');
    }

    return Minimatch(pattern);
  });

  function onFile (file, enc, cb) {
    files.push(file);
    cb();
  }

  const relative = function(file) {
    if (options.base != null) {
      return path.relative(options.base, file.path);
    } else {
      return file.relative;
    }
  };

  const rank = function(s) {
    for (let index = 0; index < matchers.length; index++) {
      const matcher = matchers[index];
      if (matcher.match(s)) { return index; }
    }

    return matchers.length;
  };

  function onEnd (cb) {
    sort.inplace(files, function(a, b) {
      const aIndex = rank(relative(a));
      const bIndex = rank(relative(b));

      if (aIndex === bIndex) {
        return String(relative(a)).localeCompare(relative(b));
      } else {
        return aIndex - bIndex;
      }
    });
    files.forEach(file => this.push(file));

    cb();
  };

  return through.obj(onFile, onEnd);
};
