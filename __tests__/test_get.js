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

    it ('blows up when you use a write function', () => {
        const t = () => revise.get({}, "a[append()]");
        expect(t).toThrowError(/append is not defined/)
    })
});