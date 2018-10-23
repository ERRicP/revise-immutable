# revise-immutable
Expression-based utility to create modified copies of immutable objects.

- Modify properties
- Build and populate objects with an expression
- Array operations (find/delete/insert/append)
- Set values based on existing values

# Setup
```
npm install revise-immutable
```

# Usage

```javascript
import revise from "revise-immutable";

newObject = revise(oldObject, "item.collection[$1.selectedIndex].prop", "value");
```
revise(\<object\>, \<expression\>, \<value|valueSetterFunction\>, [expression(n), value(n)...])

returns new object where the value at \<expression\> is modified to \<value\> without mutating the original object.

 - **\<object>** Object to create a revision of
 - **\<expression>** Expression describes what to revise relative to \<object>
    - Expressions consist of:
        - property specifiers ex: **"item.selectedIndex"**
        - array specifiers ex: **"items[1]"** consist of
            - any expression that resolves to an **integer** in the array 
            
                example: **[1]** or **[(Math.PI * 100)>>0]**
            - the **remove() special function**, which removes an element from the array
            
                example: **"items[remove(1)]"**
            - stack variables are defined as $1 to $n (incrementing), where $1 is the array itself, and $n is the root object.
            
                example: **"items[$1.selectedIndex].color"**
            - variable functions are available to **append()** and **insert()** elements into the array.
- \<value> is the value to set at the given path
- \<valueSetterFunction> optionally, you can provide a function to set the value.  This is useful if the value you are setting is based off of an existing value in the object structure.  Note that the stack is passed in as individual arguments to this function.  
example: **revise(o, "users[0].likes", (likes, index, users) => likes + 1)** 

# Advanced Usage

**Object Construction**

Revise can interpret your expression and build out what isn't there.
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

// find
revise(o, 
    "gallery.photos[find(p => p.fileName == $4.selectedPhoto.fileName)].description", 
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

**Batching**

Combine multiple expressions together for one result.
```javascript
const newObject = revise(o, 
    "options.preferences.theme", theme
    "options.preferences.editor.font", font
    "user.account.name", name
);
```

**Limitations**
- Revise doesn't handle strings with unmatched square brackets in the expression.
    - example revise(o, "items[find(i => i.name == '**]**')]) will cause an error
- Revise only understands property names with ASCII characters A-Z, a-z, _, $, 0-9.