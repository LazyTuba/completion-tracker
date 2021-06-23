const EventEmitter = require('events').EventEmitter;
const util = require('util');


// Predicate function to validate tag value
function validTag (tag) {
    return typeof tag === 'string';
}

// Predicate function to validate trackType value
function validTrackType (type) {
    var trackTypes = {'hold' : 1, 'count' : 1, 'coll' : 1};
    return trackTypes[type];
}

// During instantiation, parses and normalizes the specification for each tag
function normalizeTagSpec(tag, spec) {
    if (typeof spec === 'string' && validTag(spec)) {
	return {tag : spec, trackType: 'hold', opts : {} };
    } else if (typeof spec === 'object') {
	var nrmlSpec = {opts : {}};  // normalized spec to be returned

	// derive tag
	var tagProp = spec.tag;
	if (typeof tagProp !== 'undefined' && tagProp !== tag) {
	    console.log('Tag/tagProp conflict for tag %s', tag)
	}
	nrmlSpec.tag = tag

	// derive trackType
	var trackTypeProp = spec.trackType;
	if (! validTrackType(trackTypeProp)) {
	    console.log('Unsupported tracktype %s ...assuming "hold"', trackTypeProp)
	    nrmlSpec.trackType = 'hold';
	} else {
	    nrmlSpec.trackType = trackTypeProp;
	}

	// tune options for trackType 'count'
	spec.opts = typeof spec.opts === 'object' ? spec.opts : {};  // make sure is object
	if (nrmlSpec.trackType === 'count' || nrmlSpec.trackType === 'coll') {
	    var reqdProp = spec.opts.reqd
	    nrmlSpec.opts.reqd = (typeof reqdProp === 'number' && reqdProp > 1) ? reqdProp : 1;
	}
	return nrmlSpec;
    } else {
	return null;
    }
}


// Constructor function for class
function CompletionTracker(tagSpecs) {
    EventEmitter.call(this);
    this.tagSpecs = {};  // will look like: { a : {trackType : 'hold'}
    this.tags = {};    // will look like: { a : {thing : <thing>, count : <count> } }
    this.complete = false;

    if (Array.isArray(tagSpecs)) {
	tagSpecs.forEach(
	    (spec) => {
		if (typeof spec === 'string' && validTag(spec)) {
		    this.tagSpecs[spec] = {tag : spec, trackType: 'hold', opts : {} };
		    this.tags[spec] = {things : [], count : 0 }
		} else if (typeof spec === 'object') {
		    var tag = spec.tag;
		    if (validTag(tag)) {
			this.tagSpecs[tag] = normalizeTagSpec(tag, spec)
			this.tags[tag] = {things : [], count : 0 }
		    } else {
			console.log('Invalid tag: %s', tag);
		    }
		} else {
		    console.log('Invalid tagSpec %s - should be a string or an object');
		}
	    });
    } else if (typeof tagSpecs === 'object') {
	var tags = Object.getOwnPropertyNames(tagSpecs);

	tags.forEach(
	    (tag) => {
		var spec = tagSpecs[tag];
		if (typeof spec === 'object') {
		    this.tagSpecs[tag] = normalizeTagSpec(tag, spec)
		    // this.tags[tag] = {thing : null, count : 0 }
		    this.tags[tag] = {things : [], count : 0 }
		} else {
		    console.log('Property %s of tagSpec object not an object', tag);
		}
	    });
    }
}

util.inherits(CompletionTracker, EventEmitter);

// Post to the CompletionTracker for a particular tag
CompletionTracker.prototype.post = function(tag, thing, action) {
    var spec = this.tagSpecs[tag];
    if (spec) {
	var trackType = validTrackType(action) ? action : spec.trackType;  // enable tracktype override
	if (trackType === 'hold') {
	    this.tags[tag].things[0] = thing;
	    this.emit('post', tag, "Held post to " + tag + " (" + thing.length + ")");
	} else if (trackType === 'count') {
	    this.tags[tag].count++;
	    this.emit('post', tag, "Counted ["
		      + this.tags[tag].count
		      + "] post(s) to " + tag + " ("
		      + thing.length + ")");
	} else if (trackType === 'coll') {
	    this.tags[tag].count++;
	    this.tags[tag].things.push(thing);
	    this.emit('post', tag, "Collected ["
		      + this.tags[tag].count
		      + "] post(s) to " + tag + " ("
		      + thing.length + ")");
	}
	if (this.tagsAreSatisfied()) {
	    this.setComplete();
	}
    } else {
	this.emit('invalidTag', tag, "(" + thing.length + ") " + tag);
    }
};

CompletionTracker.prototype.setComplete = function setComplete() {
    if (this.complete) {return;}
    else {
	this.complete = true;
	this.emit('complete', 'CompletionTracker has received all things');
    }
}

// Check if all sets have been collected
CompletionTracker.prototype.tagsAreSatisfied = function tagsAreSatisfied() {
    for (let tag in this.tagSpecs) {
	let spec = this.tagSpecs[tag];
	let trackType = spec.trackType;
	console.log(`Checking status - tag: ${tag} / trackType: ${trackType}`)
	// console.log(`tagsAreSatisfied trackType: ${trackType}`)

	if (trackType === 'hold') {
	    if (this.tags[tag].things.length < 1) {
		return false;
	    }
	} else if ( trackType === 'count' ) {
	    var reqd = spec.opts.reqd;
	    if (this.tags[tag].count < reqd ) {
		return false;
	    }
	} else if ( trackType === 'coll' ) {
	    var reqd = spec.opts.reqd;
	    if (this.tags[tag].count < reqd ) {
		return false;
	    }
	}
    }
    return true;
}

// Returns the thing 'held' for particular tag (if any)
CompletionTracker.prototype.postedTo = function(tag) {
    if (tag in this.tags) {
	let trackType = this.tagSpecs[tag].trackType;
	if (trackType === 'hold') {
	    return [this.tags[tag].things[0] ];
	} else { return this.tags[tag].things; }
    } else {
	return null;
    }
};

// Returns the things 'collected' for particular tag (if any)
CompletionTracker.prototype.things = function(tag) {
    if (tag in this.tags) {
	return this.tags[tag].things;
    } else {
	return null;
    }
};

// Returns the value of the counter for a particular tag
CompletionTracker.prototype.count = function(tag) {
    if (tag in this.tags) {
	return this.tags[tag].count;
    } else {
	return null;
    }
};

module.exports = CompletionTracker;
