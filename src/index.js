const express = require('express')
const { loadData, getCustomers, getEvents } = require('./customer_data')
const app = express()
const port = 3000


loadData();

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Return list of events in 1 hour buckets
 *     parameters:
 *       - in: path
 *         name: customer
 *         schema:
 *           type: string
 *         required: true
 *         description: The customer id
 *       - in: path
 *         name: lower
 *         schema:
 *           type: string
 *         required: true
 *         description: The lower bound time stamp in YYYY-MM-DDTHH:mm:ss.sssZ
 *       - in: path
 *         name: upper
 *         schema:
 *           type: string
 *         required: true
 *         description: The upper bound time stamp in YYYY-MM-DDTHH:mm:ss.sssZ
 *     responses:
 *       200:
 *         description: The array of buckets
 *         content:
 *           application/json:
 *       400:
 *         description: Invalid format
 *
 */
app.get('/events', async (req, res) => {
  
    let timeA, timeB, trim;
  
    timeA = new Date(req.query.lower);
    timeB = new Date(req.query.upper);
    trim = req.query.trim === 'true'

    if (isNaN(timeA.getTime())) {
      res.status(400).json({error: 'Invalid or missing time range for `lower`, you must use a standard time format YYYY-MM-DDTHH:mm:ss.sssZ'})
    } else if (isNaN(timeB.getTime())) {
      res.status(400).json({error: 'Invalid or missing time range for `upper`, you must use a standard time format YYYY-MM-DDTHH:mm:ss.sssZ'})
    } else {
      
      const customers = await getCustomers();
      const customer = req.query.customer;
      
      if (!customers[customer]) {
        res.status(400).json({error: 'Invalid customer id'})
      } else {
        const buckets = await getEvents(customer, timeA, timeB, trim);
        res.json({
          lower: timeA.toJSON(),
          upper: timeB.toJSON(),
          buckets
        })
      }
      
    }
})

app.listen(port, () => {
  console.log(`listening on port ${port}`)
})
