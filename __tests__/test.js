import revise from "../src/index";

describe('revise', () => {
    it('sets a prop', () => {
        const orig = {a: 1};
        const result = revise(orig, "a", 2);
        expect(result).not.toBe(orig);
        expect(result.a).toEqual(2);        
    });

    it('sets a nested prop', () => {
        const orig = {a: {b: 1, c: 3}, d: 4};
        const result = revise(orig, "a.b", 2);
        expect(result).not.toBe(orig);
        expect(result.a.b).toEqual(2);        
        expect(result.a.c).toEqual(3);     
        expect(result.d).toEqual(4);   
    });

    it('makes an object with a prop', () => {
        const orig = {};
        const result = revise(orig, "a.b", 2);
        expect(result).not.toBe(orig);
        expect(result.a.b).toEqual(2);        
        expect(Array.isArray(result.a)).toBe(false);
    });

    it('makes an array with a value', () => {
        const orig = {};
        const result = revise(orig, "a[0]", 2);
        expect(result).not.toBe(orig);
        expect(result.a[0]).toEqual(2);        
        expect(Array.isArray(result.a)).toBe(true);
    });

    it('sets an array element value', () => {
        const orig = {a: [1, 2]};
        const result = revise(orig, "a[0]", 3);
        expect(result).not.toBe(orig);
        expect(result.a).not.toBe(orig.a);
        expect(result.a[0]).toEqual(3);
    });

    it('sets a prop with a function', () => {
        const orig = {a: {b: 2}, c: 3};
        const result = revise(orig, "a.b", (b, a, root) => root.c);
        expect(result.a.b).toEqual(3);
        expect(result.c).toEqual(3);

        const result2 = revise(orig, "a.b", (b, a, root) => b * 2);
        expect(result2.a.b).toEqual(4);
    });

    it('can delete array elements', () => {
        const orig = {a: [1,2,3]};
        const result = revise(orig, "a[remove(1)]")

        expect(result.a.length).toBe(2);
        expect(result.a[0]).toEqual(1);
        expect(result.a[1]).toEqual(3);
    });

    it('provides stack variables in the array', () => {
        const orig = {a: [1,2,3], c: 1};
        const result = revise(orig, "a[remove($2.c)]");

        expect(result.a.length).toBe(2);
        expect(result.a[0]).toEqual(1);
        expect(result.a[1]).toEqual(3);
    })

    it('can prepend an element to an array', () => {
        const orig = {a: [1, 2, 3]};
        const result = revise(orig, "a[insert(0)]", 4);
        expect(result.a.length).toEqual(4);
        expect(result.a[0]).toEqual(4);
    })

    it('can insert an element into an array', () => {
        const orig = {a: [1, 2, 3]};
        const result = revise(orig, "a[insert(1)]", 4);
        expect(result.a.length).toEqual(4);
        expect(result.a[1]).toEqual(4);
    })

    it('can append an element in an array', () => {
        const orig = {a: [1, 2, 3]};
        const result = revise(orig, "a[append()]", 4);
        expect(result.a.length).toEqual(4);
        expect(result.a[3]).toEqual(4);
    })

    it('can use user defined functions in an array', () => {
        const orig = {a: [1, 2, 3]};
        const result = revise(orig, "a[arrlen($1)]", 4, {arrlen: (arr) => arr.length});
        expect(result.a.length).toEqual(4);
        expect(result.a[3]).toEqual(4);
    });

    it('can build upon an array expression', () => {
        const orig = {a: [1, 2, {z: {x: 1, t: 5}, w: 6}]};
                     
        const result = revise(orig, "a[2].z.x", 4, {arrlen: arr => arr.length - 1});
        expect(JSON.stringify(result)).toEqual('{"a":[1,2,{"z":{"x":4,"t":5},"w":6}]}');
    })

    it('can be called multiple times', () => {
        const orig = {a: {b: "c"}, d: "e"};

        const result = revise(orig, 
            "a.b", "y", null,
            "d", "z", null);

        expect(result.a.b).toEqual("y");
        expect(result.d).toEqual("z");
    });

    // it('can specify an object prop dynamically', () => {
    //     const orig = {
    //         a: {
    //             b: {c: "d", e: "f"},
    //             g: 2,
    //             h: 3
    //         }
    //     }

    //     const result = revise(orig, "a[char()].c", "z", {char: () => "b"});
        
    //     expect(Array.isArray(result.a)).toEqual(false);
    //     expect(result.a.b.c).toEqual("z");
    //     //console.log(JSON.stringify(result));
    // })
});