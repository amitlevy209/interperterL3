"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalToResult = exports.mapOptional = exports.maybe = exports.mapv = exports.bind = exports.isNone = exports.isSome = exports.makeNone = exports.makeSome = void 0;
const list_1 = require("./list");
const result_1 = require("./result");
const makeSome = (value) => ({
    tag: "Some",
    value: value,
});
exports.makeSome = makeSome;
const makeNone = () => ({ tag: "None" });
exports.makeNone = makeNone;
const isSome = (o) => o.tag === "Some";
exports.isSome = isSome;
const isNone = (o) => o.tag === "None";
exports.isNone = isNone;
const bind = (o, f) => ((0, exports.isSome)(o) ? f(o.value) : o);
exports.bind = bind;
const mapv = (o, f) => (0, exports.isSome)(o) ? (0, exports.makeSome)(f(o.value)) : o;
exports.mapv = mapv;
const maybe = (o, ifSome, ifNone) => ((0, exports.isSome)(o) ? ifSome(o.value) : ifNone());
exports.maybe = maybe;
const mapOptional = (f, list) => (0, list_1.isNonEmptyList)(list) ? (0, exports.bind)(f((0, list_1.first)(list)), (fa) => (0, exports.bind)((0, exports.mapOptional)(f, (0, list_1.rest)(list)), (fas) => (0, exports.makeSome)((0, list_1.cons)(fa, fas))))
    : (0, exports.makeSome)([]);
exports.mapOptional = mapOptional;
const optionalToResult = (o, message) => (0, exports.maybe)(o, (value) => (0, result_1.makeOk)(value), () => (0, result_1.makeFailure)(message));
exports.optionalToResult = optionalToResult;
