#! /usr/bin/env node

var CompletionTracker = require('../completion-tracker');

var tagSpecs = null;
tagSpecs = ['a', 'b', 'c'];
tagSpecs = {
    a : {trackType : 'count', opts : {reqd : 3} },
    b : {trackType : 'count', opts : {reqd : 5} },
    c : {trackType : 'count', opts : {reqd : 20} }
};

var trackster = new CompletionTracker(tagSpecs);
console.log('trackster: %s', JSON.stringify(trackster, null, 2))

trackster.on('post', function onPost(ev) {
//    console.log('Post: %s', ev);
})

trackster.on('invalidTag', function onInvalidTag(ev) {
    console.log('Ignored attempt to post thing for invalid tag %s', ev);
})

trackster.on('complete', function onComplete(ev) {
    console.log('Complete: %s', ev);
    console.log(JSON.stringify(trackster.tags, null, 2));
    console.log("We held '%s' for tag 'a'", trackster.thing('a'));
    console.log("We tracked '%d' posts for tag 'c'", trackster.count('c'));
})

var i;
for (i = 0; i < 3;  i++) {trackster.post('a', "This is A number " + i )};
for (i = 0; i < 5;  i++) {trackster.post('b', "This is B number " + i )};
for (i = 0; i < 20; i++) {trackster.post('c', "This is C number " + i )};

