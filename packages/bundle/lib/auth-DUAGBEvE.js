import { _ as _coercedNumber, c as any, d as literal, f as looseObject, g as url, h as string, l as array, m as object, p as number$1, r as LATEST_PROTOCOL_VERSION, s as ZodNumber, u as boolean, v as NEVER } from "./lib-CXmEKGO-.js";
//#region node_modules/.pnpm/eventsource-parser@3.1.1/node_modules/eventsource-parser/dist/index.js
var ParseError = class extends Error {
	constructor(message, options) {
		super(message), this.name = "ParseError", this.type = options.type, this.field = options.field, this.value = options.value, this.line = options.line;
	}
};
const LF = 10;
const CR = 13;
const SPACE = 32;
function noop(_arg) {}
function createParser(config) {
	if (typeof config == "function") throw new TypeError("`config` must be an object, got a function instead. Did you mean `createParser({onEvent: fn})`?");
	const { onEvent = noop, onError = noop, onRetry = noop, onComment, maxBufferSize } = config, pendingFragments = [];
	let pendingFragmentsLength = 0, isFirstChunk = !0, id, data = "", dataLines = 0, eventType, terminated = !1;
	function feed(chunk) {
		if (terminated) throw new Error("Cannot feed parser: it was terminated after exceeding the configured max buffer size. Call `reset()` to resume parsing.");
		if (isFirstChunk && (isFirstChunk = !1, chunk.charCodeAt(0) === 239 && chunk.charCodeAt(1) === 187 && chunk.charCodeAt(2) === 191 && (chunk = chunk.slice(3))), pendingFragments.length === 0) {
			const trailing2 = processLines(chunk);
			trailing2 !== "" && (pendingFragments.push(trailing2), pendingFragmentsLength = trailing2.length), checkBufferSize();
			return;
		}
		if (chunk.indexOf(`
`) === -1 && chunk.indexOf("\r") === -1) {
			pendingFragments.push(chunk), pendingFragmentsLength += chunk.length, checkBufferSize();
			return;
		}
		pendingFragments.push(chunk);
		const input = pendingFragments.join("");
		pendingFragments.length = 0, pendingFragmentsLength = 0;
		const trailing = processLines(input);
		trailing !== "" && (pendingFragments.push(trailing), pendingFragmentsLength = trailing.length), checkBufferSize();
	}
	function checkBufferSize() {
		maxBufferSize !== void 0 && (pendingFragmentsLength + data.length <= maxBufferSize || (terminated = !0, pendingFragments.length = 0, pendingFragmentsLength = 0, id = void 0, data = "", dataLines = 0, eventType = void 0, onError(new ParseError(`Buffered data exceeded max buffer size of ${maxBufferSize} characters`, { type: "max-buffer-size-exceeded" }))));
	}
	function processLines(chunk) {
		let searchIndex = 0;
		if (chunk.indexOf("\r") === -1) {
			let lfIndex = chunk.indexOf(`
`, searchIndex);
			for (; lfIndex !== -1;) {
				if (searchIndex === lfIndex) {
					dataLines > 0 && onEvent({
						id,
						event: eventType,
						data
					}), id = void 0, data = "", dataLines = 0, eventType = void 0, searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
					continue;
				}
				const firstCharCode = chunk.charCodeAt(searchIndex);
				if (isDataPrefix(chunk, searchIndex, firstCharCode)) {
					const valueStart = chunk.charCodeAt(searchIndex + 5) === SPACE ? searchIndex + 6 : searchIndex + 5, value = chunk.slice(valueStart, lfIndex);
					if (dataLines === 0 && chunk.charCodeAt(lfIndex + 1) === LF) {
						onEvent({
							id,
							event: eventType,
							data: value
						}), id = void 0, data = "", eventType = void 0, searchIndex = lfIndex + 2, lfIndex = chunk.indexOf(`
`, searchIndex);
						continue;
					}
					data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
				} else isEventPrefix(chunk, searchIndex, firstCharCode) ? eventType = chunk.slice(chunk.charCodeAt(searchIndex + 6) === SPACE ? searchIndex + 7 : searchIndex + 6, lfIndex) || void 0 : parseLine(chunk, searchIndex, lfIndex);
				searchIndex = lfIndex + 1, lfIndex = chunk.indexOf(`
`, searchIndex);
			}
			return chunk.slice(searchIndex);
		}
		for (; searchIndex < chunk.length;) {
			const crIndex = chunk.indexOf("\r", searchIndex), lfIndex = chunk.indexOf(`
`, searchIndex);
			let lineEnd = -1;
			if (crIndex !== -1 && lfIndex !== -1 ? lineEnd = crIndex < lfIndex ? crIndex : lfIndex : crIndex !== -1 ? crIndex === chunk.length - 1 ? lineEnd = -1 : lineEnd = crIndex : lfIndex !== -1 && (lineEnd = lfIndex), lineEnd === -1) break;
			parseLine(chunk, searchIndex, lineEnd), searchIndex = lineEnd + 1, chunk.charCodeAt(searchIndex - 1) === CR && chunk.charCodeAt(searchIndex) === LF && searchIndex++;
		}
		return chunk.slice(searchIndex);
	}
	function parseLine(chunk, start, end) {
		if (start === end) {
			dispatchEvent();
			return;
		}
		const firstCharCode = chunk.charCodeAt(start);
		if (isDataPrefix(chunk, start, firstCharCode)) {
			const valueStart = chunk.charCodeAt(start + 5) === SPACE ? start + 6 : start + 5, value2 = chunk.slice(valueStart, end);
			data = dataLines === 0 ? value2 : `${data}
${value2}`, dataLines++;
			return;
		}
		if (isEventPrefix(chunk, start, firstCharCode)) {
			eventType = chunk.slice(chunk.charCodeAt(start + 6) === SPACE ? start + 7 : start + 6, end) || void 0;
			return;
		}
		if (firstCharCode === 105 && chunk.charCodeAt(start + 1) === 100 && chunk.charCodeAt(start + 2) === 58) {
			const value2 = chunk.slice(chunk.charCodeAt(start + 3) === SPACE ? start + 4 : start + 3, end);
			value2.includes("\0") || (id = value2);
			return;
		}
		if (firstCharCode === 58) {
			if (onComment) {
				const line2 = chunk.slice(start, end);
				onComment(line2.slice(chunk.charCodeAt(start + 1) === SPACE ? 2 : 1));
			}
			return;
		}
		const line = chunk.slice(start, end), fieldSeparatorIndex = line.indexOf(":");
		if (fieldSeparatorIndex === -1) {
			processField(line, "", line);
			return;
		}
		const field = line.slice(0, fieldSeparatorIndex), offset = line.charCodeAt(fieldSeparatorIndex + 1) === SPACE ? 2 : 1;
		processField(field, line.slice(fieldSeparatorIndex + offset), line);
	}
	function processField(field, value, line) {
		switch (field) {
			case "event":
				eventType = value || void 0;
				break;
			case "data":
				data = dataLines === 0 ? value : `${data}
${value}`, dataLines++;
				break;
			case "id":
				value.includes("\0") || (id = value);
				break;
			case "retry":
				/^\d+$/.test(value) ? onRetry(parseInt(value, 10)) : onError(new ParseError(`Invalid \`retry\` value: "${value}"`, {
					type: "invalid-retry",
					value,
					line
				}));
				break;
			default: onError(new ParseError(`Unknown field "${field.length > 20 ? `${field.slice(0, 20)}\u2026` : field}"`, {
				type: "unknown-field",
				field,
				value,
				line
			}));
		}
	}
	function dispatchEvent() {
		dataLines > 0 && onEvent({
			id,
			event: eventType,
			data
		}), id = void 0, data = "", dataLines = 0, eventType = void 0;
	}
	function reset(options = {}) {
		if (options.consume && pendingFragments.length > 0) {
			const incompleteLine = pendingFragments.join("");
			parseLine(incompleteLine, 0, incompleteLine.length);
		}
		isFirstChunk = !0, id = void 0, data = "", dataLines = 0, eventType = void 0, pendingFragments.length = 0, pendingFragmentsLength = 0, terminated = !1;
	}
	return {
		feed,
		reset
	};
}
function isDataPrefix(chunk, i, firstCharCode) {
	return firstCharCode === 100 && chunk.charCodeAt(i + 1) === 97 && chunk.charCodeAt(i + 2) === 116 && chunk.charCodeAt(i + 3) === 97 && chunk.charCodeAt(i + 4) === 58;
}
function isEventPrefix(chunk, i, firstCharCode) {
	return firstCharCode === 101 && chunk.charCodeAt(i + 1) === 118 && chunk.charCodeAt(i + 2) === 101 && chunk.charCodeAt(i + 3) === 110 && chunk.charCodeAt(i + 4) === 116 && chunk.charCodeAt(i + 5) === 58;
}
//#endregion
//#region node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.0_zod@4.4.3/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/transport.js
/**
* Normalizes HeadersInit to a plain Record<string, string> for manipulation.
* Handles Headers objects, arrays of tuples, and plain objects.
*/
function normalizeHeaders(headers) {
	if (!headers) return {};
	if (headers instanceof Headers) return Object.fromEntries(headers.entries());
	if (Array.isArray(headers)) return Object.fromEntries(headers);
	return { ...headers };
}
/**
* Creates a fetch function that includes base RequestInit options.
* This ensures requests inherit settings like credentials, mode, headers, etc. from the base init.
*
* @param baseFetch - The base fetch function to wrap (defaults to global fetch)
* @param baseInit - The base RequestInit to merge with each request
* @returns A wrapped fetch function that merges base options with call-specific options
*/
function createFetchWithInit(baseFetch = fetch, baseInit) {
	if (!baseInit) return baseFetch;
	return async (url, init) => {
		return baseFetch(url, {
			...baseInit,
			...init,
			headers: init?.headers ? {
				...normalizeHeaders(baseInit.headers),
				...normalizeHeaders(init.headers)
			} : baseInit.headers
		});
	};
}
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/compat.js
/** @deprecated Use the raw string literal codes instead, e.g. "invalid_type". */
const ZodIssueCode = {
	invalid_type: "invalid_type",
	too_big: "too_big",
	too_small: "too_small",
	invalid_format: "invalid_format",
	not_multiple_of: "not_multiple_of",
	unrecognized_keys: "unrecognized_keys",
	invalid_union: "invalid_union",
	invalid_key: "invalid_key",
	invalid_element: "invalid_element",
	invalid_value: "invalid_value",
	custom: "custom"
};
/** @deprecated Do not use. Stub definition, only included for zod-to-json-schema compatibility. */
var ZodFirstPartyTypeKind;
ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {});
//#endregion
//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/coerce.js
function number(params) {
	return _coercedNumber(ZodNumber, params);
}
//#endregion
//#region node_modules/.pnpm/pkce-challenge@5.0.1/node_modules/pkce-challenge/dist/index.node.js
let crypto;
crypto = globalThis.crypto?.webcrypto ?? globalThis.crypto ?? import("node:crypto").then((m) => m.webcrypto);
/**
* Creates an array of length `size` of random bytes
* @param size
* @returns Array of random ints (0 to 255)
*/
async function getRandomValues(size) {
	return (await crypto).getRandomValues(new Uint8Array(size));
}
/** Generate cryptographically strong random string
* @param size The desired length of the string
* @returns The random string
*/
async function random(size) {
	const mask = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~";
	const evenDistCutoff = Math.pow(2, 8) - Math.pow(2, 8) % 66;
	let result = "";
	while (result.length < size) {
		const randomBytes = await getRandomValues(size - result.length);
		for (const randomByte of randomBytes) if (randomByte < evenDistCutoff) result += mask[randomByte % 66];
	}
	return result;
}
/** Generate a PKCE challenge verifier
* @param length Length of the verifier
* @returns A random verifier `length` characters long
*/
async function generateVerifier(length) {
	return await random(length);
}
/** Generate a PKCE code challenge from a code verifier
* @param code_verifier
* @returns The base64 url encoded code challenge
*/
async function generateChallenge(code_verifier) {
	const buffer = await (await crypto).subtle.digest("SHA-256", new TextEncoder().encode(code_verifier));
	return btoa(String.fromCharCode(...new Uint8Array(buffer))).replace(/\//g, "_").replace(/\+/g, "-").replace(/=/g, "");
}
/** Generate a PKCE challenge pair
* @param length Length of the verifer (between 43-128). Defaults to 43.
* @returns PKCE challenge pair
*/
async function pkceChallenge(length) {
	if (!length) length = 43;
	if (length < 43 || length > 128) throw `Expected a length between 43 and 128. Received ${length}.`;
	const verifier = await generateVerifier(length);
	return {
		code_verifier: verifier,
		code_challenge: await generateChallenge(verifier)
	};
}
//#endregion
//#region node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.0_zod@4.4.3/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/auth.js
/**
* Reusable URL validation that disallows javascript: scheme
*/
const SafeUrlSchema = url().superRefine((val, ctx) => {
	if (!URL.canParse(val)) {
		ctx.addIssue({
			code: ZodIssueCode.custom,
			message: "URL must be parseable",
			fatal: true
		});
		return NEVER;
	}
}).refine((url) => {
	const u = new URL(url);
	return u.protocol !== "javascript:" && u.protocol !== "data:" && u.protocol !== "vbscript:";
}, { message: "URL cannot use javascript:, data:, or vbscript: scheme" });
/**
* RFC 9728 OAuth Protected Resource Metadata
*/
const OAuthProtectedResourceMetadataSchema = looseObject({
	resource: string().url(),
	authorization_servers: array(SafeUrlSchema).optional(),
	jwks_uri: string().url().optional(),
	scopes_supported: array(string()).optional(),
	bearer_methods_supported: array(string()).optional(),
	resource_signing_alg_values_supported: array(string()).optional(),
	resource_name: string().optional(),
	resource_documentation: string().optional(),
	resource_policy_uri: string().url().optional(),
	resource_tos_uri: string().url().optional(),
	tls_client_certificate_bound_access_tokens: boolean().optional(),
	authorization_details_types_supported: array(string()).optional(),
	dpop_signing_alg_values_supported: array(string()).optional(),
	dpop_bound_access_tokens_required: boolean().optional()
});
/**
* RFC 8414 OAuth 2.0 Authorization Server Metadata
*/
const OAuthMetadataSchema = looseObject({
	issuer: string(),
	authorization_endpoint: SafeUrlSchema,
	token_endpoint: SafeUrlSchema,
	registration_endpoint: SafeUrlSchema.optional(),
	scopes_supported: array(string()).optional(),
	response_types_supported: array(string()),
	response_modes_supported: array(string()).optional(),
	grant_types_supported: array(string()).optional(),
	token_endpoint_auth_methods_supported: array(string()).optional(),
	token_endpoint_auth_signing_alg_values_supported: array(string()).optional(),
	service_documentation: SafeUrlSchema.optional(),
	revocation_endpoint: SafeUrlSchema.optional(),
	revocation_endpoint_auth_methods_supported: array(string()).optional(),
	revocation_endpoint_auth_signing_alg_values_supported: array(string()).optional(),
	introspection_endpoint: string().optional(),
	introspection_endpoint_auth_methods_supported: array(string()).optional(),
	introspection_endpoint_auth_signing_alg_values_supported: array(string()).optional(),
	code_challenge_methods_supported: array(string()).optional(),
	client_id_metadata_document_supported: boolean().optional()
});
/**
* OpenID Connect Discovery 1.0 Provider Metadata
* see: https://openid.net/specs/openid-connect-discovery-1_0.html#ProviderMetadata
*/
const OpenIdProviderMetadataSchema = looseObject({
	issuer: string(),
	authorization_endpoint: SafeUrlSchema,
	token_endpoint: SafeUrlSchema,
	userinfo_endpoint: SafeUrlSchema.optional(),
	jwks_uri: SafeUrlSchema,
	registration_endpoint: SafeUrlSchema.optional(),
	scopes_supported: array(string()).optional(),
	response_types_supported: array(string()),
	response_modes_supported: array(string()).optional(),
	grant_types_supported: array(string()).optional(),
	acr_values_supported: array(string()).optional(),
	subject_types_supported: array(string()),
	id_token_signing_alg_values_supported: array(string()),
	id_token_encryption_alg_values_supported: array(string()).optional(),
	id_token_encryption_enc_values_supported: array(string()).optional(),
	userinfo_signing_alg_values_supported: array(string()).optional(),
	userinfo_encryption_alg_values_supported: array(string()).optional(),
	userinfo_encryption_enc_values_supported: array(string()).optional(),
	request_object_signing_alg_values_supported: array(string()).optional(),
	request_object_encryption_alg_values_supported: array(string()).optional(),
	request_object_encryption_enc_values_supported: array(string()).optional(),
	token_endpoint_auth_methods_supported: array(string()).optional(),
	token_endpoint_auth_signing_alg_values_supported: array(string()).optional(),
	display_values_supported: array(string()).optional(),
	claim_types_supported: array(string()).optional(),
	claims_supported: array(string()).optional(),
	service_documentation: string().optional(),
	claims_locales_supported: array(string()).optional(),
	ui_locales_supported: array(string()).optional(),
	claims_parameter_supported: boolean().optional(),
	request_parameter_supported: boolean().optional(),
	request_uri_parameter_supported: boolean().optional(),
	require_request_uri_registration: boolean().optional(),
	op_policy_uri: SafeUrlSchema.optional(),
	op_tos_uri: SafeUrlSchema.optional(),
	client_id_metadata_document_supported: boolean().optional()
});
/**
* OpenID Connect Discovery metadata that may include OAuth 2.0 fields
* This schema represents the real-world scenario where OIDC providers
* return a mix of OpenID Connect and OAuth 2.0 metadata fields
*/
const OpenIdProviderDiscoveryMetadataSchema = object({
	...OpenIdProviderMetadataSchema.shape,
	...OAuthMetadataSchema.pick({ code_challenge_methods_supported: true }).shape
});
/**
* OAuth 2.1 token response
*/
const OAuthTokensSchema = object({
	access_token: string(),
	id_token: string().optional(),
	token_type: string(),
	expires_in: number().optional(),
	scope: string().optional(),
	refresh_token: string().optional()
}).strip();
/**
* OAuth 2.1 error response
*/
const OAuthErrorResponseSchema = object({
	error: string(),
	error_description: string().optional(),
	error_uri: string().optional()
});
/**
* Optional version of SafeUrlSchema that allows empty string for retrocompatibility on tos_uri and logo_uri
*/
const OptionalSafeUrlSchema = SafeUrlSchema.optional().or(literal("").transform(() => void 0));
/**
* RFC 7591 OAuth 2.0 Dynamic Client Registration metadata
*/
const OAuthClientMetadataSchema = object({
	redirect_uris: array(SafeUrlSchema),
	token_endpoint_auth_method: string().optional(),
	grant_types: array(string()).optional(),
	response_types: array(string()).optional(),
	client_name: string().optional(),
	client_uri: SafeUrlSchema.optional(),
	logo_uri: OptionalSafeUrlSchema,
	scope: string().optional(),
	contacts: array(string()).optional(),
	tos_uri: OptionalSafeUrlSchema,
	policy_uri: string().optional(),
	jwks_uri: SafeUrlSchema.optional(),
	jwks: any().optional(),
	software_id: string().optional(),
	software_version: string().optional(),
	software_statement: string().optional()
}).strip();
/**
* RFC 7591 OAuth 2.0 Dynamic Client Registration client information
*/
const OAuthClientInformationSchema = object({
	client_id: string(),
	client_secret: string().optional(),
	client_id_issued_at: number$1().optional(),
	client_secret_expires_at: number$1().optional()
}).strip();
/**
* RFC 7591 OAuth 2.0 Dynamic Client Registration full response (client information plus metadata)
*/
const OAuthClientInformationFullSchema = OAuthClientMetadataSchema.merge(OAuthClientInformationSchema);
object({
	error: string(),
	error_description: string().optional()
}).strip();
object({
	token: string(),
	token_type_hint: string().optional()
}).strip();
//#endregion
//#region node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.0_zod@4.4.3/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/auth-utils.js
/**
* Utilities for handling OAuth resource URIs.
*/
/**
* Converts a server URL to a resource URL by removing the fragment.
* RFC 8707 section 2 states that resource URIs "MUST NOT include a fragment component".
* Keeps everything else unchanged (scheme, domain, port, path, query).
*/
function resourceUrlFromServerUrl(url) {
	const resourceURL = typeof url === "string" ? new URL(url) : new URL(url.href);
	resourceURL.hash = "";
	return resourceURL;
}
/**
* Checks if a requested resource URL matches a configured resource URL.
* A requested resource matches if it has the same scheme, domain, port,
* and its path starts with the configured resource's path.
*
* @param requestedResource The resource URL being requested
* @param configuredResource The resource URL that has been configured
* @returns true if the requested resource matches the configured resource, false otherwise
*/
function checkResourceAllowed({ requestedResource, configuredResource }) {
	const requested = typeof requestedResource === "string" ? new URL(requestedResource) : new URL(requestedResource.href);
	const configured = typeof configuredResource === "string" ? new URL(configuredResource) : new URL(configuredResource.href);
	if (requested.origin !== configured.origin) return false;
	if (requested.pathname.length < configured.pathname.length) return false;
	const requestedPath = requested.pathname.endsWith("/") ? requested.pathname : requested.pathname + "/";
	const configuredPath = configured.pathname.endsWith("/") ? configured.pathname : configured.pathname + "/";
	return requestedPath.startsWith(configuredPath);
}
//#endregion
//#region node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.0_zod@4.4.3/node_modules/@modelcontextprotocol/sdk/dist/esm/server/auth/errors.js
/**
* Base class for all OAuth errors
*/
var OAuthError = class extends Error {
	constructor(message, errorUri) {
		super(message);
		this.errorUri = errorUri;
		this.name = this.constructor.name;
	}
	/**
	* Converts the error to a standard OAuth error response object
	*/
	toResponseObject() {
		const response = {
			error: this.errorCode,
			error_description: this.message
		};
		if (this.errorUri) response.error_uri = this.errorUri;
		return response;
	}
	get errorCode() {
		return this.constructor.errorCode;
	}
};
/**
* Invalid request error - The request is missing a required parameter,
* includes an invalid parameter value, includes a parameter more than once,
* or is otherwise malformed.
*/
var InvalidRequestError = class extends OAuthError {};
InvalidRequestError.errorCode = "invalid_request";
/**
* Invalid client error - Client authentication failed (e.g., unknown client, no client
* authentication included, or unsupported authentication method).
*/
var InvalidClientError = class extends OAuthError {};
InvalidClientError.errorCode = "invalid_client";
/**
* Invalid grant error - The provided authorization grant or refresh token is
* invalid, expired, revoked, does not match the redirection URI used in the
* authorization request, or was issued to another client.
*/
var InvalidGrantError = class extends OAuthError {};
InvalidGrantError.errorCode = "invalid_grant";
/**
* Unauthorized client error - The authenticated client is not authorized to use
* this authorization grant type.
*/
var UnauthorizedClientError = class extends OAuthError {};
UnauthorizedClientError.errorCode = "unauthorized_client";
/**
* Unsupported grant type error - The authorization grant type is not supported
* by the authorization server.
*/
var UnsupportedGrantTypeError = class extends OAuthError {};
UnsupportedGrantTypeError.errorCode = "unsupported_grant_type";
/**
* Invalid scope error - The requested scope is invalid, unknown, malformed, or
* exceeds the scope granted by the resource owner.
*/
var InvalidScopeError = class extends OAuthError {};
InvalidScopeError.errorCode = "invalid_scope";
/**
* Access denied error - The resource owner or authorization server denied the request.
*/
var AccessDeniedError = class extends OAuthError {};
AccessDeniedError.errorCode = "access_denied";
/**
* Server error - The authorization server encountered an unexpected condition
* that prevented it from fulfilling the request.
*/
var ServerError = class extends OAuthError {};
ServerError.errorCode = "server_error";
/**
* Temporarily unavailable error - The authorization server is currently unable to
* handle the request due to a temporary overloading or maintenance of the server.
*/
var TemporarilyUnavailableError = class extends OAuthError {};
TemporarilyUnavailableError.errorCode = "temporarily_unavailable";
/**
* Unsupported response type error - The authorization server does not support
* obtaining an authorization code using this method.
*/
var UnsupportedResponseTypeError = class extends OAuthError {};
UnsupportedResponseTypeError.errorCode = "unsupported_response_type";
/**
* Unsupported token type error - The authorization server does not support
* the requested token type.
*/
var UnsupportedTokenTypeError = class extends OAuthError {};
UnsupportedTokenTypeError.errorCode = "unsupported_token_type";
/**
* Invalid token error - The access token provided is expired, revoked, malformed,
* or invalid for other reasons.
*/
var InvalidTokenError = class extends OAuthError {};
InvalidTokenError.errorCode = "invalid_token";
/**
* Method not allowed error - The HTTP method used is not allowed for this endpoint.
* (Custom, non-standard error)
*/
var MethodNotAllowedError = class extends OAuthError {};
MethodNotAllowedError.errorCode = "method_not_allowed";
/**
* Too many requests error - Rate limit exceeded.
* (Custom, non-standard error based on RFC 6585)
*/
var TooManyRequestsError = class extends OAuthError {};
TooManyRequestsError.errorCode = "too_many_requests";
/**
* Invalid client metadata error - The client metadata is invalid.
* (Custom error for dynamic client registration - RFC 7591)
*/
var InvalidClientMetadataError = class extends OAuthError {};
InvalidClientMetadataError.errorCode = "invalid_client_metadata";
/**
* Insufficient scope error - The request requires higher privileges than provided by the access token.
*/
var InsufficientScopeError = class extends OAuthError {};
InsufficientScopeError.errorCode = "insufficient_scope";
/**
* Invalid target error - The requested resource is invalid, missing, unknown, or malformed.
* (Custom error for resource indicators - RFC 8707)
*/
var InvalidTargetError = class extends OAuthError {};
InvalidTargetError.errorCode = "invalid_target";
/**
* A full list of all OAuthErrors, enabling parsing from error responses
*/
const OAUTH_ERRORS = {
	[InvalidRequestError.errorCode]: InvalidRequestError,
	[InvalidClientError.errorCode]: InvalidClientError,
	[InvalidGrantError.errorCode]: InvalidGrantError,
	[UnauthorizedClientError.errorCode]: UnauthorizedClientError,
	[UnsupportedGrantTypeError.errorCode]: UnsupportedGrantTypeError,
	[InvalidScopeError.errorCode]: InvalidScopeError,
	[AccessDeniedError.errorCode]: AccessDeniedError,
	[ServerError.errorCode]: ServerError,
	[TemporarilyUnavailableError.errorCode]: TemporarilyUnavailableError,
	[UnsupportedResponseTypeError.errorCode]: UnsupportedResponseTypeError,
	[UnsupportedTokenTypeError.errorCode]: UnsupportedTokenTypeError,
	[InvalidTokenError.errorCode]: InvalidTokenError,
	[MethodNotAllowedError.errorCode]: MethodNotAllowedError,
	[TooManyRequestsError.errorCode]: TooManyRequestsError,
	[InvalidClientMetadataError.errorCode]: InvalidClientMetadataError,
	[InsufficientScopeError.errorCode]: InsufficientScopeError,
	[InvalidTargetError.errorCode]: InvalidTargetError
};
//#endregion
//#region node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.0_zod@4.4.3/node_modules/@modelcontextprotocol/sdk/dist/esm/client/auth.js
var UnauthorizedError = class extends Error {
	constructor(message) {
		super(message ?? "Unauthorized");
	}
};
function isClientAuthMethod(method) {
	return [
		"client_secret_basic",
		"client_secret_post",
		"none"
	].includes(method);
}
const AUTHORIZATION_CODE_RESPONSE_TYPE = "code";
const AUTHORIZATION_CODE_CHALLENGE_METHOD = "S256";
/**
* Determines the best client authentication method to use based on server support and client configuration.
*
* Priority order (highest to lowest):
* 1. client_secret_basic (if client secret is available)
* 2. client_secret_post (if client secret is available)
* 3. none (for public clients)
*
* @param clientInformation - OAuth client information containing credentials
* @param supportedMethods - Authentication methods supported by the authorization server
* @returns The selected authentication method
*/
function selectClientAuthMethod(clientInformation, supportedMethods) {
	const hasClientSecret = clientInformation.client_secret !== void 0;
	if ("token_endpoint_auth_method" in clientInformation && clientInformation.token_endpoint_auth_method && isClientAuthMethod(clientInformation.token_endpoint_auth_method) && (supportedMethods.length === 0 || supportedMethods.includes(clientInformation.token_endpoint_auth_method))) return clientInformation.token_endpoint_auth_method;
	if (supportedMethods.length === 0) return hasClientSecret ? "client_secret_basic" : "none";
	if (hasClientSecret && supportedMethods.includes("client_secret_basic")) return "client_secret_basic";
	if (hasClientSecret && supportedMethods.includes("client_secret_post")) return "client_secret_post";
	if (supportedMethods.includes("none")) return "none";
	return hasClientSecret ? "client_secret_post" : "none";
}
/**
* Applies client authentication to the request based on the specified method.
*
* Implements OAuth 2.1 client authentication methods:
* - client_secret_basic: HTTP Basic authentication (RFC 6749 Section 2.3.1)
* - client_secret_post: Credentials in request body (RFC 6749 Section 2.3.1)
* - none: Public client authentication (RFC 6749 Section 2.1)
*
* @param method - The authentication method to use
* @param clientInformation - OAuth client information containing credentials
* @param headers - HTTP headers object to modify
* @param params - URL search parameters to modify
* @throws {Error} When required credentials are missing
*/
function applyClientAuthentication(method, clientInformation, headers, params) {
	const { client_id, client_secret } = clientInformation;
	switch (method) {
		case "client_secret_basic":
			applyBasicAuth(client_id, client_secret, headers);
			return;
		case "client_secret_post":
			applyPostAuth(client_id, client_secret, params);
			return;
		case "none":
			applyPublicAuth(client_id, params);
			return;
		default: throw new Error(`Unsupported client authentication method: ${method}`);
	}
}
/**
* Applies HTTP Basic authentication (RFC 6749 Section 2.3.1)
*/
function applyBasicAuth(clientId, clientSecret, headers) {
	if (!clientSecret) throw new Error("client_secret_basic authentication requires a client_secret");
	const credentials = btoa(`${clientId}:${clientSecret}`);
	headers.set("Authorization", `Basic ${credentials}`);
}
/**
* Applies POST body authentication (RFC 6749 Section 2.3.1)
*/
function applyPostAuth(clientId, clientSecret, params) {
	params.set("client_id", clientId);
	if (clientSecret) params.set("client_secret", clientSecret);
}
/**
* Applies public client authentication (RFC 6749 Section 2.1)
*/
function applyPublicAuth(clientId, params) {
	params.set("client_id", clientId);
}
/**
* Parses an OAuth error response from a string or Response object.
*
* If the input is a standard OAuth2.0 error response, it will be parsed according to the spec
* and an instance of the appropriate OAuthError subclass will be returned.
* If parsing fails, it falls back to a generic ServerError that includes
* the response status (if available) and original content.
*
* @param input - A Response object or string containing the error response
* @returns A Promise that resolves to an OAuthError instance
*/
async function parseErrorResponse(input) {
	const statusCode = input instanceof Response ? input.status : void 0;
	const body = input instanceof Response ? await input.text() : input;
	try {
		const { error, error_description, error_uri } = OAuthErrorResponseSchema.parse(JSON.parse(body));
		return new (OAUTH_ERRORS[error] || ServerError)(error_description || "", error_uri);
	} catch (error) {
		return new ServerError(`${statusCode ? `HTTP ${statusCode}: ` : ""}Invalid OAuth error response: ${error}. Raw body: ${body}`);
	}
}
/**
* Orchestrates the full auth flow with a server.
*
* This can be used as a single entry point for all authorization functionality,
* instead of linking together the other lower-level functions in this module.
*/
async function auth(provider, options) {
	try {
		return await authInternal(provider, options);
	} catch (error) {
		if (error instanceof InvalidClientError || error instanceof UnauthorizedClientError) {
			await provider.invalidateCredentials?.("all");
			return await authInternal(provider, options);
		} else if (error instanceof InvalidGrantError) {
			await provider.invalidateCredentials?.("tokens");
			return await authInternal(provider, options);
		}
		throw error;
	}
}
async function authInternal(provider, { serverUrl, authorizationCode, scope, resourceMetadataUrl, fetchFn }) {
	const cachedState = await provider.discoveryState?.();
	let resourceMetadata;
	let authorizationServerUrl;
	let metadata;
	let effectiveResourceMetadataUrl = resourceMetadataUrl;
	if (!effectiveResourceMetadataUrl && cachedState?.resourceMetadataUrl) effectiveResourceMetadataUrl = new URL(cachedState.resourceMetadataUrl);
	if (cachedState?.authorizationServerUrl) {
		authorizationServerUrl = cachedState.authorizationServerUrl;
		resourceMetadata = cachedState.resourceMetadata;
		metadata = cachedState.authorizationServerMetadata ?? await discoverAuthorizationServerMetadata(authorizationServerUrl, { fetchFn });
		if (!resourceMetadata) try {
			resourceMetadata = await discoverOAuthProtectedResourceMetadata(serverUrl, { resourceMetadataUrl: effectiveResourceMetadataUrl }, fetchFn);
		} catch {}
		if (metadata !== cachedState.authorizationServerMetadata || resourceMetadata !== cachedState.resourceMetadata) await provider.saveDiscoveryState?.({
			authorizationServerUrl: String(authorizationServerUrl),
			resourceMetadataUrl: effectiveResourceMetadataUrl?.toString(),
			resourceMetadata,
			authorizationServerMetadata: metadata
		});
	} else {
		const serverInfo = await discoverOAuthServerInfo(serverUrl, {
			resourceMetadataUrl: effectiveResourceMetadataUrl,
			fetchFn
		});
		authorizationServerUrl = serverInfo.authorizationServerUrl;
		metadata = serverInfo.authorizationServerMetadata;
		resourceMetadata = serverInfo.resourceMetadata;
		await provider.saveDiscoveryState?.({
			authorizationServerUrl: String(authorizationServerUrl),
			resourceMetadataUrl: effectiveResourceMetadataUrl?.toString(),
			resourceMetadata,
			authorizationServerMetadata: metadata
		});
	}
	const resource = await selectResourceURL(serverUrl, provider, resourceMetadata);
	const resolvedScope = scope || resourceMetadata?.scopes_supported?.join(" ") || provider.clientMetadata.scope;
	let clientInformation = await Promise.resolve(provider.clientInformation());
	if (!clientInformation) {
		if (authorizationCode !== void 0) throw new Error("Existing OAuth client information is required when exchanging an authorization code");
		const supportsUrlBasedClientId = metadata?.client_id_metadata_document_supported === true;
		const clientMetadataUrl = provider.clientMetadataUrl;
		if (clientMetadataUrl && !isHttpsUrl(clientMetadataUrl)) throw new InvalidClientMetadataError(`clientMetadataUrl must be a valid HTTPS URL with a non-root pathname, got: ${clientMetadataUrl}`);
		if (supportsUrlBasedClientId && clientMetadataUrl) {
			clientInformation = { client_id: clientMetadataUrl };
			await provider.saveClientInformation?.(clientInformation);
		} else {
			if (!provider.saveClientInformation) throw new Error("OAuth client information must be saveable for dynamic registration");
			const fullInformation = await registerClient(authorizationServerUrl, {
				metadata,
				clientMetadata: provider.clientMetadata,
				scope: resolvedScope,
				fetchFn
			});
			await provider.saveClientInformation(fullInformation);
			clientInformation = fullInformation;
		}
	}
	const nonInteractiveFlow = !provider.redirectUrl;
	if (authorizationCode !== void 0 || nonInteractiveFlow) {
		const tokens = await fetchToken(provider, authorizationServerUrl, {
			metadata,
			resource,
			authorizationCode,
			fetchFn
		});
		await provider.saveTokens(tokens);
		return "AUTHORIZED";
	}
	const tokens = await provider.tokens();
	if (tokens?.refresh_token) try {
		const newTokens = await refreshAuthorization(authorizationServerUrl, {
			metadata,
			clientInformation,
			refreshToken: tokens.refresh_token,
			resource,
			addClientAuthentication: provider.addClientAuthentication,
			fetchFn
		});
		await provider.saveTokens(newTokens);
		return "AUTHORIZED";
	} catch (error) {
		if (!(error instanceof OAuthError) || error instanceof ServerError) {} else throw error;
	}
	const state = provider.state ? await provider.state() : void 0;
	const { authorizationUrl, codeVerifier } = await startAuthorization(authorizationServerUrl, {
		metadata,
		clientInformation,
		state,
		redirectUrl: provider.redirectUrl,
		scope: resolvedScope,
		resource
	});
	await provider.saveCodeVerifier(codeVerifier);
	await provider.redirectToAuthorization(authorizationUrl);
	return "REDIRECT";
}
/**
* SEP-991: URL-based Client IDs
* Validate that the client_id is a valid URL with https scheme
*/
function isHttpsUrl(value) {
	if (!value) return false;
	try {
		const url = new URL(value);
		return url.protocol === "https:" && url.pathname !== "/";
	} catch {
		return false;
	}
}
async function selectResourceURL(serverUrl, provider, resourceMetadata) {
	const defaultResource = resourceUrlFromServerUrl(serverUrl);
	if (provider.validateResourceURL) return await provider.validateResourceURL(defaultResource, resourceMetadata?.resource);
	if (!resourceMetadata) return;
	if (!checkResourceAllowed({
		requestedResource: defaultResource,
		configuredResource: resourceMetadata.resource
	})) throw new Error(`Protected resource ${resourceMetadata.resource} does not match expected ${defaultResource} (or origin)`);
	return new URL(resourceMetadata.resource);
}
/**
* Extract resource_metadata, scope, and error from WWW-Authenticate header.
*/
function extractWWWAuthenticateParams(res) {
	const authenticateHeader = res.headers.get("WWW-Authenticate");
	if (!authenticateHeader) return {};
	const [type, scheme] = authenticateHeader.split(" ");
	if (type.toLowerCase() !== "bearer" || !scheme) return {};
	const resourceMetadataMatch = extractFieldFromWwwAuth(res, "resource_metadata") || void 0;
	let resourceMetadataUrl;
	if (resourceMetadataMatch) try {
		resourceMetadataUrl = new URL(resourceMetadataMatch);
	} catch {}
	const scope = extractFieldFromWwwAuth(res, "scope") || void 0;
	const error = extractFieldFromWwwAuth(res, "error") || void 0;
	return {
		resourceMetadataUrl,
		scope,
		error
	};
}
/**
* Extracts a specific field's value from the WWW-Authenticate header string.
*
* @param response The HTTP response object containing the headers.
* @param fieldName The name of the field to extract (e.g., "realm", "nonce").
* @returns The field value
*/
function extractFieldFromWwwAuth(response, fieldName) {
	const wwwAuthHeader = response.headers.get("WWW-Authenticate");
	if (!wwwAuthHeader) return null;
	const pattern = new RegExp(`${fieldName}=(?:"([^"]+)"|([^\\s,]+))`);
	const match = wwwAuthHeader.match(pattern);
	if (match) return match[1] || match[2];
	return null;
}
/**
* Looks up RFC 9728 OAuth 2.0 Protected Resource Metadata.
*
* If the server returns a 404 for the well-known endpoint, this function will
* return `undefined`. Any other errors will be thrown as exceptions.
*/
async function discoverOAuthProtectedResourceMetadata(serverUrl, opts, fetchFn = fetch) {
	const response = await discoverMetadataWithFallback(serverUrl, "oauth-protected-resource", fetchFn, {
		protocolVersion: opts?.protocolVersion,
		metadataUrl: opts?.resourceMetadataUrl
	});
	if (!response || response.status === 404) {
		await response?.body?.cancel();
		throw new Error(`Resource server does not implement OAuth 2.0 Protected Resource Metadata.`);
	}
	if (!response.ok) {
		await response.body?.cancel();
		throw new Error(`HTTP ${response.status} trying to load well-known OAuth protected resource metadata.`);
	}
	return OAuthProtectedResourceMetadataSchema.parse(await response.json());
}
/**
* Helper function to handle fetch with CORS retry logic
*/
async function fetchWithCorsRetry(url, headers, fetchFn = fetch) {
	try {
		return await fetchFn(url, { headers });
	} catch (error) {
		if (error instanceof TypeError) {
			if (headers) return fetchWithCorsRetry(url, void 0, fetchFn);
			else return;
		}
		throw error;
	}
}
/**
* Constructs the well-known path for auth-related metadata discovery
*/
function buildWellKnownPath(wellKnownPrefix, pathname = "", options = {}) {
	if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
	return options.prependPathname ? `${pathname}/.well-known/${wellKnownPrefix}` : `/.well-known/${wellKnownPrefix}${pathname}`;
}
/**
* Tries to discover OAuth metadata at a specific URL
*/
async function tryMetadataDiscovery(url, protocolVersion, fetchFn = fetch) {
	return await fetchWithCorsRetry(url, { "MCP-Protocol-Version": protocolVersion }, fetchFn);
}
/**
* Determines if fallback to root discovery should be attempted
*/
function shouldAttemptFallback(response, pathname) {
	return !response || response.status >= 400 && response.status < 500 && pathname !== "/";
}
/**
* Generic function for discovering OAuth metadata with fallback support
*/
async function discoverMetadataWithFallback(serverUrl, wellKnownType, fetchFn, opts) {
	const issuer = new URL(serverUrl);
	const protocolVersion = opts?.protocolVersion ?? "2025-11-25";
	let url;
	if (opts?.metadataUrl) url = new URL(opts.metadataUrl);
	else {
		const wellKnownPath = buildWellKnownPath(wellKnownType, issuer.pathname);
		url = new URL(wellKnownPath, opts?.metadataServerUrl ?? issuer);
		url.search = issuer.search;
	}
	let response = await tryMetadataDiscovery(url, protocolVersion, fetchFn);
	if (!opts?.metadataUrl && shouldAttemptFallback(response, issuer.pathname)) response = await tryMetadataDiscovery(new URL(`/.well-known/${wellKnownType}`, issuer), protocolVersion, fetchFn);
	return response;
}
/**
* Builds a list of discovery URLs to try for authorization server metadata.
* URLs are returned in priority order:
* 1. OAuth metadata at the given URL
* 2. OIDC metadata endpoints at the given URL
*/
function buildDiscoveryUrls(authorizationServerUrl) {
	const url = typeof authorizationServerUrl === "string" ? new URL(authorizationServerUrl) : authorizationServerUrl;
	const hasPath = url.pathname !== "/";
	const urlsToTry = [];
	if (!hasPath) {
		urlsToTry.push({
			url: new URL("/.well-known/oauth-authorization-server", url.origin),
			type: "oauth"
		});
		urlsToTry.push({
			url: new URL(`/.well-known/openid-configuration`, url.origin),
			type: "oidc"
		});
		return urlsToTry;
	}
	let pathname = url.pathname;
	if (pathname.endsWith("/")) pathname = pathname.slice(0, -1);
	urlsToTry.push({
		url: new URL(`/.well-known/oauth-authorization-server${pathname}`, url.origin),
		type: "oauth"
	});
	urlsToTry.push({
		url: new URL(`/.well-known/openid-configuration${pathname}`, url.origin),
		type: "oidc"
	});
	urlsToTry.push({
		url: new URL(`${pathname}/.well-known/openid-configuration`, url.origin),
		type: "oidc"
	});
	return urlsToTry;
}
/**
* Discovers authorization server metadata with support for RFC 8414 OAuth 2.0 Authorization Server Metadata
* and OpenID Connect Discovery 1.0 specifications.
*
* This function implements a fallback strategy for authorization server discovery:
* 1. Attempts RFC 8414 OAuth metadata discovery first
* 2. If OAuth discovery fails, falls back to OpenID Connect Discovery
*
* @param authorizationServerUrl - The authorization server URL obtained from the MCP Server's
*                                 protected resource metadata, or the MCP server's URL if the
*                                 metadata was not found.
* @param options - Configuration options
* @param options.fetchFn - Optional fetch function for making HTTP requests, defaults to global fetch
* @param options.protocolVersion - MCP protocol version to use, defaults to LATEST_PROTOCOL_VERSION
* @returns Promise resolving to authorization server metadata, or undefined if discovery fails
*/
async function discoverAuthorizationServerMetadata(authorizationServerUrl, { fetchFn = fetch, protocolVersion = LATEST_PROTOCOL_VERSION } = {}) {
	const headers = {
		"MCP-Protocol-Version": protocolVersion,
		Accept: "application/json"
	};
	const urlsToTry = buildDiscoveryUrls(authorizationServerUrl);
	for (const { url: endpointUrl, type } of urlsToTry) {
		const response = await fetchWithCorsRetry(endpointUrl, headers, fetchFn);
		if (!response)
 /**
		* CORS error occurred - don't throw as the endpoint may not allow CORS,
		* continue trying other possible endpoints
		*/
		continue;
		if (!response.ok) {
			await response.body?.cancel();
			if (response.status >= 400 && response.status < 500) continue;
			throw new Error(`HTTP ${response.status} trying to load ${type === "oauth" ? "OAuth" : "OpenID provider"} metadata from ${endpointUrl}`);
		}
		if (type === "oauth") return OAuthMetadataSchema.parse(await response.json());
		else return OpenIdProviderDiscoveryMetadataSchema.parse(await response.json());
	}
}
/**
* Discovers the authorization server for an MCP server following
* {@link https://datatracker.ietf.org/doc/html/rfc9728 | RFC 9728} (OAuth 2.0 Protected
* Resource Metadata), with fallback to treating the server URL as the
* authorization server.
*
* This function combines two discovery steps into one call:
* 1. Probes `/.well-known/oauth-protected-resource` on the MCP server to find the
*    authorization server URL (RFC 9728).
* 2. Fetches authorization server metadata from that URL (RFC 8414 / OpenID Connect Discovery).
*
* Use this when you need the authorization server metadata for operations outside the
* {@linkcode auth} orchestrator, such as token refresh or token revocation.
*
* @param serverUrl - The MCP resource server URL
* @param opts - Optional configuration
* @param opts.resourceMetadataUrl - Override URL for the protected resource metadata endpoint
* @param opts.fetchFn - Custom fetch function for HTTP requests
* @returns Authorization server URL, metadata, and resource metadata (if available)
*/
async function discoverOAuthServerInfo(serverUrl, opts) {
	let resourceMetadata;
	let authorizationServerUrl;
	try {
		resourceMetadata = await discoverOAuthProtectedResourceMetadata(serverUrl, { resourceMetadataUrl: opts?.resourceMetadataUrl }, opts?.fetchFn);
		if (resourceMetadata.authorization_servers && resourceMetadata.authorization_servers.length > 0) authorizationServerUrl = resourceMetadata.authorization_servers[0];
	} catch {}
	if (!authorizationServerUrl) authorizationServerUrl = String(new URL("/", serverUrl));
	const authorizationServerMetadata = await discoverAuthorizationServerMetadata(authorizationServerUrl, { fetchFn: opts?.fetchFn });
	return {
		authorizationServerUrl,
		authorizationServerMetadata,
		resourceMetadata
	};
}
/**
* Begins the authorization flow with the given server, by generating a PKCE challenge and constructing the authorization URL.
*/
async function startAuthorization(authorizationServerUrl, { metadata, clientInformation, redirectUrl, scope, state, resource }) {
	let authorizationUrl;
	if (metadata) {
		authorizationUrl = new URL(metadata.authorization_endpoint);
		if (!metadata.response_types_supported.includes(AUTHORIZATION_CODE_RESPONSE_TYPE)) throw new Error(`Incompatible auth server: does not support response type ${AUTHORIZATION_CODE_RESPONSE_TYPE}`);
		if (metadata.code_challenge_methods_supported && !metadata.code_challenge_methods_supported.includes(AUTHORIZATION_CODE_CHALLENGE_METHOD)) throw new Error(`Incompatible auth server: does not support code challenge method ${AUTHORIZATION_CODE_CHALLENGE_METHOD}`);
	} else authorizationUrl = new URL("/authorize", authorizationServerUrl);
	const challenge = await pkceChallenge();
	const codeVerifier = challenge.code_verifier;
	const codeChallenge = challenge.code_challenge;
	authorizationUrl.searchParams.set("response_type", AUTHORIZATION_CODE_RESPONSE_TYPE);
	authorizationUrl.searchParams.set("client_id", clientInformation.client_id);
	authorizationUrl.searchParams.set("code_challenge", codeChallenge);
	authorizationUrl.searchParams.set("code_challenge_method", AUTHORIZATION_CODE_CHALLENGE_METHOD);
	authorizationUrl.searchParams.set("redirect_uri", String(redirectUrl));
	if (state) authorizationUrl.searchParams.set("state", state);
	if (scope) authorizationUrl.searchParams.set("scope", scope);
	if (scope?.includes("offline_access")) authorizationUrl.searchParams.append("prompt", "consent");
	if (resource) authorizationUrl.searchParams.set("resource", resource.href);
	return {
		authorizationUrl,
		codeVerifier
	};
}
/**
* Prepares token request parameters for an authorization code exchange.
*
* This is the default implementation used by fetchToken when the provider
* doesn't implement prepareTokenRequest.
*
* @param authorizationCode - The authorization code received from the authorization endpoint
* @param codeVerifier - The PKCE code verifier
* @param redirectUri - The redirect URI used in the authorization request
* @returns URLSearchParams for the authorization_code grant
*/
function prepareAuthorizationCodeRequest(authorizationCode, codeVerifier, redirectUri) {
	return new URLSearchParams({
		grant_type: "authorization_code",
		code: authorizationCode,
		code_verifier: codeVerifier,
		redirect_uri: String(redirectUri)
	});
}
/**
* Internal helper to execute a token request with the given parameters.
* Used by exchangeAuthorization, refreshAuthorization, and fetchToken.
*/
async function executeTokenRequest(authorizationServerUrl, { metadata, tokenRequestParams, clientInformation, addClientAuthentication, resource, fetchFn }) {
	const tokenUrl = metadata?.token_endpoint ? new URL(metadata.token_endpoint) : new URL("/token", authorizationServerUrl);
	const headers = new Headers({
		"Content-Type": "application/x-www-form-urlencoded",
		Accept: "application/json"
	});
	if (resource) tokenRequestParams.set("resource", resource.href);
	if (addClientAuthentication) await addClientAuthentication(headers, tokenRequestParams, tokenUrl, metadata);
	else if (clientInformation) applyClientAuthentication(selectClientAuthMethod(clientInformation, metadata?.token_endpoint_auth_methods_supported ?? []), clientInformation, headers, tokenRequestParams);
	const response = await (fetchFn ?? fetch)(tokenUrl, {
		method: "POST",
		headers,
		body: tokenRequestParams
	});
	if (!response.ok) throw await parseErrorResponse(response);
	return OAuthTokensSchema.parse(await response.json());
}
/**
* Exchange a refresh token for an updated access token.
*
* Supports multiple client authentication methods as specified in OAuth 2.1:
* - Automatically selects the best authentication method based on server support
* - Preserves the original refresh token if a new one is not returned
*
* @param authorizationServerUrl - The authorization server's base URL
* @param options - Configuration object containing client info, refresh token, etc.
* @returns Promise resolving to OAuth tokens (preserves original refresh_token if not replaced)
* @throws {Error} When token refresh fails or authentication is invalid
*/
async function refreshAuthorization(authorizationServerUrl, { metadata, clientInformation, refreshToken, resource, addClientAuthentication, fetchFn }) {
	return {
		refresh_token: refreshToken,
		...await executeTokenRequest(authorizationServerUrl, {
			metadata,
			tokenRequestParams: new URLSearchParams({
				grant_type: "refresh_token",
				refresh_token: refreshToken
			}),
			clientInformation,
			addClientAuthentication,
			resource,
			fetchFn
		})
	};
}
/**
* Unified token fetching that works with any grant type via provider.prepareTokenRequest().
*
* This function provides a single entry point for obtaining tokens regardless of the
* OAuth grant type. The provider's prepareTokenRequest() method determines which grant
* to use and supplies the grant-specific parameters.
*
* @param provider - OAuth client provider that implements prepareTokenRequest()
* @param authorizationServerUrl - The authorization server's base URL
* @param options - Configuration for the token request
* @returns Promise resolving to OAuth tokens
* @throws {Error} When provider doesn't implement prepareTokenRequest or token fetch fails
*
* @example
* // Provider for client_credentials:
* class MyProvider implements OAuthClientProvider {
*   prepareTokenRequest(scope) {
*     const params = new URLSearchParams({ grant_type: 'client_credentials' });
*     if (scope) params.set('scope', scope);
*     return params;
*   }
*   // ... other methods
* }
*
* const tokens = await fetchToken(provider, authServerUrl, { metadata });
*/
async function fetchToken(provider, authorizationServerUrl, { metadata, resource, authorizationCode, fetchFn } = {}) {
	const scope = provider.clientMetadata.scope;
	let tokenRequestParams;
	if (provider.prepareTokenRequest) tokenRequestParams = await provider.prepareTokenRequest(scope);
	if (!tokenRequestParams) {
		if (!authorizationCode) throw new Error("Either provider.prepareTokenRequest() or authorizationCode is required");
		if (!provider.redirectUrl) throw new Error("redirectUrl is required for authorization_code flow");
		tokenRequestParams = prepareAuthorizationCodeRequest(authorizationCode, await provider.codeVerifier(), provider.redirectUrl);
	}
	const clientInformation = await provider.clientInformation();
	return executeTokenRequest(authorizationServerUrl, {
		metadata,
		tokenRequestParams,
		clientInformation: clientInformation ?? void 0,
		addClientAuthentication: provider.addClientAuthentication,
		resource,
		fetchFn
	});
}
/**
* Performs OAuth 2.0 Dynamic Client Registration according to RFC 7591.
*
* If `scope` is provided, it overrides `clientMetadata.scope` in the registration
* request body. This allows callers to apply the Scope Selection Strategy (SEP-835)
* consistently across both DCR and the subsequent authorization request.
*/
async function registerClient(authorizationServerUrl, { metadata, clientMetadata, scope, fetchFn }) {
	let registrationUrl;
	if (metadata) {
		if (!metadata.registration_endpoint) throw new Error("Incompatible auth server: does not support dynamic client registration");
		registrationUrl = new URL(metadata.registration_endpoint);
	} else registrationUrl = new URL("/register", authorizationServerUrl);
	const response = await (fetchFn ?? fetch)(registrationUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			...clientMetadata,
			...scope !== void 0 ? { scope } : {}
		})
	});
	if (!response.ok) throw await parseErrorResponse(response);
	return OAuthClientInformationFullSchema.parse(await response.json());
}
//#endregion
export { normalizeHeaders as a, createFetchWithInit as i, auth as n, createParser as o, extractWWWAuthenticateParams as r, UnauthorizedError as t };
