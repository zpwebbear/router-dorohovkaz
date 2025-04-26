import _toConsumableArray from '@babel/runtime/helpers/toConsumableArray';
import _defineProperty from '@babel/runtime/helpers/defineProperty';
import _classCallCheck from '@babel/runtime/helpers/classCallCheck';
import _createClass from '@babel/runtime/helpers/createClass';

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: true } : { done: false, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = true, u = false; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = true, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classPrivateMethodInitSpec(e, a) { _checkPrivateRedeclaration(e, a), a.add(e); }
function _checkPrivateRedeclaration(e, t) { if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object"); }
function _assertClassBrand(e, t, n) { if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n; throw new TypeError("Private element is not present on this object"); }
var Route = /*#__PURE__*/function () {
  function Route(_ref) {
    var parent = _ref.parent,
      key = _ref.key,
      routeType = _ref.routeType,
      _ref$nodeType = _ref.nodeType,
      nodeType = _ref$nodeType === void 0 ? 'leaf' : _ref$nodeType,
      _ref$payload = _ref.payload,
      payload = _ref$payload === void 0 ? null : _ref$payload,
      _ref$parameter = _ref.parameter,
      parameter = _ref$parameter === void 0 ? undefined : _ref$parameter,
      _ref$children = _ref.children,
      children = _ref$children === void 0 ? new Map() : _ref$children;
    _classCallCheck(this, Route);
    this.parent = parent;
    this.key = key;
    this.routeType = routeType;
    this.nodeType = nodeType;
    this.payload = payload;
    this.children = children;
    this.parameter = parameter;
  }
  return _createClass(Route, [{
    key: "addChild",
    value: function addChild(route) {
      this.children.set(route.key, route);
    }
  }]);
}();
var _Router_brand = /*#__PURE__*/new WeakSet();
var Router = /*#__PURE__*/function () {
  function Router() {
    _classCallCheck(this, Router);
    _classPrivateMethodInitSpec(this, _Router_brand);
    _assertClassBrand(_Router_brand, this, _initRouterTree).call(this);
  }
  return _createClass(Router, [{
    key: "addRoute",
    value: function addRoute(path, payload) {
      var normalizedPath = Router.normalizePath(path);
      var keys = normalizedPath.split('/').toSpliced(0, 1);
      var currentNode = this.routerTree;
      var _iterator = _createForOfIteratorHelper(keys),
        _step;
      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var key = _step.value;
          var childNode = currentNode.children.get(key);
          var routeType = Router.parameterTypes[''];
          if (key.startsWith(':')) {
            routeType = Router.parameterTypes[':'];
          } else if (key.startsWith('*')) {
            routeType = Router.parameterTypes['*'];
          }
          if (!childNode) {
            childNode = new Route({
              parent: currentNode,
              key: key,
              routeType: routeType,
              nodeType: 'branch',
              parameter: routeType === 'parameter' ? key.slice(1) : undefined
            });
            currentNode.addChild(childNode);
          }
          currentNode = childNode;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
      currentNode.payload = payload;
      currentNode.nodeType = 'leaf';
    }
  }, {
    key: "getRoute",
    value: function getRoute(path) {
      var normalizedPath = Router.normalizePath(path);
      var keys = normalizedPath.split('/').toSpliced(0, 1);
      var currentNode = this.routerTree;
      var positionalParameters = [];
      var keyParameters = new Map();
      var _iterator2 = _createForOfIteratorHelper(keys),
        _step2;
      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var key = _step2.value;
          var childNode = currentNode.children.get(key);
          if (!childNode) {
            childNode = _toConsumableArray(currentNode.children.values()).find(function (child) {
              return child.routeType === 'parameter';
            });
          }
          if (!childNode) {
            childNode = _toConsumableArray(currentNode.children.values()).find(function (child) {
              return child.routeType === 'wildcard';
            });
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
            var currentParameter = {
              parameter: currentNode.parameter,
              value: key
            };
            positionalParameters.push(currentParameter);
            keyParameters.set(currentParameter.parameter, currentParameter.value);
          }
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
      if (!currentNode) {
        return null;
      }
      if (currentNode.nodeType !== 'leaf') {
        return null;
      }
      var response = {
        payload: currentNode.payload,
        positionalParameters: positionalParameters,
        keyParameters: keyParameters,
        routeType: currentNode.routeType,
        nodeType: currentNode.nodeType
      };
      return response;
    }
  }], [{
    key: "normalizePath",
    value: function normalizePath(path) {
      var normalizedPath = path;
      if (path.endsWith('/')) {
        normalizedPath = path.slice(0, -1);
      }
      if (!path.startsWith('/')) {
        normalizedPath = '/' + path;
      }
      return normalizedPath;
    }
  }]);
}();
function _initRouterTree() {
  var rootRouter = new Route({
    parent: null,
    key: '/',
    nodeType: 'root',
    routeType: 'part'
  });
  this.routerTree = rootRouter;
}
_defineProperty(Router, "parameterTypes", {
  ':': 'parameter',
  '*': 'wildcard',
  '': 'part'
});

export { Router };
