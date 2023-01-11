var crypto = require('crypto')

async function GetHeader(r) {
    if (!r.headersIn['Cookie'] || !r.headersIn['Cookie'].includes("fs_experiences")) {
        let reply = await ngx.fetch('http://node-app:8081/server', {
            method: "HEAD",
            headers: {
                'Content-Type': 'appliation/json',
                'Connection': 'keep-alive',
            }
        }
        );
        let text = await reply.headers;
        let hashExperiences = crypto.createHash('sha1').update(text.get('x-fs-experiences')).digest('base64url')

        r.headersOut["x-fs-experiences"] = text.get('x-fs-visitor') + "@" + text.get('x-fs-experiences');
        r.headersOut["x-fs-combination"] = text.get('x-fs-experiences');
        r.headersOut["x-fs-combination-hash"] = hashExperiences;
        r.headersOut["x-fs-visitor"] = text.get('x-fs-visitor');
        r.headersOut["x-set-cookie"] = "fs_experiences=" + text.get('x-fs-visitor') + "@" + text.get('x-fs-experiences') + "; path=/; domain=localhost";
    }
    r.return(200);
}

export default { GetHeader }