import {   AtomicExp, LitExp, LetExp, IfExp, ClassExp, ProcExp, Exp, Program, makeIfExp, makeAppExp, makePrimOp, makeVarRef, makeStrExp, makeProcExp, makeLitExp, makeVarDecl, isClassExp, isProgram, isExp, makeProgram, isCExp, isDefineExp, makeDefineExp, CExp, isAtomicExp, isLitExp, isIfExp, isProcExp, isLetExp, VarDecl, isVarDecl, Binding } from "./L3-ast";
import { Result, makeFailure, makeOk } from "../shared/result";
import { zipWith, map } from 'ramda';


/*
Purpose: Transform ClassExp to ProcExp
Signature: class2proc(classExp)
Type: ClassExp => ProcExp
*/
export const class2proc = (exp: ClassExp): ProcExp =>{
    const body = createIf(exp.methods)   
        return makeProcExp(exp.fields, [makeProcExp([makeVarDecl('msg')], [body])]);

}

export const createIf =(methods:Binding[]): IfExp|LitExp =>{
    if(methods.length == 0) {return makeLitExp('#f')}
     return isProcExp(methods[0].val)?
    makeIfExp(makeAppExp(makePrimOp('eq?'),[makeVarRef('msg'), makeLitExp("'" + methods[0].var.var)]), // test
    makeAppExp(makeProcExp(methods[0].val.args ,methods[0].val.body),[]), //then 
    createIf(methods.slice(1)))//else
    : makeLitExp('#f')
}
/*
Purpose: Transform all class forms in the given AST to procs
Signature: lexTransform(AST)
Type: [Exp | Program] => Result<Exp | Program>
*/

export const lexTransform = (exp: Exp | Program): Result<Exp | Program> =>{
   return isExp(exp)? makeOk(rewriteAllClassExp(exp)): 
    isProgram(exp)? makeOk( makeProgram(map(rewriteAllClassExp,exp.exps))):
    makeOk(exp)

        
}
export const rewriteAllClassExp=(exp:Exp):Exp =>{
    return isCExp(exp)? rewriteAllClassCExp(exp):
    isDefineExp(exp)? makeDefineExp(exp.var,rewriteAllClassCExp(exp.val)):
    exp
}
export const rewriteAllClassCExp=(exp:CExp): CExp=>{
    return  isAtomicExp(exp)? exp:
            isLitExp(exp)? exp:
            isLetExp(exp)?exp:
            isIfExp(exp)? makeIfExp(rewriteAllClassCExp(exp.test),
                                    rewriteAllClassCExp(exp.then),
                                    rewriteAllClassCExp(exp.alt)):
            isProcExp(exp)? makeProcExp(exp.args,map(rewriteAllClassCExp,exp.body)):
            isClassExp(exp)? class2proc(exp):
            exp
}