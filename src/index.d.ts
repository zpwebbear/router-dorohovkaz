type RouteType = 'parameter' | 'part' | 'wildcard';
type NodeType = 'root' | 'leaf';

interface Route {
  key: string;
  routeType: RouteType;
  nodeType: NodeType;
  children: Route[];
  parent: Route | null;
}