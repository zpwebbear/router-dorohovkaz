const PARAMETER = Symbol('parameter');
const WILDCARD = Symbol('wildcard');
const ROOT = Symbol('root');

const ROUTE_TYPES = {
  part: 'part',
  parameter: 'parameter',
  wildcard: 'wildcard',
};

const NODE_TYPES = {
  root: 'root',
  branch: 'branch',
  leaf: 'leaf',
};

const PARAMETER_TYPES = {
  ':': ROUTE_TYPES.parameter,
  '*': ROUTE_TYPES.wildcard,
};


class Route {
  constructor({
    parent,
    key,
    routeType,
    nodeType = NODE_TYPES.leaf,
    payload = null,
    parameter = undefined,
    children = new Map(),
  }) {
    this.parent = parent;
    this.key = key;
    this.routeType = routeType;
    this.nodeType = nodeType;
    this.payload = payload;
    this.children = children;
    this.parameter = parameter;
  }

  static #getRouteKey(route) {
    if (route.routeType === ROUTE_TYPES.parameter) {
      return PARAMETER;
    } else if (route.routeType === ROUTE_TYPES.wildcard) {
      return WILDCARD;
    }
    return route.key;
  }

  addChild(route) {
    const routeKey = Route.#getRouteKey(route);
    this.children.set(routeKey, route);
  }

  getChildWithFallback(key) {
    let route = this.children.get(key)
    if (!route) {
      route = this.children.get(PARAMETER);
    }
    if (!route) {
      route = this.children.get(WILDCARD);
    }
    return route ?? null;
  }

  getChild(key) {
    return this.children.get(key) ?? null;
  }
}

export class Router {

  constructor() {
    this.#initRouterTree();
  }

  #initRouterTree() {
    this.routerTree = new Route({
      parent: null,
      key: ROOT,
      nodeType: NODE_TYPES.root,
      routeType: ROUTE_TYPES.part,
    });
  }

  static #normalizePath(path) {
    let normalizedPath = path;
    if (path.endsWith('/')) {
      normalizedPath = path.slice(0, -1);
    }
    if (!path.startsWith('/')) {
      normalizedPath = '/' + path;
    }
    return normalizedPath;
  }

  static #getRouteKeys(path) {
    const normalizedPath = Router.#normalizePath(path);
    const keys = normalizedPath.split('/').toSpliced(0, 1);
    return keys;
  }

  static #getRouteType(key) {
    const firstChar = key.charAt(0);
    if (!Object.keys(PARAMETER_TYPES).includes(firstChar)) return ROUTE_TYPES.part;
    return PARAMETER_TYPES[firstChar];
  }

  static #getRouteParameter(key, routeType) {
    return routeType === ROUTE_TYPES.parameter ? key.slice(1) : undefined;
  }

  addRoute(path, payload) {
    const keys = Router.#getRouteKeys(path);
    let currentNode = this.routerTree;
    for (const key of keys) {
      let childNode = currentNode.getChild(key);
      if (!childNode) {
        const routeType = Router.#getRouteType(key);
        const parameter = Router.#getRouteParameter(key, routeType);
        childNode = new Route({
          parent: currentNode,
          key,
          routeType,
          nodeType: NODE_TYPES.branch,
          parameter,
        });
        currentNode.addChild(childNode);
      }
      currentNode = childNode;
    }

    // Last node is a leaf and handles the payload
    currentNode.payload = payload;
    currentNode.nodeType = NODE_TYPES.leaf;
  }

  getRoute(path) {
    const keys = Router.#getRouteKeys(path);
    let currentNode = this.routerTree;
    const positionalParameters = [];
    const keyParameters = new Map();

    // If route has a wildcard but search will fall on the some step
    let wildcardFallback = null;
    for (const key of keys) {
      const wildcardNode = currentNode.getChildWithFallback(WILDCARD);
      wildcardFallback = wildcardNode ?? wildcardFallback;
      currentNode = currentNode.getChildWithFallback(key);

      // If we route is wildcard we need to break the loop
      if (currentNode === null || currentNode.routeType === ROUTE_TYPES.wildcard) {
        break;
      }

      // If child node is a parameter we need to add it to the positional parameters
      if (currentNode.routeType === ROUTE_TYPES.parameter) {
        const currentParameter = { parameter: currentNode.parameter, value: key };
        positionalParameters.push(currentParameter);
        keyParameters.set(currentParameter.parameter, currentParameter.value);
      }
    }

    if (!currentNode && wildcardFallback) {
      currentNode = wildcardFallback;
    }

    if (!currentNode || currentNode.nodeType !== NODE_TYPES.leaf) {
      return null;
    }

    return {
      payload: currentNode.payload,
      positionalParameters,
      keyParameters,
      routeType: currentNode.routeType,
      nodeType: currentNode.nodeType,
      path
    };
  }
}