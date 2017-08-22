var ConnectionTracker = require('../connection-tracker');

var tracker = new ConnectionTracker('tbl1', 'tbl2', 'tbl33', 'tbl4');


tracker.add('tbl1', "Added something for tbl1");
tracker.add('tbl2', "Added something for tbl2");
tracker.add('tbl3', "Added something for tbl3");
tracker.add('tbl4', "Added something for tbl4");
