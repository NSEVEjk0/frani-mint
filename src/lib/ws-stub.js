/**
 * Browser stub for the optional "ws" package.
 *
 * The nostr SDK's WebSocketAdapter only dynamically imports "ws" in Node.js
 * environments; browsers use the native WebSocket. This stub lets webpack
 * resolve the import without bundling the Node package. It is never invoked
 * in the browser (the import is guarded by a `typeof WebSocket` check).
 */
export default class WebSocketStub {
  constructor() {
    throw new Error("ws is not available in the browser");
  }
}
