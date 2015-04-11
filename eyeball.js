#!/usr/bin/env node

var eye = require('./index')

var program = require('commander');

program
    .version('0.0.1')
    .usage('<keywords>')
    .option('-c --check', 'Check for missing dependencies')
    .option('-f --fix', 'Fix package json')
    .parse(process.argv);

eye.ball(program.fix)