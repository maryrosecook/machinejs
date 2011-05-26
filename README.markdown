#Machine.js
Make behaviour trees in JavaScript

By mary rose cook

* http://maryrosecook.com
* maryrosecook@maryrosecook.com

##What is Machine.js?

Machine.js lets you use a hierarchical state machine to control a JavaScript object.

* Define a behaviour tree as JSON.
    <pre><code>{
        identifier: "idle", strategy: "prioritised",
        children: [
            {
                identifier: "photosynthesise", strategy: "sequential",
                children: [
                    { identifier: "makeEnergy" },
                    { identifier: "grow" },
                    { identifier: "emitOxygen" },
                ]
            },
            { identifier: "gatherSun" },
            { identifier: "gatherWater" },
        ]
    };
    </code></pre>

* Define on your object a function for each state where action is taken.

* Define a can function for each state that returns true if the object may move to that state.

##Licence

The code is open source, under the MIT licence.  It uses Base.js by Dean Edwards.

##Getting started

Download the repository.  Open index.html in your browser to see the demo and documentation.