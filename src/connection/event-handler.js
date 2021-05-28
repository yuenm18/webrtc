export class EventHandler {
  constructor() {
    this.handlers = new Map();
    this.handle = this.handle.bind(this);
    this.registerHandler = this.registerHandler.bind(this);
    this.isHandlerRegistered = this.isHandlerRegistered.bind(this);
    this.unregisterHandler = this.unregisterHandler.bind(this);
  }

  handle(...params) {
    this.handlers.forEach(handler => handler(...params));
  }

  registerHandler(name, handler) {
    this.handlers.set(name, handler);
  }

  isHandlerRegistered(name) {
    this.handlers.has(name);
  }

  unregisterHandler(name) {
    this.handlers.delete(name);
  }
}