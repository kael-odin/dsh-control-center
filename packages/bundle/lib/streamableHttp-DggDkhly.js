import { a as normalizeHeaders, i as createFetchWithInit, n as auth, o as createParser, r as extractWWWAuthenticateParams, t as UnauthorizedError } from "./auth-Dl44g5bG.js";
import { a as isJSONRPCRequest, b as __toESM, i as isInitializedNotification, n as JSONRPCMessageSchema, o as isJSONRPCResultResponse, y as __commonJSMin } from "./lib-BbNsIoSM.js";
/*!
* content-type
* Copyright(c) 2015 Douglas Christopher Wilson
* MIT Licensed
*/
//#endregion
//#region node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.0_zod@4.4.3/node_modules/@modelcontextprotocol/sdk/dist/esm/shared/mediaType.js
var import_content_type = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports) => {
	/**
	* RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
	*
	* parameter     = token "=" ( token / quoted-string )
	* token         = 1*tchar
	* tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
	*               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
	*               / DIGIT / ALPHA
	*               ; any VCHAR, except delimiters
	* quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
	* qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
	* obs-text      = %x80-FF
	* quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
	*/
	var PARAM_REGEXP = /; *([!#$%&'*+.^_`|~0-9A-Za-z-]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'*+.^_`|~0-9A-Za-z-]+) */g;
	/**
	* RegExp to match quoted-pair in RFC 7230 sec 3.2.6
	*
	* quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
	* obs-text    = %x80-FF
	*/
	var QESC_REGEXP = /\\([\u000b\u0020-\u00ff])/g;
	/**
	* RegExp to match type in RFC 7231 sec 3.1.1.1
	*
	* media-type = type "/" subtype
	* type       = token
	* subtype    = token
	*/
	var TYPE_REGEXP = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+\/[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
	exports.parse = parse;
	/**
	* Parse media type to object.
	*
	* @param {string|object} string
	* @return {Object}
	* @public
	*/
	function parse(string) {
		if (!string) throw new TypeError("argument string is required");
		var header = typeof string === "object" ? getcontenttype(string) : string;
		if (typeof header !== "string") throw new TypeError("argument string is required to be a string");
		var index = header.indexOf(";");
		var type = index !== -1 ? header.slice(0, index).trim() : header.trim();
		if (!TYPE_REGEXP.test(type)) throw new TypeError("invalid media type");
		var obj = new ContentType(type.toLowerCase());
		if (index !== -1) {
			var key;
			var match;
			var value;
			PARAM_REGEXP.lastIndex = index;
			while (match = PARAM_REGEXP.exec(header)) {
				if (match.index !== index) throw new TypeError("invalid parameter format");
				index += match[0].length;
				key = match[1].toLowerCase();
				value = match[2];
				if (value.charCodeAt(0) === 34) {
					value = value.slice(1, -1);
					if (value.indexOf("\\") !== -1) value = value.replace(QESC_REGEXP, "$1");
				}
				obj.parameters[key] = value;
			}
			if (index !== header.length) throw new TypeError("invalid parameter format");
		}
		return obj;
	}
	/**
	* Get content-type from req/res objects.
	*
	* @param {object}
	* @return {Object}
	* @private
	*/
	function getcontenttype(obj) {
		var header;
		if (typeof obj.getHeader === "function") header = obj.getHeader("content-type");
		else if (typeof obj.headers === "object") header = obj.headers && obj.headers["content-type"];
		if (typeof header !== "string") throw new TypeError("content-type header is missing from object");
		return header;
	}
	/**
	* Class to represent a content type.
	* @private
	*/
	function ContentType(type) {
		this.parameters = Object.create(null);
		this.type = type;
	}
})))(), 1);
/**
* Extracts the media type (the lowercased `type/subtype` pair, without
* parameters) from a raw `Content-Type` header value, or `undefined` when the
* header is missing or empty.
*
* Content-Type comparisons must use the parsed media type, never a substring
* search of the raw header: a value like `text/plain; a=application/json`
* contains the substring `application/json` but its media type is
* `text/plain`, and case variants or parameters make naive string comparison
* wrong in both directions.
*
* "Essence" is the WHATWG MIME Sniffing standard's term for the bare
* `type/subtype` pair (https://mimesniff.spec.whatwg.org/#mime-type-essence);
* the Fetch standard's request classification is defined against it
* (https://fetch.spec.whatwg.org/#cors-safelisted-request-header).
*
* Parsing is RFC 9110 (`content-type` package) first. When the parameter
* section is malformed (`application/json;`, `application/json; charset=`),
* browsers and most HTTP stacks still derive the media type from the segment
* before the first `;` — the fallback matches that widely-implemented
* behavior, so a header whose media type is unambiguous is not rejected for
* a sloppy parameter section.
*/
function mediaTypeEssence(header) {
	if (!header) return;
	try {
		return import_content_type.parse(header).type;
	} catch {
		const essence = (header.split(";", 1)[0] ?? "").trim().toLowerCase();
		if (essence === "" || header.slice(essence.length).includes(",")) return;
		return essence;
	}
}
//#endregion
//#region node_modules/.pnpm/eventsource-parser@3.1.1/node_modules/eventsource-parser/dist/stream.js
var EventSourceParserStream = class extends TransformStream {
	constructor({ onError, onRetry, onComment, maxBufferSize } = {}) {
		let parser;
		super({
			start(controller) {
				parser = createParser({
					onEvent: (event) => {
						controller.enqueue(event);
					},
					onError(error) {
						typeof onError == "function" && onError(error), (onError === "terminate" || error.type === "max-buffer-size-exceeded") && controller.error(error);
					},
					onRetry,
					onComment,
					maxBufferSize
				});
			},
			transform(chunk) {
				parser.feed(chunk);
			}
		});
	}
};
//#endregion
//#region node_modules/.pnpm/@modelcontextprotocol+sdk@1.30.0_zod@4.4.3/node_modules/@modelcontextprotocol/sdk/dist/esm/client/streamableHttp.js
const DEFAULT_STREAMABLE_HTTP_RECONNECTION_OPTIONS = {
	initialReconnectionDelay: 1e3,
	maxReconnectionDelay: 3e4,
	reconnectionDelayGrowFactor: 1.5,
	maxRetries: 2
};
var StreamableHTTPError = class extends Error {
	constructor(code, message) {
		super(`Streamable HTTP error: ${message}`);
		this.code = code;
	}
};
/**
* Client transport for Streamable HTTP: this implements the MCP Streamable HTTP transport specification.
* It will connect to a server using HTTP POST for sending messages and HTTP GET with Server-Sent Events
* for receiving messages.
*/
var StreamableHTTPClientTransport = class {
	constructor(url, opts) {
		this._hasCompletedAuthFlow = false;
		this._url = url;
		this._resourceMetadataUrl = void 0;
		this._scope = void 0;
		this._requestInit = opts?.requestInit;
		this._authProvider = opts?.authProvider;
		this._fetch = opts?.fetch;
		this._fetchWithInit = createFetchWithInit(opts?.fetch, opts?.requestInit);
		this._sessionId = opts?.sessionId;
		this._reconnectionOptions = opts?.reconnectionOptions ?? DEFAULT_STREAMABLE_HTTP_RECONNECTION_OPTIONS;
	}
	async _authThenStart() {
		if (!this._authProvider) throw new UnauthorizedError("No auth provider");
		let result;
		try {
			result = await auth(this._authProvider, {
				serverUrl: this._url,
				resourceMetadataUrl: this._resourceMetadataUrl,
				scope: this._scope,
				fetchFn: this._fetchWithInit
			});
		} catch (error) {
			this.onerror?.(error);
			throw error;
		}
		if (result !== "AUTHORIZED") throw new UnauthorizedError();
		return await this._startOrAuthSse({ resumptionToken: void 0 });
	}
	async _commonHeaders() {
		const headers = {};
		if (this._authProvider) {
			const tokens = await this._authProvider.tokens();
			if (tokens) headers["Authorization"] = `Bearer ${tokens.access_token}`;
		}
		if (this._sessionId) headers["mcp-session-id"] = this._sessionId;
		if (this._protocolVersion) headers["mcp-protocol-version"] = this._protocolVersion;
		const extraHeaders = normalizeHeaders(this._requestInit?.headers);
		return new Headers({
			...headers,
			...extraHeaders
		});
	}
	async _startOrAuthSse(options) {
		const { resumptionToken } = options;
		try {
			const headers = await this._commonHeaders();
			headers.set("Accept", "text/event-stream");
			if (resumptionToken) headers.set("last-event-id", resumptionToken);
			const response = await (this._fetch ?? fetch)(this._url, {
				method: "GET",
				headers,
				signal: this._abortController?.signal
			});
			if (!response.ok) {
				await response.body?.cancel();
				if (response.status === 401 && this._authProvider) return await this._authThenStart();
				if (response.status === 405) return;
				throw new StreamableHTTPError(response.status, `Failed to open SSE stream: ${response.statusText}`);
			}
			this._handleSseStream(response.body, options, true);
		} catch (error) {
			this.onerror?.(error);
			throw error;
		}
	}
	/**
	* Calculates the next reconnection delay using  backoff algorithm
	*
	* @param attempt Current reconnection attempt count for the specific stream
	* @returns Time to wait in milliseconds before next reconnection attempt
	*/
	_getNextReconnectionDelay(attempt) {
		if (this._serverRetryMs !== void 0) return this._serverRetryMs;
		const initialDelay = this._reconnectionOptions.initialReconnectionDelay;
		const growFactor = this._reconnectionOptions.reconnectionDelayGrowFactor;
		const maxDelay = this._reconnectionOptions.maxReconnectionDelay;
		return Math.min(initialDelay * Math.pow(growFactor, attempt), maxDelay);
	}
	/**
	* Schedule a reconnection attempt using server-provided retry interval or backoff
	*
	* @param lastEventId The ID of the last received event for resumability
	* @param attemptCount Current reconnection attempt count for this specific stream
	*/
	_scheduleReconnection(options, attemptCount = 0) {
		const maxRetries = this._reconnectionOptions.maxRetries;
		if (attemptCount >= maxRetries) {
			this.onerror?.(/* @__PURE__ */ new Error(`Maximum reconnection attempts (${maxRetries}) exceeded.`));
			return;
		}
		const delay = this._getNextReconnectionDelay(attemptCount);
		this._reconnectionTimeout = setTimeout(() => {
			this._startOrAuthSse(options).catch((error) => {
				this.onerror?.(/* @__PURE__ */ new Error(`Failed to reconnect SSE stream: ${error instanceof Error ? error.message : String(error)}`));
				this._scheduleReconnection(options, attemptCount + 1);
			});
		}, delay);
	}
	_handleSseStream(stream, options, isReconnectable) {
		if (!stream) return;
		const { onresumptiontoken, replayMessageId } = options;
		let lastEventId;
		let hasPrimingEvent = false;
		let receivedResponse = false;
		const processStream = async () => {
			try {
				const reader = stream.pipeThrough(new TextDecoderStream()).pipeThrough(new EventSourceParserStream({ onRetry: (retryMs) => {
					this._serverRetryMs = retryMs;
				} })).getReader();
				while (true) {
					const { value: event, done } = await reader.read();
					if (done) break;
					if (event.id) {
						lastEventId = event.id;
						hasPrimingEvent = true;
						onresumptiontoken?.(event.id);
					}
					if (!event.data) continue;
					if (!event.event || event.event === "message") try {
						const message = JSONRPCMessageSchema.parse(JSON.parse(event.data));
						if (isJSONRPCResultResponse(message)) {
							receivedResponse = true;
							if (replayMessageId !== void 0) message.id = replayMessageId;
						}
						this.onmessage?.(message);
					} catch (error) {
						this.onerror?.(error);
					}
				}
				if ((isReconnectable || hasPrimingEvent) && !receivedResponse && this._abortController && !this._abortController.signal.aborted) this._scheduleReconnection({
					resumptionToken: lastEventId,
					onresumptiontoken,
					replayMessageId
				}, 0);
			} catch (error) {
				this.onerror?.(/* @__PURE__ */ new Error(`SSE stream disconnected: ${error}`));
				if ((isReconnectable || hasPrimingEvent) && !receivedResponse && this._abortController && !this._abortController.signal.aborted) try {
					this._scheduleReconnection({
						resumptionToken: lastEventId,
						onresumptiontoken,
						replayMessageId
					}, 0);
				} catch (error) {
					this.onerror?.(/* @__PURE__ */ new Error(`Failed to reconnect: ${error instanceof Error ? error.message : String(error)}`));
				}
			}
		};
		processStream();
	}
	async start() {
		if (this._abortController) throw new Error("StreamableHTTPClientTransport already started! If using Client class, note that connect() calls start() automatically.");
		this._abortController = new AbortController();
	}
	/**
	* Call this method after the user has finished authorizing via their user agent and is redirected back to the MCP client application. This will exchange the authorization code for an access token, enabling the next connection attempt to successfully auth.
	*/
	async finishAuth(authorizationCode) {
		if (!this._authProvider) throw new UnauthorizedError("No auth provider");
		if (await auth(this._authProvider, {
			serverUrl: this._url,
			authorizationCode,
			resourceMetadataUrl: this._resourceMetadataUrl,
			scope: this._scope,
			fetchFn: this._fetchWithInit
		}) !== "AUTHORIZED") throw new UnauthorizedError("Failed to authorize");
	}
	async close() {
		if (this._reconnectionTimeout) {
			clearTimeout(this._reconnectionTimeout);
			this._reconnectionTimeout = void 0;
		}
		this._abortController?.abort();
		this.onclose?.();
	}
	async send(message, options) {
		try {
			const { resumptionToken, onresumptiontoken } = options || {};
			if (resumptionToken) {
				this._startOrAuthSse({
					resumptionToken,
					replayMessageId: isJSONRPCRequest(message) ? message.id : void 0
				}).catch((err) => this.onerror?.(err));
				return;
			}
			const headers = await this._commonHeaders();
			headers.set("content-type", "application/json");
			headers.set("accept", "application/json, text/event-stream");
			const init = {
				...this._requestInit,
				method: "POST",
				headers,
				body: JSON.stringify(message),
				signal: this._abortController?.signal
			};
			const response = await (this._fetch ?? fetch)(this._url, init);
			const sessionId = response.headers.get("mcp-session-id");
			if (sessionId) this._sessionId = sessionId;
			if (!response.ok) {
				const text = await response.text().catch(() => null);
				if (response.status === 401 && this._authProvider) {
					if (this._hasCompletedAuthFlow) throw new StreamableHTTPError(401, "Server returned 401 after successful authentication");
					const { resourceMetadataUrl, scope } = extractWWWAuthenticateParams(response);
					this._resourceMetadataUrl = resourceMetadataUrl;
					this._scope = scope;
					if (await auth(this._authProvider, {
						serverUrl: this._url,
						resourceMetadataUrl: this._resourceMetadataUrl,
						scope: this._scope,
						fetchFn: this._fetchWithInit
					}) !== "AUTHORIZED") throw new UnauthorizedError();
					this._hasCompletedAuthFlow = true;
					return this.send(message);
				}
				if (response.status === 403 && this._authProvider) {
					const { resourceMetadataUrl, scope, error } = extractWWWAuthenticateParams(response);
					if (error === "insufficient_scope") {
						const wwwAuthHeader = response.headers.get("WWW-Authenticate");
						if (this._lastUpscopingHeader === wwwAuthHeader) throw new StreamableHTTPError(403, "Server returned 403 after trying upscoping");
						if (scope) this._scope = scope;
						if (resourceMetadataUrl) this._resourceMetadataUrl = resourceMetadataUrl;
						this._lastUpscopingHeader = wwwAuthHeader ?? void 0;
						if (await auth(this._authProvider, {
							serverUrl: this._url,
							resourceMetadataUrl: this._resourceMetadataUrl,
							scope: this._scope,
							fetchFn: this._fetch
						}) !== "AUTHORIZED") throw new UnauthorizedError();
						return this.send(message);
					}
				}
				throw new StreamableHTTPError(response.status, `Error POSTing to endpoint: ${text}`);
			}
			this._hasCompletedAuthFlow = false;
			this._lastUpscopingHeader = void 0;
			if (response.status === 202) {
				await response.body?.cancel();
				if (isInitializedNotification(message)) this._startOrAuthSse({ resumptionToken: void 0 }).catch((err) => this.onerror?.(err));
				return;
			}
			const hasRequests = (Array.isArray(message) ? message : [message]).filter((msg) => "method" in msg && "id" in msg && msg.id !== void 0).length > 0;
			const contentType = response.headers.get("content-type");
			const responseMediaType = mediaTypeEssence(contentType);
			if (hasRequests) {
				if (responseMediaType === "text/event-stream") this._handleSseStream(response.body, { onresumptiontoken }, false);
				else if (responseMediaType === "application/json") {
					const data = await response.json();
					const responseMessages = Array.isArray(data) ? data.map((msg) => JSONRPCMessageSchema.parse(msg)) : [JSONRPCMessageSchema.parse(data)];
					for (const msg of responseMessages) this.onmessage?.(msg);
				} else {
					await response.body?.cancel();
					throw new StreamableHTTPError(-1, `Unexpected content type: ${contentType}`);
				}
			} else await response.body?.cancel();
		} catch (error) {
			this.onerror?.(error);
			throw error;
		}
	}
	get sessionId() {
		return this._sessionId;
	}
	/**
	* Terminates the current session by sending a DELETE request to the server.
	*
	* Clients that no longer need a particular session
	* (e.g., because the user is leaving the client application) SHOULD send an
	* HTTP DELETE to the MCP endpoint with the Mcp-Session-Id header to explicitly
	* terminate the session.
	*
	* The server MAY respond with HTTP 405 Method Not Allowed, indicating that
	* the server does not allow clients to terminate sessions.
	*/
	async terminateSession() {
		if (!this._sessionId) return;
		try {
			const headers = await this._commonHeaders();
			const init = {
				...this._requestInit,
				method: "DELETE",
				headers,
				signal: this._abortController?.signal
			};
			const response = await (this._fetch ?? fetch)(this._url, init);
			await response.body?.cancel();
			if (!response.ok && response.status !== 405) throw new StreamableHTTPError(response.status, `Failed to terminate session: ${response.statusText}`);
			this._sessionId = void 0;
		} catch (error) {
			this.onerror?.(error);
			throw error;
		}
	}
	setProtocolVersion(version) {
		this._protocolVersion = version;
	}
	get protocolVersion() {
		return this._protocolVersion;
	}
	/**
	* Resume an SSE stream from a previous event ID.
	* Opens a GET SSE connection with Last-Event-ID header to replay missed events.
	*
	* @param lastEventId The event ID to resume from
	* @param options Optional callback to receive new resumption tokens
	*/
	async resumeStream(lastEventId, options) {
		await this._startOrAuthSse({
			resumptionToken: lastEventId,
			onresumptiontoken: options?.onresumptiontoken
		});
	}
};
//#endregion
export { StreamableHTTPClientTransport };
