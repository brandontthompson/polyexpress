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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.web = exports.request = exports.requestMethod = exports.requestType = void 0;
const express_1 = __importStar(require("express"));
const polyservice_1 = require("../polyservice");
exports.default = express_1.default;
const app = (0, express_1.default)();
const router = (0, express_1.Router)();
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
})(requestType = exports.requestType || (exports.requestType = {}));
var requestMethod;
(function (requestMethod) {
    requestMethod["JSON"] = "JSON";
    requestMethod["XML"] = "XML";
    requestMethod["FILE"] = "FILE";
    requestMethod["TEXT"] = "TEXT";
    requestMethod["QUERY"] = "QUERY";
    requestMethod["PARAM"] = "PARAM";
})(requestMethod = exports.requestMethod || (exports.requestMethod = {}));
exports.request = {
    JSON: { where: "body", requires: ["jsonParser"] },
    XML: { where: "body", requires: [] },
    FILE: { where: "files", requires: [] },
    TEXT: { where: "body", requires: [] },
    QUERY: { where: "query", requires: ["urlencodedParser"] },
    PARAM: { where: "params", requires: [] },
};
exports.web = {
    name: "web",
    init: init,
    bind: bind,
    middleware: middleware,
    apibase: API_BASE
};
function init(options) {
    if (options.apibase)
        exports.web.apibase = options.apibase;
    for (let index = 0; index < middlewares.length; index++) {
        const middleware = middlewares[index];
        middleware.namespace ? app.use("/" + ((exports.web.apibase) ? exports.web.apibase + "/" : "") + middleware.namespace, middleware.callback) : app.use(middleware.callback);
    }
    app.use("/" + exports.web.apibase, router);
    if (!options.httplistener)
        throw Error("HttpListener option not passed, express listen failed to start");
    options.httpserverout = options.httplistener(app, options.httpoptions);
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
                if (middleware.requestMethod && middleware.requestMethod === requestMethod.PARAM)
                    urlargs.push({ key: "middleware" + index, optional: false });
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
        for (let i = 0, len = [(urlargs === null || urlargs === void 0 ? void 0 : urlargs.find(({ optional }) => optional))].length + 1; i < len; i++) {
            const url = buildURL(service, method.name, urlargs.slice(0, (!i) ? -1 : undefined));
            if (method.middleware)
                (_b = method.middleware) === null || _b === void 0 ? void 0 : _b.forEach((middleware) => {
                    //app.use(url, middleware.callback);
                });
            router[method === null || method === void 0 ? void 0 : method.request](url, function (req, res) { resolver(req, res, method); });
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
function resolver(req, res, method) {
    return __awaiter(this, void 0, void 0, function* () {
        const param = {};
        for (const argument in method.arguments) {
            const target = method.arguments[argument];
            const requestmethod = exports.request[target.requestMethod];
            //ensure all middlewares are loaded that are required for some request types
            if (!middlewareFunctions.filter((m) => requestmethod.requires.every((item) => m.includes(item))).length)
                console.log(`WARNING: Missing middleware(s) ${requestmethod.requires.join("and")} for request method type of ${target.requestMethod}`);
            param[argument] = req[requestmethod.where][argument];
            const test = (0, polyservice_1.ensure)(target, param[argument], argument);
            if (!test || (typeof test !== "boolean" && ('blame' in test)))
                return res.status(400).send(test.toString());
        }
        (0, polyservice_1.invoke)(method, Object.assign(Object.assign({}, param), { context: res.locals.context }))
            .then((resolve) => {
            if (!resolve || (typeof resolve !== "boolean" && ('blame' in resolve))) {
                console.log(resolve.toString());
                return res.status(400).end();
            }
            return res.status(resolve.code).send(JSON.stringify(resolve));
        }).catch((e) => { console.log(e); res.status(500).end(); });
    });
}
