// L3-eval.ts
// Evaluator with Environments model

import { is, map } from "ramda";
import { isBoolExp, isCExp, isLitExp, isNumExp, isPrimOp, isStrExp, isVarRef,
         isAppExp, isDefineExp, isIfExp, isLetExp, isProcExp,
         Binding, VarDecl, CExp, Exp, IfExp, LetExp, ProcExp, Program,
         parseL3Exp,  DefineExp,isClassExp,makeClassExp,ClassExp} from "./L3-ast";
import { applyEnv, makeEmptyEnv, makeExtEnv, Env } from "./L3-env-env";
import { isClosure, makeClosureEnv, Closure, Value ,Class,makeClassEnv,isClass,ClassToString,
    Object,makeObjectEnv,isObject,
    makeObject, isSymbolSExp} from "./L3-value";
import { applyPrimitive } from "./evalPrimitive";
import { allT, first, rest, isEmpty, isNonEmptyList } from "../shared/list";
import { Result, makeOk, makeFailure, bind, mapResult } from "../shared/result";
import { parse as p } from "../shared/parser";
import { format } from "../shared/format";
import { Sexp } from "s-expression";

// ========================================================
// Eval functions

const applicativeEval = (exp: CExp, env: Env): Result<Value> =>
    isNumExp(exp) ? makeOk(exp.val) :
    isBoolExp(exp) ? makeOk(exp.val) :
    isStrExp(exp) ? makeOk(exp.val) :
    isPrimOp(exp) ? makeOk(exp) :
    isVarRef(exp) ? applyEnv(env, exp.var) :
    isLitExp(exp) ? makeOk(exp.val) :
    isIfExp(exp) ? evalIf(exp, env) :
    isProcExp(exp) ? evalProc(exp, env) :
    isLetExp(exp) ? evalLet(exp, env) :
    isAppExp(exp) ? bind(applicativeEval(exp.rator, env),
                      (proc: Value) =>
                        bind(mapResult((rand: CExp) => 
                           applicativeEval(rand, env), exp.rands),
                              (args: Value[]) =>
                                 applyProcedure(proc, args))) :
    isClassExp(exp) ?  evalClass(exp, env) ://___________________________
    makeFailure('"let" not supported (yet)');

export const isTrueValue = (x: Value): boolean =>
    ! (x === false);

const evalIf = (exp: IfExp, env: Env): Result<Value> =>
    bind(applicativeEval(exp.test, env), (test: Value) => 
            isTrueValue(test) ? applicativeEval(exp.then, env) : 
            applicativeEval(exp.alt, env));

const evalProc = (exp: ProcExp, env: Env): Result<Closure> =>
    makeOk(makeClosureEnv(exp.args, exp.body, env));

const evalClass = (exp: ClassExp, env: Env): Result<Class> =>
    makeOk(makeClassEnv(exp.fields, exp.methods, env));//___________________________


// KEY: This procedure does NOT have an env parameter.
//      Instead we use the env of the closure.
const applyProcedure = (proc: Value, args: Value[]): Result<Value> =>
    isPrimOp(proc) ? applyPrimitive(proc, args) :
    isClosure(proc) ? applyClosure(proc, args) :
    isClass(proc) ? applyClass(proc, args) ://___________________________
    isObject(proc) ? applyObject(proc, args) ://___________________________
    makeFailure(`Bad procedure ${format(proc)}`);

const applyClosure = (proc: Closure, args: Value[]): Result<Value> => {
    const vars = map((v: VarDecl) => v.var, proc.params);
    return evalSequence(proc.body, makeExtEnv(vars, args, proc.env));
}
const applyClass = (proc: Class, args: Value[]): Result<Value> => 
    makeOk(makeObjectEnv(proc,args, proc.env));//___________________________

const applyObject = (proc: Object, args: Value[]): Result<Value> =>{
    const methodName = isSymbolSExp(args[0])? args[0].val : args[0];
    const method = proc.class.methods.find(m => m.var.var === methodName);

    if (method === undefined) return makeFailure(`Unrecognized method: ${methodName}`);
    if (!isProcExp(method.val)) return makeFailure("method is not a procdure");
    
    // create clousre with the parameters and the body of the method 
    const methodClousre = makeClosureEnv(method.val.args ,method.val.body, makeExtEnv(map(x=> x.var, proc.class.fields), proc.fields, proc.class.env))
    //const objectEnv = proc.class.fields.reduce((accEnv, field, index) => makeExtEnv(field.var,proc.fields[index],accEnv), env);
    return applyClosure(methodClousre, args.slice(1))

}//___________________________

// Evaluate a sequence of expressions (in a program)
export const evalSequence = (seq: Exp[], env: Env): Result<Value> =>
    isNonEmptyList<Exp>(seq) ? evalCExps(first(seq), rest(seq), env) : 
    makeFailure("Empty sequence");
    
const evalCExps = (first: Exp, rest: Exp[], env: Env): Result<Value> =>
    isDefineExp(first) ? evalDefineExps(first, rest, env) :
    isCExp(first) && isEmpty(rest) ? applicativeEval(first, env) :
    isCExp(first) ? bind(applicativeEval(first, env), _ => evalSequence(rest, env)) :
    first;
    
// Eval a sequence of expressions when the first exp is a Define.
// Compute the rhs of the define, extend the env with the new binding
// then compute the rest of the exps in the new env.
const evalDefineExps = (def: DefineExp, exps: Exp[], env: Env): Result<Value> =>
    bind(applicativeEval(def.val, env), (rhs: Value) => 
            evalSequence(exps, makeExtEnv([def.var.var], [rhs], env)));


// Main program
export const evalL3program = (program: Program): Result<Value> =>
    evalSequence(program.exps, makeEmptyEnv());

export const evalParse = (s: string): Result<Value> =>
    bind(p(s), (x) => 
        bind(parseL3Exp(x), (exp: Exp) =>
            evalSequence([exp], makeEmptyEnv())));

// LET: Direct evaluation rule without syntax expansion
// compute the values, extend the env, eval the body.
const evalLet = (exp: LetExp, env: Env): Result<Value> => {
    const vals  = mapResult((v: CExp) => 
        applicativeEval(v, env), map((b: Binding) => b.val, exp.bindings));
    const vars = map((b: Binding) => b.var.var, exp.bindings);
    return bind(vals, (vals: Value[]) => 
        evalSequence(exp.body, makeExtEnv(vars, vals, env)));
}

