declare interface RouteParameter {
  parameter: string;
  value: string;
}

declare interface RouteResult {
  payload: any;
  positionalParameters: RouteParameter[];
  keyParameters: Map<string, string>;
  routeType: 'part' | 'parameter' | 'wildcard';
  nodeType: 'root' | 'branch' | 'leaf';
}

export declare class Router {
  constructor();
  static normalizePath(path: string): string;
  addRoute(path: string, payload: any): void;
  getRoute(path: string): RouteResult | null;
}