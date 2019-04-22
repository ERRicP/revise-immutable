// Polyfill findIndex
if (!Array.prototype.findIndex) {
    Object.defineProperty(Array.prototype, 'findIndex', {
        value: function (predicate) {
            if (this == null) throw new TypeError('"this" is null or not defined');
            var o = Object(this);
            var len = o.length >>> 0;
            if (typeof predicate !== 'function') throw new TypeError('predicate must be a function');
            var thisArg = arguments[1];
            var k = 0;
            while (k < len) {
                var kValue = o[k];
                if (predicate.call(thisArg, kValue, k, o)) return k;
                k++;
            }

            return -1;
        },
        configurable: true,
        writable: true
    });
}

const tokenizeReviseExpression = function(string) {
    string = string.replace(/\n/g, "");
    
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
    token = token.replace(/^\[find\((.*)\)\]$/, "find($$1, $1)");

    // Evaluate token contents
    return Function.apply(
        null, 
        [
            ...stackParamNames,
            ...(readMode && [] || arrayPropOpNames),
            `return ${token.replace(/^\[|\]$/g, "")}`
        ]
    )
    .apply(
        null, 
        [...stackParamValues, ...(readMode && [] || arrayPropOpValues)]
    );
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
    return /^\$(?:remove_\d+|insert_\d+|append)$/.test(token);
}

const isArray = function(prop, nextToken) {
    return (prop != null && Array.isArray(prop))
        || (!isNaN(parseInt(nextToken)))
        || isArrayOpString(nextToken);
}

const applyArrayOp = function(array, token, value) {
    if (/^\$remove_\d+$/.test(token)) {
        array.splice(token.split("_")[1], 1)
        return {removed: true};
    }

    if (/^\$insert_\d+$/.test(token)) {
        const index = parseInt(token.split("_")[1]);
        array.splice(index, 0, value)
        return {newToken: index};
    }

    if (/^\$append+$/.test(token)) {
        const index = array.length;
        array.splice(index, 0, value);
        return {newToken: index};
    }
}

export const getValue = function(obj, expression) {
    return evaluateTokens(tokenizeReviseExpression(expression), obj)
        .pointers.pop() || null;
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
            : isArray(ptr, tokens[index+1]) 
                ? [...(ptr||[])] 
                : {...(ptr||{})};

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

const revise = {
    get: getValue,
    set: setValues
}

export default revise; 