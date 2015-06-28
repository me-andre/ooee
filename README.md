# Object-Oriented Event Emitter

`ooee` is a function which returns a very basic mixin for turning an object into an event emitter. Unlike the majority of
similar libraries, the event emitter itself doesn't implement `off()` method. Instead, its `on()` method returns an 
instance of `OOEListener` which has `off()` method for unbinding itself, so you don't have to care which events you've 
registered for / which callbacks you've attached: just call `off()` on each of your listeners, and you're free to dispose 
 your object. This approach is not only secure, but also easier to use in case you care about memory leaks.

`ooee` extends your object with 2 public methods, `on()` and `emit()`,
and one dynamically attached property to store event listeners in. The name of the property can be customized by calling 
`ooee({namespace: 'desiredNamespace'})`, the default value is `'_ooee'`.
The typical usage is (assuming you're using `lodash`): `_.assign(Class.prototype, ooee(), { // your methods go here`.

## Node.js
1. Install with `npm i ooee`
2. `var ooee = require('ooee');`

## Browser
Put [ooee.js](https://raw.githubusercontent.com/me-andre/ooee/master/ooee.js) in your project and you'll have global `ooee()` variable.
### In case you want to build for the browser yourself
1. Install with `npm i --dev ooee`
2. Install gulp with `npm i -g gulp` (may require `sudo`)
3. `gulp` will make the browser-usable bundle for you (look for `ooee.js` in the project folder)

