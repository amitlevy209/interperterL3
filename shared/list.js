"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.allT = exports.isEmpty = exports.isNonEmptyList = exports.rest = exports.second = exports.first = exports.cons = void 0;
// List operations similar to car/cdr/cadr in Scheme
const ramda_1 = require("ramda");
const cons = (x, xs) => [x, ...xs];
exports.cons = cons;
const first = ([x, ..._xs]) => x;
exports.first = first;
const second = ([_x0, x1, ..._xs]) => x1;
exports.second = second;
const rest = ([_, ...xs]) => xs;
exports.rest = rest;
const isNonEmptyList = (xs) => Array.isArray(xs) && xs.length > 0;
exports.isNonEmptyList = isNonEmptyList;
const isEmpty = (xs) => Array.isArray(xs) && !(0, exports.isNonEmptyList)(xs);
exports.isEmpty = isEmpty;
// A useful type predicate for homogeneous lists
const allT = (isT, x) => (0, ramda_1.all)(isT, x);
exports.allT = allT;
