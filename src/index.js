import Flagship from './flagshipRequest.js';
import express from 'express';

const app = express()
const port = 8081

app.set('etag', false)

const homeHandler = async (req, res) => {
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

  let FsFlag = flagship.getFlag('restaurant_cta_review_text', 'Leave a Review')

  if (cacheKey === false) {
    cacheKey = 'optout';
    visitorId = 'ignore-me';
  }

  if (req.method === 'HEAD') {
    let experiencesCookie = cacheKey === 'optout' ? cacheKey : `${visitorId}@${cacheKey}`;
    res.setHeader('x-fs-visitor', visitorId);
    res.setHeader('x-fs-experiences', cacheKey);
  }

  res.setHeader('Cache-Control', 'max-age=1, s-maxage=600');
  res.setHeader("Content-Type", "text/html");

  res.write('<pre>');

  if (cacheKey === 'optout') {
    res.write('Global Cache 🔥 <br />');
  }
  res.write(`<button>${FsFlag}</button>`);
  res.end();

}

app.get('/', homeHandler)

app.get('/get_cookie', async (req, res) => {

  const flagship = new Flagship(process.env.FS_ENV_ID, process.env.FS_API_KEY);

  let visitorId

  res.setHeader('Cache-Control', 'max-age=1, s-maxage=600');
  res.setHeader("Content-Type", "text/html");

  if (!req.get('x-fs-visitor')) {
    visitorId = flagship.generateUID();
  } else {
    visitorId = req.get('x-fs-visitor');
  }

  await flagship.start(
    visitorId,
    {
      nbBooking: 4,
    },
  );

  let cacheKey = flagship.getHashKey();

  let FsFlag = flagship.getFlag('restaurant_cta_review_text', 'Leave a Review')

  if (cacheKey === false) {
    cacheKey = 'optout';
    visitorId = 'ignore-me';
  }

  //let experiencesCookie = cacheKey === 'optout' ? cacheKey : `${visitorId}@${cacheKey}`;
  res.setHeader('x-fs-visitor', visitorId);
  res.setHeader('x-fs-flags', FsFlag);
  res.setHeader('x-fs-experiences', cacheKey);

  res.cookie('fs_experiences', `${visitorId}@${cacheKey}`, { domain: 'localhost' })

  res.end()

})

app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})
