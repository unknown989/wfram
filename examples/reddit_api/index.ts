// deno-lint-ignore-file no-explicit-any
import * as WFram from "https://deno.land/x/wfram@1.2.3/wfram.ts";

// /sub route controller
const sub_controller: WFram.Controller = async (req: Request): Promise<WFram.KVType[]> => {
    let params: Record<string, string> = {};

    if (!req.body) {
        return new Promise(() => { });
    }
    // Getting the params sent from <form method="post">
    const body: string | undefined = await WFram.Utils.read_body(req.body); // As a string

    // Turning the params string `const body` to a Key-Value (Record<string,string>) type
    params = WFram.Utils.params_to_record(new URLSearchParams(body));
    if (!params["subreddit"].startsWith("r/")) {
        params["subreddit"] = "r/" + params["subreddit"];
    }

    const datavalue: string[] = [];
    // Fetching from reddit's public API
    const res = await (await fetch(`https://reddit.com/${params["subreddit"]}.json`)).json();

    // Checking if the subreddit is down/banned
    if (res.reason == "banned") {
        return [{ key: "title", value: params["subreddit"] }, { key: "data", value: "Subreddit Banned" }]
    }
    if (res.error === 404) {
        return [{ key: "title", value: params["subreddit"] }, { key: "data", value: "Subreddit not found" }]
    }

    // Our custom HTML template
    const htmlcontent = `<a href="$url" target="_blank"><div class="post">
        <img width=400 src="$img" alt="">
        <h1>$title</h1>
        <span>$user</span>
    </div></a>`;

    // Replacing the template's variables with their corresponding values
    [...res.data.children].map((child: any) => {

        datavalue.push(htmlcontent.replace("$img", child.data["url_overridden_by_dest"]).replace("$title", child.data["title"]).replace("$user", "u/" + child.data["author_fullname"]).replace("$url", "https://reddit.com" + child.data["permalink"]))
        return;
    })

    // Building the return value
    const data: WFram.KVType[] = [{ key: "title", value: params["subreddit"] }, { key: "data", value: datavalue.join("") }];

    return data;
}

// Initiating WFram
const wf = new WFram.default();

// Adding routes
wf.add_route({ name: "index", path: "/", view: "index", controller: () => { } }); // index route '/'
wf.add_route({ name: "sub", path: "/sub", view: "sub", controller: sub_controller }) // sub route '/sub'

// Setting the public assets folder
wf.set_assets("/public/")

// Running the server on port 8080
wf.listen({ port: 8080 })