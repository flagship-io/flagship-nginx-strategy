import Flagship from './flagshipRequest.js';
import express from 'express';

const app = express()
const port = 8081

app.set('etag', false)

const homeHandler = async (req, res) => {

  // Initialize a new Flagship object
  const flagship = new Flagship(process.env.FS_ENV_ID, process.env.FS_API_KEY);

  let visitorId;

  // Check for the presence of the 'x-fs-visitor' header
  if (!req.get('x-fs-visitor')) {

    // If the header is not present, generate a new visitor ID
    visitorId = flagship.generateUID();
  } else {

    // If the header is present, use the value of the header as the visitor ID
    visitorId = req.get('x-fs-visitor');
  }

  // Check if the request method is 'HEAD' or if the 'x-fs-experiences' header is present
  if (req.method === 'HEAD' || req.get('x-fs-experiences')) {

    // If either of the above conditions is true, start the Flagship instance using the visitor ID and a configuration object
    await flagship.start(
      visitorId,
      {
        nbBooking: 4,
      },
    );
  }

  // Get the cache key for the Flagship instance
  let cacheKey = flagship.getHashKey();

  // Get the flag value for the key 'restaurant_cta_review_text' and default value 'Leave a Review'
  let FsFlag = flagship.getFlag('restaurant_cta_review_text', 'Leave a Review')

  // If the cache key is false
  if (cacheKey === false) {

    // Change the cache key to 'optout'
    cacheKey = 'optout';
    visitorId = 'ignore-me';
  }

  // Check if the request method is 'HEAD'
  if (req.method === 'HEAD') {

    // If it is, set the 'x-fs-visitor' and 'x-fs-experiences' headers on the response
    res.setHeader('x-fs-visitor', visitorId);
    res.setHeader('x-fs-experiences', cacheKey);
  }

  // Set 'Cache-Control' and 'Content-Type' headers on the response
  res.setHeader('Cache-Control', 'max-age=1, s-maxage=600');
  res.setHeader("Content-Type", "text/html");

  res.write('<pre>');

  // Check if cacheKey is 'optout'
  if (cacheKey === 'optout') {
    res.write('Global Cache 🔥 <br />');
  }

  // Write out the flag value as the innerHTML of a button element
  res.write(`<button>${FsFlag}</button>`);

  // End the response
  res.end();
}


app.get('/server', homeHandler)

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
