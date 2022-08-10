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
exports.web = exports.requestMethod = exports.requestType = void 0;
const express_1 = __importStar(require("express"));
const polyservice_1 = require("../polyservice");
exports.default = express_1.default;
const app = (0, express_1.default)();
const router = (0, express_1.Router)();
const middlewares = [];
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
    requestMethod[requestMethod["JSON"] = 0] = "JSON";
    requestMethod[requestMethod["XML"] = 1] = "XML";
    requestMethod[requestMethod["FILE"] = 2] = "FILE";
    requestMethod[requestMethod["TEXT"] = 3] = "TEXT";
    requestMethod[requestMethod["QUERY"] = 4] = "QUERY";
    requestMethod[requestMethod["PARAM"] = 5] = "PARAM";
})(requestMethod = exports.requestMethod || (exports.requestMethod = {}));
exports.web = {
    name: "web",
    init: init,
    bind: bind,
    middleware: middleware,
    apibase: API_BASE
};
// Pass options throught init so we can use them in controllers later :D 
function init(options) {
    if (options.apibase)
        exports.web.apibase = options.apibase;
    for (let index = 0; index < middlewares.length; index++) {
        const middleware = middlewares[index];
        console.log(">>>>>>>>>>", middleware.callback.name);
        middleware.namespace ? app.use("/" + ((exports.web.apibase) ? exports.web.apibase + "/" : "") + middleware.namespace, middleware.callback) : app.use(middleware.callback);
    }
    app.use("/" + exports.web.apibase, router);
    if (!options.httplistener)
        throw new Error("HttpListener option not passed, express listen failed to start");
    //	options.httpserverout = options.httplistener.createServer(app, options.httpoptions);
}
function bind(service) {
    // setup the context so we can use it later
    //	app.use((req:any, res:any, next:Function) => {
    //	    if(!res.locals.context) res.locals.context = {}; 
    //	    return next();
    //	});
    //
    //	if(!("request" in (service.method[0] as webMethod))){ console.log("WARNING: FAILED TO BIND SERVICE: " + service.name); return; }
    service.method.forEach((method, index) => {
        //	const urls:string[] = [];
        //	const urlargs:{key:string, optional?:boolean}[] = []
        //	Object.keys(method.arguments).forEach((key:string) => {
        //		const argument:webarg = method?.arguments[key];
        //		let optional:boolean = false;
        //		if(argument.requestMethod === requestMethod.PARAM){
        //			if(!argument.type?.includes("undefinded"))
        //				optional = true;
        //			urls.push({key, optional})
        //		}
        //	});
        //	
        //	urlargs.forEach((arg)=>{
        //		if(arg.optional)
        //			urls.push(buildURL(service.name, method.name));
        //	});
        const url = buildURL(service, method);
        //        if(method.protect != undefined && method.protect != null){
        //            const protection:iauth = method.protect;
        //
        //            router.use(url, (async(req, res, next) => { 
        //                // @TODO: generalize this so we dont leave it up to the interfaces to define the bitshifting for the services
        //                // const protectContext = await protect(protection, { service: { name: service.name, id:1 << index, },  body:req.body, headers:req.headers, param:req.params, query:req.query })
        //                const protectContext = await protect(protection, { service: { name: service.name, id:1 << index },  req })
        //
        //                if(!protectContext)
        //                    return res.status(401).end();
        //
        //                res.locals.context.protect = protectContext
        //                return next();
        //         }));
        //        }
        router[method === null || method === void 0 ? void 0 : method.request](url, function (req, res) { resolver(req, res, method); });
    });
}
function middleware(middleware) {
    console.log(">>>>>>>>>", middleware);
    middlewares.push(middleware);
}
/**
 * @private
 * builds the URL for each service's method
 */
function buildURL(service, method) {
    let url = "/" + service.name + "/" + ((service.version) ? service.version + "/" : "") + method.name;
    //    if((method.protect && method.protect.type === authType.PARAM )|| (method.protect && method.protect.type === authType.PARAM_AUTHORIZATION )|| (method.protect && method.protect.type === authType.PARAM_BODY))
    //        url +=  "/:"+method.protect.key;
    //
    //	if(method.arguments) 
    //    Object.keys(method.arguments).forEach((key:string) => {
    //	    // need to add another check because typescript strict mode sucks and doesnt realise this cant be undefined if we checked already
    //	    if(!method.arguments) return;
    //	    const argument:webarg = method?.arguments[key];
    //	    if(argument.requestMethod === requestMethod.PARAM)
    //		    url += "/:"+key
    //    });
    return url;
}
function resolver(req, res, method) {
    return __awaiter(this, void 0, void 0, function* () {
        //	const param:any[] = [];
        const param = {};
        for (const argument in method.arguments) {
            const target = method.arguments[argument];
            if (target.requestMethod === requestMethod.PARAM)
                //param.push(req.params[argument]);	
                param[argument] = req.params[argument];
            else if (target.requestMethod === requestMethod.JSON || target.requestMethod === requestMethod.XML)
                //param.push(req.body[argument]);	
                param[argument] = req.body[argument];
            else if (target.requestMethod === requestMethod.QUERY)
                //param.push(req.query[argument]);
                param[argument] = req.query[argument];
            else if (target.requestMethod === requestMethod.TEXT) { }
            else if (target.requestMethod === requestMethod.FILE)
                //param.push(req.file[argument]);
                param[argument] = req.file[argument];
            // @TODO: add the rest of the format options
            //const test = ensure(target, param[param.length - 1], argument);
            const test = (0, polyservice_1.ensure)(target, param[argument], argument);
            if (!test || (typeof test !== "boolean" && ('blame' in test)))
                return res.status(400).send(test.toString());
        }
        const ret = (0, polyservice_1.invoke)(method, Object.assign(Object.assign({}, param), { context: res.locals.context }));
        if (!ret || (typeof ret !== "boolean" && ('blame' in ret))) {
            console.log(ret.toString());
            return res.status(400).end();
        }
        //    const result:result = method.callback(...param, res.locals.context);
        //
        //    if(!result) res.status(500).end();
        //
        //    if(res.locals.context.store)
        //        for (let index = 0; index < Object.entries(res.locals.context.store).length; index++) {
        //            const element = Object.entries(res.locals.context.store)[index];
        //            res.cookie(element[0], element[1], res.locals.context?.storeopts);           
        //        }
        //    res.locals.context = null;    
        //
        //    // @TODO: add support for redirecting and making requests
        //    if(result.redirect) return res.redirect(result.code || 302, result.redirect);
        //    //@TODO: rework for multiple types, use enum not strings
        //    res.type(result.type || "application/json");
        //    // if(result.type !== undefined) res.type(result.type || "application/json");
        //
        //    if(result.error)
        //        return res.status(result.code).send(result);
        //
        //return res.status(result.code).send((result.type !== undefined) ? result.message : JSON.stringify(result));
        return res.status(ret.code).send(JSON.stringify(ret));
    });
}
