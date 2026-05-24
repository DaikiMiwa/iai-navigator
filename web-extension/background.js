"use strict";
((global) => {
    function chooseNeighborTabId(tabs, activeTabId, direction) {
        const orderedTabs = tabs
            .filter((tab) => Number.isFinite(tab.id))
            .sort((a, b) => a.index - b.index);
        const activeIndex = orderedTabs.findIndex((tab) => tab.id === activeTabId);
        if (activeIndex < 0) {
            return null;
        }
        const offset = direction === "previous" ? -1 : 1;
        return orderedTabs[activeIndex + offset]?.id ?? null;
    }
    global.SafariKeyboardNavigationTabs = {
        chooseNeighborTabId,
    };
    const api = global.browser;
    if (!api?.runtime?.onMessage || !api.tabs) {
        return;
    }
    api.runtime.onMessage.addListener((message) => {
        if (!isTabSwitchMessage(message)) {
            return undefined;
        }
        return switchNeighborTab(api, message.direction);
    });
    async function switchNeighborTab(api, direction) {
        if (!api.tabs) {
            return;
        }
        const activeTabs = await api.tabs.query({
            active: true,
            currentWindow: true,
        });
        const activeTabId = activeTabs[0]?.id;
        if (typeof activeTabId !== "number") {
            return;
        }
        const tabs = await api.tabs.query({ currentWindow: true });
        const nextTabId = chooseNeighborTabId(tabs, activeTabId, direction);
        if (nextTabId === null) {
            return;
        }
        await api.tabs.update(nextTabId, { active: true });
    }
    function isTabSwitchMessage(message) {
        if (!message || typeof message !== "object") {
            return false;
        }
        const candidate = message;
        return (candidate.type === "switch-tab" &&
            (candidate.direction === "previous" || candidate.direction === "next"));
    }
})(globalThis);
