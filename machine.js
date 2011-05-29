/*
  Machine.js
  by mary rose cook
  http://github.com/maryrosecook/machinejs

  Make behaviour trees in JavaScript.
  See index.html for an example.

  Uses Base.js by Dean Edwards.  Thanks, Dean.
*/

/*
  The tree generator.  Instantiate and then call generateTree(),
  passing the JSON definition of the tree and the object the tree controls.
*/
var Machine = Base.extend({
    constructor: function() { },

    // makes behaviour tree from passed json and returns the root node
    generateTree: function(treeJson, actor) {
        return this.read(treeJson, null, actor);
    },

    // reads in all nodes in passed json, constructing a tree of nodes as it goes
    read: function(subTreeJson, parent, actor) {
        var node = null;
        if(subTreeJson.pointer == true)
            node = new Pointer(subTreeJson.identifier, subTreeJson.test, subTreeJson.strategy, parent, actor);
        else
            node = new State(subTreeJson.identifier, subTreeJson.test, subTreeJson.strategy, parent, actor);

        node.report = subTreeJson.report;

        for(var i in subTreeJson.children)
            node.children[node.children.length] = this.read(subTreeJson.children[i], node, actor);

        return node;
    },
}, {
	getClassName: function() { return "Machine"; }

});

/*
  The object for nodes in the tree.
*/
var Node = Base.extend({
    identifier: null,
    test: null,
    strategy: null,
    parent: null,
    children: null,
    actor: null,
    report: null,

    constructor: function(identifier, test, strategy, parent, actor) {
        this.identifier = identifier;
        this.test = test;
        this.strategy = strategy;
        this.parent = parent;
        this.actor = actor;
        this.children = [];
    },

    // a tick of the clock.  Called every time
    tick: function() {
        if(this.isAction()) // run an actual action
            this.run();

        var potentialNextState = this.nextState();
        if(potentialNextState !== null)
            return potentialNextState.transition();
        else if(this.can()) // no child state, try and stay in this one
            return this;
        else // can't stay in this one, so back up the tree
            return this.nearestAncestor().transition();
    },

    // gets next state that would be moved to from current state
    nextState: function() {
        var strategy = this.strategy;
        if(strategy === undefined)
            strategy = this.getNearestAncestorStrategy();

        if(strategy !== undefined)
            return this[strategy].call(this);
        else
            return null;
    },

    // finds closest ancestor that has a strategy and returns that strategy
    getNearestAncestorStrategy: function() {
        if(this.parent !== null)
        {
            if(this.parent.strategy !== null)
                return this.parent.strategy;
            else
                return this.parent.getNearestAncestorStrategy();
        }
        // return undefined
    },

    isTransition: function() { return this.children.length > 0 || this instanceof Pointer; },
    isAction: function() { return !this.isTransition(); },

    // returns true if actor allowed to enter this state
    can: function() {
        var functionName = this.test; // can specify custom test function name
        if(functionName === undefined) // no override so go with default function name
            functionName = "can" + this.identifier[0].toUpperCase() + this.identifier.substring(1, this.identifier.length);

        if(this.actor[functionName] !== undefined)
            return this.actor[functionName].call(this.actor);
        else // no canX() function defined - assume can
            return true;
    },

    // returns nearest ancestor that can run
    nearestAncestor: function() {
        if(this.parent !== null)
        {
            if(this.parent.can())
                return this.parent;
            else
                return this.parent.nearestAncestor();
        }

        return null;
    },

    // returns first child that can run
    prioritised: function() {
        return this.nextRunnable(this.children);
    },

    // gets next runnable node in passed list
    nextRunnable: function(nodes) {
        for(var i in nodes)
            if(nodes[i].can())
                return nodes[i];

        return null;
    },

    // runs all runnable children in order, then kicks up to children's closest runnable ancestor
    sequential: function() {
        var nextState = null;
        if(this.isAction()) // want to get next runnable child or go back up to grandparent
        {
            var foundThis = false;
            for(var i in this.parent.children)
            {
                var sibling = this.parent.children[i];
                if(this.identifier == sibling.identifier)
                    foundThis = true;
                else if(foundThis && sibling.can())
                    return sibling;
            }
        }
        else // at a sequential parent so try to run first runnable child
        {
            var firstRunnableChild = this.nextRunnable(this.children);
            if(firstRunnableChild !== null)
                return firstRunnableChild;
        }

        return this.nearestAncestor(); // no more runnable children in the sequence so return first runnable ancestor
    },

    // returns first namesake forebear encountered when going directly up tree
    nearestNamesakeAncestor: function(identifier) {
        if(this.parent === null)
            return null;
        else if(this.parent.identifier == identifier)
            return this.parent;
        else
            return this.parent.nearestNamesakeAncestor(identifier);
    },
}, {
	getClassName: function() { return "Node"; },

});


/*
  A normal state in the tree.
*/
var State = Node.extend({
    transition: function() {
        return this;
    },

    // run the behaviour associated with this state
    run: function() {
        this.actor[this.identifier].call(this.actor); // run the action
    },
}, {
	getClassName: function() { return "State"; }

});

/*
  A pointer state in the tree.  Directs the actor to a synonymous state
  further up the tree.  Which synonymous state the actor transitions to
  is dependent on the pointer's strategy.
*/
var Pointer = Node.extend({
    // transition out of this state using the state's strategy
    transition: function() {
        return this[this.strategy].call(this);
    },

    // a strategy that moves to the first synonymous ancestor
    hereditory: function() {
        return this.nearestNamesakeAncestor(this.identifier);
    },
}, {
	getClassName: function() { return "Pointer"; }
});