import Flagship from './flagshipRequest.js';
import express from 'express';

const app = express()
const port = 8081

app.get('/', async (req, res) => {

  // replace envId & apiKey with your own flagship credentials
  const flagship = new Flagship(process.env.FS_ENV_ID, process.env.FS_API_KEY);

  let visitorId;
  if (!req.get('x-fs-visitor')) {
    visitorId = flagship.generateUID();
  } else {
    visitorId = req.get('x-fs-visitor');
  }

  if (req.method === 'HEAD' || req.get('x-fs-experiences')) {
    await flagship.start(
      visitorId,
      {
        nbBooking: 4,
      },
    );
  }

  let cacheKey = flagship.getHashKey();

  if (cacheKey === false) {
    cacheKey = 'optout';
    visitorId = 'ignore-me';
  }

  if (req.method === 'HEAD') {
    let experiencesCookie = cacheKey === 'optout' ? cacheKey : `${visitorId}@${cacheKey}`;
    res.setHeader('x-fs-visitor', visitorId);
    res.setHeader('x-fs-experiences', cacheKey);
  }

  if (cacheKey === 'optout') {
    res.write('Global Cache 🔥\n');
  }
  res.write(`<button>${flagship.getFlag('restaurant_cta_review_text', 'Leave a Review')}</button>`);
  res.end();
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
