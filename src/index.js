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
    this.children.set(route.key, route);
  }
}

export class Router {

  static parameterTypes = {
    ':': 'parameter',
    '*': 'wildcard',
    '': 'part',
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

  addRoute(path, payload) {
    const normalizedPath = Router.normalizePath(path);
    const keys = normalizedPath.split('/').toSpliced(0, 1)
    let currentNode = this.routerTree;
    for (const key of keys) {
      let childNode = currentNode.children.get(key);

      let routeType = Router.parameterTypes[''];
      if (key.startsWith(':')) {
        routeType = Router.parameterTypes[':'];
      } else if (key.startsWith('*')) {
        routeType = Router.parameterTypes['*'];
      }

      if (!childNode) {
        childNode = new Route({
          parent: currentNode,
          key,
          routeType,
          nodeType: 'branch',
          parameter: routeType === 'parameter' ? key.slice(1) : undefined,
        });
        currentNode.addChild(childNode);
      }
      currentNode = childNode;
    }
    currentNode.payload = payload;
    currentNode.nodeType = 'leaf';
  }

  getRoute(path) {
    const normalizedPath = Router.normalizePath(path);
    const keys = normalizedPath.split('/').toSpliced(0, 1);
    let currentNode = this.routerTree;
    const positionalParameters = [];
    const keyParameters = new Map();
    let wildcardFallback = null;
    for (const key of keys) {
      let childNode = currentNode.children.get(key);
      const currentRouteChildren = [...currentNode.children.values()];
      const wildcardNode = currentRouteChildren.find(child => child.routeType === 'wildcard');
      wildcardFallback = wildcardNode ?? wildcardFallback;
      if (!childNode) {
        childNode = currentRouteChildren.find(child => child.routeType === 'parameter');
      }
      if (!childNode) {
        childNode = wildcardNode
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
    };
    return response;
  }
}