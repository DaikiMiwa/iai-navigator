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
    function isSupportedNewTabUrl(url) {
        try {
            const parsedUrl = new URL(url);
            return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
        }
        catch {
            return false;
        }
    }
    function tabSwitchDirectionForCommand(command) {
        switch (command) {
            case "switch-tab-previous":
                return "previous";
            case "switch-tab-next":
                return "next";
            default:
                return null;
        }
    }
    global.SafariKeyboardNavigationTabs = {
        chooseNeighborTabId,
        isSupportedNewTabUrl,
        tabSwitchDirectionForCommand,
    };
    const api = global.browser;
    if (!api?.tabs) {
        return;
    }
    if (api.runtime?.onMessage) {
        api.runtime.onMessage.addListener((message) => {
            if (isTabSwitchMessage(message)) {
                return switchNeighborTab(api, message.direction);
            }
            if (isOpenTabMessage(message)) {
                return openTab(api, message);
            }
            return undefined;
        });
    }
    api.commands?.onCommand.addListener((command) => {
        const direction = tabSwitchDirectionForCommand(command);
        if (!direction) {
            return undefined;
        }
        return switchNeighborTab(api, direction);
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
    async function openTab(api, message) {
        if (!api.tabs || !isSupportedNewTabUrl(message.url)) {
            return;
        }
        await api.tabs.create({
            url: message.url,
            active: message.active,
        });
    }
    function isTabSwitchMessage(message) {
        if (!message || typeof message !== "object") {
            return false;
        }
        const candidate = message;
        return (candidate.type === "switch-tab" &&
            (candidate.direction === "previous" || candidate.direction === "next"));
    }
    function isOpenTabMessage(message) {
        if (!message || typeof message !== "object") {
            return false;
        }
        const candidate = message;
        return (candidate.type === "open-tab" &&
            typeof candidate.url === "string" &&
            candidate.active === true);
    }
})(globalThis);
