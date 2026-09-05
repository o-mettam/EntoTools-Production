var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/pvtsutils/build/index.js
var require_build = __commonJS({
  "node_modules/pvtsutils/build/index.js"(exports) {
    "use strict";
    var ARRAY_BUFFER_NAME = "[object ArrayBuffer]";
    var BufferSourceConverter4 = class _BufferSourceConverter {
      static isArrayBuffer(data) {
        return Object.prototype.toString.call(data) === ARRAY_BUFFER_NAME;
      }
      static toArrayBuffer(data) {
        if (this.isArrayBuffer(data)) {
          return data;
        }
        if (data.byteLength === data.buffer.byteLength) {
          return data.buffer;
        }
        if (data.byteOffset === 0 && data.byteLength === data.buffer.byteLength) {
          return data.buffer;
        }
        return this.toUint8Array(data.buffer).slice(data.byteOffset, data.byteOffset + data.byteLength).buffer;
      }
      static toUint8Array(data) {
        return this.toView(data, Uint8Array);
      }
      static toView(data, type) {
        if (data.constructor === type) {
          return data;
        }
        if (this.isArrayBuffer(data)) {
          return new type(data);
        }
        if (this.isArrayBufferView(data)) {
          return new type(data.buffer, data.byteOffset, data.byteLength);
        }
        throw new TypeError("The provided value is not of type '(ArrayBuffer or ArrayBufferView)'");
      }
      static isBufferSource(data) {
        return this.isArrayBufferView(data) || this.isArrayBuffer(data);
      }
      static isArrayBufferView(data) {
        return ArrayBuffer.isView(data) || data && this.isArrayBuffer(data.buffer);
      }
      static isEqual(a, b) {
        const aView = _BufferSourceConverter.toUint8Array(a);
        const bView = _BufferSourceConverter.toUint8Array(b);
        if (aView.length !== bView.byteLength) {
          return false;
        }
        for (let i = 0; i < aView.length; i++) {
          if (aView[i] !== bView[i]) {
            return false;
          }
        }
        return true;
      }
      static concat(...args) {
        let buffers;
        if (Array.isArray(args[0]) && !(args[1] instanceof Function)) {
          buffers = args[0];
        } else if (Array.isArray(args[0]) && args[1] instanceof Function) {
          buffers = args[0];
        } else {
          if (args[args.length - 1] instanceof Function) {
            buffers = args.slice(0, args.length - 1);
          } else {
            buffers = args;
          }
        }
        let size = 0;
        for (const buffer of buffers) {
          size += buffer.byteLength;
        }
        const res = new Uint8Array(size);
        let offset = 0;
        for (const buffer of buffers) {
          const view = this.toUint8Array(buffer);
          res.set(view, offset);
          offset += view.length;
        }
        if (args[args.length - 1] instanceof Function) {
          return this.toView(res, args[args.length - 1]);
        }
        return res.buffer;
      }
    };
    var STRING_TYPE = "string";
    var HEX_REGEX = /^[0-9a-f\s]+$/i;
    var BASE64_REGEX2 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
    var BASE64URL_REGEX2 = /^[a-zA-Z0-9-_]+$/;
    var Utf8Converter = class {
      static fromString(text) {
        const s = unescape(encodeURIComponent(text));
        const uintArray = new Uint8Array(s.length);
        for (let i = 0; i < s.length; i++) {
          uintArray[i] = s.charCodeAt(i);
        }
        return uintArray.buffer;
      }
      static toString(buffer) {
        const buf = BufferSourceConverter4.toUint8Array(buffer);
        let encodedString = "";
        for (let i = 0; i < buf.length; i++) {
          encodedString += String.fromCharCode(buf[i]);
        }
        const decodedString = decodeURIComponent(escape(encodedString));
        return decodedString;
      }
    };
    var Utf16Converter = class {
      static toString(buffer, littleEndian = false) {
        const arrayBuffer = BufferSourceConverter4.toArrayBuffer(buffer);
        const dataView = new DataView(arrayBuffer);
        let res = "";
        for (let i = 0; i < arrayBuffer.byteLength; i += 2) {
          const code = dataView.getUint16(i, littleEndian);
          res += String.fromCharCode(code);
        }
        return res;
      }
      static fromString(text, littleEndian = false) {
        const res = new ArrayBuffer(text.length * 2);
        const dataView = new DataView(res);
        for (let i = 0; i < text.length; i++) {
          dataView.setUint16(i * 2, text.charCodeAt(i), littleEndian);
        }
        return res;
      }
    };
    var Convert4 = class _Convert {
      static isHex(data) {
        return typeof data === STRING_TYPE && HEX_REGEX.test(data);
      }
      static isBase64(data) {
        return typeof data === STRING_TYPE && BASE64_REGEX2.test(data);
      }
      static isBase64Url(data) {
        return typeof data === STRING_TYPE && BASE64URL_REGEX2.test(data);
      }
      static ToString(buffer, enc = "utf8") {
        const buf = BufferSourceConverter4.toUint8Array(buffer);
        switch (enc.toLowerCase()) {
          case "utf8":
            return this.ToUtf8String(buf);
          case "binary":
            return this.ToBinary(buf);
          case "hex":
            return this.ToHex(buf);
          case "base64":
            return this.ToBase64(buf);
          case "base64url":
            return this.ToBase64Url(buf);
          case "utf16le":
            return Utf16Converter.toString(buf, true);
          case "utf16":
          case "utf16be":
            return Utf16Converter.toString(buf);
          default:
            throw new Error(`Unknown type of encoding '${enc}'`);
        }
      }
      static FromString(str, enc = "utf8") {
        if (!str) {
          return new ArrayBuffer(0);
        }
        switch (enc.toLowerCase()) {
          case "utf8":
            return this.FromUtf8String(str);
          case "binary":
            return this.FromBinary(str);
          case "hex":
            return this.FromHex(str);
          case "base64":
            return this.FromBase64(str);
          case "base64url":
            return this.FromBase64Url(str);
          case "utf16le":
            return Utf16Converter.fromString(str, true);
          case "utf16":
          case "utf16be":
            return Utf16Converter.fromString(str);
          default:
            throw new Error(`Unknown type of encoding '${enc}'`);
        }
      }
      static ToBase64(buffer) {
        const buf = BufferSourceConverter4.toUint8Array(buffer);
        if (typeof btoa !== "undefined") {
          const binary2 = this.ToString(buf, "binary");
          return btoa(binary2);
        } else {
          return Buffer.from(buf).toString("base64");
        }
      }
      static FromBase64(base643) {
        const formatted = this.formatString(base643);
        if (!formatted) {
          return new ArrayBuffer(0);
        }
        if (!_Convert.isBase64(formatted)) {
          throw new TypeError("Argument 'base64Text' is not Base64 encoded");
        }
        if (typeof atob !== "undefined") {
          return this.FromBinary(atob(formatted));
        } else {
          return new Uint8Array(Buffer.from(formatted, "base64")).buffer;
        }
      }
      static FromBase64Url(base64url2) {
        const formatted = this.formatString(base64url2);
        if (!formatted) {
          return new ArrayBuffer(0);
        }
        if (!_Convert.isBase64Url(formatted)) {
          throw new TypeError("Argument 'base64url' is not Base64Url encoded");
        }
        return this.FromBase64(this.Base64Padding(formatted.replace(/\-/g, "+").replace(/\_/g, "/")));
      }
      static ToBase64Url(data) {
        return this.ToBase64(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/\=/g, "");
      }
      static FromUtf8String(text, encoding = _Convert.DEFAULT_UTF8_ENCODING) {
        switch (encoding) {
          case "ascii":
            return this.FromBinary(text);
          case "utf8":
            return Utf8Converter.fromString(text);
          case "utf16":
          case "utf16be":
            return Utf16Converter.fromString(text);
          case "utf16le":
          case "usc2":
            return Utf16Converter.fromString(text, true);
          default:
            throw new Error(`Unknown type of encoding '${encoding}'`);
        }
      }
      static ToUtf8String(buffer, encoding = _Convert.DEFAULT_UTF8_ENCODING) {
        switch (encoding) {
          case "ascii":
            return this.ToBinary(buffer);
          case "utf8":
            return Utf8Converter.toString(buffer);
          case "utf16":
          case "utf16be":
            return Utf16Converter.toString(buffer);
          case "utf16le":
          case "usc2":
            return Utf16Converter.toString(buffer, true);
          default:
            throw new Error(`Unknown type of encoding '${encoding}'`);
        }
      }
      static FromBinary(text) {
        const stringLength = text.length;
        const resultView = new Uint8Array(stringLength);
        for (let i = 0; i < stringLength; i++) {
          resultView[i] = text.charCodeAt(i);
        }
        return resultView.buffer;
      }
      static ToBinary(buffer) {
        const buf = BufferSourceConverter4.toUint8Array(buffer);
        let res = "";
        for (let i = 0; i < buf.length; i++) {
          res += String.fromCharCode(buf[i]);
        }
        return res;
      }
      static ToHex(buffer) {
        const buf = BufferSourceConverter4.toUint8Array(buffer);
        let result = "";
        const len = buf.length;
        for (let i = 0; i < len; i++) {
          const byte = buf[i];
          if (byte < 16) {
            result += "0";
          }
          result += byte.toString(16);
        }
        return result;
      }
      static FromHex(hexString) {
        let formatted = this.formatString(hexString);
        if (!formatted) {
          return new ArrayBuffer(0);
        }
        if (!_Convert.isHex(formatted)) {
          throw new TypeError("Argument 'hexString' is not HEX encoded");
        }
        if (formatted.length % 2) {
          formatted = `0${formatted}`;
        }
        const res = new Uint8Array(formatted.length / 2);
        for (let i = 0; i < formatted.length; i = i + 2) {
          const c = formatted.slice(i, i + 2);
          res[i / 2] = parseInt(c, 16);
        }
        return res.buffer;
      }
      static ToUtf16String(buffer, littleEndian = false) {
        return Utf16Converter.toString(buffer, littleEndian);
      }
      static FromUtf16String(text, littleEndian = false) {
        return Utf16Converter.fromString(text, littleEndian);
      }
      static Base64Padding(base643) {
        const padCount = 4 - base643.length % 4;
        if (padCount < 4) {
          for (let i = 0; i < padCount; i++) {
            base643 += "=";
          }
        }
        return base643;
      }
      static formatString(data) {
        return (data === null || data === void 0 ? void 0 : data.replace(/[\n\r\t ]/g, "")) || "";
      }
    };
    Convert4.DEFAULT_UTF8_ENCODING = "utf8";
    function assign2(target, ...sources) {
      const res = arguments[0];
      for (let i = 1; i < arguments.length; i++) {
        const obj = arguments[i];
        for (const prop in obj) {
          res[prop] = obj[prop];
        }
      }
      return res;
    }
    function combine3(...buf) {
      const totalByteLength = buf.map((item) => item.byteLength).reduce((prev, cur) => prev + cur);
      const res = new Uint8Array(totalByteLength);
      let currentPos = 0;
      buf.map((item) => new Uint8Array(item)).forEach((arr) => {
        for (const item2 of arr) {
          res[currentPos++] = item2;
        }
      });
      return res.buffer;
    }
    function isEqual3(bytes1, bytes2) {
      if (!(bytes1 && bytes2)) {
        return false;
      }
      if (bytes1.byteLength !== bytes2.byteLength) {
        return false;
      }
      const b1 = new Uint8Array(bytes1);
      const b2 = new Uint8Array(bytes2);
      for (let i = 0; i < bytes1.byteLength; i++) {
        if (b1[i] !== b2[i]) {
          return false;
        }
      }
      return true;
    }
    exports.BufferSourceConverter = BufferSourceConverter4;
    exports.Convert = Convert4;
    exports.assign = assign2;
    exports.combine = combine3;
    exports.isEqual = isEqual3;
  }
});

// node_modules/reflect-metadata/Reflect.js
var require_Reflect = __commonJS({
  "node_modules/reflect-metadata/Reflect.js"() {
    var Reflect2;
    (function(Reflect3) {
      (function(factory) {
        var root = typeof globalThis === "object" ? globalThis : typeof global === "object" ? global : typeof self === "object" ? self : typeof this === "object" ? this : sloppyModeThis();
        var exporter = makeExporter(Reflect3);
        if (typeof root.Reflect !== "undefined") {
          exporter = makeExporter(root.Reflect, exporter);
        }
        factory(exporter, root);
        if (typeof root.Reflect === "undefined") {
          root.Reflect = Reflect3;
        }
        function makeExporter(target, previous) {
          return function(key, value) {
            Object.defineProperty(target, key, { configurable: true, writable: true, value });
            if (previous)
              previous(key, value);
          };
        }
        function functionThis() {
          try {
            return Function("return this;")();
          } catch (_) {
          }
        }
        function indirectEvalThis() {
          try {
            return (void 0, eval)("(function() { return this; })()");
          } catch (_) {
          }
        }
        function sloppyModeThis() {
          return functionThis() || indirectEvalThis();
        }
      })(function(exporter, root) {
        var hasOwn = Object.prototype.hasOwnProperty;
        var supportsSymbol = typeof Symbol === "function";
        var toPrimitiveSymbol = supportsSymbol && typeof Symbol.toPrimitive !== "undefined" ? Symbol.toPrimitive : "@@toPrimitive";
        var iteratorSymbol = supportsSymbol && typeof Symbol.iterator !== "undefined" ? Symbol.iterator : "@@iterator";
        var supportsCreate = typeof Object.create === "function";
        var supportsProto = { __proto__: [] } instanceof Array;
        var downLevel = !supportsCreate && !supportsProto;
        var HashMap = {
          // create an object in dictionary mode (a.k.a. "slow" mode in v8)
          create: supportsCreate ? function() {
            return MakeDictionary(/* @__PURE__ */ Object.create(null));
          } : supportsProto ? function() {
            return MakeDictionary({ __proto__: null });
          } : function() {
            return MakeDictionary({});
          },
          has: downLevel ? function(map, key) {
            return hasOwn.call(map, key);
          } : function(map, key) {
            return key in map;
          },
          get: downLevel ? function(map, key) {
            return hasOwn.call(map, key) ? map[key] : void 0;
          } : function(map, key) {
            return map[key];
          }
        };
        var functionPrototype = Object.getPrototypeOf(Function);
        var _Map = typeof Map === "function" && typeof Map.prototype.entries === "function" ? Map : CreateMapPolyfill();
        var _Set = typeof Set === "function" && typeof Set.prototype.entries === "function" ? Set : CreateSetPolyfill();
        var _WeakMap = typeof WeakMap === "function" ? WeakMap : CreateWeakMapPolyfill();
        var registrySymbol = supportsSymbol ? /* @__PURE__ */ Symbol.for("@reflect-metadata:registry") : void 0;
        var metadataRegistry = GetOrCreateMetadataRegistry();
        var metadataProvider = CreateMetadataProvider(metadataRegistry);
        function decorate(decorators, target, propertyKey, attributes) {
          if (!IsUndefined(propertyKey)) {
            if (!IsArray(decorators))
              throw new TypeError();
            if (!IsObject(target))
              throw new TypeError();
            if (!IsObject(attributes) && !IsUndefined(attributes) && !IsNull(attributes))
              throw new TypeError();
            if (IsNull(attributes))
              attributes = void 0;
            propertyKey = ToPropertyKey(propertyKey);
            return DecorateProperty(decorators, target, propertyKey, attributes);
          } else {
            if (!IsArray(decorators))
              throw new TypeError();
            if (!IsConstructor(target))
              throw new TypeError();
            return DecorateConstructor(decorators, target);
          }
        }
        exporter("decorate", decorate);
        function metadata(metadataKey, metadataValue) {
          function decorator(target, propertyKey) {
            if (!IsObject(target))
              throw new TypeError();
            if (!IsUndefined(propertyKey) && !IsPropertyKey(propertyKey))
              throw new TypeError();
            OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
          }
          return decorator;
        }
        exporter("metadata", metadata);
        function defineMetadata(metadataKey, metadataValue, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryDefineOwnMetadata(metadataKey, metadataValue, target, propertyKey);
        }
        exporter("defineMetadata", defineMetadata);
        function hasMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryHasMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasMetadata", hasMetadata);
        function hasOwnMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryHasOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("hasOwnMetadata", hasOwnMetadata);
        function getMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryGetMetadata(metadataKey, target, propertyKey);
        }
        exporter("getMetadata", getMetadata);
        function getOwnMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryGetOwnMetadata(metadataKey, target, propertyKey);
        }
        exporter("getOwnMetadata", getOwnMetadata);
        function getMetadataKeys(target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryMetadataKeys(target, propertyKey);
        }
        exporter("getMetadataKeys", getMetadataKeys);
        function getOwnMetadataKeys(target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          return OrdinaryOwnMetadataKeys(target, propertyKey);
        }
        exporter("getOwnMetadataKeys", getOwnMetadataKeys);
        function deleteMetadata(metadataKey, target, propertyKey) {
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          if (!IsObject(target))
            throw new TypeError();
          if (!IsUndefined(propertyKey))
            propertyKey = ToPropertyKey(propertyKey);
          var provider = GetMetadataProvider(
            target,
            propertyKey,
            /*Create*/
            false
          );
          if (IsUndefined(provider))
            return false;
          return provider.OrdinaryDeleteMetadata(metadataKey, target, propertyKey);
        }
        exporter("deleteMetadata", deleteMetadata);
        function DecorateConstructor(decorators, target) {
          for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
              if (!IsConstructor(decorated))
                throw new TypeError();
              target = decorated;
            }
          }
          return target;
        }
        function DecorateProperty(decorators, target, propertyKey, descriptor) {
          for (var i = decorators.length - 1; i >= 0; --i) {
            var decorator = decorators[i];
            var decorated = decorator(target, propertyKey, descriptor);
            if (!IsUndefined(decorated) && !IsNull(decorated)) {
              if (!IsObject(decorated))
                throw new TypeError();
              descriptor = decorated;
            }
          }
          return descriptor;
        }
        function OrdinaryHasMetadata(MetadataKey, O, P) {
          var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
          if (hasOwn2)
            return true;
          var parent = OrdinaryGetPrototypeOf(O);
          if (!IsNull(parent))
            return OrdinaryHasMetadata(MetadataKey, parent, P);
          return false;
        }
        function OrdinaryHasOwnMetadata(MetadataKey, O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*Create*/
            false
          );
          if (IsUndefined(provider))
            return false;
          return ToBoolean(provider.OrdinaryHasOwnMetadata(MetadataKey, O, P));
        }
        function OrdinaryGetMetadata(MetadataKey, O, P) {
          var hasOwn2 = OrdinaryHasOwnMetadata(MetadataKey, O, P);
          if (hasOwn2)
            return OrdinaryGetOwnMetadata(MetadataKey, O, P);
          var parent = OrdinaryGetPrototypeOf(O);
          if (!IsNull(parent))
            return OrdinaryGetMetadata(MetadataKey, parent, P);
          return void 0;
        }
        function OrdinaryGetOwnMetadata(MetadataKey, O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*Create*/
            false
          );
          if (IsUndefined(provider))
            return;
          return provider.OrdinaryGetOwnMetadata(MetadataKey, O, P);
        }
        function OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*Create*/
            true
          );
          provider.OrdinaryDefineOwnMetadata(MetadataKey, MetadataValue, O, P);
        }
        function OrdinaryMetadataKeys(O, P) {
          var ownKeys = OrdinaryOwnMetadataKeys(O, P);
          var parent = OrdinaryGetPrototypeOf(O);
          if (parent === null)
            return ownKeys;
          var parentKeys = OrdinaryMetadataKeys(parent, P);
          if (parentKeys.length <= 0)
            return ownKeys;
          if (ownKeys.length <= 0)
            return parentKeys;
          var set = new _Set();
          var keys = [];
          for (var _i = 0, ownKeys_1 = ownKeys; _i < ownKeys_1.length; _i++) {
            var key = ownKeys_1[_i];
            var hasKey = set.has(key);
            if (!hasKey) {
              set.add(key);
              keys.push(key);
            }
          }
          for (var _a3 = 0, parentKeys_1 = parentKeys; _a3 < parentKeys_1.length; _a3++) {
            var key = parentKeys_1[_a3];
            var hasKey = set.has(key);
            if (!hasKey) {
              set.add(key);
              keys.push(key);
            }
          }
          return keys;
        }
        function OrdinaryOwnMetadataKeys(O, P) {
          var provider = GetMetadataProvider(
            O,
            P,
            /*create*/
            false
          );
          if (!provider) {
            return [];
          }
          return provider.OrdinaryOwnMetadataKeys(O, P);
        }
        function Type(x) {
          if (x === null)
            return 1;
          switch (typeof x) {
            case "undefined":
              return 0;
            case "boolean":
              return 2;
            case "string":
              return 3;
            case "symbol":
              return 4;
            case "number":
              return 5;
            case "object":
              return x === null ? 1 : 6;
            default:
              return 6;
          }
        }
        function IsUndefined(x) {
          return x === void 0;
        }
        function IsNull(x) {
          return x === null;
        }
        function IsSymbol(x) {
          return typeof x === "symbol";
        }
        function IsObject(x) {
          return typeof x === "object" ? x !== null : typeof x === "function";
        }
        function ToPrimitive(input, PreferredType) {
          switch (Type(input)) {
            case 0:
              return input;
            case 1:
              return input;
            case 2:
              return input;
            case 3:
              return input;
            case 4:
              return input;
            case 5:
              return input;
          }
          var hint = PreferredType === 3 ? "string" : PreferredType === 5 ? "number" : "default";
          var exoticToPrim = GetMethod(input, toPrimitiveSymbol);
          if (exoticToPrim !== void 0) {
            var result = exoticToPrim.call(input, hint);
            if (IsObject(result))
              throw new TypeError();
            return result;
          }
          return OrdinaryToPrimitive(input, hint === "default" ? "number" : hint);
        }
        function OrdinaryToPrimitive(O, hint) {
          if (hint === "string") {
            var toString_1 = O.toString;
            if (IsCallable(toString_1)) {
              var result = toString_1.call(O);
              if (!IsObject(result))
                return result;
            }
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
              var result = valueOf.call(O);
              if (!IsObject(result))
                return result;
            }
          } else {
            var valueOf = O.valueOf;
            if (IsCallable(valueOf)) {
              var result = valueOf.call(O);
              if (!IsObject(result))
                return result;
            }
            var toString_2 = O.toString;
            if (IsCallable(toString_2)) {
              var result = toString_2.call(O);
              if (!IsObject(result))
                return result;
            }
          }
          throw new TypeError();
        }
        function ToBoolean(argument) {
          return !!argument;
        }
        function ToString(argument) {
          return "" + argument;
        }
        function ToPropertyKey(argument) {
          var key = ToPrimitive(
            argument,
            3
            /* String */
          );
          if (IsSymbol(key))
            return key;
          return ToString(key);
        }
        function IsArray(argument) {
          return Array.isArray ? Array.isArray(argument) : argument instanceof Object ? argument instanceof Array : Object.prototype.toString.call(argument) === "[object Array]";
        }
        function IsCallable(argument) {
          return typeof argument === "function";
        }
        function IsConstructor(argument) {
          return typeof argument === "function";
        }
        function IsPropertyKey(argument) {
          switch (Type(argument)) {
            case 3:
              return true;
            case 4:
              return true;
            default:
              return false;
          }
        }
        function SameValueZero(x, y) {
          return x === y || x !== x && y !== y;
        }
        function GetMethod(V, P) {
          var func = V[P];
          if (func === void 0 || func === null)
            return void 0;
          if (!IsCallable(func))
            throw new TypeError();
          return func;
        }
        function GetIterator(obj) {
          var method = GetMethod(obj, iteratorSymbol);
          if (!IsCallable(method))
            throw new TypeError();
          var iterator = method.call(obj);
          if (!IsObject(iterator))
            throw new TypeError();
          return iterator;
        }
        function IteratorValue(iterResult) {
          return iterResult.value;
        }
        function IteratorStep(iterator) {
          var result = iterator.next();
          return result.done ? false : result;
        }
        function IteratorClose(iterator) {
          var f = iterator["return"];
          if (f)
            f.call(iterator);
        }
        function OrdinaryGetPrototypeOf(O) {
          var proto = Object.getPrototypeOf(O);
          if (typeof O !== "function" || O === functionPrototype)
            return proto;
          if (proto !== functionPrototype)
            return proto;
          var prototype = O.prototype;
          var prototypeProto = prototype && Object.getPrototypeOf(prototype);
          if (prototypeProto == null || prototypeProto === Object.prototype)
            return proto;
          var constructor = prototypeProto.constructor;
          if (typeof constructor !== "function")
            return proto;
          if (constructor === O)
            return proto;
          return constructor;
        }
        function CreateMetadataRegistry() {
          var fallback;
          if (!IsUndefined(registrySymbol) && typeof root.Reflect !== "undefined" && !(registrySymbol in root.Reflect) && typeof root.Reflect.defineMetadata === "function") {
            fallback = CreateFallbackProvider(root.Reflect);
          }
          var first;
          var second;
          var rest;
          var targetProviderMap = new _WeakMap();
          var registry = {
            registerProvider,
            getProvider,
            setProvider
          };
          return registry;
          function registerProvider(provider) {
            if (!Object.isExtensible(registry)) {
              throw new Error("Cannot add provider to a frozen registry.");
            }
            switch (true) {
              case fallback === provider:
                break;
              case IsUndefined(first):
                first = provider;
                break;
              case first === provider:
                break;
              case IsUndefined(second):
                second = provider;
                break;
              case second === provider:
                break;
              default:
                if (rest === void 0)
                  rest = new _Set();
                rest.add(provider);
                break;
            }
          }
          function getProviderNoCache(O, P) {
            if (!IsUndefined(first)) {
              if (first.isProviderFor(O, P))
                return first;
              if (!IsUndefined(second)) {
                if (second.isProviderFor(O, P))
                  return first;
                if (!IsUndefined(rest)) {
                  var iterator = GetIterator(rest);
                  while (true) {
                    var next = IteratorStep(iterator);
                    if (!next) {
                      return void 0;
                    }
                    var provider = IteratorValue(next);
                    if (provider.isProviderFor(O, P)) {
                      IteratorClose(iterator);
                      return provider;
                    }
                  }
                }
              }
            }
            if (!IsUndefined(fallback) && fallback.isProviderFor(O, P)) {
              return fallback;
            }
            return void 0;
          }
          function getProvider(O, P) {
            var providerMap = targetProviderMap.get(O);
            var provider;
            if (!IsUndefined(providerMap)) {
              provider = providerMap.get(P);
            }
            if (!IsUndefined(provider)) {
              return provider;
            }
            provider = getProviderNoCache(O, P);
            if (!IsUndefined(provider)) {
              if (IsUndefined(providerMap)) {
                providerMap = new _Map();
                targetProviderMap.set(O, providerMap);
              }
              providerMap.set(P, provider);
            }
            return provider;
          }
          function hasProvider(provider) {
            if (IsUndefined(provider))
              throw new TypeError();
            return first === provider || second === provider || !IsUndefined(rest) && rest.has(provider);
          }
          function setProvider(O, P, provider) {
            if (!hasProvider(provider)) {
              throw new Error("Metadata provider not registered.");
            }
            var existingProvider = getProvider(O, P);
            if (existingProvider !== provider) {
              if (!IsUndefined(existingProvider)) {
                return false;
              }
              var providerMap = targetProviderMap.get(O);
              if (IsUndefined(providerMap)) {
                providerMap = new _Map();
                targetProviderMap.set(O, providerMap);
              }
              providerMap.set(P, provider);
            }
            return true;
          }
        }
        function GetOrCreateMetadataRegistry() {
          var metadataRegistry2;
          if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
            metadataRegistry2 = root.Reflect[registrySymbol];
          }
          if (IsUndefined(metadataRegistry2)) {
            metadataRegistry2 = CreateMetadataRegistry();
          }
          if (!IsUndefined(registrySymbol) && IsObject(root.Reflect) && Object.isExtensible(root.Reflect)) {
            Object.defineProperty(root.Reflect, registrySymbol, {
              enumerable: false,
              configurable: false,
              writable: false,
              value: metadataRegistry2
            });
          }
          return metadataRegistry2;
        }
        function CreateMetadataProvider(registry) {
          var metadata2 = new _WeakMap();
          var provider = {
            isProviderFor: function(O, P) {
              var targetMetadata = metadata2.get(O);
              if (IsUndefined(targetMetadata))
                return false;
              return targetMetadata.has(P);
            },
            OrdinaryDefineOwnMetadata: OrdinaryDefineOwnMetadata2,
            OrdinaryHasOwnMetadata: OrdinaryHasOwnMetadata2,
            OrdinaryGetOwnMetadata: OrdinaryGetOwnMetadata2,
            OrdinaryOwnMetadataKeys: OrdinaryOwnMetadataKeys2,
            OrdinaryDeleteMetadata
          };
          metadataRegistry.registerProvider(provider);
          return provider;
          function GetOrCreateMetadataMap(O, P, Create) {
            var targetMetadata = metadata2.get(O);
            var createdTargetMetadata = false;
            if (IsUndefined(targetMetadata)) {
              if (!Create)
                return void 0;
              targetMetadata = new _Map();
              metadata2.set(O, targetMetadata);
              createdTargetMetadata = true;
            }
            var metadataMap = targetMetadata.get(P);
            if (IsUndefined(metadataMap)) {
              if (!Create)
                return void 0;
              metadataMap = new _Map();
              targetMetadata.set(P, metadataMap);
              if (!registry.setProvider(O, P, provider)) {
                targetMetadata.delete(P);
                if (createdTargetMetadata) {
                  metadata2.delete(O);
                }
                throw new Error("Wrong provider for target.");
              }
            }
            return metadataMap;
          }
          function OrdinaryHasOwnMetadata2(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap))
              return false;
            return ToBoolean(metadataMap.has(MetadataKey));
          }
          function OrdinaryGetOwnMetadata2(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap))
              return void 0;
            return metadataMap.get(MetadataKey);
          }
          function OrdinaryDefineOwnMetadata2(MetadataKey, MetadataValue, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              true
            );
            metadataMap.set(MetadataKey, MetadataValue);
          }
          function OrdinaryOwnMetadataKeys2(O, P) {
            var keys = [];
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap))
              return keys;
            var keysObj = metadataMap.keys();
            var iterator = GetIterator(keysObj);
            var k = 0;
            while (true) {
              var next = IteratorStep(iterator);
              if (!next) {
                keys.length = k;
                return keys;
              }
              var nextValue = IteratorValue(next);
              try {
                keys[k] = nextValue;
              } catch (e) {
                try {
                  IteratorClose(iterator);
                } finally {
                  throw e;
                }
              }
              k++;
            }
          }
          function OrdinaryDeleteMetadata(MetadataKey, O, P) {
            var metadataMap = GetOrCreateMetadataMap(
              O,
              P,
              /*Create*/
              false
            );
            if (IsUndefined(metadataMap))
              return false;
            if (!metadataMap.delete(MetadataKey))
              return false;
            if (metadataMap.size === 0) {
              var targetMetadata = metadata2.get(O);
              if (!IsUndefined(targetMetadata)) {
                targetMetadata.delete(P);
                if (targetMetadata.size === 0) {
                  metadata2.delete(targetMetadata);
                }
              }
            }
            return true;
          }
        }
        function CreateFallbackProvider(reflect) {
          var defineMetadata2 = reflect.defineMetadata, hasOwnMetadata2 = reflect.hasOwnMetadata, getOwnMetadata2 = reflect.getOwnMetadata, getOwnMetadataKeys2 = reflect.getOwnMetadataKeys, deleteMetadata2 = reflect.deleteMetadata;
          var metadataOwner = new _WeakMap();
          var provider = {
            isProviderFor: function(O, P) {
              var metadataPropertySet = metadataOwner.get(O);
              if (!IsUndefined(metadataPropertySet) && metadataPropertySet.has(P)) {
                return true;
              }
              if (getOwnMetadataKeys2(O, P).length) {
                if (IsUndefined(metadataPropertySet)) {
                  metadataPropertySet = new _Set();
                  metadataOwner.set(O, metadataPropertySet);
                }
                metadataPropertySet.add(P);
                return true;
              }
              return false;
            },
            OrdinaryDefineOwnMetadata: defineMetadata2,
            OrdinaryHasOwnMetadata: hasOwnMetadata2,
            OrdinaryGetOwnMetadata: getOwnMetadata2,
            OrdinaryOwnMetadataKeys: getOwnMetadataKeys2,
            OrdinaryDeleteMetadata: deleteMetadata2
          };
          return provider;
        }
        function GetMetadataProvider(O, P, Create) {
          var registeredProvider = metadataRegistry.getProvider(O, P);
          if (!IsUndefined(registeredProvider)) {
            return registeredProvider;
          }
          if (Create) {
            if (metadataRegistry.setProvider(O, P, metadataProvider)) {
              return metadataProvider;
            }
            throw new Error("Illegal state.");
          }
          return void 0;
        }
        function CreateMapPolyfill() {
          var cacheSentinel = {};
          var arraySentinel = [];
          var MapIterator = (
            /** @class */
            (function() {
              function MapIterator2(keys, values, selector) {
                this._index = 0;
                this._keys = keys;
                this._values = values;
                this._selector = selector;
              }
              MapIterator2.prototype["@@iterator"] = function() {
                return this;
              };
              MapIterator2.prototype[iteratorSymbol] = function() {
                return this;
              };
              MapIterator2.prototype.next = function() {
                var index = this._index;
                if (index >= 0 && index < this._keys.length) {
                  var result = this._selector(this._keys[index], this._values[index]);
                  if (index + 1 >= this._keys.length) {
                    this._index = -1;
                    this._keys = arraySentinel;
                    this._values = arraySentinel;
                  } else {
                    this._index++;
                  }
                  return { value: result, done: false };
                }
                return { value: void 0, done: true };
              };
              MapIterator2.prototype.throw = function(error) {
                if (this._index >= 0) {
                  this._index = -1;
                  this._keys = arraySentinel;
                  this._values = arraySentinel;
                }
                throw error;
              };
              MapIterator2.prototype.return = function(value) {
                if (this._index >= 0) {
                  this._index = -1;
                  this._keys = arraySentinel;
                  this._values = arraySentinel;
                }
                return { value, done: true };
              };
              return MapIterator2;
            })()
          );
          var Map2 = (
            /** @class */
            (function() {
              function Map3() {
                this._keys = [];
                this._values = [];
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
              }
              Object.defineProperty(Map3.prototype, "size", {
                get: function() {
                  return this._keys.length;
                },
                enumerable: true,
                configurable: true
              });
              Map3.prototype.has = function(key) {
                return this._find(
                  key,
                  /*insert*/
                  false
                ) >= 0;
              };
              Map3.prototype.get = function(key) {
                var index = this._find(
                  key,
                  /*insert*/
                  false
                );
                return index >= 0 ? this._values[index] : void 0;
              };
              Map3.prototype.set = function(key, value) {
                var index = this._find(
                  key,
                  /*insert*/
                  true
                );
                this._values[index] = value;
                return this;
              };
              Map3.prototype.delete = function(key) {
                var index = this._find(
                  key,
                  /*insert*/
                  false
                );
                if (index >= 0) {
                  var size = this._keys.length;
                  for (var i = index + 1; i < size; i++) {
                    this._keys[i - 1] = this._keys[i];
                    this._values[i - 1] = this._values[i];
                  }
                  this._keys.length--;
                  this._values.length--;
                  if (SameValueZero(key, this._cacheKey)) {
                    this._cacheKey = cacheSentinel;
                    this._cacheIndex = -2;
                  }
                  return true;
                }
                return false;
              };
              Map3.prototype.clear = function() {
                this._keys.length = 0;
                this._values.length = 0;
                this._cacheKey = cacheSentinel;
                this._cacheIndex = -2;
              };
              Map3.prototype.keys = function() {
                return new MapIterator(this._keys, this._values, getKey);
              };
              Map3.prototype.values = function() {
                return new MapIterator(this._keys, this._values, getValue);
              };
              Map3.prototype.entries = function() {
                return new MapIterator(this._keys, this._values, getEntry);
              };
              Map3.prototype["@@iterator"] = function() {
                return this.entries();
              };
              Map3.prototype[iteratorSymbol] = function() {
                return this.entries();
              };
              Map3.prototype._find = function(key, insert) {
                if (!SameValueZero(this._cacheKey, key)) {
                  this._cacheIndex = -1;
                  for (var i = 0; i < this._keys.length; i++) {
                    if (SameValueZero(this._keys[i], key)) {
                      this._cacheIndex = i;
                      break;
                    }
                  }
                }
                if (this._cacheIndex < 0 && insert) {
                  this._cacheIndex = this._keys.length;
                  this._keys.push(key);
                  this._values.push(void 0);
                }
                return this._cacheIndex;
              };
              return Map3;
            })()
          );
          return Map2;
          function getKey(key, _) {
            return key;
          }
          function getValue(_, value) {
            return value;
          }
          function getEntry(key, value) {
            return [key, value];
          }
        }
        function CreateSetPolyfill() {
          var Set3 = (
            /** @class */
            (function() {
              function Set4() {
                this._map = new _Map();
              }
              Object.defineProperty(Set4.prototype, "size", {
                get: function() {
                  return this._map.size;
                },
                enumerable: true,
                configurable: true
              });
              Set4.prototype.has = function(value) {
                return this._map.has(value);
              };
              Set4.prototype.add = function(value) {
                return this._map.set(value, value), this;
              };
              Set4.prototype.delete = function(value) {
                return this._map.delete(value);
              };
              Set4.prototype.clear = function() {
                this._map.clear();
              };
              Set4.prototype.keys = function() {
                return this._map.keys();
              };
              Set4.prototype.values = function() {
                return this._map.keys();
              };
              Set4.prototype.entries = function() {
                return this._map.entries();
              };
              Set4.prototype["@@iterator"] = function() {
                return this.keys();
              };
              Set4.prototype[iteratorSymbol] = function() {
                return this.keys();
              };
              return Set4;
            })()
          );
          return Set3;
        }
        function CreateWeakMapPolyfill() {
          var UUID_SIZE = 16;
          var keys = HashMap.create();
          var rootKey = CreateUniqueKey();
          return (
            /** @class */
            (function() {
              function WeakMap2() {
                this._key = CreateUniqueKey();
              }
              WeakMap2.prototype.has = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? HashMap.has(table, this._key) : false;
              };
              WeakMap2.prototype.get = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? HashMap.get(table, this._key) : void 0;
              };
              WeakMap2.prototype.set = function(target, value) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  true
                );
                table[this._key] = value;
                return this;
              };
              WeakMap2.prototype.delete = function(target) {
                var table = GetOrCreateWeakMapTable(
                  target,
                  /*create*/
                  false
                );
                return table !== void 0 ? delete table[this._key] : false;
              };
              WeakMap2.prototype.clear = function() {
                this._key = CreateUniqueKey();
              };
              return WeakMap2;
            })()
          );
          function CreateUniqueKey() {
            var key;
            do
              key = "@@WeakMap@@" + CreateUUID();
            while (HashMap.has(keys, key));
            keys[key] = true;
            return key;
          }
          function GetOrCreateWeakMapTable(target, create3) {
            if (!hasOwn.call(target, rootKey)) {
              if (!create3)
                return void 0;
              Object.defineProperty(target, rootKey, { value: HashMap.create() });
            }
            return target[rootKey];
          }
          function FillRandomBytes(buffer, size) {
            for (var i = 0; i < size; ++i)
              buffer[i] = Math.random() * 255 | 0;
            return buffer;
          }
          function GenRandomBytes(size) {
            if (typeof Uint8Array === "function") {
              var array = new Uint8Array(size);
              if (typeof crypto !== "undefined") {
                crypto.getRandomValues(array);
              } else if (typeof msCrypto !== "undefined") {
                msCrypto.getRandomValues(array);
              } else {
                FillRandomBytes(array, size);
              }
              return array;
            }
            return FillRandomBytes(new Array(size), size);
          }
          function CreateUUID() {
            var data = GenRandomBytes(UUID_SIZE);
            data[6] = data[6] & 79 | 64;
            data[8] = data[8] & 191 | 128;
            var result = "";
            for (var offset = 0; offset < UUID_SIZE; ++offset) {
              var byte = data[offset];
              if (offset === 4 || offset === 6 || offset === 8)
                result += "-";
              if (byte < 16)
                result += "0";
              result += byte.toString(16).toLowerCase();
            }
            return result;
          }
        }
        function MakeDictionary(obj) {
          obj.__ = void 0;
          delete obj.__;
          return obj;
        }
      });
    })(Reflect2 || (Reflect2 = {}));
  }
});

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoBase64URL.js
var isoBase64URL_exports = {};
__export(isoBase64URL_exports, {
  fromBuffer: () => fromBuffer,
  fromUTF8String: () => fromUTF8String,
  isBase64: () => isBase64,
  isBase64URL: () => isBase64URL,
  toBase64: () => toBase64,
  toBuffer: () => toBuffer,
  toUTF8String: () => toUTF8String,
  trimPadding: () => trimPadding
});

// node_modules/@hexagon/base64/src/base64.js
var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var charsUrl = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
var genLookup = (target) => {
  const lookupTemp = typeof Uint8Array === "undefined" ? [] : new Uint8Array(256);
  const len = chars.length;
  for (let i = 0; i < len; i++) {
    lookupTemp[target.charCodeAt(i)] = i;
  }
  return lookupTemp;
};
var lookup = genLookup(chars);
var lookupUrl = genLookup(charsUrl);
var base64UrlPattern = /^[-A-Za-z0-9\-_]*$/;
var base64Pattern = /^[-A-Za-z0-9+/]*={0,3}$/;
var base64 = {};
base64.toArrayBuffer = (data, urlMode) => {
  const len = data.length;
  let bufferLength = data.length * 0.75, i, p = 0, encoded1, encoded2, encoded3, encoded4;
  if (data[data.length - 1] === "=") {
    bufferLength--;
    if (data[data.length - 2] === "=") {
      bufferLength--;
    }
  }
  const arraybuffer = new ArrayBuffer(bufferLength), bytes = new Uint8Array(arraybuffer), target = urlMode ? lookupUrl : lookup;
  for (i = 0; i < len; i += 4) {
    encoded1 = target[data.charCodeAt(i)];
    encoded2 = target[data.charCodeAt(i + 1)];
    encoded3 = target[data.charCodeAt(i + 2)];
    encoded4 = target[data.charCodeAt(i + 3)];
    bytes[p++] = encoded1 << 2 | encoded2 >> 4;
    bytes[p++] = (encoded2 & 15) << 4 | encoded3 >> 2;
    bytes[p++] = (encoded3 & 3) << 6 | encoded4 & 63;
  }
  return arraybuffer;
};
base64.fromArrayBuffer = (arrBuf, urlMode) => {
  const bytes = new Uint8Array(arrBuf);
  let i, result = "";
  const len = bytes.length, target = urlMode ? charsUrl : chars;
  for (i = 0; i < len; i += 3) {
    result += target[bytes[i] >> 2];
    result += target[(bytes[i] & 3) << 4 | bytes[i + 1] >> 4];
    result += target[(bytes[i + 1] & 15) << 2 | bytes[i + 2] >> 6];
    result += target[bytes[i + 2] & 63];
  }
  const remainder = len % 3;
  if (remainder === 2) {
    result = result.substring(0, result.length - 1) + (urlMode ? "" : "=");
  } else if (remainder === 1) {
    result = result.substring(0, result.length - 2) + (urlMode ? "" : "==");
  }
  return result;
};
base64.toString = (str, urlMode) => {
  return new TextDecoder().decode(base64.toArrayBuffer(str, urlMode));
};
base64.fromString = (str, urlMode) => {
  return base64.fromArrayBuffer(new TextEncoder().encode(str), urlMode);
};
base64.validate = (encoded, urlMode) => {
  if (!(typeof encoded === "string" || encoded instanceof String)) {
    return false;
  }
  try {
    return urlMode ? base64UrlPattern.test(encoded) : base64Pattern.test(encoded);
  } catch (_e) {
    return false;
  }
};
base64.base64 = base64;
var base64_default = base64;

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoBase64URL.js
function toBuffer(base64urlString, from = "base64url") {
  const _buffer = base64_default.toArrayBuffer(base64urlString, from === "base64url");
  return new Uint8Array(_buffer);
}
function fromBuffer(buffer, to = "base64url") {
  const _normalized = new Uint8Array(buffer);
  return base64_default.fromArrayBuffer(_normalized.buffer, to === "base64url");
}
function toBase64(base64urlString) {
  const fromBase64Url = base64_default.toArrayBuffer(base64urlString, true);
  const toBase642 = base64_default.fromArrayBuffer(fromBase64Url);
  return toBase642;
}
function fromUTF8String(utf8String) {
  return base64_default.fromString(utf8String, true);
}
function toUTF8String(base64urlString) {
  return base64_default.toString(base64urlString, true);
}
function isBase64(input) {
  return base64_default.validate(input, false);
}
function isBase64URL(input) {
  input = trimPadding(input);
  return base64_default.validate(input, true);
}
function trimPadding(input) {
  return input.replace(/=/g, "");
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCBOR.js
var isoCBOR_exports = {};
__export(isoCBOR_exports, {
  decodeFirst: () => decodeFirst,
  encode: () => encode
});

// node_modules/@levischuck/tiny-cbor/esm/cbor/cbor_internal.js
function decodeLength(data, argument, index) {
  if (argument < 24) {
    return [argument, 1];
  }
  const remainingDataLength = data.byteLength - index - 1;
  const view = new DataView(data.buffer, index + 1);
  let output;
  let bytes = 0;
  switch (argument) {
    case 24: {
      if (remainingDataLength > 0) {
        output = view.getUint8(0);
        bytes = 2;
      }
      break;
    }
    case 25: {
      if (remainingDataLength > 1) {
        output = view.getUint16(0, false);
        bytes = 3;
      }
      break;
    }
    case 26: {
      if (remainingDataLength > 3) {
        output = view.getUint32(0, false);
        bytes = 5;
      }
      break;
    }
    case 27: {
      if (remainingDataLength > 7) {
        const bigOutput = view.getBigUint64(0, false);
        if (bigOutput >= 24n && bigOutput <= Number.MAX_SAFE_INTEGER) {
          return [Number(bigOutput), 9];
        }
      }
      break;
    }
  }
  if (output && output >= 24) {
    return [output, bytes];
  }
  throw new Error("Length not supported or not well formed");
}
var MAJOR_TYPE_UNSIGNED_INTEGER = 0;
var MAJOR_TYPE_NEGATIVE_INTEGER = 1;
var MAJOR_TYPE_BYTE_STRING = 2;
var MAJOR_TYPE_TEXT_STRING = 3;
var MAJOR_TYPE_ARRAY = 4;
var MAJOR_TYPE_MAP = 5;
var MAJOR_TYPE_TAG = 6;
var MAJOR_TYPE_SIMPLE_OR_FLOAT = 7;
function encodeLength(major, argument) {
  const majorEncoded = major << 5;
  if (argument < 0) {
    throw new Error("CBOR Data Item argument must not be negative");
  }
  let bigintArgument;
  if (typeof argument == "number") {
    if (!Number.isInteger(argument)) {
      throw new Error("CBOR Data Item argument must be an integer");
    }
    bigintArgument = BigInt(argument);
  } else {
    bigintArgument = argument;
  }
  if (major == MAJOR_TYPE_NEGATIVE_INTEGER) {
    if (bigintArgument == 0n) {
      throw new Error("CBOR Data Item argument cannot be zero when negative");
    }
    bigintArgument = bigintArgument - 1n;
  }
  if (bigintArgument > 18446744073709551615n) {
    throw new Error("CBOR number out of range");
  }
  const buffer = new Uint8Array(8);
  const view = new DataView(buffer.buffer);
  view.setBigUint64(0, bigintArgument, false);
  if (bigintArgument <= 23) {
    return [majorEncoded | buffer[7]];
  } else if (bigintArgument <= 255) {
    return [majorEncoded | 24, buffer[7]];
  } else if (bigintArgument <= 65535) {
    return [majorEncoded | 25, ...buffer.slice(6)];
  } else if (bigintArgument <= 4294967295) {
    return [
      majorEncoded | 26,
      ...buffer.slice(4)
    ];
  } else {
    return [
      majorEncoded | 27,
      ...buffer
    ];
  }
}

// node_modules/@levischuck/tiny-cbor/esm/cbor/cbor.js
var CBORTag = class {
  /**
   * Wrap a value with a tag number.
   * When encoded, this tag will be attached to the value.
   *
   * @param tag Tag number
   * @param value Wrapped value
   */
  constructor(tag, value) {
    Object.defineProperty(this, "tagId", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "tagValue", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.tagId = tag;
    this.tagValue = value;
  }
  /**
   * Read the tag number
   */
  get tag() {
    return this.tagId;
  }
  /**
   * Read the value
   */
  get value() {
    return this.tagValue;
  }
};
function decodeUnsignedInteger(data, argument, index) {
  return decodeLength(data, argument, index);
}
function decodeNegativeInteger(data, argument, index) {
  const [value, length] = decodeUnsignedInteger(data, argument, index);
  return [-value - 1, length];
}
function decodeByteString(data, argument, index) {
  const [lengthValue, lengthConsumed] = decodeLength(data, argument, index);
  const dataStartIndex = index + lengthConsumed;
  return [
    new Uint8Array(data.buffer.slice(dataStartIndex, dataStartIndex + lengthValue)),
    lengthConsumed + lengthValue
  ];
}
var TEXT_DECODER = new TextDecoder();
function decodeString(data, argument, index) {
  const [value, length] = decodeByteString(data, argument, index);
  return [TEXT_DECODER.decode(value), length];
}
function decodeArray(data, argument, index) {
  if (argument === 0) {
    return [[], 1];
  }
  const [length, lengthConsumed] = decodeLength(data, argument, index);
  let consumedLength = lengthConsumed;
  const value = [];
  for (let i = 0; i < length; i++) {
    const remainingDataLength = data.byteLength - index - consumedLength;
    if (remainingDataLength <= 0) {
      throw new Error("array is not supported or well formed");
    }
    const [decodedValue, consumed] = decodeNext(data, index + consumedLength);
    value.push(decodedValue);
    consumedLength += consumed;
  }
  return [value, consumedLength];
}
var MAP_ERROR = "Map is not supported or well formed";
function decodeMap(data, argument, index) {
  if (argument === 0) {
    return [/* @__PURE__ */ new Map(), 1];
  }
  const [length, lengthConsumed] = decodeLength(data, argument, index);
  let consumedLength = lengthConsumed;
  const result = /* @__PURE__ */ new Map();
  for (let i = 0; i < length; i++) {
    let remainingDataLength = data.byteLength - index - consumedLength;
    if (remainingDataLength <= 0) {
      throw new Error(MAP_ERROR);
    }
    const [key, keyConsumed] = decodeNext(data, index + consumedLength);
    consumedLength += keyConsumed;
    remainingDataLength -= keyConsumed;
    if (remainingDataLength <= 0) {
      throw new Error(MAP_ERROR);
    }
    if (typeof key !== "string" && typeof key !== "number") {
      throw new Error(MAP_ERROR);
    }
    if (result.has(key)) {
      throw new Error(MAP_ERROR);
    }
    const [value, valueConsumed] = decodeNext(data, index + consumedLength);
    consumedLength += valueConsumed;
    result.set(key, value);
  }
  return [result, consumedLength];
}
function decodeFloat16(data, index) {
  if (index + 3 > data.byteLength) {
    throw new Error("CBOR stream ended before end of Float 16");
  }
  const result = data.getUint16(index + 1, false);
  if (result == 31744) {
    return [Infinity, 3];
  } else if (result == 32256) {
    return [NaN, 3];
  } else if (result == 64512) {
    return [-Infinity, 3];
  }
  throw new Error("Float16 data is unsupported");
}
function decodeFloat32(data, index) {
  if (index + 5 > data.byteLength) {
    throw new Error("CBOR stream ended before end of Float 32");
  }
  const result = data.getFloat32(index + 1, false);
  return [result, 5];
}
function decodeFloat64(data, index) {
  if (index + 9 > data.byteLength) {
    throw new Error("CBOR stream ended before end of Float 64");
  }
  const result = data.getFloat64(index + 1, false);
  return [result, 9];
}
function decodeTag(data, argument, index) {
  const [tag, tagBytes] = decodeLength(data, argument, index);
  const [value, valueBytes] = decodeNext(data, index + tagBytes);
  return [new CBORTag(tag, value), tagBytes + valueBytes];
}
function decodeNext(data, index) {
  if (index >= data.byteLength) {
    throw new Error("CBOR stream ended before tag value");
  }
  const byte = data.getUint8(index);
  const majorType = byte >> 5;
  const argument = byte & 31;
  switch (majorType) {
    case MAJOR_TYPE_UNSIGNED_INTEGER: {
      return decodeUnsignedInteger(data, argument, index);
    }
    case MAJOR_TYPE_NEGATIVE_INTEGER: {
      return decodeNegativeInteger(data, argument, index);
    }
    case MAJOR_TYPE_BYTE_STRING: {
      return decodeByteString(data, argument, index);
    }
    case MAJOR_TYPE_TEXT_STRING: {
      return decodeString(data, argument, index);
    }
    case MAJOR_TYPE_ARRAY: {
      return decodeArray(data, argument, index);
    }
    case MAJOR_TYPE_MAP: {
      return decodeMap(data, argument, index);
    }
    case MAJOR_TYPE_TAG: {
      return decodeTag(data, argument, index);
    }
    case MAJOR_TYPE_SIMPLE_OR_FLOAT: {
      switch (argument) {
        case 20:
          return [false, 1];
        case 21:
          return [true, 1];
        case 22:
          return [null, 1];
        case 23:
          return [void 0, 1];
        // 24: Simple value (value 32..255 in following byte)
        case 25:
          return decodeFloat16(data, index);
        case 26:
          return decodeFloat32(data, index);
        case 27:
          return decodeFloat64(data, index);
      }
    }
  }
  throw new Error(`Unsupported or not well formed at ${index}`);
}
function encodeSimple(data) {
  if (data === true) {
    return 245;
  } else if (data === false) {
    return 244;
  } else if (data === null) {
    return 246;
  }
  return 247;
}
function encodeFloat(data) {
  if (Math.fround(data) == data || !Number.isFinite(data) || Number.isNaN(data)) {
    const output = new Uint8Array(5);
    output[0] = 250;
    const view = new DataView(output.buffer);
    view.setFloat32(1, data, false);
    return output;
  } else {
    const output = new Uint8Array(9);
    output[0] = 251;
    const view = new DataView(output.buffer);
    view.setFloat64(1, data, false);
    return output;
  }
}
function encodeNumber(data) {
  if (typeof data == "number") {
    if (Number.isSafeInteger(data)) {
      if (data < 0) {
        return encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, Math.abs(data));
      } else {
        return encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, data);
      }
    }
    return [encodeFloat(data)];
  } else {
    if (data < 0n) {
      return encodeLength(MAJOR_TYPE_NEGATIVE_INTEGER, data * -1n);
    } else {
      return encodeLength(MAJOR_TYPE_UNSIGNED_INTEGER, data);
    }
  }
}
var ENCODER = new TextEncoder();
function encodeString(data, output) {
  output.push(...encodeLength(MAJOR_TYPE_TEXT_STRING, data.length));
  output.push(ENCODER.encode(data));
}
function encodeBytes(data, output) {
  output.push(...encodeLength(MAJOR_TYPE_BYTE_STRING, data.length));
  output.push(data);
}
function encodeArray(data, output) {
  output.push(...encodeLength(MAJOR_TYPE_ARRAY, data.length));
  for (const element of data) {
    encodePartialCBOR(element, output);
  }
}
function encodeMap(data, output) {
  output.push(new Uint8Array(encodeLength(MAJOR_TYPE_MAP, data.size)));
  for (const [key, value] of data.entries()) {
    encodePartialCBOR(key, output);
    encodePartialCBOR(value, output);
  }
}
function encodeTag(tag, output) {
  output.push(...encodeLength(MAJOR_TYPE_TAG, tag.tag));
  encodePartialCBOR(tag.value, output);
}
function encodePartialCBOR(data, output) {
  if (typeof data == "boolean" || data === null || data == void 0) {
    output.push(encodeSimple(data));
    return;
  }
  if (typeof data == "number" || typeof data == "bigint") {
    output.push(...encodeNumber(data));
    return;
  }
  if (typeof data == "string") {
    encodeString(data, output);
    return;
  }
  if (data instanceof Uint8Array) {
    encodeBytes(data, output);
    return;
  }
  if (Array.isArray(data)) {
    encodeArray(data, output);
    return;
  }
  if (data instanceof Map) {
    encodeMap(data, output);
    return;
  }
  if (data instanceof CBORTag) {
    encodeTag(data, output);
    return;
  }
  throw new Error("Not implemented");
}
function decodePartialCBOR(data, index) {
  if (data.byteLength === 0 || data.byteLength <= index || index < 0) {
    throw new Error("No data");
  }
  if (data instanceof Uint8Array) {
    return decodeNext(new DataView(data.buffer), index);
  } else if (data instanceof ArrayBuffer) {
    return decodeNext(new DataView(data), index);
  }
  return decodeNext(data, index);
}
function encodeCBOR(data) {
  const results = [];
  encodePartialCBOR(data, results);
  let length = 0;
  for (const result of results) {
    if (typeof result == "number") {
      length += 1;
    } else {
      length += result.length;
    }
  }
  const output = new Uint8Array(length);
  let index = 0;
  for (const result of results) {
    if (typeof result == "number") {
      output[index] = result;
      index += 1;
    } else {
      output.set(result, index);
      index += result.length;
    }
  }
  return output;
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCBOR.js
function decodeFirst(input) {
  const _input = new Uint8Array(input);
  const decoded = decodePartialCBOR(_input, 0);
  const [first] = decoded;
  return first;
}
function encode(input) {
  return encodeCBOR(input);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/index.js
var isoCrypto_exports = {};
__export(isoCrypto_exports, {
  digest: () => digest,
  getRandomValues: () => getRandomValues,
  verify: () => verify
});

// node_modules/@simplewebauthn/server/esm/helpers/cose.js
function isCOSEPublicKeyOKP(cosePublicKey) {
  const kty = cosePublicKey.get(COSEKEYS.kty);
  return isCOSEKty(kty) && kty === COSEKTY.OKP;
}
function isCOSEPublicKeyEC2(cosePublicKey) {
  const kty = cosePublicKey.get(COSEKEYS.kty);
  return isCOSEKty(kty) && kty === COSEKTY.EC2;
}
function isCOSEPublicKeyRSA(cosePublicKey) {
  const kty = cosePublicKey.get(COSEKEYS.kty);
  return isCOSEKty(kty) && kty === COSEKTY.RSA;
}
function isCOSEPublicKeyAKP(cosePublicKey) {
  const kty = cosePublicKey.get(COSEKEYS.kty);
  return isCOSEKty(kty) && kty === COSEKTY.AKP;
}
var COSEKEYS;
(function(COSEKEYS2) {
  COSEKEYS2[COSEKEYS2["kty"] = 1] = "kty";
  COSEKEYS2[COSEKEYS2["alg"] = 3] = "alg";
  COSEKEYS2[COSEKEYS2["crv"] = -1] = "crv";
  COSEKEYS2[COSEKEYS2["x"] = -2] = "x";
  COSEKEYS2[COSEKEYS2["y"] = -3] = "y";
  COSEKEYS2[COSEKEYS2["n"] = -1] = "n";
  COSEKEYS2[COSEKEYS2["e"] = -2] = "e";
  COSEKEYS2[COSEKEYS2["pub"] = -1] = "pub";
})(COSEKEYS || (COSEKEYS = {}));
var COSEKTY;
(function(COSEKTY2) {
  COSEKTY2[COSEKTY2["OKP"] = 1] = "OKP";
  COSEKTY2[COSEKTY2["EC2"] = 2] = "EC2";
  COSEKTY2[COSEKTY2["RSA"] = 3] = "RSA";
  COSEKTY2[COSEKTY2["AKP"] = 7] = "AKP";
})(COSEKTY || (COSEKTY = {}));
function isCOSEKty(kty) {
  return Object.values(COSEKTY).indexOf(kty) >= 0;
}
var COSECRV;
(function(COSECRV2) {
  COSECRV2[COSECRV2["P256"] = 1] = "P256";
  COSECRV2[COSECRV2["P384"] = 2] = "P384";
  COSECRV2[COSECRV2["P521"] = 3] = "P521";
  COSECRV2[COSECRV2["ED25519"] = 6] = "ED25519";
  COSECRV2[COSECRV2["SECP256K1"] = 8] = "SECP256K1";
})(COSECRV || (COSECRV = {}));
function isCOSECrv(crv) {
  return Object.values(COSECRV).indexOf(crv) >= 0;
}
var COSEALG;
(function(COSEALG2) {
  COSEALG2[COSEALG2["ES256"] = -7] = "ES256";
  COSEALG2[COSEALG2["EdDSA"] = -8] = "EdDSA";
  COSEALG2[COSEALG2["ES384"] = -35] = "ES384";
  COSEALG2[COSEALG2["ES512"] = -36] = "ES512";
  COSEALG2[COSEALG2["PS256"] = -37] = "PS256";
  COSEALG2[COSEALG2["PS384"] = -38] = "PS384";
  COSEALG2[COSEALG2["PS512"] = -39] = "PS512";
  COSEALG2[COSEALG2["ES256K"] = -47] = "ES256K";
  COSEALG2[COSEALG2["ML_DSA_44"] = -48] = "ML_DSA_44";
  COSEALG2[COSEALG2["ML_DSA_65"] = -49] = "ML_DSA_65";
  COSEALG2[COSEALG2["ML_DSA_87"] = -50] = "ML_DSA_87";
  COSEALG2[COSEALG2["RS256"] = -257] = "RS256";
  COSEALG2[COSEALG2["RS384"] = -258] = "RS384";
  COSEALG2[COSEALG2["RS512"] = -259] = "RS512";
  COSEALG2[COSEALG2["RS1"] = -65535] = "RS1";
})(COSEALG || (COSEALG = {}));
function isCOSEAlg(alg) {
  return Object.values(COSEALG).indexOf(alg) >= 0;
}
function isPQCCOSEAlg(alg) {
  return [COSEALG.ML_DSA_44, COSEALG.ML_DSA_65, COSEALG.ML_DSA_87].indexOf(alg) >= 0;
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/mapCoseAlgToWebCryptoHashAlgName.js
function mapCoseAlgToWebCryptoHashAlgName(alg) {
  if ([COSEALG.RS1].indexOf(alg) >= 0) {
    return "SHA-1";
  } else if ([COSEALG.ES256, COSEALG.PS256, COSEALG.RS256].indexOf(alg) >= 0) {
    return "SHA-256";
  } else if ([COSEALG.ES384, COSEALG.PS384, COSEALG.RS384].indexOf(alg) >= 0) {
    return "SHA-384";
  } else if ([COSEALG.ES512, COSEALG.PS512, COSEALG.RS512, COSEALG.EdDSA].indexOf(alg) >= 0) {
    return "SHA-512";
  }
  throw new Error(`Could not map COSE alg value of ${alg} to a WebCrypto hash alg name`);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/getWebCrypto.js
var webCrypto = void 0;
function getWebCrypto() {
  const toResolve = new Promise((resolve, reject) => {
    if (webCrypto) {
      return resolve(webCrypto);
    }
    const _globalThisCrypto = _getWebCryptoInternals.stubThisGlobalThisCrypto();
    if (_globalThisCrypto) {
      webCrypto = _globalThisCrypto;
      return resolve(webCrypto);
    }
    return reject(new MissingWebCrypto());
  });
  return toResolve;
}
var MissingWebCrypto = class extends Error {
  constructor() {
    const message = "An instance of the Crypto API could not be located";
    super(message);
    this.name = "MissingWebCrypto";
  }
};
var _getWebCryptoInternals = {
  stubThisGlobalThisCrypto: () => globalThis.crypto,
  // Make it possible to reset the `webCrypto` at the top of the file
  setCachedCrypto: (newCrypto) => {
    webCrypto = newCrypto;
  }
};

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/digest.js
async function digest(data, algorithm) {
  const WebCrypto = await getWebCrypto();
  const subtleAlgorithm = mapCoseAlgToWebCryptoHashAlgName(algorithm);
  const hashed = await WebCrypto.subtle.digest(subtleAlgorithm, data);
  return new Uint8Array(hashed);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/getRandomValues.js
async function getRandomValues(array) {
  const WebCrypto = await getWebCrypto();
  WebCrypto.getRandomValues(array);
  return array;
}

// node_modules/@simplewebauthn/server/esm/helpers/convertAAGUIDToString.js
function convertAAGUIDToString(aaguid) {
  const hex2 = isoUint8Array_exports.toHex(aaguid);
  const segments = [
    hex2.slice(0, 8),
    // 8
    hex2.slice(8, 12),
    // 4
    hex2.slice(12, 16),
    // 4
    hex2.slice(16, 20),
    // 4
    hex2.slice(20, 32)
    // 8
  ];
  return segments.join("-");
}

// node_modules/@simplewebauthn/server/esm/helpers/convertCOSEtoPKCS.js
function convertCOSEtoPKCS(cosePublicKey) {
  const struct = isoCBOR_exports.decodeFirst(cosePublicKey);
  const tag = Uint8Array.from([4]);
  const x = struct.get(COSEKEYS.x);
  const y = struct.get(COSEKEYS.y);
  if (!x) {
    throw new Error("COSE public key was missing x");
  }
  if (y) {
    return isoUint8Array_exports.concat([tag, x, y]);
  }
  return isoUint8Array_exports.concat([tag, x]);
}

// node_modules/@simplewebauthn/server/esm/helpers/decodeAttestationObject.js
function decodeAttestationObject(attestationObject) {
  return _decodeAttestationObjectInternals.stubThis(isoCBOR_exports.decodeFirst(attestationObject));
}
var _decodeAttestationObjectInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/server/esm/helpers/decodeClientDataJSON.js
function decodeClientDataJSON(data) {
  const toString = isoBase64URL_exports.toUTF8String(data);
  const clientData = JSON.parse(toString);
  return _decodeClientDataJSONInternals.stubThis(clientData);
}
var _decodeClientDataJSONInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/server/esm/helpers/decodeCredentialPublicKey.js
function decodeCredentialPublicKey(publicKey) {
  return _decodeCredentialPublicKeyInternals.stubThis(isoCBOR_exports.decodeFirst(publicKey));
}
var _decodeCredentialPublicKeyInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/server/esm/helpers/generateChallenge.js
async function generateChallenge() {
  const challenge = new Uint8Array(32);
  await isoCrypto_exports.getRandomValues(challenge);
  return _generateChallengeInternals.stubThis(challenge);
}
var _generateChallengeInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/server/esm/helpers/generateUserID.js
async function generateUserID() {
  const newUserID = new Uint8Array(32);
  await isoCrypto_exports.getRandomValues(newUserID);
  return _generateUserIDInternals.stubThis(newUserID);
}
var _generateUserIDInternals = {
  stubThis: (value) => value
};

// node_modules/asn1js/build/index.es.js
var index_es_exports = {};
__export(index_es_exports, {
  Any: () => Any,
  BaseBlock: () => BaseBlock,
  BaseStringBlock: () => BaseStringBlock,
  BitString: () => BitString,
  BmpString: () => BmpString,
  Boolean: () => Boolean2,
  CharacterString: () => CharacterString,
  Choice: () => Choice,
  Constructed: () => Constructed,
  DATE: () => DATE,
  DEFAULT_MAX_CONTENT_LENGTH: () => DEFAULT_MAX_CONTENT_LENGTH,
  DEFAULT_MAX_DEPTH: () => DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_NODES: () => DEFAULT_MAX_NODES,
  DateTime: () => DateTime,
  Duration: () => Duration,
  EndOfContent: () => EndOfContent,
  Enumerated: () => Enumerated,
  GeneralString: () => GeneralString,
  GeneralizedTime: () => GeneralizedTime,
  GraphicString: () => GraphicString,
  HexBlock: () => HexBlock,
  IA5String: () => IA5String,
  Integer: () => Integer,
  Null: () => Null,
  NumericString: () => NumericString,
  ObjectIdentifier: () => ObjectIdentifier,
  OctetString: () => OctetString,
  Primitive: () => Primitive,
  PrintableString: () => PrintableString,
  RawData: () => RawData,
  RelativeObjectIdentifier: () => RelativeObjectIdentifier,
  Repeated: () => Repeated,
  Sequence: () => Sequence,
  Set: () => Set2,
  TIME: () => TIME,
  TeletexString: () => TeletexString,
  TimeOfDay: () => TimeOfDay,
  UTCTime: () => UTCTime,
  UniversalString: () => UniversalString,
  Utf8String: () => Utf8String,
  ValueBlock: () => ValueBlock,
  VideotexString: () => VideotexString,
  ViewWriter: () => ViewWriter,
  VisibleString: () => VisibleString,
  compareSchema: () => compareSchema,
  fromBER: () => fromBER,
  verifySchema: () => verifySchema
});
var pvtsutils = __toESM(require_build());

// node_modules/pvutils/build/utils.es.js
function utilFromBase(inputBuffer, inputBase) {
  let result = 0;
  if (inputBuffer.length === 1) {
    return inputBuffer[0];
  }
  for (let i = inputBuffer.length - 1; i >= 0; i--) {
    result += inputBuffer[inputBuffer.length - 1 - i] * Math.pow(2, inputBase * i);
  }
  return result;
}
function utilToBase(value, base, reserved = -1) {
  const internalReserved = reserved;
  let internalValue = value;
  let result = 0;
  let biggest = Math.pow(2, base);
  for (let i = 1; i < 8; i++) {
    if (value < biggest) {
      let retBuf;
      if (internalReserved < 0) {
        retBuf = new ArrayBuffer(i);
        result = i;
      } else {
        if (internalReserved < i) {
          return new ArrayBuffer(0);
        }
        retBuf = new ArrayBuffer(internalReserved);
        result = internalReserved;
      }
      const retView = new Uint8Array(retBuf);
      for (let j = i - 1; j >= 0; j--) {
        const basis = Math.pow(2, j * base);
        retView[result - j - 1] = Math.floor(internalValue / basis);
        internalValue -= retView[result - j - 1] * basis;
      }
      return retBuf;
    }
    biggest *= Math.pow(2, base);
  }
  return new ArrayBuffer(0);
}
function utilConcatView(...views) {
  let outputLength = 0;
  let prevLength = 0;
  for (const view of views) {
    outputLength += view.length;
  }
  const retBuf = new ArrayBuffer(outputLength);
  const retView = new Uint8Array(retBuf);
  for (const view of views) {
    retView.set(view, prevLength);
    prevLength += view.length;
  }
  return retView;
}
function utilDecodeTC() {
  const buf = new Uint8Array(this.valueHex);
  if (this.valueHex.byteLength >= 2) {
    const condition1 = buf[0] === 255 && buf[1] & 128;
    const condition2 = buf[0] === 0 && (buf[1] & 128) === 0;
    if (condition1 || condition2) {
      this.warnings.push("Needlessly long format");
    }
  }
  const bigIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
  const bigIntView = new Uint8Array(bigIntBuffer);
  for (let i = 0; i < this.valueHex.byteLength; i++) {
    bigIntView[i] = 0;
  }
  bigIntView[0] = buf[0] & 128;
  const bigInt = utilFromBase(bigIntView, 8);
  const smallIntBuffer = new ArrayBuffer(this.valueHex.byteLength);
  const smallIntView = new Uint8Array(smallIntBuffer);
  for (let j = 0; j < this.valueHex.byteLength; j++) {
    smallIntView[j] = buf[j];
  }
  smallIntView[0] &= 127;
  const smallInt = utilFromBase(smallIntView, 8);
  return smallInt - bigInt;
}
function utilEncodeTC(value) {
  const modValue = value < 0 ? value * -1 : value;
  let bigInt = 128;
  for (let i = 1; i < 8; i++) {
    if (modValue <= bigInt) {
      if (value < 0) {
        const smallInt = bigInt - modValue;
        const retBuf2 = utilToBase(smallInt, 8, i);
        const retView2 = new Uint8Array(retBuf2);
        retView2[0] |= 128;
        return retBuf2;
      }
      let retBuf = utilToBase(modValue, 8, i);
      let retView = new Uint8Array(retBuf);
      if (retView[0] & 128) {
        const tempBuf = retBuf.slice(0);
        const tempView = new Uint8Array(tempBuf);
        retBuf = new ArrayBuffer(retBuf.byteLength + 1);
        retView = new Uint8Array(retBuf);
        for (let k = 0; k < tempBuf.byteLength; k++) {
          retView[k + 1] = tempView[k];
        }
        retView[0] = 0;
      }
      return retBuf;
    }
    bigInt *= Math.pow(2, 8);
  }
  return new ArrayBuffer(0);
}
function isEqualBuffer(inputBuffer1, inputBuffer2) {
  if (inputBuffer1.byteLength !== inputBuffer2.byteLength) {
    return false;
  }
  const view1 = new Uint8Array(inputBuffer1);
  const view2 = new Uint8Array(inputBuffer2);
  for (let i = 0; i < view1.length; i++) {
    if (view1[i] !== view2[i]) {
      return false;
    }
  }
  return true;
}
function padNumber(inputNumber, fullLength) {
  const str = inputNumber.toString(10);
  if (fullLength < str.length) {
    return "";
  }
  const dif = fullLength - str.length;
  const padding = Array.from({ length: dif });
  for (let i = 0; i < dif; i++) {
    padding[i] = "0";
  }
  const paddingString = padding.join("");
  return paddingString.concat(str);
}
var log2 = Math.log(2);

// node_modules/asn1js/build/index.es.js
function assertBigInt() {
  if (typeof BigInt === "undefined") {
    throw new Error("BigInt is not defined. Your environment doesn't implement BigInt.");
  }
}
function concat(buffers) {
  let outputLength = 0;
  let prevLength = 0;
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    outputLength += buffer.byteLength;
  }
  const retView = new Uint8Array(outputLength);
  for (let i = 0; i < buffers.length; i++) {
    const buffer = buffers[i];
    retView.set(new Uint8Array(buffer), prevLength);
    prevLength += buffer.byteLength;
  }
  return retView.buffer;
}
function checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength) {
  if (!(inputBuffer instanceof Uint8Array)) {
    baseBlock.error = "Wrong parameter: inputBuffer must be 'Uint8Array'";
    return false;
  }
  if (!inputBuffer.byteLength) {
    baseBlock.error = "Wrong parameter: inputBuffer has zero length";
    return false;
  }
  if (inputOffset < 0) {
    baseBlock.error = "Wrong parameter: inputOffset less than zero";
    return false;
  }
  if (inputLength < 0) {
    baseBlock.error = "Wrong parameter: inputLength less than zero";
    return false;
  }
  if (inputBuffer.byteLength - inputOffset - inputLength < 0) {
    baseBlock.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
    return false;
  }
  return true;
}
var ViewWriter = class {
  constructor() {
    this.items = [];
  }
  write(buf) {
    this.items.push(buf);
  }
  final() {
    return concat(this.items);
  }
};
var powers2 = [new Uint8Array([1])];
var digitsString = "0123456789";
var NAME = "name";
var VALUE_HEX_VIEW = "valueHexView";
var IS_HEX_ONLY = "isHexOnly";
var ID_BLOCK = "idBlock";
var TAG_CLASS = "tagClass";
var TAG_NUMBER = "tagNumber";
var IS_CONSTRUCTED = "isConstructed";
var FROM_BER = "fromBER";
var TO_BER = "toBER";
var LOCAL = "local";
var EMPTY_STRING = "";
var EMPTY_BUFFER = new ArrayBuffer(0);
var EMPTY_VIEW = new Uint8Array(0);
var END_OF_CONTENT_NAME = "EndOfContent";
var OCTET_STRING_NAME = "OCTET STRING";
var BIT_STRING_NAME = "BIT STRING";
function HexBlock(BaseClass) {
  var _a3;
  return _a3 = class Some extends BaseClass {
    get valueHex() {
      return this.valueHexView.slice().buffer;
    }
    set valueHex(value) {
      this.valueHexView = new Uint8Array(value);
    }
    constructor(...args) {
      var _b;
      super(...args);
      const params = args[0] || {};
      this.isHexOnly = (_b = params.isHexOnly) !== null && _b !== void 0 ? _b : false;
      this.valueHexView = params.valueHex ? pvtsutils.BufferSourceConverter.toUint8Array(params.valueHex) : EMPTY_VIEW;
    }
    fromBER(inputBuffer, inputOffset, inputLength, _context) {
      const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
      if (!checkBufferParams(this, view, inputOffset, inputLength)) {
        return -1;
      }
      const endLength = inputOffset + inputLength;
      this.valueHexView = view.subarray(inputOffset, endLength);
      if (!this.valueHexView.length) {
        this.warnings.push("Zero buffer length");
        return inputOffset;
      }
      this.blockLength = inputLength;
      return endLength;
    }
    toBER(sizeOnly = false) {
      if (!this.isHexOnly) {
        this.error = "Flag 'isHexOnly' is not set, abort";
        return EMPTY_BUFFER;
      }
      if (sizeOnly) {
        return new ArrayBuffer(this.valueHexView.byteLength);
      }
      return this.valueHexView.byteLength === this.valueHexView.buffer.byteLength ? this.valueHexView.buffer : this.valueHexView.slice().buffer;
    }
    toJSON() {
      return {
        ...super.toJSON(),
        isHexOnly: this.isHexOnly,
        valueHex: pvtsutils.Convert.ToHex(this.valueHexView)
      };
    }
  }, _a3.NAME = "hexBlock", _a3;
}
var LocalBaseBlock = class {
  static blockName() {
    return this.NAME;
  }
  get valueBeforeDecode() {
    return this.valueBeforeDecodeView.slice().buffer;
  }
  set valueBeforeDecode(value) {
    this.valueBeforeDecodeView = new Uint8Array(value);
  }
  constructor({ blockLength = 0, error = EMPTY_STRING, warnings = [], valueBeforeDecode = EMPTY_VIEW } = {}) {
    this.blockLength = blockLength;
    this.error = error;
    this.warnings = warnings;
    this.valueBeforeDecodeView = pvtsutils.BufferSourceConverter.toUint8Array(valueBeforeDecode);
  }
  toJSON() {
    return {
      blockName: this.constructor.NAME,
      blockLength: this.blockLength,
      error: this.error,
      warnings: this.warnings,
      valueBeforeDecode: pvtsutils.Convert.ToHex(this.valueBeforeDecodeView)
    };
  }
};
LocalBaseBlock.NAME = "baseBlock";
var ValueBlock = class extends LocalBaseBlock {
  fromBER(_inputBuffer, _inputOffset, _inputLength, _context) {
    throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
  }
  toBER(_sizeOnly, _writer) {
    throw TypeError("User need to make a specific function in a class which extends 'ValueBlock'");
  }
};
ValueBlock.NAME = "valueBlock";
var LocalIdentificationBlock = class extends HexBlock(LocalBaseBlock) {
  constructor({ idBlock = {} } = {}) {
    var _a3, _b, _c, _d;
    super();
    if (idBlock) {
      this.isHexOnly = (_a3 = idBlock.isHexOnly) !== null && _a3 !== void 0 ? _a3 : false;
      this.valueHexView = idBlock.valueHex ? pvtsutils.BufferSourceConverter.toUint8Array(idBlock.valueHex) : EMPTY_VIEW;
      this.tagClass = (_b = idBlock.tagClass) !== null && _b !== void 0 ? _b : -1;
      this.tagNumber = (_c = idBlock.tagNumber) !== null && _c !== void 0 ? _c : -1;
      this.isConstructed = (_d = idBlock.isConstructed) !== null && _d !== void 0 ? _d : false;
    } else {
      this.tagClass = -1;
      this.tagNumber = -1;
      this.isConstructed = false;
    }
  }
  toBER(sizeOnly = false) {
    let firstOctet = 0;
    switch (this.tagClass) {
      case 1:
        firstOctet |= 0;
        break;
      case 2:
        firstOctet |= 64;
        break;
      case 3:
        firstOctet |= 128;
        break;
      case 4:
        firstOctet |= 192;
        break;
      default:
        this.error = "Unknown tag class";
        return EMPTY_BUFFER;
    }
    if (this.isConstructed)
      firstOctet |= 32;
    if (this.tagNumber < 31 && !this.isHexOnly) {
      const retView2 = new Uint8Array(1);
      if (!sizeOnly) {
        let number = this.tagNumber;
        number &= 31;
        firstOctet |= number;
        retView2[0] = firstOctet;
      }
      return retView2.buffer;
    }
    if (!this.isHexOnly) {
      const encodedBuf = utilToBase(this.tagNumber, 7);
      const encodedView = new Uint8Array(encodedBuf);
      const size = encodedBuf.byteLength;
      const retView2 = new Uint8Array(size + 1);
      retView2[0] = firstOctet | 31;
      if (!sizeOnly) {
        for (let i = 0; i < size - 1; i++)
          retView2[i + 1] = encodedView[i] | 128;
        retView2[size] = encodedView[size - 1];
      }
      return retView2.buffer;
    }
    const retView = new Uint8Array(this.valueHexView.byteLength + 1);
    retView[0] = firstOctet | 31;
    if (!sizeOnly) {
      const curView = this.valueHexView;
      for (let i = 0; i < curView.length - 1; i++)
        retView[i + 1] = curView[i] | 128;
      retView[this.valueHexView.byteLength] = curView[curView.length - 1];
    }
    return retView.buffer;
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }
    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
    if (intBuffer.length === 0) {
      this.error = "Zero buffer length";
      return -1;
    }
    const tagClassMask = intBuffer[0] & 192;
    switch (tagClassMask) {
      case 0:
        this.tagClass = 1;
        break;
      case 64:
        this.tagClass = 2;
        break;
      case 128:
        this.tagClass = 3;
        break;
      case 192:
        this.tagClass = 4;
        break;
      default:
        this.error = "Unknown tag class";
        return -1;
    }
    this.isConstructed = (intBuffer[0] & 32) === 32;
    this.isHexOnly = false;
    const tagNumberMask = intBuffer[0] & 31;
    if (tagNumberMask !== 31) {
      this.tagNumber = tagNumberMask;
      this.blockLength = 1;
    } else {
      let count = 0;
      while (true) {
        const tagByteIndex = count + 1;
        if (tagByteIndex >= intBuffer.length) {
          this.error = "End of input reached before message was fully decoded";
          return -1;
        }
        count++;
        if ((intBuffer[tagByteIndex] & 128) === 0)
          break;
      }
      this.blockLength = count + 1;
      const intTagNumberBuffer = this.valueHexView = new Uint8Array(count);
      for (let i = 0; i < count; i++)
        intTagNumberBuffer[i] = intBuffer[i + 1] & 127;
      if (this.blockLength <= 9)
        this.tagNumber = utilFromBase(intTagNumberBuffer, 7);
      else {
        this.isHexOnly = true;
        this.warnings.push("Tag too long, represented as hex-coded");
      }
    }
    if (this.tagClass === 1 && this.isConstructed) {
      switch (this.tagNumber) {
        case 1:
        case 2:
        case 5:
        case 6:
        case 9:
        case 13:
        case 14:
        case 23:
        case 24:
        case 31:
        case 32:
        case 33:
        case 34:
          this.error = "Constructed encoding used for primitive type";
          return -1;
      }
    }
    return inputOffset + this.blockLength;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      tagClass: this.tagClass,
      tagNumber: this.tagNumber,
      isConstructed: this.isConstructed
    };
  }
};
LocalIdentificationBlock.NAME = "identificationBlock";
var LocalLengthBlock = class extends LocalBaseBlock {
  constructor({ lenBlock = {} } = {}) {
    var _a3, _b, _c;
    super();
    this.isIndefiniteForm = (_a3 = lenBlock.isIndefiniteForm) !== null && _a3 !== void 0 ? _a3 : false;
    this.longFormUsed = (_b = lenBlock.longFormUsed) !== null && _b !== void 0 ? _b : false;
    this.length = (_c = lenBlock.length) !== null && _c !== void 0 ? _c : 0;
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    const view = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    if (!checkBufferParams(this, view, inputOffset, inputLength)) {
      return -1;
    }
    const intBuffer = view.subarray(inputOffset, inputOffset + inputLength);
    if (intBuffer.length === 0) {
      this.error = "Zero buffer length";
      return -1;
    }
    if (intBuffer[0] === 255) {
      this.error = "Length block 0xFF is reserved by standard";
      return -1;
    }
    this.isIndefiniteForm = intBuffer[0] === 128;
    if (this.isIndefiniteForm) {
      this.blockLength = 1;
      return inputOffset + this.blockLength;
    }
    this.longFormUsed = !!(intBuffer[0] & 128);
    if (this.longFormUsed === false) {
      this.length = intBuffer[0];
      this.blockLength = 1;
      return inputOffset + this.blockLength;
    }
    const count = intBuffer[0] & 127;
    if (count > 8) {
      this.error = "Too big integer";
      return -1;
    }
    if (count + 1 > intBuffer.length) {
      this.error = "End of input reached before message was fully decoded";
      return -1;
    }
    const lenOffset = inputOffset + 1;
    const lengthBufferView = view.subarray(lenOffset, lenOffset + count);
    if (lengthBufferView[count - 1] === 0)
      this.warnings.push("Needlessly long encoded length");
    this.length = utilFromBase(lengthBufferView, 8);
    if (this.longFormUsed && this.length <= 127)
      this.warnings.push("Unnecessary usage of long length form");
    this.blockLength = count + 1;
    return inputOffset + this.blockLength;
  }
  toBER(sizeOnly = false) {
    let retBuf;
    let retView;
    if (this.length > 127)
      this.longFormUsed = true;
    if (this.isIndefiniteForm) {
      retBuf = new ArrayBuffer(1);
      if (sizeOnly === false) {
        retView = new Uint8Array(retBuf);
        retView[0] = 128;
      }
      return retBuf;
    }
    if (this.longFormUsed) {
      const encodedBuf = utilToBase(this.length, 8);
      if (encodedBuf.byteLength > 127) {
        this.error = "Too big length";
        return EMPTY_BUFFER;
      }
      retBuf = new ArrayBuffer(encodedBuf.byteLength + 1);
      if (sizeOnly)
        return retBuf;
      const encodedView = new Uint8Array(encodedBuf);
      retView = new Uint8Array(retBuf);
      retView[0] = encodedBuf.byteLength | 128;
      for (let i = 0; i < encodedBuf.byteLength; i++)
        retView[i + 1] = encodedView[i];
      return retBuf;
    }
    retBuf = new ArrayBuffer(1);
    if (sizeOnly === false) {
      retView = new Uint8Array(retBuf);
      retView[0] = this.length;
    }
    return retBuf;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      isIndefiniteForm: this.isIndefiniteForm,
      longFormUsed: this.longFormUsed,
      length: this.length
    };
  }
};
LocalLengthBlock.NAME = "lengthBlock";
var typeStore = {};
var BaseBlock = class extends LocalBaseBlock {
  constructor({ name = EMPTY_STRING, optional = false, primitiveSchema, ...parameters } = {}, valueBlockType) {
    super(parameters);
    this.name = name;
    this.optional = optional;
    if (primitiveSchema) {
      this.primitiveSchema = primitiveSchema;
    }
    this.idBlock = new LocalIdentificationBlock(parameters);
    this.lenBlock = new LocalLengthBlock(parameters);
    this.valueBlock = valueBlockType ? new valueBlockType(parameters) : new ValueBlock(parameters);
  }
  fromBER(inputBuffer, inputOffset, inputLength, context) {
    const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length, context);
    if (resultOffset === -1) {
      this.error = this.valueBlock.error;
      return resultOffset;
    }
    if (!this.idBlock.error.length)
      this.blockLength += this.idBlock.blockLength;
    if (!this.lenBlock.error.length)
      this.blockLength += this.lenBlock.blockLength;
    if (!this.valueBlock.error.length)
      this.blockLength += this.valueBlock.blockLength;
    return resultOffset;
  }
  toBER(sizeOnly, writer) {
    const _writer = writer || new ViewWriter();
    if (!writer) {
      prepareIndefiniteForm(this);
    }
    const idBlockBuf = this.idBlock.toBER(sizeOnly);
    _writer.write(idBlockBuf);
    if (this.lenBlock.isIndefiniteForm) {
      _writer.write(new Uint8Array([128]).buffer);
      this.valueBlock.toBER(sizeOnly, _writer);
      _writer.write(new ArrayBuffer(2));
    } else {
      const valueBlockBuf = this.valueBlock.toBER(sizeOnly);
      this.lenBlock.length = valueBlockBuf.byteLength;
      const lenBlockBuf = this.lenBlock.toBER(sizeOnly);
      _writer.write(lenBlockBuf);
      _writer.write(valueBlockBuf);
    }
    if (!writer) {
      return _writer.final();
    }
    return EMPTY_BUFFER;
  }
  toJSON() {
    const object = {
      ...super.toJSON(),
      idBlock: this.idBlock.toJSON(),
      lenBlock: this.lenBlock.toJSON(),
      valueBlock: this.valueBlock.toJSON(),
      name: this.name,
      optional: this.optional
    };
    if (this.primitiveSchema)
      object.primitiveSchema = this.primitiveSchema.toJSON();
    return object;
  }
  toString(encoding = "ascii") {
    if (encoding === "ascii") {
      return this.onAsciiEncoding();
    }
    return pvtsutils.Convert.ToHex(this.toBER());
  }
  onAsciiEncoding() {
    const name = this.constructor.NAME;
    const value = pvtsutils.Convert.ToHex(this.valueBlock.valueBeforeDecodeView);
    return `${name} : ${value}`;
  }
  isEqual(other) {
    if (this === other) {
      return true;
    }
    if (!(other instanceof this.constructor)) {
      return false;
    }
    const thisRaw = this.toBER();
    const otherRaw = other.toBER();
    return isEqualBuffer(thisRaw, otherRaw);
  }
};
BaseBlock.NAME = "BaseBlock";
function prepareIndefiniteForm(baseBlock) {
  var _a3;
  if (baseBlock instanceof typeStore.Constructed) {
    for (const value of baseBlock.valueBlock.value) {
      if (prepareIndefiniteForm(value)) {
        baseBlock.lenBlock.isIndefiniteForm = true;
      }
    }
  }
  return !!((_a3 = baseBlock.lenBlock) === null || _a3 === void 0 ? void 0 : _a3.isIndefiniteForm);
}
var BaseStringBlock = class extends BaseBlock {
  getValue() {
    return this.valueBlock.value;
  }
  setValue(value) {
    this.valueBlock.value = value;
  }
  constructor({ value = EMPTY_STRING, ...parameters } = {}, stringValueBlockType) {
    super(parameters, stringValueBlockType);
    if (value) {
      this.fromString(value);
    }
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length);
    if (resultOffset === -1) {
      this.error = this.valueBlock.error;
      return resultOffset;
    }
    this.fromBuffer(this.valueBlock.valueHexView);
    if (!this.idBlock.error.length)
      this.blockLength += this.idBlock.blockLength;
    if (!this.lenBlock.error.length)
      this.blockLength += this.lenBlock.blockLength;
    if (!this.valueBlock.error.length)
      this.blockLength += this.valueBlock.blockLength;
    return resultOffset;
  }
  onAsciiEncoding() {
    return `${this.constructor.NAME} : '${this.valueBlock.value}'`;
  }
};
BaseStringBlock.NAME = "BaseStringBlock";
var LocalPrimitiveValueBlock = class extends HexBlock(ValueBlock) {
  constructor({ isHexOnly = true, ...parameters } = {}) {
    super(parameters);
    this.isHexOnly = isHexOnly;
  }
};
LocalPrimitiveValueBlock.NAME = "PrimitiveValueBlock";
var _a$w;
var Primitive = class extends BaseBlock {
  constructor(parameters = {}) {
    super(parameters, LocalPrimitiveValueBlock);
    this.idBlock.isConstructed = false;
  }
};
_a$w = Primitive;
(() => {
  typeStore.Primitive = _a$w;
})();
Primitive.NAME = "PRIMITIVE";
var DEFAULT_MAX_DEPTH = 100;
var DEFAULT_MAX_NODES = 1e4;
var DEFAULT_MAX_CONTENT_LENGTH = 16 * 1024 * 1024;
var MAX_DEPTH_EXCEEDED_ERROR = "Maximum ASN.1 nesting depth exceeded";
var MAX_NODES_EXCEEDED_ERROR = "Maximum ASN.1 node count exceeded";
var MAX_CONTENT_LENGTH_EXCEEDED_ERROR = "Maximum ASN.1 content length exceeded";
function createFromBerContext(options = {}) {
  var _a3, _b, _c;
  return {
    depth: 0,
    maxDepth: (_a3 = options.maxDepth) !== null && _a3 !== void 0 ? _a3 : DEFAULT_MAX_DEPTH,
    nodesCount: 0,
    maxNodes: (_b = options.maxNodes) !== null && _b !== void 0 ? _b : DEFAULT_MAX_NODES,
    maxContentLength: (_c = options.maxContentLength) !== null && _c !== void 0 ? _c : DEFAULT_MAX_CONTENT_LENGTH
  };
}
function createErrorResult(error) {
  const result = new BaseBlock({}, ValueBlock);
  result.error = error;
  return {
    offset: -1,
    result
  };
}
function checkNodesLimit(context) {
  context.nodesCount += 1;
  if (context.nodesCount > context.maxNodes) {
    return MAX_NODES_EXCEEDED_ERROR;
  }
  return void 0;
}
function checkContentLengthLimit(inputLength, context) {
  if (inputLength > context.maxContentLength) {
    return MAX_CONTENT_LENGTH_EXCEEDED_ERROR;
  }
  return void 0;
}
function localFromBERWithChildContext(inputBuffer, inputOffset, inputLength, context) {
  const childDepth = context.depth + 1;
  if (childDepth > context.maxDepth) {
    return createErrorResult(MAX_DEPTH_EXCEEDED_ERROR);
  }
  context.depth = childDepth;
  try {
    return localFromBER(inputBuffer, inputOffset, inputLength, context);
  } finally {
    context.depth -= 1;
  }
}
function localChangeType(inputObject, newType) {
  if (inputObject instanceof newType) {
    return inputObject;
  }
  const newObject = new newType();
  newObject.idBlock = inputObject.idBlock;
  newObject.lenBlock = inputObject.lenBlock;
  newObject.warnings = inputObject.warnings;
  newObject.valueBeforeDecodeView = inputObject.valueBeforeDecodeView;
  return newObject;
}
function localFromBER(inputBuffer, inputOffset = 0, inputLength = inputBuffer.length, context = createFromBerContext()) {
  const incomingOffset = inputOffset;
  let returnObject = new BaseBlock({}, ValueBlock);
  const baseBlock = new LocalBaseBlock();
  if (!checkBufferParams(baseBlock, inputBuffer, inputOffset, inputLength)) {
    returnObject.error = baseBlock.error;
    return {
      offset: -1,
      result: returnObject
    };
  }
  const intBuffer = inputBuffer.subarray(inputOffset, inputOffset + inputLength);
  if (!intBuffer.length) {
    returnObject.error = "Zero buffer length";
    return {
      offset: -1,
      result: returnObject
    };
  }
  const nodesLimitError = checkNodesLimit(context);
  if (nodesLimitError) {
    returnObject.error = nodesLimitError;
    return {
      offset: -1,
      result: returnObject
    };
  }
  let resultOffset = returnObject.idBlock.fromBER(inputBuffer, inputOffset, inputLength);
  if (returnObject.idBlock.warnings.length) {
    returnObject.warnings.concat(returnObject.idBlock.warnings);
  }
  if (resultOffset === -1) {
    returnObject.error = returnObject.idBlock.error;
    return {
      offset: -1,
      result: returnObject
    };
  }
  inputOffset = resultOffset;
  inputLength -= returnObject.idBlock.blockLength;
  resultOffset = returnObject.lenBlock.fromBER(inputBuffer, inputOffset, inputLength);
  if (returnObject.lenBlock.warnings.length) {
    returnObject.warnings.concat(returnObject.lenBlock.warnings);
  }
  if (resultOffset === -1) {
    returnObject.error = returnObject.lenBlock.error;
    return {
      offset: -1,
      result: returnObject
    };
  }
  inputOffset = resultOffset;
  inputLength -= returnObject.lenBlock.blockLength;
  const valueLength = returnObject.lenBlock.isIndefiniteForm ? inputLength : returnObject.lenBlock.length;
  const contentLengthError = checkContentLengthLimit(valueLength, context);
  if (contentLengthError) {
    returnObject.error = contentLengthError;
    return {
      offset: -1,
      result: returnObject
    };
  }
  if (!returnObject.idBlock.isConstructed && returnObject.lenBlock.isIndefiniteForm) {
    returnObject.error = "Indefinite length form used for primitive encoding form";
    return {
      offset: -1,
      result: returnObject
    };
  }
  let newASN1Type = BaseBlock;
  switch (returnObject.idBlock.tagClass) {
    case 1:
      if (returnObject.idBlock.tagNumber >= 37 && returnObject.idBlock.isHexOnly === false) {
        returnObject.error = "UNIVERSAL 37 and upper tags are reserved by ASN.1 standard";
        return {
          offset: -1,
          result: returnObject
        };
      }
      switch (returnObject.idBlock.tagNumber) {
        case 0:
          if (returnObject.idBlock.isConstructed && returnObject.lenBlock.length > 0) {
            returnObject.error = "Type [UNIVERSAL 0] is reserved";
            return {
              offset: -1,
              result: returnObject
            };
          }
          newASN1Type = typeStore.EndOfContent;
          break;
        case 1:
          newASN1Type = typeStore.Boolean;
          break;
        case 2:
          newASN1Type = typeStore.Integer;
          break;
        case 3:
          newASN1Type = typeStore.BitString;
          break;
        case 4:
          newASN1Type = typeStore.OctetString;
          break;
        case 5:
          newASN1Type = typeStore.Null;
          break;
        case 6:
          newASN1Type = typeStore.ObjectIdentifier;
          break;
        case 10:
          newASN1Type = typeStore.Enumerated;
          break;
        case 12:
          newASN1Type = typeStore.Utf8String;
          break;
        case 13:
          newASN1Type = typeStore.RelativeObjectIdentifier;
          break;
        case 14:
          newASN1Type = typeStore.TIME;
          break;
        case 15:
          returnObject.error = "[UNIVERSAL 15] is reserved by ASN.1 standard";
          return {
            offset: -1,
            result: returnObject
          };
        case 16:
          newASN1Type = typeStore.Sequence;
          break;
        case 17:
          newASN1Type = typeStore.Set;
          break;
        case 18:
          newASN1Type = typeStore.NumericString;
          break;
        case 19:
          newASN1Type = typeStore.PrintableString;
          break;
        case 20:
          newASN1Type = typeStore.TeletexString;
          break;
        case 21:
          newASN1Type = typeStore.VideotexString;
          break;
        case 22:
          newASN1Type = typeStore.IA5String;
          break;
        case 23:
          newASN1Type = typeStore.UTCTime;
          break;
        case 24:
          newASN1Type = typeStore.GeneralizedTime;
          break;
        case 25:
          newASN1Type = typeStore.GraphicString;
          break;
        case 26:
          newASN1Type = typeStore.VisibleString;
          break;
        case 27:
          newASN1Type = typeStore.GeneralString;
          break;
        case 28:
          newASN1Type = typeStore.UniversalString;
          break;
        case 29:
          newASN1Type = typeStore.CharacterString;
          break;
        case 30:
          newASN1Type = typeStore.BmpString;
          break;
        case 31:
          newASN1Type = typeStore.DATE;
          break;
        case 32:
          newASN1Type = typeStore.TimeOfDay;
          break;
        case 33:
          newASN1Type = typeStore.DateTime;
          break;
        case 34:
          newASN1Type = typeStore.Duration;
          break;
        default: {
          const newObject = returnObject.idBlock.isConstructed ? new typeStore.Constructed() : new typeStore.Primitive();
          newObject.idBlock = returnObject.idBlock;
          newObject.lenBlock = returnObject.lenBlock;
          newObject.warnings = returnObject.warnings;
          returnObject = newObject;
        }
      }
      break;
    case 2:
    case 3:
    case 4:
    default: {
      newASN1Type = returnObject.idBlock.isConstructed ? typeStore.Constructed : typeStore.Primitive;
    }
  }
  returnObject = localChangeType(returnObject, newASN1Type);
  resultOffset = returnObject.fromBER(inputBuffer, inputOffset, valueLength, context);
  returnObject.valueBeforeDecodeView = inputBuffer.subarray(incomingOffset, incomingOffset + returnObject.blockLength);
  return {
    offset: resultOffset,
    result: returnObject
  };
}
function fromBER(inputBuffer, options = {}) {
  if (!inputBuffer.byteLength) {
    const result = new BaseBlock({}, ValueBlock);
    result.error = "Input buffer has zero length";
    return {
      offset: -1,
      result
    };
  }
  return localFromBER(pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer).slice(), 0, inputBuffer.byteLength, createFromBerContext(options));
}
function checkLen(indefiniteLength, length) {
  if (indefiniteLength) {
    return 1;
  }
  return length;
}
var LocalConstructedValueBlock = class extends ValueBlock {
  constructor({ value = [], isIndefiniteForm = false, ...parameters } = {}) {
    super(parameters);
    this.value = value;
    this.isIndefiniteForm = isIndefiniteForm;
  }
  fromBER(inputBuffer, inputOffset, inputLength, context) {
    const view = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    const parseContext = context !== null && context !== void 0 ? context : createFromBerContext();
    if (!checkBufferParams(this, view, inputOffset, inputLength)) {
      return -1;
    }
    this.valueBeforeDecodeView = view.subarray(inputOffset, inputOffset + inputLength);
    if (this.valueBeforeDecodeView.length === 0) {
      this.warnings.push("Zero buffer length");
      return inputOffset;
    }
    let currentOffset = inputOffset;
    while (checkLen(this.isIndefiniteForm, inputLength) > 0) {
      const returnObject = localFromBERWithChildContext(view, currentOffset, inputLength, parseContext);
      if (returnObject.offset === -1) {
        this.error = returnObject.result.error;
        this.warnings.concat(returnObject.result.warnings);
        return -1;
      }
      currentOffset = returnObject.offset;
      this.blockLength += returnObject.result.blockLength;
      inputLength -= returnObject.result.blockLength;
      this.value.push(returnObject.result);
      if (this.isIndefiniteForm && returnObject.result.constructor.NAME === END_OF_CONTENT_NAME) {
        break;
      }
    }
    if (this.isIndefiniteForm) {
      if (this.value[this.value.length - 1].constructor.NAME === END_OF_CONTENT_NAME) {
        this.value.pop();
      } else {
        this.warnings.push("No EndOfContent block encoded");
      }
    }
    return currentOffset;
  }
  toBER(sizeOnly, writer) {
    const _writer = writer || new ViewWriter();
    for (let i = 0; i < this.value.length; i++) {
      this.value[i].toBER(sizeOnly, _writer);
    }
    if (!writer) {
      return _writer.final();
    }
    return EMPTY_BUFFER;
  }
  toJSON() {
    const object = {
      ...super.toJSON(),
      isIndefiniteForm: this.isIndefiniteForm,
      value: []
    };
    for (const value of this.value) {
      object.value.push(value.toJSON());
    }
    return object;
  }
};
LocalConstructedValueBlock.NAME = "ConstructedValueBlock";
var _a$v;
var Constructed = class extends BaseBlock {
  constructor(parameters = {}) {
    super(parameters, LocalConstructedValueBlock);
    this.idBlock.isConstructed = true;
  }
  fromBER(inputBuffer, inputOffset, inputLength, context) {
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
    const resultOffset = this.valueBlock.fromBER(inputBuffer, inputOffset, this.lenBlock.isIndefiniteForm ? inputLength : this.lenBlock.length, context);
    if (resultOffset === -1) {
      this.error = this.valueBlock.error;
      return resultOffset;
    }
    if (!this.idBlock.error.length)
      this.blockLength += this.idBlock.blockLength;
    if (!this.lenBlock.error.length)
      this.blockLength += this.lenBlock.blockLength;
    if (!this.valueBlock.error.length)
      this.blockLength += this.valueBlock.blockLength;
    return resultOffset;
  }
  onAsciiEncoding() {
    const values = [];
    for (const value of this.valueBlock.value) {
      values.push(value.toString("ascii").split("\n").map((o) => `  ${o}`).join("\n"));
    }
    const blockName = this.idBlock.tagClass === 3 ? `[${this.idBlock.tagNumber}]` : this.constructor.NAME;
    return values.length ? `${blockName} :
${values.join("\n")}` : `${blockName} :`;
  }
};
_a$v = Constructed;
(() => {
  typeStore.Constructed = _a$v;
})();
Constructed.NAME = "CONSTRUCTED";
var LocalEndOfContentValueBlock = class extends ValueBlock {
  fromBER(inputBuffer, inputOffset, _inputLength) {
    return inputOffset;
  }
  toBER(_sizeOnly) {
    return EMPTY_BUFFER;
  }
};
LocalEndOfContentValueBlock.override = "EndOfContentValueBlock";
var _a$u;
var EndOfContent = class extends BaseBlock {
  constructor(parameters = {}) {
    super(parameters, LocalEndOfContentValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 0;
  }
};
_a$u = EndOfContent;
(() => {
  typeStore.EndOfContent = _a$u;
})();
EndOfContent.NAME = END_OF_CONTENT_NAME;
var _a$t;
var Null = class extends BaseBlock {
  constructor(parameters = {}) {
    super(parameters, ValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 5;
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    if (this.lenBlock.length > 0)
      this.warnings.push("Non-zero length of value block for Null type");
    if (!this.idBlock.error.length)
      this.blockLength += this.idBlock.blockLength;
    if (!this.lenBlock.error.length)
      this.blockLength += this.lenBlock.blockLength;
    this.blockLength += inputLength;
    if (inputOffset + inputLength > inputBuffer.byteLength) {
      this.error = "End of input reached before message was fully decoded (inconsistent offset and length values)";
      return -1;
    }
    return inputOffset + inputLength;
  }
  toBER(sizeOnly, writer) {
    const retBuf = new ArrayBuffer(2);
    if (!sizeOnly) {
      const retView = new Uint8Array(retBuf);
      retView[0] = 5;
      retView[1] = 0;
    }
    if (writer) {
      writer.write(retBuf);
    }
    return retBuf;
  }
  onAsciiEncoding() {
    return `${this.constructor.NAME}`;
  }
};
_a$t = Null;
(() => {
  typeStore.Null = _a$t;
})();
Null.NAME = "NULL";
var LocalBooleanValueBlock = class extends HexBlock(ValueBlock) {
  get value() {
    for (const octet of this.valueHexView) {
      if (octet > 0) {
        return true;
      }
    }
    return false;
  }
  set value(value) {
    this.valueHexView[0] = value ? 255 : 0;
  }
  constructor({ value, ...parameters } = {}) {
    super(parameters);
    if (parameters.valueHex) {
      this.valueHexView = pvtsutils.BufferSourceConverter.toUint8Array(parameters.valueHex);
    } else {
      this.valueHexView = new Uint8Array(1);
    }
    if (value) {
      this.value = value;
    }
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }
    this.valueHexView = inputView.subarray(inputOffset, inputOffset + inputLength);
    if (inputLength > 1)
      this.warnings.push("Boolean value encoded in more then 1 octet");
    this.isHexOnly = true;
    utilDecodeTC.call(this);
    this.blockLength = inputLength;
    return inputOffset + inputLength;
  }
  toBER() {
    return this.valueHexView.slice();
  }
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value
    };
  }
};
LocalBooleanValueBlock.NAME = "BooleanValueBlock";
var _a$s;
var Boolean2 = class extends BaseBlock {
  getValue() {
    return this.valueBlock.value;
  }
  setValue(value) {
    this.valueBlock.value = value;
  }
  constructor(parameters = {}) {
    super(parameters, LocalBooleanValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 1;
  }
  onAsciiEncoding() {
    return `${this.constructor.NAME} : ${this.getValue}`;
  }
};
_a$s = Boolean2;
(() => {
  typeStore.Boolean = _a$s;
})();
Boolean2.NAME = "BOOLEAN";
var LocalOctetStringValueBlock = class extends HexBlock(LocalConstructedValueBlock) {
  constructor({ isConstructed = false, ...parameters } = {}) {
    super(parameters);
    this.isConstructed = isConstructed;
  }
  fromBER(inputBuffer, inputOffset, inputLength, context) {
    let resultOffset = 0;
    if (this.isConstructed) {
      this.isHexOnly = false;
      resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength, context);
      if (resultOffset === -1)
        return resultOffset;
      for (let i = 0; i < this.value.length; i++) {
        const currentBlockName = this.value[i].constructor.NAME;
        if (currentBlockName === END_OF_CONTENT_NAME) {
          if (this.isIndefiniteForm)
            break;
          else {
            this.error = "EndOfContent is unexpected, OCTET STRING may consists of OCTET STRINGs only";
            return -1;
          }
        }
        if (currentBlockName !== OCTET_STRING_NAME) {
          this.error = "OCTET STRING may consists of OCTET STRINGs only";
          return -1;
        }
      }
    } else {
      this.isHexOnly = true;
      resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
      this.blockLength = inputLength;
    }
    return resultOffset;
  }
  toBER(sizeOnly, writer) {
    if (this.isConstructed)
      return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
    return sizeOnly ? new ArrayBuffer(this.valueHexView.byteLength) : this.valueHexView.slice().buffer;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      isConstructed: this.isConstructed
    };
  }
};
LocalOctetStringValueBlock.NAME = "OctetStringValueBlock";
var _a$r;
var OctetString = class extends BaseBlock {
  constructor({ idBlock = {}, lenBlock = {}, ...parameters } = {}) {
    var _b, _c;
    (_b = parameters.isConstructed) !== null && _b !== void 0 ? _b : parameters.isConstructed = !!((_c = parameters.value) === null || _c === void 0 ? void 0 : _c.length);
    super({
      idBlock: {
        isConstructed: parameters.isConstructed,
        ...idBlock
      },
      lenBlock: {
        ...lenBlock,
        isIndefiniteForm: !!parameters.isIndefiniteForm
      },
      ...parameters
    }, LocalOctetStringValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 4;
  }
  fromBER(inputBuffer, inputOffset, inputLength, context) {
    this.valueBlock.isConstructed = this.idBlock.isConstructed;
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
    if (inputLength === 0) {
      if (this.idBlock.error.length === 0)
        this.blockLength += this.idBlock.blockLength;
      if (this.lenBlock.error.length === 0)
        this.blockLength += this.lenBlock.blockLength;
      return inputOffset;
    }
    if (!this.valueBlock.isConstructed) {
      const view = inputBuffer instanceof ArrayBuffer ? new Uint8Array(inputBuffer) : inputBuffer;
      const buf = view.subarray(inputOffset, inputOffset + inputLength);
      try {
        if (buf.byteLength) {
          const parseContext = context !== null && context !== void 0 ? context : createFromBerContext();
          const asn = localFromBERWithChildContext(buf, 0, buf.byteLength, parseContext);
          if (asn.offset !== -1 && asn.offset === inputLength) {
            this.valueBlock.value = [asn.result];
          }
        }
      } catch {
      }
    }
    return super.fromBER(inputBuffer, inputOffset, inputLength, context);
  }
  onAsciiEncoding() {
    if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) {
      return Constructed.prototype.onAsciiEncoding.call(this);
    }
    const name = this.constructor.NAME;
    const value = pvtsutils.Convert.ToHex(this.valueBlock.valueHexView);
    return `${name} : ${value}`;
  }
  getValue() {
    if (!this.idBlock.isConstructed) {
      return this.valueBlock.valueHexView.slice().buffer;
    }
    const array = [];
    for (const content of this.valueBlock.value) {
      if (content instanceof _a$r) {
        array.push(content.valueBlock.valueHexView);
      }
    }
    return pvtsutils.BufferSourceConverter.concat(array);
  }
};
_a$r = OctetString;
(() => {
  typeStore.OctetString = _a$r;
})();
OctetString.NAME = OCTET_STRING_NAME;
var LocalBitStringValueBlock = class extends HexBlock(LocalConstructedValueBlock) {
  constructor({ unusedBits = 0, isConstructed = false, ...parameters } = {}) {
    super(parameters);
    this.unusedBits = unusedBits;
    this.isConstructed = isConstructed;
    this.blockLength = this.valueHexView.byteLength;
  }
  fromBER(inputBuffer, inputOffset, inputLength, context) {
    if (!inputLength) {
      return inputOffset;
    }
    let resultOffset = -1;
    if (this.isConstructed) {
      resultOffset = LocalConstructedValueBlock.prototype.fromBER.call(this, inputBuffer, inputOffset, inputLength, context);
      if (resultOffset === -1)
        return resultOffset;
      for (const value of this.value) {
        const currentBlockName = value.constructor.NAME;
        if (currentBlockName === END_OF_CONTENT_NAME) {
          if (this.isIndefiniteForm)
            break;
          else {
            this.error = "EndOfContent is unexpected, BIT STRING may consists of BIT STRINGs only";
            return -1;
          }
        }
        if (currentBlockName !== BIT_STRING_NAME) {
          this.error = "BIT STRING may consists of BIT STRINGs only";
          return -1;
        }
        const valueBlock = value.valueBlock;
        if (this.unusedBits > 0 && valueBlock.unusedBits > 0) {
          this.error = 'Using of "unused bits" inside constructive BIT STRING allowed for least one only';
          return -1;
        }
        this.unusedBits = valueBlock.unusedBits;
      }
      return resultOffset;
    }
    const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }
    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
    this.unusedBits = intBuffer[0];
    if (this.unusedBits > 7) {
      this.error = "Unused bits for BitString must be in range 0-7";
      return -1;
    }
    if (!this.unusedBits) {
      const buf = intBuffer.subarray(1);
      try {
        if (buf.byteLength) {
          const parseContext = context !== null && context !== void 0 ? context : createFromBerContext();
          const asn = localFromBERWithChildContext(buf, 0, buf.byteLength, parseContext);
          if (asn.offset !== -1 && asn.offset === inputLength - 1) {
            this.value = [asn.result];
          }
        }
      } catch {
      }
    }
    this.valueHexView = intBuffer.subarray(1);
    this.blockLength = intBuffer.length;
    return inputOffset + inputLength;
  }
  toBER(sizeOnly, writer) {
    if (this.isConstructed) {
      return LocalConstructedValueBlock.prototype.toBER.call(this, sizeOnly, writer);
    }
    if (sizeOnly) {
      return new ArrayBuffer(this.valueHexView.byteLength + 1);
    }
    if (!this.valueHexView.byteLength) {
      const empty = new Uint8Array(1);
      empty[0] = 0;
      return empty.buffer;
    }
    const retView = new Uint8Array(this.valueHexView.length + 1);
    retView[0] = this.unusedBits;
    retView.set(this.valueHexView, 1);
    return retView.buffer;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      unusedBits: this.unusedBits,
      isConstructed: this.isConstructed
    };
  }
};
LocalBitStringValueBlock.NAME = "BitStringValueBlock";
var _a$q;
var BitString = class extends BaseBlock {
  constructor({ idBlock = {}, lenBlock = {}, ...parameters } = {}) {
    var _b, _c;
    (_b = parameters.isConstructed) !== null && _b !== void 0 ? _b : parameters.isConstructed = !!((_c = parameters.value) === null || _c === void 0 ? void 0 : _c.length);
    super({
      idBlock: {
        isConstructed: parameters.isConstructed,
        ...idBlock
      },
      lenBlock: {
        ...lenBlock,
        isIndefiniteForm: !!parameters.isIndefiniteForm
      },
      ...parameters
    }, LocalBitStringValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 3;
  }
  fromBER(inputBuffer, inputOffset, inputLength, context) {
    this.valueBlock.isConstructed = this.idBlock.isConstructed;
    this.valueBlock.isIndefiniteForm = this.lenBlock.isIndefiniteForm;
    return super.fromBER(inputBuffer, inputOffset, inputLength, context);
  }
  onAsciiEncoding() {
    if (this.valueBlock.isConstructed || this.valueBlock.value && this.valueBlock.value.length) {
      return Constructed.prototype.onAsciiEncoding.call(this);
    } else {
      const bits = [];
      const valueHex = this.valueBlock.valueHexView;
      for (const byte of valueHex) {
        bits.push(byte.toString(2).padStart(8, "0"));
      }
      const bitsStr = bits.join("");
      const name = this.constructor.NAME;
      const value = bitsStr.substring(0, bitsStr.length - this.valueBlock.unusedBits);
      return `${name} : ${value}`;
    }
  }
};
_a$q = BitString;
(() => {
  typeStore.BitString = _a$q;
})();
BitString.NAME = BIT_STRING_NAME;
var _a$p;
function viewAdd(first, second) {
  const c = new Uint8Array([0]);
  const firstView = new Uint8Array(first);
  const secondView = new Uint8Array(second);
  let firstViewCopy = firstView.slice(0);
  const firstViewCopyLength = firstViewCopy.length - 1;
  const secondViewCopy = secondView.slice(0);
  const secondViewCopyLength = secondViewCopy.length - 1;
  let value = 0;
  const max = secondViewCopyLength < firstViewCopyLength ? firstViewCopyLength : secondViewCopyLength;
  let counter = 0;
  for (let i = max; i >= 0; i--, counter++) {
    switch (true) {
      case counter < secondViewCopy.length:
        value = firstViewCopy[firstViewCopyLength - counter] + secondViewCopy[secondViewCopyLength - counter] + c[0];
        break;
      default:
        value = firstViewCopy[firstViewCopyLength - counter] + c[0];
    }
    c[0] = value / 10;
    switch (true) {
      case counter >= firstViewCopy.length:
        firstViewCopy = utilConcatView(new Uint8Array([value % 10]), firstViewCopy);
        break;
      default:
        firstViewCopy[firstViewCopyLength - counter] = value % 10;
    }
  }
  if (c[0] > 0)
    firstViewCopy = utilConcatView(c, firstViewCopy);
  return firstViewCopy;
}
function power2(n) {
  if (n >= powers2.length) {
    for (let p = powers2.length; p <= n; p++) {
      const c = new Uint8Array([0]);
      let digits = powers2[p - 1].slice(0);
      for (let i = digits.length - 1; i >= 0; i--) {
        const newValue = new Uint8Array([(digits[i] << 1) + c[0]]);
        c[0] = newValue[0] / 10;
        digits[i] = newValue[0] % 10;
      }
      if (c[0] > 0)
        digits = utilConcatView(c, digits);
      powers2.push(digits);
    }
  }
  return powers2[n];
}
function viewSub(first, second) {
  let b = 0;
  const firstView = new Uint8Array(first);
  const secondView = new Uint8Array(second);
  const firstViewCopy = firstView.slice(0);
  const firstViewCopyLength = firstViewCopy.length - 1;
  const secondViewCopy = secondView.slice(0);
  const secondViewCopyLength = secondViewCopy.length - 1;
  let value;
  let counter = 0;
  for (let i = secondViewCopyLength; i >= 0; i--, counter++) {
    value = firstViewCopy[firstViewCopyLength - counter] - secondViewCopy[secondViewCopyLength - counter] - b;
    switch (true) {
      case value < 0:
        b = 1;
        firstViewCopy[firstViewCopyLength - counter] = value + 10;
        break;
      default:
        b = 0;
        firstViewCopy[firstViewCopyLength - counter] = value;
    }
  }
  if (b > 0) {
    for (let i = firstViewCopyLength - secondViewCopyLength + 1; i >= 0; i--, counter++) {
      value = firstViewCopy[firstViewCopyLength - counter] - b;
      if (value < 0) {
        b = 1;
        firstViewCopy[firstViewCopyLength - counter] = value + 10;
      } else {
        b = 0;
        firstViewCopy[firstViewCopyLength - counter] = value;
        break;
      }
    }
  }
  return firstViewCopy.slice();
}
var LocalIntegerValueBlock = class extends HexBlock(ValueBlock) {
  setValueHex() {
    if (this.valueHexView.length >= 4) {
      this.warnings.push("Too big Integer for decoding, hex only");
      this.isHexOnly = true;
      this._valueDec = 0;
    } else {
      this.isHexOnly = false;
      if (this.valueHexView.length > 0) {
        this._valueDec = utilDecodeTC.call(this);
      }
    }
  }
  constructor({ value, ...parameters } = {}) {
    super(parameters);
    this._valueDec = 0;
    if (parameters.valueHex) {
      this.setValueHex();
    }
    if (value !== void 0) {
      this.valueDec = value;
    }
  }
  set valueDec(v) {
    this._valueDec = v;
    this.isHexOnly = false;
    this.valueHexView = new Uint8Array(utilEncodeTC(v));
  }
  get valueDec() {
    return this._valueDec;
  }
  fromDER(inputBuffer, inputOffset, inputLength, expectedLength = 0) {
    const offset = this.fromBER(inputBuffer, inputOffset, inputLength);
    if (offset === -1)
      return offset;
    const view = this.valueHexView;
    if (view[0] === 0 && (view[1] & 128) !== 0) {
      this.valueHexView = view.subarray(1);
    } else {
      if (expectedLength !== 0) {
        if (view.length < expectedLength) {
          if (expectedLength - view.length > 1)
            expectedLength = view.length + 1;
          this.valueHexView = view.subarray(expectedLength - view.length);
        }
      }
    }
    return offset;
  }
  toDER(sizeOnly = false) {
    const view = this.valueHexView;
    switch (true) {
      case (view[0] & 128) !== 0:
        {
          const updatedView = new Uint8Array(this.valueHexView.length + 1);
          updatedView[0] = 0;
          updatedView.set(view, 1);
          this.valueHexView = updatedView;
        }
        break;
      case (view[0] === 0 && (view[1] & 128) === 0):
        {
          this.valueHexView = this.valueHexView.subarray(1);
        }
        break;
    }
    return this.toBER(sizeOnly);
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    const resultOffset = super.fromBER(inputBuffer, inputOffset, inputLength);
    if (resultOffset === -1) {
      return resultOffset;
    }
    this.setValueHex();
    return resultOffset;
  }
  toBER(sizeOnly) {
    return sizeOnly ? new ArrayBuffer(this.valueHexView.length) : this.valueHexView.slice().buffer;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      valueDec: this.valueDec
    };
  }
  toString() {
    const firstBit = this.valueHexView.length * 8 - 1;
    let digits = new Uint8Array(this.valueHexView.length * 8 / 3);
    let bitNumber = 0;
    let currentByte;
    const asn1View = this.valueHexView;
    let result = "";
    let flag = false;
    for (let byteNumber = asn1View.byteLength - 1; byteNumber >= 0; byteNumber--) {
      currentByte = asn1View[byteNumber];
      for (let i = 0; i < 8; i++) {
        if ((currentByte & 1) === 1) {
          switch (bitNumber) {
            case firstBit:
              digits = viewSub(power2(bitNumber), digits);
              result = "-";
              break;
            default:
              digits = viewAdd(digits, power2(bitNumber));
          }
        }
        bitNumber++;
        currentByte >>= 1;
      }
    }
    for (let i = 0; i < digits.length; i++) {
      if (digits[i])
        flag = true;
      if (flag)
        result += digitsString.charAt(digits[i]);
    }
    if (flag === false)
      result += digitsString.charAt(0);
    return result;
  }
};
_a$p = LocalIntegerValueBlock;
LocalIntegerValueBlock.NAME = "IntegerValueBlock";
(() => {
  Object.defineProperty(_a$p.prototype, "valueHex", {
    set: function(v) {
      this.valueHexView = new Uint8Array(v);
      this.setValueHex();
    },
    get: function() {
      return this.valueHexView.slice().buffer;
    }
  });
})();
var _a$o;
var Integer = class extends BaseBlock {
  constructor(parameters = {}) {
    super(parameters, LocalIntegerValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 2;
  }
  toBigInt() {
    assertBigInt();
    return BigInt(this.valueBlock.toString());
  }
  static fromBigInt(value) {
    assertBigInt();
    const bigIntValue = BigInt(value);
    const writer = new ViewWriter();
    const hex2 = bigIntValue.toString(16).replace(/^-/, "");
    const view = new Uint8Array(pvtsutils.Convert.FromHex(hex2));
    if (bigIntValue < 0) {
      const first = new Uint8Array(view.length + (view[0] & 128 ? 1 : 0));
      first[0] |= 128;
      const firstInt = BigInt(`0x${pvtsutils.Convert.ToHex(first)}`);
      const secondInt = firstInt + bigIntValue;
      const second = pvtsutils.BufferSourceConverter.toUint8Array(pvtsutils.Convert.FromHex(secondInt.toString(16)));
      second[0] |= 128;
      writer.write(second);
    } else {
      if (view[0] & 128) {
        writer.write(new Uint8Array([0]));
      }
      writer.write(view);
    }
    const res = new _a$o({ valueHex: writer.final() });
    return res;
  }
  convertToDER() {
    const integer = new _a$o({ valueHex: this.valueBlock.valueHexView });
    integer.valueBlock.toDER();
    return integer;
  }
  convertFromDER() {
    return new _a$o({
      valueHex: this.valueBlock.valueHexView[0] === 0 ? this.valueBlock.valueHexView.subarray(1) : this.valueBlock.valueHexView
    });
  }
  onAsciiEncoding() {
    return `${this.constructor.NAME} : ${this.valueBlock.toString()}`;
  }
};
_a$o = Integer;
(() => {
  typeStore.Integer = _a$o;
})();
Integer.NAME = "INTEGER";
var _a$n;
var Enumerated = class extends Integer {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 10;
  }
};
_a$n = Enumerated;
(() => {
  typeStore.Enumerated = _a$n;
})();
Enumerated.NAME = "ENUMERATED";
var LocalSidValueBlock = class extends HexBlock(ValueBlock) {
  constructor({ valueDec = -1, isFirstSid = false, ...parameters } = {}) {
    super(parameters);
    this.valueDec = valueDec;
    this.isFirstSid = isFirstSid;
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    if (!inputLength) {
      return inputOffset;
    }
    const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    if (!checkBufferParams(this, inputView, inputOffset, inputLength)) {
      return -1;
    }
    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
    this.valueHexView = new Uint8Array(inputLength);
    for (let i = 0; i < inputLength; i++) {
      this.valueHexView[i] = intBuffer[i] & 127;
      this.blockLength++;
      if ((intBuffer[i] & 128) === 0)
        break;
    }
    const tempView = new Uint8Array(this.blockLength);
    for (let i = 0; i < this.blockLength; i++) {
      tempView[i] = this.valueHexView[i];
    }
    this.valueHexView = tempView;
    if ((intBuffer[this.blockLength - 1] & 128) !== 0) {
      this.error = "End of input reached before message was fully decoded";
      return -1;
    }
    if (this.valueHexView[0] === 0)
      this.warnings.push("Needlessly long format of SID encoding");
    if (this.blockLength <= 8)
      this.valueDec = utilFromBase(this.valueHexView, 7);
    else {
      this.isHexOnly = true;
      this.warnings.push("Too big SID for decoding, hex only");
    }
    return inputOffset + this.blockLength;
  }
  set valueBigInt(value) {
    assertBigInt();
    let bits = BigInt(value).toString(2);
    while (bits.length % 7) {
      bits = "0" + bits;
    }
    const bytes = new Uint8Array(bits.length / 7);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(bits.slice(i * 7, i * 7 + 7), 2) + (i + 1 < bytes.length ? 128 : 0);
    }
    this.fromBER(bytes.buffer, 0, bytes.length);
  }
  toBER(sizeOnly) {
    if (this.isHexOnly) {
      if (sizeOnly)
        return new ArrayBuffer(this.valueHexView.byteLength);
      const curView = this.valueHexView;
      const retView2 = new Uint8Array(this.blockLength);
      for (let i = 0; i < this.blockLength - 1; i++)
        retView2[i] = curView[i] | 128;
      retView2[this.blockLength - 1] = curView[this.blockLength - 1];
      return retView2.buffer;
    }
    const encodedBuf = utilToBase(this.valueDec, 7);
    if (encodedBuf.byteLength === 0) {
      this.error = "Error during encoding SID value";
      return EMPTY_BUFFER;
    }
    const retView = new Uint8Array(encodedBuf.byteLength);
    if (!sizeOnly) {
      const encodedView = new Uint8Array(encodedBuf);
      const len = encodedBuf.byteLength - 1;
      for (let i = 0; i < len; i++)
        retView[i] = encodedView[i] | 128;
      retView[len] = encodedView[len];
    }
    return retView;
  }
  toString() {
    let result = "";
    if (this.isHexOnly)
      result = pvtsutils.Convert.ToHex(this.valueHexView);
    else {
      if (this.isFirstSid) {
        let sidValue = this.valueDec;
        if (this.valueDec <= 39)
          result = "0.";
        else {
          if (this.valueDec <= 79) {
            result = "1.";
            sidValue -= 40;
          } else {
            result = "2.";
            sidValue -= 80;
          }
        }
        result += sidValue.toString();
      } else
        result = this.valueDec.toString();
    }
    return result;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      valueDec: this.valueDec,
      isFirstSid: this.isFirstSid
    };
  }
};
LocalSidValueBlock.NAME = "sidBlock";
var LocalObjectIdentifierValueBlock = class extends ValueBlock {
  constructor({ value = EMPTY_STRING, ...parameters } = {}) {
    super(parameters);
    this.value = [];
    if (value) {
      this.fromString(value);
    }
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    let resultOffset = inputOffset;
    while (inputLength > 0) {
      const sidBlock = new LocalSidValueBlock();
      resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
      if (resultOffset === -1) {
        this.blockLength = 0;
        this.error = sidBlock.error;
        return resultOffset;
      }
      if (this.value.length === 0)
        sidBlock.isFirstSid = true;
      this.blockLength += sidBlock.blockLength;
      inputLength -= sidBlock.blockLength;
      this.value.push(sidBlock);
    }
    return resultOffset;
  }
  toBER(sizeOnly) {
    const retBuffers = [];
    for (let i = 0; i < this.value.length; i++) {
      const valueBuf = this.value[i].toBER(sizeOnly);
      if (valueBuf.byteLength === 0) {
        this.error = this.value[i].error;
        return EMPTY_BUFFER;
      }
      retBuffers.push(valueBuf);
    }
    return concat(retBuffers);
  }
  fromString(string) {
    this.value = [];
    let pos1 = 0;
    let pos2 = 0;
    let sid = "";
    let flag = false;
    do {
      pos2 = string.indexOf(".", pos1);
      if (pos2 === -1)
        sid = string.substring(pos1);
      else
        sid = string.substring(pos1, pos2);
      pos1 = pos2 + 1;
      if (flag) {
        const sidBlock = this.value[0];
        let plus = 0;
        switch (sidBlock.valueDec) {
          case 0:
            break;
          case 1:
            plus = 40;
            break;
          case 2:
            plus = 80;
            break;
          default:
            this.value = [];
            return;
        }
        const parsedSID = parseInt(sid, 10);
        if (isNaN(parsedSID))
          return;
        sidBlock.valueDec = parsedSID + plus;
        flag = false;
      } else {
        const sidBlock = new LocalSidValueBlock();
        if (sid > Number.MAX_SAFE_INTEGER) {
          assertBigInt();
          const sidValue = BigInt(sid);
          sidBlock.valueBigInt = sidValue;
        } else {
          sidBlock.valueDec = parseInt(sid, 10);
          if (isNaN(sidBlock.valueDec))
            return;
        }
        if (!this.value.length) {
          sidBlock.isFirstSid = true;
          flag = true;
        }
        this.value.push(sidBlock);
      }
    } while (pos2 !== -1);
  }
  toString() {
    let result = "";
    let isHexOnly = false;
    for (let i = 0; i < this.value.length; i++) {
      isHexOnly = this.value[i].isHexOnly;
      let sidStr = this.value[i].toString();
      if (i !== 0)
        result = `${result}.`;
      if (isHexOnly) {
        sidStr = `{${sidStr}}`;
        if (this.value[i].isFirstSid)
          result = `2.{${sidStr} - 80}`;
        else
          result += sidStr;
      } else
        result += sidStr;
    }
    return result;
  }
  toJSON() {
    const object = {
      ...super.toJSON(),
      value: this.toString(),
      sidArray: []
    };
    for (let i = 0; i < this.value.length; i++) {
      object.sidArray.push(this.value[i].toJSON());
    }
    return object;
  }
};
LocalObjectIdentifierValueBlock.NAME = "ObjectIdentifierValueBlock";
var _a$m;
var ObjectIdentifier = class extends BaseBlock {
  getValue() {
    return this.valueBlock.toString();
  }
  setValue(value) {
    this.valueBlock.fromString(value);
  }
  constructor(parameters = {}) {
    super(parameters, LocalObjectIdentifierValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 6;
  }
  onAsciiEncoding() {
    return `${this.constructor.NAME} : ${this.valueBlock.toString() || "empty"}`;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.getValue()
    };
  }
};
_a$m = ObjectIdentifier;
(() => {
  typeStore.ObjectIdentifier = _a$m;
})();
ObjectIdentifier.NAME = "OBJECT IDENTIFIER";
var LocalRelativeSidValueBlock = class extends HexBlock(LocalBaseBlock) {
  constructor({ valueDec = 0, ...parameters } = {}) {
    super(parameters);
    this.valueDec = valueDec;
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    if (inputLength === 0)
      return inputOffset;
    const inputView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    if (!checkBufferParams(this, inputView, inputOffset, inputLength))
      return -1;
    const intBuffer = inputView.subarray(inputOffset, inputOffset + inputLength);
    this.valueHexView = new Uint8Array(inputLength);
    for (let i = 0; i < inputLength; i++) {
      this.valueHexView[i] = intBuffer[i] & 127;
      this.blockLength++;
      if ((intBuffer[i] & 128) === 0)
        break;
    }
    const tempView = new Uint8Array(this.blockLength);
    for (let i = 0; i < this.blockLength; i++)
      tempView[i] = this.valueHexView[i];
    this.valueHexView = tempView;
    if ((intBuffer[this.blockLength - 1] & 128) !== 0) {
      this.error = "End of input reached before message was fully decoded";
      return -1;
    }
    if (this.valueHexView[0] === 0)
      this.warnings.push("Needlessly long format of SID encoding");
    if (this.blockLength <= 8)
      this.valueDec = utilFromBase(this.valueHexView, 7);
    else {
      this.isHexOnly = true;
      this.warnings.push("Too big SID for decoding, hex only");
    }
    return inputOffset + this.blockLength;
  }
  toBER(sizeOnly) {
    if (this.isHexOnly) {
      if (sizeOnly)
        return new ArrayBuffer(this.valueHexView.byteLength);
      const curView = this.valueHexView;
      const retView2 = new Uint8Array(this.blockLength);
      for (let i = 0; i < this.blockLength - 1; i++)
        retView2[i] = curView[i] | 128;
      retView2[this.blockLength - 1] = curView[this.blockLength - 1];
      return retView2.buffer;
    }
    const encodedBuf = utilToBase(this.valueDec, 7);
    if (encodedBuf.byteLength === 0) {
      this.error = "Error during encoding SID value";
      return EMPTY_BUFFER;
    }
    const retView = new Uint8Array(encodedBuf.byteLength);
    if (!sizeOnly) {
      const encodedView = new Uint8Array(encodedBuf);
      const len = encodedBuf.byteLength - 1;
      for (let i = 0; i < len; i++)
        retView[i] = encodedView[i] | 128;
      retView[len] = encodedView[len];
    }
    return retView.buffer;
  }
  toString() {
    let result = "";
    if (this.isHexOnly)
      result = pvtsutils.Convert.ToHex(this.valueHexView);
    else {
      result = this.valueDec.toString();
    }
    return result;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      valueDec: this.valueDec
    };
  }
};
LocalRelativeSidValueBlock.NAME = "relativeSidBlock";
var LocalRelativeObjectIdentifierValueBlock = class extends ValueBlock {
  constructor({ value = EMPTY_STRING, ...parameters } = {}) {
    super(parameters);
    this.value = [];
    if (value) {
      this.fromString(value);
    }
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    let resultOffset = inputOffset;
    while (inputLength > 0) {
      const sidBlock = new LocalRelativeSidValueBlock();
      resultOffset = sidBlock.fromBER(inputBuffer, resultOffset, inputLength);
      if (resultOffset === -1) {
        this.blockLength = 0;
        this.error = sidBlock.error;
        return resultOffset;
      }
      this.blockLength += sidBlock.blockLength;
      inputLength -= sidBlock.blockLength;
      this.value.push(sidBlock);
    }
    return resultOffset;
  }
  toBER(sizeOnly, _writer) {
    const retBuffers = [];
    for (let i = 0; i < this.value.length; i++) {
      const valueBuf = this.value[i].toBER(sizeOnly);
      if (valueBuf.byteLength === 0) {
        this.error = this.value[i].error;
        return EMPTY_BUFFER;
      }
      retBuffers.push(valueBuf);
    }
    return concat(retBuffers);
  }
  fromString(string) {
    this.value = [];
    let pos1 = 0;
    let pos2 = 0;
    let sid = "";
    do {
      pos2 = string.indexOf(".", pos1);
      if (pos2 === -1)
        sid = string.substring(pos1);
      else
        sid = string.substring(pos1, pos2);
      pos1 = pos2 + 1;
      const sidBlock = new LocalRelativeSidValueBlock();
      sidBlock.valueDec = parseInt(sid, 10);
      if (isNaN(sidBlock.valueDec))
        return true;
      this.value.push(sidBlock);
    } while (pos2 !== -1);
    return true;
  }
  toString() {
    let result = "";
    let isHexOnly = false;
    for (let i = 0; i < this.value.length; i++) {
      isHexOnly = this.value[i].isHexOnly;
      let sidStr = this.value[i].toString();
      if (i !== 0)
        result = `${result}.`;
      if (isHexOnly) {
        sidStr = `{${sidStr}}`;
        result += sidStr;
      } else
        result += sidStr;
    }
    return result;
  }
  toJSON() {
    const object = {
      ...super.toJSON(),
      value: this.toString(),
      sidArray: []
    };
    for (let i = 0; i < this.value.length; i++)
      object.sidArray.push(this.value[i].toJSON());
    return object;
  }
};
LocalRelativeObjectIdentifierValueBlock.NAME = "RelativeObjectIdentifierValueBlock";
var _a$l;
var RelativeObjectIdentifier = class extends BaseBlock {
  getValue() {
    return this.valueBlock.toString();
  }
  setValue(value) {
    this.valueBlock.fromString(value);
  }
  constructor(parameters = {}) {
    super(parameters, LocalRelativeObjectIdentifierValueBlock);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 13;
  }
  onAsciiEncoding() {
    return `${this.constructor.NAME} : ${this.valueBlock.toString() || "empty"}`;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.getValue()
    };
  }
};
_a$l = RelativeObjectIdentifier;
(() => {
  typeStore.RelativeObjectIdentifier = _a$l;
})();
RelativeObjectIdentifier.NAME = "RelativeObjectIdentifier";
var _a$k;
var Sequence = class extends Constructed {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 16;
  }
};
_a$k = Sequence;
(() => {
  typeStore.Sequence = _a$k;
})();
Sequence.NAME = "SEQUENCE";
var _a$j;
var Set2 = class extends Constructed {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 17;
  }
};
_a$j = Set2;
(() => {
  typeStore.Set = _a$j;
})();
Set2.NAME = "SET";
var LocalStringValueBlock = class extends HexBlock(ValueBlock) {
  constructor({ ...parameters } = {}) {
    super(parameters);
    this.isHexOnly = true;
    this.value = EMPTY_STRING;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      value: this.value
    };
  }
};
LocalStringValueBlock.NAME = "StringValueBlock";
var LocalSimpleStringValueBlock = class extends LocalStringValueBlock {
};
LocalSimpleStringValueBlock.NAME = "SimpleStringValueBlock";
var LocalSimpleStringBlock = class extends BaseStringBlock {
  constructor({ ...parameters } = {}) {
    super(parameters, LocalSimpleStringValueBlock);
  }
  fromBuffer(inputBuffer) {
    this.valueBlock.value = String.fromCharCode.apply(null, pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer));
  }
  fromString(inputString) {
    const strLen = inputString.length;
    const view = this.valueBlock.valueHexView = new Uint8Array(strLen);
    for (let i = 0; i < strLen; i++)
      view[i] = inputString.charCodeAt(i);
    this.valueBlock.value = inputString;
  }
};
LocalSimpleStringBlock.NAME = "SIMPLE STRING";
var LocalUtf8StringValueBlock = class extends LocalSimpleStringBlock {
  fromBuffer(inputBuffer) {
    this.valueBlock.valueHexView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
    try {
      this.valueBlock.value = pvtsutils.Convert.ToUtf8String(inputBuffer);
    } catch (ex) {
      this.warnings.push(`Error during "decodeURIComponent": ${ex}, using raw string`);
      this.valueBlock.value = pvtsutils.Convert.ToBinary(inputBuffer);
    }
  }
  fromString(inputString) {
    this.valueBlock.valueHexView = new Uint8Array(pvtsutils.Convert.FromUtf8String(inputString));
    this.valueBlock.value = inputString;
  }
};
LocalUtf8StringValueBlock.NAME = "Utf8StringValueBlock";
var _a$i;
var Utf8String = class extends LocalUtf8StringValueBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 12;
  }
};
_a$i = Utf8String;
(() => {
  typeStore.Utf8String = _a$i;
})();
Utf8String.NAME = "UTF8String";
var LocalBmpStringValueBlock = class extends LocalSimpleStringBlock {
  fromBuffer(inputBuffer) {
    this.valueBlock.value = pvtsutils.Convert.ToUtf16String(inputBuffer);
    this.valueBlock.valueHexView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer);
  }
  fromString(inputString) {
    this.valueBlock.value = inputString;
    this.valueBlock.valueHexView = new Uint8Array(pvtsutils.Convert.FromUtf16String(inputString));
  }
};
LocalBmpStringValueBlock.NAME = "BmpStringValueBlock";
var _a$h;
var BmpString = class extends LocalBmpStringValueBlock {
  constructor({ ...parameters } = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 30;
  }
};
_a$h = BmpString;
(() => {
  typeStore.BmpString = _a$h;
})();
BmpString.NAME = "BMPString";
var LocalUniversalStringValueBlock = class extends LocalSimpleStringBlock {
  fromBuffer(inputBuffer) {
    const copyBuffer = ArrayBuffer.isView(inputBuffer) ? inputBuffer.slice().buffer : inputBuffer.slice(0);
    const valueView = new Uint8Array(copyBuffer);
    for (let i = 0; i < valueView.length; i += 4) {
      valueView[i] = valueView[i + 3];
      valueView[i + 1] = valueView[i + 2];
      valueView[i + 2] = 0;
      valueView[i + 3] = 0;
    }
    this.valueBlock.value = String.fromCharCode.apply(null, new Uint32Array(copyBuffer));
  }
  fromString(inputString) {
    const strLength = inputString.length;
    const valueHexView = this.valueBlock.valueHexView = new Uint8Array(strLength * 4);
    for (let i = 0; i < strLength; i++) {
      const codeBuf = utilToBase(inputString.charCodeAt(i), 8);
      const codeView = new Uint8Array(codeBuf);
      if (codeView.length > 4)
        continue;
      const dif = 4 - codeView.length;
      for (let j = codeView.length - 1; j >= 0; j--)
        valueHexView[i * 4 + j + dif] = codeView[j];
    }
    this.valueBlock.value = inputString;
  }
};
LocalUniversalStringValueBlock.NAME = "UniversalStringValueBlock";
var _a$g;
var UniversalString = class extends LocalUniversalStringValueBlock {
  constructor({ ...parameters } = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 28;
  }
};
_a$g = UniversalString;
(() => {
  typeStore.UniversalString = _a$g;
})();
UniversalString.NAME = "UniversalString";
var _a$f;
var NumericString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 18;
  }
};
_a$f = NumericString;
(() => {
  typeStore.NumericString = _a$f;
})();
NumericString.NAME = "NumericString";
var _a$e;
var PrintableString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 19;
  }
};
_a$e = PrintableString;
(() => {
  typeStore.PrintableString = _a$e;
})();
PrintableString.NAME = "PrintableString";
var _a$d;
var TeletexString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 20;
  }
};
_a$d = TeletexString;
(() => {
  typeStore.TeletexString = _a$d;
})();
TeletexString.NAME = "TeletexString";
var _a$c;
var VideotexString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 21;
  }
};
_a$c = VideotexString;
(() => {
  typeStore.VideotexString = _a$c;
})();
VideotexString.NAME = "VideotexString";
var _a$b;
var IA5String = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 22;
  }
};
_a$b = IA5String;
(() => {
  typeStore.IA5String = _a$b;
})();
IA5String.NAME = "IA5String";
var _a$a;
var GraphicString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 25;
  }
};
_a$a = GraphicString;
(() => {
  typeStore.GraphicString = _a$a;
})();
GraphicString.NAME = "GraphicString";
var _a$9;
var VisibleString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 26;
  }
};
_a$9 = VisibleString;
(() => {
  typeStore.VisibleString = _a$9;
})();
VisibleString.NAME = "VisibleString";
var _a$8;
var GeneralString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 27;
  }
};
_a$8 = GeneralString;
(() => {
  typeStore.GeneralString = _a$8;
})();
GeneralString.NAME = "GeneralString";
var _a$7;
var CharacterString = class extends LocalSimpleStringBlock {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 29;
  }
};
_a$7 = CharacterString;
(() => {
  typeStore.CharacterString = _a$7;
})();
CharacterString.NAME = "CharacterString";
var _a$6;
var UTCTime = class extends VisibleString {
  constructor({ value, valueDate, ...parameters } = {}) {
    super(parameters);
    this.year = 0;
    this.month = 0;
    this.day = 0;
    this.hour = 0;
    this.minute = 0;
    this.second = 0;
    if (value) {
      this.fromString(value);
      this.valueBlock.valueHexView = new Uint8Array(value.length);
      for (let i = 0; i < value.length; i++)
        this.valueBlock.valueHexView[i] = value.charCodeAt(i);
    }
    if (valueDate) {
      this.fromDate(valueDate);
      this.valueBlock.valueHexView = new Uint8Array(this.toBuffer());
    }
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 23;
  }
  fromBuffer(inputBuffer) {
    this.fromString(String.fromCharCode.apply(null, pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer)));
  }
  toBuffer() {
    const str = this.toString();
    const buffer = new ArrayBuffer(str.length);
    const view = new Uint8Array(buffer);
    for (let i = 0; i < str.length; i++)
      view[i] = str.charCodeAt(i);
    return buffer;
  }
  fromDate(inputDate) {
    this.year = inputDate.getUTCFullYear();
    this.month = inputDate.getUTCMonth() + 1;
    this.day = inputDate.getUTCDate();
    this.hour = inputDate.getUTCHours();
    this.minute = inputDate.getUTCMinutes();
    this.second = inputDate.getUTCSeconds();
  }
  toDate() {
    return new Date(Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second));
  }
  fromString(inputString) {
    const parser = /(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z/ig;
    const parserArray = parser.exec(inputString);
    if (parserArray === null) {
      this.error = "Wrong input string for conversion";
      return;
    }
    const year = parseInt(parserArray[1], 10);
    if (year >= 50)
      this.year = 1900 + year;
    else
      this.year = 2e3 + year;
    this.month = parseInt(parserArray[2], 10);
    this.day = parseInt(parserArray[3], 10);
    this.hour = parseInt(parserArray[4], 10);
    this.minute = parseInt(parserArray[5], 10);
    this.second = parseInt(parserArray[6], 10);
  }
  toString(encoding = "iso") {
    if (encoding === "iso") {
      const outputArray = new Array(7);
      outputArray[0] = padNumber(this.year < 2e3 ? this.year - 1900 : this.year - 2e3, 2);
      outputArray[1] = padNumber(this.month, 2);
      outputArray[2] = padNumber(this.day, 2);
      outputArray[3] = padNumber(this.hour, 2);
      outputArray[4] = padNumber(this.minute, 2);
      outputArray[5] = padNumber(this.second, 2);
      outputArray[6] = "Z";
      return outputArray.join("");
    }
    return super.toString(encoding);
  }
  onAsciiEncoding() {
    return `${this.constructor.NAME} : ${this.toDate().toISOString()}`;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      year: this.year,
      month: this.month,
      day: this.day,
      hour: this.hour,
      minute: this.minute,
      second: this.second
    };
  }
};
_a$6 = UTCTime;
(() => {
  typeStore.UTCTime = _a$6;
})();
UTCTime.NAME = "UTCTime";
var _a$5;
var GeneralizedTime = class extends UTCTime {
  constructor(parameters = {}) {
    var _b;
    super(parameters);
    (_b = this.millisecond) !== null && _b !== void 0 ? _b : this.millisecond = 0;
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 24;
  }
  fromDate(inputDate) {
    super.fromDate(inputDate);
    this.millisecond = inputDate.getUTCMilliseconds();
  }
  toDate() {
    const utcDate = Date.UTC(this.year, this.month - 1, this.day, this.hour, this.minute, this.second, this.millisecond);
    return new Date(utcDate);
  }
  fromString(inputString) {
    let isUTC = false;
    let timeString = "";
    let dateTimeString = "";
    let fractionPart = 0;
    let parser;
    let hourDifference = 0;
    let minuteDifference = 0;
    if (inputString[inputString.length - 1] === "Z") {
      timeString = inputString.substring(0, inputString.length - 1);
      isUTC = true;
    } else {
      const number = new Number(inputString[inputString.length - 1]);
      if (isNaN(number.valueOf()))
        throw new Error("Wrong input string for conversion");
      timeString = inputString;
    }
    if (isUTC) {
      if (timeString.indexOf("+") !== -1)
        throw new Error("Wrong input string for conversion");
      if (timeString.indexOf("-") !== -1)
        throw new Error("Wrong input string for conversion");
    } else {
      let multiplier = 1;
      let differencePosition = timeString.indexOf("+");
      let differenceString = "";
      if (differencePosition === -1) {
        differencePosition = timeString.indexOf("-");
        multiplier = -1;
      }
      if (differencePosition !== -1) {
        differenceString = timeString.substring(differencePosition + 1);
        timeString = timeString.substring(0, differencePosition);
        if (differenceString.length !== 2 && differenceString.length !== 4)
          throw new Error("Wrong input string for conversion");
        let number = parseInt(differenceString.substring(0, 2), 10);
        if (isNaN(number.valueOf()))
          throw new Error("Wrong input string for conversion");
        hourDifference = multiplier * number;
        if (differenceString.length === 4) {
          number = parseInt(differenceString.substring(2, 4), 10);
          if (isNaN(number.valueOf()))
            throw new Error("Wrong input string for conversion");
          minuteDifference = multiplier * number;
        }
      }
    }
    let fractionPointPosition = timeString.indexOf(".");
    if (fractionPointPosition === -1)
      fractionPointPosition = timeString.indexOf(",");
    if (fractionPointPosition !== -1) {
      const fractionPartCheck = new Number(`0${timeString.substring(fractionPointPosition)}`);
      if (isNaN(fractionPartCheck.valueOf()))
        throw new Error("Wrong input string for conversion");
      fractionPart = fractionPartCheck.valueOf();
      dateTimeString = timeString.substring(0, fractionPointPosition);
    } else
      dateTimeString = timeString;
    switch (true) {
      case dateTimeString.length === 8:
        parser = /(\d{4})(\d{2})(\d{2})/ig;
        if (fractionPointPosition !== -1)
          throw new Error("Wrong input string for conversion");
        break;
      case dateTimeString.length === 10:
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})/ig;
        if (fractionPointPosition !== -1) {
          let fractionResult = 60 * fractionPart;
          this.minute = Math.floor(fractionResult);
          fractionResult = 60 * (fractionResult - this.minute);
          this.second = Math.floor(fractionResult);
          fractionResult = 1e3 * (fractionResult - this.second);
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      case dateTimeString.length === 12:
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})/ig;
        if (fractionPointPosition !== -1) {
          let fractionResult = 60 * fractionPart;
          this.second = Math.floor(fractionResult);
          fractionResult = 1e3 * (fractionResult - this.second);
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      case dateTimeString.length === 14:
        parser = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/ig;
        if (fractionPointPosition !== -1) {
          const fractionResult = 1e3 * fractionPart;
          this.millisecond = Math.floor(fractionResult);
        }
        break;
      default:
        throw new Error("Wrong input string for conversion");
    }
    const parserArray = parser.exec(dateTimeString);
    if (parserArray === null)
      throw new Error("Wrong input string for conversion");
    for (let j = 1; j < parserArray.length; j++) {
      switch (j) {
        case 1:
          this.year = parseInt(parserArray[j], 10);
          break;
        case 2:
          this.month = parseInt(parserArray[j], 10);
          break;
        case 3:
          this.day = parseInt(parserArray[j], 10);
          break;
        case 4:
          this.hour = parseInt(parserArray[j], 10) + hourDifference;
          break;
        case 5:
          this.minute = parseInt(parserArray[j], 10) + minuteDifference;
          break;
        case 6:
          this.second = parseInt(parserArray[j], 10);
          break;
        default:
          throw new Error("Wrong input string for conversion");
      }
    }
    if (isUTC === false) {
      const tempDate = new Date(this.year, this.month, this.day, this.hour, this.minute, this.second, this.millisecond);
      this.year = tempDate.getUTCFullYear();
      this.month = tempDate.getUTCMonth();
      this.day = tempDate.getUTCDay();
      this.hour = tempDate.getUTCHours();
      this.minute = tempDate.getUTCMinutes();
      this.second = tempDate.getUTCSeconds();
      this.millisecond = tempDate.getUTCMilliseconds();
    }
  }
  toString(encoding = "iso") {
    if (encoding === "iso") {
      const outputArray = [];
      outputArray.push(padNumber(this.year, 4));
      outputArray.push(padNumber(this.month, 2));
      outputArray.push(padNumber(this.day, 2));
      outputArray.push(padNumber(this.hour, 2));
      outputArray.push(padNumber(this.minute, 2));
      outputArray.push(padNumber(this.second, 2));
      if (this.millisecond !== 0) {
        outputArray.push(".");
        outputArray.push(padNumber(this.millisecond, 3));
      }
      outputArray.push("Z");
      return outputArray.join("");
    }
    return super.toString(encoding);
  }
  toJSON() {
    return {
      ...super.toJSON(),
      millisecond: this.millisecond
    };
  }
};
_a$5 = GeneralizedTime;
(() => {
  typeStore.GeneralizedTime = _a$5;
})();
GeneralizedTime.NAME = "GeneralizedTime";
var _a$4;
var DATE = class extends Utf8String {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 31;
  }
};
_a$4 = DATE;
(() => {
  typeStore.DATE = _a$4;
})();
DATE.NAME = "DATE";
var _a$3;
var TimeOfDay = class extends Utf8String {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 32;
  }
};
_a$3 = TimeOfDay;
(() => {
  typeStore.TimeOfDay = _a$3;
})();
TimeOfDay.NAME = "TimeOfDay";
var _a$2;
var DateTime = class extends Utf8String {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 33;
  }
};
_a$2 = DateTime;
(() => {
  typeStore.DateTime = _a$2;
})();
DateTime.NAME = "DateTime";
var _a$1;
var Duration = class extends Utf8String {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 34;
  }
};
_a$1 = Duration;
(() => {
  typeStore.Duration = _a$1;
})();
Duration.NAME = "Duration";
var _a;
var TIME = class extends Utf8String {
  constructor(parameters = {}) {
    super(parameters);
    this.idBlock.tagClass = 1;
    this.idBlock.tagNumber = 14;
  }
};
_a = TIME;
(() => {
  typeStore.TIME = _a;
})();
TIME.NAME = "TIME";
var Any = class {
  constructor({ name = EMPTY_STRING, optional = false } = {}) {
    this.name = name;
    this.optional = optional;
  }
};
var Choice = class extends Any {
  constructor({ value = [], ...parameters } = {}) {
    super(parameters);
    this.value = value;
  }
};
var Repeated = class extends Any {
  constructor({ value = new Any(), local = false, ...parameters } = {}) {
    super(parameters);
    this.value = value;
    this.local = local;
  }
};
var RawData = class {
  get data() {
    return this.dataView.slice().buffer;
  }
  set data(value) {
    this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(value);
  }
  constructor({ data = EMPTY_VIEW } = {}) {
    this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(data);
  }
  fromBER(inputBuffer, inputOffset, inputLength) {
    const endLength = inputOffset + inputLength;
    this.dataView = pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer).subarray(inputOffset, endLength);
    return endLength;
  }
  toBER(_sizeOnly) {
    return this.dataView.slice().buffer;
  }
};
function compareSchema(root, inputData, inputSchema) {
  if (inputSchema instanceof Choice) {
    for (const element of inputSchema.value) {
      const result = compareSchema(root, inputData, element);
      if (result.verified) {
        return {
          verified: true,
          result: root
        };
      }
    }
    {
      const _result = {
        verified: false,
        result: { error: "Wrong values for Choice type" }
      };
      if (inputSchema.hasOwnProperty(NAME))
        _result.name = inputSchema.name;
      return _result;
    }
  }
  if (inputSchema instanceof Any) {
    if (inputSchema.hasOwnProperty(NAME))
      root[inputSchema.name] = inputData;
    return {
      verified: true,
      result: root
    };
  }
  if (root instanceof Object === false) {
    return {
      verified: false,
      result: { error: "Wrong root object" }
    };
  }
  if (inputData instanceof Object === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 data" }
    };
  }
  if (inputSchema instanceof Object === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  if (ID_BLOCK in inputSchema === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  if (FROM_BER in inputSchema.idBlock === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  if (TO_BER in inputSchema.idBlock === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  const encodedId = inputSchema.idBlock.toBER(false);
  if (encodedId.byteLength === 0) {
    return {
      verified: false,
      result: { error: "Error encoding idBlock for ASN.1 schema" }
    };
  }
  const decodedOffset = inputSchema.idBlock.fromBER(encodedId, 0, encodedId.byteLength);
  if (decodedOffset === -1) {
    return {
      verified: false,
      result: { error: "Error decoding idBlock for ASN.1 schema" }
    };
  }
  if (inputSchema.idBlock.hasOwnProperty(TAG_CLASS) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  if (inputSchema.idBlock.tagClass !== inputData.idBlock.tagClass) {
    return {
      verified: false,
      result: root
    };
  }
  if (inputSchema.idBlock.hasOwnProperty(TAG_NUMBER) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  if (inputSchema.idBlock.tagNumber !== inputData.idBlock.tagNumber) {
    return {
      verified: false,
      result: root
    };
  }
  if (inputSchema.idBlock.hasOwnProperty(IS_CONSTRUCTED) === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  if (inputSchema.idBlock.isConstructed !== inputData.idBlock.isConstructed) {
    return {
      verified: false,
      result: root
    };
  }
  if (!(IS_HEX_ONLY in inputSchema.idBlock)) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema" }
    };
  }
  if (inputSchema.idBlock.isHexOnly !== inputData.idBlock.isHexOnly) {
    return {
      verified: false,
      result: root
    };
  }
  if (inputSchema.idBlock.isHexOnly) {
    if (VALUE_HEX_VIEW in inputSchema.idBlock === false) {
      return {
        verified: false,
        result: { error: "Wrong ASN.1 schema" }
      };
    }
    const schemaView = inputSchema.idBlock.valueHexView;
    const asn1View = inputData.idBlock.valueHexView;
    if (schemaView.length !== asn1View.length) {
      return {
        verified: false,
        result: root
      };
    }
    for (let i = 0; i < schemaView.length; i++) {
      if (schemaView[i] !== asn1View[1]) {
        return {
          verified: false,
          result: root
        };
      }
    }
  }
  if (inputSchema.name) {
    inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
    if (inputSchema.name)
      root[inputSchema.name] = inputData;
  }
  if (inputSchema instanceof typeStore.Constructed) {
    let admission = 0;
    let result = {
      verified: false,
      result: { error: "Unknown error" }
    };
    let maxLength = inputSchema.valueBlock.value.length;
    if (maxLength > 0) {
      if (inputSchema.valueBlock.value[0] instanceof Repeated) {
        maxLength = inputData.valueBlock.value.length;
      }
    }
    if (maxLength === 0) {
      return {
        verified: true,
        result: root
      };
    }
    if (inputData.valueBlock.value.length === 0 && inputSchema.valueBlock.value.length !== 0) {
      let _optional = true;
      for (let i = 0; i < inputSchema.valueBlock.value.length; i++)
        _optional = _optional && (inputSchema.valueBlock.value[i].optional || false);
      if (_optional) {
        return {
          verified: true,
          result: root
        };
      }
      if (inputSchema.name) {
        inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
        if (inputSchema.name)
          delete root[inputSchema.name];
      }
      root.error = "Inconsistent object length";
      return {
        verified: false,
        result: root
      };
    }
    for (let i = 0; i < maxLength; i++) {
      if (i - admission >= inputData.valueBlock.value.length) {
        if (inputSchema.valueBlock.value[i].optional === false) {
          const _result = {
            verified: false,
            result: root
          };
          root.error = "Inconsistent length between ASN.1 data and schema";
          if (inputSchema.name) {
            inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
            if (inputSchema.name) {
              delete root[inputSchema.name];
              _result.name = inputSchema.name;
            }
          }
          return _result;
        }
      } else {
        if (inputSchema.valueBlock.value[0] instanceof Repeated) {
          result = compareSchema(root, inputData.valueBlock.value[i], inputSchema.valueBlock.value[0].value);
          if (result.verified === false) {
            if (inputSchema.valueBlock.value[0].optional)
              admission++;
            else {
              if (inputSchema.name) {
                inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                if (inputSchema.name)
                  delete root[inputSchema.name];
              }
              return result;
            }
          }
          if (NAME in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].name.length > 0) {
            let arrayRoot = {};
            if (LOCAL in inputSchema.valueBlock.value[0] && inputSchema.valueBlock.value[0].local)
              arrayRoot = inputData;
            else
              arrayRoot = root;
            if (typeof arrayRoot[inputSchema.valueBlock.value[0].name] === "undefined")
              arrayRoot[inputSchema.valueBlock.value[0].name] = [];
            arrayRoot[inputSchema.valueBlock.value[0].name].push(inputData.valueBlock.value[i]);
          }
        } else {
          result = compareSchema(root, inputData.valueBlock.value[i - admission], inputSchema.valueBlock.value[i]);
          if (result.verified === false) {
            if (inputSchema.valueBlock.value[i].optional)
              admission++;
            else {
              if (inputSchema.name) {
                inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
                if (inputSchema.name)
                  delete root[inputSchema.name];
              }
              return result;
            }
          }
        }
      }
    }
    if (result.verified === false) {
      const _result = {
        verified: false,
        result: root
      };
      if (inputSchema.name) {
        inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
        if (inputSchema.name) {
          delete root[inputSchema.name];
          _result.name = inputSchema.name;
        }
      }
      return _result;
    }
    return {
      verified: true,
      result: root
    };
  }
  if (inputSchema.primitiveSchema && VALUE_HEX_VIEW in inputData.valueBlock) {
    const asn1 = localFromBER(inputData.valueBlock.valueHexView);
    if (asn1.offset === -1) {
      const _result = {
        verified: false,
        result: asn1.result
      };
      if (inputSchema.name) {
        inputSchema.name = inputSchema.name.replace(/^\s+|\s+$/g, EMPTY_STRING);
        if (inputSchema.name) {
          delete root[inputSchema.name];
          _result.name = inputSchema.name;
        }
      }
      return _result;
    }
    return compareSchema(root, asn1.result, inputSchema.primitiveSchema);
  }
  return {
    verified: true,
    result: root
  };
}
function verifySchema(inputBuffer, inputSchema) {
  if (inputSchema instanceof Object === false) {
    return {
      verified: false,
      result: { error: "Wrong ASN.1 schema type" }
    };
  }
  const asn1 = localFromBER(pvtsutils.BufferSourceConverter.toUint8Array(inputBuffer));
  if (asn1.offset === -1) {
    return {
      verified: false,
      result: asn1.result
    };
  }
  return compareSchema(asn1.result, asn1.result, inputSchema);
}

// node_modules/@peculiar/utils/build/esm/bytes/buffer-source.js
var ARRAY_BUFFER_TAG = "[object ArrayBuffer]";
var SHARED_ARRAY_BUFFER_TAG = "[object SharedArrayBuffer]";
function tagOf(value) {
  return Object.prototype.toString.call(value);
}
function isArrayBufferViewLike(value) {
  if (ArrayBuffer.isView(value)) {
    return true;
  }
  if (!value || typeof value !== "object") {
    return false;
  }
  const view = value;
  return typeof view.byteOffset === "number" && typeof view.byteLength === "number" && isArrayBufferLike(view.buffer);
}
function isArrayBuffer(value) {
  return tagOf(value) === ARRAY_BUFFER_TAG;
}
function isSharedArrayBuffer(value) {
  return typeof SharedArrayBuffer !== "undefined" && tagOf(value) === SHARED_ARRAY_BUFFER_TAG;
}
function isArrayBufferLike(value) {
  return isArrayBuffer(value) || isSharedArrayBuffer(value);
}
function isArrayBufferView(value) {
  return isArrayBufferViewLike(value);
}
function isBufferSource(value) {
  return isArrayBufferLike(value) || isArrayBufferView(value);
}
function assertBufferSource(value) {
  if (!isBufferSource(value)) {
    throw new TypeError("Expected ArrayBuffer, SharedArrayBuffer, or ArrayBufferView");
  }
}
function toUint8Array(data) {
  assertBufferSource(data);
  if (isArrayBufferLike(data)) {
    return new Uint8Array(data);
  }
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
}
function toArrayBuffer(data) {
  assertBufferSource(data);
  if (isArrayBuffer(data)) {
    return data;
  }
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(toUint8Array(data));
  return buffer;
}

// node_modules/@peculiar/utils/build/esm/bytes/equal.js
function equal(a, b, options = {}) {
  const left = toUint8Array(a);
  const right = toUint8Array(b);
  if (!options.constantTime && left.byteLength !== right.byteLength) {
    return false;
  }
  const length = Math.max(left.byteLength, right.byteLength);
  let diff = left.byteLength ^ right.byteLength;
  for (let i = 0; i < length; i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

// node_modules/@peculiar/utils/build/esm/encoding/binary.js
var binary_exports = {};
__export(binary_exports, {
  binary: () => binary,
  decode: () => decode,
  encode: () => encode2,
  is: () => is
});
function encode2(data) {
  const bytes = toUint8Array(data);
  let result = "";
  for (const byte of bytes) {
    result += String.fromCharCode(byte);
  }
  return result;
}
function decode(text) {
  const result = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) {
    result[i] = text.charCodeAt(i) & 255;
  }
  return result;
}
function is(text) {
  return typeof text === "string";
}
var binary = { encode: encode2, decode, is };

// node_modules/@peculiar/utils/build/esm/encoding/hex.js
var hex_exports = {};
__export(hex_exports, {
  decode: () => decode2,
  encode: () => encode3,
  format: () => format,
  formats: () => formats,
  hex: () => hex,
  is: () => is2,
  normalize: () => normalize,
  parse: () => parse
});
var HEX_CHARACTER_REGEX = /^[0-9a-f]$/i;
var COMMON_SEPARATORS = [" ", "	", "\n", "\r", ":", "-", "."];
function resolveSeparators(options) {
  if (options.separators === "none") {
    return [];
  }
  if (!options.separators || options.separators === "common") {
    return COMMON_SEPARATORS;
  }
  return options.separators;
}
function validateSeparator(separator) {
  if (!separator) {
    throw new TypeError("Hex separators must be non-empty strings");
  }
}
function matchSeparator(text, index, separators) {
  for (const separator of separators) {
    if (text.startsWith(separator, index)) {
      return separator;
    }
  }
  return void 0;
}
function detectCase(text) {
  const hasUpper = /[A-F]/.test(text);
  const hasLower = /[a-f]/.test(text);
  return hasUpper && !hasLower ? "upper" : "lower";
}
function detectLineSeparator(text) {
  const match = /\r\n|\n/.exec(text);
  if (!match) {
    return void 0;
  }
  return match[0] === "\r\n" ? "\r\n" : "\n";
}
function compactForDetection(text) {
  return text.replace(/[^0-9a-f]/gi, "");
}
function detectGroup(text) {
  const segments = text.match(/[0-9A-Fa-f]+|[^0-9A-Fa-f]+/g) ?? [];
  if (segments.length < 3) {
    return void 0;
  }
  const hexSegments = segments.filter((_, index) => index % 2 === 0);
  const separators = segments.filter((_, index) => index % 2 === 1);
  const separator = separators[0];
  if (!separator || separators.some((item) => item !== separator)) {
    return void 0;
  }
  if (hexSegments.some((segment) => segment.length === 0 || segment.length % 2 !== 0)) {
    return void 0;
  }
  const firstLength = hexSegments[0]?.length ?? 0;
  if (!firstLength) {
    return void 0;
  }
  if (hexSegments.slice(0, -1).some((segment) => segment.length !== firstLength)) {
    return void 0;
  }
  if ((hexSegments[hexSegments.length - 1]?.length ?? 0) > firstLength) {
    return void 0;
  }
  return {
    size: firstLength / 2,
    separator
  };
}
function detectFormat(text) {
  const trimmed = text.trim();
  const prefix = /^0x/i.test(trimmed) ? "0x" : "";
  const body = prefix ? trimmed.slice(2) : trimmed;
  const lineSeparator = detectLineSeparator(body);
  const lines = body.split(/\r\n|\n/).filter((line) => line.length > 0);
  const sampleLine = lines[0]?.trim() ?? "";
  const group = detectGroup(sampleLine);
  const format4 = {
    case: detectCase(trimmed),
    prefix
  };
  if (group) {
    format4.group = group;
  }
  if (lineSeparator && lines.length > 1) {
    const firstLineBytes = compactForDetection(lines[0] ?? "").length / 2;
    if (firstLineBytes > 0 && lines.slice(0, -1).every((line) => compactForDetection(line).length / 2 === firstLineBytes)) {
      format4.line = {
        bytesPerLine: firstLineBytes,
        separator: lineSeparator
      };
    }
  }
  return format4;
}
function normalizeText(text, options) {
  const allowPrefix = options.allowPrefix ?? true;
  const separators = [...resolveSeparators(options)].sort((left, right) => right.length - left.length);
  for (const separator of separators) {
    validateSeparator(separator);
  }
  let working = text.trim();
  if (/^0x/i.test(working)) {
    if (!allowPrefix) {
      throw new TypeError("Hexadecimal text must not include a 0x prefix");
    }
    working = working.slice(2);
  }
  let normalized = "";
  let lastTokenWasSeparator = false;
  for (let index = 0; index < working.length; ) {
    const character = working[index] ?? "";
    if (HEX_CHARACTER_REGEX.test(character)) {
      normalized += character;
      lastTokenWasSeparator = false;
      index += 1;
      continue;
    }
    const separator = matchSeparator(working, index, separators);
    if (!separator) {
      throw new TypeError("Input is not valid hexadecimal text");
    }
    if (options.strict && (lastTokenWasSeparator || normalized.length === 0)) {
      throw new TypeError("Hexadecimal text contains misplaced separators");
    }
    lastTokenWasSeparator = true;
    index += separator.length;
  }
  if (options.strict && lastTokenWasSeparator && normalized.length > 0) {
    throw new TypeError("Hexadecimal text must not end with a separator");
  }
  if (normalized.length % 2 !== 0) {
    if (!options.allowOddLength) {
      throw new TypeError("Hexadecimal text must contain an even number of characters");
    }
    normalized = `0${normalized}`;
  }
  return normalized.toLowerCase();
}
function groupPairs(pairs, group) {
  if (!group) {
    return pairs.join("");
  }
  if (!Number.isInteger(group.size) || group.size < 1) {
    throw new RangeError("Hex group size must be a positive integer");
  }
  const chunks = [];
  for (let index = 0; index < pairs.length; index += group.size) {
    chunks.push(pairs.slice(index, index + group.size).join(""));
  }
  return chunks.join(group.separator);
}
function normalize(text, options = {}) {
  return normalizeText(text, options);
}
function is2(text, options = {}) {
  if (typeof text !== "string") {
    return false;
  }
  try {
    normalize(text, options);
    return true;
  } catch {
    return false;
  }
}
function encode3(data, options = {}) {
  const bytes = toUint8Array(data);
  const casing = options.case ?? "lower";
  const pairs = Array.from(bytes, (byte) => {
    const text = byte.toString(16).padStart(2, "0");
    return casing === "upper" ? text.toUpperCase() : text;
  });
  let body = "";
  if (options.line) {
    const bytesPerLine = options.line.bytesPerLine;
    if (!Number.isInteger(bytesPerLine) || bytesPerLine < 1) {
      throw new RangeError("Hex bytesPerLine must be a positive integer");
    }
    const separator = options.line.separator ?? "\n";
    const lines = [];
    for (let index = 0; index < pairs.length; index += bytesPerLine) {
      lines.push(groupPairs(pairs.slice(index, index + bytesPerLine), options.group));
    }
    body = lines.join(separator);
  } else {
    body = groupPairs(pairs, options.group);
  }
  return `${options.prefix ?? ""}${body}`;
}
function decode2(text, options = {}) {
  const normalized = normalize(text, options);
  const result = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    result[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return result;
}
function parse(text, options = {}) {
  const normalized = normalize(text, options);
  return {
    bytes: decode2(normalized),
    format: detectFormat(text),
    normalized
  };
}
function format(data, value) {
  return encode3(data, value);
}
var formats = {
  compact: Object.freeze({}),
  upper: Object.freeze({ case: "upper" }),
  colon: Object.freeze({ group: { size: 1, separator: ":" } }),
  colonUpper: Object.freeze({ case: "upper", group: { size: 1, separator: ":" } }),
  groupsOf4: Object.freeze({ group: { size: 4, separator: " " } }),
  prefixed: Object.freeze({ prefix: "0x" })
};
var hex = { encode: encode3, decode: decode2, format, formats, is: is2, normalize, parse };

// node_modules/@peculiar/utils/build/esm/encoding/utf8.js
var utf8_exports = {};
__export(utf8_exports, {
  decode: () => decode3,
  encode: () => encode4,
  utf8: () => utf8
});
function encode4(text) {
  return new TextEncoder().encode(text);
}
function decode3(data) {
  return new TextDecoder("utf-8", { fatal: false }).decode(toUint8Array(data));
}
var utf8 = { encode: encode4, decode: decode3 };

// node_modules/@peculiar/utils/build/esm/encoding/utf16.js
var utf16_exports = {};
__export(utf16_exports, {
  decode: () => decode4,
  encode: () => encode5,
  utf16: () => utf16
});
function encode5(text, options = {}) {
  const result = new ArrayBuffer(text.length * 2);
  const view = new DataView(result);
  for (let i = 0; i < text.length; i++) {
    view.setUint16(i * 2, text.charCodeAt(i), options.littleEndian ?? false);
  }
  return new Uint8Array(result);
}
function decode4(data, options = {}) {
  const buffer = toArrayBuffer(data);
  const view = new DataView(buffer);
  let result = "";
  for (let i = 0; i < buffer.byteLength; i += 2) {
    result += String.fromCharCode(view.getUint16(i, options.littleEndian ?? false));
  }
  return result;
}
var utf16 = { encode: encode5, decode: decode4 };

// node_modules/@peculiar/utils/build/esm/encoding/base64.js
var base64_exports = {};
__export(base64_exports, {
  base64: () => base642,
  decode: () => decode5,
  encode: () => encode6,
  is: () => is3,
  normalize: () => normalize2,
  pad: () => pad
});
var BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
function nodeBuffer() {
  return globalThis.Buffer;
}
function normalize2(text) {
  return text.replace(/[\n\r\t ]/g, "");
}
function pad(text) {
  const remainder = text.length % 4;
  return remainder ? text + "=".repeat(4 - remainder) : text;
}
function is3(text) {
  if (typeof text !== "string") {
    return false;
  }
  const normalized = normalize2(text);
  return normalized === "" || BASE64_REGEX.test(normalized);
}
function encode6(data, _options) {
  const bytes = toUint8Array(data);
  const buffer = nodeBuffer();
  if (buffer) {
    return buffer.from(bytes).toString("base64");
  }
  return btoa(encode2(bytes));
}
function decode5(text, _options) {
  const normalized = normalize2(text);
  if (!is3(normalized)) {
    throw new TypeError("Input is not valid Base64 text");
  }
  const buffer = nodeBuffer();
  if (buffer) {
    return new Uint8Array(buffer.from(normalized, "base64"));
  }
  return decode(atob(normalized));
}
var base642 = { encode: encode6, decode: decode5, is: is3, normalize: normalize2, pad };

// node_modules/@peculiar/utils/build/esm/encoding/base64url.js
var base64url_exports = {};
__export(base64url_exports, {
  base64url: () => base64url,
  decode: () => decode6,
  encode: () => encode7,
  is: () => is4,
  normalize: () => normalize3
});
var BASE64URL_REGEX = /^[A-Za-z0-9_-]*$/;
function normalize3(text) {
  return text.replace(/[\n\r\t ]/g, "");
}
function is4(text) {
  return typeof text === "string" && BASE64URL_REGEX.test(normalize3(text));
}
function encode7(data, _options) {
  return base642.encode(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function decode6(text, _options) {
  const normalized = normalize3(text);
  if (!is4(normalized)) {
    throw new TypeError("Input is not valid Base64Url text");
  }
  return base642.decode(base642.pad(normalized.replace(/-/g, "+").replace(/_/g, "/")));
}
var base64url = { encode: encode7, decode: decode6, is: is4, normalize: normalize3 };

// node_modules/@peculiar/utils/build/esm/pem/pem.js
var LABEL_REGEX = /^[A-Z0-9][A-Z0-9 ._-]*[A-Z0-9]$/i;
var PEM_BLOCK_REGEX = /-----BEGIN ([^-]+)-----([\s\S]*?)-----END \1-----/g;
function assertLabel(label) {
  if (!LABEL_REGEX.test(label)) {
    throw new TypeError(`Invalid PEM label '${label}'`);
  }
}
function wrap(text, lineLength) {
  const result = [];
  for (let i = 0; i < text.length; i += lineLength) {
    result.push(text.slice(i, i + lineLength));
  }
  return result;
}
function parseBody(body) {
  const normalized = body.trim().replace(/\r\n/g, "\n");
  const lines = normalized.split("\n").map((line) => line.trim()).filter(Boolean);
  const headers = {};
  let index = 0;
  for (; index < lines.length; index++) {
    const line = lines[index];
    const separator = line.indexOf(":");
    if (separator <= 0) {
      break;
    }
    headers[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }
  return {
    headers: Object.keys(headers).length ? headers : void 0,
    base64Lines: lines.slice(index),
    base64Text: lines.slice(index).join("")
  };
}
function detectNewline(text) {
  return /\r\n/.test(text) ? "\r\n" : "\n";
}
function collectBlocks(text, options = {}) {
  const blocks = [];
  const requestedLabel = options.label;
  let match;
  PEM_BLOCK_REGEX.lastIndex = 0;
  while (match = PEM_BLOCK_REGEX.exec(text)) {
    const label = match[1].trim();
    if (requestedLabel && label !== requestedLabel) {
      continue;
    }
    assertLabel(label);
    const parsed = parseBody(match[2]);
    blocks.push({
      label,
      data: base642.decode(parsed.base64Text),
      headers: parsed.headers,
      lineLength: parsed.base64Lines[0]?.length ?? 64,
      newline: detectNewline(match[0])
    });
  }
  if (options.strict && blocks.length === 0) {
    throw new TypeError(requestedLabel ? `No PEM block with label '${requestedLabel}' was found` : "No PEM blocks were found");
  }
  return blocks;
}
function encode8(label, data, options = {}) {
  assertLabel(label);
  const lineLength = options.lineLength ?? 64;
  if (!Number.isInteger(lineLength) || lineLength < 1) {
    throw new RangeError("PEM lineLength must be a positive integer");
  }
  const newline = options.newline ?? "\n";
  const lines = [`-----BEGIN ${label}-----`];
  if (options.headers) {
    for (const [name, value] of Object.entries(options.headers)) {
      lines.push(`${name}: ${value}`);
    }
    lines.push("");
  }
  lines.push(...wrap(base642.encode(data), lineLength));
  lines.push(`-----END ${label}-----`);
  return `${lines.join(newline)}${newline}`;
}
function decode7(text, options = {}) {
  return collectBlocks(text, options).map(({ lineLength: _lineLength, newline: _newline, ...block }) => block);
}
function decodeFirst2(text, label) {
  const [block] = decode7(text, { label, strict: true });
  return block.data;
}
function parse2(text, options = {}) {
  const [block] = collectBlocks(text, { ...options, strict: true });
  const format4 = {
    label: block.label,
    headers: block.headers,
    lineLength: block.lineLength,
    newline: block.newline
  };
  return {
    bytes: block.data,
    format: format4,
    normalized: encode8(block.label, block.data, format4)
  };
}
function format2(data, value) {
  return encode8(value.label, data, value);
}
var pemConverter = {
  name: "pem",
  encode: (data, options) => {
    if (!options?.label) {
      throw new TypeError("PEM label is required");
    }
    return encode8(options.label, data, options);
  },
  decode: (text, options) => decodeFirst2(text, options?.label),
  format: format2,
  is: (text) => typeof text === "string" && /-----BEGIN [^-]+-----/.test(text),
  parse: parse2
};

// node_modules/@peculiar/utils/build/esm/converters/registry.js
function keyOf(name) {
  return name.trim().toLowerCase();
}
function toError(error) {
  return error instanceof Error ? error : new Error(String(error));
}
function removeConverter(converters, primaryNames, converter) {
  for (const alias of [converter.name, ...converter.aliases ?? []]) {
    converters.delete(keyOf(alias));
  }
  primaryNames.delete(keyOf(converter.name));
}
function requireCapability(converter, name, capability) {
  const method = converter[capability];
  if (typeof method !== "function") {
    throw new Error(`Converter '${name}' does not support ${capability}()`);
  }
  return method;
}
function detectConfidence(name, text, converter) {
  const normalizedName = keyOf(converter.name || name);
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }
  let accepted = false;
  if (converter.is) {
    accepted = converter.is(text);
  }
  let decodable = false;
  try {
    converter.decode(text);
    decodable = true;
  } catch {
    decodable = false;
  }
  if (!accepted && !decodable) {
    return 0;
  }
  switch (normalizedName) {
    case "pem":
      return /-----BEGIN [^-]+-----/.test(text) ? 1 : 0;
    case "hex": {
      const compact = trimmed.replace(/^0x/i, "").replace(/[\s:.-]/g, "");
      if (!compact || /[^0-9a-f]/i.test(compact) || compact.length % 2 !== 0) {
        return 0;
      }
      if (/^0x/i.test(trimmed) || /[:\s.-]/.test(trimmed)) {
        return 0.95;
      }
      if (/[a-f]/.test(trimmed) || /[A-F]/.test(trimmed)) {
        return 0.8;
      }
      return 0.45;
    }
    case "base64url":
      if (/[-_]/.test(trimmed)) {
        return 0.95;
      }
      if (/=/.test(trimmed)) {
        return 0.1;
      }
      return 0.6;
    case "base64":
      if (/[+/=]/.test(trimmed)) {
        return 0.9;
      }
      return 0.55;
    case "binary":
    case "utf8":
    case "utf16be":
    case "utf16le":
      return 0;
    default:
      return accepted && decodable ? 0.75 : 0.5;
  }
}
function createConverterRegistry(initialConverters = []) {
  const converters = /* @__PURE__ */ new Map();
  const primaryNames = /* @__PURE__ */ new Set();
  const api = {
    register(converter, options = {}) {
      if (!converter.name || !keyOf(converter.name)) {
        throw new TypeError("Converter name is required");
      }
      const names2 = [...new Set([converter.name, ...converter.aliases ?? []].map(keyOf))];
      const conflicts = /* @__PURE__ */ new Set();
      for (const name of names2) {
        const existing = converters.get(name);
        if (!existing) {
          continue;
        }
        if (!options.override) {
          throw new Error(`Converter '${name}' is already registered`);
        }
        conflicts.add(existing);
      }
      for (const conflicting of conflicts) {
        removeConverter(converters, primaryNames, conflicting);
      }
      for (const name of names2) {
        converters.set(name, converter);
      }
      primaryNames.add(keyOf(converter.name));
      return this;
    },
    unregister(name) {
      const converter = converters.get(keyOf(name));
      if (!converter) {
        return false;
      }
      removeConverter(converters, primaryNames, converter);
      return true;
    },
    has(name) {
      return converters.has(keyOf(name));
    },
    get(name) {
      const converter = converters.get(keyOf(name));
      if (!converter) {
        throw new Error(`Converter '${name}' is not registered`);
      }
      return converter;
    },
    list() {
      return [...primaryNames].map((name) => this.get(name));
    },
    encode(name, data, options) {
      return this.get(name).encode(data, options);
    },
    decode(name, text, options) {
      return this.get(name).decode(text, options);
    },
    tryDecode(name, text, options) {
      try {
        return { ok: true, bytes: this.decode(name, text, options) };
      } catch (error) {
        return { ok: false, error: toError(error) };
      }
    },
    normalize(name, text, options) {
      const converter = this.get(name);
      return requireCapability(converter, name, "normalize").call(converter, text, options);
    },
    parse(name, text, options) {
      const converter = this.get(name);
      return requireCapability(converter, name, "parse").call(converter, text, options);
    },
    format(name, data, format4) {
      const converter = this.get(name);
      return requireCapability(converter, name, "format").call(converter, data, format4);
    },
    transcode(text, options) {
      const bytes = this.decode(options.from, text, options.fromOptions);
      return this.encode(options.to, bytes, options.toOptions);
    },
    detect(text, options = {}) {
      const formatNames = options.formats?.length ? options.formats.map((name) => String(name)) : this.list().map((converter) => converter.name).filter((name) => !["binary", "utf8", "utf16be", "utf16le"].includes(keyOf(name)));
      const detections = /* @__PURE__ */ new Map();
      for (const requestedName of formatNames) {
        const converter = this.get(requestedName);
        const confidence = detectConfidence(requestedName, text, converter);
        if (confidence <= 0) {
          continue;
        }
        const format4 = converter.name;
        const current = detections.get(format4);
        if (!current || confidence > current.confidence) {
          detections.set(format4, { format: format4, confidence });
        }
      }
      return [...detections.values()].sort((left, right) => right.confidence - left.confidence);
    }
  };
  for (const converter of initialConverters) {
    api.register(converter);
  }
  return api;
}

// node_modules/@peculiar/utils/build/esm/converters/defaults.js
var binaryConverter = {
  name: "binary",
  aliases: ["latin1"],
  encode: binary_exports.encode,
  decode: binary_exports.decode,
  is: binary_exports.is
};
var hexConverter = {
  name: "hex",
  encode: hex_exports.encode,
  decode: hex_exports.decode,
  format: hex_exports.format,
  is: hex_exports.is,
  normalize: hex_exports.normalize,
  parse: hex_exports.parse
};
var base64Converter = {
  name: "base64",
  aliases: ["b64"],
  encode: base64_exports.encode,
  decode: base64_exports.decode,
  is: base64_exports.is,
  normalize: base64_exports.normalize
};
var base64urlConverter = {
  name: "base64url",
  aliases: ["base64-url", "b64url"],
  encode: base64url_exports.encode,
  decode: base64url_exports.decode,
  is: base64url_exports.is,
  normalize: base64url_exports.normalize
};
var utf8Converter = {
  name: "utf8",
  aliases: ["utf-8"],
  encode: (data) => utf8_exports.decode(data),
  decode: (text) => utf8_exports.encode(text),
  is: (text) => typeof text === "string"
};
var utf16beConverter = {
  name: "utf16be",
  aliases: ["utf16", "utf-16", "utf-16be"],
  encode: (data) => utf16_exports.decode(data),
  decode: (text) => utf16_exports.encode(text),
  is: (text) => typeof text === "string"
};
var utf16leConverter = {
  name: "utf16le",
  aliases: ["utf-16le", "ucs2", "usc2"],
  encode: (data) => utf16_exports.decode(data, { littleEndian: true }),
  decode: (text) => utf16_exports.encode(text, { littleEndian: true }),
  is: (text) => typeof text === "string"
};
var defaultConverters = [
  binaryConverter,
  hexConverter,
  base64Converter,
  base64urlConverter,
  utf8Converter,
  utf16beConverter,
  utf16leConverter,
  pemConverter
];
var defaultConverterRegistry = createConverterRegistry(defaultConverters);

// node_modules/@peculiar/utils/build/esm/converters/convert.js
function encode9(name, data, ...args) {
  return defaultConverterRegistry.encode(name, data, ...args);
}
function decode8(name, text, ...args) {
  return defaultConverterRegistry.decode(name, text, ...args);
}
function tryDecode(name, text, ...args) {
  return defaultConverterRegistry.tryDecode(name, text, ...args);
}
function normalize4(name, text, ...args) {
  return defaultConverterRegistry.normalize(name, text, ...args);
}
function parse3(name, text, ...args) {
  return defaultConverterRegistry.parse(name, text, ...args);
}
function format3(name, data, value) {
  return defaultConverterRegistry.format(name, data, value);
}
function transcode(text, options) {
  return defaultConverterRegistry.transcode(text, options);
}
function detect(text, options) {
  return defaultConverterRegistry.detect(text, options);
}
function normalizeEncodingName(encoding) {
  return encoding.toLowerCase();
}
var convert = {
  encode: encode9,
  decode: decode8,
  tryDecode,
  normalize: normalize4,
  parse: parse3,
  format: format3,
  transcode,
  detect,
  to(format4, data, ...args) {
    return encode9(format4, data, ...args);
  },
  from(format4, text, ...args) {
    return decode8(format4, text, ...args);
  },
  toString(data, encoding = "utf8") {
    return encode9(encoding, data);
  },
  fromString(text, encoding = "utf8") {
    if (normalizeEncodingName(encoding) === "hex") {
      return toArrayBuffer(hex_exports.decode(text, { allowOddLength: true }));
    }
    return toArrayBuffer(decode8(encoding, text));
  },
  toBase64: base64_exports.encode,
  fromBase64: (text) => toArrayBuffer(base64_exports.decode(text)),
  toBase64Url: base64url_exports.encode,
  fromBase64Url: (text) => toArrayBuffer(base64url_exports.decode(text)),
  toHex: hex_exports.encode,
  fromHex: (text) => toArrayBuffer(hex_exports.decode(text, { allowOddLength: true })),
  toBinary: binary_exports.encode,
  fromBinary: (text) => toArrayBuffer(binary_exports.decode(text)),
  toUtf8String: utf8_exports.decode,
  fromUtf8String: (text) => toArrayBuffer(utf8_exports.encode(text)),
  toUtf16String: (data, littleEndian = false) => utf16_exports.decode(data, { littleEndian }),
  fromUtf16String: (text, littleEndian = false) => toArrayBuffer(utf16_exports.encode(text, { littleEndian })),
  isHex: hex_exports.is,
  isBase64: base64_exports.is,
  isBase64Url: base64url_exports.is,
  formatString: base64_exports.normalize
};

// node_modules/@peculiar/asn1-schema/build/es2015/enums.js
var AsnTypeTypes;
(function(AsnTypeTypes2) {
  AsnTypeTypes2[AsnTypeTypes2["Sequence"] = 0] = "Sequence";
  AsnTypeTypes2[AsnTypeTypes2["Set"] = 1] = "Set";
  AsnTypeTypes2[AsnTypeTypes2["Choice"] = 2] = "Choice";
})(AsnTypeTypes || (AsnTypeTypes = {}));
var AsnPropTypes;
(function(AsnPropTypes2) {
  AsnPropTypes2[AsnPropTypes2["Any"] = 1] = "Any";
  AsnPropTypes2[AsnPropTypes2["Boolean"] = 2] = "Boolean";
  AsnPropTypes2[AsnPropTypes2["OctetString"] = 3] = "OctetString";
  AsnPropTypes2[AsnPropTypes2["BitString"] = 4] = "BitString";
  AsnPropTypes2[AsnPropTypes2["Integer"] = 5] = "Integer";
  AsnPropTypes2[AsnPropTypes2["Enumerated"] = 6] = "Enumerated";
  AsnPropTypes2[AsnPropTypes2["ObjectIdentifier"] = 7] = "ObjectIdentifier";
  AsnPropTypes2[AsnPropTypes2["Utf8String"] = 8] = "Utf8String";
  AsnPropTypes2[AsnPropTypes2["BmpString"] = 9] = "BmpString";
  AsnPropTypes2[AsnPropTypes2["UniversalString"] = 10] = "UniversalString";
  AsnPropTypes2[AsnPropTypes2["NumericString"] = 11] = "NumericString";
  AsnPropTypes2[AsnPropTypes2["PrintableString"] = 12] = "PrintableString";
  AsnPropTypes2[AsnPropTypes2["TeletexString"] = 13] = "TeletexString";
  AsnPropTypes2[AsnPropTypes2["VideotexString"] = 14] = "VideotexString";
  AsnPropTypes2[AsnPropTypes2["IA5String"] = 15] = "IA5String";
  AsnPropTypes2[AsnPropTypes2["GraphicString"] = 16] = "GraphicString";
  AsnPropTypes2[AsnPropTypes2["VisibleString"] = 17] = "VisibleString";
  AsnPropTypes2[AsnPropTypes2["GeneralString"] = 18] = "GeneralString";
  AsnPropTypes2[AsnPropTypes2["CharacterString"] = 19] = "CharacterString";
  AsnPropTypes2[AsnPropTypes2["UTCTime"] = 20] = "UTCTime";
  AsnPropTypes2[AsnPropTypes2["GeneralizedTime"] = 21] = "GeneralizedTime";
  AsnPropTypes2[AsnPropTypes2["DATE"] = 22] = "DATE";
  AsnPropTypes2[AsnPropTypes2["TimeOfDay"] = 23] = "TimeOfDay";
  AsnPropTypes2[AsnPropTypes2["DateTime"] = 24] = "DateTime";
  AsnPropTypes2[AsnPropTypes2["Duration"] = 25] = "Duration";
  AsnPropTypes2[AsnPropTypes2["TIME"] = 26] = "TIME";
  AsnPropTypes2[AsnPropTypes2["Null"] = 27] = "Null";
  AsnPropTypes2[AsnPropTypes2["RelativeObjectIdentifier"] = 28] = "RelativeObjectIdentifier";
})(AsnPropTypes || (AsnPropTypes = {}));

// node_modules/@peculiar/asn1-schema/build/es2015/types/bit_string.js
var BitString2 = class {
  unusedBits = 0;
  value = new ArrayBuffer(0);
  constructor(params, unusedBits = 0) {
    if (params) {
      if (typeof params === "number") {
        this.fromNumber(params);
      } else if (isBufferSource(params)) {
        this.unusedBits = unusedBits;
        this.value = toArrayBuffer(params);
      } else {
        throw TypeError("Unsupported type of 'params' argument for BitString");
      }
    }
  }
  fromASN(asn) {
    if (!(asn instanceof BitString)) {
      throw new TypeError("Argument 'asn' is not instance of ASN.1 BitString");
    }
    this.unusedBits = asn.valueBlock.unusedBits;
    this.value = toArrayBuffer(asn.valueBlock.valueHex);
    return this;
  }
  toASN() {
    return new BitString({
      unusedBits: this.unusedBits,
      valueHex: this.value
    });
  }
  toSchema(name) {
    return new BitString({ name });
  }
  toNumber() {
    let res = "";
    const uintArray = new Uint8Array(this.value);
    for (const octet of uintArray) {
      res += octet.toString(2).padStart(8, "0");
    }
    res = res.split("").reverse().join("");
    if (this.unusedBits) {
      res = res.slice(this.unusedBits).padStart(this.unusedBits, "0");
    }
    return parseInt(res, 2);
  }
  fromNumber(value) {
    let bits = value.toString(2);
    const octetSize = bits.length + 7 >> 3;
    this.unusedBits = (octetSize << 3) - bits.length;
    const octets = new Uint8Array(octetSize);
    bits = bits.padStart(octetSize << 3, "0").split("").reverse().join("");
    let index = 0;
    while (index < octetSize) {
      octets[index] = parseInt(bits.slice(index << 3, (index << 3) + 8), 2);
      index++;
    }
    this.value = octets.buffer;
  }
};

// node_modules/@peculiar/asn1-schema/build/es2015/types/octet_string.js
var OctetString2 = class {
  buffer;
  get byteLength() {
    return this.buffer.byteLength;
  }
  get byteOffset() {
    return 0;
  }
  constructor(param) {
    if (typeof param === "number") {
      this.buffer = new ArrayBuffer(param);
    } else {
      if (isBufferSource(param)) {
        this.buffer = toArrayBuffer(param);
      } else if (Array.isArray(param)) {
        this.buffer = new Uint8Array(param).buffer;
      } else {
        this.buffer = new ArrayBuffer(0);
      }
    }
  }
  fromASN(asn) {
    if (!(asn instanceof OctetString)) {
      throw new TypeError("Argument 'asn' is not instance of ASN.1 OctetString");
    }
    this.buffer = toArrayBuffer(asn.valueBlock.valueHex);
    return this;
  }
  toASN() {
    return new OctetString({ valueHex: this.buffer });
  }
  toSchema(name) {
    return new OctetString({ name });
  }
};

// node_modules/@peculiar/asn1-schema/build/es2015/converters.js
var AsnAnyConverter = {
  fromASN: (value) => value instanceof Null ? null : toArrayBuffer(value.valueBeforeDecodeView),
  toASN: (value) => {
    if (value === null) {
      return new Null();
    }
    const schema = fromBER(value);
    if (schema.result.error) {
      throw new Error(schema.result.error);
    }
    return schema.result;
  }
};
var AsnIntegerConverter = {
  fromASN: (value) => value.valueBlock.valueHexView.byteLength >= 4 ? value.valueBlock.toString() : value.valueBlock.valueDec,
  toASN: (value) => new Integer({ value: +value })
};
var AsnEnumeratedConverter = {
  fromASN: (value) => value.valueBlock.valueDec,
  toASN: (value) => new Enumerated({ value })
};
var AsnIntegerArrayBufferConverter = {
  fromASN: (value) => toArrayBuffer(value.valueBlock.valueHexView),
  toASN: (value) => new Integer({ valueHex: value })
};
var AsnBitStringConverter = {
  fromASN: (value) => toArrayBuffer(value.valueBlock.valueHexView),
  toASN: (value) => new BitString({ valueHex: value })
};
var AsnObjectIdentifierConverter = {
  fromASN: (value) => value.valueBlock.toString(),
  toASN: (value) => new ObjectIdentifier({ value })
};
var AsnRelativeObjectIdentifierConverter = {
  fromASN: (value) => value.valueBlock.toString(),
  toASN: (value) => new RelativeObjectIdentifier({ value })
};
var AsnBooleanConverter = {
  fromASN: (value) => value.valueBlock.value,
  toASN: (value) => new Boolean2({ value })
};
var AsnOctetStringConverter = {
  fromASN: (value) => toArrayBuffer(value.valueBlock.valueHexView),
  toASN: (value) => new OctetString({ valueHex: value })
};
var AsnConstructedOctetStringConverter = {
  fromASN: (value) => new OctetString2(value.getValue()),
  toASN: (value) => value.toASN()
};
function createStringConverter(Asn1Type) {
  return {
    fromASN: (value) => value.valueBlock.value,
    toASN: (value) => new Asn1Type({ value })
  };
}
var AsnUtf8StringConverter = createStringConverter(Utf8String);
var AsnBmpStringConverter = createStringConverter(BmpString);
var AsnUniversalStringConverter = createStringConverter(UniversalString);
var AsnNumericStringConverter = createStringConverter(NumericString);
var AsnPrintableStringConverter = createStringConverter(PrintableString);
var AsnTeletexStringConverter = createStringConverter(TeletexString);
var AsnVideotexStringConverter = createStringConverter(VideotexString);
var AsnIA5StringConverter = createStringConverter(IA5String);
var AsnGraphicStringConverter = createStringConverter(GraphicString);
var AsnVisibleStringConverter = createStringConverter(VisibleString);
var AsnGeneralStringConverter = createStringConverter(GeneralString);
var AsnCharacterStringConverter = createStringConverter(CharacterString);
var AsnUTCTimeConverter = {
  fromASN: (value) => value.toDate(),
  toASN: (value) => new UTCTime({ valueDate: value })
};
var AsnGeneralizedTimeConverter = {
  fromASN: (value) => value.toDate(),
  toASN: (value) => new GeneralizedTime({ valueDate: value })
};
var AsnNullConverter = {
  fromASN: () => null,
  toASN: () => {
    return new Null();
  }
};
function defaultConverter(type) {
  switch (type) {
    case AsnPropTypes.Any:
      return AsnAnyConverter;
    case AsnPropTypes.BitString:
      return AsnBitStringConverter;
    case AsnPropTypes.BmpString:
      return AsnBmpStringConverter;
    case AsnPropTypes.Boolean:
      return AsnBooleanConverter;
    case AsnPropTypes.CharacterString:
      return AsnCharacterStringConverter;
    case AsnPropTypes.Enumerated:
      return AsnEnumeratedConverter;
    case AsnPropTypes.GeneralString:
      return AsnGeneralStringConverter;
    case AsnPropTypes.GeneralizedTime:
      return AsnGeneralizedTimeConverter;
    case AsnPropTypes.GraphicString:
      return AsnGraphicStringConverter;
    case AsnPropTypes.IA5String:
      return AsnIA5StringConverter;
    case AsnPropTypes.Integer:
      return AsnIntegerConverter;
    case AsnPropTypes.Null:
      return AsnNullConverter;
    case AsnPropTypes.NumericString:
      return AsnNumericStringConverter;
    case AsnPropTypes.ObjectIdentifier:
      return AsnObjectIdentifierConverter;
    case AsnPropTypes.RelativeObjectIdentifier:
      return AsnRelativeObjectIdentifierConverter;
    case AsnPropTypes.OctetString:
      return AsnOctetStringConverter;
    case AsnPropTypes.PrintableString:
      return AsnPrintableStringConverter;
    case AsnPropTypes.TeletexString:
      return AsnTeletexStringConverter;
    case AsnPropTypes.UTCTime:
      return AsnUTCTimeConverter;
    case AsnPropTypes.UniversalString:
      return AsnUniversalStringConverter;
    case AsnPropTypes.Utf8String:
      return AsnUtf8StringConverter;
    case AsnPropTypes.VideotexString:
      return AsnVideotexStringConverter;
    case AsnPropTypes.VisibleString:
      return AsnVisibleStringConverter;
    default:
      return null;
  }
}

// node_modules/@peculiar/asn1-schema/build/es2015/helper.js
function isConvertible(target) {
  if (typeof target === "function" && target.prototype) {
    if (target.prototype.toASN && target.prototype.fromASN) {
      return true;
    } else {
      return isConvertible(target.prototype);
    }
  } else {
    return !!(target && typeof target === "object" && "toASN" in target && "fromASN" in target);
  }
}
function isTypeOfArray(target) {
  if (target) {
    const proto = Object.getPrototypeOf(target);
    if (proto?.prototype?.constructor === Array) {
      return true;
    }
    return isTypeOfArray(proto);
  }
  return false;
}
function isArrayEqual(bytes1, bytes2) {
  if (!(bytes1 && bytes2)) {
    return false;
  }
  if (bytes1.byteLength !== bytes2.byteLength) {
    return false;
  }
  const b1 = new Uint8Array(bytes1);
  const b2 = new Uint8Array(bytes2);
  for (let i = 0; i < bytes1.byteLength; i++) {
    if (b1[i] !== b2[i]) {
      return false;
    }
  }
  return true;
}

// node_modules/@peculiar/asn1-schema/build/es2015/schema.js
var AsnSchemaStorage = class {
  items = /* @__PURE__ */ new WeakMap();
  has(target) {
    return this.items.has(target);
  }
  get(target, checkSchema = false) {
    const schema = this.items.get(target);
    if (!schema) {
      throw new Error(`Cannot get schema for '${target.prototype.constructor.name}' target`);
    }
    if (checkSchema && !schema.schema) {
      throw new Error(`Schema '${target.prototype.constructor.name}' doesn't contain ASN.1 schema. Call 'AsnSchemaStorage.cache'.`);
    }
    return schema;
  }
  cache(target) {
    const schema = this.get(target);
    if (!schema.schema) {
      schema.schema = this.create(target, true);
    }
  }
  createDefault(target) {
    const schema = {
      type: AsnTypeTypes.Sequence,
      items: {}
    };
    const parentSchema = this.findParentSchema(target);
    if (parentSchema) {
      Object.assign(schema, parentSchema);
      schema.items = Object.assign({}, schema.items, parentSchema.items);
    }
    return schema;
  }
  create(target, useNames) {
    const schema = this.items.get(target) || this.createDefault(target);
    const asn1Value = [];
    for (const key in schema.items) {
      const item = schema.items[key];
      const name = useNames ? key : "";
      let asn1Item;
      if (typeof item.type === "number") {
        const Asn1TypeName = AsnPropTypes[item.type];
        const Asn1Type = index_es_exports[Asn1TypeName];
        if (!Asn1Type) {
          throw new Error(`Cannot get ASN1 class by name '${Asn1TypeName}'`);
        }
        asn1Item = new Asn1Type({ name });
      } else if (isConvertible(item.type)) {
        const instance2 = new item.type();
        asn1Item = instance2.toSchema(name);
      } else if (item.optional) {
        const itemSchema = this.get(item.type);
        if (itemSchema.type === AsnTypeTypes.Choice) {
          asn1Item = new Any({ name });
        } else {
          asn1Item = this.create(item.type, false);
          asn1Item.name = name;
        }
      } else {
        asn1Item = new Any({ name });
      }
      const optional = !!item.optional || item.defaultValue !== void 0;
      if (item.repeated) {
        asn1Item.name = "";
        const Container = item.repeated === "set" ? Set2 : Sequence;
        asn1Item = new Container({
          name: "",
          value: [
            new Repeated({
              name,
              value: asn1Item
            })
          ]
        });
      }
      if (item.context !== null && item.context !== void 0) {
        if (item.implicit) {
          if (typeof item.type === "number" || isConvertible(item.type)) {
            const Container = item.repeated ? Constructed : Primitive;
            asn1Value.push(new Container({
              name,
              optional,
              idBlock: {
                tagClass: 3,
                tagNumber: item.context
              }
            }));
          } else {
            this.cache(item.type);
            const isRepeated = !!item.repeated;
            let value = !isRepeated ? this.get(item.type, true).schema : asn1Item;
            value = "valueBlock" in value ? value.valueBlock.value : value.value;
            asn1Value.push(new Constructed({
              name: !isRepeated ? name : "",
              optional,
              idBlock: {
                tagClass: 3,
                tagNumber: item.context
              },
              value
            }));
          }
        } else {
          asn1Value.push(new Constructed({
            optional,
            idBlock: {
              tagClass: 3,
              tagNumber: item.context
            },
            value: [asn1Item]
          }));
        }
      } else {
        asn1Item.optional = optional;
        asn1Value.push(asn1Item);
      }
    }
    switch (schema.type) {
      case AsnTypeTypes.Sequence:
        return new Sequence({
          value: asn1Value,
          name: ""
        });
      case AsnTypeTypes.Set:
        return new Set2({
          value: asn1Value,
          name: ""
        });
      case AsnTypeTypes.Choice:
        return new Choice({
          value: asn1Value,
          name: ""
        });
      default:
        throw new Error("Unsupported ASN1 type in use");
    }
  }
  set(target, schema) {
    this.items.set(target, schema);
    return this;
  }
  findParentSchema(target) {
    const parent = Object.getPrototypeOf(target);
    if (parent) {
      const schema = this.items.get(parent);
      return schema || this.findParentSchema(parent);
    }
    return null;
  }
};

// node_modules/@peculiar/asn1-schema/build/es2015/storage.js
var schemaStorage = new AsnSchemaStorage();

// node_modules/@peculiar/asn1-schema/build/es2015/decorators.js
var AsnType = (options) => (target) => {
  let schema;
  if (!schemaStorage.has(target)) {
    schema = schemaStorage.createDefault(target);
    schemaStorage.set(target, schema);
  } else {
    schema = schemaStorage.get(target);
  }
  Object.assign(schema, options);
};
var AsnProp = (options) => (target, propertyKey) => {
  let schema;
  if (!schemaStorage.has(target.constructor)) {
    schema = schemaStorage.createDefault(target.constructor);
    schemaStorage.set(target.constructor, schema);
  } else {
    schema = schemaStorage.get(target.constructor);
  }
  const copyOptions = Object.assign({}, options);
  if (typeof copyOptions.type === "number" && !copyOptions.converter) {
    const defaultConverter2 = defaultConverter(options.type);
    if (!defaultConverter2) {
      throw new Error(`Cannot get default converter for property '${propertyKey}' of ${target.constructor.name}`);
    }
    copyOptions.converter = defaultConverter2;
  }
  copyOptions.raw = options.raw;
  schema.items[propertyKey] = copyOptions;
};

// node_modules/@peculiar/asn1-schema/build/es2015/errors/schema_validation.js
var AsnSchemaValidationError = class extends Error {
  schemas = [];
};

// node_modules/@peculiar/asn1-schema/build/es2015/parser.js
var AsnParser = class {
  static parse(data, target, options) {
    const asn1Parsed = fromBER(toArrayBuffer(data), options?.berOptions);
    if (asn1Parsed.result.error) {
      throw new Error(asn1Parsed.result.error);
    }
    const res = this.fromASN(asn1Parsed.result, target, options);
    return res;
  }
  static fromASN(asn1Schema, target, options) {
    try {
      if (isConvertible(target)) {
        const value = new target();
        return value.fromASN(asn1Schema);
      }
      const schema = schemaStorage.get(target);
      schemaStorage.cache(target);
      let targetSchema = schema.schema;
      const choiceResult = this.handleChoiceTypes(asn1Schema, schema, target, targetSchema, options);
      if (choiceResult?.result) {
        return choiceResult.result;
      }
      if (choiceResult?.targetSchema) {
        targetSchema = choiceResult.targetSchema;
      }
      const sequenceResult = this.handleSequenceTypes(asn1Schema, schema, target, targetSchema);
      const res = new target();
      if (isTypeOfArray(target)) {
        return this.handleArrayTypes(asn1Schema, schema, target, options);
      }
      this.processSchemaItems(schema, sequenceResult, res, options);
      return res;
    } catch (error) {
      if (error instanceof AsnSchemaValidationError) {
        error.schemas.push(target.name);
      }
      throw error;
    }
  }
  static handleChoiceTypes(asn1Schema, schema, target, targetSchema, options) {
    if (asn1Schema.constructor === Constructed && schema.type === AsnTypeTypes.Choice && asn1Schema.idBlock.tagClass === 3) {
      for (const key in schema.items) {
        const schemaItem = schema.items[key];
        if (schemaItem.context === asn1Schema.idBlock.tagNumber && schemaItem.implicit) {
          if (typeof schemaItem.type === "function" && schemaStorage.has(schemaItem.type)) {
            const fieldSchema = schemaStorage.get(schemaItem.type);
            if (fieldSchema && fieldSchema.type === AsnTypeTypes.Sequence) {
              const newSeq = new Sequence();
              if ("value" in asn1Schema.valueBlock && Array.isArray(asn1Schema.valueBlock.value) && "value" in newSeq.valueBlock) {
                newSeq.valueBlock.value = asn1Schema.valueBlock.value;
                const fieldValue = this.fromASN(newSeq, schemaItem.type, options);
                const res = new target();
                res[key] = fieldValue;
                return { result: res };
              }
            }
          }
        }
      }
    } else if (asn1Schema.constructor === Constructed && schema.type !== AsnTypeTypes.Choice) {
      const newTargetSchema = new Constructed({
        idBlock: {
          tagClass: 3,
          tagNumber: asn1Schema.idBlock.tagNumber
        },
        value: schema.schema.valueBlock.value
      });
      for (const key in schema.items) {
        delete asn1Schema[key];
      }
      return { targetSchema: newTargetSchema };
    }
    return null;
  }
  static handleSequenceTypes(asn1Schema, schema, target, targetSchema) {
    if (schema.type === AsnTypeTypes.Sequence) {
      const asn1ComparedSchema = compareSchema({}, asn1Schema, targetSchema);
      if (!asn1ComparedSchema.verified) {
        throw new AsnSchemaValidationError(`Data does not match to ${target.name} ASN1 schema.${asn1ComparedSchema.result.error ? ` ${asn1ComparedSchema.result.error}` : ""}`);
      }
      return asn1ComparedSchema;
    } else {
      const asn1ComparedSchema = compareSchema({}, asn1Schema, targetSchema);
      if (!asn1ComparedSchema.verified) {
        throw new AsnSchemaValidationError(`Data does not match to ${target.name} ASN1 schema.${asn1ComparedSchema.result.error ? ` ${asn1ComparedSchema.result.error}` : ""}`);
      }
      return asn1ComparedSchema;
    }
  }
  static processRepeatedField(asn1Elements, asn1Index, schemaItem) {
    let elementsToProcess = asn1Elements.slice(asn1Index);
    if (elementsToProcess.length === 1 && elementsToProcess[0].constructor.name === "Sequence") {
      const seq = elementsToProcess[0];
      if (seq.valueBlock && seq.valueBlock.value && Array.isArray(seq.valueBlock.value)) {
        elementsToProcess = seq.valueBlock.value;
      }
    }
    if (typeof schemaItem.type === "number") {
      const converter = defaultConverter(schemaItem.type);
      if (!converter)
        throw new Error(`No converter for ASN.1 type ${schemaItem.type}`);
      return elementsToProcess.filter((el) => el && el.valueBlock).map((el) => {
        try {
          return converter.fromASN(el);
        } catch {
          return void 0;
        }
      }).filter((v) => v !== void 0);
    } else {
      return elementsToProcess.filter((el) => el && el.valueBlock).map((el) => {
        try {
          return this.fromASN(el, schemaItem.type);
        } catch {
          return void 0;
        }
      }).filter((v) => v !== void 0);
    }
  }
  static processPrimitiveField(asn1Element, schemaItem) {
    const converter = defaultConverter(schemaItem.type);
    if (!converter)
      throw new Error(`No converter for ASN.1 type ${schemaItem.type}`);
    return converter.fromASN(asn1Element);
  }
  static isOptionalChoiceField(schemaItem) {
    return schemaItem.optional && typeof schemaItem.type === "function" && schemaStorage.has(schemaItem.type) && schemaStorage.get(schemaItem.type).type === AsnTypeTypes.Choice;
  }
  static processOptionalChoiceField(asn1Element, schemaItem) {
    try {
      const value = this.fromASN(asn1Element, schemaItem.type);
      return {
        processed: true,
        value
      };
    } catch (err) {
      if (err instanceof AsnSchemaValidationError && /Wrong values for Choice type/.test(err.message)) {
        return { processed: false };
      }
      throw err;
    }
  }
  static handleArrayTypes(asn1Schema, schema, target, options) {
    if (!("value" in asn1Schema.valueBlock && Array.isArray(asn1Schema.valueBlock.value))) {
      throw new Error("Cannot get items from the ASN.1 parsed value. ASN.1 object is not constructed.");
    }
    const itemType = schema.itemType;
    if (typeof itemType === "number") {
      const converter = defaultConverter(itemType);
      if (!converter) {
        throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
      }
      return target.from(asn1Schema.valueBlock.value, (element) => converter.fromASN(element));
    } else {
      return target.from(asn1Schema.valueBlock.value, (element) => this.fromASN(element, itemType, options));
    }
  }
  static processSchemaItems(schema, asn1ComparedSchema, res, options) {
    for (const key in schema.items) {
      const asn1SchemaValue = asn1ComparedSchema.result[key];
      if (!asn1SchemaValue) {
        continue;
      }
      const schemaItem = schema.items[key];
      const schemaItemType = schemaItem.type;
      let parsedValue;
      if (typeof schemaItemType === "number" || isConvertible(schemaItemType)) {
        parsedValue = this.processPrimitiveSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options);
      } else {
        parsedValue = this.processComplexSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options);
      }
      if (parsedValue && typeof parsedValue === "object" && "value" in parsedValue && "raw" in parsedValue) {
        res[key] = parsedValue.value;
        res[`${key}Raw`] = parsedValue.raw;
      } else {
        res[key] = parsedValue;
      }
    }
  }
  static processPrimitiveSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options) {
    const converter = schemaItem.converter ?? (isConvertible(schemaItemType) ? new schemaItemType() : null);
    if (!converter) {
      throw new Error("Converter is empty");
    }
    if (schemaItem.repeated) {
      return this.processRepeatedPrimitiveItem(asn1SchemaValue, schemaItem, converter, options);
    } else {
      return this.processSinglePrimitiveItem(asn1SchemaValue, schemaItem, schemaItemType, converter, options);
    }
  }
  static processRepeatedPrimitiveItem(asn1SchemaValue, schemaItem, converter, options) {
    if (schemaItem.implicit) {
      const Container = schemaItem.repeated === "sequence" ? Sequence : Set2;
      const newItem = new Container();
      newItem.valueBlock = asn1SchemaValue.valueBlock;
      const newItemAsn = fromBER(newItem.toBER(false), options?.berOptions);
      if (newItemAsn.offset === -1) {
        throw new Error(`Cannot parse the child item. ${newItemAsn.result.error}`);
      }
      if (!("value" in newItemAsn.result.valueBlock && Array.isArray(newItemAsn.result.valueBlock.value))) {
        throw new Error("Cannot get items from the ASN.1 parsed value. ASN.1 object is not constructed.");
      }
      const value = newItemAsn.result.valueBlock.value;
      return Array.from(value, (element) => converter.fromASN(element));
    } else {
      return Array.from(asn1SchemaValue, (element) => converter.fromASN(element));
    }
  }
  static processSinglePrimitiveItem(asn1SchemaValue, schemaItem, schemaItemType, converter, options) {
    let value = asn1SchemaValue;
    if (schemaItem.implicit) {
      let newItem;
      if (isConvertible(schemaItemType)) {
        newItem = new schemaItemType().toSchema("");
      } else {
        const Asn1TypeName = AsnPropTypes[schemaItemType];
        const Asn1Type = index_es_exports[Asn1TypeName];
        if (!Asn1Type) {
          throw new Error(`Cannot get '${Asn1TypeName}' class from asn1js module`);
        }
        newItem = new Asn1Type();
      }
      newItem.valueBlock = value.valueBlock;
      value = fromBER(newItem.toBER(false), options?.berOptions).result;
    }
    return converter.fromASN(value);
  }
  static processComplexSchemaItem(asn1SchemaValue, schemaItem, schemaItemType, options) {
    if (schemaItem.repeated) {
      if (!Array.isArray(asn1SchemaValue)) {
        throw new Error("Cannot get list of items from the ASN.1 parsed value. ASN.1 value should be iterable.");
      }
      return Array.from(asn1SchemaValue, (element) => this.fromASN(element, schemaItemType, options));
    } else {
      const valueToProcess = this.handleImplicitTagging(asn1SchemaValue, schemaItem, schemaItemType);
      if (this.isOptionalChoiceField(schemaItem)) {
        try {
          return this.fromASN(valueToProcess, schemaItemType, options);
        } catch (err) {
          if (err instanceof AsnSchemaValidationError && /Wrong values for Choice type/.test(err.message)) {
            return void 0;
          }
          throw err;
        }
      } else {
        const parsedValue = this.fromASN(valueToProcess, schemaItemType, options);
        if (schemaItem.raw) {
          return {
            value: parsedValue,
            raw: asn1SchemaValue.valueBeforeDecodeView
          };
        }
        return parsedValue;
      }
    }
  }
  static handleImplicitTagging(asn1SchemaValue, schemaItem, schemaItemType) {
    if (schemaItem.implicit && typeof schemaItem.context === "number") {
      const schema = schemaStorage.get(schemaItemType);
      if (schema.type === AsnTypeTypes.Sequence) {
        const newSeq = new Sequence();
        if ("value" in asn1SchemaValue.valueBlock && Array.isArray(asn1SchemaValue.valueBlock.value) && "value" in newSeq.valueBlock) {
          newSeq.valueBlock.value = asn1SchemaValue.valueBlock.value;
          return newSeq;
        }
      } else if (schema.type === AsnTypeTypes.Set) {
        const newSet = new Set2();
        if ("value" in asn1SchemaValue.valueBlock && Array.isArray(asn1SchemaValue.valueBlock.value) && "value" in newSet.valueBlock) {
          newSet.valueBlock.value = asn1SchemaValue.valueBlock.value;
          return newSet;
        }
      }
    }
    return asn1SchemaValue;
  }
};

// node_modules/@peculiar/asn1-schema/build/es2015/serializer.js
var AsnSerializer = class _AsnSerializer {
  static serialize(obj) {
    if (obj instanceof BaseBlock) {
      return obj.toBER(false);
    }
    return this.toASN(obj).toBER(false);
  }
  static toASN(obj) {
    if (obj && typeof obj === "object" && isConvertible(obj)) {
      return obj.toASN();
    }
    if (!(obj && typeof obj === "object")) {
      throw new TypeError("Parameter 1 should be type of Object.");
    }
    const target = obj.constructor;
    const schema = schemaStorage.get(target);
    schemaStorage.cache(target);
    let asn1Value = [];
    if (schema.itemType) {
      if (!Array.isArray(obj)) {
        throw new TypeError("Parameter 1 should be type of Array.");
      }
      if (typeof schema.itemType === "number") {
        const converter = defaultConverter(schema.itemType);
        if (!converter) {
          throw new Error(`Cannot get default converter for array item of ${target.name} ASN1 schema`);
        }
        asn1Value = obj.map((o) => converter.toASN(o));
      } else {
        asn1Value = obj.map((o) => this.toAsnItem({ type: schema.itemType }, "[]", target, o));
      }
    } else {
      for (const key in schema.items) {
        const schemaItem = schema.items[key];
        const objProp = obj[key];
        if (objProp === void 0 || schemaItem.defaultValue === objProp || typeof schemaItem.defaultValue === "object" && typeof objProp === "object" && isArrayEqual(this.serialize(schemaItem.defaultValue), this.serialize(objProp))) {
          continue;
        }
        const asn1Item = _AsnSerializer.toAsnItem(schemaItem, key, target, objProp);
        if (typeof schemaItem.context === "number") {
          if (schemaItem.implicit) {
            if (!schemaItem.repeated && (typeof schemaItem.type === "number" || isConvertible(schemaItem.type))) {
              const value = {};
              value.valueHex = asn1Item instanceof Null ? toArrayBuffer(asn1Item.valueBeforeDecodeView) : asn1Item.valueBlock.toBER();
              asn1Value.push(new Primitive({
                optional: schemaItem.optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: schemaItem.context
                },
                ...value
              }));
            } else {
              asn1Value.push(new Constructed({
                optional: schemaItem.optional,
                idBlock: {
                  tagClass: 3,
                  tagNumber: schemaItem.context
                },
                value: asn1Item.valueBlock.value
              }));
            }
          } else {
            asn1Value.push(new Constructed({
              optional: schemaItem.optional,
              idBlock: {
                tagClass: 3,
                tagNumber: schemaItem.context
              },
              value: [asn1Item]
            }));
          }
        } else if (schemaItem.repeated) {
          asn1Value = asn1Value.concat(asn1Item);
        } else {
          asn1Value.push(asn1Item);
        }
      }
    }
    let asnSchema;
    switch (schema.type) {
      case AsnTypeTypes.Sequence:
        asnSchema = new Sequence({ value: asn1Value });
        break;
      case AsnTypeTypes.Set:
        asnSchema = new Set2({ value: asn1Value });
        break;
      case AsnTypeTypes.Choice:
        if (!asn1Value[0]) {
          throw new Error(`Schema '${target.name}' has wrong data. Choice cannot be empty.`);
        }
        asnSchema = asn1Value[0];
        break;
    }
    return asnSchema;
  }
  static toAsnItem(schemaItem, key, target, objProp) {
    let asn1Item;
    if (typeof schemaItem.type === "number") {
      const converter = schemaItem.converter;
      if (!converter) {
        throw new Error(`Property '${key}' doesn't have converter for type ${AsnPropTypes[schemaItem.type]} in schema '${target.name}'`);
      }
      if (schemaItem.repeated) {
        if (!Array.isArray(objProp)) {
          throw new TypeError("Parameter 'objProp' should be type of Array.");
        }
        const items = Array.from(objProp, (element) => converter.toASN(element));
        const Container = schemaItem.repeated === "sequence" ? Sequence : Set2;
        asn1Item = new Container({ value: items });
      } else {
        asn1Item = converter.toASN(objProp);
      }
    } else {
      if (schemaItem.repeated) {
        if (!Array.isArray(objProp)) {
          throw new TypeError("Parameter 'objProp' should be type of Array.");
        }
        const items = Array.from(objProp, (element) => this.toASN(element));
        const Container = schemaItem.repeated === "sequence" ? Sequence : Set2;
        asn1Item = new Container({ value: items });
      } else {
        asn1Item = this.toASN(objProp);
      }
    }
    return asn1Item;
  }
};

// node_modules/@peculiar/asn1-schema/build/es2015/objects.js
var AsnArray = class extends Array {
  constructor(items = []) {
    if (typeof items === "number") {
      super(items);
    } else {
      super();
      for (const item of items) {
        this.push(item);
      }
    }
  }
};

// node_modules/@peculiar/asn1-schema/build/es2015/convert.js
var AsnConvert = class _AsnConvert {
  static serialize(obj) {
    return AsnSerializer.serialize(obj);
  }
  static parse(data, target, options) {
    return AsnParser.parse(data, target, options);
  }
  static toString(data, options) {
    const buf = isBufferSource(data) ? toArrayBuffer(data) : _AsnConvert.serialize(data);
    const asn = fromBER(buf, options?.berOptions);
    if (asn.offset === -1) {
      throw new Error(`Cannot decode ASN.1 data. ${asn.result.error}`);
    }
    return asn.result.toString();
  }
};

// node_modules/tslib/tslib.es6.mjs
function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}

// node_modules/@peculiar/asn1-x509/build/es2015/ip_converter.js
var IpConverter = class {
  static isIPv4(ip) {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
  }
  static parseIPv4(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) {
      throw new Error("Invalid IPv4 address");
    }
    return parts.map((part) => {
      const num = parseInt(part, 10);
      if (isNaN(num) || num < 0 || num > 255) {
        throw new Error("Invalid IPv4 address part");
      }
      return num;
    });
  }
  static parseIPv6(ip) {
    const expandedIP = this.expandIPv6(ip);
    const parts = expandedIP.split(":");
    if (parts.length !== 8) {
      throw new Error("Invalid IPv6 address");
    }
    return parts.reduce((bytes, part) => {
      const num = parseInt(part, 16);
      if (isNaN(num) || num < 0 || num > 65535) {
        throw new Error("Invalid IPv6 address part");
      }
      bytes.push(num >> 8 & 255);
      bytes.push(num & 255);
      return bytes;
    }, []);
  }
  static expandIPv6(ip) {
    if (!ip.includes("::")) {
      return ip;
    }
    const parts = ip.split("::");
    if (parts.length > 2) {
      throw new Error("Invalid IPv6 address");
    }
    const left = parts[0] ? parts[0].split(":") : [];
    const right = parts[1] ? parts[1].split(":") : [];
    const missing = 8 - (left.length + right.length);
    if (missing < 0) {
      throw new Error("Invalid IPv6 address");
    }
    return [...left, ...Array(missing).fill("0"), ...right].join(":");
  }
  static formatIPv6(bytes) {
    const parts = [];
    for (let i = 0; i < 16; i += 2) {
      parts.push((bytes[i] << 8 | bytes[i + 1]).toString(16));
    }
    return this.compressIPv6(parts.join(":"));
  }
  static compressIPv6(ip) {
    const parts = ip.split(":");
    let longestZeroStart = -1;
    let longestZeroLength = 0;
    let currentZeroStart = -1;
    let currentZeroLength = 0;
    for (let i = 0; i < parts.length; i++) {
      if (parts[i] === "0") {
        if (currentZeroStart === -1) {
          currentZeroStart = i;
        }
        currentZeroLength++;
      } else {
        if (currentZeroLength > longestZeroLength) {
          longestZeroStart = currentZeroStart;
          longestZeroLength = currentZeroLength;
        }
        currentZeroStart = -1;
        currentZeroLength = 0;
      }
    }
    if (currentZeroLength > longestZeroLength) {
      longestZeroStart = currentZeroStart;
      longestZeroLength = currentZeroLength;
    }
    if (longestZeroLength > 1) {
      const before = parts.slice(0, longestZeroStart).join(":");
      const after = parts.slice(longestZeroStart + longestZeroLength).join(":");
      return `${before}::${after}`;
    }
    return ip;
  }
  static parseCIDR(text) {
    const [addr, prefixStr] = text.split("/");
    const prefix = parseInt(prefixStr, 10);
    if (this.isIPv4(addr)) {
      if (prefix < 0 || prefix > 32) {
        throw new Error("Invalid IPv4 prefix length");
      }
      return [this.parseIPv4(addr), prefix];
    } else {
      if (prefix < 0 || prefix > 128) {
        throw new Error("Invalid IPv6 prefix length");
      }
      return [this.parseIPv6(addr), prefix];
    }
  }
  static decodeIP(value) {
    if (value.length === 64 && parseInt(value, 16) === 0) {
      return "::/0";
    }
    if (value.length !== 16) {
      return value;
    }
    const mask = parseInt(value.slice(8), 16).toString(2).split("").reduce((a, k) => a + +k, 0);
    let ip = value.slice(0, 8).replace(/(.{2})/g, (match) => `${parseInt(match, 16)}.`);
    ip = ip.slice(0, -1);
    return `${ip}/${mask}`;
  }
  static toString(buf) {
    const uint8 = new Uint8Array(buf);
    if (uint8.length === 4) {
      return Array.from(uint8).join(".");
    }
    if (uint8.length === 16) {
      return this.formatIPv6(uint8);
    }
    if (uint8.length === 8 || uint8.length === 32) {
      const half = uint8.length / 2;
      const addrBytes = uint8.slice(0, half);
      const maskBytes = uint8.slice(half);
      const isAllZeros = uint8.every((byte) => byte === 0);
      if (isAllZeros) {
        return uint8.length === 8 ? "0.0.0.0/0" : "::/0";
      }
      const prefixLen = maskBytes.reduce((a, b) => a + (b.toString(2).match(/1/g) || []).length, 0);
      if (uint8.length === 8) {
        const addrStr = Array.from(addrBytes).join(".");
        return `${addrStr}/${prefixLen}`;
      } else {
        const addrStr = this.formatIPv6(addrBytes);
        return `${addrStr}/${prefixLen}`;
      }
    }
    return this.decodeIP(hex_exports.encode(buf));
  }
  static fromString(text) {
    if (text.includes("/")) {
      const [addr, prefix] = this.parseCIDR(text);
      const maskBytes = new Uint8Array(addr.length);
      let bitsLeft = prefix;
      for (let i = 0; i < maskBytes.length; i++) {
        if (bitsLeft >= 8) {
          maskBytes[i] = 255;
          bitsLeft -= 8;
        } else if (bitsLeft > 0) {
          maskBytes[i] = 255 << 8 - bitsLeft;
          bitsLeft = 0;
        }
      }
      const out = new Uint8Array(addr.length * 2);
      out.set(addr, 0);
      out.set(maskBytes, addr.length);
      return out.buffer;
    }
    const bytes = this.isIPv4(text) ? this.parseIPv4(text) : this.parseIPv6(text);
    return new Uint8Array(bytes).buffer;
  }
};

// node_modules/@peculiar/asn1-x509/build/es2015/name.js
var RelativeDistinguishedName_1;
var RDNSequence_1;
var Name_1;
var DirectoryString = class DirectoryString2 {
  teletexString;
  printableString;
  universalString;
  utf8String;
  bmpString;
  constructor(params = {}) {
    Object.assign(this, params);
  }
  toString() {
    return this.bmpString || this.printableString || this.teletexString || this.universalString || this.utf8String || "";
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.TeletexString })
], DirectoryString.prototype, "teletexString", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.PrintableString })
], DirectoryString.prototype, "printableString", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.UniversalString })
], DirectoryString.prototype, "universalString", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Utf8String })
], DirectoryString.prototype, "utf8String", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BmpString })
], DirectoryString.prototype, "bmpString", void 0);
DirectoryString = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], DirectoryString);
var AttributeValue = class AttributeValue2 extends DirectoryString {
  ia5String;
  anyValue;
  constructor(params = {}) {
    super(params);
    Object.assign(this, params);
  }
  toString() {
    return this.ia5String || (this.anyValue ? hex_exports.encode(this.anyValue) : super.toString());
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.IA5String })
], AttributeValue.prototype, "ia5String", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Any })
], AttributeValue.prototype, "anyValue", void 0);
AttributeValue = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], AttributeValue);
var AttributeTypeAndValue = class {
  type = "";
  value = new AttributeValue();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], AttributeTypeAndValue.prototype, "type", void 0);
__decorate([
  AsnProp({ type: AttributeValue })
], AttributeTypeAndValue.prototype, "value", void 0);
var RelativeDistinguishedName = RelativeDistinguishedName_1 = class RelativeDistinguishedName2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, RelativeDistinguishedName_1.prototype);
  }
};
RelativeDistinguishedName = RelativeDistinguishedName_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: AttributeTypeAndValue
  })
], RelativeDistinguishedName);
var RDNSequence = RDNSequence_1 = class RDNSequence2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, RDNSequence_1.prototype);
  }
};
RDNSequence = RDNSequence_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: RelativeDistinguishedName
  })
], RDNSequence);
var Name = Name_1 = class Name2 extends RDNSequence {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, Name_1.prototype);
  }
};
Name = Name_1 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], Name);

// node_modules/@peculiar/asn1-x509/build/es2015/general_name.js
var AsnIpConverter = {
  fromASN: (value) => IpConverter.toString(AsnOctetStringConverter.fromASN(value)),
  toASN: (value) => AsnOctetStringConverter.toASN(IpConverter.fromString(value))
};
var OtherName = class {
  typeId = "";
  value = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], OtherName.prototype, "typeId", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })
], OtherName.prototype, "value", void 0);
var EDIPartyName = class {
  nameAssigner;
  partyName = new DirectoryString();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: DirectoryString,
    optional: true,
    context: 0,
    implicit: true
  })
], EDIPartyName.prototype, "nameAssigner", void 0);
__decorate([
  AsnProp({
    type: DirectoryString,
    context: 1,
    implicit: true
  })
], EDIPartyName.prototype, "partyName", void 0);
var GeneralName = class GeneralName2 {
  otherName;
  rfc822Name;
  dNSName;
  x400Address;
  directoryName;
  ediPartyName;
  uniformResourceIdentifier;
  iPAddress;
  registeredID;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: OtherName,
    context: 0,
    implicit: true
  })
], GeneralName.prototype, "otherName", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.IA5String,
    context: 1,
    implicit: true
  })
], GeneralName.prototype, "rfc822Name", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.IA5String,
    context: 2,
    implicit: true
  })
], GeneralName.prototype, "dNSName", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    context: 3,
    implicit: true
  })
], GeneralName.prototype, "x400Address", void 0);
__decorate([
  AsnProp({
    type: Name,
    context: 4,
    implicit: false
  })
], GeneralName.prototype, "directoryName", void 0);
__decorate([
  AsnProp({
    type: EDIPartyName,
    context: 5
  })
], GeneralName.prototype, "ediPartyName", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.IA5String,
    context: 6,
    implicit: true
  })
], GeneralName.prototype, "uniformResourceIdentifier", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.OctetString,
    context: 7,
    implicit: true,
    converter: AsnIpConverter
  })
], GeneralName.prototype, "iPAddress", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.ObjectIdentifier,
    context: 8,
    implicit: true
  })
], GeneralName.prototype, "registeredID", void 0);
GeneralName = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], GeneralName);

// node_modules/@peculiar/asn1-x509/build/es2015/object_identifiers.js
var id_pkix = "1.3.6.1.5.5.7";
var id_pe = `${id_pkix}.1`;
var id_qt = `${id_pkix}.2`;
var id_kp = `${id_pkix}.3`;
var id_ad = `${id_pkix}.48`;
var id_qt_csp = `${id_qt}.1`;
var id_qt_unotice = `${id_qt}.2`;
var id_ad_ocsp = `${id_ad}.1`;
var id_ad_caIssuers = `${id_ad}.2`;
var id_ad_timeStamping = `${id_ad}.3`;
var id_ad_caRepository = `${id_ad}.5`;
var id_ce = "2.5.29";

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/authority_information_access.js
var AuthorityInfoAccessSyntax_1;
var id_pe_authorityInfoAccess = `${id_pe}.1`;
var AccessDescription = class {
  accessMethod = "";
  accessLocation = new GeneralName();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], AccessDescription.prototype, "accessMethod", void 0);
__decorate([
  AsnProp({ type: GeneralName })
], AccessDescription.prototype, "accessLocation", void 0);
var AuthorityInfoAccessSyntax = AuthorityInfoAccessSyntax_1 = class AuthorityInfoAccessSyntax2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, AuthorityInfoAccessSyntax_1.prototype);
  }
};
AuthorityInfoAccessSyntax = AuthorityInfoAccessSyntax_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AccessDescription
  })
], AuthorityInfoAccessSyntax);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/authority_key_identifier.js
var id_ce_authorityKeyIdentifier = `${id_ce}.35`;
var KeyIdentifier = class extends OctetString2 {
};
var AuthorityKeyIdentifier = class {
  keyIdentifier;
  authorityCertIssuer;
  authorityCertSerialNumber;
  constructor(params = {}) {
    if (params) {
      Object.assign(this, params);
    }
  }
};
__decorate([
  AsnProp({
    type: KeyIdentifier,
    context: 0,
    optional: true,
    implicit: true
  })
], AuthorityKeyIdentifier.prototype, "keyIdentifier", void 0);
__decorate([
  AsnProp({
    type: GeneralName,
    context: 1,
    optional: true,
    implicit: true,
    repeated: "sequence"
  })
], AuthorityKeyIdentifier.prototype, "authorityCertIssuer", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 2,
    optional: true,
    implicit: true,
    converter: AsnIntegerArrayBufferConverter
  })
], AuthorityKeyIdentifier.prototype, "authorityCertSerialNumber", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/basic_constraints.js
var id_ce_basicConstraints = `${id_ce}.19`;
var BasicConstraints = class {
  cA = false;
  pathLenConstraint;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Boolean,
    defaultValue: false
  })
], BasicConstraints.prototype, "cA", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    optional: true
  })
], BasicConstraints.prototype, "pathLenConstraint", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/general_names.js
var GeneralNames_1;
var GeneralNames = GeneralNames_1 = class GeneralNames2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, GeneralNames_1.prototype);
  }
};
GeneralNames = GeneralNames_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: GeneralName
  })
], GeneralNames);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/certificate_issuer.js
var CertificateIssuer_1;
var id_ce_certificateIssuer = `${id_ce}.29`;
var CertificateIssuer = CertificateIssuer_1 = class CertificateIssuer2 extends GeneralNames {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CertificateIssuer_1.prototype);
  }
};
CertificateIssuer = CertificateIssuer_1 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], CertificateIssuer);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/certificate_policies.js
var CertificatePolicies_1;
var id_ce_certificatePolicies = `${id_ce}.32`;
var id_ce_certificatePolicies_anyPolicy = `${id_ce_certificatePolicies}.0`;
var DisplayText = class DisplayText2 {
  ia5String;
  visibleString;
  bmpString;
  utf8String;
  constructor(params = {}) {
    Object.assign(this, params);
  }
  toString() {
    return this.ia5String || this.visibleString || this.bmpString || this.utf8String || "";
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.IA5String })
], DisplayText.prototype, "ia5String", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.VisibleString })
], DisplayText.prototype, "visibleString", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BmpString })
], DisplayText.prototype, "bmpString", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Utf8String })
], DisplayText.prototype, "utf8String", void 0);
DisplayText = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], DisplayText);
var NoticeReference = class {
  organization = new DisplayText();
  noticeNumbers = [];
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: DisplayText })
], NoticeReference.prototype, "organization", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    repeated: "sequence"
  })
], NoticeReference.prototype, "noticeNumbers", void 0);
var UserNotice = class {
  noticeRef;
  explicitText;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: NoticeReference,
    optional: true
  })
], UserNotice.prototype, "noticeRef", void 0);
__decorate([
  AsnProp({
    type: DisplayText,
    optional: true
  })
], UserNotice.prototype, "explicitText", void 0);
var Qualifier = class Qualifier2 {
  cPSuri;
  userNotice;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.IA5String })
], Qualifier.prototype, "cPSuri", void 0);
__decorate([
  AsnProp({ type: UserNotice })
], Qualifier.prototype, "userNotice", void 0);
Qualifier = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], Qualifier);
var PolicyQualifierInfo = class {
  policyQualifierId = "";
  qualifier = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], PolicyQualifierInfo.prototype, "policyQualifierId", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Any })
], PolicyQualifierInfo.prototype, "qualifier", void 0);
var PolicyInformation = class {
  policyIdentifier = "";
  policyQualifiers;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], PolicyInformation.prototype, "policyIdentifier", void 0);
__decorate([
  AsnProp({
    type: PolicyQualifierInfo,
    repeated: "sequence",
    optional: true
  })
], PolicyInformation.prototype, "policyQualifiers", void 0);
var CertificatePolicies = CertificatePolicies_1 = class CertificatePolicies2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CertificatePolicies_1.prototype);
  }
};
CertificatePolicies = CertificatePolicies_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: PolicyInformation
  })
], CertificatePolicies);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/crl_number.js
var id_ce_cRLNumber = `${id_ce}.20`;
var CRLNumber = class CRLNumber2 {
  value;
  constructor(value = 0) {
    this.value = value;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], CRLNumber.prototype, "value", void 0);
CRLNumber = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], CRLNumber);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/crl_delta_indicator.js
var id_ce_deltaCRLIndicator = `${id_ce}.27`;
var BaseCRLNumber = class BaseCRLNumber2 extends CRLNumber {
};
BaseCRLNumber = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], BaseCRLNumber);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/crl_distribution_points.js
var CRLDistributionPoints_1;
var id_ce_cRLDistributionPoints = `${id_ce}.31`;
var ReasonFlags;
(function(ReasonFlags2) {
  ReasonFlags2[ReasonFlags2["unused"] = 1] = "unused";
  ReasonFlags2[ReasonFlags2["keyCompromise"] = 2] = "keyCompromise";
  ReasonFlags2[ReasonFlags2["cACompromise"] = 4] = "cACompromise";
  ReasonFlags2[ReasonFlags2["affiliationChanged"] = 8] = "affiliationChanged";
  ReasonFlags2[ReasonFlags2["superseded"] = 16] = "superseded";
  ReasonFlags2[ReasonFlags2["cessationOfOperation"] = 32] = "cessationOfOperation";
  ReasonFlags2[ReasonFlags2["certificateHold"] = 64] = "certificateHold";
  ReasonFlags2[ReasonFlags2["privilegeWithdrawn"] = 128] = "privilegeWithdrawn";
  ReasonFlags2[ReasonFlags2["aACompromise"] = 256] = "aACompromise";
})(ReasonFlags || (ReasonFlags = {}));
var Reason = class extends BitString2 {
  toJSON() {
    const res = [];
    const flags = this.toNumber();
    if (flags & ReasonFlags.aACompromise) {
      res.push("aACompromise");
    }
    if (flags & ReasonFlags.affiliationChanged) {
      res.push("affiliationChanged");
    }
    if (flags & ReasonFlags.cACompromise) {
      res.push("cACompromise");
    }
    if (flags & ReasonFlags.certificateHold) {
      res.push("certificateHold");
    }
    if (flags & ReasonFlags.cessationOfOperation) {
      res.push("cessationOfOperation");
    }
    if (flags & ReasonFlags.keyCompromise) {
      res.push("keyCompromise");
    }
    if (flags & ReasonFlags.privilegeWithdrawn) {
      res.push("privilegeWithdrawn");
    }
    if (flags & ReasonFlags.superseded) {
      res.push("superseded");
    }
    if (flags & ReasonFlags.unused) {
      res.push("unused");
    }
    return res;
  }
  toString() {
    return `[${this.toJSON().join(", ")}]`;
  }
};
var DistributionPointName = class DistributionPointName2 {
  fullName;
  nameRelativeToCRLIssuer;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: GeneralName,
    context: 0,
    repeated: "sequence",
    implicit: true
  })
], DistributionPointName.prototype, "fullName", void 0);
__decorate([
  AsnProp({
    type: RelativeDistinguishedName,
    context: 1,
    implicit: true
  })
], DistributionPointName.prototype, "nameRelativeToCRLIssuer", void 0);
DistributionPointName = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], DistributionPointName);
var DistributionPoint = class {
  distributionPoint;
  reasons;
  cRLIssuer;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: DistributionPointName,
    context: 0,
    optional: true
  })
], DistributionPoint.prototype, "distributionPoint", void 0);
__decorate([
  AsnProp({
    type: Reason,
    context: 1,
    optional: true,
    implicit: true
  })
], DistributionPoint.prototype, "reasons", void 0);
__decorate([
  AsnProp({
    type: GeneralName,
    context: 2,
    optional: true,
    repeated: "sequence",
    implicit: true
  })
], DistributionPoint.prototype, "cRLIssuer", void 0);
var CRLDistributionPoints = CRLDistributionPoints_1 = class CRLDistributionPoints2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CRLDistributionPoints_1.prototype);
  }
};
CRLDistributionPoints = CRLDistributionPoints_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: DistributionPoint
  })
], CRLDistributionPoints);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/crl_freshest.js
var FreshestCRL_1;
var id_ce_freshestCRL = `${id_ce}.46`;
var FreshestCRL = FreshestCRL_1 = class FreshestCRL2 extends CRLDistributionPoints {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, FreshestCRL_1.prototype);
  }
};
FreshestCRL = FreshestCRL_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: DistributionPoint
  })
], FreshestCRL);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/crl_issuing_distribution_point.js
var id_ce_issuingDistributionPoint = `${id_ce}.28`;
var IssuingDistributionPoint = class _IssuingDistributionPoint {
  static ONLY = false;
  distributionPoint;
  onlyContainsUserCerts = _IssuingDistributionPoint.ONLY;
  onlyContainsCACerts = _IssuingDistributionPoint.ONLY;
  onlySomeReasons;
  indirectCRL = _IssuingDistributionPoint.ONLY;
  onlyContainsAttributeCerts = _IssuingDistributionPoint.ONLY;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: DistributionPointName,
    context: 0,
    optional: true
  })
], IssuingDistributionPoint.prototype, "distributionPoint", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Boolean,
    context: 1,
    defaultValue: IssuingDistributionPoint.ONLY,
    implicit: true
  })
], IssuingDistributionPoint.prototype, "onlyContainsUserCerts", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Boolean,
    context: 2,
    defaultValue: IssuingDistributionPoint.ONLY,
    implicit: true
  })
], IssuingDistributionPoint.prototype, "onlyContainsCACerts", void 0);
__decorate([
  AsnProp({
    type: Reason,
    context: 3,
    optional: true,
    implicit: true
  })
], IssuingDistributionPoint.prototype, "onlySomeReasons", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Boolean,
    context: 4,
    defaultValue: IssuingDistributionPoint.ONLY,
    implicit: true
  })
], IssuingDistributionPoint.prototype, "indirectCRL", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Boolean,
    context: 5,
    defaultValue: IssuingDistributionPoint.ONLY,
    implicit: true
  })
], IssuingDistributionPoint.prototype, "onlyContainsAttributeCerts", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/crl_reason.js
var id_ce_cRLReasons = `${id_ce}.21`;
var CRLReasons;
(function(CRLReasons2) {
  CRLReasons2[CRLReasons2["unspecified"] = 0] = "unspecified";
  CRLReasons2[CRLReasons2["keyCompromise"] = 1] = "keyCompromise";
  CRLReasons2[CRLReasons2["cACompromise"] = 2] = "cACompromise";
  CRLReasons2[CRLReasons2["affiliationChanged"] = 3] = "affiliationChanged";
  CRLReasons2[CRLReasons2["superseded"] = 4] = "superseded";
  CRLReasons2[CRLReasons2["cessationOfOperation"] = 5] = "cessationOfOperation";
  CRLReasons2[CRLReasons2["certificateHold"] = 6] = "certificateHold";
  CRLReasons2[CRLReasons2["removeFromCRL"] = 8] = "removeFromCRL";
  CRLReasons2[CRLReasons2["privilegeWithdrawn"] = 9] = "privilegeWithdrawn";
  CRLReasons2[CRLReasons2["aACompromise"] = 10] = "aACompromise";
})(CRLReasons || (CRLReasons = {}));
var CRLReason = class CRLReason2 {
  reason = CRLReasons.unspecified;
  constructor(reason = CRLReasons.unspecified) {
    this.reason = reason;
  }
  toJSON() {
    return CRLReasons[this.reason];
  }
  toString() {
    return this.toJSON();
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], CRLReason.prototype, "reason", void 0);
CRLReason = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], CRLReason);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/extended_key_usage.js
var ExtendedKeyUsage_1;
var id_ce_extKeyUsage = `${id_ce}.37`;
var ExtendedKeyUsage = ExtendedKeyUsage_1 = class ExtendedKeyUsage2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, ExtendedKeyUsage_1.prototype);
  }
};
ExtendedKeyUsage = ExtendedKeyUsage_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AsnPropTypes.ObjectIdentifier
  })
], ExtendedKeyUsage);
var anyExtendedKeyUsage = `${id_ce_extKeyUsage}.0`;
var id_kp_serverAuth = `${id_kp}.1`;
var id_kp_clientAuth = `${id_kp}.2`;
var id_kp_codeSigning = `${id_kp}.3`;
var id_kp_emailProtection = `${id_kp}.4`;
var id_kp_timeStamping = `${id_kp}.8`;
var id_kp_OCSPSigning = `${id_kp}.9`;

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/inhibit_any_policy.js
var id_ce_inhibitAnyPolicy = `${id_ce}.54`;
var InhibitAnyPolicy = class InhibitAnyPolicy2 {
  value;
  constructor(value = new ArrayBuffer(0)) {
    this.value = value;
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], InhibitAnyPolicy.prototype, "value", void 0);
InhibitAnyPolicy = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], InhibitAnyPolicy);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/invalidity_date.js
var id_ce_invalidityDate = `${id_ce}.24`;
var InvalidityDate = class InvalidityDate2 {
  value = /* @__PURE__ */ new Date();
  constructor(value) {
    if (value) {
      this.value = value;
    }
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.GeneralizedTime })
], InvalidityDate.prototype, "value", void 0);
InvalidityDate = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], InvalidityDate);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/issuer_alternative_name.js
var IssueAlternativeName_1;
var id_ce_issuerAltName = `${id_ce}.18`;
var IssueAlternativeName = IssueAlternativeName_1 = class IssueAlternativeName2 extends GeneralNames {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, IssueAlternativeName_1.prototype);
  }
};
IssueAlternativeName = IssueAlternativeName_1 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], IssueAlternativeName);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/key_usage.js
var id_ce_keyUsage = `${id_ce}.15`;
var KeyUsageFlags;
(function(KeyUsageFlags3) {
  KeyUsageFlags3[KeyUsageFlags3["digitalSignature"] = 1] = "digitalSignature";
  KeyUsageFlags3[KeyUsageFlags3["nonRepudiation"] = 2] = "nonRepudiation";
  KeyUsageFlags3[KeyUsageFlags3["keyEncipherment"] = 4] = "keyEncipherment";
  KeyUsageFlags3[KeyUsageFlags3["dataEncipherment"] = 8] = "dataEncipherment";
  KeyUsageFlags3[KeyUsageFlags3["keyAgreement"] = 16] = "keyAgreement";
  KeyUsageFlags3[KeyUsageFlags3["keyCertSign"] = 32] = "keyCertSign";
  KeyUsageFlags3[KeyUsageFlags3["cRLSign"] = 64] = "cRLSign";
  KeyUsageFlags3[KeyUsageFlags3["encipherOnly"] = 128] = "encipherOnly";
  KeyUsageFlags3[KeyUsageFlags3["decipherOnly"] = 256] = "decipherOnly";
})(KeyUsageFlags || (KeyUsageFlags = {}));
var KeyUsage = class extends BitString2 {
  toJSON() {
    const flag = this.toNumber();
    const res = [];
    if (flag & KeyUsageFlags.cRLSign) {
      res.push("crlSign");
    }
    if (flag & KeyUsageFlags.dataEncipherment) {
      res.push("dataEncipherment");
    }
    if (flag & KeyUsageFlags.decipherOnly) {
      res.push("decipherOnly");
    }
    if (flag & KeyUsageFlags.digitalSignature) {
      res.push("digitalSignature");
    }
    if (flag & KeyUsageFlags.encipherOnly) {
      res.push("encipherOnly");
    }
    if (flag & KeyUsageFlags.keyAgreement) {
      res.push("keyAgreement");
    }
    if (flag & KeyUsageFlags.keyCertSign) {
      res.push("keyCertSign");
    }
    if (flag & KeyUsageFlags.keyEncipherment) {
      res.push("keyEncipherment");
    }
    if (flag & KeyUsageFlags.nonRepudiation) {
      res.push("nonRepudiation");
    }
    return res;
  }
  toString() {
    return `[${this.toJSON().join(", ")}]`;
  }
};

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/name_constraints.js
var GeneralSubtrees_1;
var id_ce_nameConstraints = `${id_ce}.30`;
var GeneralSubtree = class {
  base = new GeneralName();
  minimum = 0;
  maximum;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: GeneralName })
], GeneralSubtree.prototype, "base", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 0,
    defaultValue: 0,
    implicit: true
  })
], GeneralSubtree.prototype, "minimum", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 1,
    optional: true,
    implicit: true
  })
], GeneralSubtree.prototype, "maximum", void 0);
var GeneralSubtrees = GeneralSubtrees_1 = class GeneralSubtrees2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, GeneralSubtrees_1.prototype);
  }
};
GeneralSubtrees = GeneralSubtrees_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: GeneralSubtree
  })
], GeneralSubtrees);
var NameConstraints = class {
  permittedSubtrees;
  excludedSubtrees;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: GeneralSubtrees,
    context: 0,
    optional: true,
    implicit: true
  })
], NameConstraints.prototype, "permittedSubtrees", void 0);
__decorate([
  AsnProp({
    type: GeneralSubtrees,
    context: 1,
    optional: true,
    implicit: true
  })
], NameConstraints.prototype, "excludedSubtrees", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/policy_constraints.js
var id_ce_policyConstraints = `${id_ce}.36`;
var PolicyConstraints = class {
  requireExplicitPolicy;
  inhibitPolicyMapping;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 0,
    implicit: true,
    optional: true,
    converter: AsnIntegerArrayBufferConverter
  })
], PolicyConstraints.prototype, "requireExplicitPolicy", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 1,
    implicit: true,
    optional: true,
    converter: AsnIntegerArrayBufferConverter
  })
], PolicyConstraints.prototype, "inhibitPolicyMapping", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/policy_mappings.js
var PolicyMappings_1;
var id_ce_policyMappings = `${id_ce}.33`;
var PolicyMapping = class {
  issuerDomainPolicy = "";
  subjectDomainPolicy = "";
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], PolicyMapping.prototype, "issuerDomainPolicy", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], PolicyMapping.prototype, "subjectDomainPolicy", void 0);
var PolicyMappings = PolicyMappings_1 = class PolicyMappings2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, PolicyMappings_1.prototype);
  }
};
PolicyMappings = PolicyMappings_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: PolicyMapping
  })
], PolicyMappings);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/subject_alternative_name.js
var SubjectAlternativeName_1;
var id_ce_subjectAltName = `${id_ce}.17`;
var SubjectAlternativeName = SubjectAlternativeName_1 = class SubjectAlternativeName2 extends GeneralNames {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, SubjectAlternativeName_1.prototype);
  }
};
SubjectAlternativeName = SubjectAlternativeName_1 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], SubjectAlternativeName);

// node_modules/@peculiar/asn1-x509/build/es2015/attribute.js
var Attribute = class {
  type = "";
  values = [];
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], Attribute.prototype, "type", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    repeated: "set"
  })
], Attribute.prototype, "values", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/subject_directory_attributes.js
var SubjectDirectoryAttributes_1;
var id_ce_subjectDirectoryAttributes = `${id_ce}.9`;
var SubjectDirectoryAttributes = SubjectDirectoryAttributes_1 = class SubjectDirectoryAttributes2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, SubjectDirectoryAttributes_1.prototype);
  }
};
SubjectDirectoryAttributes = SubjectDirectoryAttributes_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Attribute
  })
], SubjectDirectoryAttributes);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/subject_key_identifier.js
var id_ce_subjectKeyIdentifier = `${id_ce}.14`;
var SubjectKeyIdentifier = class extends KeyIdentifier {
};

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/private_key_usage_period.js
var id_ce_privateKeyUsagePeriod = `${id_ce}.16`;
var PrivateKeyUsagePeriod = class {
  notBefore;
  notAfter;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.GeneralizedTime,
    context: 0,
    implicit: true,
    optional: true
  })
], PrivateKeyUsagePeriod.prototype, "notBefore", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.GeneralizedTime,
    context: 1,
    implicit: true,
    optional: true
  })
], PrivateKeyUsagePeriod.prototype, "notAfter", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/entrust_version_info.js
var EntrustInfoFlags;
(function(EntrustInfoFlags2) {
  EntrustInfoFlags2[EntrustInfoFlags2["keyUpdateAllowed"] = 1] = "keyUpdateAllowed";
  EntrustInfoFlags2[EntrustInfoFlags2["newExtensions"] = 2] = "newExtensions";
  EntrustInfoFlags2[EntrustInfoFlags2["pKIXCertificate"] = 4] = "pKIXCertificate";
})(EntrustInfoFlags || (EntrustInfoFlags = {}));
var EntrustInfo = class extends BitString2 {
  toJSON() {
    const res = [];
    const flags = this.toNumber();
    if (flags & EntrustInfoFlags.pKIXCertificate) {
      res.push("pKIXCertificate");
    }
    if (flags & EntrustInfoFlags.newExtensions) {
      res.push("newExtensions");
    }
    if (flags & EntrustInfoFlags.keyUpdateAllowed) {
      res.push("keyUpdateAllowed");
    }
    return res;
  }
  toString() {
    return `[${this.toJSON().join(", ")}]`;
  }
};
var EntrustVersionInfo = class {
  entrustVers = "";
  entrustInfoFlags = new EntrustInfo();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.GeneralString })
], EntrustVersionInfo.prototype, "entrustVers", void 0);
__decorate([
  AsnProp({ type: EntrustInfo })
], EntrustVersionInfo.prototype, "entrustInfoFlags", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extensions/subject_info_access.js
var SubjectInfoAccessSyntax_1;
var id_pe_subjectInfoAccess = `${id_pe}.11`;
var SubjectInfoAccessSyntax = SubjectInfoAccessSyntax_1 = class SubjectInfoAccessSyntax2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, SubjectInfoAccessSyntax_1.prototype);
  }
};
SubjectInfoAccessSyntax = SubjectInfoAccessSyntax_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AccessDescription
  })
], SubjectInfoAccessSyntax);

// node_modules/@peculiar/asn1-x509/build/es2015/algorithm_identifier.js
var AlgorithmIdentifier = class _AlgorithmIdentifier {
  algorithm = "";
  parameters;
  constructor(params = {}) {
    Object.assign(this, params);
  }
  isEqual(data) {
    return data instanceof _AlgorithmIdentifier && data.algorithm == this.algorithm && (data.parameters && this.parameters && equal(data.parameters, this.parameters) || data.parameters === this.parameters);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], AlgorithmIdentifier.prototype, "algorithm", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    optional: true
  })
], AlgorithmIdentifier.prototype, "parameters", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/subject_public_key_info.js
var SubjectPublicKeyInfo = class {
  algorithm = new AlgorithmIdentifier();
  subjectPublicKey = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], SubjectPublicKeyInfo.prototype, "algorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BitString })
], SubjectPublicKeyInfo.prototype, "subjectPublicKey", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/time.js
var Time = class Time2 {
  utcTime;
  generalTime;
  constructor(time) {
    if (time) {
      if (typeof time === "string" || typeof time === "number" || time instanceof Date) {
        const date = new Date(time);
        date.setMilliseconds(0);
        if (date.getUTCFullYear() > 2049) {
          this.generalTime = date;
        } else {
          this.utcTime = date;
        }
      } else {
        Object.assign(this, time);
      }
    }
  }
  getTime() {
    const time = this.utcTime || this.generalTime;
    if (!time) {
      throw new Error("Cannot get time from CHOICE object");
    }
    return time;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.UTCTime })
], Time.prototype, "utcTime", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.GeneralizedTime })
], Time.prototype, "generalTime", void 0);
Time = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], Time);

// node_modules/@peculiar/asn1-x509/build/es2015/validity.js
var Validity = class {
  notBefore = new Time(/* @__PURE__ */ new Date());
  notAfter = new Time(/* @__PURE__ */ new Date());
  constructor(params) {
    if (params) {
      this.notBefore = new Time(params.notBefore);
      this.notAfter = new Time(params.notAfter);
    }
  }
};
__decorate([
  AsnProp({ type: Time })
], Validity.prototype, "notBefore", void 0);
__decorate([
  AsnProp({ type: Time })
], Validity.prototype, "notAfter", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/extension.js
var Extensions_1;
var Extension = class _Extension {
  static CRITICAL = false;
  extnID = "";
  critical = _Extension.CRITICAL;
  extnValue = new OctetString2();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], Extension.prototype, "extnID", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Boolean,
    defaultValue: Extension.CRITICAL
  })
], Extension.prototype, "critical", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], Extension.prototype, "extnValue", void 0);
var Extensions = Extensions_1 = class Extensions2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, Extensions_1.prototype);
  }
};
Extensions = Extensions_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Extension
  })
], Extensions);

// node_modules/@peculiar/asn1-x509/build/es2015/types.js
var Version;
(function(Version5) {
  Version5[Version5["v1"] = 0] = "v1";
  Version5[Version5["v2"] = 1] = "v2";
  Version5[Version5["v3"] = 2] = "v3";
})(Version || (Version = {}));

// node_modules/@peculiar/asn1-x509/build/es2015/tbs_certificate.js
var TBSCertificate = class {
  version = Version.v1;
  serialNumber = new ArrayBuffer(0);
  signature = new AlgorithmIdentifier();
  issuer = new Name();
  validity = new Validity();
  subject = new Name();
  subjectPublicKeyInfo = new SubjectPublicKeyInfo();
  issuerUniqueID;
  subjectUniqueID;
  extensions;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 0,
    defaultValue: Version.v1
  })
], TBSCertificate.prototype, "version", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], TBSCertificate.prototype, "serialNumber", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], TBSCertificate.prototype, "signature", void 0);
__decorate([
  AsnProp({ type: Name })
], TBSCertificate.prototype, "issuer", void 0);
__decorate([
  AsnProp({ type: Validity })
], TBSCertificate.prototype, "validity", void 0);
__decorate([
  AsnProp({ type: Name })
], TBSCertificate.prototype, "subject", void 0);
__decorate([
  AsnProp({ type: SubjectPublicKeyInfo })
], TBSCertificate.prototype, "subjectPublicKeyInfo", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.BitString,
    context: 1,
    implicit: true,
    optional: true
  })
], TBSCertificate.prototype, "issuerUniqueID", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.BitString,
    context: 2,
    implicit: true,
    optional: true
  })
], TBSCertificate.prototype, "subjectUniqueID", void 0);
__decorate([
  AsnProp({
    type: Extensions,
    context: 3,
    optional: true
  })
], TBSCertificate.prototype, "extensions", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/certificate.js
var Certificate = class {
  tbsCertificate = new TBSCertificate();
  tbsCertificateRaw;
  signatureAlgorithm = new AlgorithmIdentifier();
  signatureValue = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: TBSCertificate,
    raw: true
  })
], Certificate.prototype, "tbsCertificate", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], Certificate.prototype, "signatureAlgorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BitString })
], Certificate.prototype, "signatureValue", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/tbs_cert_list.js
var RevokedCertificate = class {
  userCertificate = new ArrayBuffer(0);
  revocationDate = new Time();
  crlEntryExtensions;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RevokedCertificate.prototype, "userCertificate", void 0);
__decorate([
  AsnProp({ type: Time })
], RevokedCertificate.prototype, "revocationDate", void 0);
__decorate([
  AsnProp({
    type: Extension,
    optional: true,
    repeated: "sequence"
  })
], RevokedCertificate.prototype, "crlEntryExtensions", void 0);
var TBSCertList = class {
  version;
  signature = new AlgorithmIdentifier();
  issuer = new Name();
  thisUpdate = new Time();
  nextUpdate;
  revokedCertificates;
  crlExtensions;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    optional: true
  })
], TBSCertList.prototype, "version", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], TBSCertList.prototype, "signature", void 0);
__decorate([
  AsnProp({ type: Name })
], TBSCertList.prototype, "issuer", void 0);
__decorate([
  AsnProp({ type: Time })
], TBSCertList.prototype, "thisUpdate", void 0);
__decorate([
  AsnProp({
    type: Time,
    optional: true
  })
], TBSCertList.prototype, "nextUpdate", void 0);
__decorate([
  AsnProp({
    type: RevokedCertificate,
    repeated: "sequence",
    optional: true
  })
], TBSCertList.prototype, "revokedCertificates", void 0);
__decorate([
  AsnProp({
    type: Extension,
    optional: true,
    context: 0,
    repeated: "sequence"
  })
], TBSCertList.prototype, "crlExtensions", void 0);

// node_modules/@peculiar/asn1-x509/build/es2015/certificate_list.js
var CertificateList = class {
  tbsCertList = new TBSCertList();
  tbsCertListRaw;
  signatureAlgorithm = new AlgorithmIdentifier();
  signature = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: TBSCertList,
    raw: true
  })
], CertificateList.prototype, "tbsCertList", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], CertificateList.prototype, "signatureAlgorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BitString })
], CertificateList.prototype, "signature", void 0);

// node_modules/@simplewebauthn/server/esm/helpers/getCertificateInfo.js
var issuerSubjectIDKey = {
  "2.5.4.6": "C",
  "2.5.4.10": "O",
  "2.5.4.11": "OU",
  "2.5.4.3": "CN"
};
function getCertificateInfo(leafCertBuffer) {
  const x509 = AsnParser.parse(leafCertBuffer, Certificate);
  const parsedCert = x509.tbsCertificate;
  const issuer = { combined: "" };
  parsedCert.issuer.forEach(([iss]) => {
    const key = issuerSubjectIDKey[iss.type];
    if (key) {
      issuer[key] = iss.value.toString();
    }
  });
  issuer.combined = issuerSubjectToString(issuer);
  const subject = { combined: "" };
  parsedCert.subject.forEach(([iss]) => {
    const key = issuerSubjectIDKey[iss.type];
    if (key) {
      subject[key] = iss.value.toString();
    }
  });
  subject.combined = issuerSubjectToString(subject);
  let basicConstraintsCA = false;
  if (parsedCert.extensions) {
    for (const ext of parsedCert.extensions) {
      if (ext.extnID === id_ce_basicConstraints) {
        const basicConstraints = AsnParser.parse(ext.extnValue, BasicConstraints);
        basicConstraintsCA = basicConstraints.cA;
      }
    }
  }
  return {
    issuer,
    subject,
    version: parsedCert.version,
    basicConstraintsCA,
    notBefore: parsedCert.validity.notBefore.getTime(),
    notAfter: parsedCert.validity.notAfter.getTime(),
    parsedCertificate: x509
  };
}
function issuerSubjectToString(input) {
  const parts = [];
  if (input.C) {
    parts.push(input.C);
  }
  if (input.O) {
    parts.push(input.O);
  }
  if (input.OU) {
    parts.push(input.OU);
  }
  if (input.CN) {
    parts.push(input.CN);
  }
  return parts.join(" : ");
}

// node_modules/@simplewebauthn/server/esm/helpers/isCertRevoked.js
var import_reflect_metadata = __toESM(require_Reflect(), 1);

// node_modules/@peculiar/x509/build/x509.es.js
var import_pvtsutils = __toESM(require_build());

// node_modules/@peculiar/asn1-cms/build/es2015/issuer_and_serial_number.js
var IssuerAndSerialNumber = class {
  issuer = new Name();
  serialNumber = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: Name })
], IssuerAndSerialNumber.prototype, "issuer", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], IssuerAndSerialNumber.prototype, "serialNumber", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/signer_identifier.js
var SignerIdentifier = class SignerIdentifier2 {
  subjectKeyIdentifier;
  issuerAndSerialNumber;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: SubjectKeyIdentifier,
    context: 0,
    implicit: true
  })
], SignerIdentifier.prototype, "subjectKeyIdentifier", void 0);
__decorate([
  AsnProp({ type: IssuerAndSerialNumber })
], SignerIdentifier.prototype, "issuerAndSerialNumber", void 0);
SignerIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], SignerIdentifier);

// node_modules/@peculiar/asn1-cms/build/es2015/types.js
var CMSVersion;
(function(CMSVersion2) {
  CMSVersion2[CMSVersion2["v0"] = 0] = "v0";
  CMSVersion2[CMSVersion2["v1"] = 1] = "v1";
  CMSVersion2[CMSVersion2["v2"] = 2] = "v2";
  CMSVersion2[CMSVersion2["v3"] = 3] = "v3";
  CMSVersion2[CMSVersion2["v4"] = 4] = "v4";
  CMSVersion2[CMSVersion2["v5"] = 5] = "v5";
})(CMSVersion || (CMSVersion = {}));
var DigestAlgorithmIdentifier = class DigestAlgorithmIdentifier2 extends AlgorithmIdentifier {
};
DigestAlgorithmIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], DigestAlgorithmIdentifier);
var SignatureAlgorithmIdentifier = class SignatureAlgorithmIdentifier2 extends AlgorithmIdentifier {
};
SignatureAlgorithmIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], SignatureAlgorithmIdentifier);
var KeyEncryptionAlgorithmIdentifier = class KeyEncryptionAlgorithmIdentifier2 extends AlgorithmIdentifier {
};
KeyEncryptionAlgorithmIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], KeyEncryptionAlgorithmIdentifier);
var ContentEncryptionAlgorithmIdentifier = class ContentEncryptionAlgorithmIdentifier2 extends AlgorithmIdentifier {
};
ContentEncryptionAlgorithmIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], ContentEncryptionAlgorithmIdentifier);
var MessageAuthenticationCodeAlgorithm = class MessageAuthenticationCodeAlgorithm2 extends AlgorithmIdentifier {
};
MessageAuthenticationCodeAlgorithm = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], MessageAuthenticationCodeAlgorithm);
var KeyDerivationAlgorithmIdentifier = class KeyDerivationAlgorithmIdentifier2 extends AlgorithmIdentifier {
};
KeyDerivationAlgorithmIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], KeyDerivationAlgorithmIdentifier);

// node_modules/@peculiar/asn1-cms/build/es2015/attribute.js
var Attribute2 = class {
  attrType = "";
  attrValues = [];
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], Attribute2.prototype, "attrType", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    repeated: "set"
  })
], Attribute2.prototype, "attrValues", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/signer_info.js
var SignerInfos_1;
var SignerInfo = class {
  version = CMSVersion.v0;
  sid = new SignerIdentifier();
  digestAlgorithm = new DigestAlgorithmIdentifier();
  signedAttrs;
  signedAttrsRaw;
  signatureAlgorithm = new SignatureAlgorithmIdentifier();
  signature = new OctetString2();
  unsignedAttrs;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], SignerInfo.prototype, "version", void 0);
__decorate([
  AsnProp({ type: SignerIdentifier })
], SignerInfo.prototype, "sid", void 0);
__decorate([
  AsnProp({ type: DigestAlgorithmIdentifier })
], SignerInfo.prototype, "digestAlgorithm", void 0);
__decorate([
  AsnProp({
    type: Attribute2,
    repeated: "set",
    context: 0,
    implicit: true,
    optional: true,
    raw: true
  })
], SignerInfo.prototype, "signedAttrs", void 0);
__decorate([
  AsnProp({ type: SignatureAlgorithmIdentifier })
], SignerInfo.prototype, "signatureAlgorithm", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], SignerInfo.prototype, "signature", void 0);
__decorate([
  AsnProp({
    type: Attribute2,
    repeated: "set",
    context: 1,
    implicit: true,
    optional: true
  })
], SignerInfo.prototype, "unsignedAttrs", void 0);
var SignerInfos = SignerInfos_1 = class SignerInfos2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, SignerInfos_1.prototype);
  }
};
SignerInfos = SignerInfos_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: SignerInfo
  })
], SignerInfos);

// node_modules/@peculiar/asn1-cms/build/es2015/attributes/counter_signature.js
var CounterSignature = class CounterSignature2 extends SignerInfo {
};
CounterSignature = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], CounterSignature);

// node_modules/@peculiar/asn1-cms/build/es2015/attributes/signing_time.js
var SigningTime = class SigningTime2 extends Time {
};
SigningTime = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], SigningTime);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/aa_clear_attrs.js
var ACClearAttrs = class {
  acIssuer = new GeneralName();
  acSerial = 0;
  attrs = [];
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: GeneralName })
], ACClearAttrs.prototype, "acIssuer", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], ACClearAttrs.prototype, "acSerial", void 0);
__decorate([
  AsnProp({
    type: Attribute,
    repeated: "sequence"
  })
], ACClearAttrs.prototype, "attrs", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/attr_spec.js
var AttrSpec_1;
var AttrSpec = AttrSpec_1 = class AttrSpec2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, AttrSpec_1.prototype);
  }
};
AttrSpec = AttrSpec_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AsnPropTypes.ObjectIdentifier
  })
], AttrSpec);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/aa_controls.js
var AAControls = class {
  pathLenConstraint;
  permittedAttrs;
  excludedAttrs;
  permitUnSpecified = true;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    optional: true
  })
], AAControls.prototype, "pathLenConstraint", void 0);
__decorate([
  AsnProp({
    type: AttrSpec,
    implicit: true,
    context: 0,
    optional: true
  })
], AAControls.prototype, "permittedAttrs", void 0);
__decorate([
  AsnProp({
    type: AttrSpec,
    implicit: true,
    context: 1,
    optional: true
  })
], AAControls.prototype, "excludedAttrs", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Boolean,
    defaultValue: true
  })
], AAControls.prototype, "permitUnSpecified", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/issuer_serial.js
var IssuerSerial = class {
  issuer = new GeneralNames();
  serial = new ArrayBuffer(0);
  issuerUID = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: GeneralNames })
], IssuerSerial.prototype, "issuer", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], IssuerSerial.prototype, "serial", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.BitString,
    optional: true
  })
], IssuerSerial.prototype, "issuerUID", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/object_digest_info.js
var DigestedObjectType;
(function(DigestedObjectType2) {
  DigestedObjectType2[DigestedObjectType2["publicKey"] = 0] = "publicKey";
  DigestedObjectType2[DigestedObjectType2["publicKeyCert"] = 1] = "publicKeyCert";
  DigestedObjectType2[DigestedObjectType2["otherObjectTypes"] = 2] = "otherObjectTypes";
})(DigestedObjectType || (DigestedObjectType = {}));
var ObjectDigestInfo = class {
  digestedObjectType = DigestedObjectType.publicKey;
  otherObjectTypeID;
  digestAlgorithm = new AlgorithmIdentifier();
  objectDigest = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], ObjectDigestInfo.prototype, "digestedObjectType", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.ObjectIdentifier,
    optional: true
  })
], ObjectDigestInfo.prototype, "otherObjectTypeID", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], ObjectDigestInfo.prototype, "digestAlgorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BitString })
], ObjectDigestInfo.prototype, "objectDigest", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/v2_form.js
var V2Form = class {
  issuerName;
  baseCertificateID;
  objectDigestInfo;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: GeneralNames,
    optional: true
  })
], V2Form.prototype, "issuerName", void 0);
__decorate([
  AsnProp({
    type: IssuerSerial,
    context: 0,
    implicit: true,
    optional: true
  })
], V2Form.prototype, "baseCertificateID", void 0);
__decorate([
  AsnProp({
    type: ObjectDigestInfo,
    context: 1,
    implicit: true,
    optional: true
  })
], V2Form.prototype, "objectDigestInfo", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/attr_cert_issuer.js
var AttCertIssuer = class AttCertIssuer2 {
  v1Form;
  v2Form;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: GeneralName,
    repeated: "sequence"
  })
], AttCertIssuer.prototype, "v1Form", void 0);
__decorate([
  AsnProp({
    type: V2Form,
    context: 0,
    implicit: true
  })
], AttCertIssuer.prototype, "v2Form", void 0);
AttCertIssuer = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], AttCertIssuer);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/attr_cert_validity_period.js
var AttCertValidityPeriod = class {
  notBeforeTime = /* @__PURE__ */ new Date();
  notAfterTime = /* @__PURE__ */ new Date();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.GeneralizedTime })
], AttCertValidityPeriod.prototype, "notBeforeTime", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.GeneralizedTime })
], AttCertValidityPeriod.prototype, "notAfterTime", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/holder.js
var Holder = class {
  baseCertificateID;
  entityName;
  objectDigestInfo;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: IssuerSerial,
    implicit: true,
    context: 0,
    optional: true
  })
], Holder.prototype, "baseCertificateID", void 0);
__decorate([
  AsnProp({
    type: GeneralNames,
    implicit: true,
    context: 1,
    optional: true
  })
], Holder.prototype, "entityName", void 0);
__decorate([
  AsnProp({
    type: ObjectDigestInfo,
    implicit: true,
    context: 2,
    optional: true
  })
], Holder.prototype, "objectDigestInfo", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/attribute_certificate_info.js
var AttCertVersion;
(function(AttCertVersion2) {
  AttCertVersion2[AttCertVersion2["v2"] = 1] = "v2";
})(AttCertVersion || (AttCertVersion = {}));
var AttributeCertificateInfo = class {
  version = AttCertVersion.v2;
  holder = new Holder();
  issuer = new AttCertIssuer();
  signature = new AlgorithmIdentifier();
  serialNumber = new ArrayBuffer(0);
  attrCertValidityPeriod = new AttCertValidityPeriod();
  attributes = [];
  issuerUniqueID;
  extensions;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], AttributeCertificateInfo.prototype, "version", void 0);
__decorate([
  AsnProp({ type: Holder })
], AttributeCertificateInfo.prototype, "holder", void 0);
__decorate([
  AsnProp({ type: AttCertIssuer })
], AttributeCertificateInfo.prototype, "issuer", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], AttributeCertificateInfo.prototype, "signature", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], AttributeCertificateInfo.prototype, "serialNumber", void 0);
__decorate([
  AsnProp({ type: AttCertValidityPeriod })
], AttributeCertificateInfo.prototype, "attrCertValidityPeriod", void 0);
__decorate([
  AsnProp({
    type: Attribute,
    repeated: "sequence"
  })
], AttributeCertificateInfo.prototype, "attributes", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.BitString,
    optional: true
  })
], AttributeCertificateInfo.prototype, "issuerUniqueID", void 0);
__decorate([
  AsnProp({
    type: Extensions,
    optional: true
  })
], AttributeCertificateInfo.prototype, "extensions", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/attribute_certificate.js
var AttributeCertificate = class {
  acinfo = new AttributeCertificateInfo();
  signatureAlgorithm = new AlgorithmIdentifier();
  signatureValue = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AttributeCertificateInfo })
], AttributeCertificate.prototype, "acinfo", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], AttributeCertificate.prototype, "signatureAlgorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BitString })
], AttributeCertificate.prototype, "signatureValue", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/class_list.js
var ClassListFlags;
(function(ClassListFlags2) {
  ClassListFlags2[ClassListFlags2["unmarked"] = 1] = "unmarked";
  ClassListFlags2[ClassListFlags2["unclassified"] = 2] = "unclassified";
  ClassListFlags2[ClassListFlags2["restricted"] = 4] = "restricted";
  ClassListFlags2[ClassListFlags2["confidential"] = 8] = "confidential";
  ClassListFlags2[ClassListFlags2["secret"] = 16] = "secret";
  ClassListFlags2[ClassListFlags2["topSecret"] = 32] = "topSecret";
})(ClassListFlags || (ClassListFlags = {}));
var ClassList = class extends BitString2 {
};

// node_modules/@peculiar/asn1-x509-attr/build/es2015/security_category.js
var SecurityCategory = class {
  type = "";
  value = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.ObjectIdentifier,
    implicit: true,
    context: 0
  })
], SecurityCategory.prototype, "type", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    implicit: true,
    context: 1
  })
], SecurityCategory.prototype, "value", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/clearance.js
var Clearance = class {
  policyId = "";
  classList = new ClassList(ClassListFlags.unclassified);
  securityCategories;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], Clearance.prototype, "policyId", void 0);
__decorate([
  AsnProp({
    type: ClassList,
    defaultValue: new ClassList(ClassListFlags.unclassified)
  })
], Clearance.prototype, "classList", void 0);
__decorate([
  AsnProp({
    type: SecurityCategory,
    repeated: "set"
  })
], Clearance.prototype, "securityCategories", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/ietf_attr_syntax.js
var IetfAttrSyntaxValueChoices = class {
  cotets;
  oid;
  string;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: OctetString2 })
], IetfAttrSyntaxValueChoices.prototype, "cotets", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], IetfAttrSyntaxValueChoices.prototype, "oid", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Utf8String })
], IetfAttrSyntaxValueChoices.prototype, "string", void 0);
var IetfAttrSyntax = class {
  policyAuthority;
  values = [];
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: GeneralNames,
    implicit: true,
    context: 0,
    optional: true
  })
], IetfAttrSyntax.prototype, "policyAuthority", void 0);
__decorate([
  AsnProp({
    type: IetfAttrSyntaxValueChoices,
    repeated: "sequence"
  })
], IetfAttrSyntax.prototype, "values", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/object_identifiers.js
var id_pe_ac_auditIdentity = `${id_pe}.4`;
var id_pe_aaControls = `${id_pe}.6`;
var id_pe_ac_proxying = `${id_pe}.10`;
var id_ce_targetInformation = `${id_ce}.55`;
var id_aca = `${id_pkix}.10`;
var id_aca_authenticationInfo = `${id_aca}.1`;
var id_aca_accessIdentity = `${id_aca}.2`;
var id_aca_chargingIdentity = `${id_aca}.3`;
var id_aca_group = `${id_aca}.4`;
var id_aca_encAttrs = `${id_aca}.6`;
var id_at = "2.5.4";
var id_at_role = `${id_at}.72`;

// node_modules/@peculiar/asn1-x509-attr/build/es2015/target.js
var Targets_1;
var TargetCert = class {
  targetCertificate = new IssuerSerial();
  targetName;
  certDigestInfo;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: IssuerSerial })
], TargetCert.prototype, "targetCertificate", void 0);
__decorate([
  AsnProp({
    type: GeneralName,
    optional: true
  })
], TargetCert.prototype, "targetName", void 0);
__decorate([
  AsnProp({
    type: ObjectDigestInfo,
    optional: true
  })
], TargetCert.prototype, "certDigestInfo", void 0);
var Target = class Target2 {
  targetName;
  targetGroup;
  targetCert;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: GeneralName,
    context: 0,
    implicit: true
  })
], Target.prototype, "targetName", void 0);
__decorate([
  AsnProp({
    type: GeneralName,
    context: 1,
    implicit: true
  })
], Target.prototype, "targetGroup", void 0);
__decorate([
  AsnProp({
    type: TargetCert,
    context: 2,
    implicit: true
  })
], Target.prototype, "targetCert", void 0);
Target = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], Target);
var Targets = Targets_1 = class Targets2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, Targets_1.prototype);
  }
};
Targets = Targets_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Target
  })
], Targets);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/proxy_info.js
var ProxyInfo_1;
var ProxyInfo = ProxyInfo_1 = class ProxyInfo2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, ProxyInfo_1.prototype);
  }
};
ProxyInfo = ProxyInfo_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Targets
  })
], ProxyInfo);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/role_syntax.js
var RoleSyntax = class {
  roleAuthority;
  roleName;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: GeneralNames,
    implicit: true,
    context: 0,
    optional: true
  })
], RoleSyntax.prototype, "roleAuthority", void 0);
__decorate([
  AsnProp({
    type: GeneralName,
    implicit: true,
    context: 1
  })
], RoleSyntax.prototype, "roleName", void 0);

// node_modules/@peculiar/asn1-x509-attr/build/es2015/svce_auth_info.js
var SvceAuthInfo = class {
  service = new GeneralName();
  ident = new GeneralName();
  authInfo;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: GeneralName })
], SvceAuthInfo.prototype, "service", void 0);
__decorate([
  AsnProp({ type: GeneralName })
], SvceAuthInfo.prototype, "ident", void 0);
__decorate([
  AsnProp({
    type: OctetString2,
    optional: true
  })
], SvceAuthInfo.prototype, "authInfo", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/certificate_choices.js
var CertificateSet_1;
var OtherCertificateFormat = class {
  otherCertFormat = "";
  otherCert = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], OtherCertificateFormat.prototype, "otherCertFormat", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Any })
], OtherCertificateFormat.prototype, "otherCert", void 0);
var CertificateChoices = class CertificateChoices2 {
  certificate;
  v2AttrCert;
  other;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: Certificate })
], CertificateChoices.prototype, "certificate", void 0);
__decorate([
  AsnProp({
    type: AttributeCertificate,
    context: 2,
    implicit: true
  })
], CertificateChoices.prototype, "v2AttrCert", void 0);
__decorate([
  AsnProp({
    type: OtherCertificateFormat,
    context: 3,
    implicit: true
  })
], CertificateChoices.prototype, "other", void 0);
CertificateChoices = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], CertificateChoices);
var CertificateSet = CertificateSet_1 = class CertificateSet2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CertificateSet_1.prototype);
  }
};
CertificateSet = CertificateSet_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: CertificateChoices
  })
], CertificateSet);

// node_modules/@peculiar/asn1-cms/build/es2015/content_info.js
var ContentInfo = class {
  contentType = "";
  content = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], ContentInfo.prototype, "contentType", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })
], ContentInfo.prototype, "content", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/encapsulated_content_info.js
var EncapsulatedContent = class EncapsulatedContent2 {
  single;
  any;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: OctetString2 })
], EncapsulatedContent.prototype, "single", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Any })
], EncapsulatedContent.prototype, "any", void 0);
EncapsulatedContent = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], EncapsulatedContent);
var EncapsulatedContentInfo = class {
  eContentType = "";
  eContent;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], EncapsulatedContentInfo.prototype, "eContentType", void 0);
__decorate([
  AsnProp({
    type: EncapsulatedContent,
    context: 0,
    optional: true
  })
], EncapsulatedContentInfo.prototype, "eContent", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/encrypted_content_info.js
var EncryptedContent = class EncryptedContent2 {
  value;
  constructedValue;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: OctetString2,
    context: 0,
    implicit: true,
    optional: true
  })
], EncryptedContent.prototype, "value", void 0);
__decorate([
  AsnProp({
    type: OctetString2,
    converter: AsnConstructedOctetStringConverter,
    context: 0,
    implicit: true,
    optional: true,
    repeated: "sequence"
  })
], EncryptedContent.prototype, "constructedValue", void 0);
EncryptedContent = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], EncryptedContent);
var EncryptedContentInfo = class {
  contentType = "";
  contentEncryptionAlgorithm = new ContentEncryptionAlgorithmIdentifier();
  encryptedContent;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], EncryptedContentInfo.prototype, "contentType", void 0);
__decorate([
  AsnProp({ type: ContentEncryptionAlgorithmIdentifier })
], EncryptedContentInfo.prototype, "contentEncryptionAlgorithm", void 0);
__decorate([
  AsnProp({
    type: EncryptedContent,
    optional: true
  })
], EncryptedContentInfo.prototype, "encryptedContent", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/other_key_attribute.js
var OtherKeyAttribute = class {
  keyAttrId = "";
  keyAttr;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], OtherKeyAttribute.prototype, "keyAttrId", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    optional: true
  })
], OtherKeyAttribute.prototype, "keyAttr", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/key_agree_recipient_info.js
var RecipientEncryptedKeys_1;
var RecipientKeyIdentifier = class {
  subjectKeyIdentifier = new SubjectKeyIdentifier();
  date;
  other;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: SubjectKeyIdentifier })
], RecipientKeyIdentifier.prototype, "subjectKeyIdentifier", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.GeneralizedTime,
    optional: true
  })
], RecipientKeyIdentifier.prototype, "date", void 0);
__decorate([
  AsnProp({
    type: OtherKeyAttribute,
    optional: true
  })
], RecipientKeyIdentifier.prototype, "other", void 0);
var KeyAgreeRecipientIdentifier = class KeyAgreeRecipientIdentifier2 {
  rKeyId;
  issuerAndSerialNumber;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: RecipientKeyIdentifier,
    context: 0,
    implicit: true,
    optional: true
  })
], KeyAgreeRecipientIdentifier.prototype, "rKeyId", void 0);
__decorate([
  AsnProp({
    type: IssuerAndSerialNumber,
    optional: true
  })
], KeyAgreeRecipientIdentifier.prototype, "issuerAndSerialNumber", void 0);
KeyAgreeRecipientIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], KeyAgreeRecipientIdentifier);
var RecipientEncryptedKey = class {
  rid = new KeyAgreeRecipientIdentifier();
  encryptedKey = new OctetString2();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: KeyAgreeRecipientIdentifier })
], RecipientEncryptedKey.prototype, "rid", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], RecipientEncryptedKey.prototype, "encryptedKey", void 0);
var RecipientEncryptedKeys = RecipientEncryptedKeys_1 = class RecipientEncryptedKeys2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, RecipientEncryptedKeys_1.prototype);
  }
};
RecipientEncryptedKeys = RecipientEncryptedKeys_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: RecipientEncryptedKey
  })
], RecipientEncryptedKeys);
var OriginatorPublicKey = class {
  algorithm = new AlgorithmIdentifier();
  publicKey = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], OriginatorPublicKey.prototype, "algorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BitString })
], OriginatorPublicKey.prototype, "publicKey", void 0);
var OriginatorIdentifierOrKey = class OriginatorIdentifierOrKey2 {
  subjectKeyIdentifier;
  originatorKey;
  issuerAndSerialNumber;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: SubjectKeyIdentifier,
    context: 0,
    implicit: true,
    optional: true
  })
], OriginatorIdentifierOrKey.prototype, "subjectKeyIdentifier", void 0);
__decorate([
  AsnProp({
    type: OriginatorPublicKey,
    context: 1,
    implicit: true,
    optional: true
  })
], OriginatorIdentifierOrKey.prototype, "originatorKey", void 0);
__decorate([
  AsnProp({
    type: IssuerAndSerialNumber,
    optional: true
  })
], OriginatorIdentifierOrKey.prototype, "issuerAndSerialNumber", void 0);
OriginatorIdentifierOrKey = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], OriginatorIdentifierOrKey);
var KeyAgreeRecipientInfo = class {
  version = CMSVersion.v3;
  originator = new OriginatorIdentifierOrKey();
  ukm;
  keyEncryptionAlgorithm = new KeyEncryptionAlgorithmIdentifier();
  recipientEncryptedKeys = new RecipientEncryptedKeys();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], KeyAgreeRecipientInfo.prototype, "version", void 0);
__decorate([
  AsnProp({
    type: OriginatorIdentifierOrKey,
    context: 0
  })
], KeyAgreeRecipientInfo.prototype, "originator", void 0);
__decorate([
  AsnProp({
    type: OctetString2,
    context: 1,
    optional: true
  })
], KeyAgreeRecipientInfo.prototype, "ukm", void 0);
__decorate([
  AsnProp({ type: KeyEncryptionAlgorithmIdentifier })
], KeyAgreeRecipientInfo.prototype, "keyEncryptionAlgorithm", void 0);
__decorate([
  AsnProp({ type: RecipientEncryptedKeys })
], KeyAgreeRecipientInfo.prototype, "recipientEncryptedKeys", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/key_trans_recipient_info.js
var RecipientIdentifier = class RecipientIdentifier2 {
  subjectKeyIdentifier;
  issuerAndSerialNumber;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: SubjectKeyIdentifier,
    context: 0,
    implicit: true
  })
], RecipientIdentifier.prototype, "subjectKeyIdentifier", void 0);
__decorate([
  AsnProp({ type: IssuerAndSerialNumber })
], RecipientIdentifier.prototype, "issuerAndSerialNumber", void 0);
RecipientIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], RecipientIdentifier);
var KeyTransRecipientInfo = class {
  version = CMSVersion.v0;
  rid = new RecipientIdentifier();
  keyEncryptionAlgorithm = new KeyEncryptionAlgorithmIdentifier();
  encryptedKey = new OctetString2();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], KeyTransRecipientInfo.prototype, "version", void 0);
__decorate([
  AsnProp({ type: RecipientIdentifier })
], KeyTransRecipientInfo.prototype, "rid", void 0);
__decorate([
  AsnProp({ type: KeyEncryptionAlgorithmIdentifier })
], KeyTransRecipientInfo.prototype, "keyEncryptionAlgorithm", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], KeyTransRecipientInfo.prototype, "encryptedKey", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/kek_recipient_info.js
var KEKIdentifier = class {
  keyIdentifier = new OctetString2();
  date;
  other;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: OctetString2 })
], KEKIdentifier.prototype, "keyIdentifier", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.GeneralizedTime,
    optional: true
  })
], KEKIdentifier.prototype, "date", void 0);
__decorate([
  AsnProp({
    type: OtherKeyAttribute,
    optional: true
  })
], KEKIdentifier.prototype, "other", void 0);
var KEKRecipientInfo = class {
  version = CMSVersion.v4;
  kekid = new KEKIdentifier();
  keyEncryptionAlgorithm = new KeyEncryptionAlgorithmIdentifier();
  encryptedKey = new OctetString2();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], KEKRecipientInfo.prototype, "version", void 0);
__decorate([
  AsnProp({ type: KEKIdentifier })
], KEKRecipientInfo.prototype, "kekid", void 0);
__decorate([
  AsnProp({ type: KeyEncryptionAlgorithmIdentifier })
], KEKRecipientInfo.prototype, "keyEncryptionAlgorithm", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], KEKRecipientInfo.prototype, "encryptedKey", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/password_recipient_info.js
var PasswordRecipientInfo = class {
  version = CMSVersion.v0;
  keyDerivationAlgorithm;
  keyEncryptionAlgorithm = new KeyEncryptionAlgorithmIdentifier();
  encryptedKey = new OctetString2();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], PasswordRecipientInfo.prototype, "version", void 0);
__decorate([
  AsnProp({
    type: KeyDerivationAlgorithmIdentifier,
    context: 0,
    optional: true
  })
], PasswordRecipientInfo.prototype, "keyDerivationAlgorithm", void 0);
__decorate([
  AsnProp({ type: KeyEncryptionAlgorithmIdentifier })
], PasswordRecipientInfo.prototype, "keyEncryptionAlgorithm", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], PasswordRecipientInfo.prototype, "encryptedKey", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/recipient_info.js
var OtherRecipientInfo = class {
  oriType = "";
  oriValue = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], OtherRecipientInfo.prototype, "oriType", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Any })
], OtherRecipientInfo.prototype, "oriValue", void 0);
var RecipientInfo = class RecipientInfo2 {
  ktri;
  kari;
  kekri;
  pwri;
  ori;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: KeyTransRecipientInfo,
    optional: true
  })
], RecipientInfo.prototype, "ktri", void 0);
__decorate([
  AsnProp({
    type: KeyAgreeRecipientInfo,
    context: 1,
    implicit: true,
    optional: true
  })
], RecipientInfo.prototype, "kari", void 0);
__decorate([
  AsnProp({
    type: KEKRecipientInfo,
    context: 2,
    implicit: true,
    optional: true
  })
], RecipientInfo.prototype, "kekri", void 0);
__decorate([
  AsnProp({
    type: PasswordRecipientInfo,
    context: 3,
    implicit: true,
    optional: true
  })
], RecipientInfo.prototype, "pwri", void 0);
__decorate([
  AsnProp({
    type: OtherRecipientInfo,
    context: 4,
    implicit: true,
    optional: true
  })
], RecipientInfo.prototype, "ori", void 0);
RecipientInfo = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], RecipientInfo);

// node_modules/@peculiar/asn1-cms/build/es2015/recipient_infos.js
var RecipientInfos_1;
var RecipientInfos = RecipientInfos_1 = class RecipientInfos2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, RecipientInfos_1.prototype);
  }
};
RecipientInfos = RecipientInfos_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: RecipientInfo
  })
], RecipientInfos);

// node_modules/@peculiar/asn1-cms/build/es2015/revocation_info_choice.js
var RevocationInfoChoices_1;
var id_ri = `${id_pkix}.16`;
var id_ri_ocsp_response = `${id_ri}.2`;
var id_ri_scvp = `${id_ri}.4`;
var OtherRevocationInfoFormat = class {
  otherRevInfoFormat = "";
  otherRevInfo = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], OtherRevocationInfoFormat.prototype, "otherRevInfoFormat", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Any })
], OtherRevocationInfoFormat.prototype, "otherRevInfo", void 0);
var RevocationInfoChoice = class RevocationInfoChoice2 {
  other = new OtherRevocationInfoFormat();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: OtherRevocationInfoFormat,
    context: 1,
    implicit: true
  })
], RevocationInfoChoice.prototype, "other", void 0);
RevocationInfoChoice = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], RevocationInfoChoice);
var RevocationInfoChoices = RevocationInfoChoices_1 = class RevocationInfoChoices2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, RevocationInfoChoices_1.prototype);
  }
};
RevocationInfoChoices = RevocationInfoChoices_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: RevocationInfoChoice
  })
], RevocationInfoChoices);

// node_modules/@peculiar/asn1-cms/build/es2015/originator_info.js
var OriginatorInfo = class {
  certs;
  crls;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: CertificateSet,
    context: 0,
    implicit: true,
    optional: true
  })
], OriginatorInfo.prototype, "certs", void 0);
__decorate([
  AsnProp({
    type: RevocationInfoChoices,
    context: 1,
    implicit: true,
    optional: true
  })
], OriginatorInfo.prototype, "crls", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/enveloped_data.js
var UnprotectedAttributes_1;
var UnprotectedAttributes = UnprotectedAttributes_1 = class UnprotectedAttributes2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, UnprotectedAttributes_1.prototype);
  }
};
UnprotectedAttributes = UnprotectedAttributes_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: Attribute2
  })
], UnprotectedAttributes);
var EnvelopedData = class {
  version = CMSVersion.v0;
  originatorInfo;
  recipientInfos = new RecipientInfos();
  encryptedContentInfo = new EncryptedContentInfo();
  unprotectedAttrs;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], EnvelopedData.prototype, "version", void 0);
__decorate([
  AsnProp({
    type: OriginatorInfo,
    context: 0,
    implicit: true,
    optional: true
  })
], EnvelopedData.prototype, "originatorInfo", void 0);
__decorate([
  AsnProp({ type: RecipientInfos })
], EnvelopedData.prototype, "recipientInfos", void 0);
__decorate([
  AsnProp({ type: EncryptedContentInfo })
], EnvelopedData.prototype, "encryptedContentInfo", void 0);
__decorate([
  AsnProp({
    type: UnprotectedAttributes,
    context: 1,
    implicit: true,
    optional: true
  })
], EnvelopedData.prototype, "unprotectedAttrs", void 0);

// node_modules/@peculiar/asn1-cms/build/es2015/object_identifiers.js
var id_data = "1.2.840.113549.1.7.1";
var id_signedData = "1.2.840.113549.1.7.2";

// node_modules/@peculiar/asn1-cms/build/es2015/signed_data.js
var DigestAlgorithmIdentifiers_1;
var DigestAlgorithmIdentifiers = DigestAlgorithmIdentifiers_1 = class DigestAlgorithmIdentifiers2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, DigestAlgorithmIdentifiers_1.prototype);
  }
};
DigestAlgorithmIdentifiers = DigestAlgorithmIdentifiers_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: DigestAlgorithmIdentifier
  })
], DigestAlgorithmIdentifiers);
var SignedData = class {
  version = CMSVersion.v0;
  digestAlgorithms = new DigestAlgorithmIdentifiers();
  encapContentInfo = new EncapsulatedContentInfo();
  certificates;
  crls;
  signerInfos = new SignerInfos();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], SignedData.prototype, "version", void 0);
__decorate([
  AsnProp({ type: DigestAlgorithmIdentifiers })
], SignedData.prototype, "digestAlgorithms", void 0);
__decorate([
  AsnProp({ type: EncapsulatedContentInfo })
], SignedData.prototype, "encapContentInfo", void 0);
__decorate([
  AsnProp({
    type: CertificateSet,
    context: 0,
    implicit: true,
    optional: true
  })
], SignedData.prototype, "certificates", void 0);
__decorate([
  AsnProp({
    type: RevocationInfoChoices,
    context: 1,
    implicit: true,
    optional: true
  })
], SignedData.prototype, "crls", void 0);
__decorate([
  AsnProp({ type: SignerInfos })
], SignedData.prototype, "signerInfos", void 0);

// node_modules/@peculiar/asn1-ecc/build/es2015/object_identifiers.js
var id_ecPublicKey = "1.2.840.10045.2.1";
var id_ecdsaWithSHA1 = "1.2.840.10045.4.1";
var id_ecdsaWithSHA224 = "1.2.840.10045.4.3.1";
var id_ecdsaWithSHA256 = "1.2.840.10045.4.3.2";
var id_ecdsaWithSHA384 = "1.2.840.10045.4.3.3";
var id_ecdsaWithSHA512 = "1.2.840.10045.4.3.4";
var id_secp256r1 = "1.2.840.10045.3.1.7";
var id_secp384r1 = "1.3.132.0.34";
var id_secp521r1 = "1.3.132.0.35";

// node_modules/@peculiar/asn1-ecc/build/es2015/algorithms.js
function create(algorithm) {
  return new AlgorithmIdentifier({ algorithm });
}
var ecdsaWithSHA1 = create(id_ecdsaWithSHA1);
var ecdsaWithSHA224 = create(id_ecdsaWithSHA224);
var ecdsaWithSHA256 = create(id_ecdsaWithSHA256);
var ecdsaWithSHA384 = create(id_ecdsaWithSHA384);
var ecdsaWithSHA512 = create(id_ecdsaWithSHA512);

// node_modules/@peculiar/asn1-ecc/build/es2015/rfc3279.js
var FieldID = class FieldID2 {
  fieldType;
  parameters;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], FieldID.prototype, "fieldType", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Any })
], FieldID.prototype, "parameters", void 0);
FieldID = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], FieldID);
var ECPoint = class extends OctetString2 {
};
var Curve = class Curve2 {
  a;
  b;
  seed;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.OctetString })
], Curve.prototype, "a", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.OctetString })
], Curve.prototype, "b", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.BitString,
    optional: true
  })
], Curve.prototype, "seed", void 0);
Curve = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], Curve);
var ECPVer;
(function(ECPVer2) {
  ECPVer2[ECPVer2["ecpVer1"] = 1] = "ecpVer1";
})(ECPVer || (ECPVer = {}));
var SpecifiedECDomain = class SpecifiedECDomain2 {
  version = ECPVer.ecpVer1;
  fieldID;
  curve;
  base;
  order;
  cofactor;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], SpecifiedECDomain.prototype, "version", void 0);
__decorate([
  AsnProp({ type: FieldID })
], SpecifiedECDomain.prototype, "fieldID", void 0);
__decorate([
  AsnProp({ type: Curve })
], SpecifiedECDomain.prototype, "curve", void 0);
__decorate([
  AsnProp({ type: ECPoint })
], SpecifiedECDomain.prototype, "base", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], SpecifiedECDomain.prototype, "order", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    optional: true
  })
], SpecifiedECDomain.prototype, "cofactor", void 0);
SpecifiedECDomain = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], SpecifiedECDomain);

// node_modules/@peculiar/asn1-ecc/build/es2015/ec_parameters.js
var ECParameters = class ECParameters2 {
  namedCurve;
  implicitCurve;
  specifiedCurve;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], ECParameters.prototype, "namedCurve", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Null })
], ECParameters.prototype, "implicitCurve", void 0);
__decorate([
  AsnProp({ type: SpecifiedECDomain })
], ECParameters.prototype, "specifiedCurve", void 0);
ECParameters = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], ECParameters);

// node_modules/@peculiar/asn1-ecc/build/es2015/ec_private_key.js
var ECPrivateKey = class {
  version = 1;
  privateKey = new OctetString2();
  parameters;
  publicKey;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], ECPrivateKey.prototype, "version", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], ECPrivateKey.prototype, "privateKey", void 0);
__decorate([
  AsnProp({
    type: ECParameters,
    context: 0,
    optional: true
  })
], ECPrivateKey.prototype, "parameters", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.BitString,
    context: 1,
    optional: true
  })
], ECPrivateKey.prototype, "publicKey", void 0);

// node_modules/@peculiar/asn1-ecc/build/es2015/ec_signature_value.js
var ECDSASigValue = class {
  r = new ArrayBuffer(0);
  s = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], ECDSASigValue.prototype, "r", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], ECDSASigValue.prototype, "s", void 0);

// node_modules/@peculiar/asn1-rsa/build/es2015/object_identifiers.js
var id_pkcs_1 = "1.2.840.113549.1.1";
var id_rsaEncryption = `${id_pkcs_1}.1`;
var id_RSAES_OAEP = `${id_pkcs_1}.7`;
var id_pSpecified = `${id_pkcs_1}.9`;
var id_RSASSA_PSS = `${id_pkcs_1}.10`;
var id_md2WithRSAEncryption = `${id_pkcs_1}.2`;
var id_md5WithRSAEncryption = `${id_pkcs_1}.4`;
var id_sha1WithRSAEncryption = `${id_pkcs_1}.5`;
var id_sha224WithRSAEncryption = `${id_pkcs_1}.14`;
var id_sha256WithRSAEncryption = `${id_pkcs_1}.11`;
var id_sha384WithRSAEncryption = `${id_pkcs_1}.12`;
var id_sha512WithRSAEncryption = `${id_pkcs_1}.13`;
var id_sha512_224WithRSAEncryption = `${id_pkcs_1}.15`;
var id_sha512_256WithRSAEncryption = `${id_pkcs_1}.16`;
var id_sha1 = "1.3.14.3.2.26";
var id_sha224 = "2.16.840.1.101.3.4.2.4";
var id_sha256 = "2.16.840.1.101.3.4.2.1";
var id_sha384 = "2.16.840.1.101.3.4.2.2";
var id_sha512 = "2.16.840.1.101.3.4.2.3";
var id_sha512_224 = "2.16.840.1.101.3.4.2.5";
var id_sha512_256 = "2.16.840.1.101.3.4.2.6";
var id_md2 = "1.2.840.113549.2.2";
var id_md5 = "1.2.840.113549.2.5";
var id_mgf1 = `${id_pkcs_1}.8`;

// node_modules/@peculiar/asn1-rsa/build/es2015/algorithms.js
function create2(algorithm) {
  return new AlgorithmIdentifier({
    algorithm,
    parameters: null
  });
}
var md2 = create2(id_md2);
var md4 = create2(id_md5);
var sha1 = create2(id_sha1);
var sha224 = create2(id_sha224);
var sha256 = create2(id_sha256);
var sha384 = create2(id_sha384);
var sha512 = create2(id_sha512);
var sha512_224 = create2(id_sha512_224);
var sha512_256 = create2(id_sha512_256);
var mgf1SHA1 = new AlgorithmIdentifier({
  algorithm: id_mgf1,
  parameters: AsnConvert.serialize(sha1)
});
var pSpecifiedEmpty = new AlgorithmIdentifier({
  algorithm: id_pSpecified,
  parameters: AsnConvert.serialize(AsnOctetStringConverter.toASN(new Uint8Array([218, 57, 163, 238, 94, 107, 75, 13, 50, 85, 191, 239, 149, 96, 24, 144, 175, 216, 7, 9]).buffer))
});
var rsaEncryption = create2(id_rsaEncryption);
var md2WithRSAEncryption = create2(id_md2WithRSAEncryption);
var md5WithRSAEncryption = create2(id_md5WithRSAEncryption);
var sha1WithRSAEncryption = create2(id_sha1WithRSAEncryption);
var sha224WithRSAEncryption = create2(id_sha512_224WithRSAEncryption);
var sha256WithRSAEncryption = create2(id_sha512_256WithRSAEncryption);
var sha384WithRSAEncryption = create2(id_sha384WithRSAEncryption);
var sha512WithRSAEncryption = create2(id_sha512WithRSAEncryption);
var sha512_224WithRSAEncryption = create2(id_sha512_224WithRSAEncryption);
var sha512_256WithRSAEncryption = create2(id_sha512_256WithRSAEncryption);

// node_modules/@peculiar/asn1-rsa/build/es2015/parameters/rsaes_oaep.js
var RsaEsOaepParams = class {
  hashAlgorithm = new AlgorithmIdentifier(sha1);
  maskGenAlgorithm = new AlgorithmIdentifier({
    algorithm: id_mgf1,
    parameters: AsnConvert.serialize(sha1)
  });
  pSourceAlgorithm = new AlgorithmIdentifier(pSpecifiedEmpty);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AlgorithmIdentifier,
    context: 0,
    defaultValue: sha1
  })
], RsaEsOaepParams.prototype, "hashAlgorithm", void 0);
__decorate([
  AsnProp({
    type: AlgorithmIdentifier,
    context: 1,
    defaultValue: mgf1SHA1
  })
], RsaEsOaepParams.prototype, "maskGenAlgorithm", void 0);
__decorate([
  AsnProp({
    type: AlgorithmIdentifier,
    context: 2,
    defaultValue: pSpecifiedEmpty
  })
], RsaEsOaepParams.prototype, "pSourceAlgorithm", void 0);
var RSAES_OAEP = new AlgorithmIdentifier({
  algorithm: id_RSAES_OAEP,
  parameters: AsnConvert.serialize(new RsaEsOaepParams())
});

// node_modules/@peculiar/asn1-rsa/build/es2015/parameters/rsassa_pss.js
var RsaSaPssParams = class {
  hashAlgorithm = new AlgorithmIdentifier(sha1);
  maskGenAlgorithm = new AlgorithmIdentifier({
    algorithm: id_mgf1,
    parameters: AsnConvert.serialize(sha1)
  });
  saltLength = 20;
  trailerField = 1;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AlgorithmIdentifier,
    context: 0,
    defaultValue: sha1
  })
], RsaSaPssParams.prototype, "hashAlgorithm", void 0);
__decorate([
  AsnProp({
    type: AlgorithmIdentifier,
    context: 1,
    defaultValue: mgf1SHA1
  })
], RsaSaPssParams.prototype, "maskGenAlgorithm", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 2,
    defaultValue: 20
  })
], RsaSaPssParams.prototype, "saltLength", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    context: 3,
    defaultValue: 1
  })
], RsaSaPssParams.prototype, "trailerField", void 0);
var RSASSA_PSS = new AlgorithmIdentifier({
  algorithm: id_RSASSA_PSS,
  parameters: AsnConvert.serialize(new RsaSaPssParams())
});

// node_modules/@peculiar/asn1-rsa/build/es2015/parameters/rsassa_pkcs1_v1_5.js
var DigestInfo = class {
  digestAlgorithm = new AlgorithmIdentifier();
  digest = new OctetString2();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], DigestInfo.prototype, "digestAlgorithm", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], DigestInfo.prototype, "digest", void 0);

// node_modules/@peculiar/asn1-rsa/build/es2015/other_prime_info.js
var OtherPrimeInfos_1;
var OtherPrimeInfo = class {
  prime = new ArrayBuffer(0);
  exponent = new ArrayBuffer(0);
  coefficient = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], OtherPrimeInfo.prototype, "prime", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], OtherPrimeInfo.prototype, "exponent", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], OtherPrimeInfo.prototype, "coefficient", void 0);
var OtherPrimeInfos = OtherPrimeInfos_1 = class OtherPrimeInfos2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, OtherPrimeInfos_1.prototype);
  }
};
OtherPrimeInfos = OtherPrimeInfos_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: OtherPrimeInfo
  })
], OtherPrimeInfos);

// node_modules/@peculiar/asn1-rsa/build/es2015/rsa_private_key.js
var RSAPrivateKey = class {
  version = 0;
  modulus = new ArrayBuffer(0);
  publicExponent = new ArrayBuffer(0);
  privateExponent = new ArrayBuffer(0);
  prime1 = new ArrayBuffer(0);
  prime2 = new ArrayBuffer(0);
  exponent1 = new ArrayBuffer(0);
  exponent2 = new ArrayBuffer(0);
  coefficient = new ArrayBuffer(0);
  otherPrimeInfos;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], RSAPrivateKey.prototype, "version", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "modulus", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "publicExponent", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "privateExponent", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "prime1", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "prime2", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "exponent1", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "exponent2", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPrivateKey.prototype, "coefficient", void 0);
__decorate([
  AsnProp({
    type: OtherPrimeInfos,
    optional: true
  })
], RSAPrivateKey.prototype, "otherPrimeInfos", void 0);

// node_modules/@peculiar/asn1-rsa/build/es2015/rsa_public_key.js
var RSAPublicKey = class {
  modulus = new ArrayBuffer(0);
  publicExponent = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPublicKey.prototype, "modulus", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    converter: AsnIntegerArrayBufferConverter
  })
], RSAPublicKey.prototype, "publicExponent", void 0);

// node_modules/tsyringe/dist/esm5/types/lifecycle.js
var Lifecycle;
(function(Lifecycle2) {
  Lifecycle2[Lifecycle2["Transient"] = 0] = "Transient";
  Lifecycle2[Lifecycle2["Singleton"] = 1] = "Singleton";
  Lifecycle2[Lifecycle2["ResolutionScoped"] = 2] = "ResolutionScoped";
  Lifecycle2[Lifecycle2["ContainerScoped"] = 3] = "ContainerScoped";
})(Lifecycle || (Lifecycle = {}));
var lifecycle_default = Lifecycle;

// node_modules/tsyringe/node_modules/tslib/tslib.es6.js
var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
    d2.__proto__ = b2;
  } || function(d2, b2) {
    for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
  };
  return extendStatics(d, b);
};
function __extends(d, b) {
  extendStatics(d, b);
  function __() {
    this.constructor = d;
  }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve) {
      resolve(value);
    });
  }
  return new (P || (P = Promise))(function(resolve, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1) throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f) throw new TypeError("Generator is already executing.");
    while (_) try {
      if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
      if (y = 0, t) op = [op[0] & 2, t.value];
      switch (op[0]) {
        case 0:
        case 1:
          t = op;
          break;
        case 4:
          _.label++;
          return { value: op[1], done: false };
        case 5:
          _.label++;
          y = op[1];
          op = [0];
          continue;
        case 7:
          op = _.ops.pop();
          _.trys.pop();
          continue;
        default:
          if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
            _ = 0;
            continue;
          }
          if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
            _.label = op[1];
            break;
          }
          if (op[0] === 6 && _.label < t[1]) {
            _.label = t[1];
            t = op;
            break;
          }
          if (t && _.label < t[2]) {
            _.label = t[2];
            _.ops.push(op);
            break;
          }
          if (t[2]) _.ops.pop();
          _.trys.pop();
          continue;
      }
      op = body.call(thisArg, _);
    } catch (e) {
      op = [6, e];
      y = 0;
    } finally {
      f = t = 0;
    }
    if (op[0] & 5) throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
    next: function() {
      if (o && i >= o.length) o = void 0;
      return { value: o && o[i++], done: !o };
    }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}
function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error) {
    e = { error };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
}
function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
    ar = ar.concat(__read(arguments[i]));
  return ar;
}

// node_modules/tsyringe/dist/esm5/reflection-helpers.js
var INJECTION_TOKEN_METADATA_KEY = "injectionTokens";
function getParamInfo(target) {
  var params = Reflect.getMetadata("design:paramtypes", target) || [];
  var injectionTokens = Reflect.getOwnMetadata(INJECTION_TOKEN_METADATA_KEY, target) || {};
  Object.keys(injectionTokens).forEach(function(key) {
    params[+key] = injectionTokens[key];
  });
  return params;
}

// node_modules/tsyringe/dist/esm5/providers/class-provider.js
function isClassProvider(provider) {
  return !!provider.useClass;
}

// node_modules/tsyringe/dist/esm5/providers/factory-provider.js
function isFactoryProvider(provider) {
  return !!provider.useFactory;
}

// node_modules/tsyringe/dist/esm5/lazy-helpers.js
var DelayedConstructor = (function() {
  function DelayedConstructor2(wrap2) {
    this.wrap = wrap2;
    this.reflectMethods = [
      "get",
      "getPrototypeOf",
      "setPrototypeOf",
      "getOwnPropertyDescriptor",
      "defineProperty",
      "has",
      "set",
      "deleteProperty",
      "apply",
      "construct",
      "ownKeys"
    ];
  }
  DelayedConstructor2.prototype.createProxy = function(createObject) {
    var _this = this;
    var target = {};
    var init = false;
    var value;
    var delayedObject = function() {
      if (!init) {
        value = createObject(_this.wrap());
        init = true;
      }
      return value;
    };
    return new Proxy(target, this.createHandler(delayedObject));
  };
  DelayedConstructor2.prototype.createHandler = function(delayedObject) {
    var handler = {};
    var install = function(name) {
      handler[name] = function() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
          args[_i] = arguments[_i];
        }
        args[0] = delayedObject();
        var method = Reflect[name];
        return method.apply(void 0, __spread(args));
      };
    };
    this.reflectMethods.forEach(install);
    return handler;
  };
  return DelayedConstructor2;
})();

// node_modules/tsyringe/dist/esm5/providers/injection-token.js
function isNormalToken(token) {
  return typeof token === "string" || typeof token === "symbol";
}
function isTokenDescriptor(descriptor) {
  return typeof descriptor === "object" && "token" in descriptor && "multiple" in descriptor;
}
function isTransformDescriptor(descriptor) {
  return typeof descriptor === "object" && "token" in descriptor && "transform" in descriptor;
}
function isConstructorToken(token) {
  return typeof token === "function" || token instanceof DelayedConstructor;
}

// node_modules/tsyringe/dist/esm5/providers/token-provider.js
function isTokenProvider(provider) {
  return !!provider.useToken;
}

// node_modules/tsyringe/dist/esm5/providers/value-provider.js
function isValueProvider(provider) {
  return provider.useValue != void 0;
}

// node_modules/tsyringe/dist/esm5/providers/provider.js
function isProvider(provider) {
  return isClassProvider(provider) || isValueProvider(provider) || isTokenProvider(provider) || isFactoryProvider(provider);
}

// node_modules/tsyringe/dist/esm5/registry-base.js
var RegistryBase = (function() {
  function RegistryBase2() {
    this._registryMap = /* @__PURE__ */ new Map();
  }
  RegistryBase2.prototype.entries = function() {
    return this._registryMap.entries();
  };
  RegistryBase2.prototype.getAll = function(key) {
    this.ensure(key);
    return this._registryMap.get(key);
  };
  RegistryBase2.prototype.get = function(key) {
    this.ensure(key);
    var value = this._registryMap.get(key);
    return value[value.length - 1] || null;
  };
  RegistryBase2.prototype.set = function(key, value) {
    this.ensure(key);
    this._registryMap.get(key).push(value);
  };
  RegistryBase2.prototype.setAll = function(key, value) {
    this._registryMap.set(key, value);
  };
  RegistryBase2.prototype.has = function(key) {
    this.ensure(key);
    return this._registryMap.get(key).length > 0;
  };
  RegistryBase2.prototype.clear = function() {
    this._registryMap.clear();
  };
  RegistryBase2.prototype.ensure = function(key) {
    if (!this._registryMap.has(key)) {
      this._registryMap.set(key, []);
    }
  };
  return RegistryBase2;
})();
var registry_base_default = RegistryBase;

// node_modules/tsyringe/dist/esm5/registry.js
var Registry = (function(_super) {
  __extends(Registry2, _super);
  function Registry2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return Registry2;
})(registry_base_default);
var registry_default = Registry;

// node_modules/tsyringe/dist/esm5/resolution-context.js
var ResolutionContext = /* @__PURE__ */ (function() {
  function ResolutionContext2() {
    this.scopedResolutions = /* @__PURE__ */ new Map();
  }
  return ResolutionContext2;
})();
var resolution_context_default = ResolutionContext;

// node_modules/tsyringe/dist/esm5/error-helpers.js
function formatDependency(params, idx) {
  if (params === null) {
    return "at position #" + idx;
  }
  var argName = params.split(",")[idx].trim();
  return '"' + argName + '" at position #' + idx;
}
function composeErrorMessage(msg, e, indent) {
  if (indent === void 0) {
    indent = "    ";
  }
  return __spread([msg], e.message.split("\n").map(function(l) {
    return indent + l;
  })).join("\n");
}
function formatErrorCtor(ctor, paramIdx, error) {
  var _a3 = __read(ctor.toString().match(/constructor\(([\w, ]+)\)/) || [], 2), _b = _a3[1], params = _b === void 0 ? null : _b;
  var dep = formatDependency(params, paramIdx);
  return composeErrorMessage("Cannot inject the dependency " + dep + ' of "' + ctor.name + '" constructor. Reason:', error);
}

// node_modules/tsyringe/dist/esm5/types/disposable.js
function isDisposable(value) {
  if (typeof value.dispose !== "function")
    return false;
  var disposeFun = value.dispose;
  if (disposeFun.length > 0) {
    return false;
  }
  return true;
}

// node_modules/tsyringe/dist/esm5/interceptors.js
var PreResolutionInterceptors = (function(_super) {
  __extends(PreResolutionInterceptors2, _super);
  function PreResolutionInterceptors2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return PreResolutionInterceptors2;
})(registry_base_default);
var PostResolutionInterceptors = (function(_super) {
  __extends(PostResolutionInterceptors2, _super);
  function PostResolutionInterceptors2() {
    return _super !== null && _super.apply(this, arguments) || this;
  }
  return PostResolutionInterceptors2;
})(registry_base_default);
var Interceptors = /* @__PURE__ */ (function() {
  function Interceptors2() {
    this.preResolution = new PreResolutionInterceptors();
    this.postResolution = new PostResolutionInterceptors();
  }
  return Interceptors2;
})();
var interceptors_default = Interceptors;

// node_modules/tsyringe/dist/esm5/dependency-container.js
var typeInfo = /* @__PURE__ */ new Map();
var InternalDependencyContainer = (function() {
  function InternalDependencyContainer2(parent) {
    this.parent = parent;
    this._registry = new registry_default();
    this.interceptors = new interceptors_default();
    this.disposed = false;
    this.disposables = /* @__PURE__ */ new Set();
  }
  InternalDependencyContainer2.prototype.register = function(token, providerOrConstructor, options) {
    if (options === void 0) {
      options = { lifecycle: lifecycle_default.Transient };
    }
    this.ensureNotDisposed();
    var provider;
    if (!isProvider(providerOrConstructor)) {
      provider = { useClass: providerOrConstructor };
    } else {
      provider = providerOrConstructor;
    }
    if (isTokenProvider(provider)) {
      var path = [token];
      var tokenProvider = provider;
      while (tokenProvider != null) {
        var currentToken = tokenProvider.useToken;
        if (path.includes(currentToken)) {
          throw new Error("Token registration cycle detected! " + __spread(path, [currentToken]).join(" -> "));
        }
        path.push(currentToken);
        var registration = this._registry.get(currentToken);
        if (registration && isTokenProvider(registration.provider)) {
          tokenProvider = registration.provider;
        } else {
          tokenProvider = null;
        }
      }
    }
    if (options.lifecycle === lifecycle_default.Singleton || options.lifecycle == lifecycle_default.ContainerScoped || options.lifecycle == lifecycle_default.ResolutionScoped) {
      if (isValueProvider(provider) || isFactoryProvider(provider)) {
        throw new Error('Cannot use lifecycle "' + lifecycle_default[options.lifecycle] + '" with ValueProviders or FactoryProviders');
      }
    }
    this._registry.set(token, { provider, options });
    return this;
  };
  InternalDependencyContainer2.prototype.registerType = function(from, to) {
    this.ensureNotDisposed();
    if (isNormalToken(to)) {
      return this.register(from, {
        useToken: to
      });
    }
    return this.register(from, {
      useClass: to
    });
  };
  InternalDependencyContainer2.prototype.registerInstance = function(token, instance2) {
    this.ensureNotDisposed();
    return this.register(token, {
      useValue: instance2
    });
  };
  InternalDependencyContainer2.prototype.registerSingleton = function(from, to) {
    this.ensureNotDisposed();
    if (isNormalToken(from)) {
      if (isNormalToken(to)) {
        return this.register(from, {
          useToken: to
        }, { lifecycle: lifecycle_default.Singleton });
      } else if (to) {
        return this.register(from, {
          useClass: to
        }, { lifecycle: lifecycle_default.Singleton });
      }
      throw new Error('Cannot register a type name as a singleton without a "to" token');
    }
    var useClass = from;
    if (to && !isNormalToken(to)) {
      useClass = to;
    }
    return this.register(from, {
      useClass
    }, { lifecycle: lifecycle_default.Singleton });
  };
  InternalDependencyContainer2.prototype.resolve = function(token, context, isOptional) {
    if (context === void 0) {
      context = new resolution_context_default();
    }
    if (isOptional === void 0) {
      isOptional = false;
    }
    this.ensureNotDisposed();
    var registration = this.getRegistration(token);
    if (!registration && isNormalToken(token)) {
      if (isOptional) {
        return void 0;
      }
      throw new Error('Attempted to resolve unregistered dependency token: "' + token.toString() + '"');
    }
    this.executePreResolutionInterceptor(token, "Single");
    if (registration) {
      var result = this.resolveRegistration(registration, context);
      this.executePostResolutionInterceptor(token, result, "Single");
      return result;
    }
    if (isConstructorToken(token)) {
      var result = this.construct(token, context);
      this.executePostResolutionInterceptor(token, result, "Single");
      return result;
    }
    throw new Error("Attempted to construct an undefined constructor. Could mean a circular dependency problem. Try using `delay` function.");
  };
  InternalDependencyContainer2.prototype.executePreResolutionInterceptor = function(token, resolutionType) {
    var e_1, _a3;
    if (this.interceptors.preResolution.has(token)) {
      var remainingInterceptors = [];
      try {
        for (var _b = __values(this.interceptors.preResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var interceptor = _c.value;
          if (interceptor.options.frequency != "Once") {
            remainingInterceptors.push(interceptor);
          }
          interceptor.callback(token, resolutionType);
        }
      } catch (e_1_1) {
        e_1 = { error: e_1_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a3 = _b.return)) _a3.call(_b);
        } finally {
          if (e_1) throw e_1.error;
        }
      }
      this.interceptors.preResolution.setAll(token, remainingInterceptors);
    }
  };
  InternalDependencyContainer2.prototype.executePostResolutionInterceptor = function(token, result, resolutionType) {
    var e_2, _a3;
    if (this.interceptors.postResolution.has(token)) {
      var remainingInterceptors = [];
      try {
        for (var _b = __values(this.interceptors.postResolution.getAll(token)), _c = _b.next(); !_c.done; _c = _b.next()) {
          var interceptor = _c.value;
          if (interceptor.options.frequency != "Once") {
            remainingInterceptors.push(interceptor);
          }
          interceptor.callback(token, result, resolutionType);
        }
      } catch (e_2_1) {
        e_2 = { error: e_2_1 };
      } finally {
        try {
          if (_c && !_c.done && (_a3 = _b.return)) _a3.call(_b);
        } finally {
          if (e_2) throw e_2.error;
        }
      }
      this.interceptors.postResolution.setAll(token, remainingInterceptors);
    }
  };
  InternalDependencyContainer2.prototype.resolveRegistration = function(registration, context) {
    this.ensureNotDisposed();
    if (registration.options.lifecycle === lifecycle_default.ResolutionScoped && context.scopedResolutions.has(registration)) {
      return context.scopedResolutions.get(registration);
    }
    var isSingleton = registration.options.lifecycle === lifecycle_default.Singleton;
    var isContainerScoped = registration.options.lifecycle === lifecycle_default.ContainerScoped;
    var returnInstance = isSingleton || isContainerScoped;
    var resolved;
    if (isValueProvider(registration.provider)) {
      resolved = registration.provider.useValue;
    } else if (isTokenProvider(registration.provider)) {
      resolved = returnInstance ? registration.instance || (registration.instance = this.resolve(registration.provider.useToken, context)) : this.resolve(registration.provider.useToken, context);
    } else if (isClassProvider(registration.provider)) {
      resolved = returnInstance ? registration.instance || (registration.instance = this.construct(registration.provider.useClass, context)) : this.construct(registration.provider.useClass, context);
    } else if (isFactoryProvider(registration.provider)) {
      resolved = registration.provider.useFactory(this);
    } else {
      resolved = this.construct(registration.provider, context);
    }
    if (registration.options.lifecycle === lifecycle_default.ResolutionScoped) {
      context.scopedResolutions.set(registration, resolved);
    }
    return resolved;
  };
  InternalDependencyContainer2.prototype.resolveAll = function(token, context, isOptional) {
    var _this = this;
    if (context === void 0) {
      context = new resolution_context_default();
    }
    if (isOptional === void 0) {
      isOptional = false;
    }
    this.ensureNotDisposed();
    var registrations = this.getAllRegistrations(token);
    if (!registrations && isNormalToken(token)) {
      if (isOptional) {
        return [];
      }
      throw new Error('Attempted to resolve unregistered dependency token: "' + token.toString() + '"');
    }
    this.executePreResolutionInterceptor(token, "All");
    if (registrations) {
      var result_1 = registrations.map(function(item) {
        return _this.resolveRegistration(item, context);
      });
      this.executePostResolutionInterceptor(token, result_1, "All");
      return result_1;
    }
    var result = [this.construct(token, context)];
    this.executePostResolutionInterceptor(token, result, "All");
    return result;
  };
  InternalDependencyContainer2.prototype.isRegistered = function(token, recursive) {
    if (recursive === void 0) {
      recursive = false;
    }
    this.ensureNotDisposed();
    return this._registry.has(token) || recursive && (this.parent || false) && this.parent.isRegistered(token, true);
  };
  InternalDependencyContainer2.prototype.reset = function() {
    this.ensureNotDisposed();
    this._registry.clear();
    this.interceptors.preResolution.clear();
    this.interceptors.postResolution.clear();
  };
  InternalDependencyContainer2.prototype.clearInstances = function() {
    var e_3, _a3;
    this.ensureNotDisposed();
    try {
      for (var _b = __values(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
        var _d = __read(_c.value, 2), token = _d[0], registrations = _d[1];
        this._registry.setAll(token, registrations.filter(function(registration) {
          return !isValueProvider(registration.provider);
        }).map(function(registration) {
          registration.instance = void 0;
          return registration;
        }));
      }
    } catch (e_3_1) {
      e_3 = { error: e_3_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a3 = _b.return)) _a3.call(_b);
      } finally {
        if (e_3) throw e_3.error;
      }
    }
  };
  InternalDependencyContainer2.prototype.createChildContainer = function() {
    var e_4, _a3;
    this.ensureNotDisposed();
    var childContainer = new InternalDependencyContainer2(this);
    try {
      for (var _b = __values(this._registry.entries()), _c = _b.next(); !_c.done; _c = _b.next()) {
        var _d = __read(_c.value, 2), token = _d[0], registrations = _d[1];
        if (registrations.some(function(_a4) {
          var options = _a4.options;
          return options.lifecycle === lifecycle_default.ContainerScoped;
        })) {
          childContainer._registry.setAll(token, registrations.map(function(registration) {
            if (registration.options.lifecycle === lifecycle_default.ContainerScoped) {
              return {
                provider: registration.provider,
                options: registration.options
              };
            }
            return registration;
          }));
        }
      }
    } catch (e_4_1) {
      e_4 = { error: e_4_1 };
    } finally {
      try {
        if (_c && !_c.done && (_a3 = _b.return)) _a3.call(_b);
      } finally {
        if (e_4) throw e_4.error;
      }
    }
    return childContainer;
  };
  InternalDependencyContainer2.prototype.beforeResolution = function(token, callback, options) {
    if (options === void 0) {
      options = { frequency: "Always" };
    }
    this.interceptors.preResolution.set(token, {
      callback,
      options
    });
  };
  InternalDependencyContainer2.prototype.afterResolution = function(token, callback, options) {
    if (options === void 0) {
      options = { frequency: "Always" };
    }
    this.interceptors.postResolution.set(token, {
      callback,
      options
    });
  };
  InternalDependencyContainer2.prototype.dispose = function() {
    return __awaiter(this, void 0, void 0, function() {
      var promises;
      return __generator(this, function(_a3) {
        switch (_a3.label) {
          case 0:
            this.disposed = true;
            promises = [];
            this.disposables.forEach(function(disposable) {
              var maybePromise = disposable.dispose();
              if (maybePromise) {
                promises.push(maybePromise);
              }
            });
            return [4, Promise.all(promises)];
          case 1:
            _a3.sent();
            return [2];
        }
      });
    });
  };
  InternalDependencyContainer2.prototype.getRegistration = function(token) {
    if (this.isRegistered(token)) {
      return this._registry.get(token);
    }
    if (this.parent) {
      return this.parent.getRegistration(token);
    }
    return null;
  };
  InternalDependencyContainer2.prototype.getAllRegistrations = function(token) {
    if (this.isRegistered(token)) {
      return this._registry.getAll(token);
    }
    if (this.parent) {
      return this.parent.getAllRegistrations(token);
    }
    return null;
  };
  InternalDependencyContainer2.prototype.construct = function(ctor, context) {
    var _this = this;
    if (ctor instanceof DelayedConstructor) {
      return ctor.createProxy(function(target) {
        return _this.resolve(target, context);
      });
    }
    var instance2 = (function() {
      var paramInfo = typeInfo.get(ctor);
      if (!paramInfo || paramInfo.length === 0) {
        if (ctor.length === 0) {
          return new ctor();
        } else {
          throw new Error('TypeInfo not known for "' + ctor.name + '"');
        }
      }
      var params = paramInfo.map(_this.resolveParams(context, ctor));
      return new (ctor.bind.apply(ctor, __spread([void 0], params)))();
    })();
    if (isDisposable(instance2)) {
      this.disposables.add(instance2);
    }
    return instance2;
  };
  InternalDependencyContainer2.prototype.resolveParams = function(context, ctor) {
    var _this = this;
    return function(param, idx) {
      var _a3, _b, _c;
      try {
        if (isTokenDescriptor(param)) {
          if (isTransformDescriptor(param)) {
            return param.multiple ? (_a3 = _this.resolve(param.transform)).transform.apply(_a3, __spread([_this.resolveAll(param.token, new resolution_context_default(), param.isOptional)], param.transformArgs)) : (_b = _this.resolve(param.transform)).transform.apply(_b, __spread([_this.resolve(param.token, context, param.isOptional)], param.transformArgs));
          } else {
            return param.multiple ? _this.resolveAll(param.token, new resolution_context_default(), param.isOptional) : _this.resolve(param.token, context, param.isOptional);
          }
        } else if (isTransformDescriptor(param)) {
          return (_c = _this.resolve(param.transform, context)).transform.apply(_c, __spread([_this.resolve(param.token, context)], param.transformArgs));
        }
        return _this.resolve(param, context);
      } catch (e) {
        throw new Error(formatErrorCtor(ctor, idx, e));
      }
    };
  };
  InternalDependencyContainer2.prototype.ensureNotDisposed = function() {
    if (this.disposed) {
      throw new Error("This container has been disposed, you cannot interact with a disposed container");
    }
  };
  return InternalDependencyContainer2;
})();
var instance = new InternalDependencyContainer();

// node_modules/tsyringe/dist/esm5/decorators/injectable.js
function injectable(options) {
  return function(target) {
    typeInfo.set(target, getParamInfo(target));
    if (options && options.token) {
      if (!Array.isArray(options.token)) {
        instance.register(options.token, target);
      } else {
        options.token.forEach(function(token) {
          instance.register(token, target);
        });
      }
    }
  };
}
var injectable_default = injectable;

// node_modules/tsyringe/dist/esm5/index.js
if (typeof Reflect === "undefined" || !Reflect.getMetadata) {
  throw new Error(`tsyringe requires a reflect polyfill. Please add 'import "reflect-metadata"' to the top of your entry point.`);
}

// node_modules/@peculiar/asn1-pfx/build/es2015/attribute.js
var PKCS12AttrSet_1;
var PKCS12Attribute = class {
  attrId = "";
  attrValues = [];
  constructor(params = {}) {
    Object.assign(params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], PKCS12Attribute.prototype, "attrId", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    repeated: "set"
  })
], PKCS12Attribute.prototype, "attrValues", void 0);
var PKCS12AttrSet = PKCS12AttrSet_1 = class PKCS12AttrSet2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, PKCS12AttrSet_1.prototype);
  }
};
PKCS12AttrSet = PKCS12AttrSet_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: PKCS12Attribute
  })
], PKCS12AttrSet);

// node_modules/@peculiar/asn1-pfx/build/es2015/authenticated_safe.js
var AuthenticatedSafe_1;
var AuthenticatedSafe = AuthenticatedSafe_1 = class AuthenticatedSafe2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, AuthenticatedSafe_1.prototype);
  }
};
AuthenticatedSafe = AuthenticatedSafe_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: ContentInfo
  })
], AuthenticatedSafe);

// node_modules/@peculiar/asn1-pfx/build/es2015/object_identifiers.js
var id_rsadsi = "1.2.840.113549";
var id_pkcs = `${id_rsadsi}.1`;
var id_pkcs_12 = `${id_pkcs}.12`;
var id_pkcs_12PbeIds = `${id_pkcs_12}.1`;
var id_pbeWithSHAAnd128BitRC4 = `${id_pkcs_12PbeIds}.1`;
var id_pbeWithSHAAnd40BitRC4 = `${id_pkcs_12PbeIds}.2`;
var id_pbeWithSHAAnd3_KeyTripleDES_CBC = `${id_pkcs_12PbeIds}.3`;
var id_pbeWithSHAAnd2_KeyTripleDES_CBC = `${id_pkcs_12PbeIds}.4`;
var id_pbeWithSHAAnd128BitRC2_CBC = `${id_pkcs_12PbeIds}.5`;
var id_pbewithSHAAnd40BitRC2_CBC = `${id_pkcs_12PbeIds}.6`;
var id_bagtypes = `${id_pkcs_12}.10.1`;

// node_modules/@peculiar/asn1-pfx/build/es2015/bags/types.js
var id_keyBag = `${id_bagtypes}.1`;
var id_pkcs8ShroudedKeyBag = `${id_bagtypes}.2`;
var id_certBag = `${id_bagtypes}.3`;
var id_CRLBag = `${id_bagtypes}.4`;
var id_SecretBag = `${id_bagtypes}.5`;
var id_SafeContents = `${id_bagtypes}.6`;
var id_pkcs_9 = "1.2.840.113549.1.9";

// node_modules/@peculiar/asn1-pfx/build/es2015/bags/cert_bag.js
var CertBag = class {
  certId = "";
  certValue = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], CertBag.prototype, "certId", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })
], CertBag.prototype, "certValue", void 0);
var id_certTypes = `${id_pkcs_9}.22`;
var id_x509Certificate = `${id_certTypes}.1`;
var id_sdsiCertificate = `${id_certTypes}.2`;

// node_modules/@peculiar/asn1-pfx/build/es2015/bags/crl_bag.js
var CRLBag = class {
  crlId = "";
  crltValue = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], CRLBag.prototype, "crlId", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })
], CRLBag.prototype, "crltValue", void 0);
var id_crlTypes = `${id_pkcs_9}.23`;
var id_x509CRL = `${id_crlTypes}.1`;

// node_modules/@peculiar/asn1-pkcs8/build/es2015/encrypted_private_key_info.js
var EncryptedData = class extends OctetString2 {
};
var EncryptedPrivateKeyInfo = class {
  encryptionAlgorithm = new AlgorithmIdentifier();
  encryptedData = new EncryptedData();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], EncryptedPrivateKeyInfo.prototype, "encryptionAlgorithm", void 0);
__decorate([
  AsnProp({ type: EncryptedData })
], EncryptedPrivateKeyInfo.prototype, "encryptedData", void 0);

// node_modules/@peculiar/asn1-pkcs8/build/es2015/private_key_info.js
var Attributes_1;
var Version2;
(function(Version5) {
  Version5[Version5["v1"] = 0] = "v1";
})(Version2 || (Version2 = {}));
var PrivateKey = class extends OctetString2 {
};
var Attributes = Attributes_1 = class Attributes2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, Attributes_1.prototype);
  }
};
Attributes = Attributes_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Attribute
  })
], Attributes);
var PrivateKeyInfo = class {
  version = Version2.v1;
  privateKeyAlgorithm = new AlgorithmIdentifier();
  privateKey = new PrivateKey();
  attributes;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], PrivateKeyInfo.prototype, "version", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], PrivateKeyInfo.prototype, "privateKeyAlgorithm", void 0);
__decorate([
  AsnProp({ type: PrivateKey })
], PrivateKeyInfo.prototype, "privateKey", void 0);
__decorate([
  AsnProp({
    type: Attributes,
    implicit: true,
    context: 0,
    optional: true
  })
], PrivateKeyInfo.prototype, "attributes", void 0);

// node_modules/@peculiar/asn1-pfx/build/es2015/bags/key_bag.js
var KeyBag = class KeyBag2 extends PrivateKeyInfo {
};
KeyBag = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], KeyBag);

// node_modules/@peculiar/asn1-pfx/build/es2015/bags/pkcs8_shrouded_key_bag.js
var PKCS8ShroudedKeyBag = class PKCS8ShroudedKeyBag2 extends EncryptedPrivateKeyInfo {
};
PKCS8ShroudedKeyBag = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], PKCS8ShroudedKeyBag);

// node_modules/@peculiar/asn1-pfx/build/es2015/bags/secret_bag.js
var SecretBag = class {
  secretTypeId = "";
  secretValue = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], SecretBag.prototype, "secretTypeId", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })
], SecretBag.prototype, "secretValue", void 0);

// node_modules/@peculiar/asn1-pfx/build/es2015/mac_data.js
var MacData = class {
  mac = new DigestInfo();
  macSalt = new OctetString2();
  iterations = 1;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: DigestInfo })
], MacData.prototype, "mac", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], MacData.prototype, "macSalt", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Integer,
    defaultValue: 1
  })
], MacData.prototype, "iterations", void 0);

// node_modules/@peculiar/asn1-pfx/build/es2015/pfx.js
var PFX = class {
  version = 3;
  authSafe = new ContentInfo();
  macData = new MacData();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], PFX.prototype, "version", void 0);
__decorate([
  AsnProp({ type: ContentInfo })
], PFX.prototype, "authSafe", void 0);
__decorate([
  AsnProp({
    type: MacData,
    optional: true
  })
], PFX.prototype, "macData", void 0);

// node_modules/@peculiar/asn1-pfx/build/es2015/safe_bag.js
var SafeContents_1;
var SafeBag = class {
  bagId = "";
  bagValue = new ArrayBuffer(0);
  bagAttributes;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], SafeBag.prototype, "bagId", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.Any,
    context: 0
  })
], SafeBag.prototype, "bagValue", void 0);
__decorate([
  AsnProp({
    type: PKCS12Attribute,
    repeated: "set",
    optional: true
  })
], SafeBag.prototype, "bagAttributes", void 0);
var SafeContents = SafeContents_1 = class SafeContents2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, SafeContents_1.prototype);
  }
};
SafeContents = SafeContents_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: SafeBag
  })
], SafeContents);

// node_modules/@peculiar/asn1-pkcs9/build/es2015/index.js
var ExtensionRequest_1;
var ExtendedCertificateAttributes_1;
var SMIMECapabilities_1;
var id_pkcs9 = "1.2.840.113549.1.9";
var id_pkcs9_mo = `${id_pkcs9}.0`;
var id_pkcs9_oc = `${id_pkcs9}.24`;
var id_pkcs9_at = `${id_pkcs9}.25`;
var id_pkcs9_sx = `${id_pkcs9}.26`;
var id_pkcs9_mr = `${id_pkcs9}.27`;
var id_pkcs9_oc_pkcsEntity = `${id_pkcs9_oc}.1`;
var id_pkcs9_oc_naturalPerson = `${id_pkcs9_oc}.2`;
var id_pkcs9_at_emailAddress = `${id_pkcs9}.1`;
var id_pkcs9_at_unstructuredName = `${id_pkcs9}.2`;
var id_pkcs9_at_contentType = `${id_pkcs9}.3`;
var id_pkcs9_at_messageDigest = `${id_pkcs9}.4`;
var id_pkcs9_at_signingTime = `${id_pkcs9}.5`;
var id_pkcs9_at_counterSignature = `${id_pkcs9}.6`;
var id_pkcs9_at_challengePassword = `${id_pkcs9}.7`;
var id_pkcs9_at_unstructuredAddress = `${id_pkcs9}.8`;
var id_pkcs9_at_extendedCertificateAttributes = `${id_pkcs9}.9`;
var id_pkcs9_at_signingDescription = `${id_pkcs9}.13`;
var id_pkcs9_at_extensionRequest = `${id_pkcs9}.14`;
var id_pkcs9_at_smimeCapabilities = `${id_pkcs9}.15`;
var id_pkcs9_at_friendlyName = `${id_pkcs9}.20`;
var id_pkcs9_at_localKeyId = `${id_pkcs9}.21`;
var id_pkcs9_at_pkcs15Token = `${id_pkcs9_at}.1`;
var id_pkcs9_at_encryptedPrivateKeyInfo = `${id_pkcs9_at}.2`;
var id_pkcs9_at_randomNonce = `${id_pkcs9_at}.3`;
var id_pkcs9_at_sequenceNumber = `${id_pkcs9_at}.4`;
var id_pkcs9_at_pkcs7PDU = `${id_pkcs9_at}.5`;
var id_ietf_at = "1.3.6.1.5.5.7.9";
var id_pkcs9_at_dateOfBirth = `${id_ietf_at}.1`;
var id_pkcs9_at_placeOfBirth = `${id_ietf_at}.2`;
var id_pkcs9_at_gender = `${id_ietf_at}.3`;
var id_pkcs9_at_countryOfCitizenship = `${id_ietf_at}.4`;
var id_pkcs9_at_countryOfResidence = `${id_ietf_at}.5`;
var id_pkcs9_sx_pkcs9String = `${id_pkcs9_sx}.1`;
var id_pkcs9_sx_signingTime = `${id_pkcs9_sx}.2`;
var id_pkcs9_mr_caseIgnoreMatch = `${id_pkcs9_mr}.1`;
var id_pkcs9_mr_signingTimeMatch = `${id_pkcs9_mr}.2`;
var id_smime = `${id_pkcs9}.16`;
var id_certTypes2 = `${id_pkcs9}.22`;
var crlTypes = `${id_pkcs9}.23`;
var id_at_pseudonym = `${id_at}.65`;
var PKCS9String = class PKCS9String2 extends DirectoryString {
  ia5String;
  constructor(params = {}) {
    super(params);
  }
  toString() {
    const o = {};
    o.toString();
    return this.ia5String || super.toString();
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.IA5String })
], PKCS9String.prototype, "ia5String", void 0);
PKCS9String = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], PKCS9String);
var Pkcs7PDU = class Pkcs7PDU2 extends ContentInfo {
};
Pkcs7PDU = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], Pkcs7PDU);
var UserPKCS12 = class UserPKCS122 extends PFX {
};
UserPKCS12 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], UserPKCS12);
var EncryptedPrivateKeyInfo2 = class EncryptedPrivateKeyInfo3 extends EncryptedPrivateKeyInfo {
};
EncryptedPrivateKeyInfo2 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], EncryptedPrivateKeyInfo2);
var EmailAddress = class EmailAddress2 {
  value;
  constructor(value = "") {
    this.value = value;
  }
  toString() {
    return this.value;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.IA5String })
], EmailAddress.prototype, "value", void 0);
EmailAddress = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], EmailAddress);
var UnstructuredName = class UnstructuredName2 extends PKCS9String {
};
UnstructuredName = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], UnstructuredName);
var UnstructuredAddress = class UnstructuredAddress2 extends DirectoryString {
};
UnstructuredAddress = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], UnstructuredAddress);
var DateOfBirth = class DateOfBirth2 {
  value;
  constructor(value = /* @__PURE__ */ new Date()) {
    this.value = value;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.GeneralizedTime })
], DateOfBirth.prototype, "value", void 0);
DateOfBirth = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], DateOfBirth);
var PlaceOfBirth = class PlaceOfBirth2 extends DirectoryString {
};
PlaceOfBirth = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], PlaceOfBirth);
var Gender = class Gender2 {
  value;
  constructor(value = "M") {
    this.value = value;
  }
  toString() {
    return this.value;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.PrintableString })
], Gender.prototype, "value", void 0);
Gender = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], Gender);
var CountryOfCitizenship = class CountryOfCitizenship2 {
  value;
  constructor(value = "") {
    this.value = value;
  }
  toString() {
    return this.value;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.PrintableString })
], CountryOfCitizenship.prototype, "value", void 0);
CountryOfCitizenship = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], CountryOfCitizenship);
var CountryOfResidence = class CountryOfResidence2 extends CountryOfCitizenship {
};
CountryOfResidence = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], CountryOfResidence);
var Pseudonym = class Pseudonym2 extends DirectoryString {
};
Pseudonym = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], Pseudonym);
var ContentType = class ContentType2 {
  value;
  constructor(value = "") {
    this.value = value;
  }
  toString() {
    return this.value;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.ObjectIdentifier })
], ContentType.prototype, "value", void 0);
ContentType = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], ContentType);
var SigningTime3 = class SigningTime4 extends Time {
};
SigningTime3 = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], SigningTime3);
var SequenceNumber = class SequenceNumber2 {
  value;
  constructor(value = 0) {
    this.value = value;
  }
  toString() {
    return this.value.toString();
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], SequenceNumber.prototype, "value", void 0);
SequenceNumber = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], SequenceNumber);
var CounterSignature3 = class CounterSignature4 extends SignerInfo {
};
CounterSignature3 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], CounterSignature3);
var ChallengePassword = class ChallengePassword2 extends DirectoryString {
};
ChallengePassword = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], ChallengePassword);
var ExtensionRequest = ExtensionRequest_1 = class ExtensionRequest2 extends Extensions {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, ExtensionRequest_1.prototype);
  }
};
ExtensionRequest = ExtensionRequest_1 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], ExtensionRequest);
var ExtendedCertificateAttributes = ExtendedCertificateAttributes_1 = class ExtendedCertificateAttributes2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, ExtendedCertificateAttributes_1.prototype);
  }
};
ExtendedCertificateAttributes = ExtendedCertificateAttributes_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: Attribute2
  })
], ExtendedCertificateAttributes);
var FriendlyName = class FriendlyName2 {
  value;
  constructor(value = "") {
    this.value = value;
  }
  toString() {
    return this.value;
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.BmpString })
], FriendlyName.prototype, "value", void 0);
FriendlyName = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], FriendlyName);
var SMIMECapability = class SMIMECapability2 extends AlgorithmIdentifier {
};
SMIMECapability = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], SMIMECapability);
var SMIMECapabilities = SMIMECapabilities_1 = class SMIMECapabilities2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, SMIMECapabilities_1.prototype);
  }
};
SMIMECapabilities = SMIMECapabilities_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: SMIMECapability
  })
], SMIMECapabilities);

// node_modules/@peculiar/asn1-x509-post-quantum/build/es2015/composite_signatures.js
var CompositeParams_1;
var CompositeSignatureValue_1;
var CompositeParams = CompositeParams_1 = class CompositeParams2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CompositeParams_1.prototype);
  }
};
CompositeParams = CompositeParams_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AlgorithmIdentifier
  })
], CompositeParams);
var CompositeSignatureValue = CompositeSignatureValue_1 = class CompositeSignatureValue2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CompositeSignatureValue_1.prototype);
  }
};
CompositeSignatureValue = CompositeSignatureValue_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: AsnPropTypes.BitString
  })
], CompositeSignatureValue);

// node_modules/@peculiar/asn1-asym-key/build/es2015/index.js
var AsymmetricKeyPackage_1;
var Version3;
(function(Version5) {
  Version5[Version5["v1"] = 0] = "v1";
  Version5[Version5["v2"] = 1] = "v2";
})(Version3 || (Version3 = {}));
var PrivateKeyAlgorithmIdentifier = class PrivateKeyAlgorithmIdentifier2 extends AlgorithmIdentifier {
};
PrivateKeyAlgorithmIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], PrivateKeyAlgorithmIdentifier);
var OneAsymmetricKey = class OneAsymmetricKey2 {
  version = Version3.v1;
  privateKeyAlgorithm = new AlgorithmIdentifier();
  privateKey = new ArrayBuffer(0);
  attributes;
  publicKey;
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], OneAsymmetricKey.prototype, "version", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], OneAsymmetricKey.prototype, "privateKeyAlgorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.OctetString })
], OneAsymmetricKey.prototype, "privateKey", void 0);
__decorate([
  AsnProp({
    type: Attributes,
    context: 0,
    implicit: true,
    optional: true
  })
], OneAsymmetricKey.prototype, "attributes", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.BitString,
    context: 1,
    implicit: true,
    optional: true
  })
], OneAsymmetricKey.prototype, "publicKey", void 0);
OneAsymmetricKey = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], OneAsymmetricKey);
var PrivateKeyInfo2 = class PrivateKeyInfo3 extends OneAsymmetricKey {
};
PrivateKeyInfo2 = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], PrivateKeyInfo2);
var AsymmetricKeyPackage = AsymmetricKeyPackage_1 = class AsymmetricKeyPackage2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, AsymmetricKeyPackage_1.prototype);
  }
};
AsymmetricKeyPackage = AsymmetricKeyPackage_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: OneAsymmetricKey
  })
], AsymmetricKeyPackage);

// node_modules/@peculiar/asn1-x509-post-quantum/build/es2015/composite_keys.js
var CompositePublicKey_1;
var CompositePrivateKey_1;
var CompositeAlgorithmIdentifier = class CompositeAlgorithmIdentifier2 extends AlgorithmIdentifier {
};
CompositeAlgorithmIdentifier = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], CompositeAlgorithmIdentifier);
var CompositePublicKey = CompositePublicKey_1 = class CompositePublicKey2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CompositePublicKey_1.prototype);
  }
};
CompositePublicKey = CompositePublicKey_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: SubjectPublicKeyInfo
  })
], CompositePublicKey);
var CompositePrivateKey = CompositePrivateKey_1 = class CompositePrivateKey2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, CompositePrivateKey_1.prototype);
  }
};
CompositePrivateKey = CompositePrivateKey_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: OneAsymmetricKey
  })
], CompositePrivateKey);

// node_modules/@peculiar/asn1-x509-post-quantum/build/es2015/object_identifiers.js
var id_sigAlgs = "2.16.840.1.101.3.4.3";
var id_ml_dsa_44 = `${id_sigAlgs}.17`;
var id_ml_dsa_65 = `${id_sigAlgs}.18`;
var id_ml_dsa_87 = `${id_sigAlgs}.19`;
var id_slh_dsa_sha2_128s = `${id_sigAlgs}.20`;
var id_slh_dsa_sha2_128f = `${id_sigAlgs}.21`;
var id_slh_dsa_sha2_192s = `${id_sigAlgs}.22`;
var id_slh_dsa_sha2_192f = `${id_sigAlgs}.23`;
var id_slh_dsa_sha2_256s = `${id_sigAlgs}.24`;
var id_slh_dsa_sha2_256f = `${id_sigAlgs}.25`;
var id_slh_dsa_shake_128s = `${id_sigAlgs}.26`;
var id_slh_dsa_shake_128f = `${id_sigAlgs}.27`;
var id_slh_dsa_shake_192s = `${id_sigAlgs}.28`;
var id_slh_dsa_shake_192f = `${id_sigAlgs}.29`;
var id_slh_dsa_shake_256s = `${id_sigAlgs}.30`;
var id_slh_dsa_shake_256f = `${id_sigAlgs}.31`;

// node_modules/@peculiar/asn1-csr/build/es2015/attributes.js
var Attributes_12;
var Attributes3 = Attributes_12 = class Attributes4 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, Attributes_12.prototype);
  }
};
Attributes3 = Attributes_12 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: Attribute
  })
], Attributes3);

// node_modules/@peculiar/asn1-csr/build/es2015/certification_request_info.js
var CertificationRequestInfo = class {
  version = 0;
  subject = new Name();
  subjectPKInfo = new SubjectPublicKeyInfo();
  attributes = new Attributes3();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], CertificationRequestInfo.prototype, "version", void 0);
__decorate([
  AsnProp({ type: Name })
], CertificationRequestInfo.prototype, "subject", void 0);
__decorate([
  AsnProp({ type: SubjectPublicKeyInfo })
], CertificationRequestInfo.prototype, "subjectPKInfo", void 0);
__decorate([
  AsnProp({
    type: Attributes3,
    implicit: true,
    context: 0,
    optional: true
  })
], CertificationRequestInfo.prototype, "attributes", void 0);

// node_modules/@peculiar/asn1-csr/build/es2015/certification_request.js
var CertificationRequest = class {
  certificationRequestInfo = new CertificationRequestInfo();
  certificationRequestInfoRaw;
  signatureAlgorithm = new AlgorithmIdentifier();
  signature = new ArrayBuffer(0);
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: CertificationRequestInfo,
    raw: true
  })
], CertificationRequest.prototype, "certificationRequestInfo", void 0);
__decorate([
  AsnProp({ type: AlgorithmIdentifier })
], CertificationRequest.prototype, "signatureAlgorithm", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.BitString })
], CertificationRequest.prototype, "signature", void 0);

// node_modules/@peculiar/x509/build/x509.es.js
var diAlgorithm = "crypto.algorithm";
var AlgorithmProvider = class {
  getAlgorithms() {
    return instance.resolveAll(diAlgorithm);
  }
  toAsnAlgorithm(alg) {
    const algCopy = { ...alg };
    if (algCopy.hash && typeof algCopy.hash === "string") {
      algCopy.hash = { name: algCopy.hash };
    }
    for (const algorithm of this.getAlgorithms()) {
      const res = algorithm.toAsnAlgorithm(algCopy);
      if (res) {
        return res;
      }
    }
    if (/^[0-9.]+$/.test(alg.name)) {
      const res = new AlgorithmIdentifier({ algorithm: alg.name });
      if ("parameters" in alg) {
        const unknown = alg;
        res.parameters = unknown.parameters;
      }
      return res;
    }
    throw new Error("Cannot convert WebCrypto algorithm to ASN.1 algorithm");
  }
  toWebAlgorithm(alg) {
    for (const algorithm of this.getAlgorithms()) {
      const res = algorithm.toWebAlgorithm(alg);
      if (res) {
        return res;
      }
    }
    const unknown = {
      name: alg.algorithm,
      parameters: alg.parameters
    };
    return unknown;
  }
};
var diAlgorithmProvider = "crypto.algorithmProvider";
instance.registerSingleton(diAlgorithmProvider, AlgorithmProvider);
var EcAlgorithm_1;
var idVersionOne = "1.3.36.3.3.2.8.1.1";
var idBrainpoolP160r1 = `${idVersionOne}.1`;
var idBrainpoolP160t1 = `${idVersionOne}.2`;
var idBrainpoolP192r1 = `${idVersionOne}.3`;
var idBrainpoolP192t1 = `${idVersionOne}.4`;
var idBrainpoolP224r1 = `${idVersionOne}.5`;
var idBrainpoolP224t1 = `${idVersionOne}.6`;
var idBrainpoolP256r1 = `${idVersionOne}.7`;
var idBrainpoolP256t1 = `${idVersionOne}.8`;
var idBrainpoolP320r1 = `${idVersionOne}.9`;
var idBrainpoolP320t1 = `${idVersionOne}.10`;
var idBrainpoolP384r1 = `${idVersionOne}.11`;
var idBrainpoolP384t1 = `${idVersionOne}.12`;
var idBrainpoolP512r1 = `${idVersionOne}.13`;
var idBrainpoolP512t1 = `${idVersionOne}.14`;
var brainpoolP160r1 = "brainpoolP160r1";
var brainpoolP160t1 = "brainpoolP160t1";
var brainpoolP192r1 = "brainpoolP192r1";
var brainpoolP192t1 = "brainpoolP192t1";
var brainpoolP224r1 = "brainpoolP224r1";
var brainpoolP224t1 = "brainpoolP224t1";
var brainpoolP256r1 = "brainpoolP256r1";
var brainpoolP256t1 = "brainpoolP256t1";
var brainpoolP320r1 = "brainpoolP320r1";
var brainpoolP320t1 = "brainpoolP320t1";
var brainpoolP384r1 = "brainpoolP384r1";
var brainpoolP384t1 = "brainpoolP384t1";
var brainpoolP512r1 = "brainpoolP512r1";
var brainpoolP512t1 = "brainpoolP512t1";
var ECDSA = "ECDSA";
var EcAlgorithm = EcAlgorithm_1 = class EcAlgorithm2 {
  toAsnAlgorithm(alg) {
    switch (alg.name.toLowerCase()) {
      case ECDSA.toLowerCase():
        if ("hash" in alg) {
          const hash = typeof alg.hash === "string" ? alg.hash : alg.hash.name;
          switch (hash.toLowerCase()) {
            case "sha-1":
              return ecdsaWithSHA1;
            case "sha-256":
              return ecdsaWithSHA256;
            case "sha-384":
              return ecdsaWithSHA384;
            case "sha-512":
              return ecdsaWithSHA512;
          }
        } else if ("namedCurve" in alg) {
          let parameters = "";
          switch (alg.namedCurve) {
            case "P-256":
              parameters = id_secp256r1;
              break;
            case "K-256":
              parameters = EcAlgorithm_1.SECP256K1;
              break;
            case "P-384":
              parameters = id_secp384r1;
              break;
            case "P-521":
              parameters = id_secp521r1;
              break;
            case brainpoolP160r1:
              parameters = idBrainpoolP160r1;
              break;
            case brainpoolP160t1:
              parameters = idBrainpoolP160t1;
              break;
            case brainpoolP192r1:
              parameters = idBrainpoolP192r1;
              break;
            case brainpoolP192t1:
              parameters = idBrainpoolP192t1;
              break;
            case brainpoolP224r1:
              parameters = idBrainpoolP224r1;
              break;
            case brainpoolP224t1:
              parameters = idBrainpoolP224t1;
              break;
            case brainpoolP256r1:
              parameters = idBrainpoolP256r1;
              break;
            case brainpoolP256t1:
              parameters = idBrainpoolP256t1;
              break;
            case brainpoolP320r1:
              parameters = idBrainpoolP320r1;
              break;
            case brainpoolP320t1:
              parameters = idBrainpoolP320t1;
              break;
            case brainpoolP384r1:
              parameters = idBrainpoolP384r1;
              break;
            case brainpoolP384t1:
              parameters = idBrainpoolP384t1;
              break;
            case brainpoolP512r1:
              parameters = idBrainpoolP512r1;
              break;
            case brainpoolP512t1:
              parameters = idBrainpoolP512t1;
              break;
          }
          if (parameters) {
            return new AlgorithmIdentifier({
              algorithm: id_ecPublicKey,
              parameters: AsnConvert.serialize(new ECParameters({ namedCurve: parameters }))
            });
          }
        }
    }
    return null;
  }
  toWebAlgorithm(alg) {
    switch (alg.algorithm) {
      case id_ecdsaWithSHA1:
        return {
          name: ECDSA,
          hash: { name: "SHA-1" }
        };
      case id_ecdsaWithSHA256:
        return {
          name: ECDSA,
          hash: { name: "SHA-256" }
        };
      case id_ecdsaWithSHA384:
        return {
          name: ECDSA,
          hash: { name: "SHA-384" }
        };
      case id_ecdsaWithSHA512:
        return {
          name: ECDSA,
          hash: { name: "SHA-512" }
        };
      case id_ecPublicKey: {
        if (!alg.parameters) {
          throw new TypeError("Cannot get required parameters from EC algorithm");
        }
        const parameters = AsnConvert.parse(alg.parameters, ECParameters);
        switch (parameters.namedCurve) {
          case id_secp256r1:
            return {
              name: ECDSA,
              namedCurve: "P-256"
            };
          case EcAlgorithm_1.SECP256K1:
            return {
              name: ECDSA,
              namedCurve: "K-256"
            };
          case id_secp384r1:
            return {
              name: ECDSA,
              namedCurve: "P-384"
            };
          case id_secp521r1:
            return {
              name: ECDSA,
              namedCurve: "P-521"
            };
          case idBrainpoolP160r1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP160r1
            };
          case idBrainpoolP160t1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP160t1
            };
          case idBrainpoolP192r1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP192r1
            };
          case idBrainpoolP192t1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP192t1
            };
          case idBrainpoolP224r1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP224r1
            };
          case idBrainpoolP224t1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP224t1
            };
          case idBrainpoolP256r1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP256r1
            };
          case idBrainpoolP256t1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP256t1
            };
          case idBrainpoolP320r1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP320r1
            };
          case idBrainpoolP320t1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP320t1
            };
          case idBrainpoolP384r1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP384r1
            };
          case idBrainpoolP384t1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP384t1
            };
          case idBrainpoolP512r1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP512r1
            };
          case idBrainpoolP512t1:
            return {
              name: ECDSA,
              namedCurve: brainpoolP512t1
            };
        }
      }
    }
    return null;
  }
};
EcAlgorithm.SECP256K1 = "1.3.132.0.10";
EcAlgorithm = EcAlgorithm_1 = __decorate([
  injectable_default()
], EcAlgorithm);
instance.registerSingleton(diAlgorithm, EcAlgorithm);
var NAME2 = /* @__PURE__ */ Symbol("name");
var VALUE = /* @__PURE__ */ Symbol("value");
var TextObject = class {
  constructor(name, items = {}, value = "") {
    this[NAME2] = name;
    this[VALUE] = value;
    for (const key in items) {
      this[key] = items[key];
    }
  }
};
TextObject.NAME = NAME2;
TextObject.VALUE = VALUE;
var DefaultAlgorithmSerializer = class {
  static toTextObject(alg) {
    const obj = new TextObject("Algorithm Identifier", {}, OidSerializer.toString(alg.algorithm));
    if (alg.parameters) {
      switch (alg.algorithm) {
        case id_ecPublicKey: {
          const ecAlg = new EcAlgorithm().toWebAlgorithm(alg);
          if (ecAlg && "namedCurve" in ecAlg) {
            obj["Named Curve"] = ecAlg.namedCurve;
          } else {
            obj["Parameters"] = alg.parameters;
          }
          break;
        }
        default:
          obj["Parameters"] = alg.parameters;
      }
    }
    return obj;
  }
};
var OidSerializer = class {
  static toString(oid) {
    const name = this.items[oid];
    if (name) {
      return name;
    }
    return oid;
  }
};
OidSerializer.items = {
  [id_sha1]: "sha1",
  [id_sha224]: "sha224",
  [id_sha256]: "sha256",
  [id_sha384]: "sha384",
  [id_sha512]: "sha512",
  [id_rsaEncryption]: "rsaEncryption",
  [id_sha1WithRSAEncryption]: "sha1WithRSAEncryption",
  [id_sha224WithRSAEncryption]: "sha224WithRSAEncryption",
  [id_sha256WithRSAEncryption]: "sha256WithRSAEncryption",
  [id_sha384WithRSAEncryption]: "sha384WithRSAEncryption",
  [id_sha512WithRSAEncryption]: "sha512WithRSAEncryption",
  [id_ecPublicKey]: "ecPublicKey",
  [id_ecdsaWithSHA1]: "ecdsaWithSHA1",
  [id_ecdsaWithSHA224]: "ecdsaWithSHA224",
  [id_ecdsaWithSHA256]: "ecdsaWithSHA256",
  [id_ecdsaWithSHA384]: "ecdsaWithSHA384",
  [id_ecdsaWithSHA512]: "ecdsaWithSHA512",
  [id_kp_serverAuth]: "TLS WWW server authentication",
  [id_kp_clientAuth]: "TLS WWW client authentication",
  [id_kp_codeSigning]: "Code Signing",
  [id_kp_emailProtection]: "E-mail Protection",
  [id_kp_timeStamping]: "Time Stamping",
  [id_kp_OCSPSigning]: "OCSP Signing",
  [id_signedData]: "Signed Data"
};
var TextConverter = class {
  static serialize(obj) {
    return this.serializeObj(obj).join("\n");
  }
  static pad(deep = 0) {
    return "".padStart(2 * deep, " ");
  }
  static serializeObj(obj, deep = 0) {
    const res = [];
    let pad2 = this.pad(deep++);
    let value = "";
    const objValue = obj[TextObject.VALUE];
    if (objValue) {
      value = ` ${objValue}`;
    }
    res.push(`${pad2}${obj[TextObject.NAME]}:${value}`);
    pad2 = this.pad(deep);
    for (const key in obj) {
      if (typeof key === "symbol") {
        continue;
      }
      const value2 = obj[key];
      const keyValue = key ? `${key}: ` : "";
      if (typeof value2 === "string" || typeof value2 === "number" || typeof value2 === "boolean") {
        res.push(`${pad2}${keyValue}${value2}`);
      } else if (value2 instanceof Date) {
        res.push(`${pad2}${keyValue}${value2.toUTCString()}`);
      } else if (Array.isArray(value2)) {
        for (const obj2 of value2) {
          obj2[TextObject.NAME] = key;
          res.push(...this.serializeObj(obj2, deep));
        }
      } else if (value2 instanceof TextObject) {
        value2[TextObject.NAME] = key;
        res.push(...this.serializeObj(value2, deep));
      } else if (import_pvtsutils.BufferSourceConverter.isBufferSource(value2)) {
        if (key) {
          res.push(`${pad2}${keyValue}`);
          res.push(...this.serializeBufferSource(value2, deep + 1));
        } else {
          res.push(...this.serializeBufferSource(value2, deep));
        }
      } else if ("toTextObject" in value2) {
        const obj2 = value2.toTextObject();
        obj2[TextObject.NAME] = key;
        res.push(...this.serializeObj(obj2, deep));
      } else {
        throw new TypeError("Cannot serialize data in text format. Unsupported type.");
      }
    }
    return res;
  }
  static serializeBufferSource(buffer, deep = 0) {
    const pad2 = this.pad(deep);
    const view = import_pvtsutils.BufferSourceConverter.toUint8Array(buffer);
    const res = [];
    for (let i = 0; i < view.length; ) {
      const row = [];
      for (let j = 0; j < 16 && i < view.length; j++) {
        if (j === 8) {
          row.push("");
        }
        const hex2 = view[i++].toString(16).padStart(2, "0");
        row.push(hex2);
      }
      res.push(`${pad2}${row.join(" ")}`);
    }
    return res;
  }
  static serializeAlgorithm(alg) {
    return this.algorithmSerializer.toTextObject(alg);
  }
};
TextConverter.oidSerializer = OidSerializer;
TextConverter.algorithmSerializer = DefaultAlgorithmSerializer;
var _AsnData_rawData;
var _AsnData_options;
var AsnData = class _AsnData {
  get parseOptions() {
    return __classPrivateFieldGet(this, _AsnData_options, "f");
  }
  get rawData() {
    if (!__classPrivateFieldGet(this, _AsnData_rawData, "f")) {
      __classPrivateFieldSet(this, _AsnData_rawData, AsnConvert.serialize(this.asn), "f");
    }
    return __classPrivateFieldGet(this, _AsnData_rawData, "f");
  }
  constructor(...args) {
    _AsnData_rawData.set(this, void 0);
    _AsnData_options.set(this, void 0);
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      __classPrivateFieldSet(this, _AsnData_options, args[2], "f");
      this.asn = AsnConvert.parse(args[0], args[1], args[2]);
      __classPrivateFieldSet(this, _AsnData_rawData, import_pvtsutils.BufferSourceConverter.toArrayBuffer(args[0]), "f");
      this.onInit(this.asn);
    } else {
      __classPrivateFieldSet(this, _AsnData_options, args[1], "f");
      this.asn = args[0];
      this.onInit(this.asn);
    }
  }
  equal(data) {
    if (data instanceof _AsnData) {
      return (0, import_pvtsutils.isEqual)(data.rawData, this.rawData);
    }
    return false;
  }
  toString(format4 = "text") {
    switch (format4) {
      case "asn":
        return AsnConvert.toString(this.rawData, __classPrivateFieldGet(this, _AsnData_options, "f"));
      case "text":
        return TextConverter.serialize(this.toTextObject());
      case "hex":
        return import_pvtsutils.Convert.ToHex(this.rawData);
      case "base64":
        return import_pvtsutils.Convert.ToBase64(this.rawData);
      case "base64url":
        return import_pvtsutils.Convert.ToBase64Url(this.rawData);
      default:
        throw TypeError("Argument 'format' is unsupported value");
    }
  }
  getTextName() {
    const constructor = this.constructor;
    return constructor.NAME;
  }
  toTextObject() {
    const obj = this.toTextObjectEmpty();
    obj[""] = this.rawData;
    return obj;
  }
  toTextObjectEmpty(value) {
    return new TextObject(this.getTextName(), {}, value);
  }
};
_AsnData_rawData = /* @__PURE__ */ new WeakMap(), _AsnData_options = /* @__PURE__ */ new WeakMap();
AsnData.NAME = "ASN";
var Extension2 = class _Extension extends AsnData {
  constructor(...args) {
    let raw;
    let options;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      raw = import_pvtsutils.BufferSourceConverter.toArrayBuffer(args[0]);
      options = args[1];
    } else {
      raw = AsnConvert.serialize(new Extension({
        extnID: args[0],
        critical: args[1],
        extnValue: new OctetString2(import_pvtsutils.BufferSourceConverter.toArrayBuffer(args[2]))
      }));
    }
    super(raw, Extension, options);
  }
  onInit(asn) {
    this.type = asn.extnID;
    this.critical = asn.critical;
    this.value = asn.extnValue.buffer;
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    obj[""] = this.value;
    return obj;
  }
  toTextObjectWithoutValue() {
    const obj = this.toTextObjectEmpty(this.critical ? "critical" : void 0);
    if (obj[TextObject.NAME] === _Extension.NAME) {
      obj[TextObject.NAME] = OidSerializer.toString(this.type);
    }
    return obj;
  }
};
var _a2;
var CryptoProvider = class _CryptoProvider {
  static isCryptoKeyPair(data) {
    return data && data.privateKey && data.publicKey;
  }
  static isCryptoKey(data) {
    return data && data.usages && data.type && data.algorithm && data.extractable !== void 0;
  }
  constructor() {
    this.items = /* @__PURE__ */ new Map();
    this[_a2] = "CryptoProvider";
    if (typeof self !== "undefined" && typeof crypto !== "undefined") {
      this.set(_CryptoProvider.DEFAULT, crypto);
    } else if (typeof global !== "undefined" && global.crypto && global.crypto.subtle) {
      this.set(_CryptoProvider.DEFAULT, global.crypto);
    }
  }
  clear() {
    this.items.clear();
  }
  delete(key) {
    return this.items.delete(key);
  }
  forEach(callbackfn, thisArg) {
    return this.items.forEach(callbackfn, thisArg);
  }
  has(key) {
    return this.items.has(key);
  }
  get size() {
    return this.items.size;
  }
  entries() {
    return this.items.entries();
  }
  keys() {
    return this.items.keys();
  }
  values() {
    return this.items.values();
  }
  [Symbol.iterator]() {
    return this.items[Symbol.iterator]();
  }
  get(key = _CryptoProvider.DEFAULT) {
    const crypto2 = this.items.get(key.toLowerCase());
    if (!crypto2) {
      throw new Error(`Cannot get Crypto by name '${key}'`);
    }
    return crypto2;
  }
  set(key, value) {
    if (typeof key === "string") {
      if (!value) {
        throw new TypeError("Argument 'value' is required");
      }
      this.items.set(key.toLowerCase(), value);
    } else {
      this.items.set(_CryptoProvider.DEFAULT, key);
    }
    return this;
  }
};
_a2 = Symbol.toStringTag;
CryptoProvider.DEFAULT = "default";
var cryptoProvider = new CryptoProvider();
var OID_REGEX = /^[0-2](?:\.[1-9][0-9]*)+$/;
function isOID(id) {
  return new RegExp(OID_REGEX).test(id);
}
var NameIdentifier = class {
  constructor(names2 = {}) {
    this.items = {};
    for (const id in names2) {
      this.register(id, names2[id]);
    }
  }
  get(idOrName) {
    return this.items[idOrName] || null;
  }
  findId(idOrName) {
    if (!isOID(idOrName)) {
      return this.get(idOrName);
    }
    return idOrName;
  }
  register(id, name) {
    this.items[id] = name;
    this.items[name] = id;
  }
};
var names = new NameIdentifier();
names.register("CN", "2.5.4.3");
names.register("L", "2.5.4.7");
names.register("ST", "2.5.4.8");
names.register("O", "2.5.4.10");
names.register("OU", "2.5.4.11");
names.register("C", "2.5.4.6");
names.register("DC", "0.9.2342.19200300.100.1.25");
names.register("E", "1.2.840.113549.1.9.1");
names.register("G", "2.5.4.42");
names.register("I", "2.5.4.43");
names.register("SN", "2.5.4.4");
names.register("T", "2.5.4.12");
function replaceUnknownCharacter(text, char) {
  return `\\${import_pvtsutils.Convert.ToHex(import_pvtsutils.Convert.FromUtf8String(char)).toUpperCase()}`;
}
function escape2(data) {
  return data.replace(/([,+"\\<>;])/g, "\\$1").replace(/^([ #])/, "\\$1").replace(/([ ]$)/, "\\$1").replace(/([\r\n\t])/, replaceUnknownCharacter);
}
var Name3 = class _Name {
  static isASCII(text) {
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code > 255) {
        return false;
      }
    }
    return true;
  }
  static isPrintableString(text) {
    return /^[A-Za-z0-9 '()+,-./:=?]*$/g.test(text);
  }
  constructor(data, extraNames = {}) {
    this.extraNames = new NameIdentifier();
    this.asn = new Name();
    for (const key in extraNames) {
      if (Object.prototype.hasOwnProperty.call(extraNames, key)) {
        const value = extraNames[key];
        this.extraNames.register(key, value);
      }
    }
    if (typeof data === "string") {
      this.asn = this.fromString(data);
    } else if (data instanceof Name) {
      this.asn = data;
    } else if (import_pvtsutils.BufferSourceConverter.isBufferSource(data)) {
      this.asn = AsnConvert.parse(data, Name);
    } else {
      this.asn = this.fromJSON(data);
    }
  }
  getField(idOrName) {
    const id = this.extraNames.findId(idOrName) || names.findId(idOrName);
    const res = [];
    for (const name of this.asn) {
      for (const rdn of name) {
        if (rdn.type === id) {
          res.push(rdn.value.toString());
        }
      }
    }
    return res;
  }
  getName(idOrName) {
    return this.extraNames.get(idOrName) || names.get(idOrName);
  }
  toString() {
    return this.asn.map((rdn) => rdn.map((o) => {
      const type = this.getName(o.type) || o.type;
      const value = o.value.anyValue ? `#${import_pvtsutils.Convert.ToHex(o.value.anyValue)}` : escape2(o.value.toString());
      return `${type}=${value}`;
    }).join("+")).join(", ");
  }
  toJSON() {
    var _a3;
    const json = [];
    for (const rdn of this.asn) {
      const jsonItem = {};
      for (const attr of rdn) {
        const type = this.getName(attr.type) || attr.type;
        (_a3 = jsonItem[type]) !== null && _a3 !== void 0 ? _a3 : jsonItem[type] = [];
        jsonItem[type].push(attr.value.anyValue ? `#${import_pvtsutils.Convert.ToHex(attr.value.anyValue)}` : attr.value.toString());
      }
      json.push(jsonItem);
    }
    return json;
  }
  fromString(data) {
    const asn = new Name();
    const regex = /(\d\.[\d.]*\d|[A-Za-z]+)=((?:"")|(?:".*?[^\\]")|(?:[^,+"\\](?=[,+]|$))|(?:[^,+].*?(?:[^\\][,+]))|(?:))([,+])?/g;
    let matches = null;
    let level = ",";
    while (matches = regex.exec(`${data},`)) {
      let [, type, value] = matches;
      const lastChar = value[value.length - 1];
      if (lastChar === "," || lastChar === "+") {
        value = value.slice(0, value.length - 1);
        matches[3] = lastChar;
      }
      const next = matches[3];
      type = this.getTypeOid(type);
      const attr = this.createAttribute(type, value);
      if (level === "+") {
        asn[asn.length - 1].push(attr);
      } else {
        asn.push(new RelativeDistinguishedName([attr]));
      }
      level = next;
    }
    return asn;
  }
  fromJSON(data) {
    const asn = new Name();
    for (const item of data) {
      const asnRdn = new RelativeDistinguishedName();
      for (const type in item) {
        const typeId = this.getTypeOid(type);
        const values = item[type];
        for (const value of values) {
          const asnAttr = this.createAttribute(typeId, value);
          asnRdn.push(asnAttr);
        }
      }
      asn.push(asnRdn);
    }
    return asn;
  }
  getTypeOid(type) {
    if (!/[\d.]+/.test(type)) {
      type = this.getName(type) || "";
    }
    if (!type) {
      throw new Error(`Cannot get OID for name type '${type}'`);
    }
    return type;
  }
  createAttribute(type, value) {
    const attr = new AttributeTypeAndValue({ type });
    if (typeof value === "object") {
      for (const key in value) {
        switch (key) {
          case "ia5String":
            attr.value.ia5String = value[key];
            break;
          case "utf8String":
            attr.value.utf8String = value[key];
            break;
          case "universalString":
            attr.value.universalString = value[key];
            break;
          case "bmpString":
            attr.value.bmpString = value[key];
            break;
          case "printableString":
            attr.value.printableString = value[key];
            break;
        }
      }
    } else if (value[0] === "#") {
      attr.value.anyValue = import_pvtsutils.Convert.FromHex(value.slice(1));
    } else {
      const processedValue = this.processStringValue(value);
      if (type === this.getName("E") || type === this.getName("DC")) {
        attr.value.ia5String = processedValue;
      } else {
        if (_Name.isPrintableString(processedValue)) {
          attr.value.printableString = processedValue;
        } else {
          attr.value.utf8String = processedValue;
        }
      }
    }
    return attr;
  }
  processStringValue(value) {
    const quotedMatches = /"(.*?[^\\])?"/.exec(value);
    if (quotedMatches) {
      value = quotedMatches[1];
    }
    return value.replace(/\\0a/gi, "\n").replace(/\\0d/gi, "\r").replace(/\\0g/gi, "	").replace(/\\(.)/g, "$1");
  }
  toArrayBuffer() {
    return AsnConvert.serialize(this.asn);
  }
  async getThumbprint(arg1, arg2) {
    let crypto2;
    let algorithm = "SHA-1";
    if (arg1) {
      if (typeof arg1 === "object" && "subtle" in arg1) {
        crypto2 = arg1;
      } else {
        algorithm = arg1;
        crypto2 = arg2;
      }
    }
    crypto2 !== null && crypto2 !== void 0 ? crypto2 : crypto2 = cryptoProvider.get();
    return await crypto2.subtle.digest(algorithm, this.toArrayBuffer());
  }
};
var ERR_GN_CONSTRUCTOR = "Cannot initialize GeneralName from ASN.1 data.";
var ERR_GN_STRING_FORMAT = `${ERR_GN_CONSTRUCTOR} Unsupported string format in use.`;
var ERR_GUID = `${ERR_GN_CONSTRUCTOR} Value doesn't match to GUID regular expression.`;
var GUID_REGEX = /^([0-9a-f]{8})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{4})-?([0-9a-f]{12})$/i;
var id_GUID = "1.3.6.1.4.1.311.25.1";
var id_UPN = "1.3.6.1.4.1.311.20.2.3";
var DNS = "dns";
var DN = "dn";
var EMAIL = "email";
var IP = "ip";
var URL2 = "url";
var GUID = "guid";
var UPN = "upn";
var REGISTERED_ID = "id";
var GeneralName3 = class extends AsnData {
  constructor(...args) {
    let name;
    if (args.length === 2) {
      switch (args[0]) {
        case DN: {
          const derName = new Name3(args[1]).toArrayBuffer();
          const asnName = AsnConvert.parse(derName, Name);
          name = new GeneralName({ directoryName: asnName });
          break;
        }
        case DNS:
          name = new GeneralName({ dNSName: args[1] });
          break;
        case EMAIL:
          name = new GeneralName({ rfc822Name: args[1] });
          break;
        case GUID: {
          const matches = new RegExp(GUID_REGEX, "i").exec(args[1]);
          if (!matches) {
            throw new Error("Cannot parse GUID value. Value doesn't match to regular expression");
          }
          const hex2 = matches.slice(1).map((o, i) => {
            if (i < 3) {
              return import_pvtsutils.Convert.ToHex(new Uint8Array(import_pvtsutils.Convert.FromHex(o)).reverse());
            }
            return o;
          }).join("");
          name = new GeneralName({
            otherName: new OtherName({
              typeId: id_GUID,
              value: AsnConvert.serialize(new OctetString2(import_pvtsutils.Convert.FromHex(hex2)))
            })
          });
          break;
        }
        case IP:
          name = new GeneralName({ iPAddress: args[1] });
          break;
        case REGISTERED_ID:
          name = new GeneralName({ registeredID: args[1] });
          break;
        case UPN: {
          name = new GeneralName({
            otherName: new OtherName({
              typeId: id_UPN,
              value: AsnConvert.serialize(AsnUtf8StringConverter.toASN(args[1]))
            })
          });
          break;
        }
        case URL2:
          name = new GeneralName({ uniformResourceIdentifier: args[1] });
          break;
        default:
          throw new Error("Cannot create GeneralName. Unsupported type of the name");
      }
    } else if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      name = AsnConvert.parse(args[0], GeneralName);
    } else {
      name = args[0];
    }
    super(name);
  }
  onInit(asn) {
    if (asn.dNSName != void 0) {
      this.type = DNS;
      this.value = asn.dNSName;
    } else if (asn.rfc822Name != void 0) {
      this.type = EMAIL;
      this.value = asn.rfc822Name;
    } else if (asn.iPAddress != void 0) {
      this.type = IP;
      this.value = asn.iPAddress;
    } else if (asn.uniformResourceIdentifier != void 0) {
      this.type = URL2;
      this.value = asn.uniformResourceIdentifier;
    } else if (asn.registeredID != void 0) {
      this.type = REGISTERED_ID;
      this.value = asn.registeredID;
    } else if (asn.directoryName != void 0) {
      this.type = DN;
      this.value = new Name3(asn.directoryName).toString();
    } else if (asn.otherName != void 0) {
      if (asn.otherName.typeId === id_GUID) {
        this.type = GUID;
        const guid = AsnConvert.parse(asn.otherName.value, OctetString2);
        const matches = new RegExp(GUID_REGEX, "i").exec(import_pvtsutils.Convert.ToHex(guid));
        if (!matches) {
          throw new Error(ERR_GUID);
        }
        this.value = matches.slice(1).map((o, i) => {
          if (i < 3) {
            return import_pvtsutils.Convert.ToHex(new Uint8Array(import_pvtsutils.Convert.FromHex(o)).reverse());
          }
          return o;
        }).join("-");
      } else if (asn.otherName.typeId === id_UPN) {
        this.type = UPN;
        this.value = AsnConvert.parse(asn.otherName.value, DirectoryString).toString();
      } else {
        throw new Error(ERR_GN_STRING_FORMAT);
      }
    } else {
      throw new Error(ERR_GN_STRING_FORMAT);
    }
  }
  toJSON() {
    return {
      type: this.type,
      value: this.value
    };
  }
  toTextObject() {
    let type;
    switch (this.type) {
      case DN:
      case DNS:
      case GUID:
      case IP:
      case REGISTERED_ID:
      case UPN:
      case URL2:
        type = this.type.toUpperCase();
        break;
      case EMAIL:
        type = "Email";
        break;
      default:
        throw new Error("Unsupported GeneralName type");
    }
    let value = this.value;
    if (this.type === REGISTERED_ID) {
      value = OidSerializer.toString(value);
    }
    return new TextObject(type, void 0, value);
  }
};
var GeneralNames3 = class extends AsnData {
  constructor(params) {
    let names2;
    if (params instanceof GeneralNames) {
      names2 = params;
    } else if (Array.isArray(params)) {
      const items = [];
      for (const name of params) {
        if (name instanceof GeneralName) {
          items.push(name);
        } else {
          const asnName = AsnConvert.parse(new GeneralName3(name.type, name.value).rawData, GeneralName);
          items.push(asnName);
        }
      }
      names2 = new GeneralNames(items);
    } else if (import_pvtsutils.BufferSourceConverter.isBufferSource(params)) {
      names2 = AsnConvert.parse(params, GeneralNames);
    } else {
      throw new Error("Cannot initialize GeneralNames. Incorrect incoming arguments");
    }
    super(names2);
  }
  onInit(asn) {
    const items = [];
    for (const asnName of asn) {
      let name = null;
      try {
        name = new GeneralName3(asnName);
      } catch {
        continue;
      }
      items.push(name);
    }
    this.items = items;
  }
  toJSON() {
    return this.items.map((o) => o.toJSON());
  }
  toTextObject() {
    const res = super.toTextObjectEmpty();
    for (const name of this.items) {
      const nameObj = name.toTextObject();
      let field = res[nameObj[TextObject.NAME]];
      if (!Array.isArray(field)) {
        field = [];
        res[nameObj[TextObject.NAME]] = field;
      }
      field.push(nameObj);
    }
    return res;
  }
};
GeneralNames3.NAME = "GeneralNames";
var rPaddingTag = "-{5}";
var rEolChars = "\\n";
var rNameTag = `[^${rEolChars}]+`;
var rBeginTag = `${rPaddingTag}BEGIN (${rNameTag}(?=${rPaddingTag}))${rPaddingTag}`;
var rEndTag = `${rPaddingTag}END \\1${rPaddingTag}`;
var rEolGroup = "\\n";
var rHeaderKey = `[^:${rEolChars}]+`;
var rHeaderValue = `(?:[^${rEolChars}]+${rEolGroup}(?: +[^${rEolChars}]+${rEolGroup})*)`;
var rBase64Chars = "[a-zA-Z0-9=+/]+";
var rBase64 = `(?:${rBase64Chars}${rEolGroup})+`;
var rPem = `${rBeginTag}${rEolGroup}(?:((?:${rHeaderKey}: ${rHeaderValue})+))?${rEolGroup}?(${rBase64})${rEndTag}`;
var rEolPattern = new RegExp(`[${rEolChars}]+`, "g");
var PemConverter = class {
  static isPem(data) {
    return typeof data === "string" && new RegExp(rPem, "g").test(data.replace(/\r/g, ""));
  }
  static decodeWithHeaders(pem2) {
    pem2 = pem2.replace(/\r/g, "");
    const pattern = new RegExp(rPem, "g");
    const res = [];
    let matches = null;
    while (matches = pattern.exec(pem2)) {
      const base643 = matches[3].replace(rEolPattern, "");
      const pemStruct = {
        type: matches[1],
        headers: [],
        rawData: import_pvtsutils.Convert.FromBase64(base643)
      };
      const headersString = matches[2];
      if (headersString) {
        const headers = headersString.split(new RegExp(rEolGroup, "g"));
        let lastHeader = null;
        for (const header of headers) {
          const [key, value] = header.split(/:(.*)/);
          if (value === void 0) {
            if (!lastHeader) {
              throw new Error("Cannot parse PEM string. Incorrect header value");
            }
            lastHeader.value += key.trim();
          } else {
            if (lastHeader) {
              pemStruct.headers.push(lastHeader);
            }
            lastHeader = {
              key,
              value: value.trim()
            };
          }
        }
        if (lastHeader) {
          pemStruct.headers.push(lastHeader);
        }
      }
      res.push(pemStruct);
    }
    return res;
  }
  static decode(pem2) {
    const blocks = this.decodeWithHeaders(pem2);
    return blocks.map((o) => o.rawData);
  }
  static decodeFirst(pem2) {
    const items = this.decode(pem2);
    if (!items.length) {
      throw new RangeError("PEM string doesn't contain any objects");
    }
    return items[0];
  }
  static encode(rawData, tag) {
    if (Array.isArray(rawData)) {
      const raws = new Array();
      if (tag) {
        rawData.forEach((element) => {
          if (!import_pvtsutils.BufferSourceConverter.isBufferSource(element)) {
            throw new TypeError("Cannot encode array of BufferSource in PEM format. Not all items of the array are BufferSource");
          }
          raws.push(this.encodeStruct({
            type: tag,
            rawData: import_pvtsutils.BufferSourceConverter.toArrayBuffer(element)
          }));
        });
      } else {
        rawData.forEach((element) => {
          if (!("type" in element)) {
            throw new TypeError("Cannot encode array of PemStruct in PEM format. Not all items of the array are PemStrut");
          }
          raws.push(this.encodeStruct(element));
        });
      }
      return raws.join("\n");
    } else {
      if (!tag) {
        throw new Error("Required argument 'tag' is missed");
      }
      return this.encodeStruct({
        type: tag,
        rawData: import_pvtsutils.BufferSourceConverter.toArrayBuffer(rawData)
      });
    }
  }
  static encodeStruct(pem2) {
    var _a3;
    const upperCaseType = pem2.type.toLocaleUpperCase();
    const res = [];
    res.push(`-----BEGIN ${upperCaseType}-----`);
    if ((_a3 = pem2.headers) === null || _a3 === void 0 ? void 0 : _a3.length) {
      for (const header of pem2.headers) {
        res.push(`${header.key}: ${header.value}`);
      }
      res.push("");
    }
    const base643 = import_pvtsutils.Convert.ToBase64(pem2.rawData);
    for (let i = 0; i < base643.length; i += 64) {
      res.push(base643.substring(i, i + 64));
    }
    res.push(`-----END ${upperCaseType}-----`);
    return res.join("\n");
  }
};
PemConverter.CertificateTag = "CERTIFICATE";
PemConverter.CrlTag = "CRL";
PemConverter.CertificateRequestTag = "CERTIFICATE REQUEST";
PemConverter.PublicKeyTag = "PUBLIC KEY";
PemConverter.PrivateKeyTag = "PRIVATE KEY";
var PemData = class _PemData extends AsnData {
  static isAsnEncoded(data) {
    return import_pvtsutils.BufferSourceConverter.isBufferSource(data) || typeof data === "string";
  }
  static toArrayBuffer(raw) {
    if (typeof raw === "string") {
      if (PemConverter.isPem(raw)) {
        return PemConverter.decode(raw)[0];
      } else if (import_pvtsutils.Convert.isHex(raw)) {
        return import_pvtsutils.Convert.FromHex(raw);
      } else if (import_pvtsutils.Convert.isBase64(raw)) {
        return import_pvtsutils.Convert.FromBase64(raw);
      } else if (import_pvtsutils.Convert.isBase64Url(raw)) {
        return import_pvtsutils.Convert.FromBase64Url(raw);
      } else {
        throw new TypeError("Unsupported format of 'raw' argument. Must be one of DER, PEM, HEX, Base64, or Base4Url");
      }
    } else {
      const buffer = import_pvtsutils.BufferSourceConverter.toUint8Array(raw);
      if (buffer.length > 0 && buffer[0] === 48) {
        return import_pvtsutils.BufferSourceConverter.toArrayBuffer(raw);
      }
      const stringRaw = import_pvtsutils.Convert.ToBinary(raw);
      if (PemConverter.isPem(stringRaw)) {
        return PemConverter.decode(stringRaw)[0];
      } else if (import_pvtsutils.Convert.isHex(stringRaw)) {
        return import_pvtsutils.Convert.FromHex(stringRaw);
      } else if (import_pvtsutils.Convert.isBase64(stringRaw)) {
        return import_pvtsutils.Convert.FromBase64(stringRaw);
      } else if (import_pvtsutils.Convert.isBase64Url(stringRaw)) {
        return import_pvtsutils.Convert.FromBase64Url(stringRaw);
      }
      throw new TypeError("Unsupported format of 'raw' argument. Must be one of DER, PEM, HEX, Base64, or Base4Url");
    }
  }
  constructor(...args) {
    if (_PemData.isAsnEncoded(args[0])) {
      super(_PemData.toArrayBuffer(args[0]), args[1], args[2]);
    } else {
      super(args[0], args[1]);
    }
  }
  toString(format4 = "pem") {
    switch (format4) {
      case "pem":
        return PemConverter.encode(this.rawData, this.tag);
      default:
        return super.toString(format4);
    }
  }
};
var PublicKey = class _PublicKey extends PemData {
  static async create(data, crypto2 = cryptoProvider.get()) {
    if (data instanceof _PublicKey) {
      return data;
    } else if (CryptoProvider.isCryptoKey(data)) {
      if (data.type !== "public") {
        throw new TypeError("Public key is required");
      }
      const spki = await crypto2.subtle.exportKey("spki", data);
      return new _PublicKey(spki);
    } else if (data.publicKey) {
      return data.publicKey;
    } else if (import_pvtsutils.BufferSourceConverter.isBufferSource(data)) {
      return new _PublicKey(data);
    } else {
      throw new TypeError("Unsupported PublicKeyType");
    }
  }
  constructor(param, options) {
    if (PemData.isAsnEncoded(param)) {
      super(param, SubjectPublicKeyInfo, options);
    } else {
      super(param, options);
    }
    this.tag = PemConverter.PublicKeyTag;
  }
  async export(arg1, arg2, arg3) {
    let crypto2;
    let keyUsages = ["verify"];
    let algorithm = {
      hash: "SHA-256",
      ...this.algorithm
    };
    if (arg2) {
      algorithm = arg1;
      keyUsages = arg2;
      crypto2 = arg3;
    } else {
      crypto2 = arg1;
    }
    crypto2 !== null && crypto2 !== void 0 ? crypto2 : crypto2 = cryptoProvider.get();
    let raw = this.rawData;
    const asnSpki = AsnConvert.parse(this.rawData, SubjectPublicKeyInfo, this.parseOptions);
    if (asnSpki.algorithm.algorithm === id_RSASSA_PSS) {
      raw = convertSpkiToRsaPkcs1(asnSpki, raw);
    }
    return crypto2.subtle.importKey("spki", raw, algorithm, true, keyUsages);
  }
  onInit(asn) {
    const algProv = instance.resolve(diAlgorithmProvider);
    const algorithm = this.algorithm = algProv.toWebAlgorithm(asn.algorithm);
    switch (asn.algorithm.algorithm) {
      case id_rsaEncryption: {
        const rsaPublicKey = AsnConvert.parse(asn.subjectPublicKey, RSAPublicKey, this.parseOptions);
        const modulus = import_pvtsutils.BufferSourceConverter.toUint8Array(rsaPublicKey.modulus);
        algorithm.publicExponent = import_pvtsutils.BufferSourceConverter.toUint8Array(rsaPublicKey.publicExponent);
        algorithm.modulusLength = (!modulus[0] ? modulus.slice(1) : modulus).byteLength << 3;
        break;
      }
    }
  }
  async getThumbprint(arg1, arg2) {
    let crypto2;
    let algorithm = "SHA-1";
    if (arg1) {
      if (typeof arg1 === "object" && "subtle" in arg1) {
        crypto2 = arg1;
      } else {
        algorithm = arg1;
        crypto2 = arg2;
      }
    }
    crypto2 !== null && crypto2 !== void 0 ? crypto2 : crypto2 = cryptoProvider.get();
    return await crypto2.subtle.digest(algorithm, this.rawData);
  }
  async getKeyIdentifier(arg1, arg2) {
    let crypto2;
    let algorithm = "SHA-1";
    if (arg1) {
      if (typeof arg1 === "object" && "subtle" in arg1) {
        crypto2 = arg1;
      } else {
        algorithm = arg1;
        crypto2 = arg2;
      }
    }
    crypto2 !== null && crypto2 !== void 0 ? crypto2 : crypto2 = cryptoProvider.get();
    const asn = AsnConvert.parse(this.rawData, SubjectPublicKeyInfo, this.parseOptions);
    return await crypto2.subtle.digest(algorithm, asn.subjectPublicKey);
  }
  toTextObject() {
    const obj = this.toTextObjectEmpty();
    const asn = AsnConvert.parse(this.rawData, SubjectPublicKeyInfo, this.parseOptions);
    obj["Algorithm"] = TextConverter.serializeAlgorithm(asn.algorithm);
    switch (asn.algorithm.algorithm) {
      case id_ecPublicKey:
        obj["EC Point"] = asn.subjectPublicKey;
        break;
      case id_rsaEncryption:
      default:
        obj["Raw Data"] = asn.subjectPublicKey;
    }
    return obj;
  }
};
function convertSpkiToRsaPkcs1(asnSpki, raw) {
  asnSpki.algorithm = new AlgorithmIdentifier({
    algorithm: id_rsaEncryption,
    parameters: null
  });
  raw = AsnConvert.serialize(asnSpki);
  return raw;
}
var AuthorityKeyIdentifierExtension = class _AuthorityKeyIdentifierExtension extends Extension2 {
  static async create(param, critical = false, crypto2 = cryptoProvider.get()) {
    if ("name" in param && "serialNumber" in param) {
      return new _AuthorityKeyIdentifierExtension(param, critical);
    }
    const key = await PublicKey.create(param, crypto2);
    const id = await key.getKeyIdentifier(crypto2);
    return new _AuthorityKeyIdentifierExtension(import_pvtsutils.Convert.ToHex(id), critical);
  }
  constructor(...args) {
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
    } else if (typeof args[0] === "string") {
      const value = new AuthorityKeyIdentifier({
        keyIdentifier: new KeyIdentifier(import_pvtsutils.Convert.FromHex(args[0]))
      });
      super(id_ce_authorityKeyIdentifier, args[1], AsnConvert.serialize(value));
    } else {
      const certId = args[0];
      const certIdName = certId.name instanceof GeneralNames3 ? AsnConvert.parse(certId.name.rawData, GeneralNames) : certId.name;
      const value = new AuthorityKeyIdentifier({
        authorityCertIssuer: certIdName,
        authorityCertSerialNumber: import_pvtsutils.Convert.FromHex(certId.serialNumber)
      });
      super(id_ce_authorityKeyIdentifier, args[1], AsnConvert.serialize(value));
    }
  }
  onInit(asn) {
    super.onInit(asn);
    const aki = AsnConvert.parse(asn.extnValue, AuthorityKeyIdentifier, this.parseOptions);
    if (aki.keyIdentifier) {
      this.keyId = import_pvtsutils.Convert.ToHex(aki.keyIdentifier);
    }
    if (aki.authorityCertIssuer || aki.authorityCertSerialNumber) {
      this.certId = {
        name: aki.authorityCertIssuer || [],
        serialNumber: aki.authorityCertSerialNumber ? import_pvtsutils.Convert.ToHex(aki.authorityCertSerialNumber) : ""
      };
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    const asn = AsnConvert.parse(this.value, AuthorityKeyIdentifier, this.parseOptions);
    if (asn.authorityCertIssuer) {
      obj["Authority Issuer"] = new GeneralNames3(asn.authorityCertIssuer).toTextObject();
    }
    if (asn.authorityCertSerialNumber) {
      obj["Authority Serial Number"] = asn.authorityCertSerialNumber;
    }
    if (asn.keyIdentifier) {
      obj[""] = asn.keyIdentifier;
    }
    return obj;
  }
};
AuthorityKeyIdentifierExtension.NAME = "Authority Key Identifier";
var BasicConstraintsExtension = class extends Extension2 {
  constructor(...args) {
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
      const value = AsnConvert.parse(this.value, BasicConstraints, this.parseOptions);
      this.ca = value.cA;
      this.pathLength = value.pathLenConstraint;
    } else {
      const value = new BasicConstraints({
        cA: args[0],
        pathLenConstraint: args[1]
      });
      super(id_ce_basicConstraints, args[2], AsnConvert.serialize(value));
      this.ca = args[0];
      this.pathLength = args[1];
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    if (this.ca) {
      obj["CA"] = this.ca;
    }
    if (this.pathLength !== void 0) {
      obj["Path Length"] = this.pathLength;
    }
    return obj;
  }
};
BasicConstraintsExtension.NAME = "Basic Constraints";
var ExtendedKeyUsage3;
(function(ExtendedKeyUsage4) {
  ExtendedKeyUsage4["serverAuth"] = "1.3.6.1.5.5.7.3.1";
  ExtendedKeyUsage4["clientAuth"] = "1.3.6.1.5.5.7.3.2";
  ExtendedKeyUsage4["codeSigning"] = "1.3.6.1.5.5.7.3.3";
  ExtendedKeyUsage4["emailProtection"] = "1.3.6.1.5.5.7.3.4";
  ExtendedKeyUsage4["timeStamping"] = "1.3.6.1.5.5.7.3.8";
  ExtendedKeyUsage4["ocspSigning"] = "1.3.6.1.5.5.7.3.9";
})(ExtendedKeyUsage3 || (ExtendedKeyUsage3 = {}));
var ExtendedKeyUsageExtension = class extends Extension2 {
  constructor(...args) {
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
      const value = AsnConvert.parse(this.value, ExtendedKeyUsage, this.parseOptions);
      this.usages = value.map((o) => o);
    } else {
      const value = new ExtendedKeyUsage(args[0]);
      super(id_ce_extKeyUsage, args[1], AsnConvert.serialize(value));
      this.usages = args[0];
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    obj[""] = this.usages.map((o) => OidSerializer.toString(o)).join(", ");
    return obj;
  }
};
ExtendedKeyUsageExtension.NAME = "Extended Key Usages";
var KeyUsageFlags2;
(function(KeyUsageFlags3) {
  KeyUsageFlags3[KeyUsageFlags3["digitalSignature"] = 1] = "digitalSignature";
  KeyUsageFlags3[KeyUsageFlags3["nonRepudiation"] = 2] = "nonRepudiation";
  KeyUsageFlags3[KeyUsageFlags3["keyEncipherment"] = 4] = "keyEncipherment";
  KeyUsageFlags3[KeyUsageFlags3["dataEncipherment"] = 8] = "dataEncipherment";
  KeyUsageFlags3[KeyUsageFlags3["keyAgreement"] = 16] = "keyAgreement";
  KeyUsageFlags3[KeyUsageFlags3["keyCertSign"] = 32] = "keyCertSign";
  KeyUsageFlags3[KeyUsageFlags3["cRLSign"] = 64] = "cRLSign";
  KeyUsageFlags3[KeyUsageFlags3["encipherOnly"] = 128] = "encipherOnly";
  KeyUsageFlags3[KeyUsageFlags3["decipherOnly"] = 256] = "decipherOnly";
})(KeyUsageFlags2 || (KeyUsageFlags2 = {}));
var KeyUsagesExtension = class extends Extension2 {
  constructor(...args) {
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
      const value = AsnConvert.parse(this.value, KeyUsage, this.parseOptions);
      this.usages = value.toNumber();
    } else {
      const value = new KeyUsage(args[0]);
      super(id_ce_keyUsage, args[1], AsnConvert.serialize(value));
      this.usages = args[0];
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    const asn = AsnConvert.parse(this.value, KeyUsage, this.parseOptions);
    obj[""] = asn.toJSON().join(", ");
    return obj;
  }
};
KeyUsagesExtension.NAME = "Key Usages";
var SubjectKeyIdentifierExtension = class _SubjectKeyIdentifierExtension extends Extension2 {
  static async create(publicKey, critical = false, crypto2 = cryptoProvider.get()) {
    const key = await PublicKey.create(publicKey, crypto2);
    const id = await key.getKeyIdentifier(crypto2);
    return new _SubjectKeyIdentifierExtension(import_pvtsutils.Convert.ToHex(id), critical);
  }
  constructor(...args) {
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
      const value = AsnConvert.parse(this.value, SubjectKeyIdentifier, this.parseOptions);
      this.keyId = import_pvtsutils.Convert.ToHex(value);
    } else {
      const identifier = typeof args[0] === "string" ? import_pvtsutils.Convert.FromHex(args[0]) : args[0];
      const value = new SubjectKeyIdentifier(identifier);
      super(id_ce_subjectKeyIdentifier, args[1], AsnConvert.serialize(value));
      this.keyId = import_pvtsutils.Convert.ToHex(identifier);
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    const asn = AsnConvert.parse(this.value, SubjectKeyIdentifier, this.parseOptions);
    obj[""] = asn;
    return obj;
  }
};
SubjectKeyIdentifierExtension.NAME = "Subject Key Identifier";
var SubjectAlternativeNameExtension = class extends Extension2 {
  constructor(...args) {
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
    } else {
      super(id_ce_subjectAltName, args[1], new GeneralNames3(args[0] || []).rawData);
    }
  }
  onInit(asn) {
    super.onInit(asn);
    const value = AsnConvert.parse(asn.extnValue, SubjectAlternativeName, this.parseOptions);
    this.names = new GeneralNames3(value);
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    const namesObj = this.names.toTextObject();
    for (const key in namesObj) {
      obj[key] = namesObj[key];
    }
    return obj;
  }
};
SubjectAlternativeNameExtension.NAME = "Subject Alternative Name";
var ExtensionFactory = class {
  static register(id, type) {
    this.items.set(id, type);
  }
  static create(data, options) {
    const extension = new Extension2(data, options);
    const Type = this.items.get(extension.type);
    if (Type) {
      return new Type(data, options);
    }
    return extension;
  }
};
ExtensionFactory.items = /* @__PURE__ */ new Map();
var CertificatePolicyExtension = class extends Extension2 {
  constructor(...args) {
    var _a3;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
      const asnPolicies = AsnConvert.parse(this.value, CertificatePolicies, this.parseOptions);
      this.policies = asnPolicies.map((o) => o.policyIdentifier);
    } else {
      const policies = args[0];
      const critical = (_a3 = args[1]) !== null && _a3 !== void 0 ? _a3 : false;
      const value = new CertificatePolicies(policies.map((o) => new PolicyInformation({ policyIdentifier: o })));
      super(id_ce_certificatePolicies, critical, AsnConvert.serialize(value));
      this.policies = policies;
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    obj["Policy"] = this.policies.map((o) => new TextObject("", {}, OidSerializer.toString(o)));
    return obj;
  }
};
CertificatePolicyExtension.NAME = "Certificate Policies";
ExtensionFactory.register(id_ce_certificatePolicies, CertificatePolicyExtension);
var CRLDistributionPointsExtension = class extends Extension2 {
  constructor(...args) {
    var _a3;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
    } else if (Array.isArray(args[0]) && typeof args[0][0] === "string") {
      const urls = args[0];
      const dps = urls.map((url) => {
        return new DistributionPoint({
          distributionPoint: new DistributionPointName({
            fullName: [new GeneralName({ uniformResourceIdentifier: url })]
          })
        });
      });
      const value = new CRLDistributionPoints(dps);
      super(id_ce_cRLDistributionPoints, args[1], AsnConvert.serialize(value));
    } else {
      const value = new CRLDistributionPoints(args[0]);
      super(id_ce_cRLDistributionPoints, args[1], AsnConvert.serialize(value));
    }
    (_a3 = this.distributionPoints) !== null && _a3 !== void 0 ? _a3 : this.distributionPoints = [];
  }
  onInit(asn) {
    super.onInit(asn);
    const crlExt = AsnConvert.parse(asn.extnValue, CRLDistributionPoints, this.parseOptions);
    this.distributionPoints = crlExt;
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    obj["Distribution Point"] = this.distributionPoints.map((dp) => {
      var _a3;
      const dpObj = new TextObject("");
      if ((_a3 = dp.distributionPoint) === null || _a3 === void 0 ? void 0 : _a3.fullName) {
        dpObj[""] = dp.distributionPoint.fullName.map((name) => new GeneralName3(name).toString()).join(", ");
      }
      if (dp.reasons) {
        dpObj["Reasons"] = dp.reasons.toString();
      }
      if (dp.cRLIssuer) {
        dpObj["CRL Issuer"] = dp.cRLIssuer.map((issuer) => issuer.toString()).join(", ");
      }
      return dpObj;
    });
    return obj;
  }
};
CRLDistributionPointsExtension.NAME = "CRL Distribution Points";
var AuthorityInfoAccessExtension = class extends Extension2 {
  constructor(...args) {
    var _a3, _b, _c, _d;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
    } else if (args[0] instanceof AuthorityInfoAccessSyntax) {
      const value = new AuthorityInfoAccessSyntax(args[0]);
      super(id_pe_authorityInfoAccess, args[1], AsnConvert.serialize(value));
    } else {
      const params = args[0];
      const value = new AuthorityInfoAccessSyntax();
      addAccessDescriptions(value, params, id_ad_ocsp, "ocsp");
      addAccessDescriptions(value, params, id_ad_caIssuers, "caIssuers");
      addAccessDescriptions(value, params, id_ad_timeStamping, "timeStamping");
      addAccessDescriptions(value, params, id_ad_caRepository, "caRepository");
      super(id_pe_authorityInfoAccess, args[1], AsnConvert.serialize(value));
    }
    (_a3 = this.ocsp) !== null && _a3 !== void 0 ? _a3 : this.ocsp = [];
    (_b = this.caIssuers) !== null && _b !== void 0 ? _b : this.caIssuers = [];
    (_c = this.timeStamping) !== null && _c !== void 0 ? _c : this.timeStamping = [];
    (_d = this.caRepository) !== null && _d !== void 0 ? _d : this.caRepository = [];
  }
  onInit(asn) {
    super.onInit(asn);
    this.ocsp = [];
    this.caIssuers = [];
    this.timeStamping = [];
    this.caRepository = [];
    const aia = AsnConvert.parse(asn.extnValue, AuthorityInfoAccessSyntax, this.parseOptions);
    aia.forEach((accessDescription) => {
      switch (accessDescription.accessMethod) {
        case id_ad_ocsp:
          this.ocsp.push(new GeneralName3(accessDescription.accessLocation));
          break;
        case id_ad_caIssuers:
          this.caIssuers.push(new GeneralName3(accessDescription.accessLocation));
          break;
        case id_ad_timeStamping:
          this.timeStamping.push(new GeneralName3(accessDescription.accessLocation));
          break;
        case id_ad_caRepository:
          this.caRepository.push(new GeneralName3(accessDescription.accessLocation));
          break;
      }
    });
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    if (this.ocsp.length) {
      addUrlsToObject(obj, "OCSP", this.ocsp);
    }
    if (this.caIssuers.length) {
      addUrlsToObject(obj, "CA Issuers", this.caIssuers);
    }
    if (this.timeStamping.length) {
      addUrlsToObject(obj, "Time Stamping", this.timeStamping);
    }
    if (this.caRepository.length) {
      addUrlsToObject(obj, "CA Repository", this.caRepository);
    }
    return obj;
  }
};
AuthorityInfoAccessExtension.NAME = "Authority Info Access";
function addUrlsToObject(obj, key, urls) {
  if (urls.length === 1) {
    obj[key] = urls[0].toTextObject();
  } else {
    const names2 = new TextObject("");
    urls.forEach((name, index) => {
      const nameObj = name.toTextObject();
      const indexedKey = `${nameObj[TextObject.NAME]} ${index + 1}`;
      let field = names2[indexedKey];
      if (!Array.isArray(field)) {
        field = [];
        names2[indexedKey] = field;
      }
      field.push(nameObj);
    });
    obj[key] = names2;
  }
}
function addAccessDescriptions(value, params, method, key) {
  const items = params[key];
  if (items) {
    const array = Array.isArray(items) ? items : [items];
    array.forEach((url) => {
      if (typeof url === "string") {
        url = new GeneralName3("url", url);
      }
      value.push(new AccessDescription({
        accessMethod: method,
        accessLocation: AsnConvert.parse(url.rawData, GeneralName)
      }));
    });
  }
}
var IssuerAlternativeNameExtension = class extends Extension2 {
  constructor(...args) {
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
    } else {
      super(id_ce_issuerAltName, args[1], new GeneralNames3(args[0] || []).rawData);
    }
  }
  onInit(asn) {
    super.onInit(asn);
    const value = AsnConvert.parse(asn.extnValue, GeneralNames, this.parseOptions);
    this.names = new GeneralNames3(value);
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    const namesObj = this.names.toTextObject();
    for (const key in namesObj) {
      obj[key] = namesObj[key];
    }
    return obj;
  }
};
IssuerAlternativeNameExtension.NAME = "Issuer Alternative Name";
var Attribute3 = class _Attribute extends AsnData {
  constructor(...args) {
    let raw;
    let options;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      raw = import_pvtsutils.BufferSourceConverter.toArrayBuffer(args[0]);
      options = args[1];
    } else {
      const type = args[0];
      const values = Array.isArray(args[1]) ? args[1].map((o) => import_pvtsutils.BufferSourceConverter.toArrayBuffer(o)) : [];
      raw = AsnConvert.serialize(new Attribute({
        type,
        values
      }));
    }
    super(raw, Attribute, options);
  }
  onInit(asn) {
    this.type = asn.type;
    this.values = asn.values;
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    obj["Value"] = this.values.map((o) => new TextObject("", { "": o }));
    return obj;
  }
  toTextObjectWithoutValue() {
    const obj = this.toTextObjectEmpty();
    if (obj[TextObject.NAME] === _Attribute.NAME) {
      obj[TextObject.NAME] = OidSerializer.toString(this.type);
    }
    return obj;
  }
};
Attribute3.NAME = "Attribute";
var ChallengePasswordAttribute = class extends Attribute3 {
  constructor(...args) {
    var _a3;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
    } else {
      const value = new ChallengePassword({ printableString: args[0] });
      super(id_pkcs9_at_challengePassword, [AsnConvert.serialize(value)]);
    }
    (_a3 = this.password) !== null && _a3 !== void 0 ? _a3 : this.password = "";
  }
  onInit(asn) {
    super.onInit(asn);
    if (this.values[0]) {
      const value = AsnConvert.parse(this.values[0], ChallengePassword, this.parseOptions);
      this.password = value.toString();
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    obj[TextObject.VALUE] = this.password;
    return obj;
  }
};
ChallengePasswordAttribute.NAME = "Challenge Password";
var ExtensionsAttribute = class extends Attribute3 {
  constructor(...args) {
    var _a3;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      super(args[0], args[1]);
    } else {
      const extensions = args[0];
      const value = new Extensions();
      for (const extension of extensions) {
        value.push(AsnConvert.parse(extension.rawData, Extension));
      }
      super(id_pkcs9_at_extensionRequest, [AsnConvert.serialize(value)]);
    }
    (_a3 = this.items) !== null && _a3 !== void 0 ? _a3 : this.items = [];
  }
  onInit(asn) {
    super.onInit(asn);
    if (this.values[0]) {
      const value = AsnConvert.parse(this.values[0], Extensions, this.parseOptions);
      this.items = value.map((o) => ExtensionFactory.create(AsnConvert.serialize(o), this.parseOptions));
    }
  }
  toTextObject() {
    const obj = this.toTextObjectWithoutValue();
    const extensions = this.items.map((o) => o.toTextObject());
    for (const extension of extensions) {
      obj[extension[TextObject.NAME]] = extension;
    }
    return obj;
  }
};
ExtensionsAttribute.NAME = "Extensions";
var AttributeFactory = class {
  static register(id, type) {
    this.items.set(id, type);
  }
  static create(data, options) {
    const attribute = new Attribute3(data, options);
    const Type = this.items.get(attribute.type);
    if (Type) {
      return new Type(data, options);
    }
    return attribute;
  }
};
AttributeFactory.items = /* @__PURE__ */ new Map();
var diAsnSignatureFormatter = "crypto.signatureFormatter";
var AsnDefaultSignatureFormatter = class {
  toAsnSignature(algorithm, signature) {
    return import_pvtsutils.BufferSourceConverter.toArrayBuffer(signature);
  }
  toWebSignature(algorithm, signature) {
    return import_pvtsutils.BufferSourceConverter.toArrayBuffer(signature);
  }
};
var RsaAlgorithm_1;
var RsaAlgorithm = RsaAlgorithm_1 = class RsaAlgorithm2 {
  static createPssParams(hash, saltLength) {
    const hashAlgorithm = RsaAlgorithm_1.getHashAlgorithm(hash);
    if (!hashAlgorithm) {
      return null;
    }
    return new RsaSaPssParams({
      hashAlgorithm,
      maskGenAlgorithm: new AlgorithmIdentifier({
        algorithm: id_mgf1,
        parameters: AsnConvert.serialize(hashAlgorithm)
      }),
      saltLength
    });
  }
  static getHashAlgorithm(alg) {
    const algProv = instance.resolve(diAlgorithmProvider);
    if (typeof alg === "string") {
      return algProv.toAsnAlgorithm({ name: alg });
    }
    if (typeof alg === "object" && alg && "name" in alg) {
      return algProv.toAsnAlgorithm(alg);
    }
    return null;
  }
  toAsnAlgorithm(alg) {
    switch (alg.name.toLowerCase()) {
      case "rsassa-pkcs1-v1_5":
        if ("hash" in alg) {
          let hash;
          if (typeof alg.hash === "string") {
            hash = alg.hash;
          } else if (alg.hash && typeof alg.hash === "object" && "name" in alg.hash && typeof alg.hash.name === "string") {
            hash = alg.hash.name.toUpperCase();
          } else {
            throw new Error("Cannot get hash algorithm name");
          }
          switch (hash.toLowerCase()) {
            case "sha-1":
              return new AlgorithmIdentifier({
                algorithm: id_sha1WithRSAEncryption,
                parameters: null
              });
            case "sha-256":
              return new AlgorithmIdentifier({
                algorithm: id_sha256WithRSAEncryption,
                parameters: null
              });
            case "sha-384":
              return new AlgorithmIdentifier({
                algorithm: id_sha384WithRSAEncryption,
                parameters: null
              });
            case "sha-512":
              return new AlgorithmIdentifier({
                algorithm: id_sha512WithRSAEncryption,
                parameters: null
              });
          }
        } else {
          return new AlgorithmIdentifier({
            algorithm: id_rsaEncryption,
            parameters: null
          });
        }
        break;
      case "rsa-pss":
        if ("hash" in alg) {
          if (!("saltLength" in alg && typeof alg.saltLength === "number")) {
            throw new Error("Cannot get 'saltLength' from 'alg' argument");
          }
          const pssParams = RsaAlgorithm_1.createPssParams(alg.hash, alg.saltLength);
          if (!pssParams) {
            throw new Error("Cannot create PSS parameters");
          }
          return new AlgorithmIdentifier({
            algorithm: id_RSASSA_PSS,
            parameters: AsnConvert.serialize(pssParams)
          });
        } else {
          return new AlgorithmIdentifier({
            algorithm: id_RSASSA_PSS,
            parameters: null
          });
        }
    }
    return null;
  }
  toWebAlgorithm(alg) {
    switch (alg.algorithm) {
      case id_rsaEncryption:
        return { name: "RSASSA-PKCS1-v1_5" };
      case id_sha1WithRSAEncryption:
        return {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-1" }
        };
      case id_sha256WithRSAEncryption:
        return {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-256" }
        };
      case id_sha384WithRSAEncryption:
        return {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-384" }
        };
      case id_sha512WithRSAEncryption:
        return {
          name: "RSASSA-PKCS1-v1_5",
          hash: { name: "SHA-512" }
        };
      case id_RSASSA_PSS:
        if (alg.parameters) {
          const pssParams = AsnConvert.parse(alg.parameters, RsaSaPssParams);
          const algProv = instance.resolve(diAlgorithmProvider);
          const hashAlg = algProv.toWebAlgorithm(pssParams.hashAlgorithm);
          return {
            name: "RSA-PSS",
            hash: hashAlg,
            saltLength: pssParams.saltLength
          };
        } else {
          return { name: "RSA-PSS" };
        }
    }
    return null;
  }
};
RsaAlgorithm = RsaAlgorithm_1 = __decorate([
  injectable_default()
], RsaAlgorithm);
instance.registerSingleton(diAlgorithm, RsaAlgorithm);
var ShaAlgorithm = class ShaAlgorithm2 {
  toAsnAlgorithm(alg) {
    switch (alg.name.toLowerCase()) {
      case "sha-1":
        return new AlgorithmIdentifier({ algorithm: id_sha1 });
      case "sha-256":
        return new AlgorithmIdentifier({ algorithm: id_sha256 });
      case "sha-384":
        return new AlgorithmIdentifier({ algorithm: id_sha384 });
      case "sha-512":
        return new AlgorithmIdentifier({ algorithm: id_sha512 });
    }
    return null;
  }
  toWebAlgorithm(alg) {
    switch (alg.algorithm) {
      case id_sha1:
        return { name: "SHA-1" };
      case id_sha256:
        return { name: "SHA-256" };
      case id_sha384:
        return { name: "SHA-384" };
      case id_sha512:
        return { name: "SHA-512" };
    }
    return null;
  }
};
ShaAlgorithm = __decorate([
  injectable_default()
], ShaAlgorithm);
instance.registerSingleton(diAlgorithm, ShaAlgorithm);
var AsnEcSignatureFormatter = class _AsnEcSignatureFormatter {
  addPadding(pointSize, data) {
    const bytes = import_pvtsutils.BufferSourceConverter.toUint8Array(data);
    const res = new Uint8Array(pointSize);
    res.set(bytes, pointSize - bytes.length);
    return res.buffer;
  }
  removePadding(data, positive = false) {
    let bytes = import_pvtsutils.BufferSourceConverter.toUint8Array(data);
    for (let i = 0; i < bytes.length; i++) {
      if (!bytes[i]) {
        continue;
      }
      bytes = bytes.slice(i);
      break;
    }
    if (positive && bytes[0] > 127) {
      const result = new Uint8Array(bytes.length + 1);
      result.set(bytes, 1);
      return result.buffer;
    }
    return bytes.buffer;
  }
  toAsnSignature(algorithm, signature) {
    if (algorithm.name === "ECDSA") {
      const namedCurve = algorithm.namedCurve;
      const pointSize = _AsnEcSignatureFormatter.namedCurveSize.get(namedCurve) || _AsnEcSignatureFormatter.defaultNamedCurveSize;
      const ecSignature = new ECDSASigValue();
      const uint8Signature = import_pvtsutils.BufferSourceConverter.toUint8Array(signature);
      ecSignature.r = this.removePadding(uint8Signature.slice(0, pointSize), true);
      ecSignature.s = this.removePadding(uint8Signature.slice(pointSize, pointSize + pointSize), true);
      return AsnConvert.serialize(ecSignature);
    }
    return null;
  }
  toWebSignature(algorithm, signature) {
    if (algorithm.name === "ECDSA") {
      const ecSigValue = AsnConvert.parse(signature, ECDSASigValue);
      const namedCurve = algorithm.namedCurve;
      const pointSize = _AsnEcSignatureFormatter.namedCurveSize.get(namedCurve) || _AsnEcSignatureFormatter.defaultNamedCurveSize;
      const r = this.addPadding(pointSize, this.removePadding(ecSigValue.r));
      const s = this.addPadding(pointSize, this.removePadding(ecSigValue.s));
      return (0, import_pvtsutils.combine)(r, s);
    }
    return null;
  }
};
AsnEcSignatureFormatter.namedCurveSize = /* @__PURE__ */ new Map();
AsnEcSignatureFormatter.defaultNamedCurveSize = 32;
var idX25519 = "1.3.101.110";
var idX448 = "1.3.101.111";
var idEd25519 = "1.3.101.112";
var idEd448 = "1.3.101.113";
var EdAlgorithm = class EdAlgorithm2 {
  toAsnAlgorithm(alg) {
    let algorithm = null;
    switch (alg.name.toLowerCase()) {
      case "ed25519":
        algorithm = idEd25519;
        break;
      case "x25519":
        algorithm = idX25519;
        break;
      case "eddsa":
        switch (alg.namedCurve.toLowerCase()) {
          case "ed25519":
            algorithm = idEd25519;
            break;
          case "ed448":
            algorithm = idEd448;
            break;
        }
        break;
      case "ecdh-es":
        switch (alg.namedCurve.toLowerCase()) {
          case "x25519":
            algorithm = idX25519;
            break;
          case "x448":
            algorithm = idX448;
            break;
        }
    }
    if (algorithm) {
      return new AlgorithmIdentifier({ algorithm });
    }
    return null;
  }
  toWebAlgorithm(alg) {
    switch (alg.algorithm) {
      case idEd25519:
        return { name: "Ed25519" };
      case idEd448:
        return {
          name: "EdDSA",
          namedCurve: "Ed448"
        };
      case idX25519:
        return { name: "X25519" };
      case idX448:
        return {
          name: "ECDH-ES",
          namedCurve: "X448"
        };
    }
    return null;
  }
};
EdAlgorithm = __decorate([
  injectable_default()
], EdAlgorithm);
instance.registerSingleton(diAlgorithm, EdAlgorithm);
var MlDsaAlgorithm = class MlDsaAlgorithm2 {
  toAsnAlgorithm(alg) {
    let algorithm = null;
    switch (alg.name.toLowerCase()) {
      case "ml-dsa-44":
        algorithm = id_ml_dsa_44;
        break;
      case "ml-dsa-65":
        algorithm = id_ml_dsa_65;
        break;
      case "ml-dsa-87":
        algorithm = id_ml_dsa_87;
        break;
    }
    if (algorithm) {
      return new AlgorithmIdentifier({ algorithm });
    }
    return null;
  }
  toWebAlgorithm(alg) {
    switch (alg.algorithm) {
      case id_ml_dsa_44:
        return { name: "ML-DSA-44" };
      case id_ml_dsa_65:
        return { name: "ML-DSA-65" };
      case id_ml_dsa_87:
        return { name: "ML-DSA-87" };
    }
    return null;
  }
};
MlDsaAlgorithm = __decorate([
  injectable_default()
], MlDsaAlgorithm);
instance.registerSingleton(diAlgorithm, MlDsaAlgorithm);
var SlhDsaAlgorithm = class SlhDsaAlgorithm2 {
  toAsnAlgorithm(alg) {
    let algorithm = null;
    switch (alg.name.toLowerCase()) {
      case "slh-dsa-sha2-128s":
        algorithm = id_slh_dsa_sha2_128s;
        break;
      case "slh-dsa-sha2-128f":
        algorithm = id_slh_dsa_sha2_128f;
        break;
      case "slh-dsa-sha2-192s":
        algorithm = id_slh_dsa_sha2_192s;
        break;
      case "slh-dsa-sha2-192f":
        algorithm = id_slh_dsa_sha2_192f;
        break;
      case "slh-dsa-sha2-256s":
        algorithm = id_slh_dsa_sha2_256s;
        break;
      case "slh-dsa-sha2-256f":
        algorithm = id_slh_dsa_sha2_256f;
        break;
      case "slh-dsa-shake-128s":
        algorithm = id_slh_dsa_shake_128s;
        break;
      case "slh-dsa-shake-128f":
        algorithm = id_slh_dsa_shake_128f;
        break;
      case "slh-dsa-shake-192s":
        algorithm = id_slh_dsa_shake_192s;
        break;
      case "slh-dsa-shake-192f":
        algorithm = id_slh_dsa_shake_192f;
        break;
      case "slh-dsa-shake-256s":
        algorithm = id_slh_dsa_shake_256s;
        break;
      case "slh-dsa-shake-256f":
        algorithm = id_slh_dsa_shake_256f;
        break;
    }
    if (algorithm) {
      return new AlgorithmIdentifier({ algorithm });
    }
    return null;
  }
  toWebAlgorithm(alg) {
    switch (alg.algorithm) {
      case id_slh_dsa_sha2_128s:
        return { name: "SLH-DSA-SHA2-128s" };
      case id_slh_dsa_sha2_128f:
        return { name: "SLH-DSA-SHA2-128f" };
      case id_slh_dsa_sha2_192s:
        return { name: "SLH-DSA-SHA2-192s" };
      case id_slh_dsa_sha2_192f:
        return { name: "SLH-DSA-SHA2-192f" };
      case id_slh_dsa_sha2_256s:
        return { name: "SLH-DSA-SHA2-256s" };
      case id_slh_dsa_sha2_256f:
        return { name: "SLH-DSA-SHA2-256f" };
      case id_slh_dsa_shake_128s:
        return { name: "SLH-DSA-SHAKE-128s" };
      case id_slh_dsa_shake_128f:
        return { name: "SLH-DSA-SHAKE-128f" };
      case id_slh_dsa_shake_192s:
        return { name: "SLH-DSA-SHAKE-192s" };
      case id_slh_dsa_shake_192f:
        return { name: "SLH-DSA-SHAKE-192f" };
      case id_slh_dsa_shake_256s:
        return { name: "SLH-DSA-SHAKE-256s" };
      case id_slh_dsa_shake_256f:
        return { name: "SLH-DSA-SHAKE-256f" };
    }
    return null;
  }
};
SlhDsaAlgorithm = __decorate([
  injectable_default()
], SlhDsaAlgorithm);
instance.registerSingleton(diAlgorithm, SlhDsaAlgorithm);
var _Pkcs10CertificateRequest_tbs;
var _Pkcs10CertificateRequest_subjectName;
var _Pkcs10CertificateRequest_subject;
var _Pkcs10CertificateRequest_signatureAlgorithm;
var _Pkcs10CertificateRequest_signature;
var _Pkcs10CertificateRequest_publicKey;
var _Pkcs10CertificateRequest_attributes;
var _Pkcs10CertificateRequest_extensions;
var Pkcs10CertificateRequest = class extends PemData {
  get subjectName() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_subjectName, "f")) {
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_subjectName, new Name3(this.asn.certificationRequestInfo.subject), "f");
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_subjectName, "f");
  }
  get subject() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_subject, "f")) {
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_subject, this.subjectName.toString(), "f");
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_subject, "f");
  }
  get signatureAlgorithm() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_signatureAlgorithm, "f")) {
      const algProv = instance.resolve(diAlgorithmProvider);
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_signatureAlgorithm, algProv.toWebAlgorithm(this.asn.signatureAlgorithm), "f");
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_signatureAlgorithm, "f");
  }
  get signature() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_signature, "f")) {
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_signature, this.asn.signature, "f");
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_signature, "f");
  }
  get publicKey() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_publicKey, "f")) {
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_publicKey, new PublicKey(this.asn.certificationRequestInfo.subjectPKInfo, this.parseOptions), "f");
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_publicKey, "f");
  }
  get attributes() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_attributes, "f")) {
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_attributes, this.asn.certificationRequestInfo.attributes.map((o) => AttributeFactory.create(AsnConvert.serialize(o), this.parseOptions)), "f");
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_attributes, "f");
  }
  get extensions() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_extensions, "f")) {
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_extensions, [], "f");
      const extensions = this.getAttribute(id_pkcs9_at_extensionRequest);
      if (extensions instanceof ExtensionsAttribute) {
        __classPrivateFieldSet(this, _Pkcs10CertificateRequest_extensions, extensions.items, "f");
      }
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_extensions, "f");
  }
  get tbs() {
    if (!__classPrivateFieldGet(this, _Pkcs10CertificateRequest_tbs, "f")) {
      __classPrivateFieldSet(this, _Pkcs10CertificateRequest_tbs, this.asn.certificationRequestInfoRaw || AsnConvert.serialize(this.asn.certificationRequestInfo), "f");
    }
    return __classPrivateFieldGet(this, _Pkcs10CertificateRequest_tbs, "f");
  }
  constructor(param, options) {
    const args = PemData.isAsnEncoded(param) ? [param, CertificationRequest, options] : [param, options];
    super(args[0], args[1], args[2]);
    _Pkcs10CertificateRequest_tbs.set(this, void 0);
    _Pkcs10CertificateRequest_subjectName.set(this, void 0);
    _Pkcs10CertificateRequest_subject.set(this, void 0);
    _Pkcs10CertificateRequest_signatureAlgorithm.set(this, void 0);
    _Pkcs10CertificateRequest_signature.set(this, void 0);
    _Pkcs10CertificateRequest_publicKey.set(this, void 0);
    _Pkcs10CertificateRequest_attributes.set(this, void 0);
    _Pkcs10CertificateRequest_extensions.set(this, void 0);
    this.tag = PemConverter.CertificateRequestTag;
  }
  onInit(_asn) {
  }
  getAttribute(type) {
    for (const attr of this.attributes) {
      if (attr.type === type) {
        return attr;
      }
    }
    return null;
  }
  getAttributes(type) {
    return this.attributes.filter((o) => o.type === type);
  }
  getExtension(type) {
    for (const ext of this.extensions) {
      if (ext.type === type) {
        return ext;
      }
    }
    return null;
  }
  getExtensions(type) {
    return this.extensions.filter((o) => o.type === type);
  }
  async verify(crypto2 = cryptoProvider.get()) {
    const algorithm = {
      ...this.publicKey.algorithm,
      ...this.signatureAlgorithm
    };
    const publicKey = await this.publicKey.export(algorithm, ["verify"], crypto2);
    const signatureFormatters = instance.resolveAll(diAsnSignatureFormatter).reverse();
    let signature = null;
    for (const signatureFormatter of signatureFormatters) {
      signature = signatureFormatter.toWebSignature(algorithm, this.signature);
      if (signature) {
        break;
      }
    }
    if (!signature) {
      throw Error("Cannot convert WebCrypto signature value to ASN.1 format");
    }
    const ok = await crypto2.subtle.verify(this.signatureAlgorithm, publicKey, signature, this.tbs);
    return ok;
  }
  toTextObject() {
    const obj = this.toTextObjectEmpty();
    const req = AsnConvert.parse(this.rawData, CertificationRequest, this.parseOptions);
    const tbs = req.certificationRequestInfo;
    const data = new TextObject("", {
      Version: `${Version[tbs.version]} (${tbs.version})`,
      Subject: this.subject,
      "Subject Public Key Info": this.publicKey
    });
    if (this.attributes.length) {
      const attrs = new TextObject("");
      for (const ext of this.attributes) {
        const attrObj = ext.toTextObject();
        attrs[attrObj[TextObject.NAME]] = attrObj;
      }
      data["Attributes"] = attrs;
    }
    obj["Data"] = data;
    obj["Signature"] = new TextObject("", {
      Algorithm: TextConverter.serializeAlgorithm(req.signatureAlgorithm),
      "": req.signature
    });
    return obj;
  }
};
_Pkcs10CertificateRequest_tbs = /* @__PURE__ */ new WeakMap(), _Pkcs10CertificateRequest_subjectName = /* @__PURE__ */ new WeakMap(), _Pkcs10CertificateRequest_subject = /* @__PURE__ */ new WeakMap(), _Pkcs10CertificateRequest_signatureAlgorithm = /* @__PURE__ */ new WeakMap(), _Pkcs10CertificateRequest_signature = /* @__PURE__ */ new WeakMap(), _Pkcs10CertificateRequest_publicKey = /* @__PURE__ */ new WeakMap(), _Pkcs10CertificateRequest_attributes = /* @__PURE__ */ new WeakMap(), _Pkcs10CertificateRequest_extensions = /* @__PURE__ */ new WeakMap();
Pkcs10CertificateRequest.NAME = "PKCS#10 Certificate Request";
function toPositiveIntegerOctets(input) {
  let firstNonZero = 0;
  while (firstNonZero < input.length - 1 && input[firstNonZero] === 0) {
    firstNonZero++;
  }
  let serialNumber = input.slice(firstNonZero);
  if (!serialNumber.length) {
    serialNumber = new Uint8Array([0]);
  }
  if (serialNumber[0] > 127) {
    const newSerialNumber = new Uint8Array(serialNumber.length + 1);
    newSerialNumber[0] = 0;
    newSerialNumber.set(serialNumber, 1);
    serialNumber = newSerialNumber;
  }
  return serialNumber.buffer;
}
function normalizeCertificateSerialNumber(input) {
  return toPositiveIntegerOctets(import_pvtsutils.BufferSourceConverter.toUint8Array(import_pvtsutils.Convert.FromHex(input || "")));
}
function getCertificateSerialNumber(raw) {
  let serialNumber = import_pvtsutils.BufferSourceConverter.toUint8Array(raw);
  if (serialNumber.length > 1 && serialNumber[0] === 0 && serialNumber[1] > 127) {
    serialNumber = serialNumber.slice(1);
  }
  return import_pvtsutils.Convert.ToHex(serialNumber);
}
var _X509Certificate_tbs;
var _X509Certificate_serialNumber;
var _X509Certificate_subjectName;
var _X509Certificate_subject;
var _X509Certificate_issuerName;
var _X509Certificate_issuer;
var _X509Certificate_notBefore;
var _X509Certificate_notAfter;
var _X509Certificate_signatureAlgorithm;
var _X509Certificate_signature;
var _X509Certificate_extensions;
var _X509Certificate_publicKey;
var X509Certificate = class extends PemData {
  get publicKey() {
    if (!__classPrivateFieldGet(this, _X509Certificate_publicKey, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_publicKey, new PublicKey(this.asn.tbsCertificate.subjectPublicKeyInfo, this.parseOptions), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_publicKey, "f");
  }
  get serialNumber() {
    if (!__classPrivateFieldGet(this, _X509Certificate_serialNumber, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_serialNumber, getCertificateSerialNumber(this.asn.tbsCertificate.serialNumber), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_serialNumber, "f");
  }
  get subjectName() {
    if (!__classPrivateFieldGet(this, _X509Certificate_subjectName, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_subjectName, new Name3(this.asn.tbsCertificate.subject), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_subjectName, "f");
  }
  get subject() {
    if (!__classPrivateFieldGet(this, _X509Certificate_subject, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_subject, this.subjectName.toString(), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_subject, "f");
  }
  get issuerName() {
    if (!__classPrivateFieldGet(this, _X509Certificate_issuerName, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_issuerName, new Name3(this.asn.tbsCertificate.issuer), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_issuerName, "f");
  }
  get issuer() {
    if (!__classPrivateFieldGet(this, _X509Certificate_issuer, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_issuer, this.issuerName.toString(), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_issuer, "f");
  }
  get notBefore() {
    if (!__classPrivateFieldGet(this, _X509Certificate_notBefore, "f")) {
      const notBefore = this.asn.tbsCertificate.validity.notBefore.utcTime || this.asn.tbsCertificate.validity.notBefore.generalTime;
      if (!notBefore) {
        throw new Error("Cannot get 'notBefore' value");
      }
      __classPrivateFieldSet(this, _X509Certificate_notBefore, notBefore, "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_notBefore, "f");
  }
  get notAfter() {
    if (!__classPrivateFieldGet(this, _X509Certificate_notAfter, "f")) {
      const notAfter = this.asn.tbsCertificate.validity.notAfter.utcTime || this.asn.tbsCertificate.validity.notAfter.generalTime;
      if (!notAfter) {
        throw new Error("Cannot get 'notAfter' value");
      }
      __classPrivateFieldSet(this, _X509Certificate_notAfter, notAfter, "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_notAfter, "f");
  }
  get signatureAlgorithm() {
    if (!__classPrivateFieldGet(this, _X509Certificate_signatureAlgorithm, "f")) {
      const algProv = instance.resolve(diAlgorithmProvider);
      __classPrivateFieldSet(this, _X509Certificate_signatureAlgorithm, algProv.toWebAlgorithm(this.asn.signatureAlgorithm), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_signatureAlgorithm, "f");
  }
  get signature() {
    if (!__classPrivateFieldGet(this, _X509Certificate_signature, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_signature, this.asn.signatureValue, "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_signature, "f");
  }
  get extensions() {
    if (!__classPrivateFieldGet(this, _X509Certificate_extensions, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_extensions, [], "f");
      if (this.asn.tbsCertificate.extensions) {
        __classPrivateFieldSet(this, _X509Certificate_extensions, this.asn.tbsCertificate.extensions.map((o) => ExtensionFactory.create(AsnConvert.serialize(o), this.parseOptions)), "f");
      }
    }
    return __classPrivateFieldGet(this, _X509Certificate_extensions, "f");
  }
  get tbs() {
    if (!__classPrivateFieldGet(this, _X509Certificate_tbs, "f")) {
      __classPrivateFieldSet(this, _X509Certificate_tbs, this.asn.tbsCertificateRaw || AsnConvert.serialize(this.asn.tbsCertificate), "f");
    }
    return __classPrivateFieldGet(this, _X509Certificate_tbs, "f");
  }
  constructor(param, options) {
    const args = PemData.isAsnEncoded(param) ? [param, Certificate, options] : [param, options];
    super(args[0], args[1], args[2]);
    _X509Certificate_tbs.set(this, void 0);
    _X509Certificate_serialNumber.set(this, void 0);
    _X509Certificate_subjectName.set(this, void 0);
    _X509Certificate_subject.set(this, void 0);
    _X509Certificate_issuerName.set(this, void 0);
    _X509Certificate_issuer.set(this, void 0);
    _X509Certificate_notBefore.set(this, void 0);
    _X509Certificate_notAfter.set(this, void 0);
    _X509Certificate_signatureAlgorithm.set(this, void 0);
    _X509Certificate_signature.set(this, void 0);
    _X509Certificate_extensions.set(this, void 0);
    _X509Certificate_publicKey.set(this, void 0);
    this.tag = PemConverter.CertificateTag;
  }
  onInit(_asn) {
  }
  getExtension(type) {
    for (const ext of this.extensions) {
      if (typeof type === "string") {
        if (ext.type === type) {
          return ext;
        }
      } else {
        if (ext instanceof type) {
          return ext;
        }
      }
    }
    return null;
  }
  getExtensions(type) {
    return this.extensions.filter((o) => {
      if (typeof type === "string") {
        return o.type === type;
      } else {
        return o instanceof type;
      }
    });
  }
  async verify(params = {}, crypto2 = cryptoProvider.get()) {
    let keyAlgorithm;
    let publicKey;
    const paramsKey = params.publicKey;
    try {
      if (!paramsKey) {
        keyAlgorithm = {
          ...this.publicKey.algorithm,
          ...this.signatureAlgorithm
        };
        publicKey = await this.publicKey.export(keyAlgorithm, ["verify"], crypto2);
      } else if ("publicKey" in paramsKey) {
        keyAlgorithm = {
          ...paramsKey.publicKey.algorithm,
          ...this.signatureAlgorithm
        };
        publicKey = await paramsKey.publicKey.export(keyAlgorithm, ["verify"], crypto2);
      } else if (paramsKey instanceof PublicKey) {
        keyAlgorithm = {
          ...paramsKey.algorithm,
          ...this.signatureAlgorithm
        };
        publicKey = await paramsKey.export(keyAlgorithm, ["verify"], crypto2);
      } else if (import_pvtsutils.BufferSourceConverter.isBufferSource(paramsKey)) {
        const key = new PublicKey(paramsKey);
        keyAlgorithm = {
          ...key.algorithm,
          ...this.signatureAlgorithm
        };
        publicKey = await key.export(keyAlgorithm, ["verify"], crypto2);
      } else {
        keyAlgorithm = {
          ...paramsKey.algorithm,
          ...this.signatureAlgorithm
        };
        publicKey = paramsKey;
      }
    } catch {
      return false;
    }
    const signatureFormatters = instance.resolveAll(diAsnSignatureFormatter).reverse();
    let signature = null;
    for (const signatureFormatter of signatureFormatters) {
      signature = signatureFormatter.toWebSignature(keyAlgorithm, this.signature);
      if (signature) {
        break;
      }
    }
    if (!signature) {
      throw Error("Cannot convert ASN.1 signature value to WebCrypto format");
    }
    const ok = await crypto2.subtle.verify(this.signatureAlgorithm, publicKey, signature, this.tbs);
    if (params.signatureOnly) {
      return ok;
    } else {
      const date = params.date || /* @__PURE__ */ new Date();
      const time = date.getTime();
      return ok && this.notBefore.getTime() < time && time < this.notAfter.getTime();
    }
  }
  async getThumbprint(arg1, arg2) {
    let crypto2;
    let algorithm = "SHA-1";
    if (arg1) {
      if (typeof arg1 === "object" && "subtle" in arg1) {
        crypto2 = arg1;
      } else {
        algorithm = arg1;
        crypto2 = arg2;
      }
    }
    crypto2 !== null && crypto2 !== void 0 ? crypto2 : crypto2 = cryptoProvider.get();
    return await crypto2.subtle.digest(algorithm, this.rawData);
  }
  async isSelfSigned(crypto2 = cryptoProvider.get()) {
    return this.subject === this.issuer && await this.verify({ signatureOnly: true }, crypto2);
  }
  toTextObject() {
    const obj = this.toTextObjectEmpty();
    const cert = AsnConvert.parse(this.rawData, Certificate, this.parseOptions);
    const tbs = cert.tbsCertificate;
    const data = new TextObject("", {
      Version: `${Version[tbs.version]} (${tbs.version})`,
      "Serial Number": tbs.serialNumber,
      "Signature Algorithm": TextConverter.serializeAlgorithm(tbs.signature),
      Issuer: this.issuer,
      Validity: new TextObject("", {
        "Not Before": tbs.validity.notBefore.getTime(),
        "Not After": tbs.validity.notAfter.getTime()
      }),
      Subject: this.subject,
      "Subject Public Key Info": this.publicKey
    });
    if (tbs.issuerUniqueID) {
      data["Issuer Unique ID"] = tbs.issuerUniqueID;
    }
    if (tbs.subjectUniqueID) {
      data["Subject Unique ID"] = tbs.subjectUniqueID;
    }
    if (this.extensions.length) {
      const extensions = new TextObject("");
      for (const ext of this.extensions) {
        const extObj = ext.toTextObject();
        extensions[extObj[TextObject.NAME]] = extObj;
      }
      data["Extensions"] = extensions;
    }
    obj["Data"] = data;
    obj["Signature"] = new TextObject("", {
      Algorithm: TextConverter.serializeAlgorithm(cert.signatureAlgorithm),
      "": cert.signatureValue
    });
    return obj;
  }
};
_X509Certificate_tbs = /* @__PURE__ */ new WeakMap(), _X509Certificate_serialNumber = /* @__PURE__ */ new WeakMap(), _X509Certificate_subjectName = /* @__PURE__ */ new WeakMap(), _X509Certificate_subject = /* @__PURE__ */ new WeakMap(), _X509Certificate_issuerName = /* @__PURE__ */ new WeakMap(), _X509Certificate_issuer = /* @__PURE__ */ new WeakMap(), _X509Certificate_notBefore = /* @__PURE__ */ new WeakMap(), _X509Certificate_notAfter = /* @__PURE__ */ new WeakMap(), _X509Certificate_signatureAlgorithm = /* @__PURE__ */ new WeakMap(), _X509Certificate_signature = /* @__PURE__ */ new WeakMap(), _X509Certificate_extensions = /* @__PURE__ */ new WeakMap(), _X509Certificate_publicKey = /* @__PURE__ */ new WeakMap();
X509Certificate.NAME = "Certificate";
var _X509Certificates_options;
var X509Certificates = class extends Array {
  constructor(param, options) {
    super();
    _X509Certificates_options.set(this, void 0);
    if (PemData.isAsnEncoded(param)) {
      this.import(param, options);
    } else if (param instanceof X509Certificate) {
      this.push(param);
    } else if (Array.isArray(param)) {
      for (const item of param) {
        this.push(item);
      }
    }
  }
  export(format4) {
    const signedData = new SignedData();
    signedData.version = 1;
    signedData.encapContentInfo.eContentType = id_data;
    signedData.encapContentInfo.eContent = new EncapsulatedContent({
      single: new OctetString2()
    });
    signedData.certificates = new CertificateSet(this.map((o) => new CertificateChoices({
      certificate: AsnConvert.parse(o.rawData, Certificate, __classPrivateFieldGet(this, _X509Certificates_options, "f"))
    })));
    const cms = new ContentInfo({
      contentType: id_signedData,
      content: AsnConvert.serialize(signedData)
    });
    const raw = AsnConvert.serialize(cms);
    if (format4 === "raw") {
      return raw;
    }
    return this.toString(format4);
  }
  import(data, options) {
    const raw = PemData.toArrayBuffer(data);
    const cms = AsnConvert.parse(raw, ContentInfo, options);
    if (cms.contentType !== id_signedData) {
      throw new TypeError("Cannot parse CMS package. Incoming data is not a SignedData object.");
    }
    const signedData = AsnConvert.parse(cms.content, SignedData, options);
    const certificates = [];
    for (const item of signedData.certificates || []) {
      if (item.certificate) {
        certificates.push(new X509Certificate(item.certificate, options));
      }
    }
    this.clear();
    for (const certificate of certificates) {
      this.push(certificate);
    }
    __classPrivateFieldSet(this, _X509Certificates_options, options, "f");
  }
  clear() {
    while (this.pop()) {
    }
  }
  toString(format4 = "pem") {
    const raw = this.export("raw");
    switch (format4) {
      case "pem":
        return PemConverter.encode(raw, "CMS");
      case "pem-chain":
        return this.map((o) => o.toString("pem")).join("\n");
      case "asn":
        return AsnConvert.toString(raw, __classPrivateFieldGet(this, _X509Certificates_options, "f"));
      case "hex":
        return import_pvtsutils.Convert.ToHex(raw);
      case "base64":
        return import_pvtsutils.Convert.ToBase64(raw);
      case "base64url":
        return import_pvtsutils.Convert.ToBase64Url(raw);
      case "text":
        return TextConverter.serialize(this.toTextObject());
      default:
        throw TypeError("Argument 'format' is unsupported value");
    }
  }
  toTextObject() {
    const contentInfo = AsnConvert.parse(this.export("raw"), ContentInfo, __classPrivateFieldGet(this, _X509Certificates_options, "f"));
    const signedData = AsnConvert.parse(contentInfo.content, SignedData, __classPrivateFieldGet(this, _X509Certificates_options, "f"));
    const obj = new TextObject("X509Certificates", {
      "Content Type": OidSerializer.toString(contentInfo.contentType),
      Content: new TextObject("", {
        Version: `${CMSVersion[signedData.version]} (${signedData.version})`,
        Certificates: new TextObject("", { Certificate: this.map((o) => o.toTextObject()) })
      })
    });
    return obj;
  }
};
_X509Certificates_options = /* @__PURE__ */ new WeakMap();
var X509ChainBuilder = class {
  constructor(params = {}) {
    this.certificates = [];
    if (params.certificates) {
      this.certificates = params.certificates;
    }
  }
  async build(cert, crypto2 = cryptoProvider.get()) {
    const chain = new X509Certificates(cert);
    let current = cert;
    while (current = await this.findIssuer(current, crypto2)) {
      const thumbprint = await current.getThumbprint(crypto2);
      for (const item of chain) {
        const thumbprint2 = await item.getThumbprint(crypto2);
        if ((0, import_pvtsutils.isEqual)(thumbprint, thumbprint2)) {
          throw new Error("Cannot build a certificate chain. Circular dependency.");
        }
      }
      chain.push(current);
    }
    return chain;
  }
  async findIssuer(cert, crypto2 = cryptoProvider.get()) {
    if (!await cert.isSelfSigned(crypto2)) {
      const akiExt = cert.getExtension(id_ce_authorityKeyIdentifier);
      for (const item of this.certificates) {
        if (item.subject !== cert.issuer) {
          continue;
        }
        if (akiExt) {
          if (akiExt.keyId) {
            const skiExt = item.getExtension(id_ce_subjectKeyIdentifier);
            if (skiExt && skiExt.keyId !== akiExt.keyId) {
              continue;
            }
          } else if (akiExt.certId) {
            const sanExt = item.getExtension(id_ce_subjectAltName);
            if (sanExt && !(akiExt.certId.serialNumber === item.serialNumber && (0, import_pvtsutils.isEqual)(AsnConvert.serialize(akiExt.certId.name), AsnConvert.serialize(sanExt)))) {
              continue;
            }
          }
        }
        try {
          const algorithm = {
            ...item.publicKey.algorithm,
            ...cert.signatureAlgorithm
          };
          const publicKey = await item.publicKey.export(algorithm, ["verify"], crypto2);
          const ok = await cert.verify({
            publicKey,
            signatureOnly: true
          }, crypto2);
          if (!ok) {
            continue;
          }
        } catch {
          continue;
        }
        return item;
      }
    }
    return null;
  }
};
var _X509CrlEntry_serialNumber;
var _X509CrlEntry_revocationDate;
var _X509CrlEntry_reason;
var _X509CrlEntry_invalidity;
var _X509CrlEntry_extensions;
var X509CrlReason;
(function(X509CrlReason2) {
  X509CrlReason2[X509CrlReason2["unspecified"] = 0] = "unspecified";
  X509CrlReason2[X509CrlReason2["keyCompromise"] = 1] = "keyCompromise";
  X509CrlReason2[X509CrlReason2["cACompromise"] = 2] = "cACompromise";
  X509CrlReason2[X509CrlReason2["affiliationChanged"] = 3] = "affiliationChanged";
  X509CrlReason2[X509CrlReason2["superseded"] = 4] = "superseded";
  X509CrlReason2[X509CrlReason2["cessationOfOperation"] = 5] = "cessationOfOperation";
  X509CrlReason2[X509CrlReason2["certificateHold"] = 6] = "certificateHold";
  X509CrlReason2[X509CrlReason2["removeFromCRL"] = 8] = "removeFromCRL";
  X509CrlReason2[X509CrlReason2["privilegeWithdrawn"] = 9] = "privilegeWithdrawn";
  X509CrlReason2[X509CrlReason2["aACompromise"] = 10] = "aACompromise";
})(X509CrlReason || (X509CrlReason = {}));
var X509CrlEntry = class extends AsnData {
  get serialNumber() {
    if (!__classPrivateFieldGet(this, _X509CrlEntry_serialNumber, "f")) {
      __classPrivateFieldSet(this, _X509CrlEntry_serialNumber, getCertificateSerialNumber(this.asn.userCertificate), "f");
    }
    return __classPrivateFieldGet(this, _X509CrlEntry_serialNumber, "f");
  }
  get revocationDate() {
    if (!__classPrivateFieldGet(this, _X509CrlEntry_revocationDate, "f")) {
      __classPrivateFieldSet(this, _X509CrlEntry_revocationDate, this.asn.revocationDate.getTime(), "f");
    }
    return __classPrivateFieldGet(this, _X509CrlEntry_revocationDate, "f");
  }
  get reason() {
    if (__classPrivateFieldGet(this, _X509CrlEntry_reason, "f") === void 0) {
      void this.extensions;
    }
    return __classPrivateFieldGet(this, _X509CrlEntry_reason, "f");
  }
  get invalidity() {
    if (__classPrivateFieldGet(this, _X509CrlEntry_invalidity, "f") === void 0) {
      void this.extensions;
    }
    return __classPrivateFieldGet(this, _X509CrlEntry_invalidity, "f");
  }
  get extensions() {
    if (!__classPrivateFieldGet(this, _X509CrlEntry_extensions, "f")) {
      __classPrivateFieldSet(this, _X509CrlEntry_extensions, [], "f");
      if (this.asn.crlEntryExtensions) {
        __classPrivateFieldSet(this, _X509CrlEntry_extensions, this.asn.crlEntryExtensions.map((o) => {
          const extension = ExtensionFactory.create(AsnConvert.serialize(o), this.parseOptions);
          switch (extension.type) {
            case id_ce_cRLReasons:
              if (__classPrivateFieldGet(this, _X509CrlEntry_reason, "f") === void 0) {
                __classPrivateFieldSet(this, _X509CrlEntry_reason, AsnConvert.parse(extension.value, CRLReason, this.parseOptions).reason, "f");
              }
              break;
            case id_ce_invalidityDate:
              if (__classPrivateFieldGet(this, _X509CrlEntry_invalidity, "f") === void 0) {
                __classPrivateFieldSet(this, _X509CrlEntry_invalidity, AsnConvert.parse(extension.value, InvalidityDate, this.parseOptions).value, "f");
              }
              break;
          }
          return extension;
        }), "f");
      }
    }
    return __classPrivateFieldGet(this, _X509CrlEntry_extensions, "f");
  }
  constructor(...args) {
    let raw;
    let options;
    if (import_pvtsutils.BufferSourceConverter.isBufferSource(args[0])) {
      raw = import_pvtsutils.BufferSourceConverter.toArrayBuffer(args[0]);
      options = args[1];
    } else if (typeof args[0] === "string") {
      raw = AsnConvert.serialize(new RevokedCertificate({
        userCertificate: normalizeCertificateSerialNumber(args[0]),
        revocationDate: new Time(args[1]),
        crlEntryExtensions: args[2]
      }));
    } else if (args[0] instanceof RevokedCertificate) {
      raw = args[0];
      options = args[1];
    }
    if (!raw) {
      throw new TypeError("Cannot create X509CrlEntry instance. Wrong constructor arguments.");
    }
    const superArgs = raw instanceof RevokedCertificate ? [raw, options] : [raw, RevokedCertificate, options];
    super(superArgs[0], superArgs[1], superArgs[2]);
    _X509CrlEntry_serialNumber.set(this, void 0);
    _X509CrlEntry_revocationDate.set(this, void 0);
    _X509CrlEntry_reason.set(this, void 0);
    _X509CrlEntry_invalidity.set(this, void 0);
    _X509CrlEntry_extensions.set(this, void 0);
  }
  onInit(_asn) {
  }
};
_X509CrlEntry_serialNumber = /* @__PURE__ */ new WeakMap(), _X509CrlEntry_revocationDate = /* @__PURE__ */ new WeakMap(), _X509CrlEntry_reason = /* @__PURE__ */ new WeakMap(), _X509CrlEntry_invalidity = /* @__PURE__ */ new WeakMap(), _X509CrlEntry_extensions = /* @__PURE__ */ new WeakMap();
var _X509Crl_tbs;
var _X509Crl_signatureAlgorithm;
var _X509Crl_issuerName;
var _X509Crl_thisUpdate;
var _X509Crl_nextUpdate;
var _X509Crl_entries;
var _X509Crl_extensions;
var X509Crl = class extends PemData {
  get version() {
    return this.asn.tbsCertList.version;
  }
  get signatureAlgorithm() {
    if (!__classPrivateFieldGet(this, _X509Crl_signatureAlgorithm, "f")) {
      const algProv = instance.resolve(diAlgorithmProvider);
      __classPrivateFieldSet(this, _X509Crl_signatureAlgorithm, algProv.toWebAlgorithm(this.asn.signatureAlgorithm), "f");
    }
    return __classPrivateFieldGet(this, _X509Crl_signatureAlgorithm, "f");
  }
  get signature() {
    return this.asn.signature;
  }
  get issuer() {
    return this.issuerName.toString();
  }
  get issuerName() {
    if (!__classPrivateFieldGet(this, _X509Crl_issuerName, "f")) {
      __classPrivateFieldSet(this, _X509Crl_issuerName, new Name3(this.asn.tbsCertList.issuer), "f");
    }
    return __classPrivateFieldGet(this, _X509Crl_issuerName, "f");
  }
  get thisUpdate() {
    if (!__classPrivateFieldGet(this, _X509Crl_thisUpdate, "f")) {
      const thisUpdate = this.asn.tbsCertList.thisUpdate.getTime();
      if (!thisUpdate) {
        throw new Error("Cannot get 'thisUpdate' value");
      }
      __classPrivateFieldSet(this, _X509Crl_thisUpdate, thisUpdate, "f");
    }
    return __classPrivateFieldGet(this, _X509Crl_thisUpdate, "f");
  }
  get nextUpdate() {
    var _a3;
    if (__classPrivateFieldGet(this, _X509Crl_nextUpdate, "f") === void 0) {
      __classPrivateFieldSet(this, _X509Crl_nextUpdate, ((_a3 = this.asn.tbsCertList.nextUpdate) === null || _a3 === void 0 ? void 0 : _a3.getTime()) || void 0, "f");
    }
    return __classPrivateFieldGet(this, _X509Crl_nextUpdate, "f");
  }
  get entries() {
    var _a3;
    if (!__classPrivateFieldGet(this, _X509Crl_entries, "f")) {
      __classPrivateFieldSet(this, _X509Crl_entries, ((_a3 = this.asn.tbsCertList.revokedCertificates) === null || _a3 === void 0 ? void 0 : _a3.map((o) => new X509CrlEntry(o, this.parseOptions))) || [], "f");
    }
    return __classPrivateFieldGet(this, _X509Crl_entries, "f");
  }
  get extensions() {
    if (!__classPrivateFieldGet(this, _X509Crl_extensions, "f")) {
      __classPrivateFieldSet(this, _X509Crl_extensions, [], "f");
      if (this.asn.tbsCertList.crlExtensions) {
        __classPrivateFieldSet(this, _X509Crl_extensions, this.asn.tbsCertList.crlExtensions.map((o) => ExtensionFactory.create(AsnConvert.serialize(o), this.parseOptions)), "f");
      }
    }
    return __classPrivateFieldGet(this, _X509Crl_extensions, "f");
  }
  get tbs() {
    if (!__classPrivateFieldGet(this, _X509Crl_tbs, "f")) {
      __classPrivateFieldSet(this, _X509Crl_tbs, this.asn.tbsCertListRaw || AsnConvert.serialize(this.asn.tbsCertList), "f");
    }
    return __classPrivateFieldGet(this, _X509Crl_tbs, "f");
  }
  get tbsCertListSignatureAlgorithm() {
    return this.asn.tbsCertList.signature;
  }
  get certListSignatureAlgorithm() {
    return this.asn.signatureAlgorithm;
  }
  constructor(param, options) {
    const args = PemData.isAsnEncoded(param) ? [param, CertificateList, options] : [param, options];
    super(args[0], args[1], args[2]);
    this.tag = PemConverter.CrlTag;
    _X509Crl_tbs.set(this, void 0);
    _X509Crl_signatureAlgorithm.set(this, void 0);
    _X509Crl_issuerName.set(this, void 0);
    _X509Crl_thisUpdate.set(this, void 0);
    _X509Crl_nextUpdate.set(this, void 0);
    _X509Crl_entries.set(this, void 0);
    _X509Crl_extensions.set(this, void 0);
  }
  onInit(_asn) {
  }
  getExtension(type) {
    for (const ext of this.extensions) {
      if (typeof type === "string") {
        if (ext.type === type) {
          return ext;
        }
      } else {
        if (ext instanceof type) {
          return ext;
        }
      }
    }
    return null;
  }
  getExtensions(type) {
    return this.extensions.filter((o) => {
      if (typeof type === "string") {
        return o.type === type;
      } else {
        return o instanceof type;
      }
    });
  }
  async verify(params, crypto2 = cryptoProvider.get()) {
    if (!this.certListSignatureAlgorithm.isEqual(this.tbsCertListSignatureAlgorithm)) {
      throw new Error("algorithm identifier in the sequence tbsCertList and CertificateList mismatch");
    }
    let keyAlgorithm;
    let publicKey;
    const paramsKey = params.publicKey;
    try {
      if (paramsKey instanceof X509Certificate) {
        keyAlgorithm = {
          ...paramsKey.publicKey.algorithm,
          ...paramsKey.signatureAlgorithm
        };
        publicKey = await paramsKey.publicKey.export(keyAlgorithm, ["verify"]);
      } else if (paramsKey instanceof PublicKey) {
        keyAlgorithm = {
          ...paramsKey.algorithm,
          ...this.signatureAlgorithm
        };
        publicKey = await paramsKey.export(keyAlgorithm, ["verify"]);
      } else {
        keyAlgorithm = {
          ...paramsKey.algorithm,
          ...this.signatureAlgorithm
        };
        publicKey = paramsKey;
      }
    } catch {
      return false;
    }
    const signatureFormatters = instance.resolveAll(diAsnSignatureFormatter).reverse();
    let signature = null;
    for (const signatureFormatter of signatureFormatters) {
      signature = signatureFormatter.toWebSignature(keyAlgorithm, this.signature);
      if (signature) {
        break;
      }
    }
    if (!signature) {
      throw Error("Cannot convert ASN.1 signature value to WebCrypto format");
    }
    return await crypto2.subtle.verify(this.signatureAlgorithm, publicKey, signature, this.tbs);
  }
  async getThumbprint(arg1, arg2) {
    let crypto2;
    let algorithm = "SHA-1";
    if (arg1) {
      if (typeof arg1 === "object" && "subtle" in arg1) {
        crypto2 = arg1;
      } else {
        algorithm = arg1;
        crypto2 = arg2;
      }
    }
    crypto2 !== null && crypto2 !== void 0 ? crypto2 : crypto2 = cryptoProvider.get();
    return await crypto2.subtle.digest(algorithm, this.rawData);
  }
  findRevoked(certOrSerialNumber) {
    const serialNumber = typeof certOrSerialNumber === "string" ? certOrSerialNumber : certOrSerialNumber.serialNumber;
    const serialBuffer = normalizeCertificateSerialNumber(serialNumber);
    for (const revoked of this.asn.tbsCertList.revokedCertificates || []) {
      if (import_pvtsutils.BufferSourceConverter.isEqual(revoked.userCertificate, serialBuffer)) {
        return new X509CrlEntry(AsnConvert.serialize(revoked), this.parseOptions);
      }
    }
    return null;
  }
};
_X509Crl_tbs = /* @__PURE__ */ new WeakMap(), _X509Crl_signatureAlgorithm = /* @__PURE__ */ new WeakMap(), _X509Crl_issuerName = /* @__PURE__ */ new WeakMap(), _X509Crl_thisUpdate = /* @__PURE__ */ new WeakMap(), _X509Crl_nextUpdate = /* @__PURE__ */ new WeakMap(), _X509Crl_entries = /* @__PURE__ */ new WeakMap(), _X509Crl_extensions = /* @__PURE__ */ new WeakMap();
ExtensionFactory.register(id_ce_basicConstraints, BasicConstraintsExtension);
ExtensionFactory.register(id_ce_extKeyUsage, ExtendedKeyUsageExtension);
ExtensionFactory.register(id_ce_keyUsage, KeyUsagesExtension);
ExtensionFactory.register(id_ce_subjectKeyIdentifier, SubjectKeyIdentifierExtension);
ExtensionFactory.register(id_ce_authorityKeyIdentifier, AuthorityKeyIdentifierExtension);
ExtensionFactory.register(id_ce_subjectAltName, SubjectAlternativeNameExtension);
ExtensionFactory.register(id_ce_cRLDistributionPoints, CRLDistributionPointsExtension);
ExtensionFactory.register(id_pe_authorityInfoAccess, AuthorityInfoAccessExtension);
ExtensionFactory.register(id_ce_issuerAltName, IssuerAlternativeNameExtension);
AttributeFactory.register(id_pkcs9_at_challengePassword, ChallengePasswordAttribute);
AttributeFactory.register(id_pkcs9_at_extensionRequest, ExtensionsAttribute);
instance.registerSingleton(diAsnSignatureFormatter, AsnDefaultSignatureFormatter);
instance.registerSingleton(diAsnSignatureFormatter, AsnEcSignatureFormatter);
AsnEcSignatureFormatter.namedCurveSize.set("P-256", 32);
AsnEcSignatureFormatter.namedCurveSize.set("K-256", 32);
AsnEcSignatureFormatter.namedCurveSize.set("P-384", 48);
AsnEcSignatureFormatter.namedCurveSize.set("P-521", 66);

// node_modules/@simplewebauthn/server/esm/helpers/fetch.js
function fetch2(url) {
  return _fetchInternals.stubThis(url);
}
var _fetchInternals = {
  stubThis: (url) => globalThis.fetch(url)
};

// node_modules/@simplewebauthn/server/esm/helpers/isCertRevoked.js
var cacheRevokedCerts = {};
async function isCertRevoked(cert) {
  const { extensions } = cert;
  if (!extensions) {
    return false;
  }
  let extAuthorityKeyID;
  let extSubjectKeyID;
  let extCRLDistributionPoints;
  extensions.forEach((ext) => {
    if (ext instanceof AuthorityKeyIdentifierExtension) {
      extAuthorityKeyID = ext;
    } else if (ext instanceof SubjectKeyIdentifierExtension) {
      extSubjectKeyID = ext;
    } else if (ext instanceof CRLDistributionPointsExtension) {
      extCRLDistributionPoints = ext;
    }
  });
  let keyIdentifier = void 0;
  if (extAuthorityKeyID && extAuthorityKeyID.keyId) {
    keyIdentifier = extAuthorityKeyID.keyId;
  } else if (extSubjectKeyID) {
    keyIdentifier = extSubjectKeyID.keyId;
  }
  if (keyIdentifier) {
    const cached = cacheRevokedCerts[keyIdentifier];
    if (cached) {
      const now = /* @__PURE__ */ new Date();
      if (!cached.nextUpdate || cached.nextUpdate > now) {
        return cached.revokedCerts.indexOf(cert.serialNumber) >= 0;
      }
    }
  }
  const crlURL = extCRLDistributionPoints?.distributionPoints?.[0].distributionPoint?.fullName?.[0].uniformResourceIdentifier;
  if (!crlURL) {
    return false;
  }
  let certListBytes;
  try {
    const respCRL = await fetch2(crlURL);
    certListBytes = await respCRL.arrayBuffer();
  } catch (_err) {
    return false;
  }
  let data;
  try {
    data = new X509Crl(certListBytes);
  } catch (_err) {
    return false;
  }
  const newCached = {
    revokedCerts: [],
    nextUpdate: void 0
  };
  if (data.nextUpdate) {
    newCached.nextUpdate = data.nextUpdate;
  }
  const revokedCerts = data.entries;
  if (revokedCerts) {
    for (const cert2 of revokedCerts) {
      const revokedHex = cert2.serialNumber;
      newCached.revokedCerts.push(revokedHex);
    }
    if (keyIdentifier) {
      cacheRevokedCerts[keyIdentifier] = newCached;
    }
    return newCached.revokedCerts.indexOf(cert.serialNumber) >= 0;
  }
  return false;
}

// node_modules/@simplewebauthn/server/esm/helpers/decodeAuthenticatorExtensions.js
function decodeAuthenticatorExtensions(extensionData) {
  let toCBOR;
  try {
    toCBOR = isoCBOR_exports.decodeFirst(extensionData);
  } catch (err) {
    const _err = err;
    throw new Error(`Error decoding authenticator extensions: ${_err.message}`);
  }
  return convertMapToObjectDeep(toCBOR);
}
function convertMapToObjectDeep(input) {
  const mapped = {};
  for (const [key, value] of input) {
    if (value instanceof Map) {
      mapped[key] = convertMapToObjectDeep(value);
    } else {
      mapped[key] = value;
    }
  }
  return mapped;
}

// node_modules/@simplewebauthn/server/esm/helpers/parseAuthenticatorData.js
function parseAuthenticatorData(authData) {
  if (authData.byteLength < 37) {
    throw new Error(`Authenticator data was ${authData.byteLength} bytes, expected at least 37 bytes`);
  }
  let pointer = 0;
  const dataView = isoUint8Array_exports.toDataView(authData);
  const rpIdHash = authData.slice(pointer, pointer += 32);
  const flagsBuf = authData.slice(pointer, pointer += 1);
  const flagsInt = flagsBuf[0];
  const flags = {
    up: !!(flagsInt & 1 << 0),
    // User Presence
    uv: !!(flagsInt & 1 << 2),
    // User Verified
    be: !!(flagsInt & 1 << 3),
    // Backup Eligibility
    bs: !!(flagsInt & 1 << 4),
    // Backup State
    at: !!(flagsInt & 1 << 6),
    // Attested Credential Data Present
    ed: !!(flagsInt & 1 << 7),
    // Extension Data Present
    flagsInt
  };
  const counterBuf = authData.slice(pointer, pointer + 4);
  const counter = dataView.getUint32(pointer, false);
  pointer += 4;
  let aaguid = void 0;
  let credentialID = void 0;
  let credentialPublicKey = void 0;
  if (flags.at) {
    aaguid = authData.slice(pointer, pointer += 16);
    const credIDLen = dataView.getUint16(pointer);
    pointer += 2;
    credentialID = authData.slice(pointer, pointer += credIDLen);
    const badEdDSACBOR = isoUint8Array_exports.fromHex("a301634f4b500327206745643235353139");
    const bytesAtCurrentPosition = authData.slice(pointer, pointer + badEdDSACBOR.byteLength);
    let foundBadCBOR = false;
    if (isoUint8Array_exports.areEqual(badEdDSACBOR, bytesAtCurrentPosition)) {
      foundBadCBOR = true;
      authData[pointer] = 164;
    }
    const firstDecoded = isoCBOR_exports.decodeFirst(authData.slice(pointer));
    const firstEncoded = Uint8Array.from(
      /**
       * Casting to `Map` via `as unknown` here because TS doesn't make it possible to define Maps
       * with discrete keys and properties with known types per pair, and CBOR libs typically parse
       * CBOR Major Type 5 to `Map` because you can have numbers for keys. A `COSEPublicKey` can be
       * generalized as "a Map with numbers for keys and either numbers or bytes for values" though.
       * If this presumption falls apart then other parts of verification later on will fail so we
       * should be safe doing this here.
       */
      isoCBOR_exports.encode(firstDecoded)
    );
    if (foundBadCBOR) {
      authData[pointer] = 163;
    }
    credentialPublicKey = firstEncoded;
    pointer += firstEncoded.byteLength;
  }
  let extensionsData = void 0;
  let extensionsDataBuffer = void 0;
  if (flags.ed) {
    const firstDecoded = isoCBOR_exports.decodeFirst(authData.slice(pointer));
    extensionsDataBuffer = Uint8Array.from(isoCBOR_exports.encode(firstDecoded));
    extensionsData = decodeAuthenticatorExtensions(extensionsDataBuffer);
    pointer += extensionsDataBuffer.byteLength;
  }
  if (authData.byteLength > pointer) {
    throw new Error("Leftover bytes detected while parsing authenticator data");
  }
  return _parseAuthenticatorDataInternals.stubThis({
    rpIdHash,
    flagsBuf,
    flags,
    counter,
    counterBuf,
    aaguid,
    credentialID,
    credentialPublicKey,
    extensionsData,
    extensionsDataBuffer
  });
}
var _parseAuthenticatorDataInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/server/esm/helpers/toHash.js
function toHash(data, algorithm = -7) {
  if (typeof data === "string") {
    data = isoUint8Array_exports.fromUTF8String(data);
  }
  const digest2 = isoCrypto_exports.digest(data, algorithm);
  return digest2;
}

// node_modules/@simplewebauthn/server/esm/helpers/validateCertificatePath.js
var import_reflect_metadata2 = __toESM(require_Reflect(), 1);
async function validateCertificatePath(x5cCertsPEM, trustAnchorsPEM = []) {
  if (trustAnchorsPEM.length === 0) {
    return true;
  }
  const x5cCertsParsed = x5cCertsPEM.map((certPEM) => new X509Certificate(certPEM));
  for (let i = 0; i < x5cCertsParsed.length; i++) {
    const cert = x5cCertsParsed[i];
    const certPEM = x5cCertsPEM[i];
    try {
      await assertCertNotRevoked(cert);
    } catch (_err) {
      throw new Error(`Found revoked certificate in x5c:
${certPEM}`);
    }
    try {
      assertCertIsWithinValidTimeWindow(cert.notBefore, cert.notAfter);
    } catch (_err) {
      throw new Error(`Found certificate out of validity period in x5c:
${certPEM}`);
    }
  }
  const trustAnchorsParsed = trustAnchorsPEM.map((certPEM) => {
    try {
      return new X509Certificate(certPEM);
    } catch (err) {
      const _err = err;
      throw new Error(`Could not parse trust anchor certificate:
${certPEM}`, { cause: _err });
    }
  });
  const validTrustAnchors = [];
  for (let i = 0; i < trustAnchorsParsed.length; i++) {
    const cert = trustAnchorsParsed[i];
    try {
      await assertCertNotRevoked(cert);
    } catch (_err) {
      continue;
    }
    try {
      assertCertIsWithinValidTimeWindow(cert.notBefore, cert.notAfter);
    } catch (_err) {
      continue;
    }
    validTrustAnchors.push(cert);
  }
  if (validTrustAnchors.length === 0) {
    throw new Error("No specified trust anchor was valid for verifying x5c");
  }
  let invalidCertificateChain = true;
  for (const anchor of validTrustAnchors) {
    try {
      const x5cWithTrustAnchor = x5cCertsParsed.concat([anchor]);
      const numUniqueCerts = new Set(x5cWithTrustAnchor.map((cert) => cert.toString("pem"))).size;
      if (numUniqueCerts !== x5cWithTrustAnchor.length) {
        throw new Error("Invalid certificate path: found duplicate certificates");
      }
      const x5cLeafCert = x5cCertsParsed[0];
      let x5cIntermediates = [];
      if (x5cCertsParsed.length > 1) {
        x5cIntermediates = x5cCertsParsed.slice(1);
      }
      const chainBuilder = new X509ChainBuilder({ certificates: [...x5cIntermediates, anchor] });
      const chain = await chainBuilder.build(x5cLeafCert);
      const lastCert = chain[chain.length - 1];
      const lastCertEqualsAnchor = lastCert.equal(anchor);
      let certBeforeLastSignedByAnchor = false;
      if (!lastCertEqualsAnchor && chain.length > 1) {
        const certBeforeLast = chain[chain.length - 2];
        certBeforeLastSignedByAnchor = await certBeforeLast.verify({
          publicKey: anchor.publicKey,
          signatureOnly: true
        });
      }
      const chainReachesAnchor = lastCertEqualsAnchor || certBeforeLastSignedByAnchor;
      if (!chainReachesAnchor) {
        continue;
      }
      invalidCertificateChain = false;
      break;
    } catch (err) {
      throw new Error("Unexpected error while validating certificate path", { cause: err });
    }
  }
  if (invalidCertificateChain) {
    throw new InvalidCertificatePath();
  }
  return true;
}
async function assertCertNotRevoked(certificate) {
  const subjectCertRevoked = await isCertRevoked(certificate);
  if (subjectCertRevoked) {
    throw new Error("Found revoked certificate in certificate path");
  }
}
function assertCertIsWithinValidTimeWindow(certNotBefore, certNotAfter) {
  const now = new Date(Date.now());
  if (certNotBefore > now || certNotAfter < now) {
    throw new Error("Certificate is not yet valid or expired");
  }
}
var InvalidCertificatePath = class extends Error {
  constructor() {
    const message = "x5c could not be chained to any specified trust anchor";
    super(message);
    this.name = "InvalidX5CChain";
  }
};

// node_modules/@simplewebauthn/server/esm/helpers/mapX509SignatureAlgToCOSEAlg.js
function mapX509SignatureAlgToCOSEAlg(signatureAlgorithm) {
  let alg;
  if (signatureAlgorithm === id_ecdsaWithSHA256) {
    alg = COSEALG.ES256;
  } else if (signatureAlgorithm === id_ecdsaWithSHA384) {
    alg = COSEALG.ES384;
  } else if (signatureAlgorithm === id_ecdsaWithSHA512) {
    alg = COSEALG.ES512;
  } else if (signatureAlgorithm === id_sha256WithRSAEncryption) {
    alg = COSEALG.RS256;
  } else if (signatureAlgorithm === id_sha384WithRSAEncryption) {
    alg = COSEALG.RS384;
  } else if (signatureAlgorithm === id_sha512WithRSAEncryption) {
    alg = COSEALG.RS512;
  } else if (signatureAlgorithm === id_sha1WithRSAEncryption) {
    alg = COSEALG.RS1;
  } else if (signatureAlgorithm === id_ml_dsa_44) {
    alg = COSEALG.ML_DSA_44;
  } else if (signatureAlgorithm === id_ml_dsa_65) {
    alg = COSEALG.ML_DSA_65;
  } else if (signatureAlgorithm === id_ml_dsa_87) {
    alg = COSEALG.ML_DSA_87;
  } else {
    throw new Error(`Unable to map X.509 signature algorithm ${signatureAlgorithm} to a COSE algorithm`);
  }
  return alg;
}

// node_modules/@simplewebauthn/server/esm/helpers/convertX509PublicKeyToCOSE.js
function convertX509PublicKeyToCOSE(x509Certificate) {
  let cosePublicKey = /* @__PURE__ */ new Map();
  const x509 = AsnParser.parse(x509Certificate, Certificate);
  const { tbsCertificate } = x509;
  const { subjectPublicKeyInfo } = tbsCertificate;
  const publicKeyAlgorithmID = subjectPublicKeyInfo.algorithm.algorithm;
  if (publicKeyAlgorithmID === id_ecPublicKey) {
    if (!subjectPublicKeyInfo.algorithm.parameters) {
      throw new Error("Certificate public key was missing parameters (EC2)");
    }
    const ecParameters = AsnParser.parse(new Uint8Array(subjectPublicKeyInfo.algorithm.parameters), ECParameters);
    let alg;
    let crv;
    const { namedCurve } = ecParameters;
    if (namedCurve === id_secp256r1) {
      alg = COSEALG.ES256;
      crv = COSECRV.P256;
    } else if (namedCurve === id_secp384r1) {
      alg = COSEALG.ES384;
      crv = COSECRV.P384;
    } else {
      throw new Error(`Certificate public key contained unexpected namedCurve ${namedCurve} (EC2)`);
    }
    const subjectPublicKey = new Uint8Array(subjectPublicKeyInfo.subjectPublicKey);
    let x;
    let y;
    if (subjectPublicKey[0] === 4) {
      let pointer = 1;
      const halfLength = (subjectPublicKey.length - 1) / 2;
      x = subjectPublicKey.slice(pointer, pointer += halfLength);
      y = subjectPublicKey.slice(pointer);
    } else {
      throw new Error('TODO: Figure out how to handle public keys in "compressed form"');
    }
    const coseEC2PubKey = /* @__PURE__ */ new Map();
    coseEC2PubKey.set(COSEKEYS.kty, COSEKTY.EC2);
    coseEC2PubKey.set(COSEKEYS.alg, alg);
    coseEC2PubKey.set(COSEKEYS.crv, crv);
    coseEC2PubKey.set(COSEKEYS.x, x);
    coseEC2PubKey.set(COSEKEYS.y, y);
    cosePublicKey = coseEC2PubKey;
  } else if (publicKeyAlgorithmID === id_rsaEncryption) {
    const rsaPublicKey = AsnParser.parse(subjectPublicKeyInfo.subjectPublicKey, RSAPublicKey);
    const coseRSAPubKey = /* @__PURE__ */ new Map();
    coseRSAPubKey.set(COSEKEYS.kty, COSEKTY.RSA);
    coseRSAPubKey.set(COSEKEYS.alg, COSEALG.RS256);
    coseRSAPubKey.set(COSEKEYS.n, new Uint8Array(rsaPublicKey.modulus));
    coseRSAPubKey.set(COSEKEYS.e, new Uint8Array(rsaPublicKey.publicExponent));
    cosePublicKey = coseRSAPubKey;
  } else if ([id_ml_dsa_44, id_ml_dsa_65, id_ml_dsa_87].indexOf(publicKeyAlgorithmID) >= 0) {
    const coseAKPPubKey = /* @__PURE__ */ new Map();
    coseAKPPubKey.set(COSEKEYS.kty, COSEKTY.AKP);
    coseAKPPubKey.set(COSEKEYS.alg, mapX509SignatureAlgToCOSEAlg(publicKeyAlgorithmID));
    coseAKPPubKey.set(COSEKEYS.pub, new Uint8Array(subjectPublicKeyInfo.subjectPublicKey));
    cosePublicKey = coseAKPPubKey;
  } else {
    throw new Error(`Certificate public key contained unexpected algorithm ID ${publicKeyAlgorithmID}`);
  }
  return cosePublicKey;
}

// node_modules/@simplewebauthn/server/esm/helpers/verifySignature.js
function verifySignature(opts) {
  const { signature, data, credentialPublicKey, x509Certificate, hashAlgorithm } = opts;
  if (!x509Certificate && !credentialPublicKey) {
    throw new Error('Must declare either "leafCert" or "credentialPublicKey"');
  }
  if (x509Certificate && credentialPublicKey) {
    throw new Error('Must not declare both "leafCert" and "credentialPublicKey"');
  }
  let cosePublicKey = /* @__PURE__ */ new Map();
  if (credentialPublicKey) {
    cosePublicKey = decodeCredentialPublicKey(credentialPublicKey);
  } else if (x509Certificate) {
    cosePublicKey = convertX509PublicKeyToCOSE(x509Certificate);
  }
  return _verifySignatureInternals.stubThis(isoCrypto_exports.verify({
    cosePublicKey,
    signature,
    data,
    shaHashOverride: hashAlgorithm
  }));
}
var _verifySignatureInternals = {
  stubThis: (value) => value
};

// node_modules/@simplewebauthn/server/esm/metadata/parseJWT.js
function parseJWT(jwt) {
  const parts = jwt.split(".");
  return [
    JSON.parse(isoBase64URL_exports.toUTF8String(parts[0])),
    JSON.parse(isoBase64URL_exports.toUTF8String(parts[1])),
    parts[2]
  ];
}

// node_modules/@simplewebauthn/server/esm/helpers/mapJWSAlgToCOSEAlg.js
function mapJWSAlgToCOSEAlg(alg) {
  let algCOSE;
  if (alg === "ES256") {
    algCOSE = COSEALG.ES256;
  } else if (alg === "ES384") {
    algCOSE = COSEALG.ES384;
  } else if (alg === "ES512") {
    algCOSE = COSEALG.ES512;
  } else if (alg === "RS256") {
    algCOSE = COSEALG.RS256;
  } else if (alg === "RS384") {
    algCOSE = COSEALG.RS384;
  } else if (alg === "RS512") {
    algCOSE = COSEALG.RS512;
  } else {
    throw new Error(`Unable to map JWS algorithm "${alg}" to a COSE algorithm`);
  }
  return algCOSE;
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/importJWKKey.js
async function importJWKKey(opts) {
  const WebCrypto = await getWebCrypto();
  const { keyData, algorithm } = opts;
  return WebCrypto.subtle.importKey("jwk", keyData, algorithm, false, ["verify"]);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/verifyEC2.js
async function verifyEC2(opts) {
  const { cosePublicKey, signature, data, shaHashOverride } = opts;
  const WebCrypto = await getWebCrypto();
  const alg = cosePublicKey.get(COSEKEYS.alg);
  const crv = cosePublicKey.get(COSEKEYS.crv);
  const x = cosePublicKey.get(COSEKEYS.x);
  const y = cosePublicKey.get(COSEKEYS.y);
  if (!alg) {
    throw new Error("Public key was missing alg (EC2)");
  }
  if (!crv) {
    throw new Error("Public key was missing crv (EC2)");
  }
  if (!x) {
    throw new Error("Public key was missing x (EC2)");
  }
  if (!y) {
    throw new Error("Public key was missing y (EC2)");
  }
  let _crv;
  if (crv === COSECRV.P256) {
    _crv = "P-256";
  } else if (crv === COSECRV.P384) {
    _crv = "P-384";
  } else if (crv === COSECRV.P521) {
    _crv = "P-521";
  } else {
    throw new Error(`Unexpected COSE crv value of ${crv} (EC2)`);
  }
  const keyData = {
    kty: "EC",
    crv: _crv,
    x: isoBase64URL_exports.fromBuffer(x),
    y: isoBase64URL_exports.fromBuffer(y),
    ext: false
  };
  const keyAlgorithm = {
    /**
     * Note to future self: you can't use `mapCoseAlgToWebCryptoKeyAlgName()` here because some
     * leaf certs from actual devices specified an RSA SHA value for `alg` (e.g. `-257`) which
     * would then map here to `'RSASSA-PKCS1-v1_5'`. We always want `'ECDSA'` here so we'll
     * hard-code this.
     */
    name: "ECDSA",
    namedCurve: _crv
  };
  const key = await importJWKKey({ keyData, algorithm: keyAlgorithm });
  let subtleAlg = mapCoseAlgToWebCryptoHashAlgName(alg);
  if (shaHashOverride) {
    subtleAlg = mapCoseAlgToWebCryptoHashAlgName(shaHashOverride);
  }
  const verifyAlgorithm = {
    name: "ECDSA",
    hash: { name: subtleAlg }
  };
  return WebCrypto.subtle.verify(verifyAlgorithm, key, signature, data);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/mapCoseAlgToWebCryptoKeyAlgName.js
function mapCoseAlgToWebCryptoKeyAlgName(alg) {
  if ([COSEALG.EdDSA].indexOf(alg) >= 0) {
    return "Ed25519";
  } else if ([COSEALG.ES256, COSEALG.ES384, COSEALG.ES512, COSEALG.ES256K].indexOf(alg) >= 0) {
    return "ECDSA";
  } else if ([COSEALG.RS256, COSEALG.RS384, COSEALG.RS512, COSEALG.RS1].indexOf(alg) >= 0) {
    return "RSASSA-PKCS1-v1_5";
  } else if ([COSEALG.PS256, COSEALG.PS384, COSEALG.PS512].indexOf(alg) >= 0) {
    return "RSA-PSS";
  } else if ([COSEALG.ML_DSA_44].indexOf(alg) >= 0) {
    return "ML-DSA-44";
  } else if ([COSEALG.ML_DSA_65].indexOf(alg) >= 0) {
    return "ML-DSA-65";
  } else if ([COSEALG.ML_DSA_87].indexOf(alg) >= 0) {
    return "ML-DSA-87";
  }
  throw new Error(`Could not map COSE alg value of ${alg} to a WebCrypto key alg name`);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/verifyRSA.js
async function verifyRSA(opts) {
  const { cosePublicKey, signature, data, shaHashOverride } = opts;
  const WebCrypto = await getWebCrypto();
  const alg = cosePublicKey.get(COSEKEYS.alg);
  const n = cosePublicKey.get(COSEKEYS.n);
  const e = cosePublicKey.get(COSEKEYS.e);
  if (!alg) {
    throw new Error("Public key was missing alg (RSA)");
  }
  if (!isCOSEAlg(alg)) {
    throw new Error(`Public key had invalid alg ${alg} (RSA)`);
  }
  if (!n) {
    throw new Error("Public key was missing n (RSA)");
  }
  if (!e) {
    throw new Error("Public key was missing e (RSA)");
  }
  const keyData = {
    kty: "RSA",
    alg: "",
    n: isoBase64URL_exports.fromBuffer(n),
    e: isoBase64URL_exports.fromBuffer(e),
    ext: false
  };
  const keyAlgorithm = {
    name: mapCoseAlgToWebCryptoKeyAlgName(alg),
    hash: { name: mapCoseAlgToWebCryptoHashAlgName(alg) }
  };
  const verifyAlgorithm = {
    name: mapCoseAlgToWebCryptoKeyAlgName(alg)
  };
  if (shaHashOverride) {
    keyAlgorithm.hash.name = mapCoseAlgToWebCryptoHashAlgName(shaHashOverride);
  }
  if (keyAlgorithm.name === "RSASSA-PKCS1-v1_5") {
    if (keyAlgorithm.hash.name === "SHA-256") {
      keyData.alg = "RS256";
    } else if (keyAlgorithm.hash.name === "SHA-384") {
      keyData.alg = "RS384";
    } else if (keyAlgorithm.hash.name === "SHA-512") {
      keyData.alg = "RS512";
    } else if (keyAlgorithm.hash.name === "SHA-1") {
      keyData.alg = "RS1";
    }
  } else if (keyAlgorithm.name === "RSA-PSS") {
    let saltLength = 0;
    if (keyAlgorithm.hash.name === "SHA-256") {
      keyData.alg = "PS256";
      saltLength = 32;
    } else if (keyAlgorithm.hash.name === "SHA-384") {
      keyData.alg = "PS384";
      saltLength = 48;
    } else if (keyAlgorithm.hash.name === "SHA-512") {
      keyData.alg = "PS512";
      saltLength = 64;
    }
    verifyAlgorithm.saltLength = saltLength;
  } else {
    throw new Error(`Unexpected RSA key algorithm ${alg} (${keyAlgorithm.name})`);
  }
  const key = await importJWKKey({ keyData, algorithm: keyAlgorithm });
  return WebCrypto.subtle.verify(verifyAlgorithm, key, signature, data);
}

// node_modules/@simplewebauthn/server/esm/metadata/verifyJWT.js
function verifyJWT(jwt, leafCert) {
  const [header, payload, signature] = jwt.split(".");
  const certCOSE = convertX509PublicKeyToCOSE(leafCert);
  const data = isoUint8Array_exports.fromUTF8String(`${header}.${payload}`);
  const signatureBytes = isoBase64URL_exports.toBuffer(signature);
  const headerJSON = JSON.parse(isoBase64URL_exports.toUTF8String(header));
  const jwtHeaderHashAlgCOSE = mapJWSAlgToCOSEAlg(headerJSON.alg);
  if (isCOSEPublicKeyEC2(certCOSE)) {
    return verifyEC2({
      data,
      signature: signatureBytes,
      cosePublicKey: certCOSE,
      shaHashOverride: jwtHeaderHashAlgCOSE
    });
  } else if (isCOSEPublicKeyRSA(certCOSE)) {
    return verifyRSA({
      data,
      signature: signatureBytes,
      cosePublicKey: certCOSE,
      shaHashOverride: jwtHeaderHashAlgCOSE
    });
  }
  const kty = certCOSE.get(COSEKEYS.kty);
  throw new Error(`JWT verification with public key of kty ${kty} is not supported by this method`);
}

// node_modules/@simplewebauthn/server/esm/helpers/convertPEMToBytes.js
function convertPEMToBytes(pem2) {
  const certBase64 = pem2.replace("-----BEGIN CERTIFICATE-----", "").replace("-----END CERTIFICATE-----", "").replace(/[\n ]/g, "");
  return isoBase64URL_exports.toBuffer(certBase64, "base64");
}

// node_modules/@simplewebauthn/server/esm/metadata/verifyMDSBlob.js
async function verifyMDSBlob(blob) {
  const parsedJWT = parseJWT(blob);
  const header = parsedJWT[0];
  const payload = parsedJWT[1];
  const headerCertsPEM = header.x5c.map(convertCertBufferToPEM);
  try {
    const rootCerts = SettingsService.getRootCertificates({
      identifier: "mds"
    });
    await validateCertificatePath(headerCertsPEM, rootCerts);
  } catch (error) {
    const _error = error;
    throw new Error("BLOB certificate path could not be validated", { cause: _error });
  }
  const leafCert = headerCertsPEM[0];
  const verified = await verifyJWT(blob, convertPEMToBytes(leafCert));
  if (!verified) {
    throw new Error("BLOB signature could not be verified");
  }
  const statements = [];
  for (const entry of payload.entries) {
    if (entry.aaguid && entry.metadataStatement) {
      statements.push(entry.metadataStatement);
    }
  }
  const [year, month, day] = payload.nextUpdate.split("-");
  const parsedNextUpdate = new Date(
    parseInt(year, 10),
    // Months need to be zero-indexed
    parseInt(month, 10) - 1,
    parseInt(day, 10)
  );
  return {
    statements,
    parsedNextUpdate,
    payload
  };
}

// node_modules/@simplewebauthn/server/esm/errors/index.js
var SimpleWebAuthnError = class extends Error {
  constructor({ message, code, cause }) {
    super(message, { cause });
    Object.defineProperty(this, "code", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    this.name = "SimpleWebAuthnError";
    this.code = code;
  }
};
var PQCNotSupportedError = class extends SimpleWebAuthnError {
  constructor(alg) {
    const webCryptoAlg = mapCoseAlgToWebCryptoKeyAlgName(alg);
    const message = `This runtime's WebCrypto.subtle does not support use of ${webCryptoAlg}`;
    super({ message, code: "RUNTIME_NO_PQC_SUPPORT" });
  }
};

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/verifyAKP.js
async function verifyAKP(opts) {
  const { cosePublicKey, signature, data } = opts;
  const WebCrypto = await getWebCrypto();
  const alg = cosePublicKey.get(COSEKEYS.alg);
  const pub = cosePublicKey.get(COSEKEYS.pub);
  if (!alg) {
    throw new Error("Public key was missing alg (AKP)");
  }
  if (!isCOSEAlg(alg)) {
    throw new Error(`Public key had invalid alg ${alg} (AKP)`);
  }
  if (!pub) {
    throw new Error("Public key was missing pub (AKP)");
  }
  const webCryptoAlg = mapCoseAlgToWebCryptoKeyAlgName(alg);
  const keyData = {
    kty: "AKP",
    alg: webCryptoAlg,
    pub: isoBase64URL_exports.fromBuffer(pub),
    ext: false
  };
  let key;
  try {
    key = await importJWKKey({ keyData, algorithm: webCryptoAlg });
  } catch (err) {
    const _err = err;
    if (_err.name === "NotSupportedError") {
      throw new PQCNotSupportedError(alg);
    } else {
      throw err;
    }
  }
  return WebCrypto.subtle.verify(webCryptoAlg, key, signature, data);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/verifyOKP.js
async function verifyOKP(opts) {
  const { cosePublicKey, signature, data } = opts;
  const WebCrypto = await getWebCrypto();
  const alg = cosePublicKey.get(COSEKEYS.alg);
  const crv = cosePublicKey.get(COSEKEYS.crv);
  const x = cosePublicKey.get(COSEKEYS.x);
  if (!alg) {
    throw new Error("Public key was missing alg (OKP)");
  }
  if (!isCOSEAlg(alg)) {
    throw new Error(`Public key had invalid alg ${alg} (OKP)`);
  }
  if (!crv) {
    throw new Error("Public key was missing crv (OKP)");
  }
  if (!x) {
    throw new Error("Public key was missing x (OKP)");
  }
  let _crv;
  if (crv === COSECRV.ED25519) {
    _crv = "Ed25519";
  } else {
    throw new Error(`Unexpected COSE crv value of ${crv} (OKP)`);
  }
  const keyData = {
    kty: "OKP",
    crv: _crv,
    alg: "EdDSA",
    x: isoBase64URL_exports.fromBuffer(x),
    ext: false
  };
  const keyAlgorithm = {
    name: _crv,
    namedCurve: _crv
  };
  const key = await importJWKKey({ keyData, algorithm: keyAlgorithm });
  const verifyAlgorithm = {
    name: _crv
  };
  return WebCrypto.subtle.verify(verifyAlgorithm, key, signature, data);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/unwrapEC2Signature.js
function unwrapEC2Signature(signature, crv) {
  const parsedSignature = AsnParser.parse(signature, ECDSASigValue);
  const rBytes = new Uint8Array(parsedSignature.r);
  const sBytes = new Uint8Array(parsedSignature.s);
  const componentLength = getSignatureComponentLength(crv);
  const rNormalizedBytes = toNormalizedBytes(rBytes, componentLength);
  const sNormalizedBytes = toNormalizedBytes(sBytes, componentLength);
  const finalSignature = isoUint8Array_exports.concat([
    rNormalizedBytes,
    sNormalizedBytes
  ]);
  return finalSignature;
}
function getSignatureComponentLength(crv) {
  switch (crv) {
    case COSECRV.P256:
      return 32;
    case COSECRV.P384:
      return 48;
    case COSECRV.P521:
      return 66;
    default:
      throw new Error(`Unexpected COSE crv value of ${crv} (EC2)`);
  }
}
function toNormalizedBytes(bytes, componentLength) {
  let normalizedBytes;
  if (bytes.length < componentLength) {
    normalizedBytes = new Uint8Array(componentLength);
    normalizedBytes.set(bytes, componentLength - bytes.length);
  } else if (bytes.length === componentLength) {
    normalizedBytes = bytes;
  } else if (bytes.length === componentLength + 1 && bytes[0] === 0 && (bytes[1] & 128) === 128) {
    normalizedBytes = bytes.subarray(1);
  } else {
    throw new Error(`Invalid signature component length ${bytes.length}, expected ${componentLength}`);
  }
  return normalizedBytes;
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/verify.js
function verify(opts) {
  const { cosePublicKey, signature, data, shaHashOverride } = opts;
  if (isCOSEPublicKeyEC2(cosePublicKey)) {
    const crv = cosePublicKey.get(COSEKEYS.crv);
    if (!isCOSECrv(crv)) {
      throw new Error(`unknown COSE curve ${crv}`);
    }
    const unwrappedSignature = unwrapEC2Signature(signature, crv);
    return verifyEC2({
      cosePublicKey,
      signature: unwrappedSignature,
      data,
      shaHashOverride
    });
  } else if (isCOSEPublicKeyRSA(cosePublicKey)) {
    return verifyRSA({ cosePublicKey, signature, data, shaHashOverride });
  } else if (isCOSEPublicKeyOKP(cosePublicKey)) {
    return verifyOKP({ cosePublicKey, signature, data });
  } else if (isCOSEPublicKeyAKP(cosePublicKey)) {
    return verifyAKP({ cosePublicKey, signature, data });
  }
  const kty = cosePublicKey.get(COSEKEYS.kty);
  throw new Error(`Signature verification with public key of kty ${kty} is not supported by this method`);
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoUint8Array.js
var isoUint8Array_exports = {};
__export(isoUint8Array_exports, {
  areEqual: () => areEqual,
  concat: () => concat3,
  fromASCIIString: () => fromASCIIString,
  fromHex: () => fromHex,
  fromUTF8String: () => fromUTF8String2,
  toDataView: () => toDataView,
  toHex: () => toHex,
  toUTF8String: () => toUTF8String2
});
function areEqual(array1, array2) {
  if (array1.length != array2.length) {
    return false;
  }
  return array1.every((val, i) => val === array2[i]);
}
function toHex(array) {
  const hexParts = Array.from(array, (i) => i.toString(16).padStart(2, "0"));
  return hexParts.join("");
}
function fromHex(hex2) {
  if (!hex2) {
    return Uint8Array.from([]);
  }
  const isValid = hex2.length !== 0 && hex2.length % 2 === 0 && !/[^a-fA-F0-9]/u.test(hex2);
  if (!isValid) {
    throw new Error("Invalid hex string");
  }
  const byteStrings = hex2.match(/.{1,2}/g) ?? [];
  return Uint8Array.from(byteStrings.map((byte) => parseInt(byte, 16)));
}
function concat3(arrays) {
  let pointer = 0;
  const totalLength = arrays.reduce((prev, curr) => prev + curr.length, 0);
  const toReturn = new Uint8Array(totalLength);
  arrays.forEach((arr) => {
    toReturn.set(arr, pointer);
    pointer += arr.length;
  });
  return toReturn;
}
function toUTF8String2(array) {
  const decoder = new globalThis.TextDecoder("utf-8");
  return decoder.decode(array);
}
function fromUTF8String2(utf8String) {
  const encoder = new globalThis.TextEncoder();
  return encoder.encode(utf8String);
}
function fromASCIIString(value) {
  return Uint8Array.from(value.split("").map((x) => x.charCodeAt(0)));
}
function toDataView(array) {
  return new DataView(array.buffer, array.byteOffset, array.length);
}

// node_modules/@simplewebauthn/server/esm/helpers/convertCertBufferToPEM.js
function convertCertBufferToPEM(certBuffer) {
  let b64cert;
  if (typeof certBuffer === "string") {
    if (isoBase64URL_exports.isBase64URL(certBuffer)) {
      b64cert = isoBase64URL_exports.toBase64(certBuffer);
    } else if (isoBase64URL_exports.isBase64(certBuffer)) {
      b64cert = certBuffer;
    } else {
      throw new Error("Certificate is not a valid base64 or base64url string");
    }
  } else {
    b64cert = isoBase64URL_exports.fromBuffer(certBuffer, "base64");
  }
  let PEMKey = "";
  for (let i = 0; i < Math.ceil(b64cert.length / 64); i += 1) {
    const start = 64 * i;
    PEMKey += `${b64cert.substr(start, 64)}
`;
  }
  PEMKey = `-----BEGIN CERTIFICATE-----
${PEMKey}-----END CERTIFICATE-----
`;
  return PEMKey;
}

// node_modules/@simplewebauthn/server/esm/helpers/iso/isoCrypto/runtimeSupportsWebCryptoKeyAlg.js
function runtimeSupportsWebCryptoKeyAlg(alg) {
  const globalSubtleCrypto = globalThis.SubtleCrypto;
  if (typeof globalSubtleCrypto.supports !== "function") {
    return false;
  }
  try {
    return globalSubtleCrypto.supports("verify", alg);
  } catch (_err) {
    return false;
  }
}

// node_modules/@simplewebauthn/server/esm/services/defaultRootCerts/android-safetynet.js
var GlobalSign_Root_CA = `-----BEGIN CERTIFICATE-----
MIIDdTCCAl2gAwIBAgILBAAAAAABFUtaw5QwDQYJKoZIhvcNAQEFBQAwVzELMAkG
A1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYtc2ExEDAOBgNVBAsTB1Jv
b3QgQ0ExGzAZBgNVBAMTEkdsb2JhbFNpZ24gUm9vdCBDQTAeFw05ODA5MDExMjAw
MDBaFw0yODAxMjgxMjAwMDBaMFcxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9i
YWxTaWduIG52LXNhMRAwDgYDVQQLEwdSb290IENBMRswGQYDVQQDExJHbG9iYWxT
aWduIFJvb3QgQ0EwggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDaDuaZ
jc6j40+Kfvvxi4Mla+pIH/EqsLmVEQS98GPR4mdmzxzdzxtIK+6NiY6arymAZavp
xy0Sy6scTHAHoT0KMM0VjU/43dSMUBUc71DuxC73/OlS8pF94G3VNTCOXkNz8kHp
1Wrjsok6Vjk4bwY8iGlbKk3Fp1S4bInMm/k8yuX9ifUSPJJ4ltbcdG6TRGHRjcdG
snUOhugZitVtbNV4FpWi6cgKOOvyJBNPc1STE4U6G7weNLWLBYy5d4ux2x8gkasJ
U26Qzns3dLlwR5EiUWMWea6xrkEmCMgZK9FGqkjWZCrXgzT/LCrBbBlDSgeF59N8
9iFo7+ryUp9/k5DPAgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8E
BTADAQH/MB0GA1UdDgQWBBRge2YaRQ2XyolQL30EzTSo//z9SzANBgkqhkiG9w0B
AQUFAAOCAQEA1nPnfE920I2/7LqivjTFKDK1fPxsnCwrvQmeU79rXqoRSLblCKOz
yj1hTdNGCbM+w6DjY1Ub8rrvrTnhQ7k4o+YviiY776BQVvnGCv04zcQLcFGUl5gE
38NflNUVyRRBnMRddWQVDf9VMOyGj/8N7yy5Y0b2qvzfvGn9LhJIZJrglfCm7ymP
AbEVtQwdpf5pLGkkeB6zpxxxYu7KyJesF12KwvhHhm4qxFYxldBniYUr+WymXUad
DKqC5JlR3XC321Y9YeRq4VzW9v493kHMB65jUr9TU/Qr6cf9tveCX4XSQRjbgbME
HMUfpIBvFSDJ3gyICh3WZlXi/EjJKSZp4A==
-----END CERTIFICATE-----
`;

// node_modules/@simplewebauthn/server/esm/services/defaultRootCerts/android-key.js
var Google_Hardware_Attestation_Root_1 = `-----BEGIN CERTIFICATE-----
MIIFYDCCA0igAwIBAgIJAOj6GWMU0voYMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNV
BAUTEGY5MjAwOWU4NTNiNmIwNDUwHhcNMTYwNTI2MTYyODUyWhcNMjYwNTI0MTYy
ODUyWjAbMRkwFwYDVQQFExBmOTIwMDllODUzYjZiMDQ1MIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEAr7bHgiuxpwHsK7Qui8xUFmOr75gvMsd/dTEDDJdS
Sxtf6An7xyqpRR90PL2abxM1dEqlXnf2tqw1Ne4Xwl5jlRfdnJLmN0pTy/4lj4/7
tv0Sk3iiKkypnEUtR6WfMgH0QZfKHM1+di+y9TFRtv6y//0rb+T+W8a9nsNL/ggj
nar86461qO0rOs2cXjp3kOG1FEJ5MVmFmBGtnrKpa73XpXyTqRxB/M0n1n/W9nGq
C4FSYa04T6N5RIZGBN2z2MT5IKGbFlbC8UrW0DxW7AYImQQcHtGl/m00QLVWutHQ
oVJYnFPlXTcHYvASLu+RhhsbDmxMgJJ0mcDpvsC4PjvB+TxywElgS70vE0XmLD+O
JtvsBslHZvPBKCOdT0MS+tgSOIfga+z1Z1g7+DVagf7quvmag8jfPioyKvxnK/Eg
sTUVi2ghzq8wm27ud/mIM7AY2qEORR8Go3TVB4HzWQgpZrt3i5MIlCaY504LzSRi
igHCzAPlHws+W0rB5N+er5/2pJKnfBSDiCiFAVtCLOZ7gLiMm0jhO2B6tUXHI/+M
RPjy02i59lINMRRev56GKtcd9qO/0kUJWdZTdA2XoS82ixPvZtXQpUpuL12ab+9E
aDK8Z4RHJYYfCT3Q5vNAXaiWQ+8PTWm2QgBR/bkwSWc+NpUFgNPN9PvQi8WEg5Um
AGMCAwEAAaOBpjCBozAdBgNVHQ4EFgQUNmHhAHyIBQlRi0RsR/8aTMnqTxIwHwYD
VR0jBBgwFoAUNmHhAHyIBQlRi0RsR/8aTMnqTxIwDwYDVR0TAQH/BAUwAwEB/zAO
BgNVHQ8BAf8EBAMCAYYwQAYDVR0fBDkwNzA1oDOgMYYvaHR0cHM6Ly9hbmRyb2lk
Lmdvb2dsZWFwaXMuY29tL2F0dGVzdGF0aW9uL2NybC8wDQYJKoZIhvcNAQELBQAD
ggIBACDIw41L3KlXG0aMiS//cqrG+EShHUGo8HNsw30W1kJtjn6UBwRM6jnmiwfB
Pb8VA91chb2vssAtX2zbTvqBJ9+LBPGCdw/E53Rbf86qhxKaiAHOjpvAy5Y3m00m
qC0w/Zwvju1twb4vhLaJ5NkUJYsUS7rmJKHHBnETLi8GFqiEsqTWpG/6ibYCv7rY
DBJDcR9W62BW9jfIoBQcxUCUJouMPH25lLNcDc1ssqvC2v7iUgI9LeoM1sNovqPm
QUiG9rHli1vXxzCyaMTjwftkJLkf6724DFhuKug2jITV0QkXvaJWF4nUaHOTNA4u
JU9WDvZLI1j83A+/xnAJUucIv/zGJ1AMH2boHqF8CY16LpsYgBt6tKxxWH00XcyD
CdW2KlBCeqbQPcsFmWyWugxdcekhYsAWyoSf818NUsZdBWBaR/OukXrNLfkQ79Iy
ZohZbvabO/X+MVT3rriAoKc8oE2Uws6DF+60PV7/WIPjNvXySdqspImSN78mflxD
qwLqRBYkA3I75qppLGG9rp7UCdRjxMl8ZDBld+7yvHVgt1cVzJx9xnyGCC23Uaic
MDSXYrB4I4WHXPGjxhZuCuPBLTdOLU8YRvMYdEvYebWHMpvwGCF6bAx3JBpIeOQ1
wDB5y0USicV3YgYGmi+NZfhA4URSh77Yd6uuJOJENRaNVTzk
-----END CERTIFICATE-----
`;
var Google_Hardware_Attestation_Root_2 = `-----BEGIN CERTIFICATE-----
MIIFHDCCAwSgAwIBAgIJANUP8luj8tazMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNV
BAUTEGY5MjAwOWU4NTNiNmIwNDUwHhcNMTkxMTIyMjAzNzU4WhcNMzQxMTE4MjAz
NzU4WjAbMRkwFwYDVQQFExBmOTIwMDllODUzYjZiMDQ1MIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEAr7bHgiuxpwHsK7Qui8xUFmOr75gvMsd/dTEDDJdS
Sxtf6An7xyqpRR90PL2abxM1dEqlXnf2tqw1Ne4Xwl5jlRfdnJLmN0pTy/4lj4/7
tv0Sk3iiKkypnEUtR6WfMgH0QZfKHM1+di+y9TFRtv6y//0rb+T+W8a9nsNL/ggj
nar86461qO0rOs2cXjp3kOG1FEJ5MVmFmBGtnrKpa73XpXyTqRxB/M0n1n/W9nGq
C4FSYa04T6N5RIZGBN2z2MT5IKGbFlbC8UrW0DxW7AYImQQcHtGl/m00QLVWutHQ
oVJYnFPlXTcHYvASLu+RhhsbDmxMgJJ0mcDpvsC4PjvB+TxywElgS70vE0XmLD+O
JtvsBslHZvPBKCOdT0MS+tgSOIfga+z1Z1g7+DVagf7quvmag8jfPioyKvxnK/Eg
sTUVi2ghzq8wm27ud/mIM7AY2qEORR8Go3TVB4HzWQgpZrt3i5MIlCaY504LzSRi
igHCzAPlHws+W0rB5N+er5/2pJKnfBSDiCiFAVtCLOZ7gLiMm0jhO2B6tUXHI/+M
RPjy02i59lINMRRev56GKtcd9qO/0kUJWdZTdA2XoS82ixPvZtXQpUpuL12ab+9E
aDK8Z4RHJYYfCT3Q5vNAXaiWQ+8PTWm2QgBR/bkwSWc+NpUFgNPN9PvQi8WEg5Um
AGMCAwEAAaNjMGEwHQYDVR0OBBYEFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMB8GA1Ud
IwQYMBaAFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMA8GA1UdEwEB/wQFMAMBAf8wDgYD
VR0PAQH/BAQDAgIEMA0GCSqGSIb3DQEBCwUAA4ICAQBOMaBc8oumXb2voc7XCWnu
XKhBBK3e2KMGz39t7lA3XXRe2ZLLAkLM5y3J7tURkf5a1SutfdOyXAmeE6SRo83U
h6WszodmMkxK5GM4JGrnt4pBisu5igXEydaW7qq2CdC6DOGjG+mEkN8/TA6p3cno
L/sPyz6evdjLlSeJ8rFBH6xWyIZCbrcpYEJzXaUOEaxxXxgYz5/cTiVKN2M1G2ok
QBUIYSY6bjEL4aUN5cfo7ogP3UvliEo3Eo0YgwuzR2v0KR6C1cZqZJSTnghIC/vA
D32KdNQ+c3N+vl2OTsUVMC1GiWkngNx1OO1+kXW+YTnnTUOtOIswUP/Vqd5SYgAI
mMAfY8U9/iIgkQj6T2W6FsScy94IN9fFhE1UtzmLoBIuUFsVXJMTz+Jucth+IqoW
Fua9v1R93/k98p41pjtFX+H8DslVgfP097vju4KDlqN64xV1grw3ZLl4CiOe/A91
oeLm2UHOq6wn3esB4r2EIQKb6jTVGu5sYCcdWpXr0AUVqcABPdgL+H7qJguBw09o
jm6xNIrw2OocrDKsudk/okr/AwqEyPKw9WnMlQgLIKw1rODG2NvU9oR3GVGdMkUB
ZutL8VuFkERQGt6vQ2OCw0sV47VMkuYbacK/xyZFiRcrPJPb41zgbQj9XAEyLKCH
ex0SdDrx+tWUDqG8At2JHA==
-----END CERTIFICATE-----
`;
var Google_Hardware_Attestation_Root_3 = `
-----BEGIN CERTIFICATE-----
MIIFHDCCAwSgAwIBAgIJAMNrfES5rhgxMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNV
BAUTEGY5MjAwOWU4NTNiNmIwNDUwHhcNMjExMTE3MjMxMDQyWhcNMzYxMTEzMjMx
MDQyWjAbMRkwFwYDVQQFExBmOTIwMDllODUzYjZiMDQ1MIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEAr7bHgiuxpwHsK7Qui8xUFmOr75gvMsd/dTEDDJdS
Sxtf6An7xyqpRR90PL2abxM1dEqlXnf2tqw1Ne4Xwl5jlRfdnJLmN0pTy/4lj4/7
tv0Sk3iiKkypnEUtR6WfMgH0QZfKHM1+di+y9TFRtv6y//0rb+T+W8a9nsNL/ggj
nar86461qO0rOs2cXjp3kOG1FEJ5MVmFmBGtnrKpa73XpXyTqRxB/M0n1n/W9nGq
C4FSYa04T6N5RIZGBN2z2MT5IKGbFlbC8UrW0DxW7AYImQQcHtGl/m00QLVWutHQ
oVJYnFPlXTcHYvASLu+RhhsbDmxMgJJ0mcDpvsC4PjvB+TxywElgS70vE0XmLD+O
JtvsBslHZvPBKCOdT0MS+tgSOIfga+z1Z1g7+DVagf7quvmag8jfPioyKvxnK/Eg
sTUVi2ghzq8wm27ud/mIM7AY2qEORR8Go3TVB4HzWQgpZrt3i5MIlCaY504LzSRi
igHCzAPlHws+W0rB5N+er5/2pJKnfBSDiCiFAVtCLOZ7gLiMm0jhO2B6tUXHI/+M
RPjy02i59lINMRRev56GKtcd9qO/0kUJWdZTdA2XoS82ixPvZtXQpUpuL12ab+9E
aDK8Z4RHJYYfCT3Q5vNAXaiWQ+8PTWm2QgBR/bkwSWc+NpUFgNPN9PvQi8WEg5Um
AGMCAwEAAaNjMGEwHQYDVR0OBBYEFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMB8GA1Ud
IwQYMBaAFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMA8GA1UdEwEB/wQFMAMBAf8wDgYD
VR0PAQH/BAQDAgIEMA0GCSqGSIb3DQEBCwUAA4ICAQBTNNZe5cuf8oiq+jV0itTG
zWVhSTjOBEk2FQvh11J3o3lna0o7rd8RFHnN00q4hi6TapFhh4qaw/iG6Xg+xOan
63niLWIC5GOPFgPeYXM9+nBb3zZzC8ABypYuCusWCmt6Tn3+Pjbz3MTVhRGXuT/T
QH4KGFY4PhvzAyXwdjTOCXID+aHud4RLcSySr0Fq/L+R8TWalvM1wJJPhyRjqRCJ
erGtfBagiALzvhnmY7U1qFcS0NCnKjoO7oFedKdWlZz0YAfu3aGCJd4KHT0MsGiL
Zez9WP81xYSrKMNEsDK+zK5fVzw6jA7cxmpXcARTnmAuGUeI7VVDhDzKeVOctf3a
0qQLwC+d0+xrETZ4r2fRGNw2YEs2W8Qj6oDcfPvq9JySe7pJ6wcHnl5EZ0lwc4xH
7Y4Dx9RA1JlfooLMw3tOdJZH0enxPXaydfAD3YifeZpFaUzicHeLzVJLt9dvGB0b
HQLE4+EqKFgOZv2EoP686DQqbVS1u+9k0p2xbMA105TBIk7npraa8VM0fnrRKi7w
lZKwdH+aNAyhbXRW9xsnODJ+g8eF452zvbiKKngEKirK5LGieoXBX7tZ9D1GNBH2
Ob3bKOwwIWdEFle/YF/h6zWgdeoaNGDqVBrLr2+0DtWoiB1aDEjLWl9FmyIUyUm7
mD/vFDkzF+wm7cyWpQpCVQ==
-----END CERTIFICATE-----
`;
var Google_Hardware_Attestation_Root_4 = `
-----BEGIN CERTIFICATE-----
MIIFHDCCAwSgAwIBAgIJAPHBcqaZ6vUdMA0GCSqGSIb3DQEBCwUAMBsxGTAXBgNV
BAUTEGY5MjAwOWU4NTNiNmIwNDUwHhcNMjIwMzIwMTgwNzQ4WhcNNDIwMzE1MTgw
NzQ4WjAbMRkwFwYDVQQFExBmOTIwMDllODUzYjZiMDQ1MIICIjANBgkqhkiG9w0B
AQEFAAOCAg8AMIICCgKCAgEAr7bHgiuxpwHsK7Qui8xUFmOr75gvMsd/dTEDDJdS
Sxtf6An7xyqpRR90PL2abxM1dEqlXnf2tqw1Ne4Xwl5jlRfdnJLmN0pTy/4lj4/7
tv0Sk3iiKkypnEUtR6WfMgH0QZfKHM1+di+y9TFRtv6y//0rb+T+W8a9nsNL/ggj
nar86461qO0rOs2cXjp3kOG1FEJ5MVmFmBGtnrKpa73XpXyTqRxB/M0n1n/W9nGq
C4FSYa04T6N5RIZGBN2z2MT5IKGbFlbC8UrW0DxW7AYImQQcHtGl/m00QLVWutHQ
oVJYnFPlXTcHYvASLu+RhhsbDmxMgJJ0mcDpvsC4PjvB+TxywElgS70vE0XmLD+O
JtvsBslHZvPBKCOdT0MS+tgSOIfga+z1Z1g7+DVagf7quvmag8jfPioyKvxnK/Eg
sTUVi2ghzq8wm27ud/mIM7AY2qEORR8Go3TVB4HzWQgpZrt3i5MIlCaY504LzSRi
igHCzAPlHws+W0rB5N+er5/2pJKnfBSDiCiFAVtCLOZ7gLiMm0jhO2B6tUXHI/+M
RPjy02i59lINMRRev56GKtcd9qO/0kUJWdZTdA2XoS82ixPvZtXQpUpuL12ab+9E
aDK8Z4RHJYYfCT3Q5vNAXaiWQ+8PTWm2QgBR/bkwSWc+NpUFgNPN9PvQi8WEg5Um
AGMCAwEAAaNjMGEwHQYDVR0OBBYEFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMB8GA1Ud
IwQYMBaAFDZh4QB8iAUJUYtEbEf/GkzJ6k8SMA8GA1UdEwEB/wQFMAMBAf8wDgYD
VR0PAQH/BAQDAgIEMA0GCSqGSIb3DQEBCwUAA4ICAQB8cMqTllHc8U+qCrOlg3H7
174lmaCsbo/bJ0C17JEgMLb4kvrqsXZs01U3mB/qABg/1t5Pd5AORHARs1hhqGIC
W/nKMav574f9rZN4PC2ZlufGXb7sIdJpGiO9ctRhiLuYuly10JccUZGEHpHSYM2G
tkgYbZba6lsCPYAAP83cyDV+1aOkTf1RCp/lM0PKvmxYN10RYsK631jrleGdcdkx
oSK//mSQbgcWnmAEZrzHoF1/0gso1HZgIn0YLzVhLSA/iXCX4QT2h3J5z3znluKG
1nv8NQdxei2DIIhASWfu804CA96cQKTTlaae2fweqXjdN1/v2nqOhngNyz1361mF
mr4XmaKH/ItTwOe72NI9ZcwS1lVaCvsIkTDCEXdm9rCNPAY10iTunIHFXRh+7KPz
lHGewCq/8TOohBRn0/NNfh7uRslOSZ/xKbN9tMBtw37Z8d2vvnXq/YWdsm1+JLVw
n6yYD/yacNJBlwpddla8eaVMjsF6nBnIgQOf9zKSe06nSTqvgwUHosgOECZJZ1Eu
zbH4yswbt02tKtKEFhx+v+OTge/06V+jGsqTWLsfrOCNLuA8H++z+pUENmpqnnHo
vaI47gC+TNpkgYGkkBT6B/m/U01BuOBBTzhIlMEZq9qkDWuM2cA5kW5V3FJUcfHn
w1IdYIg2Wxg7yHcQZemFQg==
-----END CERTIFICATE-----
`;

// node_modules/@simplewebauthn/server/esm/services/defaultRootCerts/apple.js
var Apple_WebAuthn_Root_CA = `-----BEGIN CERTIFICATE-----
MIICEjCCAZmgAwIBAgIQaB0BbHo84wIlpQGUKEdXcTAKBggqhkjOPQQDAzBLMR8w
HQYDVQQDDBZBcHBsZSBXZWJBdXRobiBSb290IENBMRMwEQYDVQQKDApBcHBsZSBJ
bmMuMRMwEQYDVQQIDApDYWxpZm9ybmlhMB4XDTIwMDMxODE4MjEzMloXDTQ1MDMx
NTAwMDAwMFowSzEfMB0GA1UEAwwWQXBwbGUgV2ViQXV0aG4gUm9vdCBDQTETMBEG
A1UECgwKQXBwbGUgSW5jLjETMBEGA1UECAwKQ2FsaWZvcm5pYTB2MBAGByqGSM49
AgEGBSuBBAAiA2IABCJCQ2pTVhzjl4Wo6IhHtMSAzO2cv+H9DQKev3//fG59G11k
xu9eI0/7o6V5uShBpe1u6l6mS19S1FEh6yGljnZAJ+2GNP1mi/YK2kSXIuTHjxA/
pcoRf7XkOtO4o1qlcaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUJtdk
2cV4wlpn0afeaxLQG2PxxtcwDgYDVR0PAQH/BAQDAgEGMAoGCCqGSM49BAMDA2cA
MGQCMFrZ+9DsJ1PW9hfNdBywZDsWDbWFp28it1d/5w2RPkRX3Bbn/UbDTNLx7Jr3
jAGGiQIwHFj+dJZYUJR786osByBelJYsVZd2GbHQu209b5RCmGQ21gpSAk9QZW4B
1bWeT0vT
-----END CERTIFICATE-----
`;

// node_modules/@simplewebauthn/server/esm/services/defaultRootCerts/mds.js
var GlobalSign_Root_CA_R3 = `-----BEGIN CERTIFICATE-----
MIIDXzCCAkegAwIBAgILBAAAAAABIVhTCKIwDQYJKoZIhvcNAQELBQAwTDEgMB4G
A1UECxMXR2xvYmFsU2lnbiBSb290IENBIC0gUjMxEzARBgNVBAoTCkdsb2JhbFNp
Z24xEzARBgNVBAMTCkdsb2JhbFNpZ24wHhcNMDkwMzE4MTAwMDAwWhcNMjkwMzE4
MTAwMDAwWjBMMSAwHgYDVQQLExdHbG9iYWxTaWduIFJvb3QgQ0EgLSBSMzETMBEG
A1UEChMKR2xvYmFsU2lnbjETMBEGA1UEAxMKR2xvYmFsU2lnbjCCASIwDQYJKoZI
hvcNAQEBBQADggEPADCCAQoCggEBAMwldpB5BngiFvXAg7aEyiie/QV2EcWtiHL8
RgJDx7KKnQRfJMsuS+FggkbhUqsMgUdwbN1k0ev1LKMPgj0MK66X17YUhhB5uzsT
gHeMCOFJ0mpiLx9e+pZo34knlTifBtc+ycsmWQ1z3rDI6SYOgxXG71uL0gRgykmm
KPZpO/bLyCiR5Z2KYVc3rHQU3HTgOu5yLy6c+9C7v/U9AOEGM+iCK65TpjoWc4zd
QQ4gOsC0p6Hpsk+QLjJg6VfLuQSSaGjlOCZgdbKfd/+RFO+uIEn8rUAVSNECMWEZ
XriX7613t2Saer9fwRPvm2L7DWzgVGkWqQPabumDk3F2xmmFghcCAwEAAaNCMEAw
DgYDVR0PAQH/BAQDAgEGMA8GA1UdEwEB/wQFMAMBAf8wHQYDVR0OBBYEFI/wS3+o
LkUkrk1Q+mOai97i3Ru8MA0GCSqGSIb3DQEBCwUAA4IBAQBLQNvAUKr+yAzv95ZU
RUm7lgAJQayzE4aGKAczymvmdLm6AC2upArT9fHxD4q/c2dKg8dEe3jgr25sbwMp
jjM5RcOO5LlXbKr8EpbsU8Yt5CRsuZRj+9xTaGdWPoO4zzUhw8lo/s7awlOqzJCK
6fBdRoyV3XpYKBovHd7NADdBj+1EbddTKJd+82cEHhXXipa0095MJ6RMG3NzdvQX
mcIfeg7jLQitChws/zyrVQ4PkX4268NXSb7hLi18YIvDQVETI53O9zJrlAGomecs
Mx86OyXShkDOOyyGeMlhLxS67ttVb9+E7gUJTb0o2HLO02JQZR7rkpeDMdmztcpH
WD9f
-----END CERTIFICATE-----
 `;
var GlobalSign_Root_R46 = `-----BEGIN CERTIFICATE-----
MIIFWjCCA0KgAwIBAgISEdK7udcjGJ5AXwqdLdDfJWfRMA0GCSqGSIb3DQEBDAUA
MEYxCzAJBgNVBAYTAkJFMRkwFwYDVQQKExBHbG9iYWxTaWduIG52LXNhMRwwGgYD
VQQDExNHbG9iYWxTaWduIFJvb3QgUjQ2MB4XDTE5MDMyMDAwMDAwMFoXDTQ2MDMy
MDAwMDAwMFowRjELMAkGA1UEBhMCQkUxGTAXBgNVBAoTEEdsb2JhbFNpZ24gbnYt
c2ExHDAaBgNVBAMTE0dsb2JhbFNpZ24gUm9vdCBSNDYwggIiMA0GCSqGSIb3DQEB
AQUAA4ICDwAwggIKAoICAQCsrHQy6LNl5brtQyYdpokNRbopiLKkHWPd08EsCVeJ
OaFV6Wc0dwxu5FUdUiXSE2te4R2pt32JMl8Nnp8semNgQB+msLZ4j5lUlghYruQG
vGIFAha/r6gjA7aUD7xubMLL1aa7DOn2wQL7Id5m3RerdELv8HQvJfTqa1VbkNud
316HCkD7rRlr+/fKYIje2sGP1q7Vf9Q8g+7XFkyDRTNrJ9CG0Bwta/OrffGFqfUo
0q3v84RLHIf8E6M6cqJaESvWJ3En7YEtbWaBkoe0G1h6zD8K+kZPTXhc+CtI4wSE
y132tGqzZfxCnlEmIyDLPRT5ge1lFgBPGmSXZgjPjHvjK8Cd+RTyG/FWaha/LIWF
zXg4mutCagI0GIMXTpRW+LaCtfOW3T3zvn8gdz57GSNrLNRyc0NXfeD412lPFzYE
+cCQYDdF3uYM2HSNrpyibXRdQr4G9dlkbgIQrImwTDsHTUB+JMWKmIJ5jqSngiCN
I/onccnfxkF0oE32kRbcRoxfKWMxWXEM2G/CtjJ9++ZdU6Z+Ffy7dXxd7Pj2Fxzs
x2sZy/N78CsHpdlseVR2bJ0cpm4O6XkMqCNqo98bMDGfsVR7/mrLZqrcZdCinkqa
ByFrgY/bxFn63iLABJzjqls2k+g9vXqhnQt2sQvHnf3PmKgGwvgqo6GDoLclcqUC
4wIDAQABo0IwQDAOBgNVHQ8BAf8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNV
HQ4EFgQUA1yrc4GHqMywptWU4jaWSf8FmSwwDQYJKoZIhvcNAQEMBQADggIBAHx4
7PYCLLtbfpIrXTncvtgdokIzTfnvpCo7RGkerNlFo048p9gkUbJUHJNOxO97k4Vg
JuoJSOD1u8fpaNK7ajFxzHmuEajwmf3lH7wvqMxX63bEIaZHU1VNaL8FpO7XJqti
2kM3S+LGteWygxk6x9PbTZ4IevPuzz5i+6zoYMzRx6Fcg0XERczzF2sUyQQCPtIk
pnnpHs6i58FZFZ8d4kuaPp92CC1r2LpXFNqD6v6MVenQTqnMdzGxRBF6XLE+0xRF
FRhiJBPSy03OXIPBNvIQtQ6IbbjhVp+J3pZmOUdkLG5NrmJ7v2B0GbhWrJKsFjLt
rWhV/pi60zTe9Mlhww6G9kuEYO4Ne7UyWHmRVSyBQ7N0H3qqJZ4d16GLuc1CLgSk
ZoNNiTW2bKg2SnkheCLQQrzRQDGQob4Ez8pn7fXwgNNgyYMqIgXQBztSvwyeqiv5
u+YfjyW6hY0XHgL+XVAEV8/+LbzvXMAaq7afJMbfc2hIkCwU9D9SGuTSyxTDYWnP
4vkYxboznxSjBF25cfe1lNj2M8FawTSLfJvdkzrnE6JwYZ+vj+vYxXX4M2bUdGc6
N3ec592kD3ZDZopD8p/7DEJ4Y9HiD2971KE9dJeFt0g5QdYg/NA6s/rob8SKunE3
vouXsXgxT7PntgMTzlSdriVZzH81Xwj3QEUxeCp6
-----END CERTIFICATE-----
`;

// node_modules/@simplewebauthn/server/esm/services/settingsService.js
var BaseSettingsService = class {
  constructor() {
    Object.defineProperty(this, "pemCertificates", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: void 0
    });
    Object.defineProperty(this, "_runtimeSupportsPQC", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: false
    });
    this.pemCertificates = /* @__PURE__ */ new Map();
    this._runtimeSupportsPQC = runtimeSupportsWebCryptoKeyAlg("ML-DSA-44");
  }
  setRootCertificates(opts) {
    const { identifier, certificates } = opts;
    const newCertificates = [];
    for (const cert of certificates) {
      if (cert instanceof Uint8Array) {
        newCertificates.push(convertCertBufferToPEM(cert));
      } else {
        newCertificates.push(cert);
      }
    }
    this.pemCertificates.set(identifier, newCertificates);
  }
  getRootCertificates(opts) {
    const { identifier } = opts;
    return this.pemCertificates.get(identifier) ?? [];
  }
  runtimeSupportsPQC() {
    return this._runtimeSupportsPQC;
  }
};
var SettingsService = new BaseSettingsService();
SettingsService.setRootCertificates({
  identifier: "android-key",
  certificates: [
    Google_Hardware_Attestation_Root_1,
    Google_Hardware_Attestation_Root_2,
    Google_Hardware_Attestation_Root_3,
    Google_Hardware_Attestation_Root_4
  ]
});
SettingsService.setRootCertificates({
  identifier: "android-safetynet",
  certificates: [GlobalSign_Root_CA]
});
SettingsService.setRootCertificates({
  identifier: "apple",
  certificates: [Apple_WebAuthn_Root_CA]
});
SettingsService.setRootCertificates({
  identifier: "mds",
  certificates: [
    GlobalSign_Root_CA_R3,
    GlobalSign_Root_R46
  ]
});

// node_modules/@simplewebauthn/server/esm/registration/generateRegistrationOptions.js
var defaultAuthenticatorSelection = {
  residentKey: "preferred",
  userVerification: "preferred"
};
var defaultSupportedAlgorithmIDs = [
  COSEALG.EdDSA,
  COSEALG.ES256,
  COSEALG.RS256
];
if (SettingsService.runtimeSupportsPQC()) {
  defaultSupportedAlgorithmIDs = [COSEALG.ML_DSA_44, ...defaultSupportedAlgorithmIDs];
}
async function generateRegistrationOptions(options) {
  const { rpName, rpID, userName, userID, challenge = await generateChallenge(), userDisplayName = "", timeout = 6e4, attestationType = "none", excludeCredentials = [], authenticatorSelection = defaultAuthenticatorSelection, extensions, supportedAlgorithmIDs = defaultSupportedAlgorithmIDs, preferredAuthenticatorType } = options;
  const pubKeyCredParams = supportedAlgorithmIDs.map((id) => ({
    alg: id,
    type: "public-key"
  }));
  if (authenticatorSelection.residentKey === void 0) {
    if (authenticatorSelection.requireResidentKey) {
      authenticatorSelection.residentKey = "required";
    } else {
    }
  } else {
    authenticatorSelection.requireResidentKey = authenticatorSelection.residentKey === "required";
  }
  let _challenge = challenge;
  if (typeof _challenge === "string") {
    _challenge = isoUint8Array_exports.fromUTF8String(_challenge);
  }
  if (typeof userID === "string") {
    throw new Error(`String values for \`userID\` are no longer supported. See https://simplewebauthn.dev/docs/advanced/server/custom-user-ids`);
  }
  let _userID = userID;
  if (!_userID) {
    _userID = await generateUserID();
  }
  const hints = [];
  if (preferredAuthenticatorType) {
    if (preferredAuthenticatorType === "securityKey") {
      hints.push("security-key");
      authenticatorSelection.authenticatorAttachment = "cross-platform";
    } else if (preferredAuthenticatorType === "localDevice") {
      hints.push("client-device");
      authenticatorSelection.authenticatorAttachment = "platform";
    } else if (preferredAuthenticatorType === "remoteDevice") {
      hints.push("hybrid");
      authenticatorSelection.authenticatorAttachment = "cross-platform";
    }
  }
  return {
    challenge: isoBase64URL_exports.fromBuffer(_challenge),
    rp: {
      name: rpName,
      id: rpID
    },
    user: {
      id: isoBase64URL_exports.fromBuffer(_userID),
      name: userName,
      displayName: userDisplayName
    },
    pubKeyCredParams,
    timeout,
    attestation: attestationType,
    excludeCredentials: excludeCredentials.map((cred) => {
      if (!isoBase64URL_exports.isBase64URL(cred.id)) {
        throw new Error(`excludeCredential id "${cred.id}" is not a valid base64url string`);
      }
      return {
        ...cred,
        id: isoBase64URL_exports.trimPadding(cred.id),
        type: "public-key"
      };
    }),
    authenticatorSelection,
    extensions: {
      ...extensions,
      credProps: true
    },
    hints
  };
}

// node_modules/@simplewebauthn/server/esm/helpers/parseBackupFlags.js
function parseBackupFlags({ be, bs }) {
  const credentialBackedUp = bs;
  let credentialDeviceType = "singleDevice";
  if (be) {
    credentialDeviceType = "multiDevice";
  }
  if (credentialDeviceType === "singleDevice" && credentialBackedUp) {
    throw new InvalidBackupFlags("Single-device credential indicated that it was backed up, which should be impossible.");
  }
  return { credentialDeviceType, credentialBackedUp };
}
var InvalidBackupFlags = class extends Error {
  constructor(message) {
    super(message);
    this.name = "InvalidBackupFlags";
  }
};

// node_modules/@simplewebauthn/server/esm/helpers/matchExpectedRPID.js
async function matchExpectedRPID(rpIDHash, expectedRPIDs) {
  try {
    const matchedRPID = await Promise.any(expectedRPIDs.map((expected) => {
      return new Promise((resolve, reject) => {
        toHash(isoUint8Array_exports.fromASCIIString(expected)).then((expectedRPIDHash) => {
          if (isoUint8Array_exports.areEqual(rpIDHash, expectedRPIDHash)) {
            resolve(expected);
          } else {
            reject();
          }
        });
      });
    }));
    return matchedRPID;
  } catch (err) {
    const _err = err;
    if (_err.name === "AggregateError") {
      throw new UnexpectedRPIDHash();
    }
    throw err;
  }
}
var UnexpectedRPIDHash = class extends Error {
  constructor() {
    const message = "Unexpected RP ID hash";
    super(message);
    this.name = "UnexpectedRPIDHash";
  }
};

// node_modules/@simplewebauthn/server/esm/registration/verifications/verifyAttestationFIDOU2F.js
async function verifyAttestationFIDOU2F(options) {
  const { attStmt, clientDataHash, rpIdHash, credentialID, credentialPublicKey, aaguid, rootCertificates } = options;
  const reservedByte = Uint8Array.from([0]);
  const publicKey = convertCOSEtoPKCS(credentialPublicKey);
  const signatureBase = isoUint8Array_exports.concat([
    reservedByte,
    rpIdHash,
    clientDataHash,
    credentialID,
    publicKey
  ]);
  const sig = attStmt.get("sig");
  const x5c = attStmt.get("x5c");
  if (!x5c) {
    throw new Error("No attestation certificate provided in attestation statement (FIDOU2F)");
  }
  if (!sig) {
    throw new Error("No attestation signature provided in attestation statement (FIDOU2F)");
  }
  const aaguidToHex = Number.parseInt(isoUint8Array_exports.toHex(aaguid), 16);
  if (aaguidToHex !== 0) {
    throw new Error(`AAGUID "${aaguidToHex}" was not expected value`);
  }
  try {
    await validateCertificatePath(x5c.map(convertCertBufferToPEM), rootCertificates);
  } catch (err) {
    const _err = err;
    throw new Error(`${_err.message} (FIDOU2F)`);
  }
  return verifySignature({
    signature: sig,
    data: signatureBase,
    x509Certificate: x5c[0],
    hashAlgorithm: COSEALG.ES256
  });
}

// node_modules/@simplewebauthn/server/esm/helpers/validateExtFIDOGenCEAAGUID.js
var id_fido_gen_ce_aaguid = "1.3.6.1.4.1.45724.1.1.4";
function validateExtFIDOGenCEAAGUID(certExtensions, aaguid) {
  if (!certExtensions) {
    return true;
  }
  const extFIDOGenCEAAGUID = certExtensions.find((ext) => ext.extnID === id_fido_gen_ce_aaguid);
  if (!extFIDOGenCEAAGUID) {
    return true;
  }
  const parsedExtFIDOGenCEAAGUID = AsnParser.parse(extFIDOGenCEAAGUID.extnValue, OctetString2);
  const extValue = new Uint8Array(parsedExtFIDOGenCEAAGUID.buffer);
  const aaguidAndExtAreEqual = isoUint8Array_exports.areEqual(aaguid, extValue);
  if (!aaguidAndExtAreEqual) {
    const _debugExtHex = isoUint8Array_exports.toHex(extValue);
    const _debugAAGUIDHex = isoUint8Array_exports.toHex(aaguid);
    throw new Error(`Certificate extension id-fido-gen-ce-aaguid (${id_fido_gen_ce_aaguid}) value of "${_debugExtHex}" was present but not equal to attestation statement AAGUID value of "${_debugAAGUIDHex}"`);
  }
  return true;
}

// node_modules/@simplewebauthn/server/esm/helpers/logging.js
var DefaultNoopLogger = {
  debug() {
  },
  info() {
  },
  warn() {
  },
  error() {
  }
};
function buildLoggerAllMethods(logger) {
  const toReturn = { ...DefaultNoopLogger };
  if (logger.debug) {
    toReturn.debug = logger.debug;
  }
  if (logger.info) {
    toReturn.info = logger.info;
  }
  if (logger.warn) {
    toReturn.warn = logger.warn;
  }
  if (logger.error) {
    toReturn.error = logger.error;
  }
  return toReturn;
}

// node_modules/@simplewebauthn/server/esm/services/metadataService.js
var NonRefreshingMDS = {
  url: "",
  no: 0,
  nextUpdate: /* @__PURE__ */ new Date(0)
};
var defaultURLMDS = "https://mds.fidoalliance.org/";
var SERVICE_STATE;
(function(SERVICE_STATE2) {
  SERVICE_STATE2[SERVICE_STATE2["DISABLED"] = 0] = "DISABLED";
  SERVICE_STATE2[SERVICE_STATE2["REFRESHING"] = 1] = "REFRESHING";
  SERVICE_STATE2[SERVICE_STATE2["READY"] = 2] = "READY";
})(SERVICE_STATE || (SERVICE_STATE = {}));
var BaseMetadataService = class {
  constructor() {
    Object.defineProperty(this, "mdsCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "statementCache", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: {}
    });
    Object.defineProperty(this, "state", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: SERVICE_STATE.DISABLED
    });
    Object.defineProperty(this, "verificationMode", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: "strict"
    });
    Object.defineProperty(this, "logger", {
      enumerable: true,
      configurable: true,
      writable: true,
      value: DefaultNoopLogger
    });
  }
  async initialize(opts = {}) {
    this.statementCache = {};
    const { mdsServers = [defaultURLMDS], statements, verificationMode, logger = DefaultNoopLogger } = opts;
    this.logger = buildLoggerAllMethods(logger);
    this.setState(SERVICE_STATE.REFRESHING);
    if (statements?.length) {
      let statementsAdded = 0;
      statements.forEach((statement) => {
        if (statement.aaguid) {
          this.statementCache[statement.aaguid] = {
            entry: {
              metadataStatement: statement,
              statusReports: [],
              timeOfLastStatusChange: "1970-01-01"
            },
            url: NonRefreshingMDS.url
          };
          statementsAdded += 1;
        }
      });
      this.logger.info(`Cached ${statementsAdded} local statements`);
    }
    if (mdsServers?.length) {
      const currentCacheCount = Object.keys(this.statementCache).length;
      let numServers = mdsServers.length;
      for (const url of mdsServers) {
        try {
          const cachedMDS = {
            url,
            no: 0,
            nextUpdate: /* @__PURE__ */ new Date(0)
          };
          const blob = await this.downloadBlob(cachedMDS);
          await this.verifyBlob(blob, cachedMDS);
        } catch (err) {
          this.logger.error(`Could not download BLOB from ${url}:`, err);
          numServers -= 1;
        }
      }
      const newCacheCount = Object.keys(this.statementCache).length;
      const cacheDiff = newCacheCount - currentCacheCount;
      this.logger.info(`Cached ${cacheDiff} statements from ${numServers} metadata server(s)`);
    }
    if (verificationMode) {
      this.verificationMode = verificationMode;
    }
    this.setState(SERVICE_STATE.READY);
  }
  async getStatement(aaguid) {
    if (this.state === SERVICE_STATE.DISABLED) {
      return;
    }
    if (!aaguid) {
      return;
    }
    if (aaguid instanceof Uint8Array) {
      aaguid = convertAAGUIDToString(aaguid);
    }
    await this.pauseUntilReady();
    const cachedStatement = this.statementCache[aaguid];
    if (!cachedStatement) {
      if (this.verificationMode === "strict") {
        throw new Error(`No metadata statement found for aaguid "${aaguid}"`);
      }
      return;
    }
    if (cachedStatement.url) {
      const mds = this.mdsCache[cachedStatement.url];
      const now = /* @__PURE__ */ new Date();
      if (now > mds.nextUpdate) {
        try {
          this.setState(SERVICE_STATE.REFRESHING);
          const blob = await this.downloadBlob(mds);
          await this.verifyBlob(blob, mds);
        } finally {
          this.setState(SERVICE_STATE.READY);
        }
      }
    }
    const { entry } = cachedStatement;
    for (const report of entry.statusReports) {
      const { status } = report;
      if (status === "USER_VERIFICATION_BYPASS" || status === "ATTESTATION_KEY_COMPROMISE" || status === "USER_KEY_REMOTE_COMPROMISE" || status === "USER_KEY_PHYSICAL_COMPROMISE") {
        throw new Error(`Detected compromised aaguid "${aaguid}"`);
      }
    }
    return entry.metadataStatement;
  }
  /**
   * Download and process the latest BLOB from MDS
   */
  async downloadBlob(cachedMDS) {
    const { url } = cachedMDS;
    const resp = await fetch2(url);
    const data = await resp.text();
    return data;
  }
  /**
   * Verify and process the MDS metadata blob
   */
  async verifyBlob(blob, cachedMDS) {
    const { url, no } = cachedMDS;
    const { payload, parsedNextUpdate } = await verifyMDSBlob(blob);
    if (payload.no <= no) {
      throw new Error(`Latest BLOB no. ${payload.no} is not greater than previous no. ${no}`);
    }
    for (const entry of payload.entries) {
      if (entry.aaguid) {
        this.statementCache[entry.aaguid] = { entry, url };
      }
    }
    if (url) {
      this.mdsCache[url] = {
        ...cachedMDS,
        // Store the payload `no` to make sure we're getting the next BLOB in the sequence
        no: payload.no,
        // Remember when we need to refresh this blob
        nextUpdate: parsedNextUpdate
      };
    } else {
      if (parsedNextUpdate < /* @__PURE__ */ new Date()) {
        this.logger.warn(`\u26A0\uFE0F This MDS blob (serial: ${payload.no}) contains stale data as of ${parsedNextUpdate.toISOString()}. Please consider re-initializing MetadataService with a newer MDS blob.`);
      }
    }
  }
  /**
   * A helper method to pause execution until the service is ready
   */
  pauseUntilReady() {
    if (this.state === SERVICE_STATE.READY) {
      return new Promise((resolve) => {
        resolve();
      });
    }
    const readyPromise = new Promise((resolve, reject) => {
      const totalTimeoutMS = 7e4;
      const intervalMS = 100;
      let iterations = totalTimeoutMS / intervalMS;
      const intervalID = globalThis.setInterval(() => {
        if (iterations < 1) {
          clearInterval(intervalID);
          reject(`State did not become ready in ${totalTimeoutMS / 1e3} seconds`);
        } else if (this.state === SERVICE_STATE.READY) {
          clearInterval(intervalID);
          resolve();
        }
        iterations -= 1;
      }, intervalMS);
    });
    return readyPromise;
  }
  /**
   * Report service status on change
   */
  setState(newState) {
    this.state = newState;
    if (newState === SERVICE_STATE.DISABLED) {
      this.logger.debug("MetadataService is DISABLED");
    } else if (newState === SERVICE_STATE.REFRESHING) {
      this.logger.debug("MetadataService is REFRESHING");
    } else if (newState === SERVICE_STATE.READY) {
      this.logger.debug("MetadataService is READY");
    }
  }
};
var MetadataService = new BaseMetadataService();

// node_modules/@simplewebauthn/server/esm/metadata/verifyAttestationWithMetadata.js
async function verifyAttestationWithMetadata({ statement, credentialPublicKey, x5c, attestationStatementAlg }) {
  const { authenticationAlgorithms, authenticatorGetInfo, attestationRootCertificates } = statement;
  const keypairCOSEAlgs = /* @__PURE__ */ new Set();
  authenticationAlgorithms.forEach((algSign) => {
    const algSignCOSEINFO = algSignToCOSEInfoMap[algSign];
    if (algSignCOSEINFO) {
      keypairCOSEAlgs.add(algSignCOSEINFO);
    }
  });
  const decodedPublicKey = decodeCredentialPublicKey(credentialPublicKey);
  const kty = decodedPublicKey.get(COSEKEYS.kty);
  const alg = decodedPublicKey.get(COSEKEYS.alg);
  if (!kty) {
    throw new Error("Credential public key was missing kty");
  }
  if (!alg) {
    throw new Error("Credential public key was missing alg");
  }
  if (!kty) {
    throw new Error("Credential public key was missing kty");
  }
  const publicKeyCOSEInfo = { kty, alg };
  if (isCOSEPublicKeyEC2(decodedPublicKey)) {
    const crv = decodedPublicKey.get(COSEKEYS.crv);
    publicKeyCOSEInfo.crv = crv;
  }
  let foundMatch = false;
  for (const keypairAlg of keypairCOSEAlgs) {
    if (keypairAlg.alg === publicKeyCOSEInfo.alg && keypairAlg.kty === publicKeyCOSEInfo.kty) {
      if ((keypairAlg.kty === COSEKTY.EC2 || keypairAlg.kty === COSEKTY.OKP) && keypairAlg.crv === publicKeyCOSEInfo.crv) {
        foundMatch = true;
      } else {
        foundMatch = true;
      }
    }
    if (foundMatch) {
      break;
    }
  }
  if (!foundMatch) {
    const debugMDSAlgs = authenticationAlgorithms.map((algSign) => `'${algSign}' (COSE info: ${stringifyCOSEInfo(algSignToCOSEInfoMap[algSign])})`);
    const strMDSAlgs = JSON.stringify(debugMDSAlgs, null, 2).replace(/"/g, "");
    const strPubKeyAlg = stringifyCOSEInfo(publicKeyCOSEInfo);
    throw new Error(`Public key parameters ${strPubKeyAlg} did not match any of the following metadata algorithms:
${strMDSAlgs}`);
  }
  if (attestationStatementAlg !== void 0 && authenticatorGetInfo?.algorithms !== void 0) {
    const getInfoAlgs = authenticatorGetInfo.algorithms.map((_alg) => _alg.alg);
    if (getInfoAlgs.indexOf(attestationStatementAlg) < 0) {
      throw new Error(`Attestation statement alg ${attestationStatementAlg} did not match one of ${getInfoAlgs}`);
    }
  }
  const authenticatorCerts = x5c.map(convertCertBufferToPEM);
  const statementRootCerts = attestationRootCertificates.map(convertCertBufferToPEM);
  let authenticatorIsSelfReferencing = false;
  if (authenticatorCerts.length === 1 && statementRootCerts.indexOf(authenticatorCerts[0]) >= 0) {
    authenticatorIsSelfReferencing = true;
  }
  if (!authenticatorIsSelfReferencing) {
    try {
      await validateCertificatePath(authenticatorCerts, statementRootCerts);
    } catch (err) {
      const _err = err;
      throw new Error(`Could not validate certificate path with any metadata root certificates: ${_err.message}`);
    }
  }
  return true;
}
var algSignToCOSEInfoMap = {
  secp256r1_ecdsa_sha256_raw: { kty: 2, alg: -7, crv: 1 },
  secp256r1_ecdsa_sha256_der: { kty: 2, alg: -7, crv: 1 },
  rsassa_pss_sha256_raw: { kty: 3, alg: -37 },
  rsassa_pss_sha256_der: { kty: 3, alg: -37 },
  secp256k1_ecdsa_sha256_raw: { kty: 2, alg: -47, crv: 8 },
  secp256k1_ecdsa_sha256_der: { kty: 2, alg: -47, crv: 8 },
  rsassa_pss_sha384_raw: { kty: 3, alg: -38 },
  rsassa_pkcsv15_sha256_raw: { kty: 3, alg: -257 },
  rsassa_pkcsv15_sha384_raw: { kty: 3, alg: -258 },
  rsassa_pkcsv15_sha512_raw: { kty: 3, alg: -259 },
  rsassa_pkcsv15_sha1_raw: { kty: 3, alg: -65535 },
  secp384r1_ecdsa_sha384_raw: { kty: 2, alg: -35, crv: 2 },
  secp512r1_ecdsa_sha256_raw: { kty: 2, alg: -36, crv: 3 },
  ed25519_eddsa_sha512_raw: { kty: 1, alg: -8, crv: 6 }
};
function stringifyCOSEInfo(info) {
  const { kty, alg, crv } = info;
  let toReturn = "";
  if (kty !== COSEKTY.RSA) {
    toReturn = `{ kty: ${kty}, alg: ${alg}, crv: ${crv} }`;
  } else {
    toReturn = `{ kty: ${kty}, alg: ${alg} }`;
  }
  return toReturn;
}

// node_modules/@simplewebauthn/server/esm/registration/verifications/verifyAttestationPacked.js
async function verifyAttestationPacked(options) {
  const { attStmt, clientDataHash, authData, credentialPublicKey, aaguid, rootCertificates } = options;
  const sig = attStmt.get("sig");
  const x5c = attStmt.get("x5c");
  const alg = attStmt.get("alg");
  if (!sig) {
    throw new Error("No attestation signature provided in attestation statement (Packed)");
  }
  if (!alg) {
    throw new Error("Attestation statement did not contain alg (Packed)");
  }
  if (!isCOSEAlg(alg)) {
    throw new Error(`Attestation statement contained invalid alg ${alg} (Packed)`);
  }
  const signatureBase = isoUint8Array_exports.concat([authData, clientDataHash]);
  let verified = false;
  if (x5c) {
    const { subject, basicConstraintsCA, version, notBefore, notAfter, parsedCertificate } = getCertificateInfo(x5c[0]);
    const { OU, CN, O, C } = subject;
    if (OU !== "Authenticator Attestation") {
      throw new Error('Certificate OU was not "Authenticator Attestation" (Packed|Full)');
    }
    if (!CN) {
      throw new Error("Certificate CN was empty (Packed|Full)");
    }
    if (!O) {
      throw new Error("Certificate O was empty (Packed|Full)");
    }
    if (!C || C.length !== 2) {
      throw new Error("Certificate C was not two-character ISO 3166 code (Packed|Full)");
    }
    if (basicConstraintsCA) {
      throw new Error("Certificate basic constraints CA was not `false` (Packed|Full)");
    }
    if (version !== 2) {
      throw new Error("Certificate version was not `3` (ASN.1 value of 2) (Packed|Full)");
    }
    let now = /* @__PURE__ */ new Date();
    if (notBefore > now) {
      throw new Error(`Certificate not good before "${notBefore.toString()}" (Packed|Full)`);
    }
    now = /* @__PURE__ */ new Date();
    if (notAfter < now) {
      throw new Error(`Certificate not good after "${notAfter.toString()}" (Packed|Full)`);
    }
    try {
      await validateExtFIDOGenCEAAGUID(parsedCertificate.tbsCertificate.extensions, aaguid);
    } catch (err) {
      const _err = err;
      throw new Error(`${_err.message} (Packed|Full)`);
    }
    const statement = await MetadataService.getStatement(aaguid);
    if (statement) {
      if (statement.attestationTypes.indexOf("basic_full") < 0) {
        throw new Error("Metadata does not indicate support for full attestations (Packed|Full)");
      }
      try {
        await verifyAttestationWithMetadata({
          statement,
          credentialPublicKey,
          x5c,
          attestationStatementAlg: alg
        });
      } catch (err) {
        const _err = err;
        throw new Error(`${_err.message} (Packed|Full)`);
      }
    } else {
      try {
        await validateCertificatePath(x5c.map(convertCertBufferToPEM), rootCertificates);
      } catch (err) {
        const _err = err;
        throw new Error(`${_err.message} (Packed|Full)`, { cause: _err });
      }
    }
    verified = await verifySignature({
      signature: sig,
      data: signatureBase,
      x509Certificate: x5c[0],
      hashAlgorithm: alg
    });
  } else {
    verified = await verifySignature({
      signature: sig,
      data: signatureBase,
      credentialPublicKey,
      hashAlgorithm: alg
    });
  }
  return verified;
}

// node_modules/@simplewebauthn/server/esm/registration/verifications/verifyAttestationAndroidSafetyNet.js
async function verifyAttestationAndroidSafetyNet(options) {
  const { attStmt, clientDataHash, authData, aaguid, rootCertificates, verifyTimestampMS = true, credentialPublicKey, attestationSafetyNetEnforceCTSCheck } = options;
  const alg = attStmt.get("alg");
  const response = attStmt.get("response");
  const ver = attStmt.get("ver");
  if (!ver) {
    throw new Error("No ver value in attestation (SafetyNet)");
  }
  if (!response) {
    throw new Error("No response was included in attStmt by authenticator (SafetyNet)");
  }
  const jwt = isoUint8Array_exports.toUTF8String(response);
  const jwtParts = jwt.split(".");
  const HEADER = JSON.parse(isoBase64URL_exports.toUTF8String(jwtParts[0]));
  const PAYLOAD = JSON.parse(isoBase64URL_exports.toUTF8String(jwtParts[1]));
  const SIGNATURE = jwtParts[2];
  const { nonce, ctsProfileMatch, timestampMs } = PAYLOAD;
  if (verifyTimestampMS) {
    let now = Date.now();
    if (timestampMs > Date.now()) {
      throw new Error(`Payload timestamp "${timestampMs}" was later than "${now}" (SafetyNet)`);
    }
    const timestampPlusDelay = timestampMs + 60 * 1e3;
    now = Date.now();
    if (timestampPlusDelay < now) {
      throw new Error(`Payload timestamp "${timestampPlusDelay}" has expired (SafetyNet)`);
    }
  }
  const nonceBase = isoUint8Array_exports.concat([authData, clientDataHash]);
  const nonceBuffer = await toHash(nonceBase);
  const expectedNonce = isoBase64URL_exports.fromBuffer(nonceBuffer, "base64");
  if (nonce !== expectedNonce) {
    throw new Error("Could not verify payload nonce (SafetyNet)");
  }
  if (attestationSafetyNetEnforceCTSCheck && !ctsProfileMatch) {
    throw new Error("Could not verify device integrity (SafetyNet)");
  }
  const leafCertBuffer = isoBase64URL_exports.toBuffer(HEADER.x5c[0], "base64");
  const leafCertInfo = getCertificateInfo(leafCertBuffer);
  const { subject } = leafCertInfo;
  if (subject.CN !== "attest.android.com") {
    throw new Error('Certificate common name was not "attest.android.com" (SafetyNet)');
  }
  const statement = await MetadataService.getStatement(aaguid);
  if (statement) {
    try {
      await verifyAttestationWithMetadata({
        statement,
        credentialPublicKey,
        x5c: HEADER.x5c,
        attestationStatementAlg: alg
      });
    } catch (err) {
      const _err = err;
      throw new Error(`${_err.message} (SafetyNet)`);
    }
  } else {
    try {
      await validateCertificatePath(HEADER.x5c.map(convertCertBufferToPEM), rootCertificates);
    } catch (err) {
      const _err = err;
      throw new Error(`${_err.message} (SafetyNet)`);
    }
  }
  const signatureBaseBuffer = isoUint8Array_exports.fromUTF8String(`${jwtParts[0]}.${jwtParts[1]}`);
  const signatureBuffer = isoBase64URL_exports.toBuffer(SIGNATURE);
  const verified = await verifySignature({
    signature: signatureBuffer,
    data: signatureBaseBuffer,
    x509Certificate: leafCertBuffer,
    hashAlgorithm: alg
  });
  return verified;
}

// node_modules/@simplewebauthn/server/esm/registration/verifications/tpm/constants.js
var TPM_ST = {
  196: "TPM_ST_RSP_COMMAND",
  32768: "TPM_ST_NULL",
  32769: "TPM_ST_NO_SESSIONS",
  32770: "TPM_ST_SESSIONS",
  32788: "TPM_ST_ATTEST_NV",
  32789: "TPM_ST_ATTEST_COMMAND_AUDIT",
  32790: "TPM_ST_ATTEST_SESSION_AUDIT",
  32791: "TPM_ST_ATTEST_CERTIFY",
  32792: "TPM_ST_ATTEST_QUOTE",
  32793: "TPM_ST_ATTEST_TIME",
  32794: "TPM_ST_ATTEST_CREATION",
  32801: "TPM_ST_CREATION",
  32802: "TPM_ST_VERIFIED",
  32803: "TPM_ST_AUTH_SECRET",
  32804: "TPM_ST_HASHCHECK",
  32805: "TPM_ST_AUTH_SIGNED",
  32809: "TPM_ST_FU_MANIFEST"
};
var TPM_ALG = {
  0: "TPM_ALG_ERROR",
  1: "TPM_ALG_RSA",
  4: "TPM_ALG_SHA",
  // @ts-ignore 2300
  4: "TPM_ALG_SHA1",
  5: "TPM_ALG_HMAC",
  6: "TPM_ALG_AES",
  7: "TPM_ALG_MGF1",
  8: "TPM_ALG_KEYEDHASH",
  10: "TPM_ALG_XOR",
  11: "TPM_ALG_SHA256",
  12: "TPM_ALG_SHA384",
  13: "TPM_ALG_SHA512",
  16: "TPM_ALG_NULL",
  18: "TPM_ALG_SM3_256",
  19: "TPM_ALG_SM4",
  20: "TPM_ALG_RSASSA",
  21: "TPM_ALG_RSAES",
  22: "TPM_ALG_RSAPSS",
  23: "TPM_ALG_OAEP",
  24: "TPM_ALG_ECDSA",
  25: "TPM_ALG_ECDH",
  26: "TPM_ALG_ECDAA",
  27: "TPM_ALG_SM2",
  28: "TPM_ALG_ECSCHNORR",
  29: "TPM_ALG_ECMQV",
  32: "TPM_ALG_KDF1_SP800_56A",
  33: "TPM_ALG_KDF2",
  34: "TPM_ALG_KDF1_SP800_108",
  35: "TPM_ALG_ECC",
  37: "TPM_ALG_SYMCIPHER",
  38: "TPM_ALG_CAMELLIA",
  64: "TPM_ALG_CTR",
  65: "TPM_ALG_OFB",
  66: "TPM_ALG_CBC",
  67: "TPM_ALG_CFB",
  68: "TPM_ALG_ECB"
};
var TPM_ECC_CURVE = {
  0: "TPM_ECC_NONE",
  1: "TPM_ECC_NIST_P192",
  2: "TPM_ECC_NIST_P224",
  3: "TPM_ECC_NIST_P256",
  4: "TPM_ECC_NIST_P384",
  5: "TPM_ECC_NIST_P521",
  16: "TPM_ECC_BN_P256",
  17: "TPM_ECC_BN_P638",
  32: "TPM_ECC_SM2_P256"
};
var TPM_MANUFACTURERS = {
  "id:414D4400": { name: "AMD", id: "AMD" },
  "id:414E5400": { name: "Ant Group", id: "ANT" },
  "id:41544D4C": { name: "Atmel", id: "ATML" },
  "id:4252434D": { name: "Broadcom", id: "BRCM" },
  "id:4353434F": { name: "Cisco", id: "CSCO" },
  "id:464C5953": { name: "Flyslice Technologies", id: "FLYS" },
  "id:524F4343": { name: "Fuzhou Rockchip", id: "ROCC" },
  "id:474F4F47": { name: "Google", id: "GOOG" },
  "id:48504900": { name: "HPI", id: "HPI" },
  "id:48504500": { name: "HPE", id: "HPE" },
  "id:48495349": { name: "Huawei", id: "HISI" },
  "id:49424D00": { name: "IBM", id: "IBM" },
  // IBM is "id:49424d00" in the TPM spec. It's been normalized here
  "id:49465800": { name: "Infineon", id: "IFX" },
  "id:494E5443": { name: "Intel", id: "INTC" },
  "id:4C454E00": { name: "Lenovo", id: "LEN" },
  "id:4D534654": { name: "Microsoft", id: "MSFT" },
  "id:4E534D20": { name: "National Semiconductor", id: "NSM" },
  "id:4E545A00": { name: "Nationz", id: "NTZ" },
  "id:4E534700": { name: "NSING", id: "NSG" },
  "id:4E544300": { name: "Nuvoton Technology", id: "NTC" },
  "id:51434F4D": { name: "Qualcomm", id: "QCOM" },
  "id:534D534E": { name: "Samsung", id: "SMSN" },
  "id:53454345": { name: "SecEdge", id: "SECE" },
  "id:534E5300": { name: "Sinosun", id: "SNS" },
  "id:534D5343": { name: "SMSC", id: "SMSC" },
  "id:53544D20": { name: "STMicroelectronics", id: "STM" },
  "id:54584E00": { name: "Texas Instruments", id: "TXN" },
  "id:57454300": { name: "Winbond", id: "WEC" },
  "id:5345414C": { name: "Wisekey", id: "SEAL" },
  "id:FFFFF1D0": { name: "FIDO Alliance", id: "FIDO" }
  // FIDO Conformance
};
var TPM_ECC_CURVE_COSE_CRV_MAP = {
  TPM_ECC_NIST_P256: 1,
  // p256
  TPM_ECC_NIST_P384: 2,
  // p384
  TPM_ECC_NIST_P521: 3,
  // p521
  TPM_ECC_BN_P256: 1,
  // p256
  TPM_ECC_SM2_P256: 1
  // p256
};

// node_modules/@simplewebauthn/server/esm/registration/verifications/tpm/parseCertInfo.js
function parseCertInfo(certInfo) {
  let pointer = 0;
  const dataView = isoUint8Array_exports.toDataView(certInfo);
  const magic = dataView.getUint32(pointer);
  pointer += 4;
  const typeBuffer = dataView.getUint16(pointer);
  pointer += 2;
  const type = TPM_ST[typeBuffer];
  const qualifiedSignerLength = dataView.getUint16(pointer);
  pointer += 2;
  const qualifiedSigner = certInfo.slice(pointer, pointer += qualifiedSignerLength);
  const extraDataLength = dataView.getUint16(pointer);
  pointer += 2;
  const extraData = certInfo.slice(pointer, pointer += extraDataLength);
  const clock = certInfo.slice(pointer, pointer += 8);
  const resetCount = dataView.getUint32(pointer);
  pointer += 4;
  const restartCount = dataView.getUint32(pointer);
  pointer += 4;
  const safe = !!certInfo.slice(pointer, pointer += 1);
  const clockInfo = { clock, resetCount, restartCount, safe };
  const firmwareVersion = certInfo.slice(pointer, pointer += 8);
  const attestedNameLength = dataView.getUint16(pointer);
  pointer += 2;
  const attestedName = certInfo.slice(pointer, pointer += attestedNameLength);
  const attestedNameDataView = isoUint8Array_exports.toDataView(attestedName);
  const qualifiedNameLength = dataView.getUint16(pointer);
  pointer += 2;
  const qualifiedName = certInfo.slice(pointer, pointer += qualifiedNameLength);
  const attested = {
    nameAlg: TPM_ALG[attestedNameDataView.getUint16(0)],
    nameAlgBuffer: attestedName.slice(0, 2),
    name: attestedName,
    qualifiedName
  };
  return {
    magic,
    type,
    qualifiedSigner,
    extraData,
    clockInfo,
    firmwareVersion,
    attested
  };
}

// node_modules/@simplewebauthn/server/esm/registration/verifications/tpm/parsePubArea.js
function parsePubArea(pubArea) {
  let pointer = 0;
  const dataView = isoUint8Array_exports.toDataView(pubArea);
  const type = TPM_ALG[dataView.getUint16(pointer)];
  pointer += 2;
  const nameAlg = TPM_ALG[dataView.getUint16(pointer)];
  pointer += 2;
  const objectAttributesInt = dataView.getUint32(pointer);
  pointer += 4;
  const objectAttributes = {
    fixedTPM: !!(objectAttributesInt & 1),
    stClear: !!(objectAttributesInt & 2),
    fixedParent: !!(objectAttributesInt & 8),
    sensitiveDataOrigin: !!(objectAttributesInt & 16),
    userWithAuth: !!(objectAttributesInt & 32),
    adminWithPolicy: !!(objectAttributesInt & 64),
    noDA: !!(objectAttributesInt & 512),
    encryptedDuplication: !!(objectAttributesInt & 1024),
    restricted: !!(objectAttributesInt & 32768),
    decrypt: !!(objectAttributesInt & 65536),
    signOrEncrypt: !!(objectAttributesInt & 131072)
  };
  const authPolicyLength = dataView.getUint16(pointer);
  pointer += 2;
  const authPolicy = pubArea.slice(pointer, pointer += authPolicyLength);
  const parameters = {};
  let unique = Uint8Array.from([]);
  if (type === "TPM_ALG_RSA") {
    const symmetric = TPM_ALG[dataView.getUint16(pointer)];
    pointer += 2;
    const scheme = TPM_ALG[dataView.getUint16(pointer)];
    pointer += 2;
    const keyBits = dataView.getUint16(pointer);
    pointer += 2;
    const exponent = dataView.getUint32(pointer);
    pointer += 4;
    parameters.rsa = { symmetric, scheme, keyBits, exponent };
    const uniqueLength = dataView.getUint16(pointer);
    pointer += 2;
    unique = pubArea.slice(pointer, pointer += uniqueLength);
  } else if (type === "TPM_ALG_ECC") {
    const symmetric = TPM_ALG[dataView.getUint16(pointer)];
    pointer += 2;
    const scheme = TPM_ALG[dataView.getUint16(pointer)];
    pointer += 2;
    const curveID = TPM_ECC_CURVE[dataView.getUint16(pointer)];
    pointer += 2;
    const kdf = TPM_ALG[dataView.getUint16(pointer)];
    pointer += 2;
    parameters.ecc = { symmetric, scheme, curveID, kdf };
    const uniqueXLength = dataView.getUint16(pointer);
    pointer += 2;
    const uniqueX = pubArea.slice(pointer, pointer += uniqueXLength);
    const uniqueYLength = dataView.getUint16(pointer);
    pointer += 2;
    const uniqueY = pubArea.slice(pointer, pointer += uniqueYLength);
    unique = isoUint8Array_exports.concat([uniqueX, uniqueY]);
  } else {
    throw new Error(`Unexpected type "${type}" (TPM)`);
  }
  return {
    type,
    nameAlg,
    objectAttributes,
    authPolicy,
    parameters,
    unique
  };
}

// node_modules/@simplewebauthn/server/esm/registration/verifications/tpm/isValidTPMManufacturerID.js
function getTPMManufacturerInfo(id) {
  const _normalized = `id:${id.substring(3).toUpperCase()}`;
  return TPM_MANUFACTURERS[_normalized];
}

// node_modules/@simplewebauthn/server/esm/registration/verifications/tpm/verifyAttestationTPM.js
async function verifyAttestationTPM(options) {
  const { aaguid, attStmt, authData, credentialPublicKey, clientDataHash, rootCertificates } = options;
  const ver = attStmt.get("ver");
  const sig = attStmt.get("sig");
  const alg = attStmt.get("alg");
  const x5c = attStmt.get("x5c");
  const pubArea = attStmt.get("pubArea");
  const certInfo = attStmt.get("certInfo");
  if (ver !== "2.0") {
    throw new Error(`Unexpected ver "${ver}", expected "2.0" (TPM)`);
  }
  if (!sig) {
    throw new Error("No attestation signature provided in attestation statement (TPM)");
  }
  if (!alg) {
    throw new Error(`Attestation statement did not contain alg (TPM)`);
  }
  if (!isCOSEAlg(alg)) {
    throw new Error(`Attestation statement contained invalid alg ${alg} (TPM)`);
  }
  if (!x5c) {
    throw new Error("No attestation certificate provided in attestation statement (TPM)");
  }
  if (!pubArea) {
    throw new Error("Attestation statement did not contain pubArea (TPM)");
  }
  if (!certInfo) {
    throw new Error("Attestation statement did not contain certInfo (TPM)");
  }
  const parsedPubArea = parsePubArea(pubArea);
  const { unique, type: pubType, parameters } = parsedPubArea;
  const cosePublicKey = decodeCredentialPublicKey(credentialPublicKey);
  if (pubType === "TPM_ALG_RSA") {
    if (!isCOSEPublicKeyRSA(cosePublicKey)) {
      throw new Error(`Credential public key with kty ${cosePublicKey.get(COSEKEYS.kty)} did not match ${pubType}`);
    }
    const n = cosePublicKey.get(COSEKEYS.n);
    const e = cosePublicKey.get(COSEKEYS.e);
    if (!n) {
      throw new Error("COSE public key missing n (TPM|RSA)");
    }
    if (!e) {
      throw new Error("COSE public key missing e (TPM|RSA)");
    }
    if (!isoUint8Array_exports.areEqual(unique, n)) {
      throw new Error("PubArea unique is not same as credentialPublicKey (TPM|RSA)");
    }
    if (!parameters.rsa) {
      throw new Error(`Parsed pubArea type is RSA, but missing parameters.rsa (TPM|RSA)`);
    }
    const eBuffer = e;
    const pubAreaExponent = parameters.rsa.exponent || 65537;
    const eSum = eBuffer[0] + (eBuffer[1] << 8) + (eBuffer[2] << 16);
    if (pubAreaExponent !== eSum) {
      throw new Error(`Unexpected public key exp ${eSum}, expected ${pubAreaExponent} (TPM|RSA)`);
    }
  } else if (pubType === "TPM_ALG_ECC") {
    if (!isCOSEPublicKeyEC2(cosePublicKey)) {
      throw new Error(`Credential public key with kty ${cosePublicKey.get(COSEKEYS.kty)} did not match ${pubType}`);
    }
    const crv = cosePublicKey.get(COSEKEYS.crv);
    const x = cosePublicKey.get(COSEKEYS.x);
    const y = cosePublicKey.get(COSEKEYS.y);
    if (!crv) {
      throw new Error("COSE public key missing crv (TPM|ECC)");
    }
    if (!x) {
      throw new Error("COSE public key missing x (TPM|ECC)");
    }
    if (!y) {
      throw new Error("COSE public key missing y (TPM|ECC)");
    }
    if (!isoUint8Array_exports.areEqual(unique, isoUint8Array_exports.concat([x, y]))) {
      throw new Error("PubArea unique is not same as public key x and y (TPM|ECC)");
    }
    if (!parameters.ecc) {
      throw new Error(`Parsed pubArea type is ECC, but missing parameters.ecc (TPM|ECC)`);
    }
    const pubAreaCurveID = parameters.ecc.curveID;
    const pubAreaCurveIDMapToCOSECRV = TPM_ECC_CURVE_COSE_CRV_MAP[pubAreaCurveID];
    if (pubAreaCurveIDMapToCOSECRV !== crv) {
      throw new Error(`Public area key curve ID "${pubAreaCurveID}" mapped to "${pubAreaCurveIDMapToCOSECRV}" which did not match public key crv of "${crv}" (TPM|ECC)`);
    }
  } else {
    throw new Error(`Unsupported pubArea.type "${pubType}"`);
  }
  const parsedCertInfo = parseCertInfo(certInfo);
  const { magic, type: certType, attested, extraData } = parsedCertInfo;
  if (magic !== 4283712327) {
    throw new Error(`Unexpected magic value "${magic}", expected "0xff544347" (TPM)`);
  }
  if (certType !== "TPM_ST_ATTEST_CERTIFY") {
    throw new Error(`Unexpected type "${certType}", expected "TPM_ST_ATTEST_CERTIFY" (TPM)`);
  }
  const pubAreaHash = await toHash(pubArea, attestedNameAlgToCOSEAlg(attested.nameAlg));
  const attestedName = isoUint8Array_exports.concat([
    attested.nameAlgBuffer,
    pubAreaHash
  ]);
  if (!isoUint8Array_exports.areEqual(attested.name, attestedName)) {
    throw new Error(`Attested name comparison failed (TPM)`);
  }
  const attToBeSigned = isoUint8Array_exports.concat([authData, clientDataHash]);
  const attToBeSignedHash = await toHash(attToBeSigned, alg);
  if (!isoUint8Array_exports.areEqual(extraData, attToBeSignedHash)) {
    throw new Error("CertInfo extra data did not equal hashed attestation (TPM)");
  }
  if (x5c.length < 1) {
    throw new Error("No certificates present in x5c array (TPM)");
  }
  const leafCertInfo = getCertificateInfo(x5c[0]);
  const { basicConstraintsCA, version, subject, notAfter, notBefore } = leafCertInfo;
  if (basicConstraintsCA) {
    throw new Error("Certificate basic constraints CA was not `false` (TPM)");
  }
  if (version !== 2) {
    throw new Error("Certificate version was not `3` (ASN.1 value of 2) (TPM)");
  }
  if (subject.combined.length > 0) {
    throw new Error("Certificate subject was not empty (TPM)");
  }
  let now = /* @__PURE__ */ new Date();
  if (notBefore > now) {
    throw new Error(`Certificate not good before "${notBefore.toString()}" (TPM)`);
  }
  now = /* @__PURE__ */ new Date();
  if (notAfter < now) {
    throw new Error(`Certificate not good after "${notAfter.toString()}" (TPM)`);
  }
  const parsedCert = AsnParser.parse(x5c[0], Certificate);
  if (!parsedCert.tbsCertificate.extensions) {
    throw new Error("Certificate was missing extensions (TPM)");
  }
  let subjectAltNamePresent;
  let extKeyUsage;
  parsedCert.tbsCertificate.extensions.forEach((ext) => {
    if (ext.extnID === id_ce_subjectAltName) {
      subjectAltNamePresent = AsnParser.parse(ext.extnValue, SubjectAlternativeName);
    } else if (ext.extnID === id_ce_extKeyUsage) {
      extKeyUsage = AsnParser.parse(ext.extnValue, ExtendedKeyUsage);
    }
  });
  if (!subjectAltNamePresent) {
    throw new Error("Certificate did not contain subjectAltName extension (TPM)");
  }
  if (!subjectAltNamePresent[0].directoryName?.[0].length) {
    throw new Error("Certificate subjectAltName extension directoryName was empty (TPM)");
  }
  const { tcgAtTpmManufacturer, tcgAtTpmModel, tcgAtTpmVersion } = getTcgAtTpmValues(subjectAltNamePresent[0].directoryName);
  if (!tcgAtTpmManufacturer || !tcgAtTpmModel || !tcgAtTpmVersion) {
    throw new Error("Certificate contained incomplete subjectAltName data (TPM)");
  }
  if (!extKeyUsage) {
    throw new Error("Certificate did not contain ExtendedKeyUsage extension (TPM)");
  }
  if (!getTPMManufacturerInfo(tcgAtTpmManufacturer)) {
    throw new Error(`Could not match TPM manufacturer "${tcgAtTpmManufacturer}" (TPM)`);
  }
  if (extKeyUsage[0] !== "2.23.133.8.3") {
    throw new Error(`Unexpected extKeyUsage "${extKeyUsage[0]}", expected "2.23.133.8.3" (TPM)`);
  }
  try {
    await validateExtFIDOGenCEAAGUID(parsedCert.tbsCertificate.extensions, aaguid);
  } catch (err) {
    const _err = err;
    throw new Error(`${_err.message} (TPM)`);
  }
  const statement = await MetadataService.getStatement(aaguid);
  if (statement) {
    try {
      await verifyAttestationWithMetadata({
        statement,
        credentialPublicKey,
        x5c,
        attestationStatementAlg: alg
      });
    } catch (err) {
      const _err = err;
      throw new Error(`${_err.message} (TPM)`);
    }
  } else {
    try {
      await validateCertificatePath(x5c.map(convertCertBufferToPEM), rootCertificates);
    } catch (err) {
      const _err = err;
      throw new Error(`${_err.message} (TPM)`);
    }
  }
  return verifySignature({
    signature: sig,
    data: certInfo,
    x509Certificate: x5c[0],
    hashAlgorithm: alg
  });
}
function getTcgAtTpmValues(root) {
  const oidManufacturer = "2.23.133.2.1";
  const oidModel = "2.23.133.2.2";
  const oidVersion = "2.23.133.2.3";
  let tcgAtTpmManufacturer;
  let tcgAtTpmModel;
  let tcgAtTpmVersion;
  root.forEach((relName) => {
    relName.forEach((attr) => {
      if (attr.type === oidManufacturer) {
        tcgAtTpmManufacturer = attr.value.toString();
      } else if (attr.type === oidModel) {
        tcgAtTpmModel = attr.value.toString();
      } else if (attr.type === oidVersion) {
        tcgAtTpmVersion = attr.value.toString();
      }
    });
  });
  return {
    tcgAtTpmManufacturer,
    tcgAtTpmModel,
    tcgAtTpmVersion
  };
}
function attestedNameAlgToCOSEAlg(alg) {
  if (alg === "TPM_ALG_SHA256") {
    return COSEALG.ES256;
  } else if (alg === "TPM_ALG_SHA384") {
    return COSEALG.ES384;
  } else if (alg === "TPM_ALG_SHA512") {
    return COSEALG.ES512;
  }
  throw new Error(`Unexpected TPM attested name alg ${alg}`);
}

// node_modules/@peculiar/asn1-android/build/es2015/key_description.js
var IntegerSet_1;
var id_ce_keyDescription = "1.3.6.1.4.1.11129.2.1.17";
var VerifiedBootState;
(function(VerifiedBootState2) {
  VerifiedBootState2[VerifiedBootState2["verified"] = 0] = "verified";
  VerifiedBootState2[VerifiedBootState2["selfSigned"] = 1] = "selfSigned";
  VerifiedBootState2[VerifiedBootState2["unverified"] = 2] = "unverified";
  VerifiedBootState2[VerifiedBootState2["failed"] = 3] = "failed";
})(VerifiedBootState || (VerifiedBootState = {}));
var RootOfTrust = class {
  verifiedBootKey = new OctetString2();
  deviceLocked = false;
  verifiedBootState = VerifiedBootState.verified;
  verifiedBootHash;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: OctetString2 })
], RootOfTrust.prototype, "verifiedBootKey", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Boolean })
], RootOfTrust.prototype, "deviceLocked", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], RootOfTrust.prototype, "verifiedBootState", void 0);
__decorate([
  AsnProp({
    type: OctetString2,
    optional: true
  })
], RootOfTrust.prototype, "verifiedBootHash", void 0);
var IntegerSet = IntegerSet_1 = class IntegerSet2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, IntegerSet_1.prototype);
  }
};
IntegerSet = IntegerSet_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Set,
    itemType: AsnPropTypes.Integer
  })
], IntegerSet);
var AuthorizationList = class {
  purpose;
  algorithm;
  keySize;
  digest;
  padding;
  ecCurve;
  rsaPublicExponent;
  mgfDigest;
  rollbackResistance;
  earlyBootOnly;
  activeDateTime;
  originationExpireDateTime;
  usageExpireDateTime;
  usageCountLimit;
  noAuthRequired;
  userAuthType;
  authTimeout;
  allowWhileOnBody;
  trustedUserPresenceRequired;
  trustedConfirmationRequired;
  unlockedDeviceRequired;
  allApplications;
  applicationId;
  creationDateTime;
  origin;
  rollbackResistant;
  rootOfTrust;
  osVersion;
  osPatchLevel;
  attestationApplicationId;
  attestationIdBrand;
  attestationIdDevice;
  attestationIdProduct;
  attestationIdSerial;
  attestationIdImei;
  attestationIdMeid;
  attestationIdManufacturer;
  attestationIdModel;
  vendorPatchLevel;
  bootPatchLevel;
  deviceUniqueAttestation;
  attestationIdSecondImei;
  moduleHash;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    context: 1,
    type: IntegerSet,
    optional: true
  })
], AuthorizationList.prototype, "purpose", void 0);
__decorate([
  AsnProp({
    context: 2,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "algorithm", void 0);
__decorate([
  AsnProp({
    context: 3,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "keySize", void 0);
__decorate([
  AsnProp({
    context: 5,
    type: IntegerSet,
    optional: true
  })
], AuthorizationList.prototype, "digest", void 0);
__decorate([
  AsnProp({
    context: 6,
    type: IntegerSet,
    optional: true
  })
], AuthorizationList.prototype, "padding", void 0);
__decorate([
  AsnProp({
    context: 10,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "ecCurve", void 0);
__decorate([
  AsnProp({
    context: 200,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "rsaPublicExponent", void 0);
__decorate([
  AsnProp({
    context: 203,
    type: IntegerSet,
    optional: true
  })
], AuthorizationList.prototype, "mgfDigest", void 0);
__decorate([
  AsnProp({
    context: 303,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "rollbackResistance", void 0);
__decorate([
  AsnProp({
    context: 305,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "earlyBootOnly", void 0);
__decorate([
  AsnProp({
    context: 400,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "activeDateTime", void 0);
__decorate([
  AsnProp({
    context: 401,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "originationExpireDateTime", void 0);
__decorate([
  AsnProp({
    context: 402,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "usageExpireDateTime", void 0);
__decorate([
  AsnProp({
    context: 405,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "usageCountLimit", void 0);
__decorate([
  AsnProp({
    context: 503,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "noAuthRequired", void 0);
__decorate([
  AsnProp({
    context: 504,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "userAuthType", void 0);
__decorate([
  AsnProp({
    context: 505,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "authTimeout", void 0);
__decorate([
  AsnProp({
    context: 506,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "allowWhileOnBody", void 0);
__decorate([
  AsnProp({
    context: 507,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "trustedUserPresenceRequired", void 0);
__decorate([
  AsnProp({
    context: 508,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "trustedConfirmationRequired", void 0);
__decorate([
  AsnProp({
    context: 509,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "unlockedDeviceRequired", void 0);
__decorate([
  AsnProp({
    context: 600,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "allApplications", void 0);
__decorate([
  AsnProp({
    context: 601,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "applicationId", void 0);
__decorate([
  AsnProp({
    context: 701,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "creationDateTime", void 0);
__decorate([
  AsnProp({
    context: 702,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "origin", void 0);
__decorate([
  AsnProp({
    context: 703,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "rollbackResistant", void 0);
__decorate([
  AsnProp({
    context: 704,
    type: RootOfTrust,
    optional: true
  })
], AuthorizationList.prototype, "rootOfTrust", void 0);
__decorate([
  AsnProp({
    context: 705,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "osVersion", void 0);
__decorate([
  AsnProp({
    context: 706,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "osPatchLevel", void 0);
__decorate([
  AsnProp({
    context: 709,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationApplicationId", void 0);
__decorate([
  AsnProp({
    context: 710,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdBrand", void 0);
__decorate([
  AsnProp({
    context: 711,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdDevice", void 0);
__decorate([
  AsnProp({
    context: 712,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdProduct", void 0);
__decorate([
  AsnProp({
    context: 713,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdSerial", void 0);
__decorate([
  AsnProp({
    context: 714,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdImei", void 0);
__decorate([
  AsnProp({
    context: 715,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdMeid", void 0);
__decorate([
  AsnProp({
    context: 716,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdManufacturer", void 0);
__decorate([
  AsnProp({
    context: 717,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdModel", void 0);
__decorate([
  AsnProp({
    context: 718,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "vendorPatchLevel", void 0);
__decorate([
  AsnProp({
    context: 719,
    type: AsnPropTypes.Integer,
    optional: true
  })
], AuthorizationList.prototype, "bootPatchLevel", void 0);
__decorate([
  AsnProp({
    context: 720,
    type: AsnPropTypes.Null,
    optional: true
  })
], AuthorizationList.prototype, "deviceUniqueAttestation", void 0);
__decorate([
  AsnProp({
    context: 723,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "attestationIdSecondImei", void 0);
__decorate([
  AsnProp({
    context: 724,
    type: OctetString2,
    optional: true
  })
], AuthorizationList.prototype, "moduleHash", void 0);
var SecurityLevel;
(function(SecurityLevel2) {
  SecurityLevel2[SecurityLevel2["software"] = 0] = "software";
  SecurityLevel2[SecurityLevel2["trustedEnvironment"] = 1] = "trustedEnvironment";
  SecurityLevel2[SecurityLevel2["strongBox"] = 2] = "strongBox";
})(SecurityLevel || (SecurityLevel = {}));
var Version4;
(function(Version5) {
  Version5[Version5["KM2"] = 1] = "KM2";
  Version5[Version5["KM3"] = 2] = "KM3";
  Version5[Version5["KM4"] = 3] = "KM4";
  Version5[Version5["KM4_1"] = 4] = "KM4_1";
  Version5[Version5["keyMint1"] = 100] = "keyMint1";
  Version5[Version5["keyMint2"] = 200] = "keyMint2";
  Version5[Version5["keyMint3"] = 300] = "keyMint3";
  Version5[Version5["keyMint4"] = 400] = "keyMint4";
})(Version4 || (Version4 = {}));
var KeyDescription = class {
  attestationVersion = Version4.KM4;
  attestationSecurityLevel = SecurityLevel.software;
  keymasterVersion = 0;
  keymasterSecurityLevel = SecurityLevel.software;
  attestationChallenge = new OctetString2();
  uniqueId = new OctetString2();
  softwareEnforced = new AuthorizationList();
  teeEnforced = new AuthorizationList();
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], KeyDescription.prototype, "attestationVersion", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], KeyDescription.prototype, "attestationSecurityLevel", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], KeyDescription.prototype, "keymasterVersion", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], KeyDescription.prototype, "keymasterSecurityLevel", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], KeyDescription.prototype, "attestationChallenge", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], KeyDescription.prototype, "uniqueId", void 0);
__decorate([
  AsnProp({ type: AuthorizationList })
], KeyDescription.prototype, "softwareEnforced", void 0);
__decorate([
  AsnProp({ type: AuthorizationList })
], KeyDescription.prototype, "teeEnforced", void 0);
var KeyMintKeyDescription = class _KeyMintKeyDescription {
  attestationVersion = Version4.keyMint4;
  attestationSecurityLevel = SecurityLevel.software;
  keyMintVersion = 0;
  keyMintSecurityLevel = SecurityLevel.software;
  attestationChallenge = new OctetString2();
  uniqueId = new OctetString2();
  softwareEnforced = new AuthorizationList();
  hardwareEnforced = new AuthorizationList();
  constructor(params = {}) {
    Object.assign(this, params);
  }
  toLegacyKeyDescription() {
    return new KeyDescription({
      attestationVersion: this.attestationVersion,
      attestationSecurityLevel: this.attestationSecurityLevel,
      keymasterVersion: this.keyMintVersion,
      keymasterSecurityLevel: this.keyMintSecurityLevel,
      attestationChallenge: this.attestationChallenge,
      uniqueId: this.uniqueId,
      softwareEnforced: this.softwareEnforced,
      teeEnforced: this.hardwareEnforced
    });
  }
  static fromLegacyKeyDescription(keyDesc) {
    return new _KeyMintKeyDescription({
      attestationVersion: keyDesc.attestationVersion,
      attestationSecurityLevel: keyDesc.attestationSecurityLevel,
      keyMintVersion: keyDesc.keymasterVersion,
      keyMintSecurityLevel: keyDesc.keymasterSecurityLevel,
      attestationChallenge: keyDesc.attestationChallenge,
      uniqueId: keyDesc.uniqueId,
      softwareEnforced: keyDesc.softwareEnforced,
      hardwareEnforced: keyDesc.teeEnforced
    });
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], KeyMintKeyDescription.prototype, "attestationVersion", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], KeyMintKeyDescription.prototype, "attestationSecurityLevel", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], KeyMintKeyDescription.prototype, "keyMintVersion", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], KeyMintKeyDescription.prototype, "keyMintSecurityLevel", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], KeyMintKeyDescription.prototype, "attestationChallenge", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], KeyMintKeyDescription.prototype, "uniqueId", void 0);
__decorate([
  AsnProp({ type: AuthorizationList })
], KeyMintKeyDescription.prototype, "softwareEnforced", void 0);
__decorate([
  AsnProp({ type: AuthorizationList })
], KeyMintKeyDescription.prototype, "hardwareEnforced", void 0);

// node_modules/@peculiar/asn1-android/build/es2015/nonstandard.js
var NonStandardAuthorizationList_1;
var NonStandardAuthorization = class NonStandardAuthorization2 extends AuthorizationList {
};
NonStandardAuthorization = __decorate([
  AsnType({ type: AsnTypeTypes.Choice })
], NonStandardAuthorization);
var NonStandardAuthorizationList = NonStandardAuthorizationList_1 = class NonStandardAuthorizationList2 extends AsnArray {
  constructor(items) {
    super(items);
    Object.setPrototypeOf(this, NonStandardAuthorizationList_1.prototype);
  }
  findProperty(key) {
    const prop = this.find((o) => o[key] !== void 0);
    if (prop) {
      return prop[key];
    }
    return void 0;
  }
};
NonStandardAuthorizationList = NonStandardAuthorizationList_1 = __decorate([
  AsnType({
    type: AsnTypeTypes.Sequence,
    itemType: NonStandardAuthorization
  })
], NonStandardAuthorizationList);
var NonStandardKeyDescription = class {
  attestationVersion = Version4.KM4;
  attestationSecurityLevel = SecurityLevel.software;
  keymasterVersion = 0;
  keymasterSecurityLevel = SecurityLevel.software;
  attestationChallenge = new OctetString2();
  uniqueId = new OctetString2();
  softwareEnforced = new NonStandardAuthorizationList();
  teeEnforced = new NonStandardAuthorizationList();
  get keyMintVersion() {
    return this.keymasterVersion;
  }
  set keyMintVersion(value) {
    this.keymasterVersion = value;
  }
  get keyMintSecurityLevel() {
    return this.keymasterSecurityLevel;
  }
  set keyMintSecurityLevel(value) {
    this.keymasterSecurityLevel = value;
  }
  get hardwareEnforced() {
    return this.teeEnforced;
  }
  set hardwareEnforced(value) {
    this.teeEnforced = value;
  }
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], NonStandardKeyDescription.prototype, "attestationVersion", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], NonStandardKeyDescription.prototype, "attestationSecurityLevel", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], NonStandardKeyDescription.prototype, "keymasterVersion", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Enumerated })
], NonStandardKeyDescription.prototype, "keymasterSecurityLevel", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], NonStandardKeyDescription.prototype, "attestationChallenge", void 0);
__decorate([
  AsnProp({ type: OctetString2 })
], NonStandardKeyDescription.prototype, "uniqueId", void 0);
__decorate([
  AsnProp({ type: NonStandardAuthorizationList })
], NonStandardKeyDescription.prototype, "softwareEnforced", void 0);
__decorate([
  AsnProp({ type: NonStandardAuthorizationList })
], NonStandardKeyDescription.prototype, "teeEnforced", void 0);
var NonStandardKeyMintKeyDescription = class NonStandardKeyMintKeyDescription2 extends NonStandardKeyDescription {
  constructor(params = {}) {
    if ("keymasterVersion" in params && !("keyMintVersion" in params)) {
      params.keyMintVersion = params.keymasterVersion;
    }
    if ("keymasterSecurityLevel" in params && !("keyMintSecurityLevel" in params)) {
      params.keyMintSecurityLevel = params.keymasterSecurityLevel;
    }
    if ("teeEnforced" in params && !("hardwareEnforced" in params)) {
      params.hardwareEnforced = params.teeEnforced;
    }
    super(params);
  }
};
NonStandardKeyMintKeyDescription = __decorate([
  AsnType({ type: AsnTypeTypes.Sequence })
], NonStandardKeyMintKeyDescription);

// node_modules/@peculiar/asn1-android/build/es2015/attestation.js
var AttestationPackageInfo = class {
  packageName;
  version;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({ type: AsnPropTypes.OctetString })
], AttestationPackageInfo.prototype, "packageName", void 0);
__decorate([
  AsnProp({ type: AsnPropTypes.Integer })
], AttestationPackageInfo.prototype, "version", void 0);
var AttestationApplicationId = class {
  packageInfos;
  signatureDigests;
  constructor(params = {}) {
    Object.assign(this, params);
  }
};
__decorate([
  AsnProp({
    type: AttestationPackageInfo,
    repeated: "set"
  })
], AttestationApplicationId.prototype, "packageInfos", void 0);
__decorate([
  AsnProp({
    type: AsnPropTypes.OctetString,
    repeated: "set"
  })
], AttestationApplicationId.prototype, "signatureDigests", void 0);

// node_modules/@simplewebauthn/server/esm/registration/verifications/verifyAttestationAndroidKey.js
async function verifyAttestationAndroidKey(options) {
  const { authData, clientDataHash, attStmt, credentialPublicKey, aaguid, rootCertificates } = options;
  const x5c = attStmt.get("x5c");
  const sig = attStmt.get("sig");
  const alg = attStmt.get("alg");
  if (!x5c) {
    throw new Error("No attestation certificate provided in attestation statement (Android Key)");
  }
  if (!sig) {
    throw new Error("No attestation signature provided in attestation statement (Android Key)");
  }
  if (!alg) {
    throw new Error(`Attestation statement did not contain alg (Android Key)`);
  }
  if (!isCOSEAlg(alg)) {
    throw new Error(`Attestation statement contained invalid alg ${alg} (Android Key)`);
  }
  const parsedCert = AsnParser.parse(x5c[0], Certificate);
  const parsedCertPubKey = new Uint8Array(parsedCert.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey);
  const credPubKeyPKCS = convertCOSEtoPKCS(credentialPublicKey);
  if (!isoUint8Array_exports.areEqual(credPubKeyPKCS, parsedCertPubKey)) {
    throw new Error("Credential public key does not equal leaf cert public key (Android Key)");
  }
  const extKeyStore = parsedCert.tbsCertificate.extensions?.find((ext) => ext.extnID === id_ce_keyDescription);
  if (!extKeyStore) {
    throw new Error("Certificate did not contain extKeyStore (Android Key)");
  }
  const parsedExtKeyStore = AsnParser.parse(extKeyStore.extnValue, KeyDescription);
  const { attestationChallenge, teeEnforced, softwareEnforced } = parsedExtKeyStore;
  if (!isoUint8Array_exports.areEqual(new Uint8Array(attestationChallenge.buffer), clientDataHash)) {
    throw new Error("Attestation challenge was not equal to client data hash (Android Key)");
  }
  if (teeEnforced.allApplications !== void 0) {
    throw new Error('teeEnforced contained "allApplications [600]" tag (Android Key)');
  }
  if (softwareEnforced.allApplications !== void 0) {
    throw new Error('teeEnforced contained "allApplications [600]" tag (Android Key)');
  }
  const statement = await MetadataService.getStatement(aaguid);
  if (statement) {
    try {
      await verifyAttestationWithMetadata({
        statement,
        credentialPublicKey,
        x5c,
        attestationStatementAlg: alg
      });
    } catch (err) {
      const _err = err;
      throw new Error(`${_err.message} (Android Key)`, { cause: _err });
    }
  } else {
    const x5cNoRootPEM = x5c.slice(0, -1).map(convertCertBufferToPEM);
    const x5cRootPEM = x5c.slice(-1).map(convertCertBufferToPEM);
    try {
      await validateCertificatePath(x5cNoRootPEM, x5cRootPEM);
    } catch (err) {
      const _err = err;
      throw new Error(`${_err.message} (Android Key)`, { cause: _err });
    }
    if (rootCertificates.length > 0 && rootCertificates.indexOf(x5cRootPEM[0]) < 0) {
      throw new Error("x5c root certificate was not a known root certificate (Android Key)");
    }
  }
  const signatureBase = isoUint8Array_exports.concat([authData, clientDataHash]);
  return verifySignature({
    signature: sig,
    data: signatureBase,
    x509Certificate: x5c[0],
    hashAlgorithm: alg
  });
}

// node_modules/@simplewebauthn/server/esm/registration/verifications/verifyAttestationApple.js
async function verifyAttestationApple(options) {
  const { attStmt, authData, clientDataHash, credentialPublicKey, rootCertificates } = options;
  const x5c = attStmt.get("x5c");
  if (!x5c) {
    throw new Error("No attestation certificate provided in attestation statement (Apple)");
  }
  try {
    await validateCertificatePath(x5c.map(convertCertBufferToPEM), rootCertificates);
  } catch (err) {
    const _err = err;
    throw new Error(`${_err.message} (Apple)`);
  }
  const parsedCredCert = AsnParser.parse(x5c[0], Certificate);
  const { extensions, subjectPublicKeyInfo } = parsedCredCert.tbsCertificate;
  if (!extensions) {
    throw new Error("credCert missing extensions (Apple)");
  }
  const extCertNonce = extensions.find((ext) => ext.extnID === "1.2.840.113635.100.8.2");
  if (!extCertNonce) {
    throw new Error('credCert missing "1.2.840.113635.100.8.2" extension (Apple)');
  }
  const nonceToHash = isoUint8Array_exports.concat([authData, clientDataHash]);
  const nonce = await toHash(nonceToHash);
  const extNonce = new Uint8Array(extCertNonce.extnValue.buffer).slice(6);
  if (!isoUint8Array_exports.areEqual(nonce, extNonce)) {
    throw new Error(`credCert nonce was not expected value (Apple)`);
  }
  const credPubKeyPKCS = convertCOSEtoPKCS(credentialPublicKey);
  const credCertSubjectPublicKey = new Uint8Array(subjectPublicKeyInfo.subjectPublicKey);
  if (!isoUint8Array_exports.areEqual(credPubKeyPKCS, credCertSubjectPublicKey)) {
    throw new Error("Credential public key does not equal credCert public key (Apple)");
  }
  return true;
}

// node_modules/@simplewebauthn/server/esm/registration/verifyRegistrationResponse.js
async function verifyRegistrationResponse(options) {
  const { response, expectedChallenge, expectedOrigin, expectedRPID, expectedType, requireUserPresence = true, requireUserVerification = true, supportedAlgorithmIDs = defaultSupportedAlgorithmIDs, attestationSafetyNetEnforceCTSCheck = true } = options;
  const { id, rawId, type: credentialType, response: attestationResponse } = response;
  if (!id) {
    throw new Error("Missing credential ID");
  }
  if (id !== rawId) {
    throw new Error("Credential ID was not base64url-encoded");
  }
  if (credentialType !== "public-key") {
    throw new Error(`Unexpected credential type ${credentialType}, expected "public-key"`);
  }
  const clientDataJSON = decodeClientDataJSON(attestationResponse.clientDataJSON);
  const { type, origin, challenge, tokenBinding } = clientDataJSON;
  if (Array.isArray(expectedType)) {
    if (!expectedType.includes(type)) {
      const joinedExpectedType = expectedType.join(", ");
      throw new Error(`Unexpected registration response type "${type}", expected one of: ${joinedExpectedType}`);
    }
  } else if (expectedType) {
    if (type !== expectedType) {
      throw new Error(`Unexpected registration response type "${type}", expected "${expectedType}"`);
    }
  } else if (type !== "webauthn.create") {
    throw new Error(`Unexpected registration response type: ${type}`);
  }
  if (typeof expectedChallenge === "function") {
    if (!await expectedChallenge(challenge)) {
      throw new Error(`Custom challenge verifier returned false for registration response challenge "${challenge}"`);
    }
  } else if (challenge !== expectedChallenge) {
    throw new Error(`Unexpected registration response challenge "${challenge}", expected "${expectedChallenge}"`);
  }
  if (Array.isArray(expectedOrigin)) {
    if (!expectedOrigin.includes(origin)) {
      throw new Error(`Unexpected registration response origin "${origin}", expected one of: ${expectedOrigin.join(", ")}`);
    }
  } else {
    if (origin !== expectedOrigin) {
      throw new Error(`Unexpected registration response origin "${origin}", expected "${expectedOrigin}"`);
    }
  }
  if (tokenBinding) {
    if (typeof tokenBinding !== "object") {
      throw new Error(`Unexpected value for TokenBinding "${tokenBinding}"`);
    }
    if (["present", "supported", "not-supported"].indexOf(tokenBinding.status) < 0) {
      throw new Error(`Unexpected tokenBinding.status value of "${tokenBinding.status}"`);
    }
  }
  const attestationObject = isoBase64URL_exports.toBuffer(attestationResponse.attestationObject);
  const decodedAttestationObject = decodeAttestationObject(attestationObject);
  const fmt = decodedAttestationObject.get("fmt");
  const authData = decodedAttestationObject.get("authData");
  const attStmt = decodedAttestationObject.get("attStmt");
  const parsedAuthData = parseAuthenticatorData(authData);
  const { aaguid, rpIdHash, flags, credentialID, counter, credentialPublicKey, extensionsData } = parsedAuthData;
  let matchedRPID;
  if (expectedRPID) {
    let expectedRPIDs = [];
    if (typeof expectedRPID === "string") {
      expectedRPIDs = [expectedRPID];
    } else {
      expectedRPIDs = expectedRPID;
    }
    matchedRPID = await matchExpectedRPID(rpIdHash, expectedRPIDs);
  }
  if (requireUserPresence && !flags.up) {
    throw new Error("User presence was required, but user was not present");
  }
  if (requireUserVerification && !flags.uv) {
    throw new Error("User verification was required, but user could not be verified");
  }
  if (!credentialID) {
    throw new Error("No credential ID was provided by authenticator");
  }
  if (!credentialPublicKey) {
    throw new Error("No public key was provided by authenticator");
  }
  if (!aaguid) {
    throw new Error("No AAGUID was present during registration");
  }
  const decodedPublicKey = decodeCredentialPublicKey(credentialPublicKey);
  const pubKeyAlg = decodedPublicKey.get(COSEKEYS.alg);
  if (typeof pubKeyAlg !== "number") {
    throw new Error("Credential public key was missing numeric alg");
  }
  if (!supportedAlgorithmIDs.includes(pubKeyAlg)) {
    const supported = supportedAlgorithmIDs.join(", ");
    throw new Error(`Unexpected public key alg "${pubKeyAlg}", expected one of "${supported}"`);
  }
  if (isPQCCOSEAlg(pubKeyAlg) && !SettingsService.runtimeSupportsPQC()) {
    throw new PQCNotSupportedError(pubKeyAlg);
  }
  const clientDataHash = await toHash(isoBase64URL_exports.toBuffer(attestationResponse.clientDataJSON));
  const rootCertificates = SettingsService.getRootCertificates({ identifier: fmt });
  const verifierOpts = {
    aaguid,
    attStmt,
    authData,
    clientDataHash,
    credentialID,
    credentialPublicKey,
    rootCertificates,
    rpIdHash,
    attestationSafetyNetEnforceCTSCheck
  };
  let verified = false;
  if (fmt === "fido-u2f") {
    verified = await verifyAttestationFIDOU2F(verifierOpts);
  } else if (fmt === "packed") {
    verified = await verifyAttestationPacked(verifierOpts);
  } else if (fmt === "android-safetynet") {
    verified = await verifyAttestationAndroidSafetyNet(verifierOpts);
  } else if (fmt === "android-key") {
    verified = await verifyAttestationAndroidKey(verifierOpts);
  } else if (fmt === "tpm") {
    verified = await verifyAttestationTPM(verifierOpts);
  } else if (fmt === "apple") {
    verified = await verifyAttestationApple(verifierOpts);
  } else if (fmt === "none") {
    if (attStmt.size > 0) {
      throw new Error("None attestation had unexpected attestation statement");
    }
    verified = true;
  } else {
    throw new Error(`Unsupported Attestation Format: ${fmt}`);
  }
  if (!verified) {
    return { verified: false };
  }
  const { credentialDeviceType, credentialBackedUp } = parseBackupFlags(flags);
  return {
    verified: true,
    registrationInfo: {
      fmt,
      aaguid: convertAAGUIDToString(aaguid),
      credentialType,
      credential: {
        id: isoBase64URL_exports.fromBuffer(credentialID),
        publicKey: credentialPublicKey,
        counter,
        transports: response.response.transports
      },
      attestationObject,
      userVerified: flags.uv,
      credentialDeviceType,
      credentialBackedUp,
      origin: clientDataJSON.origin,
      rpID: matchedRPID,
      authenticatorExtensionResults: extensionsData
    }
  };
}

// node_modules/@simplewebauthn/server/esm/authentication/generateAuthenticationOptions.js
async function generateAuthenticationOptions(options) {
  const { allowCredentials, challenge = await generateChallenge(), timeout = 6e4, userVerification = "preferred", extensions, rpID } = options;
  let _challenge = challenge;
  if (typeof _challenge === "string") {
    _challenge = isoUint8Array_exports.fromUTF8String(_challenge);
  }
  return {
    rpId: rpID,
    challenge: isoBase64URL_exports.fromBuffer(_challenge),
    allowCredentials: allowCredentials?.map((cred) => {
      if (!isoBase64URL_exports.isBase64URL(cred.id)) {
        throw new Error(`allowCredential id "${cred.id}" is not a valid base64url string`);
      }
      return {
        ...cred,
        id: isoBase64URL_exports.trimPadding(cred.id),
        type: "public-key"
      };
    }),
    timeout,
    userVerification,
    extensions
  };
}

// node_modules/@simplewebauthn/server/esm/authentication/verifyAuthenticationResponse.js
async function verifyAuthenticationResponse(options) {
  const { response, expectedChallenge, expectedOrigin, expectedRPID, expectedType, expectedTopOrigin, credential, requireUserVerification = true, advancedFIDOConfig } = options;
  const { id, rawId, type: credentialType, response: assertionResponse } = response;
  if (!id) {
    throw new Error("Missing credential ID");
  }
  if (id !== rawId) {
    throw new Error("Credential ID was not base64url-encoded");
  }
  if (credentialType !== "public-key") {
    throw new Error(`Unexpected credential type ${credentialType}, expected "public-key"`);
  }
  if (!response) {
    throw new Error("Credential missing response");
  }
  if (typeof assertionResponse?.clientDataJSON !== "string") {
    throw new Error("Credential response clientDataJSON was not a string");
  }
  const clientDataJSON = decodeClientDataJSON(assertionResponse.clientDataJSON);
  const { type, origin, challenge, tokenBinding, crossOrigin, topOrigin } = clientDataJSON;
  if (Array.isArray(expectedType)) {
    if (!expectedType.includes(type)) {
      const joinedExpectedType = expectedType.join(", ");
      throw new Error(`Unexpected authentication response type "${type}", expected one of: ${joinedExpectedType}`);
    }
  } else if (expectedType) {
    if (type !== expectedType) {
      throw new Error(`Unexpected authentication response type "${type}", expected "${expectedType}"`);
    }
  } else if (type !== "webauthn.get") {
    throw new Error(`Unexpected authentication response type: ${type}`);
  }
  if (typeof expectedChallenge === "function") {
    if (!await expectedChallenge(challenge)) {
      throw new Error(`Custom challenge verifier returned false for registration response challenge "${challenge}"`);
    }
  } else if (challenge !== expectedChallenge) {
    throw new Error(`Unexpected authentication response challenge "${challenge}", expected "${expectedChallenge}"`);
  }
  if (crossOrigin) {
    if (topOrigin) {
      if (!expectedTopOrigin) {
        throw new Error(`Detected cross-origin authentication response from top origin of "${topOrigin}", but a value for \`expectedTopOrigin\` was not specified when calling \`verifyAuthenticationResponse()\``);
      }
      if (Array.isArray(expectedTopOrigin)) {
        if (!expectedTopOrigin.includes(topOrigin)) {
          const joinedExpectedTopOrigin = expectedTopOrigin.join(", ");
          throw new Error(`Unexpected cross-origin authentication response top origin of "${topOrigin}", expected one of: ${joinedExpectedTopOrigin}`);
        }
      } else {
        if (topOrigin !== expectedTopOrigin) {
          throw new Error(`Unexpected cross-origin authentication response top origin of "${topOrigin}", expected: ${expectedTopOrigin}`);
        }
      }
    }
  } else {
    if (topOrigin) {
      throw new Error(`Unexpected top origin of "${topOrigin}" within a non-cross-origin authentication response. This error should be reported to the browser vendor as a WebAuthn specification violation with a link to https://w3c.github.io/webauthn/#dom-collectedclientdata-toporigin`);
    }
  }
  if (Array.isArray(expectedOrigin)) {
    if (!expectedOrigin.includes(origin)) {
      const joinedExpectedOrigin = expectedOrigin.join(", ");
      throw new Error(`Unexpected authentication response origin "${origin}", expected one of: ${joinedExpectedOrigin}`);
    }
  } else {
    if (origin !== expectedOrigin) {
      throw new Error(`Unexpected authentication response origin "${origin}", expected "${expectedOrigin}"`);
    }
  }
  if (!isoBase64URL_exports.isBase64URL(assertionResponse.authenticatorData)) {
    throw new Error("Credential response authenticatorData was not a base64url string");
  }
  if (!isoBase64URL_exports.isBase64URL(assertionResponse.signature)) {
    throw new Error("Credential response signature was not a base64url string");
  }
  if (assertionResponse.userHandle && typeof assertionResponse.userHandle !== "string") {
    throw new Error("Credential response userHandle was not a string");
  }
  if (tokenBinding) {
    if (typeof tokenBinding !== "object") {
      throw new Error("ClientDataJSON tokenBinding was not an object");
    }
    if (["present", "supported", "notSupported"].indexOf(tokenBinding.status) < 0) {
      throw new Error(`Unexpected tokenBinding status ${tokenBinding.status}`);
    }
  }
  const authDataBuffer = isoBase64URL_exports.toBuffer(assertionResponse.authenticatorData);
  const parsedAuthData = parseAuthenticatorData(authDataBuffer);
  const { rpIdHash, flags, counter, extensionsData } = parsedAuthData;
  let expectedRPIDs = [];
  if (typeof expectedRPID === "string") {
    expectedRPIDs = [expectedRPID];
  } else {
    expectedRPIDs = expectedRPID;
  }
  const matchedRPID = await matchExpectedRPID(rpIdHash, expectedRPIDs);
  if (advancedFIDOConfig !== void 0) {
    const { userVerification: fidoUserVerification } = advancedFIDOConfig;
    if (fidoUserVerification === "required") {
      if (!flags.uv) {
        throw new Error("User verification required, but user could not be verified");
      }
    } else if (fidoUserVerification === "preferred" || fidoUserVerification === "discouraged") {
    }
  } else {
    if (!flags.up) {
      throw new Error("User not present during authentication");
    }
    if (requireUserVerification && !flags.uv) {
      throw new Error("User verification required, but user could not be verified");
    }
  }
  const clientDataHash = await toHash(isoBase64URL_exports.toBuffer(assertionResponse.clientDataJSON));
  const signatureBase = isoUint8Array_exports.concat([authDataBuffer, clientDataHash]);
  const signature = isoBase64URL_exports.toBuffer(assertionResponse.signature);
  if ((counter > 0 || credential.counter > 0) && counter <= credential.counter) {
    throw new Error(`Response counter value ${counter} was lower than expected ${credential.counter}`);
  }
  const decodedPublicKey = decodeCredentialPublicKey(credential.publicKey);
  const pubKeyAlg = decodedPublicKey.get(COSEKEYS.alg);
  if (typeof pubKeyAlg !== "number") {
    throw new Error("Credential public key was missing numeric alg");
  }
  if (isPQCCOSEAlg(pubKeyAlg) && !SettingsService.runtimeSupportsPQC()) {
    throw new PQCNotSupportedError(pubKeyAlg);
  }
  const { credentialDeviceType, credentialBackedUp } = parseBackupFlags(flags);
  const toReturn = {
    verified: await verifySignature({
      signature,
      data: signatureBase,
      credentialPublicKey: credential.publicKey
    }),
    authenticationInfo: {
      newCounter: counter,
      credentialID: credential.id,
      userVerified: flags.uv,
      credentialDeviceType,
      credentialBackedUp,
      authenticatorExtensionResults: extensionsData,
      origin: clientDataJSON.origin,
      rpID: matchedRPID
    }
  };
  return toReturn;
}

// src/lib/webauthn.js
function rpConfigFor(url) {
  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return { rpID: "localhost", origin: "http://localhost:8788" };
  }
  return {
    rpID: "entotools.org",
    origin: ["https://entotools.org", "https://www.entotools.org"]
  };
}
function decodeClientDataChallenge(credential) {
  const clientDataJSON = credential && credential.response && credential.response.clientDataJSON;
  if (!clientDataJSON) return null;
  try {
    const json = JSON.parse(base64UrlDecodeToString(clientDataJSON));
    return json.challenge || null;
  } catch (e) {
    return null;
  }
}
function base64UrlDecodeToString(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
  const binary2 = atob(padded);
  return binary2;
}

// src/lib/db.js
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
async function createUser(env, { id, label }) {
  await env.DB.prepare("INSERT INTO users (id, label, created_at) VALUES (?, ?, ?)").bind(id, label, nowIso()).run();
}
async function getUser(env, id) {
  return env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
}
async function getUserByLabel(env, label) {
  return env.DB.prepare("SELECT id, label, created_at FROM users WHERE label = ?").bind(label).first();
}
async function searchUsers(env, query) {
  const like = `%${query}%`;
  const { results } = await env.DB.prepare(
    "SELECT id, label, created_at FROM users WHERE label LIKE ? OR id LIKE ? ORDER BY created_at DESC LIMIT 50"
  ).bind(like, like).all();
  return results;
}
async function getUserDetail(env, userId) {
  const user = await getUser(env, userId);
  if (!user) return null;
  const { results: credentials } = await env.DB.prepare(
    "SELECT credential_id, device_label, created_at, last_used_at FROM credentials WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();
  const { results: sessions } = await env.DB.prepare(
    "SELECT s.id, s.created_at, s.expires_at, s.last_seen_at, c.device_label FROM sessions s LEFT JOIN credentials c ON c.credential_id = s.credential_id WHERE s.user_id = ? ORDER BY s.created_at DESC"
  ).bind(userId).all();
  return { user, credentials, sessions };
}
async function exportUserData(env, userId) {
  const user = await getUser(env, userId);
  if (!user) return null;
  const { results: credentials } = await env.DB.prepare(
    "SELECT device_label, created_at, last_used_at FROM credentials WHERE user_id = ? ORDER BY created_at"
  ).bind(userId).all();
  const { results: flags } = await env.DB.prepare(
    "SELECT flag_key, enabled_at FROM user_feature_flags WHERE user_id = ?"
  ).bind(userId).all();
  const collectionRow = await getCollection(env, userId);
  let collection = null;
  if (collectionRow) {
    try {
      collection = JSON.parse(collectionRow.envelope);
    } catch (e) {
      collection = { unparseable: true };
    }
  }
  return {
    account: { id: user.id, email: user.label, created_at: user.created_at },
    passkeys: credentials,
    feature_flags: flags,
    collection,
    collection_updated_at: collectionRow ? collectionRow.updated_at : null
  };
}
async function deleteUser(env, userId) {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM credentials WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM user_feature_flags WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM collections WHERE user_id = ?").bind(userId),
    env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId)
  ]);
}
async function saveCredential(env, { credentialId, userId, publicKey, signCount, deviceLabel }) {
  await env.DB.prepare(
    "INSERT INTO credentials (credential_id, user_id, public_key, sign_count, device_label, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(credentialId, userId, publicKey, signCount, deviceLabel || "Unnamed device", nowIso()).run();
}
async function getUserCredentials(env, userId) {
  const { results } = await env.DB.prepare(
    "SELECT credential_id FROM credentials WHERE user_id = ?"
  ).bind(userId).all();
  return results;
}
async function getCredential(env, credentialId) {
  return env.DB.prepare("SELECT * FROM credentials WHERE credential_id = ?").bind(credentialId).first();
}
async function updateCredentialCounter(env, credentialId, newCounter) {
  await env.DB.prepare("UPDATE credentials SET sign_count = ?, last_used_at = ? WHERE credential_id = ?").bind(newCounter, nowIso(), credentialId).run();
}
async function deleteAllUserCredentials(env, userId) {
  await env.DB.prepare("DELETE FROM credentials WHERE user_id = ?").bind(userId).run();
}
async function createSession(env, { id, userId, expiresAt, credentialId }) {
  const now = nowIso();
  await env.DB.prepare(
    "INSERT INTO sessions (id, user_id, created_at, expires_at, last_seen_at, credential_id, reauth_at) VALUES (?, ?, ?, ?, ?, ?, NULL)"
  ).bind(id, userId, now, expiresAt, now, credentialId || null).run();
}
async function getSession(env, id) {
  return env.DB.prepare("SELECT * FROM sessions WHERE id = ?").bind(id).first();
}
async function touchSession(env, id) {
  await env.DB.prepare("UPDATE sessions SET last_seen_at = ? WHERE id = ?").bind(nowIso(), id).run();
}
async function markSessionReauth(env, id) {
  await env.DB.prepare("UPDATE sessions SET reauth_at = ? WHERE id = ?").bind(nowIso(), id).run();
}
async function consumeSessionReauth(env, id, notBeforeIso) {
  const res = await env.DB.prepare("UPDATE sessions SET reauth_at = NULL WHERE id = ? AND reauth_at IS NOT NULL AND reauth_at >= ?").bind(id, notBeforeIso).run();
  return res && res.meta ? res.meta.changes || 0 : 0;
}
async function listOwnSessions(env, userId) {
  const { results } = await env.DB.prepare(
    "SELECT s.id, s.created_at, s.last_seen_at, s.expires_at, c.device_label FROM sessions s LEFT JOIN credentials c ON c.credential_id = s.credential_id WHERE s.user_id = ? AND s.expires_at > ? ORDER BY COALESCE(s.last_seen_at, s.created_at) DESC"
  ).bind(userId, nowIso()).all();
  return results;
}
async function deleteOtherSessions(env, userId, keepId) {
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id != ?").bind(userId, keepId).run();
}
async function deleteSessionsForCredential(env, userId, credentialId, keepId) {
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND credential_id = ? AND id != ?").bind(userId, credentialId, keepId).run();
}
async function deleteSession(env, id) {
  await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
}
async function deleteAllUserSessions(env, userId) {
  await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
}
async function getStats(env) {
  const now = nowIso();
  const rows = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS n FROM users"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM credentials"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM sessions WHERE expires_at > ?").bind(now),
    env.DB.prepare("SELECT COUNT(*) AS n FROM sessions"),
    env.DB.prepare("SELECT COUNT(*) AS n, COALESCE(SUM(LENGTH(envelope)), 0) AS bytes FROM collections"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM admin_audit_log"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM feature_flags"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM user_feature_flags"),
    env.DB.prepare("SELECT MAX(created_at) AS at FROM users"),
    env.DB.prepare("SELECT MAX(last_used_at) AS at FROM credentials")
  ]);
  const first = (i) => rows[i] && rows[i].results && rows[i].results[0] || {};
  return {
    users: first(0).n || 0,
    credentials: first(1).n || 0,
    sessionsActive: first(2).n || 0,
    sessionsTotal: first(3).n || 0,
    collections: first(4).n || 0,
    collectionBytes: first(4).bytes || 0,
    auditEntries: first(5).n || 0,
    featureFlags: first(6).n || 0,
    flagAssignments: first(7).n || 0,
    lastSignupAt: first(8).at || null,
    lastLoginAt: first(9).at || null
  };
}
async function writeAuditLog(env, { adminIdentity, action, targetUserId, detail }) {
  await env.DB.prepare(
    "INSERT INTO admin_audit_log (id, admin_identity, action, target_user_id, detail, created_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(crypto.randomUUID(), adminIdentity, action, targetUserId || null, detail || null, nowIso()).run();
}
async function getAuditLog(env, limit = 100) {
  const { results } = await env.DB.prepare(
    "SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT ?"
  ).bind(limit).all();
  return results;
}
async function listFlags(env) {
  const { results } = await env.DB.prepare("SELECT * FROM feature_flags ORDER BY flag_key").all();
  return results;
}
async function defineFlag(env, { key, description }) {
  await env.DB.prepare(
    "INSERT INTO feature_flags (flag_key, description, created_at) VALUES (?, ?, ?) ON CONFLICT(flag_key) DO UPDATE SET description = excluded.description"
  ).bind(key, description || null, nowIso()).run();
}
async function deleteFlag(env, flagKey) {
  await env.DB.prepare("DELETE FROM user_feature_flags WHERE flag_key = ?").bind(flagKey).run();
  await env.DB.prepare("DELETE FROM feature_flags WHERE flag_key = ?").bind(flagKey).run();
}
async function listFlagUsers(env, flagKey) {
  const { results } = await env.DB.prepare(
    "SELECT u.id, u.label, f.enabled_at FROM user_feature_flags f JOIN users u ON u.id = f.user_id WHERE f.flag_key = ? ORDER BY f.enabled_at DESC"
  ).bind(flagKey).all();
  return results;
}
async function getUserFlags(env, userId) {
  const { results } = await env.DB.prepare(
    "SELECT flag_key FROM user_feature_flags WHERE user_id = ?"
  ).bind(userId).all();
  return results.map((r) => r.flag_key);
}
async function enableUserFlag(env, userId, flagKey) {
  await env.DB.prepare(
    "INSERT INTO user_feature_flags (user_id, flag_key, enabled_at) VALUES (?, ?, ?) ON CONFLICT(user_id, flag_key) DO NOTHING"
  ).bind(userId, flagKey, nowIso()).run();
}
async function disableUserFlag(env, userId, flagKey) {
  await env.DB.prepare("DELETE FROM user_feature_flags WHERE user_id = ? AND flag_key = ?").bind(userId, flagKey).run();
}
async function getCollection(env, userId) {
  return env.DB.prepare("SELECT * FROM collections WHERE user_id = ?").bind(userId).first();
}
async function saveCollection(env, userId, envelopeJson, revision) {
  await env.DB.prepare(
    "INSERT INTO collections (user_id, envelope, revision, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET envelope = excluded.envelope, revision = excluded.revision, updated_at = excluded.updated_at"
  ).bind(userId, envelopeJson, revision, nowIso()).run();
}
async function getOwnCredentials(env, userId) {
  const { results } = await env.DB.prepare(
    "SELECT credential_id, device_label, created_at, last_used_at FROM credentials WHERE user_id = ? ORDER BY created_at DESC"
  ).bind(userId).all();
  return results;
}
async function deleteOwnCredential(env, userId, credentialId) {
  await env.DB.prepare("DELETE FROM credentials WHERE user_id = ? AND credential_id = ?").bind(userId, credentialId).run();
}
async function countUserCredentials(env, userId) {
  const row = await env.DB.prepare("SELECT COUNT(*) as n FROM credentials WHERE user_id = ?").bind(userId).first();
  return row ? row.n : 0;
}
async function renameCredential(env, userId, credentialId, deviceLabel) {
  const res = await env.DB.prepare("UPDATE credentials SET device_label = ? WHERE user_id = ? AND credential_id = ?").bind(deviceLabel, userId, credentialId).run();
  return res && res.meta ? res.meta.changes || 0 : 0;
}
async function purgeExpiredSessions(env) {
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at < ?").bind(nowIso()).run();
}

// src/lib/ratelimit.js
var LIMITS = {
  search: { limit: 60, windowSeconds: 3600, applies: "POST /api/search" },
  feedback: { limit: 5, windowSeconds: 3600, applies: "POST /api/feedback" },
  status: { limit: 120, windowSeconds: 3600, applies: "GET /api/status/check" },
  ceremony: { limit: 20, windowSeconds: 3600, applies: "Passkey ceremony starts (register / login / re-auth options)" },
  signupAttempts: { limit: 6, windowSeconds: 7200, applies: "Sign-up attempts (register/options for a new account)" },
  signupAccounts: { limit: 3, windowSeconds: 7200, applies: "Accounts created (also mirrored in a per-browser cookie)" }
};
function maskIp(ip) {
  if (!ip) return "(unknown)";
  if (ip.includes(":")) return ip.split(":").slice(0, 2).join(":") + "::\u2026";
  return ip.split(".").slice(0, 3).join(".") + ".x";
}
async function hashIp(ip) {
  try {
    const data = new TextEncoder().encode(ip);
    const digest2 = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest2).slice(0, 8)).map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch (e) {
    return "nohash";
  }
}
async function bucketKey(ip, prefix, windowSeconds) {
  const bucket = Math.floor(Date.now() / 1e3 / windowSeconds);
  return `${prefix}:${bucket}:${await hashIp(ip)}`;
}
async function readCount(env, key) {
  try {
    return parseInt(await env.GEOCODE_CACHE.get(key), 10) || 0;
  } catch (e) {
    return null;
  }
}
async function rateLimited(env, ip, prefix, limit, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return false;
  const key = await bucketKey(ip, prefix, windowSeconds);
  const count = await readCount(env, key);
  if (count === null) return false;
  if (count >= limit) return true;
  try {
    await env.GEOCODE_CACHE.put(key, String(count + 1), { expirationTtl: windowSeconds });
  } catch (e) {
  }
  return false;
}
async function atRateLimit(env, ip, prefix, limit, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return false;
  const count = await readCount(env, await bucketKey(ip, prefix, windowSeconds));
  return count !== null && count >= limit;
}
async function bumpRateLimit(env, ip, prefix, windowSeconds) {
  if (!ip || !env.GEOCODE_CACHE) return;
  const key = await bucketKey(ip, prefix, windowSeconds);
  const count = await readCount(env, key) || 0;
  try {
    await env.GEOCODE_CACHE.put(key, String(count + 1), { expirationTtl: windowSeconds });
  } catch (e) {
  }
}

// src/routes/account.js
var SIGNUP_WINDOW_SECONDS = LIMITS.signupAccounts.windowSeconds;
var SIGNUP_ATTEMPTS_PER_WINDOW = LIMITS.signupAttempts.limit;
var SIGNUP_ACCOUNTS_PER_WINDOW = LIMITS.signupAccounts.limit;
var SIGNUP_COOKIE = "ento_su";
function signupCookieCount(request) {
  const m = (request.headers.get("Cookie") || "").match(/(?:^|;\s*)ento_su=(\d+)/);
  return m ? parseInt(m[1], 10) || 0 : 0;
}
function signupCookie(count, url) {
  return `${SIGNUP_COOKIE}=${count}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SIGNUP_WINDOW_SECONDS}${cookieDomainAttr(url)}`;
}
var SIGNUP_LIMIT_MESSAGE = "Too many accounts have been created from your network recently. Please try again in a couple of hours.";
var EMAIL_TAKEN_MESSAGE = "An account with this email already exists. Sign in with your passkey instead \u2014 or, if you\u2019ve lost it, contact an admin for a re-registration link.";
var CHALLENGE_TTL_SECONDS = 300;
var SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
var REREGISTER_TOKEN_TTL_SECONDS = 15 * 60;
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
var SESSION_IDLE_SECONDS = 60 * 60 * 24 * 7;
var SESSION_TOUCH_SECONDS = 60 * 60;
var REAUTH_WINDOW_SECONDS = 2 * 60;
async function consumeReauth(env, session) {
  const notBefore = new Date(Date.now() - REAUTH_WINDOW_SECONDS * 1e3).toISOString();
  return await consumeSessionReauth(env, session.id, notBefore) > 0;
}
var reauthRequired = () => jsonResponse({ error: "reauth_required" }, 403);
function jsonResponse(data, status = 200, extraHeaders = {}) {
  const headers = new Headers({ "Content-Type": "application/json" });
  for (const [name, value] of Object.entries(extraHeaders)) {
    for (const v of Array.isArray(value) ? value : [value]) headers.append(name, v);
  }
  return new Response(JSON.stringify(data), { status, headers });
}
function cookieDomainAttr(url) {
  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1") return "";
  return "; Domain=entotools.org";
}
var HOST_ONLY_CLEAR = "ento_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
function sessionCookies(id, maxAgeSeconds, url) {
  const domain = cookieDomainAttr(url);
  const set = `ento_session=${id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}${domain}`;
  return domain ? [set, HOST_ONLY_CLEAR] : [set];
}
function clearSessionCookies(url) {
  const domain = cookieDomainAttr(url);
  const clear = `ento_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0${domain}`;
  return domain ? [clear, HOST_ONLY_CLEAR] : [clear];
}
function getSessionIdsFromCookie(request) {
  const cookie = request.headers.get("Cookie") || "";
  const ids = [];
  const re = /(?:^|;\s*)ento_session=([^;]*)/g;
  let m;
  while ((m = re.exec(cookie)) !== null) if (m[1]) ids.push(m[1]);
  return ids;
}
async function storeChallenge(env, challenge, contextJson) {
  await env.GEOCODE_CACHE.put(`webauthn-challenge:${challenge}`, contextJson, {
    expirationTtl: CHALLENGE_TTL_SECONDS
  });
}
async function consumeChallenge(env, challenge) {
  const key = `webauthn-challenge:${challenge}`;
  const value = await env.GEOCODE_CACHE.get(key);
  if (value) await env.GEOCODE_CACHE.delete(key);
  return value;
}
async function requireSession(request, env) {
  const now = Date.now();
  for (const sessionId of getSessionIdsFromCookie(request)) {
    const session = await getSession(env, sessionId);
    if (!session) continue;
    if (Date.parse(session.expires_at) < now) continue;
    const lastSeen = Date.parse(session.last_seen_at || session.created_at) || 0;
    if (now - lastSeen > SESSION_IDLE_SECONDS * 1e3) {
      try {
        await deleteSession(env, sessionId);
      } catch (e) {
      }
      continue;
    }
    if (now - lastSeen > SESSION_TOUCH_SECONDS * 1e3) {
      try {
        await touchSession(env, sessionId);
      } catch (e) {
      }
    }
    return session;
  }
  return null;
}
async function handleRegisterOptions(request, env) {
  const url = new URL(request.url);
  const { rpID } = rpConfigFor(url);
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  let userId, label, isNewUser, viaToken = false;
  const session = await requireSession(request, env);
  if (session) {
    if (!await consumeReauth(env, session)) return reauthRequired();
    const existing = await getUser(env, session.user_id);
    if (!existing) return jsonResponse({ error: "Account not found." }, 404);
    userId = existing.id;
    label = existing.label;
    isNewUser = false;
  } else if (body.reregisterToken) {
    const existingUserId = await env.GEOCODE_CACHE.get(`reregister-token:${body.reregisterToken}`);
    if (!existingUserId) {
      return jsonResponse({ error: "This re-registration link has expired or already been used." }, 400);
    }
    await env.GEOCODE_CACHE.delete(`reregister-token:${body.reregisterToken}`);
    const existing = await getUser(env, existingUserId);
    if (!existing) return jsonResponse({ error: "Account not found." }, 404);
    userId = existing.id;
    label = existing.label;
    isNewUser = false;
    viaToken = true;
  } else {
    label = (body.label || "").trim().toLowerCase().slice(0, 200);
    if (!EMAIL_RE.test(label)) return jsonResponse({ error: "A valid email address is required." }, 400);
    const ip = request.headers.get("CF-Connecting-IP") || "";
    if (await rateLimited(env, ip, "signup-att", SIGNUP_ATTEMPTS_PER_WINDOW, SIGNUP_WINDOW_SECONDS) || await atRateLimit(env, ip, "signup-ok", SIGNUP_ACCOUNTS_PER_WINDOW, SIGNUP_WINDOW_SECONDS) || signupCookieCount(request) >= SIGNUP_ACCOUNTS_PER_WINDOW) {
      console.warn("[Worker:account] sign-up limit reached for IP:", maskIp(ip));
      return jsonResponse({ error: SIGNUP_LIMIT_MESSAGE }, 429);
    }
    if (await getUserByLabel(env, label)) return jsonResponse({ error: EMAIL_TAKEN_MESSAGE }, 409);
    userId = crypto.randomUUID();
    isNewUser = true;
  }
  const existingCredentials = isNewUser ? [] : await getUserCredentials(env, userId);
  const options = await generateRegistrationOptions({
    rpName: "EntoTools",
    rpID,
    userName: label,
    userID: new TextEncoder().encode(userId),
    attestationType: "none",
    // userVerification 'required' (R3): possession of the authenticator alone
    // is not enough — the platform must have checked biometrics/PIN.
    authenticatorSelection: { residentKey: "required", userVerification: "required" },
    // Stop the same physical authenticator being registered twice for one account.
    excludeCredentials: (existingCredentials || []).map((c) => ({ id: c.credential_id }))
  });
  await storeChallenge(env, options.challenge, JSON.stringify({ userId, label, isNewUser, viaToken }));
  return jsonResponse(options);
}
async function handleRegisterVerify(request, env) {
  const url = new URL(request.url);
  const { rpID, origin } = rpConfigFor(url);
  let credential;
  try {
    credential = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const challenge = decodeClientDataChallenge(credential);
  if (!challenge) return jsonResponse({ error: "Malformed passkey response." }, 400);
  const pendingRaw = await consumeChallenge(env, challenge);
  if (!pendingRaw) return jsonResponse({ error: "Registration expired. Please try again." }, 400);
  const pending = JSON.parse(pendingRaw);
  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true
    });
  } catch (err) {
    console.error("[Worker:account] registration verify failed:", err.message);
    return jsonResponse({ error: "Could not verify passkey." }, 400);
  }
  if (!verification.verified || !verification.registrationInfo) {
    return jsonResponse({ error: "Passkey verification failed." }, 400);
  }
  const { credential: regCred } = verification.registrationInfo;
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (pending.isNewUser) {
    if (await atRateLimit(env, ip, "signup-ok", SIGNUP_ACCOUNTS_PER_WINDOW, SIGNUP_WINDOW_SECONDS)) {
      return jsonResponse({ error: SIGNUP_LIMIT_MESSAGE }, 429);
    }
    if (await getUserByLabel(env, pending.label)) return jsonResponse({ error: EMAIL_TAKEN_MESSAGE }, 409);
    try {
      await createUser(env, { id: pending.userId, label: pending.label });
    } catch (err) {
      if (/UNIQUE/i.test(err.message || "")) return jsonResponse({ error: EMAIL_TAKEN_MESSAGE }, 409);
      throw err;
    }
    await bumpRateLimit(env, ip, "signup-ok", SIGNUP_WINDOW_SECONDS);
  }
  await saveCredential(env, {
    credentialId: regCred.id,
    userId: pending.userId,
    publicKey: regCred.publicKey,
    signCount: regCred.counter,
    deviceLabel: "Unnamed device"
  });
  if (!pending.isNewUser && !pending.viaToken) {
    return jsonResponse({ success: true });
  }
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1e3).toISOString();
  await createSession(env, { id: sessionId, userId: pending.userId, expiresAt, credentialId: regCred.id });
  const cookies = sessionCookies(sessionId, SESSION_TTL_SECONDS, url);
  if (pending.isNewUser) cookies.push(signupCookie(signupCookieCount(request) + 1, url));
  return jsonResponse({ success: true }, 200, { "Set-Cookie": cookies });
}
async function handleLoginOptions(request, env) {
  const url = new URL(request.url);
  const { rpID } = rpConfigFor(url);
  const options = await generateAuthenticationOptions({ rpID, userVerification: "required" });
  await storeChallenge(env, options.challenge, "1");
  return jsonResponse(options);
}
async function handleLoginVerify(request, env) {
  const url = new URL(request.url);
  const { rpID, origin } = rpConfigFor(url);
  let credential;
  try {
    credential = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const challenge = decodeClientDataChallenge(credential);
  if (!challenge) return jsonResponse({ error: "Malformed passkey response." }, 400);
  const pending = await consumeChallenge(env, challenge);
  if (pending !== "1") return jsonResponse({ error: "Login expired. Please try again." }, 400);
  const credentialId = credential.id;
  const stored = credentialId ? await getCredential(env, credentialId) : null;
  if (!stored) return jsonResponse({ error: "Unknown passkey." }, 400);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: {
        id: stored.credential_id,
        publicKey: new Uint8Array(stored.public_key),
        counter: stored.sign_count
      }
    });
  } catch (err) {
    console.error("[Worker:account] login verify failed:", err.message);
    return jsonResponse({ error: "Could not verify passkey." }, 400);
  }
  if (!verification.verified) return jsonResponse({ error: "Passkey verification failed." }, 400);
  await updateCredentialCounter(env, stored.credential_id, verification.authenticationInfo.newCounter);
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1e3).toISOString();
  await createSession(env, { id: sessionId, userId: stored.user_id, expiresAt, credentialId: stored.credential_id });
  try {
    await purgeExpiredSessions(env);
  } catch (e) {
    console.warn("[Worker:account] session purge failed:", e.message);
  }
  return jsonResponse({ success: true }, 200, { "Set-Cookie": sessionCookies(sessionId, SESSION_TTL_SECONDS, url) });
}
var NO_STORE = { "Cache-Control": "no-store" };
async function handleSession(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ user: null }, 401, NO_STORE);
  const user = await getUser(env, session.user_id);
  return jsonResponse({ user: user ? { id: user.id, label: user.label } : null }, 200, NO_STORE);
}
async function handleLogout(request, env) {
  const url = new URL(request.url);
  for (const sessionId of getSessionIdsFromCookie(request)) await deleteSession(env, sessionId);
  return jsonResponse({ success: true }, 200, { "Set-Cookie": clearSessionCookies(url) });
}
async function handleListCredentials(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401, NO_STORE);
  const credentials = await getOwnCredentials(env, session.user_id);
  return jsonResponse({ credentials }, 200, NO_STORE);
}
async function handleDeleteCredential(request, env, credentialId) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  if (!await consumeReauth(env, session)) return reauthRequired();
  const count = await countUserCredentials(env, session.user_id);
  if (count <= 1) {
    return jsonResponse({ error: "This is your only passkey \u2014 add another before removing it, or you\u2019ll be locked out." }, 400);
  }
  await deleteOwnCredential(env, session.user_id, credentialId);
  await deleteSessionsForCredential(env, session.user_id, credentialId, session.id);
  return jsonResponse({ success: true });
}
async function handleReauthOptions(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  const url = new URL(request.url);
  const { rpID } = rpConfigFor(url);
  const creds = await getUserCredentials(env, session.user_id);
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: creds.map((c) => ({ id: c.credential_id }))
  });
  await storeChallenge(env, options.challenge, JSON.stringify({ reauth: true, userId: session.user_id, sessionId: session.id }));
  return jsonResponse(options);
}
async function handleReauthVerify(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  const url = new URL(request.url);
  const { rpID, origin } = rpConfigFor(url);
  let credential;
  try {
    credential = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const challenge = decodeClientDataChallenge(credential);
  if (!challenge) return jsonResponse({ error: "Malformed passkey response." }, 400);
  const pendingRaw = await consumeChallenge(env, challenge);
  let pending = null;
  try {
    pending = pendingRaw && pendingRaw !== "1" ? JSON.parse(pendingRaw) : null;
  } catch (e) {
    pending = null;
  }
  if (!pending || !pending.reauth || pending.userId !== session.user_id || pending.sessionId !== session.id) {
    return jsonResponse({ error: "Confirmation expired. Please try again." }, 400);
  }
  const stored = credential.id ? await getCredential(env, credential.id) : null;
  if (!stored || stored.user_id !== session.user_id) return jsonResponse({ error: "Unknown passkey." }, 400);
  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: true,
      credential: { id: stored.credential_id, publicKey: new Uint8Array(stored.public_key), counter: stored.sign_count }
    });
  } catch (err) {
    console.error("[Worker:account] reauth verify failed:", err.message);
    return jsonResponse({ error: "Could not verify passkey." }, 400);
  }
  if (!verification.verified) return jsonResponse({ error: "Passkey verification failed." }, 400);
  await updateCredentialCounter(env, stored.credential_id, verification.authenticationInfo.newCounter);
  await markSessionReauth(env, session.id);
  return jsonResponse({ success: true, validForSeconds: REAUTH_WINDOW_SECONDS });
}
async function handleListSessions(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401, NO_STORE);
  const rows = await listOwnSessions(env, session.user_id);
  const sessions = rows.map((r) => ({
    current: r.id === session.id,
    device_label: r.device_label || null,
    created_at: r.created_at,
    last_seen_at: r.last_seen_at || r.created_at,
    expires_at: r.expires_at
  }));
  return jsonResponse({ sessions }, 200, NO_STORE);
}
async function handleRevokeOtherSessions(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  await deleteOtherSessions(env, session.user_id, session.id);
  return jsonResponse({ success: true });
}
async function handleExport(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  const data = await exportUserData(env, session.user_id);
  if (!data) return jsonResponse({ error: "Account not found." }, 404);
  const body = JSON.stringify({ exported_at: (/* @__PURE__ */ new Date()).toISOString(), source: "entotools.org", ...data }, null, 2);
  return new Response(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="entotools-account-export.json"',
      "Cache-Control": "no-store"
    }
  });
}
async function handleDeleteAccount(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  if (!await consumeReauth(env, session)) return reauthRequired();
  const url = new URL(request.url);
  await deleteUser(env, session.user_id);
  console.log("[Worker:account] account deleted by its owner");
  return jsonResponse({ success: true }, 200, { "Set-Cookie": clearSessionCookies(url) });
}
var DEVICE_LABEL_MAX = 60;
async function handleRenameCredential(request, env, credentialId) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  if (!await consumeReauth(env, session)) return reauthRequired();
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  const label = typeof body.device_label === "string" ? body.device_label.replace(/[\u0000-\u001f\u007f]/g, "").trim() : "";
  if (!label || label.length > DEVICE_LABEL_MAX) {
    return jsonResponse({ error: `A name between 1 and ${DEVICE_LABEL_MAX} characters is required.` }, 400);
  }
  const changed = await renameCredential(env, session.user_id, credentialId, label);
  if (!changed) return jsonResponse({ error: "Passkey not found." }, 404);
  return jsonResponse({ success: true, device_label: label });
}
async function handleGetCollection(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  const row = await getCollection(env, session.user_id);
  if (!row) return jsonResponse({ json: null, meta: {} });
  let parsed = null;
  try {
    parsed = JSON.parse(row.envelope);
  } catch (e) {
    console.warn("[Worker:account] stored collection envelope failed to parse:", e.message);
  }
  return jsonResponse({ json: parsed, meta: { revision: row.revision, updatedAt: row.updated_at } });
}
var COLLECTION_MAX_BYTES = 1e6;
var COLLECTION_MAX_ENTRIES = 2e4;
async function handlePutCollection(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse({ error: "Not logged in." }, 401);
  const tooLarge = () => jsonResponse({ error: "Collection is too large to sync to your account (limit 1 MB / 20,000 entries)." }, 413);
  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > COLLECTION_MAX_BYTES) return tooLarge();
  let raw;
  try {
    raw = await request.text();
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  if (new TextEncoder().encode(raw).length > COLLECTION_MAX_BYTES) return tooLarge();
  let snapshot;
  try {
    snapshot = JSON.parse(raw);
  } catch (e) {
    return jsonResponse({ error: "Invalid request body." }, 400);
  }
  if (!snapshot || typeof snapshot !== "object" || !Array.isArray(snapshot.entries)) {
    return jsonResponse({ error: "Malformed snapshot." }, 400);
  }
  if (snapshot.entries.length > COLLECTION_MAX_ENTRIES) return tooLarge();
  const revision = Number(snapshot.revision) || 1;
  await saveCollection(env, session.user_id, JSON.stringify(snapshot), revision);
  const updatedAt = (/* @__PURE__ */ new Date()).toISOString();
  return jsonResponse({ modifiedTime: updatedAt, revision });
}

// src/routes/flags.js
function jsonResponse2(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
}
async function handleMyFlags(request, env) {
  const session = await requireSession(request, env);
  if (!session) return jsonResponse2({ flags: [] });
  const flags = await getUserFlags(env, session.user_id);
  return jsonResponse2({ flags });
}

// src/lib/access.js
var jwksCache = null;
var jwksCachedAt = 0;
var JWKS_CACHE_TTL_MS = 5 * 60 * 1e3;
async function getJwks(env, force) {
  if (!force && jwksCache && Date.now() - jwksCachedAt < JWKS_CACHE_TTL_MS) return jwksCache;
  const resp = await fetch(`https://${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`);
  if (!resp.ok) throw new Error("Failed to fetch Access JWKS: " + resp.status);
  const jwks = await resp.json();
  jwksCache = jwks;
  jwksCachedAt = Date.now();
  return jwks;
}
function base64UrlToBytes(b64url) {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - b64.length % 4) % 4);
  const binary2 = atob(padded);
  const bytes = new Uint8Array(binary2.length);
  for (let i = 0; i < binary2.length; i++) bytes[i] = binary2.charCodeAt(i);
  return bytes;
}
function base64UrlToJson(b64url) {
  const bytes = base64UrlToBytes(b64url);
  return JSON.parse(new TextDecoder().decode(bytes));
}
async function verifyAccessRequest(request, env) {
  try {
    if (!env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUD) return null;
    const token = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const header = base64UrlToJson(headerB64);
    const payload = base64UrlToJson(payloadB64);
    if (header.alg !== "RS256") return null;
    const now = Math.floor(Date.now() / 1e3);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (typeof payload.iss !== "string" || payload.iss !== `https://${env.CF_ACCESS_TEAM_DOMAIN}`) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (!aud.includes(env.CF_ACCESS_AUD)) return null;
    let jwks = await getJwks(env);
    let jwk = (jwks.keys || []).find((k) => k.kid === header.kid);
    if (!jwk) {
      jwks = await getJwks(env, true);
      jwk = (jwks.keys || []).find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signedData = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
    const signature = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", publicKey, signature, signedData);
    if (!valid) return null;
    return payload;
  } catch (e) {
    console.error("[Worker:access] verification error:", e.message);
    return null;
  }
}

// src/csp-hashes.json
var csp_hashes_default = {
  generated: "2026-09-05T16:01:24.800Z",
  tailwindHash: "1db23f6ad98d",
  routes: {
    "/404.html": [],
    "/500.html": [],
    "/503.html": [],
    "/collection-database": [
      "sha256-yXlsMdkD20uqyFwMCmCFsjZjy5hf68VJ6bwoGWXvisE="
    ],
    "/degree-day-calculator": [
      "sha256-ZtTDpeBMkslZ/PrMK4dQK9GHb64blxtGUzp522hna3Q="
    ],
    "/documentation": [
      "sha256-N1OAaQla7FejqwBXEWf5mcEMvEkGjhQ4O8mzw9UblI0="
    ],
    "/gdd-lookup": [
      "sha256-ixDldznWWlZGiUuOj1g27bkxckj8nUzEyQQePx2FVYE="
    ],
    "/": [
      "sha256-PuWwM6FDzfiywFvEW3TpYCFehI+jutWEOeRzqq8FmM0="
    ],
    "/privacy": [
      "sha256-N1OAaQla7FejqwBXEWf5mcEMvEkGjhQ4O8mzw9UblI0="
    ],
    "/sample-collection": [
      "sha256-OusoIA4AkTVWpYu1CHTIuf1bNLsi+e06oypr3htKAWU="
    ],
    "/status": [
      "sha256-NgahHYqtLrcGdcaR1E9zjUk+fRJ63n47xhU4ikrJgD0="
    ],
    "/terms": [
      "sha256-N1OAaQla7FejqwBXEWf5mcEMvEkGjhQ4O8mzw9UblI0="
    ]
  },
  admin: [
    "sha256-BZ3LqOzsREN1P/LJulnmSnL21aCMsgjFLr35oMLRziU="
  ]
};

// src/lib/csp.js
var PUBLIC_SCRIPT_HOSTS = "https://cdn.jsdelivr.net https://accounts.google.com https://static.cloudflareinsights.com";
var PUBLIC_CONNECT = "'self' https://api.open-meteo.com https://archive-api.open-meteo.com https://nominatim.openstreetmap.org https://api.sunrise-sunset.org https://www.googleapis.com https://accounts.google.com https://oauth2.googleapis.com https://cloudflareinsights.com";
function policy({ scriptHashes, scriptHosts, connect, styleHosts, fontHosts }) {
  const hashes = (scriptHashes || []).map((h) => `'${h}'`).join(" ");
  return [
    "default-src 'self'",
    `script-src 'self'${hashes ? " " + hashes : ""}${scriptHosts ? " " + scriptHosts : ""}`,
    `style-src 'self' 'unsafe-inline'${styleHosts ? " " + styleHosts : ""}`,
    fontHosts ? `font-src 'self' ${fontHosts}` : "font-src 'self'",
    "img-src 'self' data:",
    `connect-src ${connect}`,
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join("; ");
}
function routeKey(pathname) {
  if (pathname === "/" || pathname === "") return "/";
  let key = pathname.replace(/\/+$/, "");
  if (key.endsWith("/index.html")) key = key.slice(0, -"/index.html".length) || "/";
  return key || "/";
}
function cspForPage(pathname, status) {
  let hashes = csp_hashes_default.routes[routeKey(pathname)];
  if (!hashes && status === 404) hashes = csp_hashes_default.routes["/404.html"];
  return policy({
    scriptHashes: hashes || [],
    scriptHosts: PUBLIC_SCRIPT_HOSTS,
    connect: PUBLIC_CONNECT,
    styleHosts: "https://fonts.googleapis.com",
    fontHosts: "https://fonts.gstatic.com"
  });
}
function cspForAdmin() {
  return policy({
    scriptHashes: csp_hashes_default.admin || [],
    scriptHosts: "",
    connect: "'self'",
    styleHosts: "https://fonts.googleapis.com",
    fontHosts: "https://fonts.gstatic.com"
  });
}
var TAILWIND_HASH = csp_hashes_default.tailwindHash || "";
var BUILD_GENERATED_AT = csp_hashes_default.generated || null;

// src/lib/status.js
var USER_AGENT = "EntoTools/1.0 (educational-project)";
var STATUS_SERVICES = {
  ncei: {
    name: "NOAA NCEI",
    role: "Historical daily weather (US stations) for the calculator",
    url: "https://www.ncei.noaa.gov/access/services/data/v1?dataset=daily-summaries&stations=USW00094728&startDate=2024-01-01&endDate=2024-01-01&dataTypes=TMAX&format=json",
    timeout: 1e4
  },
  "open-meteo": {
    name: "Open-Meteo",
    role: "Forecast + archive weather (global fallback)",
    url: "https://api.open-meteo.com/v1/forecast?latitude=40&longitude=-74&current_weather=true",
    timeout: 8e3
  },
  nominatim: {
    name: "Nominatim (OpenStreetMap)",
    role: "Geocoding for city/state lookups",
    url: "https://nominatim.openstreetmap.org/search?q=New+York&format=json&limit=1",
    timeout: 8e3
  },
  github: {
    name: "GitHub API",
    role: "Feedback widget \u2192 public issues",
    url: "https://api.github.com/rate_limit",
    timeout: 8e3
  }
};
async function checkService(id) {
  const config = STATUS_SERVICES[id];
  if (!config) return { ok: false, error: "Unknown service", latency: 0 };
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeout);
  try {
    const resp = await fetch(config.url, { headers: { "User-Agent": USER_AGENT }, signal: controller.signal });
    const latency = Date.now() - start;
    if (!resp.ok) return { ok: false, error: `HTTP ${resp.status}`, latency };
    return { ok: true, latency };
  } catch (err) {
    const latency = Date.now() - start;
    return { ok: false, error: err.name === "AbortError" ? "Timeout" : err.message, latency };
  } finally {
    clearTimeout(timer);
  }
}
async function checkAllServices() {
  const ids = Object.keys(STATUS_SERVICES);
  const results = await Promise.all(ids.map((id) => checkService(id)));
  const checkedAt = (/* @__PURE__ */ new Date()).toISOString();
  return ids.map((id, i) => ({
    id,
    name: STATUS_SERVICES[id].name,
    role: STATUS_SERVICES[id].role,
    host: new URL(STATUS_SERVICES[id].url).host,
    timeoutMs: STATUS_SERVICES[id].timeout,
    checkedAt,
    ...results[i]
  }));
}

// package.json
var package_default = {
  name: "entotools-production",
  version: "1.11.0",
  private: true,
  scripts: {
    dev: "wrangler pages dev public/",
    "build-public": "bash scripts/build-public.sh",
    "build-worker": "esbuild src/index.js --bundle --format=esm --platform=browser --loader:.html=text --outfile=public/_worker.js"
  },
  dependencies: {
    "@simplewebauthn/server": "^14.0.1"
  },
  devDependencies: {
    esbuild: "^0.28.2",
    tailwindcss: "^3.4.19",
    wrangler: "^4.129.0"
  }
};

// templates/admin.html
var admin_default = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>EntoTools Admin</title>
    <link rel="stylesheet" href="/tailwind.css">
    <!-- Shared theme: brand palette, dark-mode handling and common styles \u2014
         same as every public page, so the admin portal doesn't look/feel like
         a different app. Deliberately NOT loading feedback.js/log-capture.js
         though \u2014 no public feedback widget or console-capture here, this is
         an internal tool gated entirely by Cloudflare Access. esc() is reused
         since it's a plain, dependency-free XSS-safe escaping helper (#36
         still has to escape admin-entered/user label data like any other page). -->
    <script src="/theme.js?v=2"><\/script>
    <link rel="stylesheet" href="/theme.css">
    <script src="/ento-gdd.js?v=1"><\/script>
</head>
<body class="bg-slate-50 min-h-screen text-slate-800">
    <!-- Nav + Header follow the same two-tier layout as every public page
         (see templates/entotools.html) rather than a single flat title bar. -->
    <nav class="bg-white shadow-sm border-b border-slate-200 relative z-40">
        <div class="max-w-5xl mx-auto px-4 sm:px-6">
            <div class="flex items-center justify-between h-14 sm:h-16">
                <span class="text-lime-600 font-semibold text-lg">EntoTools Admin</span>
                <div class="relative">
                    <button id="settings-btn" data-action="toggleSettings" class="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition" title="Settings">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                    </button>
                    <div id="settings-panel" class="settings-panel absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-slate-200 p-4 z-50">
                        <h3 class="text-sm font-semibold text-slate-800 mb-3">Settings</h3>
                        <div class="flex items-center justify-between py-2">
                            <div class="flex items-center gap-2">
                                <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
                                </svg>
                                <span class="text-sm text-slate-700">Dark Mode</span>
                            </div>
                            <button id="theme-toggle" data-action="toggleTheme" class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-lime-500 focus:ring-offset-2 bg-slate-200">
                                <span id="theme-toggle-dot" class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1"></span>
                            </button>
                        </div>
                        <hr class="my-2 border-slate-100">
                        <p class="text-xs text-slate-500">Signed in as <span id="admin-email" class="font-medium">\u2026</span></p>
                        <!-- theme.js's renderVersionInfo() auto-appends "Version X.Y.Z" here -->
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <header class="bg-slate-700 text-white shadow-lg">
        <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight">Admin Portal</h1>
        </div>
    </header>

    <main class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div class="inline-flex flex-wrap rounded-lg bg-slate-100 p-1 mb-4 text-sm font-medium items-center gap-1" role="tablist">
            <button class="tab-btn px-3 sm:px-4 py-2 rounded-md transition tab-active" data-tab="users">Users</button>
            <button class="tab-btn px-3 sm:px-4 py-2 rounded-md transition" data-tab="flags">Feature Flags</button>
            <button class="tab-btn px-3 sm:px-4 py-2 rounded-md transition" data-tab="audit">Audit Log</button>
            <button class="tab-btn px-3 sm:px-4 py-2 rounded-md transition" data-tab="status">Status</button>
        </div>

        <p id="global-error" class="hidden mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2"></p>

        <!-- \u2500\u2500 Users tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
        <div id="tab-users" class="tab-panel">
            <div class="flex gap-2 mb-4">
                <input id="user-search-input" type="text" placeholder="Search by label, email, or user ID\u2026"
                       class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none">
                <button id="user-search-btn" class="px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium transition">Search</button>
            </div>
            <div id="user-results" class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-6"></div>

            <div id="user-detail" class="hidden bg-white rounded-xl border border-slate-200 p-5">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h2 id="ud-label" class="text-base font-semibold text-slate-800"></h2>
                        <p class="text-xs text-slate-400 mt-0.5">ID: <span id="ud-id"></span> \xB7 Created <span id="ud-created"></span></p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="ud-delete-user" class="text-xs text-red-600 hover:text-red-700 font-medium">Delete user</button>
                        <button id="ud-close" class="text-slate-400 hover:text-slate-600 text-sm">Close</button>
                    </div>
                </div>

                <div class="grid sm:grid-cols-2 gap-6">
                    <div>
                        <div class="flex items-center justify-between mb-2">
                            <h3 class="text-sm font-semibold text-slate-700">Passkeys</h3>
                            <button id="ud-reset-credentials" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition">Reset all passkeys</button>
                        </div>
                        <div id="ud-credentials" class="text-sm space-y-1.5"></div>

                        <div class="flex items-center justify-between mt-4 mb-2">
                            <h3 class="text-sm font-semibold text-slate-700">Sessions</h3>
                            <button id="ud-revoke-sessions" class="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition">Revoke all sessions</button>
                        </div>
                        <div id="ud-sessions" class="text-sm space-y-1.5"></div>

                        <div class="mt-4">
                            <button id="ud-issue-token" class="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition">Issue re-registration link</button>
                            <p class="text-xs text-slate-400 mt-1.5">For a user who's lost their only device \u2014 send them the
                                link below and it walks them straight into registering a new passkey for this same account.
                                Single-use, expires in 15 minutes.</p>
                            <div id="ud-token-result" class="hidden mt-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 break-all"></div>
                        </div>
                    </div>

                    <div>
                        <h3 class="text-sm font-semibold text-slate-700 mb-2">Feature Flags</h3>
                        <div id="ud-flags" class="text-sm space-y-2"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- \u2500\u2500 Feature Flags tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
        <div id="tab-flags" class="tab-panel hidden">
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th class="text-left px-4 py-2">Key</th><th class="text-left px-4 py-2">Description</th></tr>
                    </thead>
                    <tbody id="flags-table-body"></tbody>
                </table>
            </div>

            <!-- Assign this flag to specific users, once it's been created below. -->
            <div id="flag-detail" class="hidden bg-white rounded-xl border border-slate-200 p-5 mb-6">
                <div class="flex items-start justify-between mb-4">
                    <div>
                        <h2 id="fd-key" class="text-base font-semibold text-slate-800 font-mono"></h2>
                        <p id="fd-description" class="text-xs text-slate-400 mt-0.5"></p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="fd-delete" class="text-xs text-red-600 hover:text-red-700 font-medium">Delete flag</button>
                        <button id="fd-close" class="text-slate-400 hover:text-slate-600 text-sm">Close</button>
                    </div>
                </div>

                <h3 class="text-sm font-semibold text-slate-700 mb-2">Assigned users</h3>
                <div id="fd-users" class="text-sm space-y-1.5 mb-4"></div>

                <h3 class="text-sm font-semibold text-slate-700 mb-2">Assign to a user</h3>
                <div class="flex gap-2 mb-2">
                    <input id="fd-assign-input" type="text" placeholder="Search by label, email, or user ID\u2026"
                           class="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none">
                    <button id="fd-assign-search-btn" class="px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium transition">Search</button>
                </div>
                <div id="fd-assign-results" class="text-sm space-y-1"></div>
            </div>

            <form id="new-flag-form" class="flex flex-wrap gap-2 items-end bg-white rounded-xl border border-slate-200 p-4">
                <div>
                    <label class="block text-xs font-medium text-slate-500 mb-1">Flag key</label>
                    <input id="new-flag-key" type="text" placeholder="new-chart-ui" required
                           class="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none">
                </div>
                <div class="flex-1 min-w-[12rem]">
                    <label class="block text-xs font-medium text-slate-500 mb-1">Description</label>
                    <input id="new-flag-desc" type="text" placeholder="What this turns on"
                           class="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-lime-500 outline-none">
                </div>
                <button type="submit" class="px-4 py-2 rounded-lg bg-lime-600 hover:bg-lime-700 text-white text-sm font-medium transition">Create flag</button>
            </form>
        </div>

        <!-- \u2500\u2500 Audit Log tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
        <div id="tab-audit" class="tab-panel hidden">
            <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr>
                            <th class="text-left px-4 py-2">When</th>
                            <th class="text-left px-4 py-2">Admin</th>
                            <th class="text-left px-4 py-2">Action</th>
                            <th class="text-left px-4 py-2">Target user</th>
                            <th class="text-left px-4 py-2">Detail</th>
                        </tr>
                    </thead>
                    <tbody id="audit-table-body"></tbody>
                </table>
            </div>
        </div>

        <!-- \u2500\u2500 Status tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 -->
        <div id="tab-status" class="tab-panel hidden">
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
                <p class="text-sm text-slate-500">Restricted view \u2014 bindings, limits and the API catalogue that the public
                    <a href="/status" class="text-lime-700 underline">/status</a> page doesn't show.
                    <span id="status-checked-at" class="text-slate-400"></span></p>
                <button id="status-refresh" class="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition">Refresh</button>
            </div>

            <div id="status-overview" class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"></div>

            <h3 class="text-sm font-semibold text-slate-700 mb-2">Upstream services</h3>
            <div id="status-upstream" class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-6">
                <p class="px-4 py-3 text-sm text-slate-400">Checking\u2026</p>
            </div>

            <div class="grid lg:grid-cols-2 gap-6 mb-6">
                <div>
                    <h3 class="text-sm font-semibold text-slate-700 mb-2">Configuration &amp; bindings</h3>
                    <div id="status-config" class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm"></div>
                </div>
                <div>
                    <h3 class="text-sm font-semibold text-slate-700 mb-2">Data (D1)</h3>
                    <div id="status-data" class="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-sm"></div>
                </div>
            </div>

            <h3 class="text-sm font-semibold text-slate-700 mb-2">Rate limits (per IP)</h3>
            <div class="bg-white rounded-xl border border-slate-200 overflow-x-auto mb-6">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th class="text-left px-4 py-2">Applies to</th><th class="text-left px-4 py-2">Limit</th><th class="text-left px-4 py-2">Window</th></tr>
                    </thead>
                    <tbody id="status-limits"></tbody>
                </table>
            </div>

            <h3 class="text-sm font-semibold text-slate-700 mb-2">EntoTools API endpoints</h3>
            <div class="bg-white rounded-xl border border-slate-200 overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                        <tr><th class="text-left px-4 py-2">Method</th><th class="text-left px-4 py-2">Path</th><th class="text-left px-4 py-2">Auth</th><th class="text-left px-4 py-2">Protection</th><th class="text-left px-4 py-2">Purpose</th></tr>
                    </thead>
                    <tbody id="status-endpoints"></tbody>
                </table>
            </div>
        </div>
    </main>

    <script>
        // \u2500\u2500 Fetch helper \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        // Cloudflare Access's own session cookie rides along automatically on
        // same-origin fetches \u2014 nothing extra to attach here.
        async function api(path, options) {
            const resp = await fetch(path, options);
            const data = await resp.json().catch(() => ({}));
            if (!resp.ok || data.error) throw new Error(data.error || ('HTTP ' + resp.status));
            return data;
        }

        // \u2500\u2500 Settings panel \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        // Same toggleSettings()/click-outside pattern used on every public
        // page (see templates/entotools.html) \u2014 kept identical so the
        // behavior matches, not just the look.
        function toggleSettings() {
            document.getElementById('settings-panel').classList.toggle('open');
        }
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('settings-panel');
            const btn = document.getElementById('settings-btn');
            if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
                panel.classList.remove('open');
            }
        });

        function showError(msg) {
            const el = document.getElementById('global-error');
            el.textContent = msg;
            el.classList.remove('hidden');
            setTimeout(() => el.classList.add('hidden'), 6000);
        }

        function fmtDate(iso) {
            if (!iso) return '\u2014';
            try { return new Date(iso).toLocaleString(); } catch (e) { return iso; }
        }

        // Audit log entries specifically show the timezone abbreviation
        // (e.g. "EDT") \u2014 everything is stored in UTC, and admin actions
        // taken across time zones are otherwise ambiguous at a glance.
        function fmtDateTz(iso) {
            if (!iso) return '\u2014';
            try { return new Date(iso).toLocaleString(undefined, { timeZoneName: 'short' }); } catch (e) { return iso; }
        }

        // \u2500\u2500 Tabs \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        document.querySelectorAll('.tab-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('tab-active'));
                btn.classList.add('tab-active');
                document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
                document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
                if (btn.dataset.tab === 'flags') loadFlags();
                if (btn.dataset.tab === 'audit') loadAuditLog();
                if (btn.dataset.tab === 'status') loadStatus();
            });
        });

        // \u2500\u2500 Users \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        let allFlags = []; // cached for rendering the per-user flag checkboxes
        let currentUserId = null;

        async function searchUsers() {
            const q = document.getElementById('user-search-input').value.trim();
            const resultsEl = document.getElementById('user-results');
            try {
                const { users } = await api('/frost/admin/users?q=' + encodeURIComponent(q));
                if (users.length === 0) {
                    resultsEl.innerHTML = '<p class="px-4 py-3 text-sm text-slate-400">No users found.</p>';
                    return;
                }
                resultsEl.innerHTML = users.map((u) => \`
                    <button class="user-result-row w-full text-left px-4 py-2.5 hover:bg-slate-50 transition flex items-center justify-between" data-id="\${esc(u.id)}">
                        <span>
                            <span class="block text-sm text-slate-800">\${esc(u.label)}</span>
                            <span class="block text-xs text-slate-400 font-mono">\${esc(u.id)}</span>
                        </span>
                        <span class="text-xs text-slate-400 whitespace-nowrap">\${fmtDate(u.created_at)}</span>
                    </button>
                \`).join('');
                resultsEl.querySelectorAll('.user-result-row').forEach((row) => {
                    row.addEventListener('click', () => openUser(row.dataset.id));
                });
            } catch (err) { showError('Search failed: ' + err.message); }
        }
        document.getElementById('user-search-btn').addEventListener('click', searchUsers);
        document.getElementById('user-search-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchUsers(); });

        async function openUser(userId) {
            try {
                if (allFlags.length === 0) {
                    const flagsData = await api('/frost/admin/flags');
                    allFlags = flagsData.flags;
                }
                const detail = await api('/frost/admin/users/' + encodeURIComponent(userId));
                currentUserId = userId;
                renderUserDetail(detail);
            } catch (err) { showError('Could not load user: ' + err.message); }
        }

        function renderUserDetail(detail) {
            const { user, credentials, sessions } = detail;
            document.getElementById('user-detail').classList.remove('hidden');
            document.getElementById('ud-label').textContent = user.label;
            document.getElementById('ud-id').textContent = user.id;
            document.getElementById('ud-created').textContent = fmtDate(user.created_at);

            document.getElementById('ud-credentials').innerHTML = credentials.length
                ? credentials.map((c) => \`
                    <div class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <div>
                            <div class="text-slate-700">\${esc(c.device_label || 'Unnamed device')}</div>
                            <div class="text-xs text-slate-400">Added \${fmtDate(c.created_at)}\${c.last_used_at ? ' \xB7 Last used ' + fmtDate(c.last_used_at) : ''}</div>
                        </div>
                    </div>
                \`).join('')
                : '<p class="text-slate-400 text-sm">No passkeys registered.</p>';

            document.getElementById('ud-sessions').innerHTML = sessions.length
                ? sessions.map((s) => \`
                    <div class="bg-slate-50 rounded-lg px-3 py-2">
                        <div class="text-slate-700">\${esc(s.device_label || 'Passkey')}</div>
                        <div class="text-xs text-slate-400">Since \${fmtDate(s.created_at)} \xB7 Last active \${fmtDate(s.last_seen_at || s.created_at)} \xB7 Expires \${fmtDate(s.expires_at)}</div>
                    </div>
                \`).join('')
                : '<p class="text-slate-400 text-sm">No active sessions.</p>';

            document.getElementById('ud-token-result').classList.add('hidden');
            renderUserFlags(user.id);
        }

        async function renderUserFlags(userId) {
            const container = document.getElementById('ud-flags');
            if (allFlags.length === 0) {
                container.innerHTML = '<p class="text-slate-400 text-sm">No flags defined yet \u2014 add one in the Feature Flags tab.</p>';
                return;
            }
            container.innerHTML = allFlags.map((f) => \`
                <label class="flex items-start gap-2 bg-slate-50 rounded-lg px-3 py-2 cursor-pointer">
                    <input type="checkbox" class="user-flag-checkbox mt-0.5" data-key="\${esc(f.flag_key)}">
                    <span>
                        <span class="block text-slate-700 font-medium">\${esc(f.flag_key)}</span>
                        \${f.description ? \`<span class="block text-xs text-slate-400">\${esc(f.description)}</span>\` : ''}
                    </span>
                </label>
            \`).join('');
            // Fill in current state without blocking the (fast) render above.
            for (const f of allFlags) {
                try {
                    const { users } = await api('/frost/admin/flags/' + encodeURIComponent(f.flag_key) + '/users');
                    const checkbox = container.querySelector(\`.user-flag-checkbox[data-key="\${CSS.escape(f.flag_key)}"]\`);
                    if (checkbox) checkbox.checked = users.some((u) => u.id === userId);
                } catch (e) { /* leave unchecked on error */ }
            }
            container.querySelectorAll('.user-flag-checkbox').forEach((cb) => {
                cb.addEventListener('change', async () => {
                    const key = cb.dataset.key;
                    try {
                        await api('/frost/admin/users/' + encodeURIComponent(currentUserId) + '/flags/' + encodeURIComponent(key), {
                            method: cb.checked ? 'PUT' : 'DELETE',
                        });
                    } catch (err) {
                        cb.checked = !cb.checked; // revert on failure
                        showError('Could not update flag: ' + err.message);
                    }
                });
            });
        }

        document.getElementById('ud-close').addEventListener('click', () => {
            document.getElementById('user-detail').classList.add('hidden');
            currentUserId = null;
        });

        document.getElementById('ud-delete-user').addEventListener('click', async () => {
            if (!currentUserId) return;
            const label = document.getElementById('ud-label').textContent;
            if (!confirm('Permanently delete the account "' + label + '"? This removes their passkeys, sessions, feature flag assignments, and any account-synced collection data. This cannot be undone.')) return;
            try {
                await api('/frost/admin/users/' + encodeURIComponent(currentUserId), { method: 'DELETE' });
                document.getElementById('user-detail').classList.add('hidden');
                currentUserId = null;
                searchUsers();
            } catch (err) { showError('Delete failed: ' + err.message); }
        });

        document.getElementById('ud-reset-credentials').addEventListener('click', async () => {
            if (!currentUserId) return;
            if (!confirm('Reset ALL passkeys for this user? They will need to register a new one (via a re-registration link) to log in again.')) return;
            try {
                await api('/frost/admin/users/' + encodeURIComponent(currentUserId) + '/credentials', { method: 'DELETE' });
                openUser(currentUserId);
            } catch (err) { showError('Reset failed: ' + err.message); }
        });

        document.getElementById('ud-revoke-sessions').addEventListener('click', async () => {
            if (!currentUserId) return;
            if (!confirm('Revoke all active sessions for this user? They will be logged out everywhere immediately.')) return;
            try {
                await api('/frost/admin/users/' + encodeURIComponent(currentUserId) + '/sessions', { method: 'DELETE' });
                openUser(currentUserId);
            } catch (err) { showError('Revoke failed: ' + err.message); }
        });

        document.getElementById('ud-issue-token').addEventListener('click', async () => {
            if (!currentUserId) return;
            try {
                const { token, expiresInSeconds } = await api('/frost/admin/users/' + encodeURIComponent(currentUserId) + '/reregister-token', { method: 'POST' });
                // A real clickable link (?reregister=<token>), not a raw token
                // the user would have to paste somewhere themselves \u2014 account.js
                // on the landing page picks this query param up automatically and
                // walks them straight into "register a new passkey for my account".
                const link = 'https://entotools.org/?reregister=' + encodeURIComponent(token);
                const el = document.getElementById('ud-token-result');
                el.innerHTML = 'Send this link \u2014 expires in ' + Math.round(expiresInSeconds / 60) + ' minutes, single-use:<br>' +
                    '<a href="' + esc(link) + '" target="_blank" rel="noopener" class="text-lime-700 underline break-all">' + esc(link) + '</a>';
                el.classList.remove('hidden');
            } catch (err) { showError('Could not issue token: ' + err.message); }
        });

        // \u2500\u2500 Feature Flags tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        let currentFlagKey = null;

        async function loadFlags() {
            try {
                const { flags } = await api('/frost/admin/flags');
                allFlags = flags;
                const tbody = document.getElementById('flags-table-body');
                tbody.innerHTML = flags.length
                    ? flags.map((f) => \`
                        <tr class="flag-row border-t border-slate-100 cursor-pointer hover:bg-slate-50 transition" data-key="\${esc(f.flag_key)}" data-description="\${esc(f.description || '')}">
                            <td class="px-4 py-2 font-mono text-xs">\${esc(f.flag_key)}</td>
                            <td class="px-4 py-2 text-slate-600">\${esc(f.description || '\u2014')}</td>
                        </tr>
                    \`).join('')
                    : '<tr><td colspan="2" class="px-4 py-4 text-center text-slate-400">No flags defined yet.</td></tr>';
                tbody.querySelectorAll('.flag-row').forEach((row) => {
                    row.addEventListener('click', () => openFlag(row.dataset.key, row.dataset.description));
                });
            } catch (err) { showError('Could not load flags: ' + err.message); }
        }

        function openFlag(key, description) {
            currentFlagKey = key;
            document.getElementById('flag-detail').classList.remove('hidden');
            document.getElementById('fd-key').textContent = key;
            document.getElementById('fd-description').textContent = description || '';
            document.getElementById('fd-assign-input').value = '';
            document.getElementById('fd-assign-results').innerHTML = '';
            renderFlagUsers();
        }

        document.getElementById('fd-close').addEventListener('click', () => {
            document.getElementById('flag-detail').classList.add('hidden');
            currentFlagKey = null;
        });

        document.getElementById('fd-delete').addEventListener('click', async () => {
            if (!currentFlagKey) return;
            if (!confirm('Delete the flag "' + currentFlagKey + '"? This also removes it from every user currently assigned it.')) return;
            try {
                await api('/frost/admin/flags/' + encodeURIComponent(currentFlagKey), { method: 'DELETE' });
                document.getElementById('flag-detail').classList.add('hidden');
                currentFlagKey = null;
                allFlags = []; // force a refresh next time a user is opened
                loadFlags();
            } catch (err) { showError('Could not delete flag: ' + err.message); }
        });

        async function renderFlagUsers() {
            const container = document.getElementById('fd-users');
            try {
                const { users } = await api('/frost/admin/flags/' + encodeURIComponent(currentFlagKey) + '/users');
                container.innerHTML = users.length
                    ? users.map((u) => \`
                        <div class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                            <span class="text-slate-700">\${esc(u.label)}</span>
                            <button class="fd-remove-user text-xs text-red-600 hover:text-red-700 font-medium" data-id="\${esc(u.id)}">Remove</button>
                        </div>
                    \`).join('')
                    : '<p class="text-slate-400 text-sm">No users have this flag yet.</p>';
                container.querySelectorAll('.fd-remove-user').forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        try {
                            await api('/frost/admin/users/' + encodeURIComponent(btn.dataset.id) + '/flags/' + encodeURIComponent(currentFlagKey), { method: 'DELETE' });
                            renderFlagUsers();
                        } catch (err) { showError('Could not remove: ' + err.message); }
                    });
                });
            } catch (err) { showError('Could not load assigned users: ' + err.message); }
        }

        async function searchUsersToAssign() {
            const q = document.getElementById('fd-assign-input').value.trim();
            const resultsEl = document.getElementById('fd-assign-results');
            try {
                const { users } = await api('/frost/admin/users?q=' + encodeURIComponent(q));
                resultsEl.innerHTML = users.length
                    ? users.map((u) => \`
                        <div class="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                            <span class="text-slate-700">\${esc(u.label)}</span>
                            <button class="fd-assign-user text-xs text-lime-700 hover:text-lime-800 font-medium" data-id="\${esc(u.id)}">Assign</button>
                        </div>
                    \`).join('')
                    : '<p class="text-slate-400 text-sm">No users found.</p>';
                resultsEl.querySelectorAll('.fd-assign-user').forEach((btn) => {
                    btn.addEventListener('click', async () => {
                        try {
                            await api('/frost/admin/users/' + encodeURIComponent(btn.dataset.id) + '/flags/' + encodeURIComponent(currentFlagKey), { method: 'PUT' });
                            resultsEl.innerHTML = '';
                            document.getElementById('fd-assign-input').value = '';
                            renderFlagUsers();
                        } catch (err) { showError('Could not assign: ' + err.message); }
                    });
                });
            } catch (err) { showError('Search failed: ' + err.message); }
        }
        document.getElementById('fd-assign-search-btn').addEventListener('click', searchUsersToAssign);
        document.getElementById('fd-assign-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') searchUsersToAssign(); });

        document.getElementById('new-flag-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const key = document.getElementById('new-flag-key').value.trim();
            const description = document.getElementById('new-flag-desc').value.trim();
            if (!key) return;
            try {
                await api('/frost/admin/flags', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, description }),
                });
                document.getElementById('new-flag-key').value = '';
                document.getElementById('new-flag-desc').value = '';
                allFlags = []; // force a refresh next time a user is opened
                loadFlags();
            } catch (err) { showError('Could not create flag: ' + err.message); }
        });

        // \u2500\u2500 Audit Log tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        async function loadAuditLog() {
            try {
                const { log } = await api('/frost/admin/audit-log');
                const tbody = document.getElementById('audit-table-body');
                tbody.innerHTML = log.length
                    ? log.map((entry) => \`
                        <tr class="border-t border-slate-100">
                            <td class="px-4 py-2 text-xs text-slate-500 whitespace-nowrap">\${fmtDateTz(entry.created_at)}</td>
                            <td class="px-4 py-2 text-slate-700">\${esc(entry.admin_identity)}</td>
                            <td class="px-4 py-2 font-mono text-xs">\${esc(entry.action)}</td>
                            <td class="px-4 py-2 text-xs text-slate-500">\${esc(entry.target_user_id || '\u2014')}</td>
                            <td class="px-4 py-2 text-xs text-slate-500">\${esc(entry.detail || '\u2014')}</td>
                        </tr>
                    \`).join('')
                    : '<tr><td colspan="5" class="px-4 py-4 text-center text-slate-400">No admin actions logged yet.</td></tr>';
            } catch (err) { showError('Could not load audit log: ' + err.message); }
        }

        // \u2500\u2500 Status tab \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        function statusDot(ok, pending) {
            const cls = pending ? 'bg-slate-300' : ok ? 'bg-lime-500' : 'bg-red-500';
            return \`<span class="inline-block w-2.5 h-2.5 rounded-full \${cls} shrink-0"></span>\`;
        }
        function fmtWindow(seconds) {
            return seconds % 3600 === 0 ? (seconds / 3600) + ' h' : Math.round(seconds / 60) + ' min';
        }
        function fmtBytes(n) {
            if (n < 1024) return n + ' B';
            if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
            return (n / (1024 * 1024)).toFixed(2) + ' MB';
        }
        function card(label, value, sub, ok) {
            return \`
                <div class="bg-white rounded-xl border border-slate-200 p-4">
                    <div class="text-xs text-slate-500 mb-1">\${esc(label)}</div>
                    <div class="flex items-center gap-2 text-lg font-semibold text-slate-800">\${ok === undefined ? '' : statusDot(ok)}\${esc(value)}</div>
                    \${sub ? \`<div class="text-xs text-slate-400 mt-1">\${esc(sub)}</div>\` : ''}
                </div>\`;
        }
        function kvRow(label, value, ok) {
            return \`<div class="flex items-center justify-between gap-3 px-4 py-2">
                <span class="text-slate-600">\${esc(label)}</span>
                <span class="flex items-center gap-2 text-slate-800 font-medium text-right">\${ok === undefined ? '' : statusDot(ok)}\${esc(value)}</span></div>\`;
        }

        async function loadStatus() {
            const checkedAt = document.getElementById('status-checked-at');
            checkedAt.textContent = '';
            document.getElementById('status-upstream').innerHTML = '<p class="px-4 py-3 text-sm text-slate-400">Checking\u2026</p>';
            // Internal (fast) and upstream (slow) in parallel; each renders as it lands.
            const internal = api('/frost/admin/status/internal').then((s) => {
                const w = s.worker, c = s.config, d = s.d1, k = s.kv;
                document.getElementById('status-overview').innerHTML = [
                    card('Worker', 'v' + w.version, (w.colo ? 'Served from ' + w.colo : '') + (w.builtAt ? ' \xB7 built ' + fmtDate(w.builtAt) : ''), true),
                    card('D1 (accounts)', d.ok ? d.latencyMs + ' ms' : 'unavailable', d.ok ? 'batch of 10 count queries' : (d.error || ''), d.ok),
                    card('KV (cache, challenges, limits)', k.ok ? k.latencyMs + ' ms' : 'unavailable', k.ok ? 'write \u2192 read \u2192 delete probe' : (k.error || ''), k.ok),
                    card('Active sessions', String(d.sessionsActive ?? '\u2014'), (d.users ?? '\u2014') + ' accounts \xB7 ' + (d.credentials ?? '\u2014') + ' passkeys'),
                ].join('');
                document.getElementById('status-config').innerHTML = [
                    kvRow('Cloudflare Access (admin gate)', c.accessConfigured ? (c.accessTeamDomain || 'configured') : 'NOT configured \u2014 portal would 404', c.accessConfigured),
                    kvRow('GITHUB_TOKEN (feedback \u2192 issues)', c.githubTokenConfigured ? 'configured' : 'missing \u2014 feedback will fail', c.githubTokenConfigured),
                    kvRow('D1 binding (DB)', c.d1Bound ? 'bound' : 'missing', c.d1Bound),
                    kvRow('KV binding (GEOCODE_CACHE)', c.kvBound ? 'bound' : 'missing', c.kvBound),
                    kvRow('Static assets (ASSETS)', c.assetsBound ? 'bound' : 'missing', c.assetsBound),
                    kvRow('Request', (w.cfRay || '\u2014') + (w.servedFromCountry ? ' \xB7 ' + w.servedFromCountry : '')),
                ].join('');
                document.getElementById('status-data').innerHTML = d.ok ? [
                    kvRow('Accounts', String(d.users)),
                    kvRow('Passkeys', String(d.credentials)),
                    kvRow('Sessions (active / total rows)', d.sessionsActive + ' / ' + d.sessionsTotal),
                    kvRow('Synced collections', d.collections + ' \xB7 ' + fmtBytes(d.collectionBytes)),
                    kvRow('Feature flags / assignments', d.featureFlags + ' / ' + d.flagAssignments),
                    kvRow('Audit log entries', String(d.auditEntries)),
                    kvRow('Last sign-up', fmtDate(d.lastSignupAt)),
                    kvRow('Last passkey use', fmtDate(d.lastLoginAt)),
                ].join('') : '<p class="px-4 py-3 text-red-600">' + esc(d.error || 'D1 unavailable') + '</p>';
                document.getElementById('status-limits').innerHTML = Object.values(s.limits).map((l) => \`
                    <tr class="border-t border-slate-100">
                        <td class="px-4 py-2 text-slate-700">\${esc(l.applies)}</td>
                        <td class="px-4 py-2 font-mono text-xs">\${esc(String(l.limit))}</td>
                        <td class="px-4 py-2 text-slate-500">\${esc(fmtWindow(l.windowSeconds))}</td>
                    </tr>\`).join('');
                document.getElementById('status-endpoints').innerHTML = s.endpoints.map((e) => \`
                    <tr class="border-t border-slate-100 align-top">
                        <td class="px-4 py-2 font-mono text-xs whitespace-nowrap">\${esc(e.method)}</td>
                        <td class="px-4 py-2 font-mono text-xs whitespace-nowrap">\${esc(e.path)}</td>
                        <td class="px-4 py-2 text-xs text-slate-600 whitespace-nowrap">\${esc(e.auth)}</td>
                        <td class="px-4 py-2 text-xs text-slate-500">\${esc(e.protection)}</td>
                        <td class="px-4 py-2 text-xs text-slate-600">\${esc(e.purpose)}</td>
                    </tr>\`).join('');
                checkedAt.textContent = 'Checked ' + fmtDateTz(s.checkedAt) + '.';
            }).catch((err) => showError('Could not load internal status: ' + err.message));

            const upstream = api('/frost/admin/status/upstream').then(({ services }) => {
                document.getElementById('status-upstream').innerHTML = services.map((svc) => \`
                    <div class="flex items-center gap-3 px-4 py-2.5">
                        \${statusDot(svc.ok)}
                        <div class="flex-1 min-w-0">
                            <div class="text-sm text-slate-800">\${esc(svc.name)} <span class="text-xs text-slate-400 font-mono">\${esc(svc.host)}</span></div>
                            <div class="text-xs text-slate-500">\${esc(svc.role)}</div>
                        </div>
                        <div class="text-right text-xs \${svc.ok ? 'text-slate-500' : 'text-red-600'} whitespace-nowrap">\${svc.ok ? esc(svc.latency + ' ms') : esc(svc.error || 'down')}<div class="text-slate-400">timeout \${esc(String(svc.timeoutMs / 1000))} s</div></div>
                    </div>\`).join('');
            }).catch((err) => {
                document.getElementById('status-upstream').innerHTML = '<p class="px-4 py-3 text-sm text-red-600">' + esc('Could not check upstream services: ' + err.message) + '</p>';
            });
            await Promise.allSettled([internal, upstream]);
        }
        document.getElementById('status-refresh').addEventListener('click', loadStatus);

        // \u2500\u2500 Init \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
        (async function init() {
            try {
                const status = await api('/frost/admin/status');
                document.getElementById('admin-email').textContent = status.admin;
            } catch (err) { document.getElementById('admin-email').textContent = '(unknown)'; }
        })();
    <\/script>
</body>
</html>
`;

// src/routes/admin.js
var API_ENDPOINTS = [
  { method: "POST", path: "/api/search", auth: "none", protection: "per-IP limit, input caps (ranges/days)", purpose: "Weather + station lookup for the calculator" },
  { method: "POST", path: "/api/feedback", auth: "none", protection: "Origin allowlist, per-IP limit, PII redaction, Markdown neutralised", purpose: "Feedback widget \u2192 public GitHub issue" },
  { method: "GET", path: "/api/status/ping", auth: "none", protection: "\u2014", purpose: "Worker liveness" },
  { method: "GET", path: "/api/status/check?service=", auth: "none", protection: "per-IP limit, allow-listed targets", purpose: "One upstream service probe (public /status page)" },
  { method: "POST", path: "/api/account/register/options", auth: "none / session", protection: "Origin, ceremony + sign-up limits, unique email, re-auth when adding", purpose: "Start passkey registration" },
  { method: "POST", path: "/api/account/register/verify", auth: "none / session", protection: "Origin, single-use challenge, UV required, unique email", purpose: "Finish registration \u2192 session" },
  { method: "POST", path: "/api/account/login/options", auth: "none", protection: "Origin, ceremony limit", purpose: "Start passkey login (username-less)" },
  { method: "POST", path: "/api/account/login/verify", auth: "none", protection: "Origin, single-use challenge, UV required, sign-counter", purpose: "Finish login \u2192 session" },
  { method: "POST", path: "/api/account/reauth/options", auth: "session", protection: "Origin, ceremony limit", purpose: "Start step-up assertion" },
  { method: "POST", path: "/api/account/reauth/verify", auth: "session", protection: "Origin, challenge bound to session + user, UV required", purpose: "Finish step-up (single-use, \u2264 2 min)" },
  { method: "GET", path: "/api/account/session", auth: "session", protection: "SameSite=Lax cookie, no-store", purpose: "Who am I" },
  { method: "POST", path: "/api/account/logout", auth: "session", protection: "Origin", purpose: "End this session" },
  { method: "GET", path: "/api/account/credentials", auth: "session", protection: "no-store", purpose: "List own passkeys" },
  { method: "PATCH", path: "/api/account/credentials/:id", auth: "session", protection: "Origin, step-up required, scoped to owner", purpose: "Rename a passkey" },
  { method: "DELETE", path: "/api/account/credentials/:id", auth: "session", protection: "Origin, step-up required, last-passkey guard, revokes its sessions", purpose: "Remove a passkey" },
  { method: "GET", path: "/api/account/sessions", auth: "session", protection: "no-store, ids never returned", purpose: "List signed-in devices" },
  { method: "DELETE", path: "/api/account/sessions", auth: "session", protection: "Origin", purpose: "Sign out everywhere else" },
  { method: "GET", path: "/api/account/collection", auth: "session", protection: "\u2014", purpose: "Pull account-synced collection" },
  { method: "PUT", path: "/api/account/collection", auth: "session", protection: "Origin, 1 MB / 20k-entry cap", purpose: "Push collection" },
  { method: "GET", path: "/api/account/flags", auth: "session", protection: "fail-closed (empty on error)", purpose: "Own feature flags" },
  { method: "GET", path: "/api/account/export", auth: "session", protection: "no-store, attachment", purpose: "Data export (JSON)" },
  { method: "DELETE", path: "/api/account", auth: "session", protection: "Origin, step-up required", purpose: "Delete own account" },
  { method: "*", path: "/frost/admin/**", auth: "Cloudflare Access + JWT", protection: "Access JWT (RS256, aud/iss/exp), CSRF guard on writes, 404 on failure, audit log", purpose: "This portal" }
];
async function probeKv(env) {
  if (!env.GEOCODE_CACHE) return { bound: false, ok: false, error: "KV binding missing" };
  const key = `admin-probe:${crypto.randomUUID()}`;
  const start = Date.now();
  try {
    await env.GEOCODE_CACHE.put(key, "1", { expirationTtl: 60 });
    const back = await env.GEOCODE_CACHE.get(key);
    await env.GEOCODE_CACHE.delete(key);
    return { bound: true, ok: back === "1", latencyMs: Date.now() - start };
  } catch (err) {
    return { bound: true, ok: false, latencyMs: Date.now() - start, error: err.message };
  }
}
var adminHtml = admin_default.replace('href="/tailwind.css"', `href="/tailwind.css?h=${TAILWIND_HASH}"`);
var SECURITY_HEADERS = {
  "X-Frame-Options": "DENY",
  // Hash-based script-src, no 'unsafe-inline', no CDN (src/lib/csp.js).
  "Content-Security-Policy": cspForAdmin(),
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Permissions-Policy": "geolocation=(), camera=(), microphone=(), payment=(), usb=(), interest-cohort=()",
  "Referrer-Policy": "strict-origin-when-cross-origin"
};
function jsonResponse3(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...SECURITY_HEADERS } });
}
function notFound() {
  return new Response("Not found", { status: 404, headers: SECURITY_HEADERS });
}
var ADMIN_ORIGINS = /* @__PURE__ */ new Set(["https://entotools.org", "https://www.entotools.org"]);
function crossSiteWrite(request) {
  if (request.method === "GET" || request.method === "HEAD") return false;
  const site = request.headers.get("Sec-Fetch-Site");
  if (site && site !== "same-origin" && site !== "none") return true;
  const origin = request.headers.get("Origin");
  if (origin && !ADMIN_ORIGINS.has(origin) && !origin.startsWith("http://localhost:")) return true;
  return false;
}
async function handleAdminRoute(request, env, path) {
  const identity = await verifyAccessRequest(request, env);
  if (!identity || !identity.email) return notFound();
  const adminEmail = identity.email;
  if (crossSiteWrite(request)) {
    console.warn("[Worker:admin] rejected cross-site write for", adminEmail);
    return notFound();
  }
  const url = new URL(request.url);
  const method = request.method;
  if ((path === "/frost/admin" || path === "/frost/admin/") && method === "GET") {
    return new Response(adminHtml, { headers: { "Content-Type": "text/html; charset=utf-8", ...SECURITY_HEADERS } });
  }
  if (path === "/frost/admin/status" && method === "GET") {
    return jsonResponse3({
      ok: true,
      admin: adminEmail,
      routes: [
        "GET    /frost/admin/users?q=",
        "GET    /frost/admin/users/:id",
        "DELETE /frost/admin/users/:id",
        "DELETE /frost/admin/users/:id/credentials",
        "DELETE /frost/admin/users/:id/sessions",
        "POST   /frost/admin/users/:id/reregister-token",
        "GET    /frost/admin/audit-log",
        "GET    /frost/admin/status/internal",
        "GET    /frost/admin/status/upstream",
        "GET    /frost/admin/flags",
        "POST   /frost/admin/flags",
        "GET    /frost/admin/flags/:key/users",
        "PUT    /frost/admin/users/:id/flags/:key",
        "DELETE /frost/admin/users/:id/flags/:key"
      ]
    });
  }
  if (path === "/frost/admin/users" && method === "GET") {
    const users = await searchUsers(env, url.searchParams.get("q") || "");
    return jsonResponse3({ users });
  }
  let m = path.match(/^\/frost\/admin\/users\/([^/]+)$/);
  if (m && method === "GET") {
    const detail = await getUserDetail(env, m[1]);
    if (!detail) return jsonResponse3({ error: "Not found" }, 404);
    return jsonResponse3(detail);
  }
  if (m && method === "DELETE") {
    const userId = m[1];
    const existing = await getUser(env, userId);
    if (!existing) return jsonResponse3({ error: "Not found" }, 404);
    await deleteUser(env, userId);
    await writeAuditLog(env, { adminIdentity: adminEmail, action: "delete_user", targetUserId: userId, detail: existing.label });
    return jsonResponse3({ success: true });
  }
  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/credentials$/);
  if (m && method === "DELETE") {
    const userId = m[1];
    await deleteAllUserCredentials(env, userId);
    await deleteAllUserSessions(env, userId);
    await writeAuditLog(env, { adminIdentity: adminEmail, action: "reset_credentials", targetUserId: userId });
    return jsonResponse3({ success: true });
  }
  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/sessions$/);
  if (m && method === "DELETE") {
    const userId = m[1];
    await deleteAllUserSessions(env, userId);
    await writeAuditLog(env, { adminIdentity: adminEmail, action: "revoke_sessions", targetUserId: userId });
    return jsonResponse3({ success: true });
  }
  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/reregister-token$/);
  if (m && method === "POST") {
    const userId = m[1];
    const user = await getUser(env, userId);
    if (!user) return jsonResponse3({ error: "Not found" }, 404);
    const token = crypto.randomUUID();
    await env.GEOCODE_CACHE.put(`reregister-token:${token}`, userId, {
      expirationTtl: REREGISTER_TOKEN_TTL_SECONDS
    });
    await writeAuditLog(env, { adminIdentity: adminEmail, action: "issue_reregister_token", targetUserId: userId });
    return jsonResponse3({ token, expiresInSeconds: REREGISTER_TOKEN_TTL_SECONDS });
  }
  if (path === "/frost/admin/audit-log" && method === "GET") {
    return jsonResponse3({ log: await getAuditLog(env) });
  }
  if (path === "/frost/admin/status/internal" && method === "GET") {
    let d1;
    const t0 = Date.now();
    try {
      const stats = await getStats(env);
      d1 = { bound: true, ok: true, latencyMs: Date.now() - t0, ...stats };
    } catch (err) {
      d1 = { bound: !!env.DB, ok: false, latencyMs: Date.now() - t0, error: err.message };
    }
    const kv = await probeKv(env);
    const cf = request.cf || {};
    return jsonResponse3({
      checkedAt: (/* @__PURE__ */ new Date()).toISOString(),
      worker: {
        version: package_default.version,
        builtAt: BUILD_GENERATED_AT,
        colo: cf.colo || null,
        servedFromCountry: cf.country || null,
        cfRay: request.headers.get("cf-ray")
      },
      config: {
        accessConfigured: !!(env.CF_ACCESS_TEAM_DOMAIN && env.CF_ACCESS_AUD),
        accessTeamDomain: env.CF_ACCESS_TEAM_DOMAIN || null,
        githubTokenConfigured: !!env.GITHUB_TOKEN,
        d1Bound: !!env.DB,
        kvBound: !!env.GEOCODE_CACHE,
        assetsBound: !!env.ASSETS
      },
      d1,
      kv,
      limits: LIMITS,
      endpoints: API_ENDPOINTS
    });
  }
  if (path === "/frost/admin/status/upstream" && method === "GET") {
    return jsonResponse3({ services: await checkAllServices() });
  }
  if (path === "/frost/admin/flags" && method === "GET") {
    return jsonResponse3({ flags: await listFlags(env) });
  }
  if (path === "/frost/admin/flags" && method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse3({ error: "Invalid request body." }, 400);
    }
    const key = (body.key || "").trim();
    if (!key) return jsonResponse3({ error: "A flag key is required." }, 400);
    await defineFlag(env, { key, description: body.description });
    await writeAuditLog(env, { adminIdentity: adminEmail, action: "define_flag", detail: key });
    return jsonResponse3({ success: true });
  }
  m = path.match(/^\/frost\/admin\/flags\/([^/]+)\/users$/);
  if (m && method === "GET") {
    return jsonResponse3({ users: await listFlagUsers(env, m[1]) });
  }
  m = path.match(/^\/frost\/admin\/flags\/([^/]+)$/);
  if (m && method === "DELETE") {
    const key = m[1];
    await deleteFlag(env, key);
    await writeAuditLog(env, { adminIdentity: adminEmail, action: "delete_flag", detail: key });
    return jsonResponse3({ success: true });
  }
  m = path.match(/^\/frost\/admin\/users\/([^/]+)\/flags\/([^/]+)$/);
  if (m) {
    const [, userId, flagKey] = m;
    if (method === "PUT") {
      await enableUserFlag(env, userId, flagKey);
      await writeAuditLog(env, { adminIdentity: adminEmail, action: "enable_flag", targetUserId: userId, detail: flagKey });
      return jsonResponse3({ success: true });
    }
    if (method === "DELETE") {
      await disableUserFlag(env, userId, flagKey);
      await writeAuditLog(env, { adminIdentity: adminEmail, action: "disable_flag", targetUserId: userId, detail: flagKey });
      return jsonResponse3({ success: true });
    }
  }
  return jsonResponse3({ error: "Not found" }, 404);
}

// src/index.js
var NCEI_BASE_URL = "https://www.ncei.noaa.gov/access/services/data/v1";
var NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
var NOMINATIM_REVERSE_URL = "https://nominatim.openstreetmap.org/reverse";
var OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive";
var OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
var USER_AGENT2 = "EntoTools/1.0 (educational-project)";
var NCEI_MAX_RETRIES = 3;
var OPEN_METEO_MAX_RETRIES = 3;
var RETRYABLE_STATUS_CODES = /* @__PURE__ */ new Set([429, 500, 502, 503, 504]);
var MAX_DATE_RANGES = 10;
var MAX_RANGE_DAYS = 366 * 5;
var MAX_TOTAL_DAYS = 366 * 10;
var MS_PER_DAY = 24 * 60 * 60 * 1e3;
var ALLOWED_ORIGINS = /* @__PURE__ */ new Set([
  "https://entotools.com",
  "https://www.entotools.com",
  // Second custom domain on the same Pages deployment (see issue #33) — also
  // live and publicly reachable, so it needs the same allowance as .com.
  "https://entotools.org",
  "https://www.entotools.org",
  // Cloudflare Pages' default *.pages.dev domain stays live and publicly
  // reachable alongside the custom domain — visitors landing there (bookmarks,
  // shared links, before DNS propagates) were getting 403'd on feedback.
  "https://entotools-production.pages.dev"
]);
var DEV_ORIGIN = "http://localhost:8788";
function allowedOriginsFor(requestUrl) {
  const host = requestUrl.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "[::1]") {
    return /* @__PURE__ */ new Set([...ALLOWED_ORIGINS, DEV_ORIGIN]);
  }
  return ALLOWED_ORIGINS;
}
var COUNTRY_PROVIDER_MAP = {
  "us": "ncei"
  // Add country-specific providers here, e.g.:
  // 'ca': 'eccc',
  // 'gb': 'met-office',
};
var DEFAULT_PROVIDER = "open-meteo";
function getProviderForCountry(countryCode) {
  if (!countryCode) return DEFAULT_PROVIDER;
  return COUNTRY_PROVIDER_MAP[countryCode.toLowerCase()] || DEFAULT_PROVIDER;
}
var _stationsCache = null;
function jsonResponse4(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      ...extraHeaders
    }
  });
}
function privateJson(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}
function toRad(deg) {
  return deg * Math.PI / 180;
}
function haversine(lat1, lon1, lat2, lon2) {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 3958.8 * Math.asin(Math.sqrt(a));
}
function _get(record, key) {
  let val = record[key];
  if (val !== void 0 && val !== null) return val;
  val = record[key.toLowerCase()];
  if (val !== void 0 && val !== null) return val;
  return record[key.toUpperCase()] ?? null;
}
function formatDate(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(date, days) {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}
async function nominatimGet(params, env) {
  const cacheKey = JSON.stringify(Object.entries(params).sort());
  console.log("[Worker:nominatimGet] lookup (" + Object.keys(params).length + " params)");
  const cached = await env.GEOCODE_CACHE.get(cacheKey, { type: "json" });
  if (cached) {
    console.log("[Worker:nominatimGet] KV cache HIT");
    return cached;
  }
  console.log("[Worker:nominatimGet] KV cache MISS \u2014 fetching from Nominatim");
  const url = new URL(NOMINATIM_URL);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT2 }
  });
  if (!resp.ok) {
    console.error("[Worker:nominatimGet] Nominatim error:", resp.status);
    throw new Error(`Nominatim returned ${resp.status}`);
  }
  const data = await resp.json();
  console.log("[Worker:nominatimGet] Nominatim returned", data.length, "results");
  await env.GEOCODE_CACHE.put(cacheKey, JSON.stringify(data), {
    expirationTtl: 86400
  });
  return data;
}
async function geocodeCityState(city, state, country, env) {
  console.log("[Worker:geocodeCityState] geocoding city/state input");
  const params = { city, state, format: "json", limit: "1", addressdetails: "1" };
  if (country) params.country = country;
  const data = await nominatimGet(
    params,
    env
  );
  if (data && data.length) {
    const cc = data[0].address && data[0].address.country_code || null;
    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
      label: data[0].display_name || "",
      country_code: cc ? cc.toLowerCase() : null
    };
    console.log("[Worker:geocodeCityState] resolved (country:", result.country_code, ")");
    return result;
  }
  console.warn("[Worker:geocodeCityState] no results for the requested city/state");
  return null;
}
async function reverseGeocode(lat, lon, env) {
  console.log("[Worker:reverseGeocode] reverse-geocoding coordinates");
  const cacheKey = JSON.stringify(["reverse", lat, lon]);
  const cached = await env.GEOCODE_CACHE.get(cacheKey, { type: "json" });
  if (cached) {
    console.log("[Worker:reverseGeocode] KV cache HIT \u2014 country:", cached.country_code);
    return cached;
  }
  const url = new URL(NOMINATIM_REVERSE_URL);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");
  const resp = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT2 }
  });
  if (!resp.ok) {
    console.error("[Worker:reverseGeocode] Nominatim reverse error:", resp.status);
    return { country_code: null };
  }
  const data = await resp.json();
  const cc = data.address && data.address.country_code || null;
  const result = { country_code: cc ? cc.toLowerCase() : null };
  console.log("[Worker:reverseGeocode] resolved country:", result.country_code);
  await env.GEOCODE_CACHE.put(cacheKey, JSON.stringify(result), {
    expirationTtl: 86400
  });
  return result;
}
async function nceiFetch(url) {
  console.log("[Worker:nceiFetch] requesting:", url.toString().slice(0, 200));
  let lastErr = null;
  for (let attempt = 0; attempt < NCEI_MAX_RETRIES; attempt++) {
    try {
      if (attempt > 0) console.log("[Worker:nceiFetch] retry attempt", attempt + 1, "/", NCEI_MAX_RETRIES);
      const resp = await fetch(url.toString(), { headers: { "User-Agent": USER_AGENT2 } });
      if (RETRYABLE_STATUS_CODES.has(resp.status)) {
        if (attempt < NCEI_MAX_RETRIES - 1) {
          console.warn("[Worker:nceiFetch] NCEI returned", resp.status, "\u2014 backing off", 2 ** attempt, "s");
          await new Promise((r) => setTimeout(r, 2 ** attempt * 1e3));
          continue;
        }
        console.warn("[Worker:nceiFetch] NCEI returned", resp.status, "on final attempt \u2014 giving up");
      }
      console.log("[Worker:nceiFetch] response status:", resp.status);
      return resp;
    } catch (err) {
      lastErr = err;
      console.error("[Worker:nceiFetch] fetch error on attempt", attempt + 1, ":", err.message);
      if (attempt < NCEI_MAX_RETRIES - 1) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1e3));
      }
    }
  }
  console.error("[Worker:nceiFetch] all retries exhausted");
  throw lastErr || new Error("NCEI request failed after retries");
}
async function getStations(env) {
  if (_stationsCache) {
    console.log("[Worker:getStations] using in-memory cache (" + _stationsCache.length + " stations)");
    return _stationsCache;
  }
  console.log("[Worker:getStations] loading stations.json from static assets");
  const resp = await env.ASSETS.fetch(new Request("https://dummy/stations.json"));
  if (!resp.ok) throw new Error("Failed to load stations.json from static assets");
  const data = await resp.json();
  _stationsCache = data;
  console.log("[Worker:getStations] loaded", data.length, "stations");
  return data;
}
async function findNearestStation(lat, lon, env, maxCandidates = 50) {
  console.log("[Worker:findNearestStation] searching (maxCandidates:", maxCandidates, ")");
  const stations = await getStations(env);
  const cosLat = Math.max(Math.cos(toRad(lat)), 0.1);
  let nearby = [];
  for (let margin = 2; margin <= 16; margin *= 2) {
    const latMargin = margin;
    const lonMargin = margin / cosLat;
    nearby = stations.filter(
      (s) => Math.abs(s.lat - lat) <= latMargin && Math.abs(s.lon - lon) <= lonMargin
    );
    if (nearby.length >= maxCandidates) break;
  }
  if (nearby.length === 0) nearby = stations;
  const ranked = nearby.map((s) => ({ dist: haversine(lat, lon, s.lat, s.lon), station: s })).sort((a, b) => a.dist - b.dist);
  const tempLikely = ranked.filter(
    (r) => /^(USW|USC|USR)/.test(r.station.id)
  );
  const tempUnlikely = ranked.filter(
    (r) => !/^(USW|USC|USR)/.test(r.station.id)
  );
  const candidates = [...tempLikely, ...tempUnlikely].slice(0, maxCandidates);
  const stationIds = candidates.map((c) => c.station.id).join(",");
  const now = /* @__PURE__ */ new Date();
  const endDate = formatDate(now);
  const startDate = formatDate(addDays(now, -30));
  const url = new URL(NCEI_BASE_URL);
  url.searchParams.set("dataset", "daily-summaries");
  url.searchParams.set("dataTypes", "TMIN,TMAX,PRCP");
  url.searchParams.set("stations", stationIds);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("format", "json");
  url.searchParams.set("units", "standard");
  const resp = await nceiFetch(url);
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data || !data.length) return null;
  const idsWithData = /* @__PURE__ */ new Set();
  for (const rec of data) {
    const sid = _get(rec, "station");
    if (sid && (_get(rec, "TMIN") != null && _get(rec, "TMIN") !== "" || _get(rec, "TMAX") != null && _get(rec, "TMAX") !== "" || _get(rec, "PRCP") != null && _get(rec, "PRCP") !== "")) {
      idsWithData.add(sid);
    }
  }
  console.log("[Worker:findNearestStation]", idsWithData.size, "stations have data out of", candidates.length, "candidates");
  for (const c of candidates) {
    if (idsWithData.has(c.station.id)) {
      const result = {
        station_id: c.station.id,
        station_name: c.station.name,
        station_lat: c.station.lat,
        station_lon: c.station.lon,
        distance_miles: Math.round(c.dist * 10) / 10
      };
      console.log("[Worker:findNearestStation] best station:", result.station_id, result.station_name, "(" + result.distance_miles + " mi)");
      return result;
    }
  }
  console.warn("[Worker:findNearestStation] no station with data found near the requested location");
  return null;
}
async function getWeatherData(stationId, startDate, endDate) {
  console.log("[Worker:getWeatherData] station:", stationId, "range:", startDate, "to", endDate);
  const url = new URL(NCEI_BASE_URL);
  url.searchParams.set("dataset", "daily-summaries");
  url.searchParams.set("dataTypes", "TMIN,TMAX,PRCP");
  url.searchParams.set("stations", stationId);
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("format", "json");
  url.searchParams.set("includeStationName", "true");
  url.searchParams.set("includeStationLocation", "true");
  url.searchParams.set("units", "standard");
  const resp = await nceiFetch(url);
  if (!resp.ok) throw new Error(`NCEI returned ${resp.status}`);
  const raw = await resp.json();
  const byDate = {};
  for (const rec of raw) {
    const d = (_get(rec, "date") || "").slice(0, 10);
    if (!d) continue;
    if (!byDate[d]) byDate[d] = { date: d, TMIN: null, TMAX: null, PRCP: null };
    const tmin = _get(rec, "TMIN");
    const tmax = _get(rec, "TMAX");
    const prcp = _get(rec, "PRCP");
    if (tmin != null && tmin !== "") byDate[d].TMIN = Math.round(parseFloat(tmin) * 10) / 10;
    if (tmax != null && tmax !== "") byDate[d].TMAX = Math.round(parseFloat(tmax) * 10) / 10;
    if (prcp != null && prcp !== "") byDate[d].PRCP = Math.round(parseFloat(prcp) * 100) / 100;
  }
  const all = [];
  const cur = /* @__PURE__ */ new Date(startDate + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(endDate + "T00:00:00Z");
  if (isNaN(cur.getTime()) || isNaN(end.getTime())) {
    throw new Error(`Unparseable date range: ${startDate} to ${endDate}`);
  }
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    all.push(byDate[d] || { date: d, TMIN: null, TMAX: null, PRCP: null });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  console.log("[Worker:getWeatherData] returned", all.length, "daily records");
  return all;
}
function calculatePrecipAccumulation(weatherData) {
  let accum = 0;
  return weatherData.map((rec) => {
    const prcp = rec.PRCP || 0;
    accum += prcp;
    return { ...rec, PRCP_ACCUM: Math.round(accum * 100) / 100 };
  });
}
async function fetchWithRetry(url, options = {}, { maxRetries = 3, label = "fetchWithRetry" } = {}) {
  let lastErr = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (attempt > 0) console.log(`[Worker:${label}] retry attempt ${attempt + 1}/${maxRetries}`);
      const resp = await fetch(url.toString(), options);
      if (RETRYABLE_STATUS_CODES.has(resp.status)) {
        const delay2 = 2 ** attempt * 1e3;
        console.warn(`[Worker:${label}] received ${resp.status} \u2014 backing off ${delay2}ms (attempt ${attempt + 1}/${maxRetries})`);
        if (attempt < maxRetries - 1) {
          await new Promise((r) => setTimeout(r, delay2));
          continue;
        }
        throw new Error(`${label} returned ${resp.status} after ${maxRetries} attempts`);
      }
      return resp;
    } catch (err) {
      lastErr = err;
      if (attempt < maxRetries - 1) {
        const delay2 = 2 ** attempt * 1e3;
        console.error(`[Worker:${label}] fetch error on attempt ${attempt + 1}:`, err.message, `\u2014 retrying in ${delay2}ms`);
        await new Promise((r) => setTimeout(r, delay2));
      }
    }
  }
  console.error(`[Worker:${label}] all ${maxRetries} retries exhausted`);
  throw lastErr || new Error(`${label} failed after ${maxRetries} retries`);
}
function celsiusToFahrenheit(c) {
  return Math.round((c * 9 / 5 + 32) * 10) / 10;
}
function mmToInches(mm) {
  return Math.round(mm / 25.4 * 100) / 100;
}
async function getWeatherDataOpenMeteo(lat, lon, startDate, endDate) {
  console.log("[Worker:getWeatherDataOpenMeteo] fetching archive for range:", startDate, "to", endDate);
  const url = new URL(OPEN_METEO_ARCHIVE_URL);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);
  url.searchParams.set("daily", "temperature_2m_min,temperature_2m_max,precipitation_sum");
  url.searchParams.set("timezone", "UTC");
  const resp = await fetchWithRetry(
    url.toString(),
    { headers: { "User-Agent": USER_AGENT2 } },
    { maxRetries: OPEN_METEO_MAX_RETRIES, label: "Open-Meteo Archive" }
  );
  if (!resp.ok) {
    console.error("[Worker:getWeatherDataOpenMeteo] Open-Meteo error:", resp.status);
    throw new Error(`Open-Meteo returned ${resp.status}`);
  }
  const raw = await resp.json();
  const daily = raw.daily || {};
  const dates = daily.time || [];
  const tmins = daily.temperature_2m_min || [];
  const tmaxs = daily.temperature_2m_max || [];
  const prcps = daily.precipitation_sum || [];
  const all = [];
  for (let i = 0; i < dates.length; i++) {
    all.push({
      date: dates[i],
      TMIN: tmins[i] != null ? celsiusToFahrenheit(tmins[i]) : null,
      TMAX: tmaxs[i] != null ? celsiusToFahrenheit(tmaxs[i]) : null,
      PRCP: prcps[i] != null ? mmToInches(prcps[i]) : null
    });
  }
  const byDate = {};
  for (const rec of all) byDate[rec.date] = rec;
  const filled = [];
  const cur = /* @__PURE__ */ new Date(startDate + "T00:00:00Z");
  const end = /* @__PURE__ */ new Date(endDate + "T00:00:00Z");
  if (isNaN(cur.getTime()) || isNaN(end.getTime())) {
    throw new Error(`Unparseable date range: ${startDate} to ${endDate}`);
  }
  while (cur <= end) {
    const d = cur.toISOString().slice(0, 10);
    filled.push(byDate[d] || { date: d, TMIN: null, TMAX: null, PRCP: null });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  console.log("[Worker:getWeatherDataOpenMeteo] returned", filled.length, "daily records");
  return filled;
}
async function getForecastOpenMeteo(lat, lon) {
  console.log("[Worker:getForecastOpenMeteo] fetching forecast");
  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("daily", "temperature_2m_min,temperature_2m_max,precipitation_sum");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("precipitation_unit", "inch");
  url.searchParams.set("forecast_days", "16");
  url.searchParams.set("past_days", "5");
  url.searchParams.set("timezone", "UTC");
  const resp = await fetchWithRetry(
    url.toString(),
    { headers: { "User-Agent": USER_AGENT2 } },
    { maxRetries: OPEN_METEO_MAX_RETRIES, label: "Open-Meteo Forecast" }
  );
  if (!resp.ok) throw new Error(`Open-Meteo Forecast returned ${resp.status}`);
  const raw = await resp.json();
  const daily = raw.daily || {};
  const dates = daily.time || [];
  const tmins = daily.temperature_2m_min || [];
  const tmaxs = daily.temperature_2m_max || [];
  const precips = daily.precipitation_sum || [];
  const forecast = [];
  for (let i = 0; i < dates.length; i++) {
    if (tmins[i] != null && tmaxs[i] != null) {
      forecast.push({
        date: dates[i],
        TMIN: Math.round(tmins[i] * 10) / 10,
        TMAX: Math.round(tmaxs[i] * 10) / 10,
        PRCP: precips[i] != null ? Math.round(precips[i] * 100) / 100 : 0,
        is_forecast: true
      });
    }
  }
  console.log("[Worker:getForecastOpenMeteo] returned", forecast.length, "forecast days");
  return forecast;
}
async function handleSearch(request, env) {
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return jsonResponse4({ error: "Invalid request body \u2014 expected JSON." }, 400);
  }
  const mode = body.mode;
  console.log("[Worker:handleSearch] mode:", mode, "| dateRanges:", Array.isArray(body.dateRanges) ? body.dateRanges.length : body.startDate ? 1 : 0);
  let dateRanges = body.dateRanges;
  if (!dateRanges || !dateRanges.length) {
    dateRanges = [{ startDate: body.startDate, endDate: body.endDate, label: "Range 1" }];
  }
  if (!Array.isArray(dateRanges)) {
    return jsonResponse4({ error: "Invalid date ranges." }, 400);
  }
  if (dateRanges.length > MAX_DATE_RANGES) {
    return jsonResponse4({ error: `Too many date ranges (max ${MAX_DATE_RANGES}).` }, 400);
  }
  let totalDays = 0;
  for (const dr of dateRanges) {
    const label = dr.label || "";
    const sd = dr.startDate;
    const ed = dr.endDate;
    if (!sd || !ed) {
      return jsonResponse4({ error: `Missing start or end date for '${label || "a range"}'.` }, 400);
    }
    const sdDate = new Date(sd);
    const edDate = new Date(ed);
    if (isNaN(sdDate.getTime()) || isNaN(edDate.getTime())) {
      return jsonResponse4({ error: `Invalid date format for '${label || "a range"}'.` }, 400);
    }
    if (edDate < sdDate) {
      return jsonResponse4({ error: `End date is before start date for '${label || "a range"}'.` }, 400);
    }
    const spanDays = Math.floor((edDate.getTime() - sdDate.getTime()) / MS_PER_DAY) + 1;
    if (spanDays > MAX_RANGE_DAYS) {
      return jsonResponse4({ error: `Date range '${label || "a range"}' is too large (max ${MAX_RANGE_DAYS} days).` }, 400);
    }
    totalDays += spanDays;
  }
  if (totalDays > MAX_TOTAL_DAYS) {
    return jsonResponse4({ error: `Combined date ranges are too large (max ${MAX_TOTAL_DAYS} days total).` }, 400);
  }
  let lat = null;
  let lon = null;
  let locationLabel = "";
  let countryCode = null;
  try {
    if (mode === "city") {
      const city = (body.city || "").trim();
      const state = (body.state || "").trim();
      const country = (body.country || "").trim();
      if (!city || !state)
        return jsonResponse4({ error: "Please enter both city and state/province." }, 400);
      const geo = await geocodeCityState(city, state, country, env);
      if (!geo) return jsonResponse4({ error: "Could not resolve that location." }, 404);
      ({ lat, lon, label: locationLabel, country_code: countryCode } = geo);
    } else if (mode === "latlon") {
      lat = parseFloat(body.lat);
      lon = parseFloat(body.lon);
      if (isNaN(lat) || isNaN(lon))
        return jsonResponse4({ error: "Invalid latitude / longitude values." }, 400);
      if (lat < -90 || lat > 90 || lon < -180 || lon > 180)
        return jsonResponse4({ error: "Latitude must be between -90 and 90, and longitude between -180 and 180." }, 400);
      locationLabel = `${lat}, ${lon}`;
      try {
        const rev = await reverseGeocode(lat, lon, env);
        countryCode = rev.country_code;
      } catch (e) {
        console.warn("[Worker:handleSearch] reverse geocode failed \u2014 defaulting provider:", e.message);
      }
    } else {
      return jsonResponse4({ error: "Invalid search mode." }, 400);
    }
  } catch (err) {
    console.error("[Worker:handleSearch] geocoding failed:", err.message);
    return jsonResponse4({ error: "Could not resolve that location. Please try again." }, 500);
  }
  let provider = getProviderForCountry(countryCode);
  const isFallback = !!countryCode && !COUNTRY_PROVIDER_MAP[countryCode.toLowerCase()];
  let providerFallback = false;
  let fallbackReason = "";
  console.log("[Worker:handleSearch] geocoded \u2014 country:", countryCode, "provider:", provider, "fallback:", isFallback);
  let station;
  const makeOpenMeteoStation = () => ({
    station_id: `OM:${lat.toFixed(4)},${lon.toFixed(4)}`,
    station_name: "Open-Meteo Grid Point",
    station_lat: lat,
    station_lon: lon,
    distance_miles: 0
  });
  if (provider === "ncei") {
    try {
      station = await findNearestStation(lat, lon, env);
    } catch (err) {
      console.error("[Worker:handleSearch] NCEI station lookup FAILED:", err.message);
      console.warn("[Worker:handleSearch] falling back to Open-Meteo due to station lookup failure");
      provider = "open-meteo";
      providerFallback = true;
      fallbackReason = `NCEI station lookup failed (${err.message}). Using Open-Meteo as a fallback data source.`;
      station = makeOpenMeteoStation();
    }
    if (!station) {
      console.warn("[Worker:handleSearch] no NCEI station found with recent data \u2014 falling back to Open-Meteo");
      provider = "open-meteo";
      providerFallback = true;
      fallbackReason = "No NCEI weather stations with recent data were found near this location. Using Open-Meteo as a fallback data source.";
      station = makeOpenMeteoStation();
    }
  } else {
    station = makeOpenMeteoStation();
  }
  const loggedStationId = provider === "ncei" ? station.station_id : "(grid point)";
  console.log("[Worker:handleSearch] resolved station:", loggedStationId, station.station_name, "| provider:", provider, "| providerFallback:", providerFallback);
  console.log("[Worker:handleSearch] using", provider, "| station:", loggedStationId, "\u2014 fetching", dateRanges.length, "date range(s)");
  let forecastDays = [];
  let forecastUnavailable = false;
  try {
    forecastDays = await getForecastOpenMeteo(lat, lon);
    console.log("[Worker:handleSearch] Open-Meteo forecast fetched:", forecastDays.length, "days");
  } catch (e) {
    console.warn("[Worker:handleSearch] forecast fetch failed \u2014 forecast will be skipped:", e.message);
    forecastUnavailable = true;
  }
  const today = formatDate(/* @__PURE__ */ new Date());
  const forecastHorizonEnd = forecastDays.length ? forecastDays.reduce((max, f) => f.date > max ? f.date : max, forecastDays[0].date) : today;
  let resultsByRange;
  let serviceErrors = [];
  try {
    resultsByRange = await Promise.all(
      dateRanges.map(async (dr) => {
        const label = dr.label || "";
        const sd = dr.startDate;
        const ed = dr.endDate;
        let temps;
        if (provider === "ncei") {
          try {
            temps = await getWeatherData(station.station_id, sd, ed);
            console.log('[Worker:handleSearch] NCEI data fetched for range "' + label + '":', temps.length, "records");
          } catch (nceiErr) {
            console.error('[Worker:handleSearch] NCEI data fetch FAILED for range "' + label + '":', nceiErr.message);
            console.warn('[Worker:handleSearch] falling back to Open-Meteo for range "' + label + '"');
            try {
              temps = await getWeatherDataOpenMeteo(lat, lon, sd, ed);
              console.log('[Worker:handleSearch] Open-Meteo fallback data fetched for range "' + label + '":', temps.length, "records");
            } catch (omErr) {
              console.error('[Worker:handleSearch] Open-Meteo fallback ALSO failed for range "' + label + '":', omErr.message);
              serviceErrors.push({ service: "Open-Meteo", error: omErr.message });
              throw new Error(`Both NCEI and Open-Meteo are unavailable: ${nceiErr.message} / ${omErr.message}`);
            }
            if (!providerFallback) {
              providerFallback = true;
              fallbackReason = `NCEI data request failed (${nceiErr.message}). Some or all date ranges used Open-Meteo as a fallback data source.`;
            }
          }
        } else {
          try {
            temps = await getWeatherDataOpenMeteo(lat, lon, sd, ed);
            console.log('[Worker:handleSearch] Open-Meteo data fetched for range "' + label + '":', temps.length, "records");
          } catch (omErr) {
            console.error('[Worker:handleSearch] Open-Meteo FAILED for range "' + label + '":', omErr.message);
            serviceErrors.push({ service: "Open-Meteo", error: omErr.message });
            throw omErr;
          }
        }
        let lastActualDate = null;
        for (let i = temps.length - 1; i >= 0; i--) {
          if (temps[i].TMIN != null && temps[i].TMAX != null) {
            lastActualDate = temps[i].date;
            break;
          }
        }
        const forecastCutoff = ed >= today ? forecastHorizonEnd : ed;
        const forecast = forecastDays.filter((f) => f.date <= forecastCutoff && (lastActualDate === null ? f.date >= sd : f.date > lastActualDate));
        console.log("[Worker:handleSearch] appending", forecast.length, "forecast days after", lastActualDate || "(no observations)", 'to range "' + label + '"');
        const forecastByDate = {};
        for (const f of forecast) forecastByDate[f.date] = f;
        const tempDates = new Set(temps.map((t) => t.date));
        const merged = temps.map((t) => forecastByDate[t.date] || t);
        const extraForecastDays = forecast.filter((f) => !tempDates.has(f.date)).sort((a, b) => a.date.localeCompare(b.date));
        const combined = merged.concat(extraForecastDays);
        const tempsWithAccum = calculatePrecipAccumulation(combined);
        const effectiveEnd = combined.length ? combined[combined.length - 1].date : ed;
        return { label, startDate: sd, endDate: effectiveEnd, temperatures: tempsWithAccum };
      })
    );
  } catch (err) {
    console.error("[Worker:handleSearch] data fetch failed entirely:", err.message, err.stack);
    const isTransient = /502|503|504|after \d+ attempts/.test(err.message);
    const serviceName = serviceErrors.length ? serviceErrors[0].service : "the weather data provider";
    const userMessage = isTransient ? `${serviceName} is currently experiencing an outage and is not responding. Please try again in a few minutes.` : "Failed to retrieve weather data. Please try again later.";
    return jsonResponse4({
      error: userMessage,
      service_error: {
        transient: isTransient,
        service: serviceName
      }
    }, 503);
  }
  if (providerFallback) {
    console.warn("[Worker:handleSearch] PROVIDER FALLBACK active \u2014 reason:", fallbackReason);
  }
  console.log("[Worker:handleSearch] returning", resultsByRange.length, "range(s) of data | provider:", provider, "| fallback:", isFallback, "| providerFallback:", providerFallback);
  return jsonResponse4({
    location: locationLabel,
    search_lat: lat,
    search_lon: lon,
    country_code: countryCode,
    provider,
    is_fallback: isFallback,
    provider_fallback: providerFallback,
    fallback_reason: fallbackReason,
    forecast_unavailable: forecastUnavailable,
    station,
    ranges: resultsByRange
  });
}
var GITHUB_REPO_OWNER = "o-mettam";
var GITHUB_REPO_NAME = "EntoTools-Production";
var FEEDBACK_TYPE_LABELS = {
  bug: "bug",
  feature: "enhancement",
  other: "feedback"
};
function feedbackRateLimited(env, ip) {
  return rateLimited(env, ip, "fb-rl", LIMITS.feedback.limit, LIMITS.feedback.windowSeconds);
}
function searchRateLimited(env, ip) {
  return rateLimited(env, ip, "search-rl", LIMITS.search.limit, LIMITS.search.windowSeconds);
}
function accountRateLimited(env, ip) {
  return rateLimited(env, ip, "acct-rl", LIMITS.ceremony.limit, LIMITS.ceremony.windowSeconds);
}
function statusRateLimited(env, ip) {
  return rateLimited(env, ip, "status-rl", LIMITS.status.limit, LIMITS.status.windowSeconds);
}
var PII_PATTERNS = [
  // Email addresses
  [/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, "[email redacted]"],
  // IPv4 addresses
  [/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, "[ip redacted]"],
  // IPv6 — full form
  [/\b([0-9a-fA-F]{1,4}:){2,7}[0-9a-fA-F]{1,4}\b/g, "[ip redacted]"],
  // IPv6 — "::"-compressed form (e.g. 2001:db8::1, fe80::)
  [/\b([0-9a-fA-F]{1,4}:){1,7}:([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}\b)?/g, "[ip redacted]"],
  // Labelled coordinates at ANY precision (lat: 40.71, "lon":-74, lng=12.5)
  [/\b(lat|latitude|lon|lng|longitude)(["']?\s*[:=]\s*["']?)-?\d{1,3}(\.\d+)?/gi, "$1$2[coord redacted]"],
  // Comma-separated coordinate pairs with 2+ decimals (40.71, -74.05)
  [/-?\d{1,3}\.\d{2,}\s*,\s*-?\d{1,3}\.\d{2,}/g, "[coord redacted]"],
  // Standalone high-precision decimals (4+ places — likely coordinates)
  [/-?\d{1,3}\.\d{4,}/g, "[coord redacted]"],
  // Bearer/auth tokens
  [/(Bearer\s+|token[=:]\s*)[\w\-._~+/]+=*/gi, "$1[token redacted]"],
  // Generic long hex/base64 strings (API keys, tokens)
  [/\b[A-Za-z0-9_\-]{32,}\b/g, "[key redacted]"]
];
function redactPii(str) {
  let out = String(str);
  for (const [regex, replacement] of PII_PATTERNS) out = out.replace(regex, replacement);
  return out;
}
function sanitizeIssueText(str, maxLen = 4e3) {
  return String(str).slice(0, maxLen).replace(/[<>]/g, (c) => c === "<" ? "\u2039" : "\u203A").replace(/[`*_~#\[\]()|!]/g, "\\$&");
}
async function handleFeedback(request, env) {
  const allowedOrigins = allowedOriginsFor(new URL(request.url));
  const origin = request.headers.get("Origin");
  const cors = allowedOrigins.has(origin) ? { "Access-Control-Allow-Origin": origin, "Vary": "Origin" } : { "Access-Control-Allow-Origin": "null" };
  const reply = (data, status = 200) => jsonResponse4(data, status, cors);
  if (!allowedOrigins.has(origin)) {
    console.warn("[Worker:handleFeedback] rejected disallowed/missing origin:", origin);
    return reply({ error: "Forbidden." }, 403);
  }
  const ip = request.headers.get("CF-Connecting-IP") || "";
  if (await feedbackRateLimited(env, ip)) {
    console.warn("[Worker:handleFeedback] rate limit exceeded for IP:", maskIp(ip));
    return reply({ error: "Too many feedback submissions. Please try again later." }, 429);
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return reply({ error: "Invalid request body \u2014 expected JSON." }, 400);
  }
  const { type, title, description, email, page, app_version, console_logs } = body;
  if (!title || !title.trim()) {
    return reply({ error: "A title is required." }, 400);
  }
  if (!description || !description.trim()) {
    return reply({ error: "A description is required." }, 400);
  }
  const trimmedEmail = email && email.trim();
  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    return reply({ error: "Please enter a valid email address, or leave it blank." }, 400);
  }
  const token = env.GITHUB_TOKEN;
  if (!token) {
    console.error("[Worker:handleFeedback] GITHUB_TOKEN secret is not configured");
    return reply({ error: "Feedback submission is not configured on this server." }, 500);
  }
  const feedbackType = type || "other";
  const label = FEEDBACK_TYPE_LABELS[feedbackType] || "feedback";
  let issueBody = sanitizeIssueText(redactPii(description.trim()));
  issueBody += "\n\n---\n";
  issueBody += `**Type:** ${sanitizeIssueText(feedbackType, 40)}
`;
  if (page) issueBody += `**Page:** ${sanitizeIssueText(redactPii(page), 200)}
`;
  if (app_version) issueBody += `**App version:** ${sanitizeIssueText(String(app_version), 40)}
`;
  if (trimmedEmail) issueBody += `**Contact email:** ${sanitizeIssueText(trimmedEmail, 200)}
`;
  issueBody += `**Submitted:** ${(/* @__PURE__ */ new Date()).toISOString()}
`;
  if (console_logs && console_logs.trim()) {
    const safeLogs = redactPii(console_logs.trim().slice(0, 5e3)).replace(/`/g, "\u2018");
    issueBody += "\n<details>\n<summary>Browser Console Logs (PII sanitized)</summary>\n\n```\n";
    issueBody += safeLogs;
    issueBody += "\n```\n</details>\n";
  }
  const issuePayload = {
    title: `[Feedback] ${sanitizeIssueText(redactPii(title.trim()), 200)}`,
    body: issueBody,
    labels: [label, "Needs Triage"]
  };
  console.log("[Worker:handleFeedback] creating GitHub issue:", issuePayload.title);
  const ghResp = await fetch(
    `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/issues`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": USER_AGENT2,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(issuePayload)
    }
  );
  if (!ghResp.ok) {
    const errText = await ghResp.text();
    console.error("[Worker:handleFeedback] GitHub API error:", ghResp.status, errText);
    return reply({ error: "Failed to submit feedback. Please try again later." }, 502);
  }
  const issue = await ghResp.json();
  console.log("[Worker:handleFeedback] issue created:", issue.html_url);
  return reply({ success: true, issue_url: issue.html_url });
}
async function handleStatusCheck(url) {
  const service = url.searchParams.get("service");
  if (!STATUS_SERVICES[service]) return jsonResponse4({ error: "Unknown service" }, 400);
  return jsonResponse4(await checkService(service));
}
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    console.log("[Worker] incoming", request.method, url.pathname);
    if (request.method === "OPTIONS") {
      const isPublicApi = url.pathname === "/api/search" || url.pathname.startsWith("/api/status/");
      if (!isPublicApi) return new Response(null, { status: 204 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400"
        }
      });
    }
    if (url.pathname === "/api/search" && request.method === "POST") {
      const ip = request.headers.get("CF-Connecting-IP") || "";
      if (await searchRateLimited(env, ip)) {
        console.warn("[Worker:handleSearch] rate limit exceeded for IP:", maskIp(ip));
        return jsonResponse4({ error: "Too many requests. Please try again later." }, 429);
      }
      try {
        return await handleSearch(request, env);
      } catch (err) {
        console.error("[Worker:handleSearch] unexpected error:", err.message, err.stack);
        return jsonResponse4({ error: "An unexpected server error occurred. Please try again." }, 500);
      }
    }
    if (url.pathname === "/api/feedback" && request.method === "POST") {
      try {
        return await handleFeedback(request, env);
      } catch (err) {
        console.error("[Worker:handleFeedback] unexpected error:", err.message, err.stack);
        return jsonResponse4({ error: "An unexpected server error occurred. Please try again." }, 500);
      }
    }
    if (url.pathname === "/api/status/ping" && request.method === "GET") {
      return jsonResponse4({ ok: true, ts: Date.now() });
    }
    if (url.pathname === "/api/status/check" && request.method === "GET") {
      const ip = request.headers.get("CF-Connecting-IP") || "";
      if (await statusRateLimited(env, ip)) {
        console.warn("[Worker:handleStatusCheck] rate limit exceeded for IP:", maskIp(ip));
        return jsonResponse4({ ok: false, error: "Too many requests. Please try again later." }, 429);
      }
      try {
        return await handleStatusCheck(url);
      } catch (err) {
        console.error("[Worker:handleStatusCheck] unexpected error:", err.message);
        return jsonResponse4({ ok: false, error: "Status check failed." });
      }
    }
    const ACCOUNT_ROUTES = /* @__PURE__ */ new Set([
      "/api/account/register/options",
      "/api/account/register/verify",
      "/api/account/login/options",
      "/api/account/login/verify",
      "/api/account/reauth/options",
      "/api/account/reauth/verify",
      "/api/account/logout",
      "/api/account/session",
      "/api/account/credentials",
      "/api/account/collection",
      "/api/account/sessions",
      "/api/account/export",
      "/api/account"
    ]);
    const credentialDeleteMatch = url.pathname.match(/^\/api\/account\/credentials\/([^/]+)$/);
    if (ACCOUNT_ROUTES.has(url.pathname) || credentialDeleteMatch) {
      const isReadOnly = request.method === "GET" || request.method === "HEAD";
      const allowedOrigins = allowedOriginsFor(url);
      const origin = request.headers.get("Origin");
      if (!isReadOnly && !allowedOrigins.has(origin)) {
        console.warn("[Worker:account] rejected disallowed/missing origin:", origin);
        return privateJson({ error: "Forbidden." }, 403);
      }
      const isCeremonyStart = url.pathname.endsWith("/options");
      if (isCeremonyStart) {
        const ip = request.headers.get("CF-Connecting-IP") || "";
        if (await accountRateLimited(env, ip)) {
          console.warn("[Worker:account] rate limit exceeded for IP:", maskIp(ip));
          return privateJson({ error: "Too many attempts. Please try again later." }, 429);
        }
      }
      try {
        if (url.pathname === "/api/account/register/options" && request.method === "POST") return await handleRegisterOptions(request, env);
        if (url.pathname === "/api/account/register/verify" && request.method === "POST") return await handleRegisterVerify(request, env);
        if (url.pathname === "/api/account/login/options" && request.method === "POST") return await handleLoginOptions(request, env);
        if (url.pathname === "/api/account/login/verify" && request.method === "POST") return await handleLoginVerify(request, env);
        if (url.pathname === "/api/account/logout" && request.method === "POST") return await handleLogout(request, env);
        if (url.pathname === "/api/account/session" && request.method === "GET") return await handleSession(request, env);
        if (url.pathname === "/api/account/credentials" && request.method === "GET") return await handleListCredentials(request, env);
        if (credentialDeleteMatch && request.method === "DELETE") return await handleDeleteCredential(request, env, credentialDeleteMatch[1]);
        if (credentialDeleteMatch && request.method === "PATCH") return await handleRenameCredential(request, env, credentialDeleteMatch[1]);
        if (url.pathname === "/api/account/collection" && request.method === "GET") return await handleGetCollection(request, env);
        if (url.pathname === "/api/account/collection" && request.method === "PUT") return await handlePutCollection(request, env);
        if (url.pathname === "/api/account/reauth/options" && request.method === "POST") return await handleReauthOptions(request, env);
        if (url.pathname === "/api/account/reauth/verify" && request.method === "POST") return await handleReauthVerify(request, env);
        if (url.pathname === "/api/account/sessions" && request.method === "GET") return await handleListSessions(request, env);
        if (url.pathname === "/api/account/sessions" && request.method === "DELETE") return await handleRevokeOtherSessions(request, env);
        if (url.pathname === "/api/account/export" && request.method === "GET") return await handleExport(request, env);
        if (url.pathname === "/api/account" && request.method === "DELETE") return await handleDeleteAccount(request, env);
      } catch (err) {
        console.error("[Worker:account] unexpected error:", err.message, err.stack);
        return privateJson({ error: "An unexpected server error occurred. Please try again." }, 500);
      }
    }
    if (url.pathname === "/api/account/flags" && request.method === "GET") {
      try {
        return await handleMyFlags(request, env);
      } catch (err) {
        console.error("[Worker:flags] unexpected error:", err.message, err.stack);
        return privateJson({ flags: [] });
      }
    }
    if (url.pathname.startsWith("/api/")) {
      return privateJson({ error: "Not found" }, 404);
    }
    if (url.pathname === "/frost/admin" || url.pathname.startsWith("/frost/admin/")) {
      try {
        return await handleAdminRoute(request, env, url.pathname);
      } catch (err) {
        console.error("[Worker:admin] unexpected error:", err.message, err.stack);
        return new Response("Not found", { status: 404 });
      }
    }
    const assetResponse = await env.ASSETS.fetch(request);
    const contentType = assetResponse.headers.get("Content-Type") || "";
    const isCode = url.pathname.endsWith(".js") || url.pathname.endsWith(".css");
    const isHtml = contentType.includes("text/html");
    if (isCode || isHtml) {
      const headers = new Headers(assetResponse.headers);
      if (isCode) headers.set("Cache-Control", "no-cache");
      if (isHtml) headers.set("Content-Security-Policy", cspForPage(url.pathname, assetResponse.status));
      return new Response(assetResponse.body, {
        status: assetResponse.status,
        statusText: assetResponse.statusText,
        headers
      });
    }
    return assetResponse;
  }
};
export {
  index_default as default
};
/*! Bundled license information:

pvtsutils/build/index.js:
  (*!
   * MIT License
   * 
   * Copyright (c) 2017-2024 Peculiar Ventures, LLC
   * 
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   * 
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   * 
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   * 
   *)

reflect-metadata/Reflect.js:
  (*! *****************************************************************************
  Copyright (C) Microsoft. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0
  
  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.
  
  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** *)

pvutils/build/utils.es.js:
  (*!
   Copyright (c) Peculiar Ventures, LLC
  *)

asn1js/build/index.es.js:
  (*!
   * Copyright (c) 2014, GMO GlobalSign
   * Copyright (c) 2015-2022, Peculiar Ventures
   * All rights reserved.
   * 
   * Author 2014-2019, Yury Strozhevsky
   * 
   * Redistribution and use in source and binary forms, with or without modification,
   * are permitted provided that the following conditions are met:
   * 
   * * Redistributions of source code must retain the above copyright notice, this
   *   list of conditions and the following disclaimer.
   * 
   * * Redistributions in binary form must reproduce the above copyright notice, this
   *   list of conditions and the following disclaimer in the documentation and/or
   *   other materials provided with the distribution.
   * 
   * * Neither the name of the copyright holder nor the names of its
   *   contributors may be used to endorse or promote products derived from
   *   this software without specific prior written permission.
   * 
   * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
   * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
   * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
   * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
   * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
   * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
   * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
   * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
   * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
   * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
   * 
   *)

tslib/tslib.es6.js:
  (*! *****************************************************************************
  Copyright (c) Microsoft Corporation.
  
  Permission to use, copy, modify, and/or distribute this software for any
  purpose with or without fee is hereby granted.
  
  THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  PERFORMANCE OF THIS SOFTWARE.
  ***************************************************************************** *)

@peculiar/x509/build/x509.es.js:
  (*!
   * MIT License
   * 
   * Copyright (c) Peculiar Ventures. All rights reserved.
   * 
   * Permission is hereby granted, free of charge, to any person obtaining a copy
   * of this software and associated documentation files (the "Software"), to deal
   * in the Software without restriction, including without limitation the rights
   * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   * copies of the Software, and to permit persons to whom the Software is
   * furnished to do so, subject to the following conditions:
   * 
   * The above copyright notice and this permission notice shall be included in all
   * copies or substantial portions of the Software.
   * 
   * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   * SOFTWARE.
   * 
   *)
*/
