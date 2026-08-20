const STRICT_JSON_KNOWLEDGE = {
	mode: "strict",
	typeSymbol: "@dsh-control-center/knowledge-json",
	schema: { parse(value) {
		structuredClone(value);
		return value;
	} }
};
//#endregion
//#region lib/types/knowledge-remote-client.js
/** Client descriptor contribution for the Control Center knowledge service. */
const knowledgeRemote = {
	package: "@dsh-control-center/control-center",
	descriptors: [
		{
			method: "listBases",
			parameters: []
		},
		{
			method: "createBase",
			parameters: ["request"]
		},
		{
			method: "getBase",
			parameters: ["baseId"]
		},
		{
			method: "deleteBase",
			parameters: ["baseId"]
		},
		{
			method: "renameBase",
			parameters: ["baseId", "name"]
		},
		{
			method: "addText",
			parameters: ["request"]
		},
		{
			method: "addUrl",
			parameters: ["request"]
		},
		{
			method: "addFile",
			parameters: ["request"]
		},
		{
			method: "addDirectory",
			parameters: ["request"]
		},
		{
			method: "listSources",
			parameters: ["baseId"]
		},
		{
			method: "deleteSource",
			parameters: ["baseId", "sourceId"]
		},
		{
			method: "indexBase",
			parameters: ["baseId"]
		},
		{
			method: "listChunks",
			parameters: [
				"baseId",
				"cursor",
				"limit"
			]
		},
		{
			method: "retrieve",
			parameters: ["request"]
		}
	].map(({ method, implementation, parameters }) => ({
		id: `@dsh-control-center/control-center#controlCenterKnowledge/${method}`,
		service: "controlCenterKnowledge",
		namespace: "controlCenterKnowledge",
		method,
		...implementation === void 0 ? {} : { implementation },
		invocation: { kind: "direct" },
		parameters: parameters.map((name) => ({
			name,
			wire: name,
			source: "json",
			codec: STRICT_JSON_KNOWLEDGE
		})),
		result: STRICT_JSON_KNOWLEDGE
	}))
};
//#endregion
export { knowledgeRemote as t };
