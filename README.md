## Install
`npm install eyeball-mk-1 -g`

## Run
`eyeball` - will check what's missing from package.json and create a list ignoring core modules and relative paths. Read only.

`eyeball -f` - will *fix* your package.json with packages that are required but not listed in dependencies. Uses 4 spaces for indentation when writing to package.json.

## About
I spent a long time looking for the eyeball-mk-1 package before I realised what my colleague was referring to meant 'just looking at it'. Nobody needs to go through that again now. Eyeball finds all the require statements in your directory and lists them.

It can also auto-fix the package.json file by adding anything missing. If the module is installed it will get the version number of that module from node_modules/MODULE/package.json, else it will use * as the version. If there are uninstalled modules, run `npm install` after eyeball.

Run it in the same directory as your package.json. Eyeball will not recursively seek upwards through directories.

## Todo
- write tests
- handle devDependencies
