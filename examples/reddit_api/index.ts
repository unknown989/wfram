import * as WFram from "https://deno.land/x/wfram@latest/wfram.ts";


const ws = new WFram.default();

ws.add_route({ name: "index", path: "/", view: "index", controller: () => { } });



ws.listen({ port: 8080 })