const tokenizeReviseExpression = function(string) {
    // word or [square bracket set with [bracket sets] optionally inside] followed by "." or end of line
    const rex = /^([\w\$]+|(?:\[(?:(?:\[.*\])|[^\]])*\]))(?:\[|\.|$)/;
    var parts = [];
    while (string.length) {        
        const match = string.match(rex); 
        if (match == null || match.length < 2) throw "invalid expression at: >" + string;

        parts.push(match[1])
        string = string.substr(match[0].length + (match[0].endsWith("[") ? -1 : 0))
    }

    return parts;
}

const arrayPropOps = {
    find: (array, expression) => array.findIndex(expression),
    remove: (d) => `$remove_${d}`,
    insert: (d) => `$insert_${d}`,
    append: () => `$append`,
}

const arrayPropOpNames = Object.getOwnPropertyNames(arrayPropOps);

const arrayPropOpValues = arrayPropOpNames.map(prop => arrayPropOps[prop]);

const evaluateToken = function(token, stack, readMode) {
    const stackParamNames = ([...new Array(stack.length)]).map((i, idx) => "$" + (idx + 1));
    const stackParamValues = [...stack];

    // Inject array ref into find token
    if (/^\[find\(.*\)\]$/.test(token))
        token = token.replace(/^\[find\((.*)\)\]$/, "find($$1, $1)");

    return Function.apply(
        null, 
        [
            ...stackParamNames,
            ...(readMode && [] || arrayPropOpNames),
            `return ${token.replace(/^\[|\]$/g, "")}`
        ]
    )
    .apply(null, [...stackParamValues, ...(readMode && [] || arrayPropOpValues)]);
}

const evaluateTokens = function (tokens, object) {
    var obj = {...object};
    const stack = [obj];

    const evaluatedTokens = tokens.map(t => {
        const tokenValue = t.startsWith("[") ? evaluateToken(t, stack) : t;

        obj = obj == null ? null : obj[tokenValue];
        
        stack.unshift(obj);

        return tokenValue;
    });

    return {
        tokens: evaluatedTokens,
        pointers: stack.reverse()
    };    
}

const isArrayOpString = function(token) {
    //console.log(">>" + token)
    return /^\$(?:remove_\d+|insert_\d+|append)$/.test(token);
}

const isArray = function(prop, nextToken) {
    if (prop != null && Array.isArray(prop)) return true;
    if (!isNaN(parseInt(nextToken))) return true;
    if (isArrayOpString(nextToken)) return true;

    return false;
}

const applyArrayOp = function(array, token, value) {
    if (/^\$remove_\d+$/.test(token)) {
        array.splice(token.split("_")[1], 1)
        return {removed: true};
    }

    if (/^\$insert_\d+$/.test(token)) {
        token = parseInt(token.split("_")[1]);
        array.splice(token, 0, value)
    }
    else if (/^\$append+$/.test(token)) {
        token = array.length;
        array.splice(token, 0, value);
    }

    return {newToken: token};
}

const setValues = function(obj, expression, value) {
    var newObj = null;
    
    for (var args = [...arguments].slice(1); args.length; args = args.slice(2))
        newObj = setValue.apply(null, [newObj||obj, ...args]);

    return newObj;
}

export const setValue = function(obj, expression, value) { 
    const {tokens, pointers} = evaluateTokens(tokenizeReviseExpression(expression), obj);
    var p = 0;
    var newObj = {...pointers[p++]};
    var newObjPtr = newObj;

    tokens.every((token, index) => {
        const ptr = pointers[p++];

        // Clone the input object's property
        const newValue = (index == tokens.length - 1)
            ? typeof value == "function"
                ? value.apply(null, pointers.slice(0, p).reverse())
                : value
            : isArray(ptr, tokens[index+1]) ? [...(ptr||[])] : {...(ptr||{})};

        // Create/set the new value/apply the array operation
        if (Array.isArray(newObjPtr) && isArrayOpString(token)) {
            const {newToken, removed} = applyArrayOp(newObjPtr, token, newValue);
            if (removed) return false;
            newObjPtr = newObjPtr[newToken] = newValue;
        }
        else {
            newObjPtr = newObjPtr[token] = newValue;
        }

        return true;
    });

    return newObj;
} 

export const getValue = function(obj, expression) {
    const {tokens, pointers} = evaluateTokens(tokenizeReviseExpression(expression), obj);
    const lastPointer = pointers.pop();
    return typeof(lastPointer) == "undefined" ? null : lastPointer;
} 

const revise = {
    get: getValue,
    set: setValues
}

export default revise; 