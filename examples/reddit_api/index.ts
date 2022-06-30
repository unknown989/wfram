import * as WFram from "https://deno.land/x/wfram@1.2.2/wfram.ts";
import { readerFromStreamReader } from "https://deno.land/std@0.146.0/streams/conversion.ts";

const read_body = async (body: ReadableStream<Uint8Array>): Promise<string | undefined> => {
    let res = "";
    const reader: ReadableStreamDefaultReader<Uint8Array> | undefined = body?.getReader();
    if (!reader) { return; }
    const stream = new Response(new ReadableStream({
        start(controller) {
            return pump();
            function pump(): any {
                return reader?.read().then(({ done, value }) => {
                    // When no more data needs to be consumed, close the stream
                    if (done) {
                        controller.close();
                        return;
                    }
                    // Enqueue the next data chunk into our target stream
                    controller.enqueue(value);
                    return pump();
                });
            }
        }
    }));
    return await stream.text();
}
const params_to_record = (params: URLSearchParams): Record<string, string> => {
    const record: Record<string, string> = {};
    Array.from(params.entries()).map((param) => {
        record[param[0]] = param[1];
    })

    return record;
}

const sub_controller: WFram.Controller = async (req: Request): Promise<WFram.KVType[]> => {

    let params: Record<string, string> = {};
    if (!req.body) {
        return new Promise(() => { });
    }
    const body = await read_body(req.body);
    params = params_to_record(new URLSearchParams(body));
    if (!params["subreddit"].startsWith("r/")) {
        params["subreddit"] = "r/" + params["subreddit"];
    }

    let datavalue: string[] = [];

    const res = await (await fetch(`https://reddit.com/${params["subreddit"]}.json`)).json();

    if (res.reason == "banned") {
        return [{ key: "title", value: params["subreddit"] }, { key: "data", value: "Subreddit Banned" }]
    }
    if (res.error === 404) {
        return [{ key: "title", value: params["subreddit"] }, { key: "data", value: "Subreddit not found" }]
    }

    const htmlcontent = `<a href="$url" target="_blank"><div class="post">
        <img width=400 src="$img" alt="">
        <h1>$title</h1>
        <span>$user</span>
    </div></a>`;

    [...res.data.children].map((child: any) => {

        datavalue.push(htmlcontent.replace("$img", child.data["url_overridden_by_dest"]).replace("$title", child.data["title"]).replace("$user", "u/" + child.data["author_fullname"]).replace("$url", "https://reddit.com" + child.data["permalink"]))
        return;
    })

    const data: WFram.KVType[] = [{ key: "title", value: params["subreddit"] }, { key: "data", value: datavalue.join("") }];

    return data;
}

const wf = new WFram.default();

wf.add_route({ name: "index", path: "/", view: "index", controller: () => { } });
wf.add_route({ name: "sub", path: "/sub", view: "sub", controller: sub_controller })
wf.set_assets("/public/")

wf.listen({ port: 8080 })