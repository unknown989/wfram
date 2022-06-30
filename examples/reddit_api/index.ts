import * as WFram from "https://deno.land/x/wfram@1.2/wfram.ts";


const sub_controller: WFram.Controller = (req: Request): WFram.KVType[] => {
    console.log(req);

    // const url = new URL(req.url);
    // const params: Record<string, string> = {};
    // const paramsArray = Array.from(url.searchParams);
    // for (let i = 0; i <= paramsArray.length; i++) {
    //     params[paramsArray[i][0]] = paramsArray[i][1];
    // }



    const data: WFram.KVType[] = [{ key: "title", value: "r/girls" }, { key: "data", value: JSON.stringify({}) }];

    return data;
}

const ws = new WFram.default();

ws.add_route({ name: "index", path: "/", view: "index", controller: () => { } });
ws.add_route({ name: "sub", path: "/sub", view: "sub", controller: sub_controller })


ws.listen({ port: 8080 })