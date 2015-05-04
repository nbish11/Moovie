(function () {
    'use strict';
    
    var equals = function equals(first, second) {
        if (first !== second) {
            var type = typeOf(first);
            var every = Array.every;
            
            // jshint eqeqeq:false
            if (type != typeOf(second)) {
                return false;
            }
            
            switch (type) {
                case 'string':
                case 'regexp':
                    return String(first) == String(second);
                    
                case 'date':
                    return first.getTime() == second.getTime();
                
                case 'arguments':
                    first = Array.from(first);
                    second = Array.from(second);
                
                /* falls through */
                case 'object':
                    every = Object.every;
                
                /* falls through */
                case 'array':
                case 'object':
                case 'arguments':
                    if (Object.getLength(first) != Object.getLength(second)) {
                        return false;
                    }
                    
                    return every(first, function (value, i) {
                        return (i in second) && equals(value, second[i]);
                    });
            }
        }
        
        return true;
    };
    
    // Speed up calls to hasOwnProperty
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    
    var isEmpty = function isEmpty(obj) {
        if (obj == null) { return true; }
        if (obj.length > 0) { return false; }
        if (obj.length === 0) { return true; }

        // Otherwise, does it have any properties of its own?
        // Note: this doesn't handle toString and valueOf enumeration bugs in IE < 9
        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                return false;
            }
        }

        return true;
    };

    beforeEach(function () {
        jasmine.addMatchers({
            
            // expect(new Audio).toBeAnInstanceOf(HTMLAudioElement);
            // expect(4).not.toBeAnInstanceOf(String);
            toBeAnInstanceOf: function () {
                return {
                    compare: function (actual, expected) {
                        return {
                            pass: instanceOf(actual, expected)
                        };
                    }
                };
            },
            
            // expect(1).toBeA('integer');
            // expect(new Element('div')).toBeA('div');
            // expect('hello').not.toBeA('function');
            toBeA: function () {
                return {
                    compare: function (actual, expected) {
                        var isElement = document.id(actual);
                        var type = typeOf(actual);
                        var passed = false;
                        
                        if ((isElement && expected === 'element') || (type === 'string' && expected === 'string')) {
                            passed = true;
                        } else if (isElement) {
                            passed = isElement.get('tag') === expected;
                        } else {
                            passed = type === expected;
                        }
                        
                        return {
                            pass: passed
                        };
                    }
                };
            },
            
            // expect({}).toBeEmpty();
            // expect([1,2,3]).not.toBeEmpty();
            toBeEmpty: function () {
                return {
                    compare: function (actual) {
                        return {
                            pass: isEmpty(actual)
                        };
                    }
                };
            },
            
            // expect({ test: 1 a: 2}).toHaveKeys(['test', 'a']);
            // expect({ a: 4, b: 5 }).not.toHaveKeys([4, 5]);
            toHaveKeys: function () {
                return {
                    compare: function (actual, expected) {
                        return {
                            pass: expected.every(function (key) {
                                return (key in actual);
                            })
                        };
                    }
                };
            },
            
            // expect('myElement').getAttributes.toMatch();
            toHaveAttributesAndValues: function () {
                return {
                    compare: function (actual, expected) {
                        actual = document.id(actual);
                        var attributes = {};

                        Array.from(actual.attributes).each(function (attr) {
                            attributes[attr.name] = attr.value;
                        });
                        
                        return {
                            pass: equals(attributes, expected)
                        };
                    }
                };
            }
        });
    });
})();
