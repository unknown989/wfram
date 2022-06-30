import { serve } from "https://deno.land/std@0.145.0/http/server.ts";


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

export type Controller = () => KVType[] | void;


export default class WFram {
    port: number;
    host: string;
    routes: WFramRoute[];
    headers: Set<Record<string, string>>;

    constructor(config: WFramConfig) {
        this.routes = [];
        this.port = config.port || 5000;
        this.host = config.host || "";
        this.headers = new Set();
        this.headers.add({ key: "Content-Type", value: "text/html" });
    }
    get_headers() {
        const obj: Record<string, string> = {};
        for (const k of this.headers) {
            obj[k.key] = k.value;
        }

        return obj;
    }
    async renderTemplate(route: WFramRoute): Promise<string> {
        if (route.view.startsWith("!HTML")) {
            return route.view.slice(5);
        }
        const { view, controller } = route;
        const map = controller();
        let nc = await Deno.readTextFile(`views/${view}.html`);
        if (map) {
            map.forEach(({ key, value }) => {
                nc = nc.replace(`\$${key}`, value);
            })
        }
        return nc;
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
        const r: WFramRoute = this.routes.find((rt: WFramRoute) => rt.path === url.pathname) || { name: "404", path: "*", view: "!HTML<html><body><h1>404 Page not found</h1></body></html>", controller: () => { } };
        const status = r.name !== "404" ? 200 : 404;
        return new Response(await this.renderTemplate(r), { status, headers: this.get_headers() });
    }
}