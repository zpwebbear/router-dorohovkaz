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
    for (const key of keys) {
      let childNode = currentNode.children.get(key);
      if (!childNode) {
        childNode = [...currentNode.children.values()].find(child => child.routeType === 'parameter');
      }
      if (!childNode) {
        childNode = [...currentNode.children.values()].find(child => child.routeType === 'wildcard');
      }
      if (childNode && childNode.routeType === 'wildcard') {
        currentNode = childNode;
        break;
      }
      if (!childNode) {
        return null;
      }
      currentNode = childNode;
      if (currentNode.routeType === 'parameter') {
        const currentParameter = { parameter: currentNode.parameter, value: key };
        positionalParameters.push(currentParameter);
        keyParameters.set(currentParameter.parameter, currentParameter.value);
      }
    }

    if (!currentNode) {
      return null;
    }

    if (currentNode.nodeType !== 'leaf') {
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