var nodemon = require('gulp-nodemon');
var path = require('path');

var logger = require('../logger');
var context = require('../context');

context.gulp.task('av:server', [
  'av:server:web',
  'av:server:rest',
  'av:open'
]);

context.gulp.task('av:server:web', function() {

  var Server = require('../hapi');
  var server = new Server();

  return server.start();

});

context.gulp.task('av:server:rest', function() {

  nodemon({
    script: path.join(__dirname, '..', 'ekko'),
    ext: 'json',
    watch: [
      path.join(context.settings.project.path, 'project/config/routes.json'),
      path.join(context.settings.project.path, 'project/data')
    ],
    // nodeArgs: ['--debug'],
    env: {
      'NODE_ENV': 'development'
    }
  }).on('restart', function() {
    logger.log('EKKO server restarted.');
  });
});
