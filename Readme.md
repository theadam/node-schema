#Schema
A simple way to build javascript schemas for validating objects.

###Installation
`npm install node-schema`

###Schemas
node-schema focuses on simplicity and flexibility.  Its great when you need ease of use,
custom validation functions, or custom messages returned from validation.

A compiled schema is just an object with a validate function with this signature:

```javascript
function(value, object, options){
  // Value is the data being validated, object
  // is the object that contains the value,
  // and options is an object passed to the validate
  // function that contains any special options.

  // Returns the result of the validation,
  // usually an object or an array of errors.
  // Returns null if the value is valid.
}
```

In order to compile a schema, you just use the schema function.  

Schemas can be used to validate simple values.

```javascript
var Schema = require('node-schema');
var str = require('string-validator');

var valueSchema = Schema({
  'must have at least 5 characters': str.isLength(5),
  'can only contain numbers and letters': str.matches(/^[a-zA-Z0-9]*$/)
});

valueSchema.validate(''); //=> [ 'must have at least 5 characters' ]
valueSchema.validate('myUser?'); //=> [ 'can only contain numbers and letters' ]
valueSchema.validate('myValidUser'); //=> null
```

In value schemas, the keys are messages and the values are simple validating functions.
This means that it is very easy to create custom validations.

```javascript
var valueSchema = Schema({
  'must have at least 5 characters': function(value){
    return value.length >= 5;
  },
  'can only contain numbers and letters': function(value){
    return /^[a-zA-Z0-9]*$/.test(value);
  })
});

valueSchema.validate(''); //=> [ 'must have at least 5 characters' ]
valueSchema.validate('myUser?'); //=> [ 'can only contain numbers and letters' ]
valueSchema.validate('myValidUser'); //=> null
```

The validating functions take 3 arguments
* __value__: the value to validate
* __object__: the object containing the value
* __options__: the options passed to the validate function

The real power comes in, however with object schemas.

```javascript
var userSchema = Schema({
  username: {
    'must have at least 5 characters': str.isLength(5),
    'can only contain numbers and letters': str.matches(/^[a-zA-Z0-9]*$/)
  }
});

userSchema.validate({username: ''}); //=> { username: [ 'must have at least 5 characters' ] }
userSchema.validate({username: 'myUser?'}); //=> { username: [ 'can only contain numbers and letters' ] }
userSchema.validate({username: 'myValidUser'}); //=> null
```

Validating functions can use the object argument to check the value of sibling fields.

```javascript
var passwordSchema = Schema({
  password: {
    'must contain at least 5 characters': str.isLength(5)
  },
  passwordCheck: {
    'must match password': function(value, object){
      return value == object.password;
    }
  }
});

passwordSchema.validate({
  password: 'tough',
  passwordCheck: 'weak'
}); //=> { passwordCheck: [ 'must match password' ] }
```

Schemas can also be nested

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
});/* =>
{
  user: {
    username: [ 'can only contain numbers and letters' ]
  },
  post: [ 'must contain between 25 and 500 characters' ]
}
*/
```



A compiled schema is just an object with a validate function with this signature:

```javascript
function(value, object, options){
  // Value is the data being validated, object
  // is the object that contains the value,
  // and options is an object passed to the validate
  // function that contains any special options.

  // Returns the result of the validation,
  // usually an object or an array of errors.
  // Returns null if the value is valid.
}
```

###Middleware
node-schema supports custom middleware to modify the way that schemas work

A good example is the builtin Field.optional middleware.

By default, all fields are required; if undefined, the validation returns an error that
states that the field is required.  using Field.optional, and field can be made an optional
field.  If it is defined, it is validated with the schema, if it doesn't there will not be any
error messages returned.

```javascript
var Field = Schema.Field;

var maybeSchema = Schema({
  maybe: Field.optional({
    'must be at least 5 characters long': str.isLength(5)
  })
});

maybeSchema.validate({}); //=> null
maybeSchema.validate({maybe: 'bad'}); //=> { maybe: [ 'must be at least 5 characters long' ] }
```

Another builtin allows you to provide custom field names that will be output in the
validation messages.

```javascript
var userSchema = Schema({
  username: Field.name('Username', {
    '{name} must have at least 5 characters': str.isLength(5),
    '{name} can only contain numbers and letters': str.matches(/^[a-zA-Z0-9]*$/)
  })
});

userSchema.validate({username: ''}); //=> { username: [ 'Username must have at least 5 characters' ] }
userSchema.validate({username: 'myUser?'}); //=> { username: [ 'Username can only contain numbers and letters' ] }
userSchema.validate({username: 'myValidUser'}); //=> null
```

Custom middleware can also be created with the Field.createMiddleware function.

A good example of how to do this, is the source for the Field.optional function.

```javascript
Field.optional = Field.createMiddleware(function(value, object, options, next){
  if(value === undefined){
    return null;
  }
  return next();
});
```

The next function is what would be returned if this middleware function never existed.
returning next() will just make a noop middleware function.  The optional function, however,
returns null if the value is undefined, and the normal validation result if defined.

###License (MIT)

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
