var AmazonDateParser = require('amazon-date-parser');

var date = new AmazonDateParser('2017-W47');

console.log(date.startDate.toLocaleDateString('en-GB')); 
console.log(date.endDate.toLocaleDateString('en-GB')); 