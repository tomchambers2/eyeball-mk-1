var fs = require('fs')
var _ = require('lodash')
var async = require('async')
var recursive = require('recursive-readdir')
var figlet = require('figlet')
var colors = require('colors')

var coreModules = ['assert','buffer','child_process','cluster','console','constants','crypto','dgram','dns','domain','events','freelist','fs','http','https','module','net','os','path','punycode','querystring','readline','repl','smalloc','stream','string_decoder','sys','timers','tls','tty','url','util','vm','zlib']

/* checking functions */

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
	var regex = /require\(\'([a-zA-Z0-9-]+)\'\)/g
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

function isJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function getDependencies(statements, callback) {
	fs.readFile('package.json', {  }, function (err, data) {
	  if (!isJsonString(data)) {
	  	return console.log("Your package.json contains invalid JSON. Eyeball cannot continue".red)
	  }
	  var dependencies = JSON.parse(data.toString('utf8')).dependencies 
	  callback(null, statements, dependencies)
	})
}

function filterAndCombine(statements, dependencies, callback) {
	statements = _.unique(statements)
	statements = _.difference(statements, coreModules)
	var depNames = _.keys(dependencies)
	var missing = _.difference(statements, depNames)
	callback(null, missing)
}

/* fixing functions */

function readModuleVersion(module, callback) {
	fs.readFile('node_modules/'+module+'/package.json', {  }, function (err, data) {
		var version = data && JSON.parse(data.toString('utf8')).version
	  callback(err, version)
	})	
}

function getPackage(callback) {
	fs.readFile('package.json', {  }, function (err, data) {
	  if (err) return callback(err);
	  callback(null, JSON.parse(data.toString('utf8')))
	})
}

function writePackage(data, callback) {
	fs.writeFile('package.json', JSON.stringify(data, null, 4), function(err) {
		if (err) return callback(err)
		callback(null)
	})
}

function addModuleToPackage(module, version, callback) {
	getPackage(function(err, packageJson) {
		packageJson.dependencies = packageJson.dependencies || {}
		packageJson.dependencies[module] = version || "*"
		writePackage(packageJson, callback)
	})
}

function addToPackage(missing) {
	var doNpm
	async.eachSeries(missing, function(module, callback) {
		readModuleVersion(module, function(err, version) {
			addModuleToPackage(module, version, function(err) {
				if (err) return console.log(err.red)

				if (version) {
					var message = module+" already installed, added @"+version
					console.log(message.green)
				} else {
					var message = module+" not installed, added with * in place of version"
					doNpm = true
					console.log(message.yellow)
				}

				callback(null)
			})
		})
	}, function(err) {
		if (doNpm) console.log("You need to run 'npm install' now to install missing packages".yellow);
	})
}

function ball(fix) {
	console.log("Checking",process.cwd(),"package.json")

	async.waterfall([
		getFilesList,
		checkForPackages,
		getDependencies,
		filterAndCombine
	], function(err, missing) {
		if (!missing.length) {
			console.log(figlet.textSync('Aww yeah!').rainbow);  		
			return
		}
		console.log(figlet.textSync('Missing packages').red);  		
		_.forEach(missing, function(name) {
			console.log(name.red)
		})

  	if (fix) {
			console.log(figlet.textSync('Fixing packages').yellow);  		
  		addToPackage(missing)
  	}
	})
}

if(require.main === module) 
   ball(true)

module.exports = {
	ball: ball
}
