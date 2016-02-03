'use strict'

var path = require('path');

var buildPackage = (src, target, info) => new Promise((resolve) => {
  var memFs = require('mem-fs'),
      store = memFs.create(),
      editor = require('mem-fs-editor'),
      fs = editor.create(store);

  let template = path.resolve(__dirname, '../templates/package/**');

  // copy package template
  fs.copyTpl(template, target, info);

  // copy web resources
  fs.copy(src + '/**/*', target + '/bundle/web/nuxeo.war/' + info.name);

  fs.commit(() => {
    console.log('Package ' + target + ' ready')
    resolve();
  });
});

var zip = (options, dst) => new Promise((resolve, reject) => {
  var fs = require('fs'),
      archiver = require('archiver');

  var output = fs.createWriteStream(dst),
      archive = archiver('zip');

  output.on('close', function() {
    console.log('Archive ' + dst + ' ready (' + archive.pointer() + ' bytes)');
    resolve();
  });

  archive.pipe(output);
  archive.bulk(options);
  archive.finalize();
});

module.exports = function(folder, options) {

  var target = '.tmp/nuxeo/package',
      info = require(path.resolve(process.cwd(), 'package.json'));

  buildPackage(folder || 'dist', target, info)
  // build bundle (jar)
  .then(() => zip({src: ['**'], expand: true, cwd: target + '/bundle'}, target + '/bundle.jar'))
  // build package
  .then(() => zip({src: ['*.xml', 'bundle.jar'], expand: true, cwd: target}, `marketplace-${info.name}-${info.version}.zip`))
  // done
  .then(() => console.log('All done.'))
  .catch((error) => console.error(error));
}
