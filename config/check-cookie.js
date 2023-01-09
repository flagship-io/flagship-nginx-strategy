function checkCookie(r) {
    let requestMethod;
    let cookies;
    if (r.headersIn['Cookie']) {
        cookies = r.headersIn['Cookie']
        requestMethod = "GET"
        r.headersOut["X-cookie-header"] = cookies;
        r.log(1)
        //r.headersOut["x-Cookie-ex"] = cookies.fs_experiences;
    } else {
        requestMethod = "HEAD"
        //r.headersOut["Set-Cookie"] = `fs_experiences=${r.headersIn['x-fs-visitor']}@${r.headersIn['x-fs-visitor']}; path=/; domain=localhost`;
        r.log(2)
    }

    r.headersOut["X-method"] = requestMethod
    r.log(3)
    return requestMethod
}

function addCookie(r) {
    r.headersOut["Set-Cookie"] = `fs_experiences=${r.headersOut['x-fs-visitor']}@${r.headersOut['x-fs-experiences']}; path=/; domain=localhost`;
}

async function callDecisionApi(r) {
    if (!r.headersIn['Cookie']) {
        let reply = await ngx.fetch('http://localhost:8081', {
            method: "HEAD",
            headers: {
                'Content-Type': 'appliation/json',
                'Connection': 'keep-alive',
            }
        }
        );
        let text = await reply.headers;
        r.headersOut["X-header-decision-api"] = text;
    }
    r.return(200)
}
export default { checkCookie, addCookie, callDecisionApi }