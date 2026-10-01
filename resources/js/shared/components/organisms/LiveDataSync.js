"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveDataSync = void 0;
exports.useLiveDataSync = useLiveDataSync;
var react_1 = require("react");
var react_2 = require("@chakra-ui/react");
var websocket_1 = require("@/shared/utils/websocket");
var hooks_1 = require("@/shared/hooks");
exports.LiveDataSync = (0, react_1.memo)((0, react_1.forwardRef)(function (_a, ref) {
    var tenantId = _a.tenantId, _b = _a.entities, entities = _b === void 0 ? [] : _b, onDataChange = _a.onDataChange, onConflict = _a.onConflict, _c = _a.autoResolveConflicts, autoResolveConflicts = _c === void 0 ? true : _c, _d = _a.syncInterval, syncInterval = _d === void 0 ? 30000 : _d, className = _a.className;
    var _e = (0, react_1.useState)({
        status: 'idle',
        lastSync: null,
        pendingChanges: 0,
        conflictCount: 0,
        progress: 0,
    }), syncStatus = _e[0], setSyncStatus = _e[1];
    var _f = (0, react_1.useState)([]), pendingChanges = _f[0], setPendingChanges = _f[1];
    var _g = (0, react_1.useState)([]), conflicts = _g[0], setConflicts = _g[1];
    var syncIntervalRef = (0, react_1.useRef)(null);
    // Memoized color values
    var successColor = (0, react_2.useColorModeValue)('green.500', 'green.400');
    var errorColor = (0, react_2.useColorModeValue)('red.500', 'red.400');
    var warningColor = (0, react_2.useColorModeValue)('orange.500', 'orange.400');
    // WebSocket connection
    var _h = (0, websocket_1.useFinancialWebSocket)(tenantId), wsStatus = _h.status, connect = _h.connect, subscribe = _h.subscribe, send = _h.send;
    // Connect on mount
    (0, react_1.useEffect)(function () {
        connect();
    }, [connect]);
    // Update sync status based on WebSocket status
    (0, react_1.useEffect)(function () {
        if (wsStatus.connected) {
            setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { status: prev.status === 'offline' ? 'idle' : prev.status })); });
        }
        else {
            setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { status: 'offline' })); });
        }
    }, [wsStatus.connected]);
    // Subscribe to data changes for each entity
    (0, react_1.useEffect)(function () {
        var unsubscribers = [];
        entities.forEach(function (entity) {
            var unsubscribe = subscribe("".concat(entity, ".changed"), function (message) {
                var change = {
                    id: message.id || "change-".concat(Date.now()),
                    type: message.payload.type,
                    entity: message.payload.entity,
                    entityId: message.payload.entityId,
                    data: message.payload.data,
                    timestamp: new Date(message.timestamp),
                    userId: message.payload.userId,
                    version: message.payload.version,
                };
                handleRemoteChange(change);
            });
            unsubscribers.push(unsubscribe);
        });
        return function () {
            unsubscribers.forEach(function (unsubscribe) { return unsubscribe(); });
        };
    }, [entities, subscribe]);
    // Set up sync interval
    (0, react_1.useEffect)(function () {
        if (syncInterval > 0) {
            syncIntervalRef.current = setInterval(function () {
                if (wsStatus.connected && pendingChanges.length > 0) {
                    syncPendingChanges();
                }
            }, syncInterval);
            return function () {
                if (syncIntervalRef.current) {
                    clearInterval(syncIntervalRef.current);
                }
            };
        }
    }, [syncInterval, wsStatus.connected, pendingChanges.length]);
    // Handle remote data changes
    var handleRemoteChange = (0, hooks_1.useMemoizedCallback)(function (remoteChange) {
        // Check for conflicts with pending local changes
        var conflictingChange = pendingChanges.find(function (local) { return local.entity === remoteChange.entity &&
            local.entityId === remoteChange.entityId; });
        if (conflictingChange) {
            handleConflict(conflictingChange, remoteChange);
        }
        else {
            // No conflict, apply the change
            if (onDataChange) {
                onDataChange(remoteChange);
            }
        }
    }, [pendingChanges, onDataChange]);
    // Handle conflicts between local and remote changes
    var handleConflict = (0, hooks_1.useMemoizedCallback)(function (localChange, remoteChange) {
        if (autoResolveConflicts && onConflict) {
            var resolution = onConflict(localChange, remoteChange);
            resolveConflict(localChange, remoteChange, resolution);
        }
        else {
            // Add to conflicts list for manual resolution
            setConflicts(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ local: localChange, remote: remoteChange }], false); });
            setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { conflictCount: prev.conflictCount + 1 })); });
        }
    }, [autoResolveConflicts, onConflict]);
    // Resolve a conflict
    var resolveConflict = (0, hooks_1.useMemoizedCallback)(function (localChange, remoteChange, resolution) {
        switch (resolution.resolution) {
            case 'accept':
                // Accept remote change, discard local
                setPendingChanges(function (prev) { return prev.filter(function (c) { return c.id !== localChange.id; }); });
                if (onDataChange) {
                    onDataChange(remoteChange);
                }
                break;
            case 'reject':
                // Keep local change, ignore remote
                // Local change will be synced on next sync cycle
                break;
            case 'merge': {
                // Create merged change
                var mergedChange_1 = __assign(__assign({}, localChange), { data: resolution.mergedData || __assign(__assign({}, remoteChange.data), localChange.data), timestamp: new Date() });
                setPendingChanges(function (prev) {
                    return prev.map(function (c) { return c.id === localChange.id ? mergedChange_1 : c; });
                });
                break;
            }
        }
        // Remove from conflicts
        setConflicts(function (prev) {
            return prev.filter(function (c) { return c.local.id !== localChange.id; });
        });
        setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { conflictCount: Math.max(0, prev.conflictCount - 1) })); });
    }, [onDataChange]);
    // Add a local change to the sync queue
    var internalQueueChange = (0, hooks_1.useMemoizedCallback)(function (change) {
        var fullChange = __assign(__assign({}, change), { id: "local-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)), timestamp: new Date() });
        setPendingChanges(function (prev) { return __spreadArray(__spreadArray([], prev, true), [fullChange], false); });
        setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { pendingChanges: prev.pendingChanges + 1 })); });
        // Try to sync immediately if connected
        if (wsStatus.connected) {
            syncChange(fullChange).catch(function (error) {
                console.error('Failed to sync change:', error);
            });
        }
    }, [wsStatus.connected]);
    // Expose queueChange via ref for external access
    (0, react_1.useImperativeHandle)(ref, function () { return ({
        queueChange: internalQueueChange
    }); }, [internalQueueChange]);
    // Sync a single change
    var syncChange = (0, hooks_1.useMemoizedCallback)(function (change) { return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                send('data.sync', {
                    change: change,
                    tenantId: tenantId,
                });
                // Remove from pending changes on successful sync
                setPendingChanges(function (prev) { return prev.filter(function (c) { return c.id !== change.id; }); });
                setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { pendingChanges: Math.max(0, prev.pendingChanges - 1), lastSync: new Date() })); });
            }
            catch (error) {
                console.error('Failed to sync change:', error);
                setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { status: 'error' })); });
            }
            return [2 /*return*/];
        });
    }); }, [send, tenantId]);
    // Sync all pending changes
    var syncPendingChanges = (0, hooks_1.useMemoizedCallback)(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _loop_1, i, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (pendingChanges.length === 0)
                        return [2 /*return*/];
                    setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { status: 'syncing', progress: 0 })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 6, , 7]);
                    _loop_1 = function (i) {
                        var change;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    change = pendingChanges[i];
                                    return [4 /*yield*/, syncChange(change)];
                                case 1:
                                    _b.sent();
                                    setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { progress: ((i + 1) / pendingChanges.length) * 100 })); });
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _a.label = 2;
                case 2:
                    if (!(i < pendingChanges.length)) return [3 /*break*/, 5];
                    return [5 /*yield**/, _loop_1(i)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 2];
                case 5:
                    setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { status: 'idle', progress: 100 })); });
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _a.sent();
                    setSyncStatus(function (prev) { return (__assign(__assign({}, prev), { status: 'error', progress: 0 })); });
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    }); }, [pendingChanges, syncChange]);
    // Memoized status indicator
    var statusIndicator = (0, react_1.useMemo)(function () {
        var getStatusColor = function () {
            switch (syncStatus.status) {
                case 'syncing': return 'blue.500';
                case 'error': return errorColor;
                case 'offline': return warningColor;
                default: return successColor;
            }
        };
        var getStatusText = function () {
            switch (syncStatus.status) {
                case 'syncing': return 'Syncing...';
                case 'error': return 'Sync Error';
                case 'offline': return 'Offline';
                default: return 'Synced';
            }
        };
        return (<react_2.HStack spacing={2} align="center">
            {syncStatus.status === 'syncing' ? (<react_2.Spinner size="xs" color="blue.500"/>) : (<react_2.Box w={2} h={2} borderRadius="full" bg={getStatusColor()}/>)}

            <react_2.Text fontSize="xs" color={getStatusColor()} fontWeight="medium">
              {getStatusText()}
            </react_2.Text>

            {syncStatus.pendingChanges > 0 && (<react_2.Badge size="sm" colorScheme="orange">
                {syncStatus.pendingChanges} pending
              </react_2.Badge>)}

            {syncStatus.conflictCount > 0 && (<react_2.Badge size="sm" colorScheme="red">
                {syncStatus.conflictCount} conflicts
              </react_2.Badge>)}
          </react_2.HStack>);
    }, [syncStatus, successColor, errorColor, warningColor]);
    // Memoized sync progress
    var syncProgress = (0, react_1.useMemo)(function () {
        if (syncStatus.status !== 'syncing' || syncStatus.progress === 0) {
            return null;
        }
        return (<react_2.Box w="full">
            <react_2.Progress value={syncStatus.progress} size="xs" colorScheme="blue" borderRadius="full"/>
          </react_2.Box>);
    }, [syncStatus.status, syncStatus.progress]);
    // Memoized conflict alerts
    var conflictAlerts = (0, react_1.useMemo)(function () {
        if (conflicts.length === 0)
            return null;
        return (<react_2.VStack spacing={2} align="stretch">
            {conflicts.slice(0, 3).map(function (conflict, _index) { return (<react_2.Alert key={"".concat(conflict.local.id, "-").concat(conflict.remote.id)} status="warning" size="sm">
                <react_2.AlertIcon />
                <react_2.Text fontSize="xs">
                  Conflict in {conflict.local.entity} #{conflict.local.entityId}
                </react_2.Text>
              </react_2.Alert>); })}

            {conflicts.length > 3 && (<react_2.Text fontSize="xs" color="gray.500" textAlign="center">
                +{conflicts.length - 3} more conflicts
              </react_2.Text>)}
          </react_2.VStack>);
    }, [conflicts]);
    return (<react_2.Box className={className}>
          <react_2.VStack spacing={2} align="stretch">
            {/* Status Indicator */}
            {statusIndicator}

            {/* Sync Progress */}
            {syncProgress}

            {/* Conflict Alerts */}
            {conflictAlerts}

            {/* Last Sync Time */}
            {syncStatus.lastSync && (<react_2.Text fontSize="xs" color="gray.500">
                Last synced: {syncStatus.lastSync.toLocaleTimeString()}
              </react_2.Text>)}
          </react_2.VStack>
        </react_2.Box>);
}));
exports.LiveDataSync.displayName = 'LiveDataSync';
/**
 * Hook for using live data synchronization
 */
function useLiveDataSync(options) {
    var SyncComponent = (0, react_1.useMemo)(function () {
        return react_1.default.forwardRef(function (props, ref) {
            return (<exports.LiveDataSync {...options} {...props} ref={ref}/>);
        });
    }, [options]);
    return {
        SyncComponent: SyncComponent,
    };
}
exports.default = exports.LiveDataSync;
