import express, { Router } from "express";
import { service, method, polyarg, invoke, ensurefail, ensure, controller, result, middleware, controllerOptions } from "polyservice";
import { createServer as http } from "http";
import { createServer as https } from "https";

export default express;
export const app = express();
export const router = Router();
const middlewares:middleware[] = [];
let middlewareFunctions:string[] = [];
const API_BASE:string = process.env.API_BASE || "";

export enum requestType {
	GET 	= "get",
	POST 	= "post",
	PUT 	= "put",
	DELETE 	= "delete",
	PATCH 	= "patch",
	OPTIONS = "options",
	HEAD 	= "head",
	CONNECT = "connect",
	TRACE 	= "trace"
}

export enum requestMethod{
	JSON  = "JSON",
	XML   = "XML",
	FILE  = "FILE",
	TEXT  = "TEXT",
	QUERY = "QUERY",
	PARAM = "PARAM",
	HEADER= "HEADER",
}

export const request = {
	JSON  : {where: "body", requires:["jsonParser"]},
	XML   : {where: "body", requires:[]},
	FILE  : {where: "files", requires:[]},
	TEXT  : {where: "body", requires:[]},
	QUERY : {where: "query", requires:["urlencodedParser"]},
	PARAM : {where: "params", requires:[]},
	HEADER: {where: "headers", requires:[]},
}

export interface webMethod extends method {
	request:requestType;
	arguments?:{[name:string]:webarg};
	middleware?:webMiddleware|webMiddleware[];
}

export interface webMiddleware extends middleware{
	arguments?:{[name:string]:webarg};
}

export interface webService extends service {
	method: webMethod[];
}

export type webarg = polyarg & {
	requestMethod:requestMethod	
}

export const web:controller & {apibase:string|undefined} = {
    name: "web",
    init: init,
    bind: bind,
    middleware: middleware,
    apibase: API_BASE
};

function init(options:{ httplistener:any, httpoptions?:any, httpserverout?:any, apibase?:string } & controllerOptions) {
	if(options.apibase) web.apibase = options.apibase;
	for (let index = 0; index < middlewares.length; index++) {
		const middleware:middleware | any = middlewares[index];
		const callback = ((middleware?.arguments) ? {callback: resolver(middleware)} : middleware).callback;
			
		middleware.namespace ? app.use("/"+((web.apibase) ? web.apibase+"/" : "")+middleware.namespace, callback)
		       	: app.use(callback);
	}

	app.use("/"+web.apibase, router);
	if(!options.httplistener) throw Error("HttpListener option not passed, express listen failed to start");

	//options.httplistener?.createServer(app, options.httpoptions);
	options.httpserverout = options.httplistener?.createServer(app, options.httpoptions);
}

function bind(service:webService) {
	if(!("request" in (service.method[0] as webMethod))){ console.log("WARNING: FAILED TO BIND SERVICE: " + service.name); return; }
	service.method.forEach((method:webMethod, index:number)=> {
		// find all of our url params and push them to and array with an optional flag
		// then ensure only the LAST param is optional or stuff will break
		// after build urls based off of param length, do more than once if we have an optional param
		const urlargs:{key:string, optional?:boolean}[] = [];
		
		if(method.middleware && !Array.isArray(method.middleware)) method.middleware = [method.middleware];
	
		if(method.middleware)
			method.middleware?.forEach((middleware:webMiddleware, index:number) => {
				if(!middleware.arguments) return;

				Object.keys(middleware?.arguments||{}).forEach((key:string) => {
					// this is needed because of TS limitations but is already ensured by the check above
					if(!middleware.arguments) return;
					const argument:webarg = middleware?.arguments[key];
					if(argument.requestMethod === requestMethod.PARAM) urlargs.push({key, optional:(!argument.type || argument.type.includes("undefined") || argument.type.includes("null"))})
				});
			});

		Object.keys(method?.arguments||{}).forEach((key:string) => {
			if(!method.arguments) return;
			const argument:webarg = method?.arguments[key];
			if(argument.requestMethod === requestMethod.PARAM) urlargs.push({key, optional:(!argument.type || argument.type.includes("undefined") || argument.type.includes("null"))})
		});

		urlargs.forEach((arg:any, index:number) => {
			if(arg.optional && index+1 < urlargs.length) throw Error(`ERROR: ${service.name} : ${method.name}, ${arg.key} param argument must be last url parameter to be typeof undefined or null`); 
		});
		

		for(let i = 0, len = ((urlargs?.find(({optional}) => optional)) ? 1 : 0) + 1; i < len; i++){
			const url = buildURL(service, method.name, urlargs.slice(0,(!i && len > 1) ? -1 : undefined));
			if(method.middleware)
				method.middleware?.forEach((m:webMiddleware) => {
					middleware({...m, namespace: url.slice(1) })
				})
			router[method?.request](url, resolver(method));
		}
    	});
}


function middleware(middleware:middleware){
	middlewares.push(middleware);
	middlewareFunctions.push(middleware.callback.name);
}

/**
 * @private
 * builds the URL for each service's method
 */
function buildURL(service:webService, methodname:string, urlarguments:{key:string, optional?:boolean}[]):string {
	let url = "/" +service.name+"/" + ((service.version) ? service.version + "/" : "") + methodname;
	urlarguments.forEach(({key}) => {
		url+="/:"+key;
	})

	return url;
}

function collectParams(req:any, res:any, method:webMethod|webMiddleware){

	const param:any = {};
	for(const argument in method.arguments){
		const target:webarg = method.arguments[argument];
		const requestmethod:{where:string, requires: string[]} = request[target.requestMethod];

		//ensure all middlewares are loaded that are required for some request types
		//this can be done elsewhere so we dont have to run this with EVERY param check.
		//we can scan all the registered objects on init and then run this loop to check
		//ideally we would pass this off the the framework so the framework would have the abiliy
		//to take in an object set of requires for all the service argument types
		if(requestmethod.requires.filter((m) => middlewareFunctions.every((item:any) => !m.includes(item))).length) 
			console.log(`WARNING: Missing middleware(s) ${requestmethod.requires.join("and")} for request method type of ${target.requestMethod}`);

		req["polyexpressErrorState"] = {}
		param[argument] = (req[requestmethod.where] || req["polyexpressErrorState"])[argument];

	//	const test = ensure(target, param[argument], argument);
	//	if(!test || (typeof test !== "boolean" && ('blame' in (test as ensurefail)))) return test;

	}
	return param;
}

type invoker = (req:any, res:any, next:Function) => void;

function resolver(method:webMethod|webMiddleware): invoker {   
	return function (req:any, res:any, next:Function){
		invoke(method, {...(collectParams(req,res,method)), next:next, context:res.locals.context})
			.then((resolve:result|ensurefail)=>{
				if(!resolve || (typeof resolve !== "boolean" && ('blame' in (resolve as ensurefail)))) { return res.status(400).send(resolve?.toString());}
				if((method as webMethod)) return res.status((resolve as result).code).send(JSON.stringify(resolve));
			}).catch((e:any) => {console.error(e); return res.status(500).end()});
	}
}
