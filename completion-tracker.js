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
	    console.log(`Unsupported tracktype ${trackTypeProp} for tag ${tag}...assuming "hold"`)
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
function CompletionTracker(tagSpecs=null, startTracking=true) {
    EventEmitter.call(this);
    this._tagSpecs = {};  // will look like: { a : {trackType : 'hold'}
    this._tags = {};    // will look like: { a : {thing : <thing>, count : <count> } }
    this._complete = false;
    this._startTracking = false;
    this.setTagSpecs(tagSpecs, startTracking);
}

CompletionTracker.prototype.setTagSpecs = function(tagSpecs, startTracking) {
    console.log(`tagSpecs: ${JSON.stringify(tagSpecs, null, 2)}`)
    if (tagSpecs === false   // if 'false' passed on 1st argument, assumed to be startTracking
	|| tagSpecs === null
	|| typeof tagSpecs === 'undefined') {
	// this.setTagSpecs(null, false);
	this._startTracking = false;  // ignore tagspecs
    // } else {
    // 	if (tagSpecs === null) {
    // 	    this._startTracking = startTracking;  // ignore tagspecs
    } else if (Array.isArray(tagSpecs)) {
	tagSpecs.forEach(
	    (spec) => {
		if (typeof spec === 'string' && validTag(spec)) {
		    this._tagSpecs[spec] = {tag : spec, trackType: 'hold', opts : {} };
		    this._tags[spec] = {things : [], count : 0 }
		} else if (typeof spec === 'object') {
		    var tag = spec.tag;
		    if (validTag(tag)) {
			this._tagSpecs[tag] = normalizeTagSpec(tag, spec)
			this._tags[tag] = {things : [], count : 0 }
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
		    this._tagSpecs[tag] = normalizeTagSpec(tag, spec)
		    // this._tags[tag] = {thing : null, count : 0 }
		    this._tags[tag] = {things : [], count : 0 }
		} else {
		    console.log('Property %s of tagSpec object not an object', tag);
		}
	    });
    }
    this._startTracking = startTracking === false ? false : true;
}

util.inherits(CompletionTracker, EventEmitter);

// Post to the CompletionTracker for a particular tag
CompletionTracker.prototype.post = function(tag, thing, action) {
    var spec = this._tagSpecs[tag];
    if (spec) {
	var trackType = validTrackType(action) ? action : spec.trackType;  // enable tracktype override
	if (trackType === 'hold') {
	    this._tags[tag].things[0] = thing;
	    this.emit('post', {
		emitter : this,
		tag : tag,
		msg : "Held post to " + tag + " (" + thing.length + ")"});
	} else if (trackType === 'count') {
	    this._tags[tag].count++;
 	    this.emit('post', {
		emitter: this,
		tag : tag,
		msg : "Counted ["
		    + this._tags[tag].count
		    + "] post(s) to " + tag + " ("
		    + thing.length + ")"});
	} else if (trackType === 'coll') {
	    this._tags[tag].count++;
	    this._tags[tag].things.push(thing);
	    this.emit('post', {
		emitter : this,
		tag : tag,
		msg : "Collected ["
		    + this._tags[tag].count
		    + "] post(s) to " + tag + " ("
		    + thing.length + ")"});
	}
	if (this.tagsAreSatisfied()) {
	    this.setComplete();
	}
    } else {
	this.emit('invalidTag', { emitter : this, tag : tag, msg : `Invalid tag ${tag} (Length: ${thing.length})`});
    }
};

CompletionTracker.prototype.setComplete = function setComplete() {
    if (this._complete) {return;}
    else {
	this._complete = true;
	this.emit('complete', {
	    emitter : this,
	    msg : 'CompletionTracker has received all things'});
    }
}

CompletionTracker.prototype.startTracking = function startTracking() {
	this._startTracking = true;
}

// Check if all sets have been collected
CompletionTracker.prototype.tagsAreSatisfied = function tagsAreSatisfied() {
    if (this._startTracking) {
	for (let tag in this._tagSpecs) {
	    let spec = this._tagSpecs[tag];
	    let trackType = spec.trackType;

	    if (trackType === 'hold') {
		if (this._tags[tag].things.length < 1) {
		    return false;
		}
	    } else if ( trackType === 'count' ) {
		var reqd = spec.opts.reqd;
		if (this._tags[tag].count < reqd ) {
		    return false;
		}
	    } else if ( trackType === 'coll' ) {
		var reqd = spec.opts.reqd;
		if (this._tags[tag].count < reqd ) {
		    return false;
		}
	    }
	}
	return true;
    } else {
	return false;
    }
}

// Returns the thing 'held' for particular tag (if any)
CompletionTracker.prototype.thing = function(tag) {
    if (tag in this._tags) {
	let trackType = this._tagSpecs[tag].trackType;
	if (trackType === 'hold') {
	    return [this._tags[tag].things[0] ];
	} else { return this._tags[tag].things; }
    } else {
	return null;
    }
};

// Returns the things 'held' or 'collected' for particular tag
CompletionTracker.prototype.things = function(tag) {
    if (tag in this._tags) {
	return this._tags[tag].things;
    } else {
	return null;
    }
};

// Returns the value of the counter for a particular tag
CompletionTracker.prototype.count = function(tag) {
    if (tag in this._tags) {
	return this._tags[tag].count;
    } else {
	return null;
    }
};

CompletionTracker.prototype.tags = function() {
    return Object.keys(this._tags)
}

module.exports = CompletionTracker;
