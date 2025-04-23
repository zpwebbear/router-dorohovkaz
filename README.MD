# router-dorohovkaz

## Name

`router-dorohovkaz` is a combination of two words: "router" and "dorohovkaz". The first word is a common term in programming, referring to a component that manages the routing of requests in a web application. The second word is a transliteration of the Ukrainian word "дороговказ", which means "road sign" or "signpost". This name reflects the purpose of the library, which is to provide a way to manage routes and direct requests to the appropriate handlers.

## Description

A low level router for building a graph of routes. Can be used to build a router for any frontend or backend framework. It does not provide any UI or other high level features. It is designed to be used as a building block for other routers.

## Features

- Parameters

```js
const router = new Router();
router.addRoute('/user/:id', () => {});
const route = router.getRoute('/user/123');
console.log(route.keyParameters) // { id: '123' }
console.log(route.positionParameters) // [ '123' ]
```

- Wildcards

```js
const router = new Router();
router.addRoute('/user/*', () => {});
const route = router.getRoute('/user/somevalue');
console.log(route.path) // '/user/somevalue'
```

- Static routes take precedence over dynamic (parameterized) routes.
And dynamic (parameterized) routes take precedence over wildcard routes.
This behavior does not depend on the order in which routes are added.

```js
const router = new Router();
router.addRoute('/user/*', () => {});
router.addRoute('/user/:id', () => {});
router.addRoute('/user/profile', () => {});
const route1 = router.getRoute('/user/profile');
const route2 = router.getRoute('/user/123');
const route3 = router.getRoute('/user/somevalue/for-wildcard');
console.log(route1.path) // '/user/profile'
console.log(route2.path) // '/user/123'
console.log(route3.path) // '/user/somevalue/for-wildcard'
```

## Installation

```bash
npm install router-dorohovkaz
```

or

```bash
yarn add router-dorohovkaz
```

or

```bash
pnpm add router-dorohovkaz
```

or

```bash
bun add router-dorohovkaz
```

## Usage

TBD

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

