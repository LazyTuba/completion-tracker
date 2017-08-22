# completion-tracker.js

## Description

CompletionTracker is a publish-subscribe mechanism which tracks
'posts' to a defined set of tags, emitting a 'post' event as each
post is registered and a 'complete' event when the completion
requirements for all tags have been satisfied.  The motivation for
creating this class is to track completion of asynchronous tasks,
hence the name.  For each tag, two (2) types of tracking (trackTypes)
are supported - "hold" and "count" - which are specified as part of
the configuration object passed during instantiation.

If 'hold' is the trackType specified for a tag, the 'thing' argument
of post to that tag is held by the Tracker - i.e., assigned as the
value of the 'thing' property of the object assigned to that tag on
the Tracker's 'tags' object.  A 'hold' task is deemed 'complete' when
a single post is registered.

If 'count' is the trakType specified for a tag, posts to that tag are
counted - i.e., the 'count' property of the object assigned to that
tag on the Tracker's 'tags' object is incremented (and the 'thing'
argument of the post call is ignored).  A 'count' task is deemed
complete when the count reaches the value of the 'reqd' option
specifed during instantiation.

## Usage

Require the module.

    var CompletionTracker = require('completion-tracker');


### Configure for tracking 'posts' to a defined/labeled set of tags

Track three (3) tasks with array of tag names ('a', 'b', 'c' for
simplicty).  Simple shorthand when trackType for all tasks is 'hold'.

    tagSpecs = ['a', 'b', 'c'];

Equivalently, use array of objects.  Must include 'tag' property. Opts
property not used for 'hold' tracking and so is ignored, if present;

    tagSpecs = [
        { tag : 'a', trackType : 'hold', opts : {} },
        { tag : 'b', trackType : 'hold', opts : {} }
        { tag : 'c', trackType : 'hold', opts : {} }
    ];

Or as object of objects.

    tagSpecs = {
        a : { trackType : 'hold', opts : {} },
        b : { trackType : 'hold', opts : {} }
        c : { trackType : 'hold', opts : {} }
    ];

A 'complete' event will be emitted when when every tag has registered
at least one post.

### Configure for counting completion of labeled group(s) of tasks. 

If tracking with a 'count' trackType, must include 'opts' property with 'reqd' property.

    tagSpecs = [
            a : { trackType : 'count', opts : {reqd : 3 } },
            b : { trackType : 'count', opts : {reqd : 5 } }
            c : { trackType : 'count', opts : {reqd : 20} }
        ];


A 'complete' event will be emitted when the number of posts required
for each tag has been registered.

### Instantiate and subscribe to desired events.

    var trackster = new CompletionTracker(tagSpecs);

    trackster.on('post', function onPost(ev) {
        console.log('Post: %s', ev);
    })

    trackster.on('invalidTag', function onInvalidTag(ev) {
        console.log('Ignored attempt to post thing for invalid tag %s', ev);
    })

    trackster.on('complete', function onComplete(ev) {
        console.log('Complete: %s', ev);
        console.log(JSON.stringify(trackster.tags, null, 2));
    })

### Post to tracked tags.

Post call takes three arguments:

    trackster.port(<tag>, <thing> [, <action> ] )

The first argument (tag) is the name of the tag to which we are
posting.  The second argument (thing) is an arbitrary value which will
be 'held' if the trackType is 'hold'.  The third argument (action) is
optional.  If present, should be a valid trackType.  It can be
used to override the trackType specified or that tag during
instazntiation.

For example:

    for (i = 0; i < 3;  i++) {trackster.post('a', "This is A number " + i )};
    for (i = 0; i < 5;  i++) {trackster.post('b', "This is B number " + i )};
    for (i = 0; i < 20; i++) {trackster.post('c', "This is C number " + i )};

### Query the Completion Tracker

    trackster.thing(<tag>) // returns the thing, if any, stored for the specified tag.

    trackster.count(<tag>) // returns the count, if any, stored for the specified tag.

