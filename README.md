[![Coverage Status](https://coveralls.io/repos/github/codefresh-io/cf-errors/badge.svg?branch=develop)](https://coveralls.io/github/codefresh-io/cf-errors?branch=develop)

# Extensible error library
This module was written with inspiration taken from verror module. <br/>
This library supports a fully extensible error objects.

### Creating an error
```javascript
var CFError    = require('cf-errors');
var ErrorTypes = CFError.errorTypes;

var error = new CFError(
  {
    type: ErrorType.Error,
    message: `error message`
  }
);
```

### Extending an already existing error
```javascript
var extendedError = new CFError(
  {
    type: ErrorType.Error,
    message: `extended error message`,
    cause: error
  }
);
```

### Predefine Error Types
#### Http Errors
All http errors are available.
They will contain a field name 'statusCode' for your use.
```javascript
var error = new CFError(
  {
    type: ErrorType.BadRequestError,
    message: `failed to validate your request`
  }
);
```
Then your express error middleware can look something like this:
```javascript
app.use(function(err, request, response, next){
    console.error(err.stack);
    var statusCode = 400;
    if (err.constructor && err.constructor.name === "CFError") { 
        statusCode = err.statusCode || statusCode;
    }
    return response.status(statusCode).send(err.message);
});
```
#### Node Errors
All node.js core errors are also available

### Extending with your own errors
In order to load your own errors you need to load them.
```javascript
var errors = 
[
 {
  "name": "YourOwnError,
  "message": "default message,
  "field": "value
 },
 {
  "name": "YourOwnError1,
  "message": "default message,
  "field": "value
 }
];
CFErrors.loadErrors(errors);
```
From this point these errors will be available to use.
```javascript
var error = new CFError(
  {
    type: ErrorType.YourOwnError,
    message: `will override default message`,
    cause: error
  }
);
```
Every field declared in the object will be also accessible
```javascript
console.log(error.field);
```

### Printing the stack
will print the stack of all previous errors too
```javascript
console.log(extendedError.stack);
```
### toString()
will print a the whole chain of errors

### Adding extra information to the error
When constructing an error you can pass an additional field named 'extra' which can hold additional information releated to the current context. this information will be printed as part of the stack or the toString method.
```javascript
var error = new CFError(
  {
    type: ErrorType.YourOwnError,
    message: `will override default message`,
    cause: error,
    extra: {extraField: "value"}
  }
);
```

### Inheriting the previous error type
In order to be able to extend the previous error with more data without affecting the type of the error is possible using the Inherited error type
```javascript
var extendedError = new CFError(
  {
    type: ErrorType.Inherit,
    message: `extended error message`,
    cause: error
  }
);
```

### Signifying an error as a recognized error
Sometimes it is important to be able to differentiate between an error that is recognized and between an un-recognized error.
For example in case your api receives a request that has a missing parameter you would like to create an error but not report it back to your monitoring systems like new-relic.
Then in your error middleware you can check if the error has been recognized and act accordingly and not report this error to your monitoring systems.
```javascript
var extendedError = new CFError(
  {
    type: ErrorType.Inherit,
    message: `extended error message`,
    cause: error,
    recognized: true
  }
);
```
Then you can check if the error is recognized:
```javascript
if (error.isRecognized()){
  //Your code
}
```
The default return value of isRecognized function will be false.
Signifying an error as a recognized error will affect the whole chain of errors and will be inherited.
This also means that you can signify a higher error explicitly with the value false which will then make the isRecognized function return false.

### Using recognized errors to report to external systems
If you are marking errors as recognized you can use it to decide if you should send the generated error to monitoring system. <br/>
If you are using express.js your error middleware can look something like this:
```javascript
app.use(function(err, request, response, next){
    console.error(err.stack);
    var statusCode = 400;
    if (err.constructor && err.constructor.name === "CFError") { 
        statusCode = err.statusCode || statusCode;
       if (!err.isRecognized()){
          //report to external system. like new-relic
        }
    }
    else {
      //report to external system. like new-relic
    }
    return response.status(statusCode).send(err.message);
});
```

