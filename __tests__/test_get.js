import revise from "../src";

describe('revise.get', () => {
    it('gets a simple dot prop', () => {
        const orig = {a: {b: 1}};
        const value = revise.get(orig, "a.b")

        expect(value).toEqual(1);
    });

    it('gets an array value', () => {
        const orig = {a: {b: [1, 2, 3]}};
        const value = revise.get(orig, "a.b[2]");

        expect(value).toEqual(3);
    });

    it('can use the find() function', () => {
        const orig = {a: {b: [1, 2, 3]}};
        const value = revise.get(orig, "a.b[find(i => i == 2)]");

        expect(value).toEqual(2);
    });

    it('can use $stack variables', () => {
        const orig = {a: {b: [1, 2, 3], c: 2}};
        const value = revise.get(orig, "a.b[$2.c]");

        expect(value).toEqual(3);
    })

    it('returns null if not found', () => {
        const orig = {a: {b: {}}};
        const value = revise.get(orig, "a.b.c");

        expect(value).toEqual(null);
    })

    it ('returns null when you use an array modifier', () => {
        const result = revise.get({}, "a[remove(1)]");
        expect(result).toEqual(null);
    })

    it ('can handle property names in brackets', () => {
        expect(revise.get({a:{b: 1}}, "a['b']")).toEqual(1);
    })

    it ('finds object prop by square bracket', () => {
        const orig = {a: {b: 1}};
        const value = revise.get(orig, "a['b']");
        expect(value).toEqual(1);

        const value1 = revise.get(orig, 'a["b"]');
        expect(value1).toEqual(1);
    })

    it ('can use babel translated string', () => {
        const obj = {a: [{b: 1, text: "foo"}, {b: 2, text: "bar"}]}
        const value = revise.get(obj, `a[find(${f => f.b == 2})].text`)
        expect(value).toEqual("bar");
    })

    it('does what when invalid syntax', () => {
        const t = () => revise.get({}, "a...b[");
        expect(t).toThrowError(/invalid expression/);
    })
});