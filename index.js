"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.web = exports.request = exports.requestMethod = exports.requestType = exports.router = exports.app = void 0;
const express_1 = __importStar(require("express"));
const polyservice_1 = require("../polyservice");
exports.default = express_1.default;
exports.app = (0, express_1.default)();
exports.router = (0, express_1.Router)();
const middlewares = [];
let middlewareFunctions = [];
const API_BASE = process.env.API_BASE || "";
var requestType;
(function (requestType) {
    requestType["GET"] = "get";
    requestType["POST"] = "post";
    requestType["PUT"] = "put";
    requestType["DELETE"] = "delete";
    requestType["PATCH"] = "patch";
    requestType["OPTIONS"] = "options";
    requestType["HEAD"] = "head";
    requestType["CONNECT"] = "connect";
    requestType["TRACE"] = "trace";
})(requestType || (exports.requestType = requestType = {}));
var requestMethod;
(function (requestMethod) {
    requestMethod["JSON"] = "JSON";
    requestMethod["XML"] = "XML";
    requestMethod["FILE"] = "FILE";
    requestMethod["TEXT"] = "TEXT";
    requestMethod["QUERY"] = "QUERY";
    requestMethod["PARAM"] = "PARAM";
    requestMethod["HEADER"] = "HEADER";
})(requestMethod || (exports.requestMethod = requestMethod = {}));
exports.request = {
    JSON: { where: "body", requires: ["jsonParser"] },
    XML: { where: "body", requires: [] },
    FILE: { where: "files", requires: [] },
    TEXT: { where: "body", requires: [] },
    QUERY: { where: "query", requires: ["urlencodedParser"] },
    PARAM: { where: "params", requires: [] },
    HEADER: { where: "headers", requires: [] },
};
exports.web = {
    name: "web",
    init: init,
    bind: bind,
    middleware: middleware,
    apibase: API_BASE
};
function init(options) {
    var _a;
    if (options.apibase)
        exports.web.apibase = options.apibase;
    for (let index = 0; index < middlewares.length; index++) {
        const middleware = middlewares[index];
        const callback = ((middleware === null || middleware === void 0 ? void 0 : middleware.arguments) ? { callback: resolver(middleware) } : middleware).callback;
        middleware.namespace ? exports.app.use("/" + ((exports.web.apibase) ? exports.web.apibase + "/" : "") + middleware.namespace, callback)
            : exports.app.use(callback);
    }
    exports.app.use("/" + exports.web.apibase, exports.router);
    if (!options.httplistener)
        throw Error("HttpListener option not passed, express listen failed to start");
    //options.httplistener?.createServer(app, options.httpoptions);
    options.httpserverout = (_a = options.httplistener) === null || _a === void 0 ? void 0 : _a.createServer(exports.app, options.httpoptions);
}
function bind(service) {
    if (!("request" in service.method[0])) {
        console.log("WARNING: FAILED TO BIND SERVICE: " + service.name);
        return;
    }
    service.method.forEach((method, index) => {
        var _a, _b;
        // find all of our url params and push them to and array with an optional flag
        // then ensure only the LAST param is optional or stuff will break
        // after build urls based off of param length, do more than once if we have an optional param
        const urlargs = [];
        if (method.middleware && !Array.isArray(method.middleware))
            method.middleware = [method.middleware];
        if (method.middleware)
            (_a = method.middleware) === null || _a === void 0 ? void 0 : _a.forEach((middleware, index) => {
                if (!middleware.arguments)
                    return;
                Object.keys((middleware === null || middleware === void 0 ? void 0 : middleware.arguments) || {}).forEach((key) => {
                    // this is needed because of TS limitations but is already ensured by the check above
                    if (!middleware.arguments)
                        return;
                    const argument = middleware === null || middleware === void 0 ? void 0 : middleware.arguments[key];
                    if (argument.requestMethod === requestMethod.PARAM)
                        urlargs.push({ key, optional: (!argument.type || argument.type.includes("undefined") || argument.type.includes("null")) });
                });
            });
        Object.keys((method === null || method === void 0 ? void 0 : method.arguments) || {}).forEach((key) => {
            if (!method.arguments)
                return;
            const argument = method === null || method === void 0 ? void 0 : method.arguments[key];
            if (argument.requestMethod === requestMethod.PARAM)
                urlargs.push({ key, optional: (!argument.type || argument.type.includes("undefined") || argument.type.includes("null")) });
        });
        urlargs.forEach((arg, index) => {
            if (arg.optional && index + 1 < urlargs.length)
                throw Error(`ERROR: ${service.name} : ${method.name}, ${arg.key} param argument must be last url parameter to be typeof undefined or null`);
        });
        for (let i = 0, len = ((urlargs === null || urlargs === void 0 ? void 0 : urlargs.find(({ optional }) => optional)) ? 1 : 0) + 1; i < len; i++) {
            const url = buildURL(service, method.name, urlargs.slice(0, (!i && len > 1) ? -1 : undefined));
            if (method.middleware)
                (_b = method.middleware) === null || _b === void 0 ? void 0 : _b.forEach((m) => {
                    middleware(Object.assign(Object.assign({}, m), { namespace: url.slice(1) }));
                });
            exports.router[method === null || method === void 0 ? void 0 : method.request](url, resolver(method));
        }
    });
}
function middleware(middleware) {
    middlewares.push(middleware);
    middlewareFunctions.push(middleware.callback.name);
}
/**
 * @private
 * builds the URL for each service's method
 */
function buildURL(service, methodname, urlarguments) {
    let url = "/" + service.name + "/" + ((service.version) ? service.version + "/" : "") + methodname;
    urlarguments.forEach(({ key }) => {
        url += "/:" + key;
    });
    return url;
}
function collectParams(req, res, method) {
    const param = {};
    for (const argument in method.arguments) {
        const target = method.arguments[argument];
        const requestmethod = exports.request[target.requestMethod];
        //ensure all middlewares are loaded that are required for some request types
        //this can be done elsewhere so we dont have to run this with EVERY param check.
        //we can scan all the registered objects on init and then run this loop to check
        //ideally we would pass this off the the framework so the framework would have the abiliy
        //to take in an object set of requires for all the service argument types
        if (requestmethod.requires.filter((m) => middlewareFunctions.every((item) => !m.includes(item))).length)
            console.log(`WARNING: Missing middleware(s) ${requestmethod.requires.join("and")} for request method type of ${target.requestMethod}`);
        req["polyexpressErrorState"] = {};
        param[argument] = (req[requestmethod.where] || req["polyexpressErrorState"])[argument];
        //	const test = ensure(target, param[argument], argument);
        //	if(!test || (typeof test !== "boolean" && ('blame' in (test as ensurefail)))) return test;
    }
    return param;
}
function resolver(method) {
    return function (req, res, next) {
        (0, polyservice_1.invoke)(method, Object.assign(Object.assign({}, (collectParams(req, res, method))), { next: next, context: res.locals.context }))
            .then((resolve) => {
            if (!resolve || (typeof resolve !== "boolean" && ('blame' in resolve))) {
                return res.status(400).send(resolve === null || resolve === void 0 ? void 0 : resolve.toString());
            }
            if (method)
                return res.status(resolve.code).send(JSON.stringify(resolve));
        }).catch((e) => { console.error(e); return res.status(500).end(); });
    };
}
