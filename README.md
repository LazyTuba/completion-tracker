# completion-tracker.js

## Description

The completion-tracker module tracks completion of one/more
asynchronous tasks, or one/more sets of async tasks.

It's a publish-subscribe mechanism which tracks 'posts' to a defined
set of tags (aka 'tasks'), emitting a 'post' event as each post is
registered (or 'invalidTag' event if attempt to post to an invalid
tag) and a 'complete' event when the completion requirements for all
tags have been satisfied.

For each tag, three (3) types of tracking (trackTypes) are supported -
"hold", "coll" and "count" - which are specified as part of the
configuration object passed during instantiation.

If the trackType specified for a tag is 'count', posts to that tag are
not saved but simply counted - i.e., the 'count' property of the object
assigned to that tag on the Tracker's 'tags' object is incremented
(and the 'thing' argument of the post call is ignored).  A 'count'
task is deemed complete when the count reaches the value of the 'reqd'
option specified during instantiation.

If the trackType specified for a tag is 'hold', the 'thing' argument
of each post to that tag is *held* by the Tracker - i.e., assigned as
the first element of the 'things' array (things[0]) of the object
assigned to that tag on the Tracker's 'tags' object.  If more than one
post is made to a tag with 'hold' trackType, only the 'thing' passed
on the last post is retained.  A 'hold' task is deemed 'complete' when
a single post is registered.

If the trackType specified for a tag is 'coll' (for "collect"), the
values of the 'thing' property of posts to that tag DON'T overwrite
the previous posts but are *collected* (pushed onto 'things' array)
and counted - i.e., the 'count' property of the object assigned to
that tag on the Tracker's 'tags' object is incremented.  A 'coll' task
is deemed complete when the count reaches the value of the 'reqd'
option specified during instantiation.

## Usage

Require the module.

    var CompletionTracker = require('completion-tracker');


#### Specification for tracking 'posts' to a defined/labeled set of tags

Suppose a simple case where we just want to be notified when (3) three
tasks - 'a', 'b', and 'c' - have completed.  This can be achieved
using, for all tasks, a trackType of 'count' with 'reqd' set to 1:

    tagSpecs = {
        a : { trackType : 'count', opts : { reqd : 1} },
        b : { trackType : 'count', opts : { reqd : 1} }
        c : { trackType : 'count', opts : { reqd : 1} }
    };

Note the count trackType does not permit retaining any
information/result from the completed tasks.  If we need some
information/result from the tasks, we can use 'hold' trackType:

    tagSpecs = {
        a : { trackType : 'hold', opts : {} },
        b : { trackType : 'hold', opts : {} }
        c : { trackType : 'hold', opts : {} }
    };

Equivalently, the tagSpec can be an array of objects.  Each object
must include 'tag' property. The opts property is not used for 'hold'
tracking and so is optional and ignored, if present;

    tagSpecs = [
        { tag : 'a', trackType : 'hold', opts : {} },
        { tag : 'b', trackType : 'hold', opts : {} }
        { tag : 'c', trackType : 'hold', opts : {} }
    ];

Tracktype of 'hold' is assumed by default so this tagSpec also can be
specified with a shorthand:

    tagSpecs = ['a', 'b', 'c'];

For 'hold' trackType, the completion-tracker will emit a 'complete'
event when at least one post has been registered for every tag.

#### Specification for tracking completion of labeled set(s) of tasks. 

The 'count' trackType is useful for a tag that's 'complete' when
its associated task has been performed some number of times (greater
than 1).

As shown previously, when tracking with a 'count' trackType, we must include 'opts'
object with 'reqd' property.

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
array which can be retrieved upon completion.

Like the 'count' trackType, when tracking with a 'coll' trackType, we
must include 'opts' property with 'reqd' property.

    tagSpecs = {
            a : { trackType : 'coll', opts : {reqd : 3 } },
            b : { trackType : 'coll', opts : {reqd : 5 } },
            c : { trackType : 'coll', opts : {reqd : 20} }
        };


A 'complete' event will be emitted when the number of posts required
for each tag (specified by the 'reqd' argument) has been registered.

The 'things' posted to each tag can be retrieved as discussed below.

### Instantiate tracker.

    var trackster = new CompletionTracker(tagSpecs);

### Subscribe to desired events.

Users of a CompletionTracker object can subscribe to three (3) types of events:

 - post - Emitted upon post to one of the valid tags
 - invalidTag - Emitted upon post to an invalid (i.e., not part of tagSpecs) tag
 - complete - Upon satisfaction of the requirements of all tags

The handler functions specified for events are called with a 'context'
object.  For 'post' and 'invalidTag' events, the context object has
three (3) properties:

  - emitter - Object emitting the event
  - tag - Text string containing the tag to which the post was directed  
  - msg - Short text string describing what the event signifies

For 'complete' events, the context object has just two (2):

  - emitter - object emitting the event
  - msg - text string describing what the event signifies

A handler can be registered thusly

    trackster.on('post', function onPost(ctx) {
        let tag = ctx.tag;
        let msg = ctx.msg;
        console.log('Tag %s posted: %s', tag, msg);
    })

    // for tags with 'count' tracktype
    trackster.on('post', function onPost(ctx) {
        let tag = ctx.tag;
        let emitter = ctx.emitter;
        let count = emitter.count(tag)
        console.log('%d post(s) to tag %s posted: %s', count, tag, msg);
    })

    trackster.on('invalidTag', function onInvalidTag(ctx) {
        let tag = ctx.tag;
        console.log('Ignored attempt to post thing for invalid tag %s', tag);
    })

    trackster.on('complete', function onComplete(ctx) {
        console.log('Complete: %s', ctx);
        console.log(JSON.stringify(trackster.tags, null, 2));
    })

### Post to tracked tags.

A 'post' call takes three arguments:

    trackster.post(<tag>, <thing> [, <action> ] )

The first argument (tag) is the name of the tag to which we are
posting.  The second argument (thing) is an arbitrary value which will
be 'held' if the trackType is 'hold', 'collected' (in array) if
trackType is 'coll'.  The third argument (action) is optional.  If
present, should be a valid trackType.  It can be used to override the
trackType specified for that tag during instantiation.

For example, the following loops will register the posts needed to
meet the 'complete' requirements of the three tag sets specified by
tagSpecs.

    for (i = 0; i < 3;  i++) {trackster.post('a', "This is A number " + i )};
    for (i = 0; i < 5;  i++) {trackster.post('b', "This is B number " + i )};
    for (i = 0; i < 20; i++) {trackster.post('c', "This is C number " + i )};

### Query the Completion Tracker

    trackster.thing(<tag>)    // returns the thing, if any, stored for the specified tag.

    trackster.things(<tag>)   // returns an array of whatever has been
                              // 'held' or 'collected' for the specified tag.

    trackster.count(<tag>)    // returns the count, if any, stored for the specified tag.

    trackster.tags()          // returns an array of the names of the tracked tags.

