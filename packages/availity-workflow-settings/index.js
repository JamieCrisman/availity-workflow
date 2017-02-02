const path = require('path');
const Logger = require('availity-workflow-logger');
const exists = require('exists-sync');
const trimStart = require('lodash.trimstart');
const chalk = require('chalk');
const merge = require('lodash.merge');
const fs = require('fs');
const yaml = require('js-yaml');
const argv = require('yargs').argv;

const settings = {

  // Cache these values
  configuration: null,
  workflowConfigPath: null,

  app() {
    return path.join(this.project(), 'project/app');
  },

  pkg() {
    return require(path.join(this.project(), 'package.json'));
  },

  // Don’t use [chunkhash] in development since this will increase compilation time
  // In production, [chunkhash] generate hashes depending on the file contents this if
  // the contents don't change the file could potentially be cached in the browser.
  fileName() {
    return this.isDevelopment() ? '[name].js' : '[name]-[chunkhash].js';
  },

  output() {
    return this.isDistribution() ?
      path.join(this.project(), 'dist') :
      path.join(this.project(), 'build');
  },

  port() {
    return 3000;
  },

  project() {
    return process.cwd();
  },

  extensions() {
    return ['', '.js', '.jsx', '.json', '.css', 'scss'];
  },

  init() {

    this.configuration = require('./workflow');
    let developerConfig = {};

    // try workflow.js
    this.workflowConfigPath = path.join(settings.project(), 'project/config/workflow.js');
    let isWorkflowConfig = exists(this.workflowConfigPath);

    // try workflow.yml if workflow.js is not found
    if (!isWorkflowConfig) {
      this.workflowConfigPath = path.join(settings.project(), 'project/config/workflow.yml');
      isWorkflowConfig = exists(this.workflowConfigPath);
    }

    if (isWorkflowConfig) {
      developerConfig = yaml.safeLoad(fs.readFileSync(this.workflowConfigPath, 'utf8'));
    }

    merge(this.configuration, developerConfig);

    // Merge in CLI overrides.  The command line args can pass nested properties like:
    //
    //    start --development.mode=angular --ekko.port=8000
    //
    // Yargs will convert those arguments into an object.  We pluck the only the top level attributes that we
    // are interested in and merge into the default configuration.
    //
    merge(this.configuration, {
      development: argv.development,
      ekko: argv.ekko
    });

  },

  log() {

    if (!this.pkg().availityWorkflow) {

      Logger.error('Project must be configured to use React or Angular')
      Logger.simple(`
Instructions:

- ${chalk.yellow('Install appropriate plugin')}

  ${chalk.gray('npm install availity-workflow-<react|angular>')}

- ${chalk.yellow('Update package.json with plugin reference')}

  ${chalk.gray('"availityWorkflow": { "engine": "availity-workflow-<react|angular>" }')}
`);

      throw new Error('');
    }

    // Log the mode
    let message = `${this.configuration.development.mode.toUpperCase()} MODE`;
    Logger.warn(`${chalk.bold.yellow(message)}`);

    if (!this.isTesting()) {
      message = trimStart(path.relative(process.cwd(), this.workflowConfigPath), 'node_modules/');
      Logger.info(`Using ${chalk.blue(message)}`);
    }

  },

  asset(workflowFilePath, projectFilePath) {

    const hasProjectFile = exists(projectFilePath);
    const filePath = hasProjectFile ? projectFilePath : workflowFilePath;

    if (!this.isTesting()) {
      const message = trimStart(path.relative(process.cwd(), filePath), 'node_modules/');
      Logger.info(`Using ${chalk.blue(message)}`);
    }

    return path.relative(this.app(), filePath);

  },

  config() {
    return this.configuration;
  },

  environment() {
    return process.env.NODE_ENV || 'development';
  },

  isSmokeTest() {
    return argv.smokeTest;
  },

  isDebug() {
    return this.environment() === 'debug';
  },

  isStaging() {
    return this.environment() === 'staging';
  },

  isIntegration() {
    return this.environment() === 'integration';
  },

  isDevelopment() {
    return this.environment() === 'development';
  },

  isTesting() {
    return this.environment() === 'testing';
  },

  isProduction() {
    return this.environment() === 'production';
  },

  isDistribution() {
    return this.isProduction() || this.isStaging();
  }

};

module.exports = settings;