const order = require('../src/index.js');
const path = require('path');
const { File } = require('gulp-util');
const { expect } = require('chai');
require('mocha');

const cwd = '/home/johndoe/';

const newFile = function(filepath, base) {
  if (base == null) { base = cwd; }

  return new File({
    path: path.join(base, filepath),
    base,
    cwd,
    contents: new Buffer('')
  });
};

describe('gulp-order', () =>
  describe('order()', function() {
    it('orders files', function(done) {
      const stream = order(['foo.js', 'bar.js']);

      const files = [];
      stream.on('data', file => {
        files.push(file);
      });
      stream.on('end', function() {
        expect(files.length).to.equal(4);
        expect(files[0].relative).to.equal('foo.js');
        expect(files[1].relative).to.equal('bar.js');
        expect(files[2].relative).to.equal('baz-a.js');
        expect(files[3].relative).to.equal('baz-b.js');
        return done();
      });

      stream.write(newFile('baz-b.js'));
      stream.write(newFile('bar.js'));
      stream.write(newFile('baz-a.js'));
      stream.write(newFile('foo.js'));
      return stream.end();
    });

    it('supports globs', function(done) {
      const stream = order(['vendor/**/*', 'app/**/*']);

      const files = [];
      stream.on('data', files.push.bind(files));
      stream.on('end', function() {
        expect(files.length).to.equal(5);
        expect(files[0].relative).to.equal('vendor/f/b.js');
        expect(files[1].relative).to.equal('vendor/z/a.js');
        expect(files[2].relative).to.equal('app/a.js');
        expect(files[3].relative).to.equal('other/a.js');
        expect(files[4].relative).to.equal('other/b/a.js');
        return done();
      });

      stream.write(newFile('vendor/f/b.js'));
      stream.write(newFile('app/a.js'));
      stream.write(newFile('vendor/z/a.js'));
      stream.write(newFile('other/a.js'));
      stream.write(newFile('other/b/a.js'));
      return stream.end();
    });

    it('supports a custom base', function(done) {
      const stream = order(['scripts/b.css'], {base: cwd});

      const files = [];
      stream.on('data', files.push.bind(files));
      stream.on('end', function() {
        expect(files.length).to.equal(2);
        expect(files[0].relative).to.equal('b.css');
        expect(files[1].relative).to.equal('a.css');
        return done();
      });

      stream.write(newFile('a.css', path.join(cwd, 'scripts/')));
      stream.write(newFile('b.css', path.join(cwd, 'scripts/')));
      return stream.end();
    });

    return it('warns on relative paths in order list', () =>
      expect(() => order(['./user.js']))
      .to.throw('Do not start patterns with `./` - they will never match. Just leave out `./`')
    );
  })
);
