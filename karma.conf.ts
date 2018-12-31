import { Config, ConfigOptions } from 'karma'
import { KarmaTypescriptConfig } from 'karma-typescript/src/api/configuration'
import * as karmaCoverage from 'karma-coverage'

interface CustomKarmaConfigOptions extends ConfigOptions, karmaCoverage.ConfigOptions {
  karmaTypescriptConfig?: KarmaTypescriptConfig
}

interface CustomKarmaConfig extends Config {
  set: (config: CustomKarmaConfigOptions) => void
}

const env = process.env.NODE_ENV || ''
const isDebugMode = env.toLowerCase() === 'debug'

export default (config: CustomKarmaConfig) => {
  config.set({
    frameworks: [
      'mocha',
      'karma-typescript',
    ],
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
    },
    files: [
      { pattern: './src/**/*.ts' },
      { pattern: './test/**/*.ts' },
    ],
    exclude: [
      './test/node/**/*',
      './test/util/node/**/*',
      './src/**/*.node.*',
    ],
    reporters: ['progress', 'karma-typescript'],
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      FirefoxHeadless: {
        base: 'Firefox',
        flags: ['-headless'],
      },
    },
    singleRun: true,
    karmaTypescriptConfig: {
      tsconfig: './tsconfig.test.json',
      coverageOptions: {
        instrumentation: !isDebugMode,
      },
      reports: {
        json: {
          directory: 'coverage',
          // normalizes browser name directories to lowercase without version
          // ex: coverage/chrome/coverage.xml
          subdirectory: browser => browser.name.toLowerCase().split(' ')[0],
          filename: 'coverage.json',
        },
        text: '', // write to console
      },
    },
  })
}
