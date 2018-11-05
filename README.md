# Valor Membership

This repository will host smart contracts related to Smart Valor memberships
Currently it is hosting the stakes timelocked contract under folder

```
contracts/membership
```
and testcases accordingly



# Prerequisites

NodeJS 5.0+ recommended
Ganache 1.2.1
This is a Truffle project. So install Truffle framework as described here 

https://truffleframework.com/docs/truffle/getting-started/installation

clone the repository locally and then run
```
npm install
```

# Run the testcases

First, launch ganache.

Test must be run against a local Ganache node running on port 9545.

the from a console inside the project directory you should launch the test cases with

```
truffle test
```

If everything is ok, you should see all green ticks.

Cheers
