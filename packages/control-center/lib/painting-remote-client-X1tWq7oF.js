const STRICT_JSON_PAINTING = {
	mode: "strict",
	typeSymbol: "@dsh-control-center/painting-json",
	schema: { parse(value) {
		structuredClone(value);
		return value;
	} }
};
//#endregion
//#region lib/types/painting-remote-client.js
/** Client descriptor contribution for the Control Center painting service. */
const paintingRemote = {
	package: "@dsh-control-center/control-center",
	descriptors: [
		{
			method: "catalog",
			parameters: []
		},
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
		}
	].map(({ method, implementation, parameters }) => ({
		id: `@dsh-control-center/control-center#controlCenterPainting/${method}`,
		service: "controlCenterPainting",
		namespace: "controlCenterPainting",
		method,
		...implementation === void 0 ? {} : { implementation },
		invocation: { kind: "direct" },
		parameters: parameters.map((name) => ({
			name,
			wire: name,
			source: "json",
			codec: STRICT_JSON_PAINTING
		})),
		result: STRICT_JSON_PAINTING
	}))
};
//#endregion
export { paintingRemote as t };
