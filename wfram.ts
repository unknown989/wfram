import { serve } from "https://deno.land/std@0.145.0/http/server.ts";
import * as path from "https://deno.land/std@0.146.0/path/mod.ts";
import * as mimeTypes from "https://deno.land/x/mime_types@1.0.0/mod.ts";



export type WFramConfig = {
    port?: number,
    host?: string
}
export type WFramRoute = {
    name: string,
    path: string,
    view: string,
    controller: Controller,
}
export type KVType = {
    key: string,
    // deno-lint-ignore no-explicit-any
    value: any
}

export type Controller = (req: Request) => Promise<KVType[]> | void;


export default class WFram {
    port: number;
    host: string;
    routes: WFramRoute[];
    assets: string[];
    headers: Set<Record<string, string>>;


    constructor() {
        this.routes = [];
        this.assets = [];
        this.port = 5000;
        this.host = "";
        this.headers = new Set();
        this.headers.add({ key: "Content-Type", value: "text/html" });
    }
    set_assets(asset_path: string) {
        this.assets.push(asset_path);
    }
    get_headers() {
        const obj: Record<string, string> = {};
        for (const k of this.headers) {
            obj[k.key] = k.value;
        }

        return obj;
    }
    async renderTemplate(route: WFramRoute, req: Request): Promise<string> {
        if (route.view.startsWith("!HTML")) {
            return route.view.slice(5);
        }
        const { view, controller } = route;
        const map = await controller(req);
        let nc = await Deno.readTextFile(`views/${view}.html`);
        if (map) {
            map.forEach(({ key, value }) => {
                nc = nc.replace(`\$${key}`, value);
            })
        }
        return nc;
    }
    async readFile(filename: string): Promise<Uint8Array> {
        return await Deno.readFile(filename);
    }

    async listen(config?: WFramConfig) {
        if (!config) {
            this.port = 5000;
            this.host = "";
        } else {
            this.port = config.port || 5000;
            this.host = config.host || ""
        }

        await serve((req: Request) => { return this.handler(req) }, {
            hostname: this.host, port: this.port
        });
    }
    add_header(key: string, value: string) {
        this.headers.add({ key: key, value: value });
    }
    add_route(route: WFramRoute) {
        this.routes.push(route);
        this.get_headers();
    }

    // deno-lint-ignore no-explicit-any
    async handler(this: any, req: Request): Promise<Response> {
        const url = new URL(req.url);
        const a: string | undefined = this.assets.find((asset: string) => url.pathname.startsWith(asset));
        if (a) {
            const filename = path.join(Deno.cwd(), a, "../" + url.pathname);
            let filecontent = "";
            try {
                filecontent = await this.readFile(filename);
            } catch (e) {


                if (e.name === "NotFound") {
                    return new Response(await this.renderTemplate({ name: "404", path: "*", view: "!HTML<html><body><h1>404 Asset not found</h1></body></html>", controller: () => { } }), { status: 404, headers: { "Content-Type": "text/html" } })
                }
            }

            return new Response(filecontent, { status: 200, headers: { ...this.get_headers(), "Content-Type": mimeTypes.lookup(path.join(Deno.cwd(), a, "../" + url.pathname)) } });
        }
        const r: WFramRoute = this.routes.find((rt: WFramRoute) => rt.path === url.pathname) || { name: "404", path: "*", view: "!HTML<html><body><h1>404 Page not found</h1></body></html>", controller: () => { } };
        const status = r.name !== "404" ? 200 : 404;
        return new Response(await this.renderTemplate(r, req), { status, headers: this.get_headers() });
    }
}