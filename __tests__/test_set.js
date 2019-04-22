import revise from "../src";

describe('revise', () => {
    it('sets a prop', () => {
        const orig = {a: 1};
        const result = revise.set(orig, "a", 2);
        expect(result).not.toBe(orig);
        expect(result.a).toEqual(2);        
    });

    it('sets a nested prop', () => {
        const orig = {a: {b: 1, c: 3}, d: 4};
        const result = revise.set(orig, "a.b", 2);
        expect(result).not.toBe(orig);
        expect(result.a.b).toEqual(2);        
        expect(result.a.c).toEqual(3);     
        expect(result.d).toEqual(4);   
    });

    it('makes an object with a prop', () => {
        const orig = {};
        const result = revise.set(orig, "a.b", 2);
        expect(result).not.toBe(orig);
        expect(result.a.b).toEqual(2);        
        expect(Array.isArray(result.a)).toBe(false);
    });

    it('makes an array with a value', () => {
        const orig = {};
        const result = revise.set(orig, "a[0]", 2);
        expect(result).not.toBe(orig);
        expect(result.a[0]).toEqual(2);        
        expect(Array.isArray(result.a)).toBe(true);
    });

    it('sets an array element value', () => {
        const orig = {a: [1, 2]};
        const result = revise.set(orig, "a[0]", 3);
        expect(result).not.toBe(orig);
        expect(result.a).not.toBe(orig.a);
        expect(result.a[0]).toEqual(3);
    });

    it('sets a prop with a function', () => {
        const orig = {a: {b: 2}, c: 3};
        const result = revise.set(orig, "a.b", (b, a, root) => root.c);
        expect(result.a.b).toEqual(3);
        expect(result.c).toEqual(3);

        const result2 = revise.set(orig, "a.b", (b, a, root) => b * 2);
        expect(result2.a.b).toEqual(4);
    });

    it('can delete array elements', () => {
        const orig = {a: [1,2,3]};
        const result = revise.set(orig, "a[remove(1)]")

        expect(result.a.length).toBe(2);
        expect(result.a[0]).toEqual(1);
        expect(result.a[1]).toEqual(3);
    });

    it('provides stack variables in the array', () => {
        const orig = {a: [1,2,3], c: 1};
        const result = revise.set(orig, "a[remove($2.c)]");

        expect(result.a.length).toBe(2);
        expect(result.a[0]).toEqual(1);
        expect(result.a[1]).toEqual(3);
    })

    it('can prepend an element to an array', () => {
        const orig = {a: [1, 2, 3]};
        const result = revise.set(orig, "a[insert(0)]", 4);
        expect(result.a.length).toEqual(4);
        expect(result.a[0]).toEqual(4);
    })

    it('can insert an element into an array', () => {
        const orig = {a: [1, 2, 3]};
        const result = revise.set(orig, "a[insert(1)]", 4);
        expect(result.a.length).toEqual(4);
        expect(result.a[1]).toEqual(4);
    })

    it('can append an element to an array', () => {
        const orig = {a: [1, 2, 3]};
        const result = revise.set(orig, "a[append()]", 4);
        expect(result.a.length).toEqual(4);
        expect(result.a[3]).toEqual(4);
    })

    it('can find an array element using an expression', () => {
        const orig = {
            items: [
                {name: "foo", value: 1},
                {name: "bar", value: 2},
                {name: "baz", value: 3}
            ], 
            toFind: "bar"
        };

        expect(orig.items[1].value).toEqual(2);

        const result = revise.set(orig, `items[find(${i => i.name == $2.toFind})].value`, 4);
        expect(result.items[1].value).toEqual(4);
    })

    it('can build upon an array expression', () => {
        const orig = {a: [1, 2, {z: {x: 1, t: 5}, w: 6}]};
                     
        const result = revise.set(orig, "a[2].z.x", 4);
        expect(JSON.stringify(result)).toEqual('{"a":[1,2,{"z":{"x":4,"t":5},"w":6}]}');
    })

    it('can be batched', () => {
        const orig = {a: {b: "c"}, d: "e"};

        const result = revise.set(orig, 
            "a.b", "y",
            "d", "z");

        expect(result.a.b).toEqual("y");
        expect(result.d).toEqual("z");
    });

    it('can parse funky props', () => {
        const orig = {};
        const result = revise.set(orig, "H.ell.0[/*h*/0/*w_R[]]*/].$you", "fine!");
        expect(JSON.stringify(result)).toEqual('{"H":{"ell":[[{"$you":"fine!"}]]}}');
    })

    it('can specify an object prop dynamically', () => {
        const orig = {
            a: {
                b: "c",
                e: "f"
            },
            d: "b"
        };

        const result = revise.set(orig, "a[$2.d]", "g");
        expect(result.a.b).toEqual("g");
    })

    it('can build an object with array notation', () => {
        const result = revise.set({d: "b"}, "a[$2.d]", "z");
        expect(Array.isArray(result.a)).toEqual(false);
        expect(result.a.b).toEqual("z");
    });
});