const PARAMETER = Symbol('parameter');
const WILDCARD = Symbol('wildcard');

class Route {
  constructor({
    parent,
    key,
    routeType,
    nodeType = 'leaf',
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

  addChild(route) {
    let routeKey = route.key;
    if (route.routeType === 'parameter') {
      routeKey = PARAMETER;
    } else if (route.routeType === 'wildcard') {
      routeKey = WILDCARD;
    }
    this.children.set(routeKey, route);
  }
}

export class Router {

  static parameterTypes = {
    ':': 'parameter',
    '*': 'wildcard',
  }

  constructor() {
    this.#initRouterTree();
  }

  #initRouterTree() {
    const rootRouter = new Route({
      parent: null,
      key: '/',
      nodeType: 'root',
      routeType: 'part',
    });
    this.routerTree = rootRouter;
  }

  static normalizePath(path) {
    let normalizedPath = path;
    if (path.endsWith('/')) {
      normalizedPath = path.slice(0, -1);
    }
    if (!path.startsWith('/')) {
      normalizedPath = '/' + path;
    }
    return normalizedPath;
  }

  static getRouteKeys(path) {
    const normalizedPath = Router.normalizePath(path);
    const keys = normalizedPath.split('/').toSpliced(0, 1);
    return keys;
  }

  static getRouteType(key) {
    const firstChar = key.charAt(0);
    if (!Object.keys(Router.parameterTypes).includes(firstChar)) return 'part';
    return Router.parameterTypes[firstChar];
  }

  static getRouteParameter(key, routeType) {
    return routeType === 'parameter' ? key.slice(1) : undefined;
  }

  addRoute(path, payload) {
    const keys = Router.getRouteKeys(path);
    let currentNode = this.routerTree;
    for (const key of keys) {
      let childNode = currentNode.children.get(key);
      const routeType = Router.getRouteType(key);
      const parameter = Router.getRouteParameter(key, routeType);

      if (!childNode) {
        childNode = new Route({
          parent: currentNode,
          key,
          routeType,
          nodeType: 'branch',
          parameter,
        });
        currentNode.addChild(childNode);
      }
      currentNode = childNode;
    }
    currentNode.payload = payload;
    currentNode.nodeType = 'leaf';
  }

  getRoute(path) {
    const keys = Router.getRouteKeys(path);
    let currentNode = this.routerTree;
    const positionalParameters = [];
    const keyParameters = new Map();
    let wildcardFallback = null;
    for (const key of keys) {
      let childNode = currentNode.children.get(key);
      const wildcardNode = currentNode.children.get(WILDCARD);
      wildcardFallback = wildcardNode ?? wildcardFallback;
      if (!childNode) {
        childNode = currentNode.children.get(PARAMETER);
      }
      if (!childNode) {
        childNode = wildcardNode;
      }
      if (childNode && childNode.routeType === 'wildcard') {
        currentNode = childNode;
        break;
      }
      if (!childNode) {
        currentNode = null;
        break;
      }
      currentNode = childNode;
      if (currentNode.routeType === 'parameter') {
        const currentParameter = { parameter: currentNode.parameter, value: key };
        positionalParameters.push(currentParameter);
        keyParameters.set(currentParameter.parameter, currentParameter.value);
      }
    }

    if (!currentNode && wildcardFallback) {
      currentNode = wildcardFallback;
    }

    if (!currentNode || currentNode.nodeType !== 'leaf') {
      return null;
    }

    const response = {
      payload: currentNode.payload,
      positionalParameters,
      keyParameters,
      routeType: currentNode.routeType,
      nodeType: currentNode.nodeType,
      path
    };
    return response;
  }
}