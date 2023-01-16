import pkg from '@flagship.io/js-sdk';
const { Flagship } = pkg;
import express from 'express';

const app = express();
const port = 8081;

// generate a visitorID 
function generateUID() {
    return `varnish-v${Math.floor(Math.random() * 1000000)}`;
}

app.set('etag', false);

const homeHandler = async (req, res) => {

    // Initialize a new Flagship object
    const fsInstance = Flagship.start(process.env.FS_ENV_ID, process.env.FS_API_KEY);

    let visitorId;
    let cacheKey;

    // Check for the presence of the 'x-fs-visitor' header
    if (!req.get('x-fs-visitor')) {

        // If the header is not present, generate a new visitor ID
        visitorId = generateUID();
    } else {

        // If the header is present, use the value of the header as the visitor ID
        visitorId = req.get('x-fs-visitor');
    }

    // If either of the above conditions is true, start the Flagship instance using the visitor ID and a configuration object
    let visitor = fsInstance.newVisitor(visitorId, {
        nbBooking: 4,
    })

    await visitor.fetchFlags();

    let experiences = [];

    visitor.getFlagsDataArray().map((data) => {

        let experience = `${data?.campaignId}:${data?.variationId}`;
        experiences.push(experience);
    })

    if (experiences) {
        cacheKey = experiences.join("|");
    }

    // Get the flag value for the key 'restaurant_cta_review_text' and default value 'Leave a Review'
    //let FsFlag = visitor.getFlag('restaurant_cta_review_text', 'Leave a Review')

    // If the cache key is false
    if (!cacheKey) {

        // Change the cache key to 'optout'
        cacheKey = 'optout';
        visitorId = 'ignore-me';
    }

    // Set 'Cache-Control' and 'Content-Type' headers on the response
    res.setHeader('x-fs-visitor', visitorId);
    res.setHeader('x-fs-experiences', cacheKey);
    res.setHeader('Cache-Control', 'max-age=1, s-maxage=600');
    res.setHeader("Content-Type", "text/html");

    res.write('<pre>');

    // Check if cacheKey is 'optout'
    if (cacheKey === 'optout') {
        res.write('Global Cache 🔥 <br />');
    }

    // Write out the flag value as the innerHTML of a button element
    res.write(`<button>${visitor.getFlag('restaurant_cta_review_text', 'Leave a Review').getValue()}</button>`);

    // End the response
    res.end();
}

app.get('/server', homeHandler);

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
});
