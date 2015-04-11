var fs = require('fs')
var _ = require('lodash')
var async = require('async')
var recursive = require('recursive-readdir')
var figlet = require('figlet')
var colors = require('colors')

var coreModules = ['assert','buffer','child_process','cluster','console','constants','crypto','dgram','dns','domain','events','freelist','fs','http','https','module','net','os','path','punycode','querystring','readline','repl','smalloc','stream','string_decoder','sys','timers','tls','tty','url','util','vm','zlib']

function getFilesList(callback) {
	var statements = []
	recursive('./', ['node_modules'], function (err, files) {
	  	callback(null, files)
	});	
}

function readData(path, callback) {
  fs.readFile(path, {  }, function (err, data) {
	  var parsedData = data.toString('utf8')
	  callback(err, parsedData)
	});	
}

function findRequires(data) {
	var matches = []
	var regex = /require\(\'([a-zA-Z0-9]+)\'\)/g
  var match = regex.exec(data)
  match && matches.push(match[1])
  while (match!=null) {
  	match = regex.exec(data)
  	match && matches.push(match[1])
  }
  return matches
}

function checkForPackages(files, callback) {
	var statements = []
	var readCount = 0
  for (var i = 0; i < files.length; i++) {
  	readData(files[i], function(err, data) {
  		var requires = findRequires(data)
  		if (requires) statements = statements.concat(requires)
  		if (readCount>=files.length - 1) {
  			return callback(null, statements)
  		}
  		readCount++
  	})
  }
}

function getDependencies(statements, callback) {
	fs.readFile('package.json', {  }, function (err, data) {
	  if (err) throw err;
	  callback(null, statements, JSON.parse(data.toString('utf8')).dependencies)
	})
}

function filterAndCombine(statements, dependencies, callback) {
	statements = _.unique(statements)
	statements = _.difference(statements, coreModules)
	var depNames = _.keys(dependencies)
	var missing = _.difference(statements, depNames)
	callback(null, missing)
}

function ball(fix) {
	if (fix) return

	console.log("Checking",process.cwd(),"package.json")

	async.waterfall([
		getFilesList,
		checkForPackages,
		getDependencies,
		filterAndCombine
	], function(err, missing) {
		if (!missing.length) {
			figlet("Awww  yeah!", function (err, ascii){
      	console.log(ascii.toString().rainbow);    
    	})
			return
		}
		figlet("Missing packages", function (err, ascii){
    	console.log(ascii.toString().red);    
			_.forEach(missing, function(name) {
				console.log(name.red)
			})
  	})
	})
}

if(require.main === module) 
   ball()

module.exports = {
	ball: ball
}
