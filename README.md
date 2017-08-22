# completion-tracker.js

## Description

The completion-tracker is a publish-subscribe mechanism which tracks
'posts' to a defined set of tags, emitting a 'post' event as each post
is registered and a 'complete' event when the completion requirements
for all tags have been satisfied.  The motivation for creating this
class is to track completion of asynchronous tasks, hence the name.

For each tag, two (2) types of tracking (trackTypes) are supported -
"hold" and "count" - which are specified as part of the configuration
object passed during instantiation.

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


### Instantiate tracker.

    var trackster = new CompletionTracker(tagSpecs);

#### Specification for tracking 'posts' to a defined/labeled set of tags

Suppose we want to be notified when (3) three tasks - 'a', 'b',
and 'c' - have completed.  Since trackType is 'hold' by default, we
can use a shorthand specification:

    tagSpecs = ['a', 'b', 'c'];

Or, equivalently, use array of objects.  Each object must include
'tag' property. The opts property is not used for 'hold' tracking and so
is optional and ignored, if present;

    tagSpecs = [
        { tag : 'a', trackType : 'hold', opts : {} },
        { tag : 'b', trackType : 'hold', opts : {} }
        { tag : 'c', trackType : 'hold', opts : {} }
    ];

Or as dictionary of objects.

    tagSpecs = {
        a : { trackType : 'hold', opts : {} },
        b : { trackType : 'hold', opts : {} }
        c : { trackType : 'hold', opts : {} }
    };

The completion-tracker will emit a 'complete' event when at least one
post has been registered for every tag.

#### Specification for tracking completion of labeled group(s) of tasks. 

When tracking with a 'count' trackType, we must include 'opts'
property with 'reqd' property.

    tagSpecs = {
            a : { trackType : 'count', opts : {reqd : 3 } },
            b : { trackType : 'count', opts : {reqd : 5 } },
            c : { trackType : 'count', opts : {reqd : 20} }
        };


A 'complete' event will be emitted when the number of posts required
for each tag (specified by the 'reqd' argument) has been registered.

### Subscribe to desired events.

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

    trackster.post(<tag>, <thing> [, <action> ] )

The first argument (tag) is the name of the tag to which we are
posting.  The second argument (thing) is an arbitrary value which will
be 'held' if the trackType is 'hold'.  The third argument (action) is
optional.  If present, should be a valid trackType.  It can be
used to override the trackType specified for that tag during
instantiation.

For example, the following loops will register the posts needed to
meet the 'complete' requirements of the three tag sets specified by
tagSpecs.

    for (i = 0; i < 3;  i++) {trackster.post('a', "This is A number " + i )};
    for (i = 0; i < 5;  i++) {trackster.post('b', "This is B number " + i )};
    for (i = 0; i < 20; i++) {trackster.post('c', "This is C number " + i )};

### Query the Completion Tracker

    trackster.thing(<tag>) // returns the thing, if any, stored for the specified tag.

    trackster.count(<tag>) // returns the count, if any, stored for the specified tag.

