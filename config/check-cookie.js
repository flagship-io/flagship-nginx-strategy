async function GetHeader(r) {

    // check if the incoming request contains a "Cookie" header with the value "fs-experiences"
    if (!r.headersIn['Cookie'] || !r.headersIn['Cookie'].includes("fs-experiences")) {

        // make a "HEAD" request to the Flagship server
        let reply = await ngx.fetch('http://node-app:8081/server', {
            method: "HEAD",
            headers: {
                'Content-Type': 'appliation/json',
                'Connection': 'keep-alive',
            }
        });

        // retrieve the headers from the response
        let headers = await reply.headers;

        // set headers
        r.headersOut["x-fs-experiences"] = headers.get('x-fs-experiences');
        r.headersOut["x-fs-experiences-hash"] = headers.get('x-fs-experiences-hash');
        r.headersOut["x-fs-visitor"] = headers.get('x-fs-visitor');
        r.headersOut["x-fs-cookie"] = headers.get('x-fs-cookie');
        r.headersOut["x-set-cookie"] = "fs-experiences=" + headers.get('x-fs-cookie') + "; path=/; domain=localhost";

    } else {
        r.headersOut["x-fs-experiences-hash"] = r.headersIn['Cookie'].split(" ").find((p) => p.includes("fs-experiences")).split("@")[1].replace(";", "");
    }

    // return the request with a 200 status code
    r.return(200);
}

// export the "GetHeader" function
export default { GetHeader }
