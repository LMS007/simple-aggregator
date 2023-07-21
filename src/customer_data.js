var fs = require("fs")

const customers = {};

let dataResolved;
let dataPromise = new Promise((resolve) => {
  dataResolved = resolve;
});


/**
 * Load the event data from file
 */
function loadData() {
  stream = fs.createReadStream(`${__dirname}/../events.csv`);

  stream.on('data', function(data) {
      var chunk = data.toString();
      const rows = chunk.split('\n');
      
      for (row of rows) {
        const [customerId, eventType, transactionId, time] = row.split(',');
        if (!customers[customerId]) {
          customers[customerId] = [];
        }
        // create the customer event objects and push to an array
        // assumption: each transactionId is unique
        customers[customerId].push({
          transactionId,
          eventType,
          time
        });
      }

      
  }); 

  stream.on('end', function(data) {
    // sort all the events by time
    for (const customerId in customers) {
      customers[customerId].sort((a, b) => {
        return new Date(a.time) <= new Date(b.time) ? -1 : 1;  
      })
    }

    // data is ready;
    dataResolved(customers);
  }); 
}

/**
 * Returns the customers data after it loads.
 * 
 * @returns {Promise<Object>}
 */
async function getCustomers() {
  return dataPromise;
}

/**
 * Binary search of an ordered list customer events based on time. 
 * Returns the index of the item that has a time value that would 
 * come exactly after `timeA`
 *  
 * @param {string} customerId 
 * @param {Array} customers 
 * @param {Date} timeA 
 * @returns 
 */
function getFirstEventIndex(customerId, customers, timeA) {
  let found = false;
  let index = Math.floor(customers[customerId].length / 2);
  let nextOffset = Math.ceil(index / 2); // 32, 16, 8, ... etc
  if (nextOffset === 0) nextOffset = 1; // offset have to be greater than 1
  const size = customers[customerId].length;
  let left = size; // left is the index of the first event that within the boundary
  
  while (!found) {
    if (index < 0) {
      break;
    } else if (index >= size) {
      break;
    }
    const eventTime = new Date(customers[customerId][index].time);
    if (timeA.getTime() === eventTime.getTime()) {
      left = index;
      found = true;
    }
    else if (timeA < eventTime) {
      if (left === index) {
        // already got here, just break this time, we can't divide any further
        found = true;
      }
      left = index; // this might be our index, but iterate further to be sure
    } 

    if (timeA < eventTime) {
      index = index - nextOffset; // go left
    } else {
      index = index + nextOffset; // go right
    }
    nextOffset = Math.ceil(nextOffset / 2);
  }
  return left;
}


/**
 * Build an array of buckets. Each bucket represents an hour of time incremented
 * from the lowerTimeBoundary value. Buckets with no event data at the beginning or
 * end of the range are not trimmed. 
 *  
 * on an exact hour.
 * @param {number} totalBuckets - Each bucket covers 1 hour of time
 * @param {Date} lowerTimeBoundary - Time does not have to start exactly on an hour.
 * @returns {Array}
 */
function createEmptyBuckets(totalBuckets, lowerTimeBoundary) {
  let buckets = [];
  for(let i = 0; i < totalBuckets; i++) {
    buckets.push({
      time: new Date(lowerTimeBoundary.getTime() + (1000*60*60*i)),
      events: 0,
      bucket: i
    })
  }
  return buckets;
}


/**
 * Return array of buckets. Each bucket represents 1 hour of time offset from the beginning 
 * of the time range provided or the first event (which ever is later). Additionally, any buckets of time
 * that follow the last customer events are trimmed off too. Buckets between the time ranges which
 * have no events will however be reported.
 * 
 * @param {string} customer - Customer ID
 * @param {Date} timeA - Lower time bound
 * @param {Date} timeB - Upper time bound
 * @returns 
 */
async function getEvents(customer, timeA, timeB) {  
  const customers = await getCustomers();
  const size = customers[customer].length;
  
  // do a binary search look up for finding the left boundary. Note. 
  // An iterative search would also work but this is a faster with 
  // large data sets.
  let left = getFirstEventIndex(customer, customers, timeA);
  const maxTime = timeB.getTime();

  const startTime = timeA.getTime();
  const hours = (maxTime - startTime) / (1000 * 60 * 60);
  const totalBuckets = Math.ceil(hours);

  buckets = createEmptyBuckets(totalBuckets, timeA);

  // iterate over the events starting with the first event that is within 
  // the left boundary
  let firstEventIndex = null;
  let lastEventIndex = -1; 
  for (let i = left; i < size; i++) {
    const eventTime = new Date(customers[customer][i].time);
    const hoursAfterLeftBoundary = (eventTime-timeA) / (1000 * 60 * 60); 
    const bucket = Math.floor(hoursAfterLeftBoundary);

    if (buckets[bucket]) { 
      buckets[bucket].events = buckets[bucket].events + 1; // increment the count
      lastEventIndex = bucket;
      if (firstEventIndex === null) {
        firstEventIndex = bucket;
      }
    }
  }

  return buckets;
}


module.exports = {
  loadData,
  getCustomers,
  getEvents
}