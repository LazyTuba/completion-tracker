#! /usr/bin/env node

var CompletionTracker = require('../completion-tracker');

var tagSpecs = null;
tagSpecs = ['a', 'b', 'c'];
tagSpecs = {
    a : {trackType : 'hold',  opts : {}         },
    b : {trackType : 'count', opts : {reqd : 5} },
    c : {trackType : 'coll',  opts : {reqd : 7} }
};

var trackster = new CompletionTracker(tagSpecs);
// console.log('trackster: %s', JSON.stringify(trackster, null, 2))

trackster.on('post', function handler(ctx) {
    let tag = ctx.tag;
    let thing = this.things(tag);
    console.log(`tag: ${tag}, thing: ${thing}`)
})

trackster.on('invalidTag', function onInvalidTag(ctx) {
    let tag = ctx.tag;
    let msg = ctx.msg;
    console.log(msg);
    console.log('Ignored attempt to post thing for invalid tag %s', tag);
})

trackster.on('complete', function onComplete(ctx) {
    console.log('Complete: %s', ctx.msg);
    console.log('Tracker tags: %s', ctx.emitter.tags())
    console.log(JSON.stringify(trackster._tags, null, 2));
    ['a', 'b', 'c'].forEach(tag => {
	console.log(`Tag: ${tag}`);
	console.log(`Posted to tag ${tag}:  ${trackster.postedTo(tag)}`);
	console.log(`We counted ${trackster.count(tag)} for tag ${tag}`);
	console.log(`We collected ${JSON.stringify(trackster.things(tag), null, 2)} for tag ${tag}`);
    })
    process.exit(0)
})

// var i;
// trackster.post('a', "Post to tag 'a'");
// trackster.post('b', "Post to tag 'b'");


for (i = 0; i < 1;  i++) {trackster.post('x', `thing-X${i+1}` )};
for (i = 0; i < 3;  i++) {trackster.post('a', `thing-A${i+1}` )};
for (i = 0; i < 5;  i++) {trackster.post('b', `thing-B${i+1}` )};
for (i = 0; i < 7;  i++) {trackster.post('c', `thing-C${i+1}` )};
for (i = 0; i < 2;  i++) {trackster.post('z', `thing-Z${i+1}` )};

