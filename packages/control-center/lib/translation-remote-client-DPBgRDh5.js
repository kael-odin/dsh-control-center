const STRICT_JSON = {
	mode: "strict",
	typeSymbol: "@dsh-control-center/json",
	schema: { parse(value) {
		structuredClone(value);
		return value;
	} }
};
//#endregion
//#region lib/types/translation-remote-client.js
/** Client descriptor contribution for the Control Center translation service. */
const translationRemote = {
	package: "@dsh-control-center/control-center",
	descriptors: [
		{
			method: "start",
			parameters: ["request"]
		},
		{
			method: "get",
			parameters: ["jobId"]
		},
		{
			method: "cancel",
			parameters: ["jobId"]
		},
		{
			method: "history",
			implementation: "listHistory",
			parameters: ["cursor", "limit"]
		},
		{
			method: "deleteHistory",
			parameters: ["id"]
		},
		{
			method: "starHistory",
			parameters: ["id", "starred"]
		},
		{
			method: "clearHistory",
			parameters: []
		},
		{
			method: "getPrompt",
			parameters: []
		},
		{
			method: "setPrompt",
			parameters: ["prompt"]
		},
		{
			method: "languages",
			parameters: []
		},
		{
			method: "putLanguage",
			parameters: ["id", "label"]
		},
		{
			method: "deleteLanguage",
			parameters: ["id"]
		}
	].map(({ method, implementation, parameters }) => ({
		id: `@dsh-control-center/control-center#controlCenterTranslation/${method}`,
		service: "controlCenterTranslation",
		namespace: "controlCenterTranslation",
		method,
		...implementation === void 0 ? {} : { implementation },
		invocation: { kind: "direct" },
		parameters: parameters.map((name) => ({
			name,
			wire: name,
			source: "json",
			codec: STRICT_JSON
		})),
		result: STRICT_JSON
	}))
};
//#endregion
export { STRICT_JSON as n, translationRemote as t };
