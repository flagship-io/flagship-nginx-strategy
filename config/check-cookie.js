// import the 'crypto' module
var crypto = require('crypto')

async function GetHeader(r) {

    // check if the incoming request contains a "Cookie" header with the value "fs_experiences"
    if (!r.headersIn['Cookie'] || !r.headersIn['Cookie'].includes("fs_experiences")) {

        // make a "HEAD" request to the Flagship server
        let reply = await ngx.fetch('http://node-app:8081/server', {
            method: "HEAD",
            headers: {
                'Content-Type': 'appliation/json',
                'Connection': 'keep-alive',
            }
        });

        // retrieve the headers from the response
        let text = await reply.headers;

        // create a sha1 hash of the "x-fs-experiences" header, encoded in 'base64url' format
        let hashExperiences = crypto.createHash('sha1').update(text.get('x-fs-experiences')).digest('base64url')

        // set headers
        r.headersOut["x-fs-experiences"] = text.get('x-fs-visitor') + "@" + text.get('x-fs-experiences');
        r.headersOut["x-fs-combination"] = text.get('x-fs-experiences');
        r.headersOut["x-fs-combination-hash"] = hashExperiences;
        r.headersOut["x-fs-visitor"] = text.get('x-fs-visitor');
        r.headersOut["x-set-cookie"] = "fs_experiences=" + text.get('x-fs-visitor') + "@" + text.get('x-fs-experiences') + "; path=/; domain=localhost";
    }

    // return the request with a 200 status code
    r.return(200);
}

// export the "GetHeader" function
export default { GetHeader }
