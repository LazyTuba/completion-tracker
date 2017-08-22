const EventEmitter = require('events').EventEmitter;
const util = require('util');


// Predicate function to validate tag value
function validTag (tag) {
    return typeof tag === 'string';
}

// Predicate function to validate trackType value
function validTrackType (type) {
    var trackTypes = {'hold' : 1, 'count' : 1};
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
	if (nrmlSpec.trackType === 'count') {
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

    if (Array.isArray(tagSpecs)) {
	tagSpecs.forEach(
	    (spec) => {
		if (typeof spec === 'string' && validTag(spec)) {
		    this.tagSpecs[spec] = {tag : spec, trackType: 'hold', opts : {} };
		    this.tags[spec] = {thing : null, count : 0 }
		} else if (typeof spec === 'object') {
		    var tag = spec.tag;
		    if (validTag(tag)) {
			this.tagSpecs[tag] = normalizeTagSpec(tag, spec)
			this.tags[tag] = {thing : null, count : 0 }
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
		    this.tags[tag] = {thing : null, count : 0 }
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
	var trackType = validTrackType(action) ? action : spec.trackType;  // override type
	if (trackType === 'hold') {
	    this.tags[tag].thing = thing;
	    this.emit('post', "Held post to " + tag + " (" + thing.length + ")");
	} else if (trackType === 'count') {
	    this.tags[tag].count++;
	    this.emit('post', "Counted ["
		      + this.tags[tag].count
		      + "] post(s) to " + tag + " ("
		      + thing.length + ")");
	}
	if (this.isComplete()) {
	    this.emit('complete', 'CompletionTracker has received all things');
	}
    } else {
	this.emit('invalidTag', "(" + thing.length + ") " + tag);
    }
};

// Check if all sets have been collected
CompletionTracker.prototype.isComplete = function isComplete() {
    resp = true;
    for (var tag in this.tagSpecs) {
	var spec = this.tagSpecs[tag]
	var trackType = spec.trackType;
	if (trackType === 'hold') {
	    if (this.tags[tag].thing == null) {
		resp = false;
		return resp;
	    }
	} else if (trackType === 'count') {
	    var reqd = spec.opts.reqd;
	    if (this.tags[tag].count < reqd ) {
		resp = false;
		return resp;
	    }
	}
    }
    return resp;
}

// Returns the thing 'held' for particular tag (if any)
CompletionTracker.prototype.thing = function(tag) {
    if (tag in this.tags) {
	return this.tags[tag].thing;
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
