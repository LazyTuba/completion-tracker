# completion-tracker.js

## Description

Track completion of async tasks and task sets

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

The 'count' trackType can be used when one wants to count the posts
made to one or more tags and be notified when every tag has received
its required number of posts.

When tracking with a 'count' trackType, we must include 'opts'
property with 'reqd' property.

    tagSpecs = {
            a : { trackType : 'count', opts : {reqd : 3 } },
            b : { trackType : 'count', opts : {reqd : 5 } },
            c : { trackType : 'count', opts : {reqd : 20} }
        };


A 'complete' event will be emitted when the number of posts required
for each tag (specified by the 'reqd' argument) has been registered.

#### Specification for collecting results of labeled group(s) of tasks. 

The 'coll' (collect) trackType is similar to the 'count' trackType
with the additional feature that it 'collects' the posted objects as an
array that can be retrieved upon completion.

Like the 'count' trackType, when tracking with a 'coll' trackType, we
must include 'opts' property with 'reqd' property.

    tagSpecs = {
            a : { trackType : 'coll', opts : {reqd : 3 } },
            b : { trackType : 'coll', opts : {reqd : 5 } },
            c : { trackType : 'coll', opts : {reqd : 20} }
        };


A 'complete' event will be emitted when the number of posts required
for each tag (specified by the 'reqd' argument) has been registered.

### Subscribe to desired events.

The handler function specified for 'post' events will be called with
two (2) arguments - the tag, and a generic message.
    
    trackster.on('post', function onPost(tag, msg) {
        console.log('Tag %s posted: %s', tag, msg);
    })

    trackster.on('invalidTag', function onInvalidTag(tag) {
        console.log('Ignored attempt to post thing for invalid tag %s', tag);
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
be 'held' if the trackType is 'hold', 'collected' (in array) if
trackType is 'coll'.  The third argument (action) is
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

    trackster.thing(<tag>)    // returns the thing, if any, stored for the specified tag.

    trackster.things(<tag>)   // returns the array of whatever has been
                              // 'held' or 'collected' for the specified tag.

    trackster.count(<tag>)    // returns the count, if any, stored for the specified tag.

