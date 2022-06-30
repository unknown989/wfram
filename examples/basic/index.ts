import * as WFram from "https://deno.land/x/wfram@1.0/wfram.ts";

const wf = new WFram.default({ port: 8080, host: "localhost" });

const index_controller: WFram.Controller = () => {
    let data: WFram.KVType = { key: "img", value: "https://random.imagecdn.app/500/500" }

    return [data];
}

wf.add_route({ name: "index", path: "/", view: "index", controller: index_controller });
wf.add_route({ name: "about", path: "/about", view: "about", controller: () => { } })

wf.listen();