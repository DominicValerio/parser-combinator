import {regex, map, sequence, panic, print, printj, 
	zeroOrMore, ctx, Parser, Value, sequenceMap, Result, BinOp, skip} from "./combinators"

// local parsers
const whitespace = regex(/( |\t)*/)

const num = map(
	regex(/[0-9]+/, "No number found"), 
	(v) => {
		let res = parseInt(v as string)
		return res 
	}
)
const mul = regex(/(\*)|(\/)/, "No multiplicitave found")
const additive = regex(/(\+)|(\-)/, "No additive found")

// used in a sequence map, [left, [op, right]]
function leftAssociate(oldValue: Value): Value {
	if (oldValue && oldValue.hasOwnProperty("length")) {
		let v = oldValue as any[][]
		let guaranteed = v[0]
		let optionPart = v[1]
		// printj(oldValue); print("\n") //printj(guaranteed); print("\n") // printj(optionPart); print("\n")
		if (optionPart.length == 0) return guaranteed
		if (optionPart.length == 1) return {l: guaranteed, op: optionPart[0][0], r: optionPart[0][1]}
		let res: any = {l: guaranteed, op: null, r: null}
		for (let i = 0; i < optionPart.length; i++) {
			let [op, r] = optionPart[i]
			res.op = op
			res.r = r
			if (i < optionPart.length - 1) res = {l: res, op: null, r: null}
		}
		return res
	}
	print("unreachable\n"); printj(oldValue); print("\n")
	return -1
}

const product = sequenceMap([
	skip(num, whitespace),
	skip(zeroOrMore(sequence([skip(mul, whitespace), num])), whitespace)
], 
leftAssociate)

const sum = sequenceMap([
	skip(product, whitespace),
	skip(zeroOrMore(sequence([skip(additive, whitespace), product])), whitespace)
], 
leftAssociate)

const expr = sum

const parser = () => {
	let error = null
	let value = []
	while (ctx.idx != ctx.src.length) {
		let v = expr()
		if (v.error) {
			error = v.error
			printj(ctx)
			print("\n")
			printj(value)
			print("\n")
			panic(error)
			break;
		}
		value.push(v.value)
	}   
	return {value: value, error: error}
}

function parse(src: string) {
	ctx.src = src
	ctx.idx = 0
	return parser()
}

let res = parse("2 * 3 + 1 * 8 + 3")

function walk(v: Value): Value {
	if (!isNaN(v as number )) { // number
		return v
	} else if (v instanceof Array) { // Value[]
		let res = []
		for (const k of v) {
			res.push(walk(k))
		}
		return res
	} else if ((v as BinOp).l !== undefined) { // BinOp
		let k = v as BinOp
		let l = walk(k.l) as number
		let r = walk(k.r) as number
		switch (k.op) {
		case '+':
			return l + r
		case '-':
			return l - r
		case '*':
			return l * r
		case '/':
			return l / r
		}
	} else if (v instanceof String) { // string
		panic("Found string in tree")
		return v
	}
	print("Unreachable\n");printj(v);print((v as BinOp).l !== undefined);panic("")
	return 0
}
print(walk(res.value))