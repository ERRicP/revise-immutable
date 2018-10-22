# revise-immutable
Expression-based utility to change immutable objects.

* Modify properties
* Build and populate objects with an expression
* Array operations (delete/insert/append)
* Dynamically assign values

# Setup
```
npm install revise-immutable
```

# tldr;
<b>revise(\<object\>, \<expression\>, \<value|valueSetterFunction\>, [\<userFunctions\>])</b>

returns new object where the value at \<expression\> is modified to \<value\> without mutating the original object.

```javascript
// Example...
newObject = revise(oldObject, "item.collection[$1.selectedIndex].prop", "value")
```


# The problem

You need to make modifications to a complex immutable object.  

Let's modify property **prop3** of the **second child** of the **first child** in object **"o"** below:

<style>
    PRE, E { color: #5A5;}
    N {color: orange;}
</style>

<pre>
    <N>o</N>----<N>child</N>----grandchild----prop 
    |        |             `---prop2
    |        |
    |        `---<N>grandchild2</N>---<N>prop3 <-</N> 
    |                       `--prop4
    |
    `---child2---grandchild3---prop5                         
</pre>

To efficiently make this change, we copy and modify the references in <N>orange</N> above.  The references in <E>green</E> can be re-used from the existing object.

**This is how we do it now...**
```javascript
// The "es6" way
const new_o = {
    ...o, 
    child: {
        ...o.child, 
        grandChild2: {
            ...o.child.grandChild2,
            prop3: "new value"
        }
    }
}
```
# A Solution
```javascript
const newObject = revise(o, "child.grandChild2.prop3", "new value");
```

# Advanced Usage

Object Construction
```javascript
revise ({}, "item.collection[0].description", "Yah!");

// Produces this!
{
    item: {
        collection: [
            {
                description: "Yah!"
            }
        ]
    }
}

```

**Arrays**
```javascript
// insert
revise(o, "gallery.photos[insert($2.selectedPhotoIndex + 1)]", newPhoto);

// append
revise(o, "gallery.photos[append()]", newPhoto);

// remove
revise(o, "gallery.photos[remove($2.selectedPhotoIndex)]");

// user defined function
revise(o, 
    "gallery.photos[findSelected($1)].description", 
    newDescription, 
    {findSelected: arr => arr.findIndex(e => e.selected) }
);

```
*NOTE* : in between [ ]'s, the following "stack variables" are available:
- **$1** : reference to the array.
- **$2** : reference to parent of array (if exists)
- **$\<n\>** : parent of n - 1...

**Set Values Dynamically**
```javascript
// Use the existing values to make new ones
revise(o, "users[$2.selectedUserIndex].likes", likes => likes + 1);

// The full stack is available
revise(o, "a.b.c.d", (d, c, b, a, root) => root.score + c.score)
```