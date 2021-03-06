import ToolbarMenu from '../toolbar';
import ContextMenu from '../context_menu';
import { extend } from '../../core/utils/extend';

const TOOLBAR_SEPARATOR_CLASS = 'dx-gantt-toolbar-separator';

const COMMANDS = {
    createTask: 0,
    createSubTask: 1,
    removeTask: 2,
    removeDependency: 3,
    taskInformation: 4,
    taskAddContextItem: 5,
    undo: 6,
    redo: 7,
    zoomIn: 8,
    zoomOut: 9,
    fullScreen: 10,
    collapseAll: 11,
    expandAll: 12
};

class Bar {
    constructor(element, owner) {
        this._element = element;
        this._owner = owner;
        this._createControl();
    }

    _getItemsCache() {
        if(!this._cache) {
            this._cache = {};
            this._fillCache(this._items);
        }
        return this._cache;
    }
    _fillCache(items) {
        items.forEach(item => {
            const key = item.commandId;
            if(key !== undefined) {
                if(!this._cache[key]) {
                    this._cache[key] = [];
                }
                this._cache[key].push(item);
            }
            if(item.items) {
                this._fillCache(item.items);
            }
        });
    }

    // IBar
    getCommandKeys() {
        const itemsCache = this._getItemsCache();
        const result = [];
        for(const itemKey in itemsCache) {
            result.push(parseInt(itemKey));
        }
        return result;
    }
    setItemEnabled(key, enabled) {
        const itemsCache = this._getItemsCache();
        itemsCache[key].forEach(item => {
            item.disabled = !enabled;
        });
    }
    setItemVisible(key, visible) {
        const itemsCache = this._getItemsCache();
        itemsCache[key].forEach(item => {
            item.visible = visible;
        });
    }
    setItemValue(_key, _value) { }
    setEnabled(enabled) {
        this._menu.option('disabled', !enabled);
    }
    updateItemsList() {}
    isVisible() {
        return true;
    }
    isContextMenu() {
        return false;
    }
    completeUpdate() {}
}

export class GanttToolbar extends Bar {
    _createControl() {
        this._menu = this._owner._createComponent(this._element, ToolbarMenu, {
            onItemClick: (e) => {
                const commandId = e.itemData.commandId;
                if(commandId !== undefined) {
                    this._owner._executeCoreCommand(e.itemData.commandId);
                }
            }
        });
    }
    createItems(items) {
        this._cache = null;
        this._items = items.map(item => {
            if(typeof item === 'string') {
                switch(item.toLowerCase()) {
                    case 'separator': return this._createSeparator();
                    case 'undo': return this._createDefaultItem(COMMANDS.undo, 'undo');
                    case 'redo': return this._createDefaultItem(COMMANDS.redo, 'redo');
                    case 'zoomin': return this._createDefaultItem(COMMANDS.zoomIn, 'plus');
                    case 'zoomout': return this._createDefaultItem(COMMANDS.zoomOut, 'minus');
                    default: return extend(this._getDefaultItemOptions(), { options: { text: item } });
                }
            } else {
                return extend(this._getDefaultItemOptions(), item);
            }
        });
        this._menu.option('items', this._items);
    }
    _createSeparator() {
        return {
            location: 'before',
            template: (_data, _index, element) => element.addClass(TOOLBAR_SEPARATOR_CLASS)
        };
    }
    _createDefaultItem(commandId, icon) {
        return extend(this._getDefaultItemOptions(), {
            commandId: commandId,
            disabled: true,
            options: {
                icon: icon,
                stylingMode: 'text'
            }
        });
    }
    _getDefaultItemOptions() {
        return {
            location: 'before',
            widget: 'dxButton'
        };
    }

    // IBar
    completeUpdate() {
        this._menu.option('items', this._items);
    }
}

export class GanttContextMenuBar extends Bar {
    _createControl() {
        this._createItems();

        this._menu = this._owner._createComponent(this._element, ContextMenu, {
            showEvent: undefined,
            items: this._items,
            onItemClick: (e) => {
                const commandId = e.itemData.commandId;
                if(commandId !== undefined) {
                    this._owner._executeCoreCommand(e.itemData.commandId);
                }
            }
        });
    }
    _createItems() {
        this._items = [
            { text: 'Add',
                commandId: COMMANDS.taskAddContextItem,
                items: [
                    { text: 'New Task', commandId: COMMANDS.createTask },
                    { text: 'New Subtask', commandId: COMMANDS.createSubTask }
                ]
            },
            { text: 'Task Details...', commandId: COMMANDS.taskInformation },
            { text: 'Remove Task', commandId: COMMANDS.removeTask },
            { text: 'Remove Dependency', commandId: COMMANDS.removeDependency },
        ];
    }
    show(point) {
        this._menu.option('items', this._items);
        this._menu.option('position.offset', { x: point.x, y: point.y });
        this._menu.show();
    }

    // IBar
    isContextMenu() {
        return true;
    }
}
