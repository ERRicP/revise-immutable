const tokenize_revise_expression = function(string) {
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

const revise = function(obj, expression, value) {
    if (obj == null) throw "Argument exception: object is required";
    if (expression == null) throw "Argument exception: expression is required";

    const newObj = {...obj};
    var objPtr = obj;
    var objPtrNull = obj;
    var newObjPtr = newObj;

    const tokens = tokenize_revise_expression(expression);
    const stack = [objPtr];
    const arrayPropOps = {
        remove: (d) => `$remove_${d}`,
        insert: (d) => `$insert_${d}`,
        append: () => `$append`,
        find: (array, expression) => array.findIndex(expression)
    }

    const arrayPropOpNames = Object.getOwnPropertyNames(arrayPropOps);
    const arrayPropOpValues = arrayPropOpNames.map(prop => arrayPropOps[prop]);
    
    tokens.forEach((token, tokenIndex) => {
        const isArrayProp = token.startsWith("[");
        var propNameRaw = isArrayProp ? token.substr(1, token.length - 2) : token;
        const isArray = (tokens[tokenIndex+1]||"").startsWith("[");
        
        stack.unshift((objPtr||{})[propNameRaw]);
        const stackParamNames = ([...new Array(stack.length)]).map((i, idx) => "$" + idx);
        const stackParamValues = [...stack];

        // Inject array into 'find' shortcut
        if (isArrayProp && /^find\(.*\)$/.test(propNameRaw))
            propNameRaw = propNameRaw.replace(/^find\((.*)\)$/, "find($$1, $1)");

        // Evaluate stuff inside the []'s as the property name
        const evaluatedPropName = isArrayProp
            ? Function.apply(
                    null, 
                    [
                        ...stackParamNames,
                        ...arrayPropOpNames,
                        `return ${propNameRaw}`
                    ]
                )
                .apply(null, [...stackParamValues, ...arrayPropOpValues])
            : propNameRaw;    

        // Increment the original object pointer
        objPtr = (objPtr||{})[evaluatedPropName]
        objPtrNull = objPtrNull && objPtrNull[evaluatedPropName] || null;

        const newVal = (tokenIndex == tokens.length - 1)
            ? typeof value == "function"
                ? value.apply(null, stack)
                : value
            : isArray
                ? [...(objPtr||[])] 
                : {...(objPtr||{})}

        if (isArrayProp) {
            var arrayPropValue = evaluatedPropName;

            // Apply array specific operations
            if (/^\$remove_\d+$/.test(arrayPropValue)) {
                newObjPtr.splice(arrayPropValue.split("_")[1], 1)
                return newObj;
            } 
            else if (/^\$insert_\d+$/.test(arrayPropValue)) {
                arrayPropValue = parseInt(arrayPropValue.split("_")[1]);
                newObjPtr.splice(arrayPropValue, 0, newVal)
            }
            else if (/^\$append+$/.test(arrayPropValue)) {
                arrayPropValue = newObjPtr.length;
                newObjPtr.splice(arrayPropValue, 0, newVal);
            } 

            // Increment and assign the new object pointer
            newObjPtr = newObjPtr[arrayPropValue] = newVal;
        }
        else {
            // Increment and assign the new object pointer
            newObjPtr = newObjPtr[evaluatedPropName] = newVal;
        }
    })

    return (arguments.length > 3) 
        ? revise.apply(null, [newObj, ...[...arguments].slice(3)])
        : newObj;
}

export default revise; 