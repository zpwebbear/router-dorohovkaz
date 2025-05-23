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
    this.parameter = parameter;
    this.children = children;
  }

  static #getRouteKey(route) {
    switch (route.routeType) {
      case ROUTE_TYPES.parameter:
        return PARAMETER;
      case ROUTE_TYPES.wildcard:
        return WILDCARD;
      default:
        return route.key;
    }
  }

  addChild(route) {
    const routeKey = Route.#getRouteKey(route);
    this.children.set(routeKey, route);
  }

  getChildWithFallback(key) {
    return this.children.get(key) ??
      this.children.get(PARAMETER) ??
      this.children.get(WILDCARD) ?? 
      null;
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
    let normalizedPath = path.split('?')[0]; // Remove query string

    if (normalizedPath.endsWith('/')) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    if (normalizedPath.startsWith('/')) {
      normalizedPath = normalizedPath.slice(1);
    }
    return normalizedPath;
  }

  static #getRouteKeys(path) {
    const normalizedPath = Router.#normalizePath(path);
    return normalizedPath.split('/');
  }

  static #getRouteType(key) {
    const firstChar = key.charAt(0);
    if (!Object.keys(PARAMETER_TYPES).includes(firstChar)) return ROUTE_TYPES.part;
    return PARAMETER_TYPES[firstChar];
  }

  static #getRouteParameter(key, routeType) {
    return routeType === ROUTE_TYPES.parameter ? key.slice(1) : undefined;
  }

  static #getSearchParams(path) {
    return new URLSearchParams(path.split('?')[1]);
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
    const searchParams = Router.#getSearchParams(path);
    let currentNode = this.routerTree;
    const positionalParameters = [];
    const keyParameters = new Map();

    // If route has a wildcard but search will fall on the some step
    let wildcardFallback = null;

    for (const key of keys) {
      const wildcardNode = currentNode.getChildWithFallback(WILDCARD);
      if (wildcardNode) wildcardFallback = wildcardNode;
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
      path,
      searchParams,
    };
  }
}