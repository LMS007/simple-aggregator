### Simple Event Aggregator

Express server which hosts a single expoint /events. Endpoint returns an JSON object which has an array of 
buckets that relate to a single customer. Each bucket has a number, event count and starting edge time for 
that bucket. Buckets are already divided by 1 hour time periods relatively offset from the starting time 
in the query.

## To run

- requires node 18
- coded in Windows 11, not tested on Mac.


```
yarn install
yarn start
```

## Endpoints

Query params:

customer: the customer ID 
lower: The lower bound time stamp in YYYY-MM-DDTHH:mm:ss.sssZ
upper: The uppder bound time stamp in YYYY-MM-DDTHH:mm:ss.sssZ

e.g.

http://localhost:3000/events?lower=2021-03-02T10:00:00.000Z&upper=2021-03-02T14:00:00.000Z&customer=b4f9279a0196e40632e947dd1a88e857

http://localhost:3000/events?lower=2021-03-02T01:55:13.941Z&upper=2021-03-02T23:55:13.947Z&customer=1abb42414607955dbf6088b99f837d8f


Note: If the upper range boundary includes part of a bucket, then that entire bucket will be counted. 
In other words, the upper boundary can not cut out events in part of bucket-hour.

e.g.

Here is a ~10 minute window, but the result returns all events within the hour of the lower boundary.
http://localhost:3000/events?lower=2021-03-02T01:55:13.941Z&upper=2021-03-02T02:05:13.941Z&customer=1abb42414607955dbf6088b99f837d8f