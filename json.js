(function (root, factory) {
  "use strict";

  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.SabdaJson = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function parse(text, fallback) {
    if (text == null || text === "") return fallback;
    try {
      return JSON.parse(text);
    } catch (error) {
      if (arguments.length >= 2) return fallback;
      throw error;
    }
  }

  function stringify(value, options) {
    const settings = typeof options === "number"
      ? { space: options }
      : (options || {});

    try {
      return JSON.stringify(value, settings.replacer, settings.space == null ? 2 : settings.space);
    } catch (error) {
      if (Object.prototype.hasOwnProperty.call(settings, "fallback")) {
        return settings.fallback;
      }
      throw error;
    }
  }

  async function fetchJson(url, options) {
    const settings = Object.assign({}, options);
    settings.headers = Object.assign(
      { Accept: "application/json" },
      settings.headers || {}
    );

    const response = await fetch(url, settings);
    const text = await response.text();
    let data = {};

    if (text) {
      try {
        data = parse(text);
      } catch (error) {
        throw Object.assign(new Error("The server returned invalid JSON."), {
          status: response.status,
          cause: error
        });
      }
    }

    if (!response.ok) {
      throw Object.assign(new Error(data.error || "Request failed"), {
        status: response.status,
        data
      });
    }
    return data;
  }

  function clone(value) {
    return parse(stringify(value), undefined);
  }

  function storageGet(storage, key, fallback) {
    try {
      const value = storage.getItem(key);
      return value == null ? fallback : parse(value, fallback);
    } catch (error) {
      return fallback;
    }
  }

  function storageSet(storage, key, value) {
    try {
      const encoded = stringify(value, { fallback: null });
      if (encoded == null) return false;
      storage.setItem(key, encoded);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageRemove(storage, key) {
    try {
      storage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  return Object.freeze({
    parse,
    stringify,
    fetchJson,
    clone,
    storageGet,
    storageSet,
    storageRemove
  });
}));
