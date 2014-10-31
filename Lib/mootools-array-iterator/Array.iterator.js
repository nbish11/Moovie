/*
---

script: Array-iterator.js
description: Advanced array iteration.
license: MIT-style license.
authors:
    - Sergei Tarassov
requires:
core/1.3: '*'
provides:
    - Array.iterator
    - Iterator
    - Iterator.ref
    - Iterator.range
    - Iterator.key
    - Iterator.rewind
    - Iterator.reset
    - Iterator.prev
    - Iterator.next
    - Iterator.end
    - Iterator.slide
    - Iterator.valid

...
*/

(function () {
    // Iterator private utilites
    var Util = {
        uid : Date.now(),
        getUniqueId : function () {
            return (this.uid++).toString(36);
        },
        Data: {},
        getData: function(key) {
            return this.Data[key];
        },
        setData: function(key, value) {
            return this.Data[key] = value;
        }
    };
    
    // Iterator Class
    var Iterator = new Class({
        // Settings
        Implements: [Options],
        
        options: {
            // Force null-exit from iteration after last or before first index.
            pit: false,
            
            // Force limit iterator movement after last or before first index.
            limits: false,
            
            // Minimum allowed index.
            // min int,
            // Maximum allowed index.
            // max int,
            // Indexes in pass option will not be iterated.
            pass:[],
            
            // Allow ability to chain method calls of movement
            chains:false
        },
        
        // Constructor
        initialize: function (ref, options) {
            this.setOptions(options);
            
            // Unique ID.
            var getUid = function (uid) {
                return uid;
            }.pass([Util.getUniqueId()]);
            
            // Link to same instance of array.
            this.ref = function () {
                return this;
            }.bind(ref);
            
            // Position Setter
            this.jump = function (key) {
                // check key & move pointer
                key = Util.setData(getUid(), this.valid(key));
                return (this.options.chains) ? this : this.current(key);
            };
            
            // Position Getter
            this.key = function () {
                var uid = getUid(), key = this.valid(Util.getData(uid));
                return Util.setData(uid, key);
            };
            
            // Prepare ranges
            with (this.options) {
                min = [this.options.min, 0].pick();
                max = [this.options.max, ref.length-1].pick();
            }
        },
        
        // key validator
        valid: function () {
            // base checks
            var length = this.ref().length;
            var key = (arguments.length>0) ? Number.from(arguments[0]) : this.key();
            
            // empty array or key checks
            if (key === null || length === 0) return null;
            
            // Negative to positive
            if (key < 0) key = this.ref().length+key;
            
            // limits checks
            if (key<0 || key > length-1) return null;
            
            // pass range checks
            if (this.options.pass.indexOf(key)>-1) return null;
            
            // complex range checks
            var range = function(side){ return (typeof side !== 'number') ? null : side.limit(0, length);}
            var min = range(this.options.min), max = range(this.options.max);
            if ((min && key < min)||(max && key > max)) return null;
            
            return key;
        },
        
        // move cursor to minimal allowed position
        reset: function () {
            var range = this.range(1), key = (range.length) ? range[0] : null;
            return this.jump(key);
        },
        
        // Move cursor out, to null
        rewind: function (){
            return this.jump(null);
        },
        
        // Move cursor to maximum allowed position
        end: function (){
            var range = this.range(1), key = (range.length) ? range.pop() : null;
            return this.jump(key), this.current(key);
        },
        
        // Move cursor next
        next: function () {
            return this.slide(1);
        },
        
        // Move cursor back
        prev: function (){
            return this.slide(-1);
        },
        
        // Return selected array value
        current: function (key){
            key = (key === void 0) ? this.key() : this.valid(key);
            return (key === null) ? null : this.ref()[key];
        },
        
        // Move with offset back or forward [,from index]
        slide: function (offset, from) {
            var range = this.range(1).invoke('toInt'),
                key = [Number.from(from),this.key()].pick(),
                offset = Number.from(offset);
                
            var limit = this.options.limits,
                pit = this.options.pit,
                pass = this.options.pass;
            
            // Exit with null result if: range or offset is invalid, no way to move pointer.
            if (!range.length||offset===null||(limit&&key===null&&offset<0)) return this.jump(null);
            if (offset===0) return this.current();
            if (pit) range.unshift(null);
            var max = range.length-1;
            
            // Move cursor from not existing index (null)
            if (key===null) {
                key = (pit) ? 1 : 0;
                if (limit) offset--, key = (pit) ? 1 : 0;
                else if (offset<0) offset++, key = max;
                else offset--;
            } else
                key = range.indexOf(key);
                
            // Reduce offset
            if (!pit && !limit && offset.abs() >= range.length) offset = offset%range.length;
            
            // Move key
            key = key + offset;
            
            // if key is out of range
            var more = key > max, less = key < 0;
            if (more || less) {
                if (pit&&limit) key = null;
                else if (more) key = (limit) ? max : key-max-1;
                else if (less) key = (limit) ? 0 : key+max+1;
            }
            
            return this.jump(range[key]);
        },
        
        // Return range
        range: function () {
            var array = this.ref(), length = array.length-1, keys = Object.keys(array), public=!arguments[0];
            
            with (this.options) {
                if (length<0) return []; // empty array ~ empty range
                pass=Array.from(pass).invoke('toString');
                [min,max].each(function(edge){[Number.from(edge),0].pick().limit(0,length)});
                range = (min>max) ? keys.slice(0,max.toInt()+1).combine(keys.slice(min,max+1)) : keys.slice(min, max+1);
                if (pass.length>0) pass.each(function(el){range=range.erase(el);});
                if (public) range = range.map(function(index){return array[index];});
                return range;
            }
        }
    });
    
    Array.implement({
        iterator: function (options) {
            return new Iterator(this, options);
        }
    });
})();