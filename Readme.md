#Schema
A simple way to build javascript schemas for validating objects.

###Installation
`npm install node-schema`

###Schemas
node-schema focuses on simplicity and flexibility.  Its great when you need ease of use,
custom validation functions, or custom messages returned from validation.

Schemas can be used in node or in the browser (using something like browserify).

####Basic Usage
Schemas can be used to validate simple values.

```javascript
var Schema = require('node-schema');
var str = require('string-validator');

var valueSchema = Schema({
  'must have at least 5 characters': str.isLength(5),
  'can only contain numbers and letters': str.matches(/^[a-zA-Z0-9]*$/)
});

valueSchema.validate('').then(function(errors){
  // errors => [ 'must have at least 5 characters' ]
});
valueSchema.validate('myUser?').then(function(errors){
  // errors => [ 'can only contain numbers and letters' ]
});
valueSchema.validate('myValidUser').then(function(errors){
  // errors => null
});
```

In value schemas, the keys are messages and the values are simple validating functions.
This means that it is very easy to create custom validations.

The validating functions take 3 arguments:
* __value__: the value to validate
* [__options__]: the options passed to the validate function
* [__object__]: the object containing the value

```javascript
var valueSchema = Schema({
  'must have at least 5 characters': function(value){
    return value.length >= 5;
  },
  'can only contain numbers and letters': function(value){
    return /^[a-zA-Z0-9]*$/.test(value);
  })
});

valueSchema.validate('').then(function(errors){
  // errors => [ 'must have at least 5 characters' ]
});
valueSchema.validate('myUser?').then(function(errors){
  // errors => [ 'can only contain numbers and letters' ]
});
valueSchema.validate('myValidUser').then(function(errors){
  // errors => null
});
```

Object schemas provide the ability to nest fields.

```javascript
var userSchema = Schema({
  username: {
    'must have at least 5 characters': str.isLength(5),
    'can only contain numbers and letters': str.matches(/^[a-zA-Z0-9]*$/)
  }
});

userSchema.validate({username: ''}).then(function(errors){
  // errors => { username: [ 'must have at least 5 characters' ] }
});
userSchema.validate({username: 'myUser?'}).then(function(errors){
  // errors => { username: [ 'can only contain numbers and letters' ] }
});
userSchema.validate({username: 'myValidUser'}).then(function(errors){
  // errors => null
});
```

Validating functions can use the object argument to check the value of sibling fields.

```javascript
var passwordSchema = Schema({
  password: {
    'must contain at least 5 characters': str.isLength(5)
  },
  passwordCheck: {
    'must match password': function(value, options, object){
      return value == object.password;
    }
  }
});

passwordSchema.validate({
  password: 'tough',
  passwordCheck: 'weak'
}).then(function(errors){
  // errors => { passwordCheck: [ 'must match password' ] }
});
```

Schema objects can be nested inside object schemas.

```javascript
var postSchema = Schema({
  user: userSchema,
  post: {
    'must contain between 25 and 500 characters': str.isLength(25, 500)
  }
});

postSchema.validate({
  post: 'this is my first post',
  user: {
    username: 'invalid?'
  }
}).then(function(errors){
  /* errors =>
  {
    user: {
      username: [ 'can only contain numbers and letters' ]
    },
    post: [ 'must contain between 25 and 500 characters' ]
  }
  */
});
```

####Advanced Usage
#####Required Fields
By default, all fields are required.  The error message on missing fields
can be changed globally or on a field by field basis.

```javascript
var requiredSchema = Schema({
  required: {'must contain at least 5 characters': str.isLength(5)}
});

// default
requiredSchema.validate({}).then(function(errors){
  // errors => {required: ['is required']}
});

// global change (using options)
requiredSchema.validate({}, {isRequiredMessge: 'must exist'})
.then(function(errors){
  // errors => {required: ['must exist']}
});

var Field = Schema.Field;
// per field
requiredSchema = Schema({
  required: Field.required('is a required field', {
    'must contain at least 5 characters': str.isLength(5)
  })
});

requiredSchema.validate({}).then(function(errors){
  // errors => {required: ['is a required field']}
});
```

#####Optional Fields
Fields can be made optional

```javascript
var Field = Schema.Field;

var maybeSchema = Schema({
  maybe: Field.optional({
    'must contain at least 5 characters': str.isLength(5)
  })
});

maybeSchema.validate({}).then(function(errors){
  // errors => null
});

maybeSchema.validate({maybe: '1234'}).then(function(errors){
  // errors => {maybe: ['must contain at least 5 characters']}
});
```

#####Asynchronous Validation
A promise can be returned from a validation function for asynchronous validation.

```javascript
var fs = require('fs');

var asynchronousSchema = Schema({
  file: {
    'file must exist': function(file){
      return new Promise(function(resolve){
        fs.exists(file, resolve);
      });
    }
  }
});
```

###License (MIT)

```
MIT License
Copyright (c) 2014 Adam Nalisnick

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
