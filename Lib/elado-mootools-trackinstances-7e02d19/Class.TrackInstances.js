/*
---

script: Class.Mutators.TrackInstances.js

description: Allows a class to track its instances by having instances array as a class property

license: MIT-style license

authors:
- Elad Ossadon ( http://devign.me | http://twitter.com/devignblog )

requires:
- core:1.2.4

provides: [Class.Mutators.TrackInstances]

...
*/

Class.Mutators.TrackInstances=function (allow) {
	if (!allow) return;

	// save current initialize method
	var oldInit=this.prototype.initialize;
	var klass=this;

	// overwrite initialize method
	klass.prototype.initialize=function () {
		(klass.instances=klass.instances || []).push(this);
		oldInit.apply(this,arguments);
	};
};
