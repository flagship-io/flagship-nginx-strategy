<p align="center">

<img  src="https://mk0abtastybwtpirqi5t.kinstacdn.com/wp-content/uploads/picture-solutions-persona-product-flagship.jpg"  width="211"  height="182"  alt="flagship-nginx-strategy"  />

</p>

# Flagship Strategy for Nginx

## Usage

### General concepts

Following our module implementation for content caching in Nginx [Link](https://github.com/flagship-io/flagship-nginx-module), one of the downsides was that the visitor ID and context were computed at cache level and we don't have access to any high level or custom information about the visitor such as database informations. That lead us to think of a strategy and workflow in order to solve this issue and provide an all-in solution to content caching.

In this strategy, the cache server run alongside a lightweight backend that synchronize with your Flagship configuration to provide feature flagging & experimentation abilities to the cache server, the lightweight backend can implement our SDKs or the Decision API with your custom visitor information coming from the databases. For more explanation check our documentation [Documentation](https://docs.developers.flagship.io/docs/solution-strategy)

### Implementation

Since the strategy can be adopted by any web server or HTTP accelerator that manage content caching, the implemntation can differe from provider to another, for instance in this example we used the NJS module provided by Nginx Team to reverse proxy the HTTP request coming from the client and check weither the cookies **fs-experiences** exists, if it does we serve the server directly, if not we send a HEAD request to the dedicated Flagship server to retrieve the informations related to the visitor and create the cookie. **Note:** that the content of the cookie will be served as a cache key for the Nginx's caching table.

### Configuration

Fill the FS_ENV_ID and FS_API_KEY with your own credentials, and run ``` docker compose up -d```

```
version: "3.9"
services:
  nginx:
    image: nginx:latest
    container_name: nginx
    volumes:
      - "./config/default.conf:/etc/nginx/conf.d/default.conf"
      - "./config/check-cookie.js:/etc/nginx/njs/http/check-cookie.js"
      - "./config/nginx.conf:/etc/nginx/nginx.conf:ro"
    ports:
      - "80:80"
    depends_on:
      - "node-app"
  node-app:
    build:
      context: .
      args:
        FS_MODE: SDK #or API
      dockerfile: Dockerfile
      image: github.com/flagship-io/flagship-nginx-strategy
    container_name: node-app
    environment:
      FS_ENV_ID: FS_ENV_ID
      FS_API_KEY: FS_API_KEY
    ports:
      - "8081:8081"
```

### Running

#### Sample Nginx configuration

```
http {

	# Define the path to the JavaScript files
    js_path "/etc/nginx/njs/";

    # Define the proxy cache path, levels, and keys_zone
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m;

    # Define the server to forward requests to
    upstream originserver {
	    server node-app:8081;
    }

    # Define the resolver for DNS resolution
    resolver 127.0.0.11;

    server {

        # Listen on port 80 for incoming requests
	    listen 80 default_server;
	    listen [::]:80 default_server;

        # Import the JavaScript module check-cookie.js, and define it as "master"
	    js_import master from http/check-cookie.js;

        # Root directory for files to be served
        root /var/www/html;

        # server_name variable
        server_name _;
        
        # log the error to the specified file
        error_log /var/log/nginx/error.log debug;

        # internal location, only available on the local server
        location = /_setCookie {
            internal;
            
            # Run the JavaScript function GetHeader from the imported module
            js_content master.GetHeader;
        }

        # main location block
        location = / {

            # run an internal location
            auth_request /_setCookie;
            
            # set several variables
            auth_request_set $visitor $sent_http_x_fs_visitor;
            auth_request_set $cookie $sent_http_x_set_cookie;
            auth_request_set $experiences_hash $sent_http_x_fs_experiences_hash;
            
            # set headers for the proxied server
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

            proxy_hide_header x-fs-visitor;
            proxy_hide_header x-fs-experiences-hash;
    
            # enable caching
            proxy_buffering on;
            proxy_cache my_cache;
            proxy_cache_valid any 10m;
            
            # set proxy method
            proxy_method GET;
        
            # add some headers with the variables values
            add_header x-fs-visitor $visitor;

            # set cookie in the browser (combination not hashed for explanation purpose)
            add_header Set-Cookie $cookie;

            #set header to check if the response is from a cache or not
            add_header X-Proxy-Cache $upstream_cache_status;

            # set cache key (combination hashed)
            proxy_cache_key $experiences_hash;
            
            default_type text/html;
        
            # Forward requests to the upstream server
            proxy_pass http://originserver/server;
        }
    }
}
```

#### NJS File

```
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
```

## Reference

- [Nginx development guide](http://nginx.org/en/docs/dev/development_guide.html)
- [Nginx module development](https://www.evanmiller.org/nginx-modules-guide.html)
- [Echo module](https://github.com/openresty/echo-nginx-module)
- [Extending nginx](https://www.nginx.com/resources/wiki/extending/)
- [Introduction to NGINX Modules - Nicholas O'Brien](https://www.youtube.com/watch?v=rGs-6FgwtcQ)

## Contributors

<table>
  <tr>
    <td align="center"><a href="https://github.com/Chadiii"><img src="https://avatars.githubusercontent.com/u/49269946?v=4" width="100px;" alt=""/><br /><sub><b>Chadi LAOULAOU</b></sub></a></td>
    <td align="center"><a href="https://github.com/guillaumejacquart"><img src="https://avatars2.githubusercontent.com/u/5268752?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Guillaume JACQUART</b></sub></td>
  </tr>
</table>

## License

[Apache License.](https://github.com/flagship-io/flagship-nginx-module/blob/master/LICENSE)
